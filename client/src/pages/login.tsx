import { useState } from 'react';
import { useRouter } from 'next/router';
import {
    IconArrowRight,
    IconBuildingWarehouse,
    IconChartHistogram,
    IconRosette,
    IconShieldCheck,
} from '@tabler/icons-react';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('123456');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || '登录失败');
            }

            localStorage.setItem('token', result.data.token);
            localStorage.setItem('username', result.data.username || '');
            localStorage.setItem('realName', result.data.realName || '');
            localStorage.setItem('role', result.data.role || '');

            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : '登录失败');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="login-screen">
            <section className="login-visual">
                <div className="brand login-brand">
                    <span className="brand-mark" aria-hidden="true">
                        <IconRosette size={28} stroke={1.8} />
                    </span>
                    <div>
                        <p className="brand-title">AsterFlow ERP</p>
                        <p className="brand-subtitle">进销存运营中枢</p>
                    </div>
                </div>

                <div className="login-heading">
                    <p className="eyebrow">OPERATIONS, IN ONE RHYTHM</p>
                    <h1>让每一次采购、销售与库存变化都清晰可见。</h1>
                    <p className="login-copy">
                        从待审核订单到实时库存风险，把团队每天最重要的业务动作集中在一个可靠的工作台中。
                    </p>
                </div>

                <div className="login-capabilities" aria-label="系统能力">
                    <div>
                        <IconChartHistogram size={22} stroke={1.7} />
                        <span>
                            <strong>经营全景</strong>
                            <small>关键指标与待办集中呈现</small>
                        </span>
                    </div>
                    <div>
                        <IconBuildingWarehouse size={22} stroke={1.7} />
                        <span>
                            <strong>库存闭环</strong>
                            <small>入库、出库与预警全程追踪</small>
                        </span>
                    </div>
                    <div>
                        <IconShieldCheck size={22} stroke={1.7} />
                        <span>
                            <strong>权限审计</strong>
                            <small>关键业务操作可控可追溯</small>
                        </span>
                    </div>
                </div>

                <p className="login-footnote">AsterFlow ERP · 为稳定运营而设计</p>
            </section>

            <section className="login-panel-wrap">
                <div className="login-card">
                    <p className="eyebrow">安全登录</p>
                    <h2>欢迎回来</h2>
                    <p className="muted">使用你的 ERP 账号继续今天的运营工作。</p>

                    <form className="login-form" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="username">用户名</label>
                            <input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                placeholder="请输入用户名"
                            />
                        </div>

                        <div>
                            <label htmlFor="password">密码</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                placeholder="请输入密码"
                            />
                        </div>

                        {error && <div className="alert alert-danger">{error}</div>}

                        <button className="login-submit" type="submit" disabled={loading}>
                            <span>{loading ? '正在登录...' : '进入运营工作台'}</span>
                            <IconArrowRight size={18} stroke={1.8} aria-hidden="true" />
                        </button>
                    </form>

                    <div className="demo-accounts">
                        <span>演示账号</span>
                        <code>admin / 123456</code>
                        <code>staff / 123456</code>
                    </div>
                </div>
            </section>
        </main>
    );
}
