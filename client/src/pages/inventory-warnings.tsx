import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconRefresh, IconAlertCircle } from '@tabler/icons-react';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';
import { FadeIn, AnimatedCounter } from '@/components/motion';
import { motion, AnimatePresence } from 'motion/react';

type Product = {
    id: number;
    productCode: string;
    name: string;
    category: string;
    unit: string;
    price: number;
    cost: number;
    stock: number;
    minStock: number;
    status: string;
};

function formatStatus(status: string) {
    if (status === 'ACTIVE') return '启用';
    if (status === 'INACTIVE') return '停用';
    return status;
}

export default function InventoryWarningsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadWarnings = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await apiRequest<Product[]>('/api/product-warnings');
            setProducts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '库存预警加载失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWarnings();
    }, []);

    return (
        <Layout>
            <FadeIn direction="up" distance={16}>
                <section className="page-hero">
                    <div>
                        <p className="eyebrow">库存风险</p>
                        <h1>库存预警</h1>
                        <p className="muted">集中查看低于最低库存线的商品。</p>
                    </div>

                    <div className="page-actions">
                        <motion.button
                            className="btn-secondary"
                            onClick={loadWarnings}
                            disabled={loading}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <IconRefresh size={16} stroke={1.8} className={loading ? 'spin' : ''} />
                            {loading ? '刷新中...' : '刷新'}
                        </motion.button>
                    </div>
                </section>
            </FadeIn>

            <AnimatePresence mode="wait">
                {error && (
                    <FadeIn direction="up" delay={0.05} key="error">
                        <div className="alert alert-danger">{error}</div>
                    </FadeIn>
                )}
            </AnimatePresence>

            {!loading && products.length === 0 && !error && (
                <FadeIn direction="up" delay={0.1}>
                    <motion.div
                        className="alert alert-success"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <IconAlertCircle size={18} stroke={1.7} />
                        当前没有库存预警商品
                    </motion.div>
                </FadeIn>
            )}

            {products.length > 0 && (
                <FadeIn direction="up" delay={0.15}>
                    <motion.div
                        className="alert alert-warning"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <IconAlertCircle size={18} stroke={1.7} />
                        发现 <strong><AnimatedCounter value={products.length} duration={0.8} /></strong> 项商品低于安全库存
                    </motion.div>
                </FadeIn>
            )}

            {products.length > 0 && (
                <FadeIn direction="up" delay={0.2}>
                    <table>
                        <thead>
                            <tr>
                                <th>编码</th>
                                <th>名称</th>
                                <th>分类</th>
                                <th>单位</th>
                                <th>当前库存</th>
                                <th>最低库存</th>
                                <th>缺口</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product, index) => (
                                <motion.tr
                                    key={product.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: index * 0.04,
                                        duration: 0.35,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                >
                                    <td>
                                        <strong>{product.productCode}</strong>
                                    </td>
                                    <td>{product.name}</td>
                                    <td>{product.category}</td>
                                    <td>{product.unit}</td>
                                    <td>
                                        <strong style={{ color: 'var(--danger)' }}>
                                            <AnimatedCounter value={product.stock} duration={0.8} />
                                        </strong>
                                    </td>
                                    <td>{product.minStock}</td>
                                    <td>
                                        <strong style={{ color: 'var(--danger)' }}>
                                            +<AnimatedCounter value={product.minStock - product.stock} duration={0.8} />
                                        </strong>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${product.status === 'ACTIVE' ? 'success' : 'warning'}`}>
                                            {formatStatus(product.status)}
                                        </span>
                                    </td>
                                    <td className="action-cell">
                                        <Link href={`/products/${product.id}/stock`}>调整库存</Link>
                                        <Link href="/purchase-orders/new">补货采购</Link>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </FadeIn>
            )}
        </Layout>
    );
}
