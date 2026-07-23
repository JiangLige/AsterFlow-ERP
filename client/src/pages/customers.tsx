import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';
import { FadeIn } from '@/components/motion';
import { motion, AnimatePresence } from 'motion/react';

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

function formatStatus(status: string) {
    if (status === 'ACTIVE') return '启用';
    if (status === 'INACTIVE') return '停用';
    return status;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [role, setRole] = useState('');

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

            loadCustomers(page);
        } catch (err) {
            setError(err instanceof Error ? err.message : '删除客户失败');
        }
    }

    useEffect(() => {
        setRole(localStorage.getItem('role') || '');
        loadCustomers(1);
    }, []);

    return (
        <Layout>
            <FadeIn direction="up" distance={16}>
                <section className="page-hero">
                    <div>
                        <p className="eyebrow">客户关系</p>
                        <h1>客户列表</h1>
                        <p className="muted">维护客户编码、联系人和业务状态。</p>
                    </div>

                    <div className="page-actions">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Link className="btn-primary" href="/customers/new">
                                新增客户
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
                        placeholder="输入客户编码/名称/电话"
                    />

                    <motion.button
                        onClick={() => loadCustomers(1)}
                        disabled={loading}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {loading ? '查询中...' : '查询'}
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
                        {customers.map((customer, index) => (
                            <motion.tr
                                key={customer.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: index * 0.04,
                                    duration: 0.35,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                            >
                                <td>
                                    <strong>{customer.customerCode}</strong>
                                </td>
                                <td>{customer.name}</td>
                                <td>{customer.contactName || '-'}</td>
                                <td>{customer.phone || '-'}</td>
                                <td>{customer.address || '-'}</td>
                                <td>
                                    <span className={`status-badge ${customer.status === 'ACTIVE' ? 'success' : 'warning'}`}>
                                        {formatStatus(customer.status)}
                                    </span>
                                </td>
                                <td className="action-cell">
                                    <Link href={`/customers/${customer.id}/edit`}>编辑</Link>

                                    {role === 'ADMIN' && (
                                        <motion.button
                                            onClick={() => handleDelete(customer.id)}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            删除
                                        </motion.button>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </FadeIn>

            {!loading && customers.length === 0 && (
                <FadeIn direction="up" delay={0.1}>
                    <motion.div
                        className="empty-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <span>暂无客户数据</span>
                    </motion.div>
                </FadeIn>
            )}

            <FadeIn direction="up" delay={0.25}>
                <div className="toolbar">
                    <motion.button
                        onClick={() => loadCustomers(page - 1)}
                        disabled={loading || page <= 1}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        上一页
                    </motion.button>
                    <motion.button
                        onClick={() => loadCustomers(page + 1)}
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
