import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';

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

const Home: NextPage = () => {
    const [data, setData] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function loadDashboard() {
        setLoading(true);
        setError('');

        try {
            const summary = await apiRequest<DashboardSummary>('/api/dashboard-summary');
            setData(summary);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Dashboard 加载失败');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadDashboard();
    }, []);

    return (
        <Layout>
            <section className="page-hero">
                <div>
                    <p className="eyebrow">运营总览</p>
                    <h1>AsterFlow ERP Dashboard</h1>
                    <p className="muted">
                        聚合今日采购、销售、库存预警和订单状态，帮助团队快速判断当前运营节奏。
                    </p>
                </div>

                <div className="page-actions">
                    <button className="btn-secondary" onClick={loadDashboard} disabled={loading}>
                        {loading ? '刷新中...' : '刷新数据'}
                    </button>
                </div>
            </section>

            <ErrorMessage message={error} />

            {!data && !error && (
                <EmptyState
                    title={loading ? '正在加载运营数据...' : '暂无 Dashboard 数据'}
                    description="系统会汇总商品、采购、销售和库存变化，用于快速查看经营状态。"
                />
            )}

            {data && (
                <>
                    <section className="metric-grid">
                        <article className="metric-card info">
                            <p className="metric-label">商品总数</p>
                            <p className="metric-value">{formatNumber(data.productCount)}</p>
                            <p className="metric-meta">当前可管理商品档案</p>
                        </article>

                        <article className="metric-card warning">
                            <p className="metric-label">库存预警</p>
                            <p className="metric-value">{formatNumber(data.warningProductCount)}</p>
                            <p className="metric-meta">低于安全库存的商品</p>
                        </article>

                        <article className="metric-card success">
                            <p className="metric-label">今日采购金额</p>
                            <p className="metric-value">{formatCurrency(data.todayPurchaseAmount)}</p>
                            <p className="metric-meta">{formatNumber(data.todayPurchaseOrderCount)} 张采购单</p>
                        </article>

                        <article className="metric-card">
                            <p className="metric-label">今日销售金额</p>
                            <p className="metric-value">{formatCurrency(data.todaySaleAmount)}</p>
                            <p className="metric-meta">{formatNumber(data.todaySaleOrderCount)} 张销售单</p>
                        </article>
                    </section>

                    <section className="dashboard-grid">
                        <article className="panel">
                            <div className="panel-header">
                                <div>
                                    <h2 className="panel-title">采购状态</h2>
                                    <p className="panel-subtitle">入库审核与草稿流转</p>
                                </div>
                                <span className="status-badge success">
                                    入库 {formatNumber(data.todayInQuantity)}
                                </span>
                            </div>

                            <div className="stat-list">
                                <div className="stat-row">
                                    <span>已审核采购单</span>
                                    <strong>{formatNumber(data.purchaseApprovedCount)}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>草稿采购单</span>
                                    <strong>{formatNumber(data.purchaseDraftCount)}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>已取消采购单</span>
                                    <strong>{formatNumber(data.purchaseCanceledCount)}</strong>
                                </div>
                            </div>
                        </article>

                        <article className="panel">
                            <div className="panel-header">
                                <div>
                                    <h2 className="panel-title">销售状态</h2>
                                    <p className="panel-subtitle">出库审核与订单完成情况</p>
                                </div>
                                <span className="status-badge warning">
                                    出库 {formatNumber(data.todayOutQuantity)}
                                </span>
                            </div>

                            <div className="stat-list">
                                <div className="stat-row">
                                    <span>已审核销售单</span>
                                    <strong>{formatNumber(data.saleApprovedCount)}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>草稿销售单</span>
                                    <strong>{formatNumber(data.saleDraftCount)}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>已取消销售单</span>
                                    <strong>{formatNumber(data.saleCanceledCount)}</strong>
                                </div>
                            </div>
                        </article>
                    </section>
                </>
            )}
        </Layout>
    );
};

export default Home;
