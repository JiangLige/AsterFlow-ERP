import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';

type SaleOrder = {
    id: number;
    orderNo: string;
    customerName: string;
    totalAmount: number;
    status: string;
    remark: string;
    createdAt: string;
    updatedAt: string;
};

type PageResponse<T> = {
    records: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
};

export default function SaleOrdersPage() {
    const [orders, setOrders] = useState<SaleOrder[]>([]);
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [role, setRole] = useState('');

    const loadOrders = async (targetPage = page) => {
        setLoading(true);
        setError('');

        try {
            const query = new URLSearchParams();
            query.set('page', String(targetPage));
            query.set('size', '10');

            if (keyword.trim()) {
                query.set('keyword', keyword.trim());
            }

            if (status) {
                query.set('status', status);
            }

            const data = await apiRequest<PageResponse<SaleOrder>>(
                `/api/sale-orders?${query.toString()}`
            );

            setOrders(data.records);
            setPage(data.page);
            setPages(data.pages);
            setTotal(data.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : '加载销售单失败');
        } finally {
            setLoading(false);
        }
    };

    async function handleApprove(id: number) {
        const ok = window.confirm('确定要审核出库这个销售单吗？');

        if (!ok) {
            return;
        }

        setError('');

        try {
            await apiRequest(`/api/sale-orders/${id}/approve`, {
                method: 'PATCH',
            });

            loadOrders(page);
        } catch (err) {
            setError(err instanceof Error ? err.message : '审核出库失败');
        }
    }

    async function handleCancel(id: number) {
        const ok = window.confirm('确定要取消这个销售单并恢复库存吗？');

        if (!ok) {
            return;
        }

        setError('');

        try {
            await apiRequest(`/api/sale-orders/${id}/cancel`, {
                method: 'PATCH',
            });

            loadOrders(page);
        } catch (err) {
            setError(err instanceof Error ? err.message : '取消销售单失败');
        }
    }

    async function handleDelete(id: number) {
        const ok = window.confirm('确定要删除这个草稿销售单吗？');

        if (!ok) {
            return;
        }

        setError('');

        try {
            await apiRequest(`/api/sale-orders/${id}`, {
                method: 'DELETE',
            });

            loadOrders(page);
        } catch (err) {
            setError(err instanceof Error ? err.message : '删除销售单失败');
        }
    }

    useEffect(() => {
        setRole(localStorage.getItem('role') || '');
        loadOrders();
    }, []);

    return (
        <Layout>
            <h1>销售单列表</h1>

            <Link href="/sale-orders/new">新增销售单</Link>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="输入销售单号/客户"
                />

                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">全部状态</option>
                    <option value="DRAFT">草稿</option>
                    <option value="APPROVED">已审核</option>
                    <option value="CANCELED">已取消</option>
                </select>

                <button onClick={() => loadOrders(1)} disabled={loading}>
                    {loading ? '加载中...' : '查询'}
                </button>
            </div>

            {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}

            <div style={{ marginTop: '1rem' }}>
                第 {page} / {pages} 页，共 {total} 条
            </div>

            <table style={{ marginTop: '1rem', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>单号</th>
                        <th>客户</th>
                        <th>金额</th>
                        <th>状态</th>
                        <th>备注</th>
                        <th>创建时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td>{order.orderNo}</td>
                            <td>{order.customerName}</td>
                            <td>{order.totalAmount}</td>
                            <td>{order.status}</td>
                            <td>{order.remark}</td>
                            <td>{order.createdAt}</td>
                            <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <Link href={`/sale-orders/${order.id}`}>详情</Link>
                                {order.status === 'DRAFT' && (
                                    <Link href={`/sale-orders/${order.id}/edit`}>编辑</Link>
                                )}
                                {order.status === 'DRAFT' && (
                                    <button onClick={() => handleApprove(order.id)}>
                                        审核出库
                                    </button>
                                )}
                                {role === 'ADMIN' && order.status === 'DRAFT' && (
                                    <button onClick={() => handleDelete(order.id)}>
                                        删除
                                    </button>
                                )}
                                {order.status === 'APPROVED' && (
                                    <button onClick={() => handleCancel(order.id)}>
                                        取消销售单
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => loadOrders(page - 1)} disabled={loading || page <= 1}>
                    上一页
                </button>
                <button onClick={() => loadOrders(page + 1)} disabled={loading || page >= pages}>
                    下一页
                </button>
            </div>
        </Layout>
    );
}
