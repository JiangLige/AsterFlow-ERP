import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';

type Customer = {
    id: number;
    customerCode: string;
    name: string;
    contactName: string;
    phone: string;
    address: string;
    status: string;
};

export default function CustomerEditPage() {
    const router = useRouter();
    const { id } = router.query;

    const [form, setForm] = useState({
        customerCode: '',
        name: '',
        contactName: '',
        phone: '',
        address: '',
        status: 'ACTIVE',
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id || Array.isArray(id)) {
            return;
        }

        async function loadCustomer() {
            setLoading(true);
            setError('');

            try {
                const customer = await apiRequest<Customer>(`/api/customers/${id}`);

                setForm({
                    customerCode: customer.customerCode,
                    name: customer.name,
                    contactName: customer.contactName || '',
                    phone: customer.phone || '',
                    address: customer.address || '',
                    status: customer.status || 'ACTIVE',
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : '客户加载失败');
            } finally {
                setLoading(false);
            }
        }

        loadCustomer();
    }, [id]);

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

        if (!id || Array.isArray(id)) {
            return;
        }

        setSaving(true);
        setError('');

        try {
            await apiRequest(`/api/customers/${id}`, {
                method: 'PUT',
                body: JSON.stringify(form),
            });

            router.push('/customers');
        } catch (err) {
            setError(err instanceof Error ? err.message : '保存客户失败');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Layout>
            <h1>编辑客户</h1>

            {loading && <div className="empty-state">加载中...</div>}
            {error && <div className="alert alert-danger">{error}</div>}

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

                <button type="submit" disabled={saving}>
                    {saving ? '保存中...' : '保存'}
                </button>
            </form>
        </Layout>
    );
}
