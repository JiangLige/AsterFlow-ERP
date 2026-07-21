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
} from '@tabler/icons-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';

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
};

const numberFormatter = new Intl.NumberFormat('zh-CN');
const currencyFormatter = new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 2,
});

function formatNumber(value: number) {
    return numberFormatter.format(value || 0);
}

function formatCurrency(value: number) {
    return currencyFormatter.format(value || 0);
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

    const pendingCount = data ? data.purchaseDraftCount + data.saleDraftCount : 0;

    return (
        <Layout>
            <section className="dashboard-hero">
                <div>
                    <h1>早上好，{displayName}</h1>
                    <p>{formatDate()} · 今日概览与关键事项</p>
                </div>
                <div className="page-actions dashboard-actions">
                    <Link className="btn-primary" href="/purchase-orders">
                        处理全部待审核（{formatNumber(pendingCount)}）
                    </Link>
                    <Link className="btn-secondary" href="/purchase-orders/new">
                        新建采购单
                    </Link>
                    <button className="icon-button" onClick={loadDashboard} disabled={loading} aria-label="刷新运营数据">
                        <IconRefresh size={18} stroke={1.8} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </section>

            {error && <div className="alert alert-danger">{error}</div>}

            {!data && !error && (
                <div className="dashboard-empty">
                    <IconRefresh size={24} stroke={1.7} className={loading ? 'spin' : ''} />
                    <span>{loading ? '正在汇总今日运营数据...' : '暂无运营数据'}</span>
                </div>
            )}

            {data && (
                <>
                    <section className="editorial-metrics" aria-label="今日关键指标">
                        <article>
                            <p>今日销售额</p>
                            <strong>{formatCurrency(data.todaySaleAmount)}</strong>
                            <span>{formatNumber(data.todaySaleOrderCount)} 张销售订单</span>
                        </article>
                        <article>
                            <p>今日采购额</p>
                            <strong>{formatCurrency(data.todayPurchaseAmount)}</strong>
                            <span>{formatNumber(data.todayPurchaseOrderCount)} 张采购订单</span>
                        </article>
                        <article>
                            <p>商品与库存风险</p>
                            <strong>{formatNumber(data.productCount)} <small>项商品</small></strong>
                            <span className={data.warningProductCount > 0 ? 'metric-risk' : ''}>
                                {formatNumber(data.warningProductCount)} 项低于安全库存
                            </span>
                        </article>
                    </section>

                    <section className="operations-grid">
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
                                <Link className="task-item" href="/purchase-orders">
                                    <span className="task-icon"><IconShoppingCart size={19} stroke={1.7} /></span>
                                    <span className="task-copy">
                                        <strong>采购订单待审核</strong>
                                        <small>审核后将自动完成商品入库</small>
                                    </span>
                                    <span className="task-value">{formatNumber(data.purchaseDraftCount)} 笔</span>
                                    <span className="task-link">查看 <IconArrowRight size={15} /></span>
                                </Link>
                                <Link className="task-item" href="/sale-orders">
                                    <span className="task-icon"><IconClipboardCheck size={19} stroke={1.7} /></span>
                                    <span className="task-copy">
                                        <strong>销售订单待审核</strong>
                                        <small>确认可用库存并完成销售出库</small>
                                    </span>
                                    <span className="task-value">{formatNumber(data.saleDraftCount)} 笔</span>
                                    <span className="task-link">查看 <IconArrowRight size={15} /></span>
                                </Link>
                            </div>

                            <div className="task-section">
                                <p className="task-section-title">待我处理（{formatNumber(data.warningProductCount)}）</p>
                                <Link className="task-item" href="/inventory-warnings">
                                    <span className="task-icon warning"><IconAlertTriangle size={19} stroke={1.7} /></span>
                                    <span className="task-copy">
                                        <strong>库存预警商品</strong>
                                        <small>建议及时补货或调整安全库存</small>
                                    </span>
                                    <span className="task-value risk">{formatNumber(data.warningProductCount)} 项</span>
                                    <span className="task-link">处理 <IconArrowRight size={15} /></span>
                                </Link>
                            </div>

                            <Link className="panel-footer-link" href="/audit-logs">
                                查看全部业务记录 <IconArrowRight size={16} stroke={1.8} />
                            </Link>
                        </article>

                        <div className="operations-stack">
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
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e2d8" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6e685f', fontSize: 12 }} />
                                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#8b847a', fontSize: 11 }} />
                                            <Tooltip
                                                cursor={{ fill: '#faf7f1' }}
                                                contentStyle={{ border: '1px solid #ded7cb', borderRadius: 6, boxShadow: 'none' }}
                                            />
                                            <Legend iconType="square" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                                            <Bar dataKey="采购" fill="#0b3157" radius={[3, 3, 0, 0]} maxBarSize={34} />
                                            <Bar dataKey="销售" fill="#ee5a32" radius={[3, 3, 0, 0]} maxBarSize={34} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </article>

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
                                    <div className="movement-row" role="row">
                                        <span><IconBuildingWarehouse size={16} /> 采购入库</span>
                                        <span>{formatNumber(data.todayPurchaseOrderCount)} 张采购单</span>
                                        <strong>{formatNumber(data.todayInQuantity)}</strong>
                                        <strong>{formatCurrency(data.todayPurchaseAmount)}</strong>
                                    </div>
                                    <div className="movement-row" role="row">
                                        <span><IconArrowsExchange size={16} stroke={1.7} aria-hidden="true" /> 销售出库</span>
                                        <span>{formatNumber(data.todaySaleOrderCount)} 张销售单</span>
                                        <strong>{formatNumber(data.todayOutQuantity)}</strong>
                                        <strong>{formatCurrency(data.todaySaleAmount)}</strong>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </section>
                </>
            )}
        </Layout>
    );
};

export default Home;
