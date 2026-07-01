import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';

type PurchaseItemForm = {
    productId: string;
    quantity: string;
    price: string;
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


export default function PurchaseOrderCreatePage() {
    const router = useRouter();
    const [supplierId, setSupplierId] = useState('');
    const [remark, setRemark] = useState('');
    const [error, setError] = useState('');
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [items, setItems] = useState<PurchaseItemForm[]>([
        {
            productId: '',
            quantity: '',
            price: '',
        },
    ]);

    useEffect(() => {
        async function loadOptions() {
            try {
                const supplierData = await apiRequest<PageResponse<Supplier>>('/api/suppliers?page=1&size=100&status=ACTIVE');
                const productData = await apiRequest<PageResponse<Product>>('/api/products?page=1&size=100&status=ACTIVE');

                setSuppliers(supplierData.records);
                setProducts(productData.records);
            } catch (err) {
                setError(err instanceof Error ? err.message : '基础资料加载失败');
            }
        }

        loadOptions();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

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
                item.quantity <= 0 ||
                !item.price ||
                item.price <= 0
        );

        if (invalidItem) {
            setError('商品、数量、采购价都必须填写，并且数量和采购价必须大于0');
            return;
        }

        try {
            await apiRequest('/api/purchase-orders', {
                method: 'POST',
                body: JSON.stringify({
                    supplierId: Number(supplierId),
                    remark,
                    items: normalizedItems,
                }),
            });

            router.push('/purchase-orders');
        } catch (err) {
            setError(err instanceof Error ? err.message : '新增采购单失败');
        }
    }

    function addItem() {
        setItems([
            ...items,
            {
                productId: '',
                quantity: '',
                price: '',
            },
        ]);
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

    return (
        <Layout>
            <h1>新增采购单</h1>

            {error && <div style={{ marginTop: '1rem', color: 'red' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div>
                    <label>供应商</label>
                    <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        required
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
                    />
                </div>

                <h2>采购明细</h2>

                <button type="button" onClick={addItem}>
                    添加明细
                </button>

                {items.map((item, index) => (
                    <div key={index} style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                        <select
                            value={item.productId}
                            onChange={(e) => updateProduct(index, e.target.value)}
                        >
                            <option value="">请选择商品</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.productCode} - {product.name} - 库存 {product.stock}
                                </option>
                            ))}
                        </select>

                        <input
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            placeholder="数量"
                        />

                        <input
                            value={item.price}
                            onChange={(e) => updateItem(index, 'price', e.target.value)}
                            placeholder="采购价"
                        />

                        <button type="button" onClick={() => removeItem(index)}>
                            删除
                        </button>
                    </div>
                ))}

                <pre>
                    {JSON.stringify(
                        {
                            supplierId,
                            remark,
                            items,
                        },
                        null,
                        2
                    )}
                </pre>

                <button type="submit">保存采购单</button>
            </form>
        </Layout>
    );
}
