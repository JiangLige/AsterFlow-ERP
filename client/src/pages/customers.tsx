import { useEffect, useState } from 'react';
import Link from 'next/link';
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

type PageResponse<T> = {
    records: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

    async function loadCustomers(targetPage = page) {
        setLoading(true);
        setError('');

        try {
            const query = new URLSearchParams();
            query.set('page', String(targetPage));
            query.set('size', '10');

            if (keyword.trim()) {
                query.set('keyword', keyword.trim());
            }

            const data = await apiRequest<PageResponse<Customer>>(`/api/customers?${query.toString()}`);

            setCustomers(data.records);
            setPage(data.page);
            setPages(data.pages);
            setTotal(data.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : '客户加载失败');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCustomers(1);
    }, []);

    return (
        <Layout>
            <h1>客户列表</h1>

            <Link href="/customers/new">
                新增客户
            </Link>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="输入客户编码/名称/电话"
                />

                <button onClick={() => loadCustomers(1)} disabled={loading}>
                    {loading ? '查询中...' : '查询'}
                </button>

                <button
                    onClick={() => loadCustomers(page - 1)}
                    disabled={loading || page <= 1}
                >
                    上一页
                </button>

                <span>
                    第 {page} / {pages} 页，共 {total} 条
                </span>

                <button
                    onClick={() => loadCustomers(page + 1)}
                    disabled={loading || page >= pages}
                >
                    下一页
                </button>
            </div>

            {error && (
                <div style={{ marginTop: '1rem', color: 'red' }}>
                    {error}
                </div>
            )}

            <table
                style={{
                    marginTop: '1rem',
                    width: '100%',
                    borderCollapse: 'collapse',
                }}
            >
                <thead>
                <tr>
                    <th>编码</th>
                    <th>名称</th>
                    <th>联系人</th>
                    <th>电话</th>
                    <th>地址</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
                </thead>
                <tbody>
                {customers.map((customer) => (
                    <tr key={customer.id}>
                        <td>{customer.customerCode}</td>
                        <td>{customer.name}</td>
                        <td>{customer.contactName}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.address}</td>
                        <td>{customer.status}</td>
                        <td>
                            <Link href={`/customers/${customer.id}/edit`}>
                                编辑
                            </Link>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </Layout>
    );
}