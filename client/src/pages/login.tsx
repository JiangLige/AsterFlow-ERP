import { useState } from 'react';
import { useRouter } from 'next/router';
import {
    IconArrowRight,
    IconBuildingWarehouse,
    IconChartHistogram,
    IconRosette,
    IconShieldCheck,
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'motion/react';

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

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.15,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 24 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
            },
        },
    };

    const capabilityVariants = {
        hidden: { opacity: 0, x: -16 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
            },
        },
    };

    return (
        <main className="login-screen">
            <motion.section
                className="login-visual"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                <motion.div
                    className="brand login-brand"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                >
                    <motion.span
                        className="brand-mark"
                        aria-hidden="true"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ delay: 0.8, duration: 0.6, ease: 'easeInOut' }}
                    >
                        <IconRosette size={28} stroke={1.8} />
                    </motion.span>
                    <div>
                        <p className="brand-title">AsterFlow ERP</p>
                        <p className="brand-subtitle">进销存运营中枢</p>
                    </div>
                </motion.div>

                <motion.div
                    className="login-heading"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.p className="eyebrow" variants={itemVariants}>
                        OPERATIONS, IN ONE RHYTHM
                    </motion.p>
                    <motion.h1 variants={itemVariants}>
                        让每一次采购、销售与库存变化都清晰可见。
                    </motion.h1>
                    <motion.p className="login-copy" variants={itemVariants}>
                        从待审核订单到实时库存风险，把团队每天最重要的业务动作集中在一个可靠的工作台中。
                    </motion.p>
                </motion.div>

                <motion.div
                    className="login-capabilities"
                    aria-label="系统能力"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={capabilityVariants}>
                        <IconChartHistogram size={22} stroke={1.7} />
                        <span>
                            <strong>经营全景</strong>
                            <small>关键指标与待办集中呈现</small>
                        </span>
                    </motion.div>
                    <motion.div variants={capabilityVariants}>
                        <IconBuildingWarehouse size={22} stroke={1.7} />
                        <span>
                            <strong>库存闭环</strong>
                            <small>入库、出库与预警全程追踪</small>
                        </span>
                    </motion.div>
                    <motion.div variants={capabilityVariants}>
                        <IconShieldCheck size={22} stroke={1.7} />
                        <span>
                            <strong>权限审计</strong>
                            <small>关键业务操作可控可追溯</small>
                        </span>
                    </motion.div>
                </motion.div>

                <motion.p
                    className="login-footnote"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                >
                    AsterFlow ERP · 为稳定运营而设计
                </motion.p>
            </motion.section>

            <motion.section
                className="login-panel-wrap"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
                <motion.div
                    className="login-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                    <motion.p
                        className="eyebrow"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45, duration: 0.4 }}
                    >
                        安全登录
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                    >
                        欢迎回来
                    </motion.h2>
                    <motion.p
                        className="muted"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55, duration: 0.4 }}
                    >
                        使用你的 ERP 账号继续今天的运营工作。
                    </motion.p>

                    <motion.form
                        className="login-form"
                        onSubmit={handleLogin}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.45 }}
                    >
                        <motion.div
                            whileFocus={{ scale: 1.01 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                            <label htmlFor="username">用户名</label>
                            <motion.input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                placeholder="请输入用户名"
                                whileFocus={{
                                    boxShadow: '0 0 0 3px rgba(6, 40, 73, 0.12)',
                                    borderColor: 'var(--navy)',
                                }}
                                transition={{ duration: 0.2 }}
                            />
                        </motion.div>

                        <motion.div>
                            <label htmlFor="password">密码</label>
                            <motion.input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                placeholder="请输入密码"
                                whileFocus={{
                                    boxShadow: '0 0 0 3px rgba(6, 40, 73, 0.12)',
                                    borderColor: 'var(--navy)',
                                }}
                                transition={{ duration: 0.2 }}
                            />
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    className="alert alert-danger"
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            className="login-submit"
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                            <span>{loading ? '正在登录...' : '进入运营工作台'}</span>
                            <motion.span
                                animate={loading ? { x: [0, 4, 0] } : {}}
                                transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <IconArrowRight size={18} stroke={1.8} aria-hidden="true" />
                            </motion.span>
                        </motion.button>
                    </motion.form>

                    <motion.div
                        className="demo-accounts"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9, duration: 0.4 }}
                    >
                        <span>演示账号</span>
                        <code>admin / 123456</code>
                        <code>staff / 123456</code>
                    </motion.div>
                </motion.div>
            </motion.section>
        </main>
    );
}
