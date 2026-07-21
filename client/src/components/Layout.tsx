import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
    IconAlertTriangle,
    IconArrowsExchange,
    IconBuildingStore,
    IconBuildingWarehouse,
    IconChevronDown,
    IconClipboardText,
    IconLayoutDashboard,
    IconLogout,
    IconPackage,
    IconReceipt,
    IconRosette,
    IconSettings,
    IconShoppingCart,
    IconUsers,
    type Icon,
} from '@tabler/icons-react';

type LayoutProps = {
    children: ReactNode;
};

type NavItem = {
    href: string;
    label: string;
    icon: Icon;
};

const navGroups: Array<{ label: string; items: NavItem[] }> = [
    {
        label: '工作台',
        items: [{ href: '/', label: '运营总览', icon: IconLayoutDashboard }],
    },
    {
        label: '基础资料',
        items: [
            { href: '/products', label: '商品管理', icon: IconPackage },
            { href: '/suppliers', label: '供应商', icon: IconBuildingStore },
            { href: '/customers', label: '客户管理', icon: IconUsers },
        ],
    },
    {
        label: '业务流转',
        items: [
            { href: '/purchase-orders', label: '采购订单', icon: IconShoppingCart },
            { href: '/sale-orders', label: '销售订单', icon: IconReceipt },
            { href: '/inventory-warnings', label: '库存预警', icon: IconAlertTriangle },
            { href: '/stock-records', label: '库存流水', icon: IconArrowsExchange },
        ],
    },
    {
        label: '系统',
        items: [{ href: '/audit-logs', label: '审计日志', icon: IconClipboardText }],
    },
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
                <IconRosette size={28} stroke={1.7} />
                <div className="loading-card">正在准备运营工作台...</div>
            </main>
        );
    }

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <Link className="brand" href="/" aria-label="返回运营总览">
                    <span className="brand-mark" aria-hidden="true">
                        <IconRosette size={27} stroke={1.8} />
                    </span>
                    <div>
                        <p className="brand-title">AsterFlow ERP</p>
                        <p className="brand-subtitle">进销存运营中枢</p>
                    </div>
                </Link>

                <nav className="sidebar-nav" aria-label="主导航">
                    {navGroups.map((group) => (
                        <div className="nav-group" key={group.label}>
                            <p className="nav-group-label">{group.label}</p>
                            {group.items.map((item) => {
                                const ItemIcon = item.icon;
                                const active = isActivePath(router.pathname, item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        className={`nav-link${active ? ' active' : ''}`}
                                        href={item.href}
                                        aria-current={active ? 'page' : undefined}
                                    >
                                        <ItemIcon size={19} stroke={1.7} aria-hidden="true" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="profile-button" type="button" aria-label="当前用户信息">
                        <span className="avatar">{(displayName || '用').slice(0, 1).toUpperCase()}</span>
                        <span className="profile-copy">
                            <strong>{displayName || '当前用户'}</strong>
                            <small>{role === 'ADMIN' ? '系统管理员' : role || '业务成员'}</small>
                        </span>
                        <IconChevronDown size={16} stroke={1.7} aria-hidden="true" />
                    </button>

                    <div className="sidebar-utilities">
                        <span>
                            <IconSettings size={17} stroke={1.7} aria-hidden="true" />
                            系统设置
                        </span>
                        <button className="logout-button" onClick={handleLogout} type="button">
                            <IconLogout size={17} stroke={1.7} aria-hidden="true" />
                            退出
                        </button>
                    </div>
                </div>
            </aside>

            <main className="app-main">
                <section className="content-shell">{children}</section>
            </main>
        </div>
    );
}
