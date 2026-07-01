import { NextPage } from 'next';
import { useEffect, useState } from 'react';
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
            <h1>Demo ERP Dashboard</h1>

            <button onClick={loadDashboard} disabled={loading}>
                {loading ? '刷新中...' : '刷新 Dashboard'}
            </button>

            {error && (
                <div
                    style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1rem',
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fecaca',
                        borderRadius: 6,
                    }}
                >
                    {error}
                </div>
            )}

            {data && (
                <div style={{ marginTop: '1rem' }}>
                    <section>
                        <h2>商品概览</h2>
                        <p>商品数量：{data.productCount}</p>
                        <p>库存预警商品：{data.warningProductCount}</p>
                    </section>

                    <section style={{ marginTop: '1rem' }}>
                        <h2>采购统计</h2>
                        <p>已审核采购单：{data.purchaseApprovedCount}</p>
                        <p>已取消采购单：{data.purchaseCanceledCount}</p>
                        <p>草稿采购单：{data.purchaseDraftCount}</p>
                        <p>今日采购单数：{data.todayPurchaseOrderCount}</p>
                        <p>今日采购金额：{data.todayPurchaseAmount}</p>
                        <p>今日入库数量：{data.todayInQuantity}</p>
                    </section>

                    <section style={{ marginTop: '1rem' }}>
                        <h2>销售统计</h2>
                        <p>已审核销售单：{data.saleApprovedCount}</p>
                        <p>已取消销售单：{data.saleCanceledCount}</p>
                        <p>草稿销售单：{data.saleDraftCount}</p>
                        <p>今日销售单数：{data.todaySaleOrderCount}</p>
                        <p>今日销售金额：{data.todaySaleAmount}</p>
                        <p>今日出库数量：{data.todayOutQuantity}</p>
                    </section>
                </div>
            )}
        </Layout>
    );
};

export default Home;