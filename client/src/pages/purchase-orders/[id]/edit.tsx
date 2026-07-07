import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import { apiRequest } from '@/lib/api';

type PurchaseItemForm = {
    productId: string;
    quantity: string;
    price: string;
};

type PurchaseOrderItem = {
    id: number;
    productId: number;
    productCode: string;
    productName: string;
    quantity: number;
    price: number;
    amount: number;
};

type PurchaseOrder = {
    id: number;
    orderNo: string;
    supplierId: number;
    supplierName: string;
    totalAmount: number;
    status: string;
    remark: string;
    items: PurchaseOrderItem[];
};

type PageResponse<T> = {
    records: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
};

type Supplier = {
    id: number;
    supplierCode: string;
    name: string;
    status: string;
};

type Product = {
    id: number;
    productCode: string;
    name: string;
    cost: number;
    stock: number;
    status: string;
};

export default function PurchaseOrderEditPage() {
    const router = useRouter();
    const purchaseOrderId = typeof router.query.id === 'string' ? router.query.id : '';

    const [orderNo, setOrderNo] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [remark, setRemark] = useState('');
    const [status, setStatus] = useState('');
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [items, setItems] = useState<PurchaseItemForm[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!router.isReady || !purchaseOrderId) {
            return;
        }

        async function loadData() {
            setLoading(true);
            setError('');

            try {
                const [order, supplierData, productData] = await Promise.all([
                    apiRequest<PurchaseOrder>(`/api/purchase-orders/${purchaseOrderId}`),
                    apiRequest<PageResponse<Supplier>>('/api/suppliers?page=1&size=100&status=ACTIVE'),
                    apiRequest<PageResponse<Product>>('/api/products?page=1&size=100&status=ACTIVE'),
                ]);

                setOrderNo(order.orderNo);
                setSupplierId(String(order.supplierId));
                setRemark(order.remark || '');
                setStatus(order.status);
                setSuppliers(supplierData.records);
                setProducts(productData.records);
                setItems(
                    order.items.map((item) => ({
                        productId: String(item.productId),
                        quantity: String(item.quantity),
                        price: String(item.price),
                    }))
                );
            } catch (err) {
                setError(err instanceof Error ? err.message : '加载采购单失败');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [router.isReady, purchaseOrderId]);

    function addItem() {
        setItems([...items, { productId: '', quantity: '', price: '' }]);
    }

    function removeItem(index: number) {
        if (items.length === 1) {
            return;
        }

        setItems(items.filter((_, i) => i !== index));
    }

    function updateProduct(index: number, productId: string) {
        const selectedProduct = products.find((product) => String(product.id) === productId);
        const nextItems = [...items];

        nextItems[index] = {
            ...nextItems[index],
            productId,
            price: selectedProduct ? String(selectedProduct.cost) : nextItems[index].price,
        };

        setItems(nextItems);
    }

    function updateItem(index: number, field: keyof PurchaseItemForm, value: string) {
        const nextItems = [...items];

        nextItems[index] = {
            ...nextItems[index],
            [field]: value,
        };

        setItems(nextItems);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (status !== 'DRAFT') {
            setError('只有草稿采购单可以修改');
            return;
        }

        if (!supplierId || Number(supplierId) <= 0) {
            setError('请选择供应商');
            return;
        }

        const normalizedItems = items.map((item) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
        }));

        const invalidItem = normalizedItems.some(
            (item) =>
                !item.productId ||
                item.productId <= 0 ||
                !item.quantity ||
                !Number.isInteger(item.quantity) ||
                item.quantity <= 0 ||
                !item.price ||
                item.price <= 0
        );

        if (invalidItem) {
            setError('商品、数量、采购价都必须填写；数量必须是正整数，采购价必须大于0');
            return;
        }

        try {
            await apiRequest(`/api/purchase-orders/${purchaseOrderId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    supplierId: Number(supplierId),
                    remark,
                    items: normalizedItems,
                }),
            });

            router.push(`/purchase-orders/${purchaseOrderId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : '修改采购单失败');
        }
    }

    return (
        <Layout>
            <h1>编辑采购单</h1>

            {loading && (
                <EmptyState
                    title="正在加载采购单..."
                    description="请稍候，系统正在读取采购单、供应商和商品资料。"
                />
            )}
            <ErrorMessage message={error} />

            {status && status !== 'DRAFT' && (
                <ErrorMessage message="当前采购单不是草稿状态，不能修改" />
            )}

            <form onSubmit={handleSubmit}>
                <div>
                    <label>单号</label>
                    <input value={orderNo} disabled />
                </div>

                <div>
                    <label>供应商</label>
                    <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        required
                        disabled={status !== 'DRAFT'}
                    >
                        <option value="">请选择供应商</option>
                        {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                                {supplier.supplierCode} - {supplier.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>备注</label>
                    <input
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="请输入备注"
                        disabled={status !== 'DRAFT'}
                    />
                </div>

                <h2>采购明细</h2>

                <button type="button" onClick={addItem} disabled={status !== 'DRAFT'}>
                    添加明细
                </button>

                {items.map((item, index) => (
                    <div key={index} className="line-item-row">
                        <select
                            value={item.productId}
                            onChange={(e) => updateProduct(index, e.target.value)}
                            required
                            disabled={status !== 'DRAFT'}
                        >
                            <option value="">请选择商品</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.productCode} - {product.name} - 库存 {product.stock}
                                </option>
                            ))}
                        </select>

                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            placeholder="数量"
                            disabled={status !== 'DRAFT'}
                        />

                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateItem(index, 'price', e.target.value)}
                            placeholder="采购价"
                            disabled={status !== 'DRAFT'}
                        />

                        <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={status !== 'DRAFT' || items.length === 1}
                        >
                            删除
                        </button>
                    </div>
                ))}

                <button type="submit" disabled={status !== 'DRAFT'}>
                    保存修改
                </button>
            </form>
        </Layout>
    );
}
