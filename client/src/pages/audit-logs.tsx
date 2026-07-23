import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';
import { FadeIn } from '@/components/motion';
import { motion, AnimatePresence } from 'motion/react';

type AuditLog = {
    id: number;
    operatorId: number;
    operatorName: string;
    operatorRole: string;
    action: string;
    targetType: string;
    targetId: number;
    targetNo: string;
    description: string;
    createdAt: string;
};

type PageResponse<T> = {
    records: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
};

function formatAction(action: string) {
    const map: Record<string, string> = {
        STOCK_ADJUST: '库存调整',
        PURCHASE_APPROVE: '采购审核',
        PURCHASE_CANCEL: '采购取消',
        SALE_APPROVE: '销售审核',
        SALE_CANCEL: '销售取消',
    };

    return map[action] || action;
}

function formatTargetType(targetType: string) {
    const map: Record<string, string> = {
        PRODUCT: '商品',
        PURCHASE_ORDER: '采购单',
        SALE_ORDER: '销售单',
    };

    return map[targetType] || targetType;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [keyword, setKeyword] = useState('');
    const [action, setAction] = useState('');
    const [targetType, setTargetType] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function loadLogs(targetPage = page) {
        setLoading(true);
        setError('');

        try {
            const query = new URLSearchParams();
            query.set('page', String(targetPage));
            query.set('size', '10');

            if (keyword.trim()) {
                query.set('keyword', keyword.trim());
            }

            if (action) {
                query.set('action', action);
            }

            if (targetType) {
                query.set('targetType', targetType);
            }

            const data = await apiRequest<PageResponse<AuditLog>>(
                `/api/audit-logs?${query.toString()}`
            );

            setLogs(data.records);
            setPage(data.page);
            setPages(data.pages);
            setTotal(data.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : '审计日志加载失败');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadLogs(1);
    }, []);

    return (
        <Layout>
            <FadeIn direction="up" distance={16}>
                <section className="page-hero">
                    <div>
                        <p className="eyebrow">操作审计</p>
                        <h1>审计日志</h1>
                        <p className="muted">查看关键库存和订单动作的操作记录。</p>
                    </div>
                </section>
            </FadeIn>

            <FadeIn direction="up" delay={0.1}>
                <div className="toolbar">
                    <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="操作人/单号/描述"
                    />

                    <select value={action} onChange={(e) => setAction(e.target.value)}>
                        <option value="">全部动作</option>
                        <option value="STOCK_ADJUST">库存调整</option>
                        <option value="PURCHASE_APPROVE">采购审核</option>
                        <option value="PURCHASE_CANCEL">采购取消</option>
                        <option value="SALE_APPROVE">销售审核</option>
                        <option value="SALE_CANCEL">销售取消</option>
                    </select>

                    <select value={targetType} onChange={(e) => setTargetType(e.target.value)}>
                        <option value="">全部对象</option>
                        <option value="PRODUCT">商品</option>
                        <option value="PURCHASE_ORDER">采购单</option>
                        <option value="SALE_ORDER">销售单</option>
                    </select>

                    <motion.button
                        onClick={() => loadLogs(1)}
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
                            <th>时间</th>
                            <th>操作人</th>
                            <th>角色</th>
                            <th>动作</th>
                            <th>对象</th>
                            <th>对象编号</th>
                            <th>描述</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log, index) => (
                            <motion.tr
                                key={log.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: index * 0.04,
                                    duration: 0.35,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                            >
                                <td>{log.createdAt}</td>
                                <td>
                                    <strong>{log.operatorName}</strong>
                                </td>
                                <td>
                                    <span className="status-badge">{log.operatorRole}</span>
                                </td>
                                <td>{formatAction(log.action)}</td>
                                <td>{formatTargetType(log.targetType)}</td>
                                <td>{log.targetNo || '-'}</td>
                                <td>{log.description}</td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </FadeIn>

            {!loading && logs.length === 0 && (
                <FadeIn direction="up" delay={0.1}>
                    <motion.div
                        className="empty-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <span>暂无审计日志</span>
                    </motion.div>
                </FadeIn>
            )}

            <FadeIn direction="up" delay={0.25}>
                <div className="toolbar">
                    <motion.button
                        onClick={() => loadLogs(page - 1)}
                        disabled={loading || page <= 1}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        上一页
                    </motion.button>
                    <motion.button
                        onClick={() => loadLogs(page + 1)}
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
