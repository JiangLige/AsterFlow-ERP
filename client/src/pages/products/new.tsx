import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';

export default function ProductCreatePage() {
    const router = useRouter();

    const [form, setForm] = useState({
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

    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        try {
            await apiRequest('/api/products', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    price: Number(form.price),
                    cost: Number(form.cost),
                    stock: Number(form.stock),
                }),
            });

            router.push('/products');
        } catch (err) {
            setError(err instanceof Error ? err.message : '新增失败');
        }
    }

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    return (
        <Layout>
            <h1>新增商品</h1>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                <div>
                    <label>商品编码</label>
                    <input
                        name="productCode"
                        value={form.productCode}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>商品名称</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>分类</label>
                    <input
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>单位</label>
                    <input
                        name="unit"
                        value={form.unit}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>售价</label>
                    <input
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>成本价</label>
                    <input
                        name="cost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.cost}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>库存</label>
                    <input
                        name="stock"
                        type="number"
                        min="0"
                        value={form.stock}
                        onChange={handleChange}
                        required
                    />
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
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                    />
                </div>

                <button type="submit">保存</button>
            </form>
        </Layout>
    );
}