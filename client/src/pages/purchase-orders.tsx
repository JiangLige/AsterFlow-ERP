import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';
import { FadeIn } from '@/components/motion';
import { motion, AnimatePresence } from 'motion/react';

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

function formatStatus(status: string) {
    if (status === 'DRAFT') return '草稿';
    if (status === 'APPROVED') return '已审核';
    if (status === 'CANCELED') return '已取消';
    return status;
}

function statusTone(status: string) {
    if (status === 'APPROVED') return 'success';
    if (status === 'CANCELED') return 'danger';
    return 'warning';
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        maximumFractionDigits: 2,
    }).format(value || 0);
}

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
    };

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

            loadOrders(page);
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
            });

            loadOrders(page);
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
            });

            loadOrders(page);
        } catch (err) {
            setError(err instanceof Error ? err.message : '取消采购单失败');
        }
    }

    useEffect(() => {
        setRole(localStorage.getItem('role') || '');
        loadOrders();
    }, []);

    return (
        <Layout>
            <FadeIn direction="up" distance={16}>
                <section className="page-hero">
                    <div>
                        <p className="eyebrow">采购入库</p>
                        <h1>采购单列表</h1>
                        <p className="muted">跟踪采购草稿、审核入库和取消流转。</p>
                    </div>

                    <div className="page-actions">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Link className="btn-primary" href="/purchase-orders/new">
                                新增采购单
                            </Link>
                        </motion.div>
                    </div>
                </section>
            </FadeIn>

            <FadeIn direction="up" delay={0.1}>
                <div className="toolbar">
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

                    <motion.button
                        onClick={() => loadOrders(1)}
                        disabled={loading}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {loading ? '加载中...' : '查询'}
                    </motion.button>
                </div>
            </FadeIn>

            <AnimatePresence mode="wait">
                {error && (
                    <FadeIn direction="up" delay={0.05} key="error">
                        <div className="alert alert-danger">{error}</div>
                    </FadeIn>
                )}
            </AnimatePresence>

            <FadeIn direction="up" delay={0.15}>
                <p className="muted" style={{ marginTop: '1rem' }}>
                    第 {page} / {pages} 页，共 {total} 条
                </p>
            </FadeIn>

            <FadeIn direction="up" delay={0.2}>
                <table>
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
                        {orders.map((order, index) => (
                            <motion.tr
                                key={order.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: index * 0.04,
                                    duration: 0.35,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                            >
                                <td>
                                    <strong>{order.orderNo}</strong>
                                </td>
                                <td>{order.supplierName}</td>
                                <td>{formatCurrency(order.totalAmount)}</td>
                                <td>
                                    <span className={`status-badge ${statusTone(order.status)}`}>
                                        {formatStatus(order.status)}
                                    </span>
                                </td>
                                <td>{order.remark || '-'}</td>
                                <td>{order.createdAt}</td>
                                <td className="action-cell">
                                    <Link href={`/purchase-orders/${order.id}`}>详情</Link>
                                    {order.status === 'DRAFT' && (
                                        <Link href={`/purchase-orders/${order.id}/edit`}>编辑</Link>
                                    )}
                                    {order.status === 'DRAFT' && (
                                        <motion.button
                                            onClick={() => handleApprove(order.id)}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            审核入库
                                        </motion.button>
                                    )}
                                    {role === 'ADMIN' && order.status === 'DRAFT' && (
                                        <motion.button
                                            onClick={() => handleDelete(order.id)}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            删除
                                        </motion.button>
                                    )}
                                    {order.status === 'APPROVED' && (
                                        <motion.button
                                            onClick={() => handleCancel(order.id)}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            取消采购单
                                        </motion.button>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </FadeIn>

            {!loading && orders.length === 0 && (
                <FadeIn direction="up" delay={0.1}>
                    <motion.div
                        className="empty-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <span>暂无采购单数据</span>
                    </motion.div>
                </FadeIn>
            )}

            <FadeIn direction="up" delay={0.25}>
                <div className="toolbar">
                    <motion.button
                        onClick={() => loadOrders(page - 1)}
                        disabled={loading || page <= 1}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        上一页
                    </motion.button>
                    <motion.button
                        onClick={() => loadOrders(page + 1)}
                        disabled={loading || page >= pages}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        下一页
                    </motion.button>
                </div>
            </FadeIn>
        </Layout>
    );
}
