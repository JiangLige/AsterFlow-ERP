import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import { apiRequest } from '@/lib/api';

type ProductForm = {
    productCode: string;
    name: string;
    category: string;
    unit: string;
    price: string;
    cost: string;
    stock: string;
    status: string;
    description: string;
};

export default function ProductEditPage() {
    const router = useRouter();
    const productId = typeof router.query.id === 'string' ? router.query.id : '';

    const [form, setForm] = useState<ProductForm>({
        productCode: '',
        name: '',
        category: '',
        unit: '',
        price: '',
        cost: '',
        stock: '',
        status: 'ACTIVE',
        description: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!router.isReady || !productId) {
            return;
        }

        async function loadProduct() {
            setLoading(true);
            setError('');

            try {
                const data = await apiRequest<any>(`/api/products/${productId}`);

                setForm({
                    productCode: data.productCode,
                    name: data.name,
                    category: data.category,
                    unit: data.unit,
                    price: String(data.price),
                    cost: String(data.cost),
                    stock: String(data.stock),
                    status: data.status,
                    description: data.description || '',
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : '加载商品失败');
            } finally {
                setLoading(false);
            }
        }

        loadProduct();
    }, [router.isReady, productId]);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        try {
            await apiRequest(`/api/products/${productId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...form,
                    price: Number(form.price),
                    cost: Number(form.cost),
                    stock: Number(form.stock),
                }),
            });

            router.push('/products');
        } catch (err) {
            setError(err instanceof Error ? err.message : '保存失败');
        }
    }

    return (
        <Layout>
            <section className="page-hero">
                <div>
                    <p className="eyebrow">商品档案</p>
                    <h1>编辑商品</h1>
                    <p className="muted">当前商品 ID：{productId || '-'}</p>
                </div>
            </section>

            {loading && (
                <EmptyState
                    title="正在加载商品信息..."
                    description="请稍候，系统正在读取商品档案。"
                />
            )}
            <ErrorMessage message={error} />

            <form onSubmit={handleSubmit}>
                <div>
                    <label>商品编码</label>
                    <input name="productCode" value={form.productCode} onChange={handleChange} />
                </div>

                <div>
                    <label>商品名称</label>
                    <input name="name" value={form.name} onChange={handleChange} />
                </div>

                <div>
                    <label>分类</label>
                    <input name="category" value={form.category} onChange={handleChange} />
                </div>

                <div>
                    <label>单位</label>
                    <input name="unit" value={form.unit} onChange={handleChange} />
                </div>

                <div>
                    <label>售价</label>
                    <input name="price" type="number" value={form.price} onChange={handleChange} />
                </div>

                <div>
                    <label>成本价</label>
                    <input name="cost" type="number" value={form.cost} onChange={handleChange} />
                </div>

                <div>
                    <label>库存</label>
                    <input name="stock" type="number" value={form.stock} onChange={handleChange} />
                </div>

                <div>
                    <label>状态</label>
                    <select name="status" value={form.status} onChange={handleChange}>
                        <option value="ACTIVE">启用</option>
                        <option value="INACTIVE">停用</option>
                    </select>
                </div>

                <div>
                    <label>描述</label>
                    <textarea name="description" value={form.description} onChange={handleChange} />
                </div>

                <button type="submit">保存修改</button>

            </form>

        </Layout>
    );
}
