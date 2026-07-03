import Link from 'next/link';
import {useRouter} from 'next/router';
import type {ReactNode} from 'react';
import {useEffect, useState} from 'react';
import {
    clearAuthStorage,
    getAccessToken,
    getCurrentUserDisplay,
    getRefreshToken,
} from '@/lib/auth';

type LayoutProps = {
    children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState('');
    useEffect(() => {
        const token = getAccessToken();

        if (!token) {
            router.replace('/login');
            return;
        }

        const currentUser = getCurrentUserDisplay();
        setDisplayName(currentUser.displayName);
        setRole(currentUser.role);
        setReady(true);
    }, [router]);

    async function handleLogout() {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    refreshToken,
                }),
            });
        } catch {
            // Local logout should continue even if the server is unreachable.
        }

        clearAuthStorage();
    }

    if (!ready) {
        return (
            <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
                <p>登录状态检查中...</p>
            </main>
        );
    }

    return (
        <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
            <nav
                style={{
                    marginBottom: '1rem',
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }}
            >
                <Link href="/">Dashboard</Link>
                <Link href="/products">商品列表</Link>
                <Link href="/purchase-orders">采购单列表</Link>
                <Link href="/suppliers">供应商管理</Link>
                <Link href="/sale-orders">销售单列表</Link>
                <Link href="/inventory-warnings">库存预警</Link>
                <Link href="/customers">客户管理</Link>
                <Link href="/stock-records">库存流水</Link>
                <Link href="/audit-logs">审计日志</Link>

                <span style={{ marginLeft: 'auto' }}>
    {displayName || '当前用户'} {role && `(${role})`}
</span>
                <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>
                    退出登录
                </button>
            </nav>

            {children}
        </main>
    );
}
