import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';

export default function SupplierCreatePage() {
    const router = useRouter();

    const [form, setForm] = useState({
        supplierCode: '',
        name: '',
        contactName: '',
        phone: '',
        address: '',
        status: 'ACTIVE',
    });

    const [error, setError] = useState('');

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        try {
            await apiRequest('/api/suppliers', {
                method: 'POST',
                body: JSON.stringify(form),
            });

            router.push('/suppliers');
        } catch (err) {
            setError(err instanceof Error ? err.message : '新增供应商失败');
        }
    }

    return (
        <Layout>
            <h1>新增供应商</h1>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div>
                    <label>供应商编码</label>
                    <input
                        name="supplierCode"
                        value={form.supplierCode}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>供应商名称</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>联系人</label>
                    <input
                        name="contactName"
                        value={form.contactName}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>电话</label>
                    <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>地址</label>
                    <input
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>状态</label>
                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                    >
                        <option value="ACTIVE">启用</option>
                        <option value="INACTIVE">停用</option>
                    </select>
                </div>

                <button type="submit">保存</button>
            </form>
        </Layout>
    );
}
