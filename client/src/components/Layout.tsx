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
import { motion, AnimatePresence } from 'motion/react';

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
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                >
                    <IconRosette size={28} stroke={1.7} />
                </motion.div>
                <motion.div
                    className="loading-card"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                >
                    正在准备运营工作台...
                </motion.div>
            </main>
        );
    }

    return (
        <div className="app-shell">
            <motion.aside
                className="sidebar"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
                <Link className="brand" href="/" aria-label="返回运营总览">
                    <motion.span
                        className="brand-mark"
                        aria-hidden="true"
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                        <IconRosette size={27} stroke={1.8} />
                    </motion.span>
                    <div>
                        <p className="brand-title">AsterFlow ERP</p>
                        <p className="brand-subtitle">进销存运营中枢</p>
                    </div>
                </Link>

                <nav className="sidebar-nav" aria-label="主导航">
                    {navGroups.map((group, groupIndex) => (
                        <div className="nav-group" key={group.label}>
                            <motion.p
                                className="nav-group-label"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 + groupIndex * 0.05, duration: 0.35 }}
                            >
                                {group.label}
                            </motion.p>
                            {group.items.map((item, itemIndex) => {
                                const ItemIcon = item.icon;
                                const active = isActivePath(router.pathname, item.href);

                                return (
                                    <motion.div
                                        key={item.href}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            delay: 0.2 + groupIndex * 0.05 + itemIndex * 0.04,
                                            duration: 0.35,
                                            ease: [0.16, 1, 0.3, 1],
                                        }}
                                    >
                                        <Link
                                            className={`nav-link${active ? ' active' : ''}`}
                                            href={item.href}
                                            aria-current={active ? 'page' : undefined}
                                        >
                                            <motion.span
                                                className="nav-link-inner"
                                                whileHover={{ x: 3 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.72rem', width: '100%' }}
                                            >
                                                <ItemIcon size={19} stroke={1.7} aria-hidden="true" />
                                                <span>{item.label}</span>
                                            </motion.span>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <motion.button
                        className="profile-button"
                        type="button"
                        aria-label="当前用户信息"
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.span
                            className="avatar"
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        >
                            {(displayName || '用').slice(0, 1).toUpperCase()}
                        </motion.span>
                        <span className="profile-copy">
                            <strong>{displayName || '当前用户'}</strong>
                            <small>{role === 'ADMIN' ? '系统管理员' : role || '业务成员'}</small>
                        </span>
                        <IconChevronDown size={16} stroke={1.7} aria-hidden="true" />
                    </motion.button>

                    <div className="sidebar-utilities">
                        <motion.span
                            whileHover={{ color: '#fff' }}
                            transition={{ duration: 0.2 }}
                        >
                            <IconSettings size={17} stroke={1.7} aria-hidden="true" />
                            系统设置
                        </motion.span>
                        <motion.button
                            className="logout-button"
                            onClick={handleLogout}
                            type="button"
                            whileHover={{ color: '#fff', scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                            <IconLogout size={17} stroke={1.7} aria-hidden="true" />
                            退出
                        </motion.button>
                    </div>
                </div>
            </motion.aside>

            <main className="app-main">
                <AnimatePresence mode="wait">
                    <motion.section
                        className="content-shell"
                        key={router.pathname}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {children}
                    </motion.section>
                </AnimatePresence>
            </main>
        </div>
    );
}
