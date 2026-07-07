import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ErrorMessage from '@/components/ErrorMessage';
import { apiRequest } from '@/lib/api';

export default function CustomerCreatePage() {
    const router = useRouter();

    const [form, setForm] = useState({
        customerCode: '',
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
            await apiRequest('/api/customers', {
                method: 'POST',
                body: JSON.stringify(form),
            });

            router.push('/customers');
        } catch (err) {
            setError(err instanceof Error ? err.message : '新增客户失败');
        }
    }

    return (
        <Layout>
            <h1>新增客户</h1>

            <ErrorMessage message={error} />

            <form onSubmit={handleSubmit}>
                <div>
                    <label>客户编码</label>
                    <input
                        name="customerCode"
                        value={form.customerCode}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>客户名称</label>
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
