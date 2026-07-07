import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import { apiRequest } from '@/lib/api';

type Supplier = {
    id: number;
    supplierCode: string;
    name: string;
    contactName: string;
    phone: string;
    address: string;
    status: string;
};

export default function SupplierEditPage() {
    const router = useRouter();
    const { id } = router.query;

    const [form, setForm] = useState({
        supplierCode: '',
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

        async function loadSupplier() {
            setLoading(true);
            setError('');

            try {
                const supplier = await apiRequest<Supplier>(`/api/suppliers/${id}`);

                setForm({
                    supplierCode: supplier.supplierCode,
                    name: supplier.name,
                    contactName: supplier.contactName || '',
                    phone: supplier.phone || '',
                    address: supplier.address || '',
                    status: supplier.status || 'ACTIVE',
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : '供应商加载失败');
            } finally {
                setLoading(false);
            }
        }

        loadSupplier();
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
            await apiRequest(`/api/suppliers/${id}`, {
                method: 'PUT',
                body: JSON.stringify(form),
            });

            router.push('/suppliers');
        } catch (err) {
            setError(err instanceof Error ? err.message : '保存供应商失败');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Layout>
            <section className="page-hero">
                <div>
                    <p className="eyebrow">供应网络</p>
                    <h1>编辑供应商</h1>
                    <p className="muted">维护供应商基础资料、联系人和业务状态。</p>
                </div>
            </section>

            {loading && (
                <EmptyState
                    title="正在加载供应商信息..."
                    description="请稍候，系统正在读取供应商资料。"
                />
            )}
            <ErrorMessage message={error} />

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

                <button type="submit" disabled={saving}>
                    {saving ? '保存中...' : '保存'}
                </button>
            </form>
        </Layout>
    );
}
