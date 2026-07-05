import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

type LayoutProps = {
    children: ReactNode;
};

const navItems = [
    { href: '/', label: '运营总览' },
    { href: '/products', label: '商品管理' },
    { href: '/purchase-orders', label: '采购订单' },
    { href: '/sale-orders', label: '销售订单' },
    { href: '/inventory-warnings', label: '库存预警' },
    { href: '/stock-records', label: '库存流水' },
    { href: '/suppliers', label: '供应商' },
    { href: '/customers', label: '客户' },
    { href: '/audit-logs', label: '审计日志' },
];

function isActivePath(currentPath: string, href: string) {
    if (href === '/') {
        return currentPath === '/';
    }

    return currentPath === href || currentPath.startsWith(`${href}/`);
}

export default function Layout({ children }: LayoutProps) {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState('');

    const currentNav = useMemo(
        () => navItems.find((item) => isActivePath(router.pathname, item.href)),
        [router.pathname]
    );

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            router.replace('/login');
            return;
        }

        setDisplayName(localStorage.getItem('realName') || localStorage.getItem('username') || '');
        setRole(localStorage.getItem('role') || '');
        setReady(true);
    }, [router]);

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('realName');
        localStorage.removeItem('role');
        router.replace('/login');
    }

    if (!ready) {
        return (
            <main className="app-loading">
                <div className="loading-card">正在检查登录状态...</div>
            </main>
        );
    }

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="brand">
                    <span className="brand-mark">AF</span>
                    <div>
                        <p className="brand-title">AsterFlow ERP</p>
                        <p className="brand-subtitle">进销存运营工作台</p>
                    </div>
                </div>

                <nav className="sidebar-nav" aria-label="主导航">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            className={`nav-link${isActivePath(router.pathname, item.href) ? ' active' : ''}`}
                            href={item.href}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            <main className="app-main">
                <header className="app-topbar">
                    <div>
                        <p className="topbar-kicker">当前模块</p>
                        <p className="topbar-title">{currentNav?.label || '业务页面'}</p>
                    </div>

                    <div className="user-area">
                        <div className="user-meta">
                            <p className="user-name">{displayName || '当前用户'}</p>
                            {role && <span className="role-pill">{role}</span>}
                        </div>
                        <button className="logout-button" onClick={handleLogout}>
                            退出
                        </button>
                    </div>
                </header>

                <section className="content-shell">{children}</section>
            </main>
        </div>
    );
}
