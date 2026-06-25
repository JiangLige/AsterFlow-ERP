import { NextPage } from 'next';
import { useState } from 'react';

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
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin123');
    const [token, setToken] = useState('');
    const [data, setData] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadDashboard = async (loginToken: string) => {
        const res = await fetch('/api/dashboard-summary', {
            headers: {
                Authorization: `Bearer ${loginToken}`,
            },
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
            throw new Error(result.message || 'Dashboard 加载失败');
        }

        setData(result.data);
    };

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        setData(null);



        setLoading(true);
        setError('');
        setData(null);

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.message || '登录失败');
            }

            const loginToken = result.data.token;
            setToken(loginToken);

            await loadDashboard(loginToken);
        } catch (e: any) {
            setError(e.message || '请求失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
            <h1>Demo ERP Dashboard</h1>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="用户名"
                />

                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="密码"
                />

                <button onClick={handleLogin} disabled={loading}>
                    {loading ? '加载中...' : '登录并加载 Dashboard'}
                </button>
            </div>

            {error && (
                <p style={{ marginTop: '1rem', color: 'red' }}>
                    {error}
                </p>
            )}

            {token && (
                <p style={{ marginTop: '1rem', color: 'green' }}>
                    已登录
                </p>
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
        </main>
    );
};

export default Home;