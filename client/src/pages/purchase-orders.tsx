import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';

type PurchaseOrder = {
    id: number;
    orderNo: string;
    supplierId: number;
    supplierName: string;
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

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [role, setRole] = useState('');
    const loadOrders = useCallback(async (
        targetPage: number,
        currentKeyword: string,
        currentStatus: string
    ) => {
        setLoading(true);
        setError('');

        try {
            const query = new URLSearchParams();
            query.set('page', String(targetPage));
            query.set('size', '10');

            if (currentKeyword.trim()) {
                query.set('keyword', currentKeyword.trim());
            }

            if (currentStatus) {
                query.set('status', currentStatus);
            }

            const data = await apiRequest<PageResponse<PurchaseOrder>>(
                `/api/purchase-orders?${query.toString()}`
            );

            setOrders(data.records);
            setPage(data.page);
            setPages(data.pages);
            setTotal(data.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : '加载采购单失败');
        } finally {
            setLoading(false);
        }
    }, []);

    async function handleApprove(id: number) {
        const ok = window.confirm('确定要审核入库这个采购单吗？');

        if (!ok) {
            return;
        }

        setError('');

        try {
            await apiRequest(`/api/purchase-orders/${id}/approve`, {
                method: 'PATCH',
            });

            loadOrders(page, keyword, status);
        } catch (err) {
            setError(err instanceof Error ? err.message : '审核入库失败');
        }
    }

    async function handleDelete(id: number) {
        const ok = window.confirm('确定要删除这个草稿采购单吗？');

        if (!ok) {
            return;
        }

        setError('');

        try {
            await apiRequest(`/api/purchase-orders/${id}`, {
                method: 'DELETE',
                headers: {
                    'Idempotency-Key': crypto.randomUUID(),
                },
            });

            loadOrders(page, keyword, status);
        } catch (err) {
            setError(err instanceof Error ? err.message : '删除采购单失败');
        }
    }

    async function handleCancel(id: number) {
        const ok = window.confirm('确定要取消这个采购单并扣回库存吗？');

        if (!ok) {
            return;
        }

        setError('');

        try {
            await apiRequest(`/api/purchase-orders/${id}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Idempotency-Key': crypto.randomUUID(),
                },
            });

            loadOrders(page, keyword, status);
        } catch (err) {
            setError(err instanceof Error ? err.message : '取消采购单失败');
        }
    }

    useEffect(() => {
        setRole(localStorage.getItem('role') || '');
        loadOrders(1, '', '');
    }, [loadOrders]);



    return (
        <Layout>
            <h1>采购单列表</h1>

            <Link href="/purchase-orders/new">新增采购单</Link>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="输入采购单号/供应商"
                />

                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">全部状态</option>
                    <option value="DRAFT">草稿</option>
                    <option value="APPROVED">已审核</option>
                    <option value="CANCELED">已取消</option>
                </select>

                <button onClick={() => loadOrders(1, keyword, status)} disabled={loading}>
                    {loading ? '加载中...' : '查询'}
                </button>
            </div>

            <ErrorMessage message={error} />

            {!loading && orders.length === 0 && (
                <EmptyState
                    title="暂无采购单数据"
                    description="可以点击新增采购单创建第一条记录。"
                />
            )}

            <div style={{ marginTop: '1rem' }}>
                第 {page} / {pages} 页，共 {total} 条
            </div>

            {orders.length > 0 && (
                <table style={{ marginTop: '1rem', width: '100%', borderCollapse: 'collapse' }}>
                    <table style={{ marginTop: '1rem', width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr>
                            <th>单号</th>
                            <th>供应商</th>
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
                                <td>{order.supplierName}</td>
                                <td>{order.totalAmount}</td>
                                <td>{order.status}</td>
                                <td>{order.remark}</td>
                                <td>{order.createdAt}</td>
                                <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <Link href={`/purchase-orders/${order.id}`}>详情</Link>
                                    {order.status === 'DRAFT' && (
                                        <Link href={`/purchase-orders/${order.id}/edit`}>编辑</Link>
                                    )}
                                    {order.status === 'DRAFT' && (
                                        <button onClick={() => handleApprove(order.id)}>
                                            审核入库
                                        </button>
                                    )}
                                    {role === 'ADMIN' && order.status === 'DRAFT' && (
                                        <button onClick={() => handleDelete(order.id)}>
                                            删除
                                        </button>
                                    )}
                                    {order.status === 'APPROVED' && (
                                        <button onClick={() => handleCancel(order.id)}>
                                            取消采购单
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </table>
            )}

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => loadOrders(page - 1, keyword, status)} disabled={loading || page <= 1}>
                    上一页
                </button>
                <button onClick={() => loadOrders(page + 1, keyword, status)} disabled={loading || page >= pages}>
                    下一页
                </button>
            </div>
        </Layout>
    );
}
