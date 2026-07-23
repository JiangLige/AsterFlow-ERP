import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';
import { FadeIn } from '@/components/motion';
import { motion, AnimatePresence } from 'motion/react';

type StockRecord = {
    id: number;
    productId: number;
    productCode: string;
    productName: string;
    changeQuantity: number;
    beforeStock: number;
    afterStock: number;
    type: string;
    remark: string;
    createdAt: string;
    sourceType: string;
    sourceId: number;
    sourceNo: string;
};

type PageResponse<T> = {
    records: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
};

function formatType(type: string) {
    if (type === 'IN') return '入库';
    if (type === 'OUT') return '出库';
    if (type === 'ADJUST') return '调整';
    return type;
}

function typeTone(type: string) {
    if (type === 'IN') return 'success';
    if (type === 'OUT') return 'warning';
    return '';
}

function formatSource(record: StockRecord) {
    if (record.sourceNo) {
        return record.sourceNo;
    }

    if (record.sourceType) {
        return record.sourceType;
    }

    return '-';
}

export default function StockRecordsPage() {
    const [records, setRecords] = useState<StockRecord[]>([]);
    const [keyword, setKeyword] = useState('');
    const [type, setType] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadRecords = async (targetPage = page) => {
        setLoading(true);
        setError('');

        try {
            const query = new URLSearchParams();
            query.set('page', String(targetPage));
            query.set('size', '10');

            if (keyword.trim()) {
                query.set('keyword', keyword.trim());
            }

            if (type) {
                query.set('type', type);
            }

            const data = await apiRequest<PageResponse<StockRecord>>(
                `/api/stock-records?${query.toString()}`
            );

            setRecords(data.records);
            setPage(data.page);
            setPages(data.pages);
            setTotal(data.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : '库存流水加载失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRecords(1);
    }, []);

    return (
        <Layout>
            <FadeIn direction="up" distance={16}>
                <section className="page-hero">
                    <div>
                        <p className="eyebrow">库存追踪</p>
                        <h1>库存流水</h1>
                        <p className="muted">查看入库、出库和调整记录，追溯来源单据。</p>
                    </div>
                </section>
            </FadeIn>

            <FadeIn direction="up" delay={0.1}>
                <div className="toolbar">
                    <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="输入商品编码/名称"
                    />

                    <select value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="">全部类型</option>
                        <option value="IN">入库</option>
                        <option value="OUT">出库</option>
                        <option value="ADJUST">调整</option>
                    </select>

                    <motion.button
                        onClick={() => loadRecords(1)}
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
                            <th>商品编码</th>
                            <th>商品名称</th>
                            <th>类型</th>
                            <th>变化数量</th>
                            <th>变化前</th>
                            <th>变化后</th>
                            <th>来源单据</th>
                            <th>备注</th>
                            <th>创建时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record, index) => (
                            <motion.tr
                                key={record.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: index * 0.04,
                                    duration: 0.35,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                            >
                                <td>
                                    <strong>{record.productCode}</strong>
                                </td>
                                <td>{record.productName}</td>
                                <td>
                                    <span className={`status-badge ${typeTone(record.type)}`}>
                                        {formatType(record.type)}
                                    </span>
                                </td>
                                <td>
                                    <strong style={{ color: record.changeQuantity < 0 ? 'var(--danger)' : 'var(--success)' }}>
                                        {record.changeQuantity > 0 ? '+' : ''}{record.changeQuantity}
                                    </strong>
                                </td>
                                <td>{record.beforeStock}</td>
                                <td>{record.afterStock}</td>
                                <td>{formatSource(record)}</td>
                                <td>{record.remark || '-'}</td>
                                <td>{record.createdAt}</td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </FadeIn>

            {!loading && records.length === 0 && (
                <FadeIn direction="up" delay={0.1}>
                    <motion.div
                        className="empty-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <span>暂无库存流水</span>
                    </motion.div>
                </FadeIn>
            )}

            <FadeIn direction="up" delay={0.25}>
                <div className="toolbar">
                    <motion.button
                        onClick={() => loadRecords(page - 1)}
                        disabled={loading || page <= 1}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        上一页
                    </motion.button>
                    <motion.button
                        onClick={() => loadRecords(page + 1)}
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
