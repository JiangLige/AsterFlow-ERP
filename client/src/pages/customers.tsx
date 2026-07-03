import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';

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
    const [role, setRole] = useState('');

    const loadCustomers = useCallback(async (targetPage: number, currentKeyword: string) => {
        setLoading(true);
        setError('');

        try {
            const query = new URLSearchParams();
            query.set('page', String(targetPage));
            query.set('size', '10');

            if (currentKeyword.trim()) {
                query.set('keyword', currentKeyword.trim());
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
    }, []);

    async function handleDelete(id: number) {
        const ok = window.confirm('确定要删除这个客户吗？');

        if (!ok) {
            return;
        }

        setError('');

        try {
            await apiRequest(`/api/customers/${id}`, {
                method: 'DELETE',
            });

            loadCustomers(page, keyword);
        } catch (err) {
            setError(err instanceof Error ? err.message : '删除客户失败');
        }
    }

    useEffect(() => {
        setRole(localStorage.getItem('role') || '');
        loadCustomers(1, '');
    }, [loadCustomers]);

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

                <button onClick={() => loadCustomers(1, keyword)} disabled={loading}>
                    {loading ? '查询中...' : '查询'}
                </button>

                <button
                    onClick={() => loadCustomers(page - 1, keyword)}
                    disabled={loading || page <= 1}
                >
                    上一页
                </button>

                <span>
                    第 {page} / {pages} 页，共 {total} 条
                </span>

                <button
                    onClick={() => loadCustomers(page + 1, keyword)}
                    disabled={loading || page >= pages}
                >
                    下一页
                </button>
            </div>

            <ErrorMessage message={error} />

            {!loading && customers.length === 0 && (
                <EmptyState
                    title="暂无客户数据"
                    description="可以点击新增客户创建第一条记录。"
                />
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
                            <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <Link href={`/customers/${customer.id}/edit`}>
                                    编辑
                                </Link>

                                {role === 'ADMIN' && (
                                    <button onClick={() => handleDelete(customer.id)}>
                                        删除
                                    </button>
                                )}
                            </td>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </Layout>
    );
}
