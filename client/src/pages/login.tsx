import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button, Form, InlineNotification, PasswordInput, TextInput } from '@carbon/react';
import BrandMark from '@/components/brand/BrandMark';

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
        <main className="carbon-login">
            <section className="carbon-login__form" aria-labelledby="login-title">
                <div className="carbon-login__brand">
                    <BrandMark />
                    <strong>AsterFlow ERP</strong>
                </div>

                <div className="carbon-login__content">
                    <h1 id="login-title">登录运营工作台</h1>
                    <p className="carbon-login__intro">
                        使用你的 ERP 账号继续处理采购、销售和库存业务。
                    </p>

                    {error && (
                        <InlineNotification
                            kind="error"
                            title="登录失败"
                            subtitle={error}
                            hideCloseButton
                            lowContrast
                        />
                    )}

                    <Form onSubmit={handleLogin}>
                        <TextInput
                            id="username"
                            labelText="用户名"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            autoComplete="username"
                        />
                        <PasswordInput
                            id="password"
                            labelText="密码"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                        />
                        <Button type="submit" disabled={loading}>
                            {loading ? '正在登录' : '进入工作台'}
                        </Button>
                    </Form>

                    <p className="carbon-login__demo">
                        演示账号：admin / 123456，staff / 123456
                    </p>

                    <dl className="carbon-login__mobile-capabilities" aria-label="系统能力">
                        <div>
                            <dt>采购</dt>
                            <dd>订单审核与入库衔接</dd>
                        </div>
                        <div>
                            <dt>销售</dt>
                            <dd>库存校验与出库追踪</dd>
                        </div>
                        <div>
                            <dt>库存</dt>
                            <dd>风险预警与流水审计</dd>
                        </div>
                    </dl>
                </div>
            </section>

            <aside className="carbon-login__brand-panel">
                <div>
                    <p className="carbon-login__panel-label">AsterFlow ERP</p>
                    <h2>让关键业务保持清晰。</h2>
                </div>
                <dl>
                    <div>
                        <dt>采购</dt>
                        <dd>订单审核与入库衔接</dd>
                    </div>
                    <div>
                        <dt>销售</dt>
                        <dd>库存校验与出库追踪</dd>
                    </div>
                    <div>
                        <dt>库存</dt>
                        <dd>风险预警与流水审计</dd>
                    </div>
                </dl>
            </aside>
        </main>
    );
}
