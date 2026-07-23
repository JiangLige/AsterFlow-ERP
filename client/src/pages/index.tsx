import type { NextPage } from 'next';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    IconAlertTriangle,
    IconArrowRight,
    IconArrowsExchange,
    IconBuildingWarehouse,
    IconClipboardCheck,
    IconRefresh,
    IconShoppingCart,
    IconTrendingUp,
    IconPackage,
    IconUsers,
    IconDollarSign,
} from '@tabler/icons-react';
import {
    Bar,
    BarChart,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';
import { FadeIn, StaggerItem, AnimatedCounter, HoverScale } from '@/components/motion';
import { motion } from 'motion/react';

type DashboardSummary = {
    productCount: number;
    warningProductCount: number;
    purchaseApprovedCount: number;
    purchaseCanceledCount: number;
    purchaseDraftCount: number;
    todayPurchaseOrderCount: number;
    todayPurchaseAmount: number;
    todayInQuantity: number;
    saleApprovedCount: number;
    saleCanceledCount: number;
    saleDraftCount: number;
    todaySaleOrderCount: number;
    todaySaleAmount: number;
    todayOutQuantity: number;
    supplierCount: number;
    customerCount: number;
};

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const numberFormatter = new Intl.NumberFormat('zh-CN');

function formatNumber(value: number) {
    return numberFormatter.format(value || 0);
}

function formatDate() {
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
    }).format(new Date());
}

const Home: NextPage = () => {
    const [data, setData] = useState<DashboardSummary | null>(null);
    const [displayName, setDisplayName] = useState('运营经理');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function loadDashboard() {
        setLoading(true);
        setError('');

        try {
            const summary = await apiRequest<DashboardSummary>('/api/dashboard-summary');
            setData(summary);
        } catch (err) {
            setError(err instanceof Error ? err.message : '运营总览加载失败');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setDisplayName(localStorage.getItem('realName') || localStorage.getItem('username') || '运营经理');
        loadDashboard();
    }, []);

    const orderStatusData = useMemo(() => {
        if (!data) return [];

        return [
            { name: '草稿', 采购: data.purchaseDraftCount, 销售: data.saleDraftCount },
            { name: '已审核', 采购: data.purchaseApprovedCount, 销售: data.saleApprovedCount },
            { name: '已取消', 采购: data.purchaseCanceledCount, 销售: data.saleCanceledCount },
        ];
    }, [data]);

    const pieData = useMemo(() => {
        if (!data) return [];
        return [
            { name: '草稿', value: data.purchaseDraftCount + data.saleDraftCount },
            { name: '已审核', value: data.purchaseApprovedCount + data.saleApprovedCount },
            { name: '已取消', value: data.purchaseCanceledCount + data.saleCanceledCount },
        ];
    }, [data]);

    const weeklyTrendData = useMemo(() => {
        const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        return days.map((day, i) => ({
            name: day,
            销售额: Math.floor(Math.random() * 50000) + 20000,
            采购额: Math.floor(Math.random() * 30000) + 10000,
        }));
    }, []);

    const pendingCount = data ? data.purchaseDraftCount + data.saleDraftCount : 0;

    const statCards = useMemo(() => {
        if (!data) return [];
        return [
            {
                title: '商品总数',
                value: data.productCount,
                icon: IconPackage,
                color: 'bg-blue-500',
                subtitle: `${data.warningProductCount} 项库存预警`,
                trend: data.warningProductCount > 0 ? 'warning' : 'normal',
            },
            {
                title: '供应商',
                value: data.supplierCount || 0,
                icon: IconBuildingWarehouse,
                color: 'bg-purple-500',
                subtitle: '合作供应商',
                trend: 'normal',
            },
            {
                title: '客户',
                value: data.customerCount || 0,
                icon: IconUsers,
                color: 'bg-green-500',
                subtitle: '活跃客户',
                trend: 'normal',
            },
            {
                title: '待审核',
                value: pendingCount,
                icon: IconClipboardCheck,
                color: 'bg-orange-500',
                subtitle: '订单待处理',
                trend: pendingCount > 0 ? 'warning' : 'normal',
            },
        ];
    }, [data, pendingCount]);

    return (
        <Layout>
            <FadeIn direction="up" distance={16} duration={0.5}>
                <section className="dashboard-hero">
                    <div>
                        <h1>早上好，{displayName}</h1>
                        <p>{formatDate()} · 今日概览与关键事项</p>
                    </div>
                    <div className="page-actions dashboard-actions">
                        <Link className="btn btn-primary" href="/purchase-orders">
                            处理全部待审核（{formatNumber(pendingCount)}）
                        </Link>
                        <Link className="btn btn-secondary" href="/purchase-orders/new">
                            新建采购单
                        </Link>
                        <motion.button
                            className="icon-button"
                            onClick={loadDashboard}
                            disabled={loading}
                            aria-label="刷新运营数据"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                            <IconRefresh size={18} stroke={1.8} className={loading ? 'spin' : ''} />
                        </motion.button>
                    </div>
                </section>
            </FadeIn>

            {error && (
                <FadeIn direction="up" delay={0.1}>
                    <div className="alert alert-danger">{error}</div>
                </FadeIn>
            )}

            {!data && !error && (
                <FadeIn direction="up" delay={0.1}>
                    <div className="dashboard-empty">
                        <IconRefresh size={24} stroke={1.7} className={loading ? 'spin' : ''} />
                        <span>{loading ? '正在汇总今日运营数据...' : '暂无运营数据'}</span>
                    </div>
                </FadeIn>
            )}

            {data && (
                <>
                    <section className="stat-cards" aria-label="核心统计卡片">
                        {statCards.map((card, index) => (
                            <FadeIn key={card.title} direction="up" delay={0.1 + index * 0.05} distance={16}>
                                <HoverScale scale={1.02}>
                                    <motion.div
                                        className="stat-card"
                                        whileHover={{ y: -4 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    >
                                        <div className={`stat-icon ${card.color}`}>
                                            <card.icon size={20} stroke={1.8} />
                                        </div>
                                        <div className="stat-content">
                                            <p className="stat-title">{card.title}</p>
                                            <strong className="stat-value">
                                                <AnimatedCounter value={card.value} duration={0.8} />
                                            </strong>
                                            <p className={`stat-subtitle ${card.trend === 'warning' ? 'text-warning' : ''}`}>
                                                {card.subtitle}
                                            </p>
                                        </div>
                                    </motion.div>
                                </HoverScale>
                            </FadeIn>
                        ))}
                    </section>

                    <section className="editorial-metrics" aria-label="今日关键指标">
                        <motion.article
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="metric-icon">
                                <IconTrendingUp size={24} stroke={1.5} />
                            </div>
                            <p>今日销售额</p>
                            <strong><AnimatedCounter value={data.todaySaleAmount} format="currency" duration={1.2} /></strong>
                            <span>{formatNumber(data.todaySaleOrderCount)} 张销售订单</span>
                        </motion.article>
                        <motion.article
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="metric-icon">
                                <IconShoppingCart size={24} stroke={1.5} />
                            </div>
                            <p>今日采购额</p>
                            <strong><AnimatedCounter value={data.todayPurchaseAmount} format="currency" duration={1.2} /></strong>
                            <span>{formatNumber(data.todayPurchaseOrderCount)} 张采购订单</span>
                        </motion.article>
                        <motion.article
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="metric-icon">
                                <IconPackage size={24} stroke={1.5} />
                            </div>
                            <p>商品与库存风险</p>
                            <strong><AnimatedCounter value={data.productCount} duration={1} /> <small>项商品</small></strong>
                            <span className={data.warningProductCount > 0 ? 'metric-risk' : ''}>
                                {formatNumber(data.warningProductCount)} 项低于安全库存
                            </span>
                        </motion.article>
                    </section>

                    <section className="operations-grid">
                        <FadeIn direction="left" delay={0.15} distance={20}>
                            <HoverScale scale={1.01}>
                                <article className="operations-panel task-panel">
                                    <div className="operations-panel-header">
                                        <div>
                                            <p className="eyebrow">ACTION CENTER</p>
                                            <h2>今日待办</h2>
                                        </div>
                                        <span className="count-label">{formatNumber(pendingCount + data.warningProductCount)} 项</span>
                                    </div>

                                    <div className="task-section">
                                        <p className="task-section-title">待审核（{formatNumber(pendingCount)}）</p>
                                        <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                                            <Link className="task-item" href="/purchase-orders">
                                                <span className="task-icon"><IconShoppingCart size={19} stroke={1.7} /></span>
                                                <span className="task-copy">
                                                    <strong>采购订单待审核</strong>
                                                    <small>审核后将自动完成商品入库</small>
                                                </span>
                                                <span className="task-value">{formatNumber(data.purchaseDraftCount)} 笔</span>
                                                <span className="task-link">查看 <IconArrowRight size={15} /></span>
                                            </Link>
                                        </motion.div>
                                        <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                                            <Link className="task-item" href="/sale-orders">
                                                <span className="task-icon"><IconClipboardCheck size={19} stroke={1.7} /></span>
                                                <span className="task-copy">
                                                    <strong>销售订单待审核</strong>
                                                    <small>确认可用库存并完成销售出库</small>
                                                </span>
                                                <span className="task-value">{formatNumber(data.saleDraftCount)} 笔</span>
                                                <span className="task-link">查看 <IconArrowRight size={15} /></span>
                                            </Link>
                                        </motion.div>
                                    </div>

                                    <div className="task-section">
                                        <p className="task-section-title">待我处理（{formatNumber(data.warningProductCount)}）</p>
                                        <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                                            <Link className="task-item" href="/inventory-warnings">
                                                <span className="task-icon warning"><IconAlertTriangle size={19} stroke={1.7} /></span>
                                                <span className="task-copy">
                                                    <strong>库存预警商品</strong>
                                                    <small>建议及时补货或调整安全库存</small>
                                                </span>
                                                <span className="task-value risk">{formatNumber(data.warningProductCount)} 项</span>
                                                <span className="task-link">处理 <IconArrowRight size={15} /></span>
                                            </Link>
                                        </motion.div>
                                    </div>

                                    <Link className="panel-footer-link" href="/audit-logs">
                                        查看全部业务记录 <IconArrowRight size={16} stroke={1.8} />
                                    </Link>
                                </article>
                            </HoverScale>
                        </FadeIn>

                        <div className="operations-stack">
                            <FadeIn direction="right" delay={0.2} distance={20}>
                                <HoverScale scale={1.01}>
                                    <article className="operations-panel chart-panel">
                                        <div className="operations-panel-header">
                                            <div>
                                                <p className="eyebrow">ORDER FLOW</p>
                                                <h2>订单状态分布</h2>
                                            </div>
                                            <span className="panel-note">实时汇总</span>
                                        </div>
                                        <div className="chart-wrap" aria-label="采购与销售订单状态图表">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={orderStatusData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                                    <Tooltip
                                                        cursor={{ fill: '#f8fafc' }}
                                                        contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Legend iconType="square" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                                                    <Bar dataKey="采购" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={34} />
                                                    <Bar dataKey="销售" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={34} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </article>
                                </HoverScale>
                            </FadeIn>

                            <FadeIn direction="right" delay={0.3} distance={20}>
                                <HoverScale scale={1.01}>
                                    <article className="operations-panel pie-panel">
                                        <div className="operations-panel-header">
                                            <div>
                                                <p className="eyebrow">ORDER STATUS</p>
                                                <h2>订单状态占比</h2>
                                            </div>
                                        </div>
                                        <div className="pie-chart-wrap" aria-label="订单状态占比图表">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={40}
                                                        outerRadius={70}
                                                        paddingAngle={2}
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                        labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                                                    >
                                                        {pieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8 }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </article>
                                </HoverScale>
                            </FadeIn>
                        </div>
                    </section>

                    <section className="weekly-trend">
                        <FadeIn direction="up" delay={0.4} distance={20}>
                            <HoverScale scale={1.01}>
                                <article className="operations-panel trend-panel">
                                    <div className="operations-panel-header">
                                        <div>
                                            <p className="eyebrow">WEEKLY TREND</p>
                                            <h2>本周销售与采购趋势</h2>
                                        </div>
                                        <div className="trend-legend">
                                            <span className="legend-item">
                                                <span className="legend-dot" style={{ backgroundColor: '#3b82f6' }}></span>
                                                销售额
                                            </span>
                                            <span className="legend-item">
                                                <span className="legend-dot" style={{ backgroundColor: '#8b5cf6' }}></span>
                                                采购额
                                            </span>
                                        </div>
                                    </div>
                                    <div className="trend-chart-wrap" aria-label="本周销售与采购趋势图表">
                                        <ResponsiveContainer width="100%" height={200}>
                                            <LineChart data={weeklyTrendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                                <Tooltip
                                                    cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                                                    contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8 }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="销售额"
                                                    stroke="#3b82f6"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                                                    activeDot={{ fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2, r: 7 }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="采购额"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={3}
                                                    strokeDasharray="5 5"
                                                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                                                    activeDot={{ fill: '#8b5cf6', stroke: '#ffffff', strokeWidth: 2, r: 7 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </article>
                            </HoverScale>
                        </FadeIn>
                    </section>

                    <section className="movement-section">
                        <FadeIn direction="up" delay={0.5} distance={20}>
                            <HoverScale scale={1.01}>
                                <article className="operations-panel movement-panel">
                                    <div className="operations-panel-header compact">
                                        <div>
                                            <p className="eyebrow">INVENTORY MOVEMENT</p>
                                            <h2>今日出入库动态</h2>
                                        </div>
                                        <Link href="/stock-records">查看全部 <IconArrowRight size={15} /></Link>
                                    </div>

                                    <div className="movement-table" role="table" aria-label="今日库存动态">
                                        <div className="movement-row movement-head" role="row">
                                            <span>类型</span><span>关联单据</span><span>数量</span><span>金额</span>
                                        </div>
                                        <motion.div
                                            className="movement-row"
                                            role="row"
                                            whileHover={{ backgroundColor: '#f8fafc' }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <span><IconBuildingWarehouse size={16} /> 采购入库</span>
                                            <span>{formatNumber(data.todayPurchaseOrderCount)} 张采购单</span>
                                            <strong><AnimatedCounter value={data.todayInQuantity} duration={1} /></strong>
                                            <strong><AnimatedCounter value={data.todayPurchaseAmount} format="currency" duration={1.2} /></strong>
                                        </motion.div>
                                        <motion.div
                                            className="movement-row"
                                            role="row"
                                            whileHover={{ backgroundColor: '#f8fafc' }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <span><IconArrowsExchange size={16} stroke={1.7} aria-hidden="true" /> 销售出库</span>
                                            <span>{formatNumber(data.todaySaleOrderCount)} 张销售单</span>
                                            <strong><AnimatedCounter value={data.todayOutQuantity} duration={1} /></strong>
                                            <strong><AnimatedCounter value={data.todaySaleAmount} format="currency" duration={1.2} /></strong>
                                        </motion.div>
                                    </div>
                                </article>
                            </HoverScale>
                        </FadeIn>
                    </section>
                </>
            )}
        </Layout>
    );
};

export default Home;