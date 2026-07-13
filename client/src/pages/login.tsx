import { useState } from 'react';
import { useRouter } from 'next/router';
import { saveAuth } from '@/lib/auth';
import ErrorMessage from '@/components/ErrorMessage';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin123');
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
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || '登录失败');
            }

            saveAuth({
                token: result.data.token,
                username: result.data.username,
                realName: result.data.realName,
                role: result.data.role,
            });

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
                <div className="brand">
                    <span className="brand-mark">AF</span>
                    <div>
                        <p className="brand-title">AsterFlow ERP</p>
                        <p className="brand-subtitle">进销存运营工作台</p>
                    </div>
                </div>

                <div className="login-heading">
                    <p className="eyebrow">Enterprise Resource Planning</p>
                    <h1>把采购、销售和库存放在同一个节奏里。</h1>
                    <p className="login-copy">
                        登录后即可查看运营总览、处理订单审核、维护商品档案，并追踪库存流水与审计记录。
                    </p>
                </div>

                <div className="login-summary" aria-label="系统概览">
                    <div className="login-summary-item">
                        <strong>9</strong>
                        <span>核心业务模块</span>
                    </div>
                    <div className="login-summary-item">
                        <strong>24h</strong>
                        <span>库存与订单追踪</span>
                    </div>
                    <div className="login-summary-item">
                        <strong>Role</strong>
                        <span>按角色控制操作</span>
                    </div>
                </div>
            </section>

            <section className="login-panel-wrap">
                <div className="login-card">
                    <p className="eyebrow">安全登录</p>
                    <h1>欢迎回来</h1>
                    <p className="muted">使用 ERP 账号进入运营工作台。</p>

                    <form className="login-form" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="username">用户名</label>
                            <input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
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
                            />
                        </div>

                        <ErrorMessage message={error} />

                        <button type="submit" disabled={loading}>
                            {loading ? '登录中...' : '登录'}
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}
