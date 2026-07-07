import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ErrorMessage from '@/components/ErrorMessage';
import { apiRequest } from '@/lib/api';

type SaleItemForm = {
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

type Customer = {
    id: number;
    name: string;
    customerCode: string;
    status: string;
};

type Product = {
    id: number;
    productCode: string;
    name: string;
    price: number;
    stock: number;
    status: string;
};

export default function SaleOrderCreatePage() {
    const router = useRouter();
    const [customerId, setCustomerId] = useState('');
    const [remark, setRemark] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [items, setItems] = useState<SaleItemForm[]>([
        {
            productId: '',
            quantity: '',
            price: '',
        },
    ]);

    useEffect(() => {
        async function loadOptions() {
            try {
                const customerData = await apiRequest<PageResponse<Customer>>('/api/customers?page=1&size=100&status=ACTIVE');
                const productData = await apiRequest<PageResponse<Product>>('/api/products?page=1&size=100&status=ACTIVE');

                setCustomers(customerData.records);
                setProducts(productData.records);
            } catch (err) {
                setError(err instanceof Error ? err.message : '客户或商品加载失败');
            }
        }

        loadOptions();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!customerId || Number(customerId) <= 0) {
            setError('请选择客户');
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
            setError('商品、数量、销售价都必须填写；数量必须是正整数，销售价必须大于0');
            return;
        }

        const quantityByProductId = new Map<number, number>();

        for (const item of normalizedItems) {
            quantityByProductId.set(
                item.productId,
                (quantityByProductId.get(item.productId) ?? 0) + item.quantity
            );
        }

        for (const [productId, quantity] of quantityByProductId) {
            const product = products.find((item) => item.id === productId);

            if (product && quantity > product.stock) {
                setError(`商品库存不足：${product.name}，当前库存 ${product.stock}，本次销售 ${quantity}`);
                return;
            }
        }

        setSubmitting(true);

        try {
            await apiRequest('/api/sale-orders', {
                method: 'POST',
                body: JSON.stringify({
                    customerId: Number(customerId),
                    remark,
                    items: normalizedItems,
                }),
            });

            router.push('/sale-orders');
        } catch (err) {
            setError(err instanceof Error ? err.message : '新增销售单失败');
        } finally {
            setSubmitting(false);
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

    function updateItem(index: number, field: keyof SaleItemForm, value: string) {
        const nextItems = [...items];
        nextItems[index] = {
            ...nextItems[index],
            [field]: value,
        };
        setItems(nextItems);
    }

    function updateProduct(index: number, productId: string) {
        const selectedProduct = products.find((product) => String(product.id) === productId);
        const nextItems = [...items];

        nextItems[index] = {
            ...nextItems[index],
            productId,
            price: selectedProduct ? String(selectedProduct.price) : nextItems[index].price,
        };

        setItems(nextItems);
    }



    return (
        <Layout>
            <section className="page-hero">
                <div>
                    <p className="eyebrow">销售出库</p>
                    <h1>新增销售单</h1>
                    <p className="muted">选择客户并录入销售明细，提交前会校验可用库存。</p>
                </div>
            </section>

            <ErrorMessage message={error} />

            <form onSubmit={handleSubmit}>
                <div>
                    <label>客户</label>
                    <select
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        required
                    >
                        <option value="">请选择客户</option>
                        {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                                {customer.customerCode} - {customer.name}
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

                <h2>销售明细</h2>

                <button type="button" onClick={addItem}>
                    添加明细
                </button>

                {items.map((item, index) => (
                    <div key={index} className="line-item-row">
                        <select
                            value={item.productId}
                            onChange={(e) => updateProduct(index, e.target.value)}
                            required
                        >
                            <option value="">请选择商品</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id} disabled={product.stock <= 0}>
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
                        />

                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateItem(index, 'price', e.target.value)}
                            placeholder="销售价"
                        />

                        <button type="button" onClick={() => removeItem(index)}>
                            删除
                        </button>
                    </div>
                ))}

                <button type="submit" disabled={submitting}>
                    {submitting ? '保存中...' : '保存销售单'}
                </button>
            </form>
        </Layout>
    );
}
