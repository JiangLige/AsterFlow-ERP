import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { InlineLoading } from '@carbon/react';
import AppHeader from './shell/AppHeader';
import ModuleNavigation from './shell/ModuleNavigation';

type LayoutProps = {
    children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);

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
                <InlineLoading description="正在准备运营工作台" />
            </main>
        );
    }

    return (
        <div className="aster-app-shell" data-role={role}>
            <a className="skip-link" href="#main-content">跳到主要内容</a>
            <AppHeader
                pathname={router.pathname}
                displayName={displayName}
                mobileOpen={mobileOpen}
                onToggleMobile={() => setMobileOpen((value) => !value)}
                onLogout={handleLogout}
            />
            <ModuleNavigation pathname={router.pathname} mobileOpen={mobileOpen} />
            <main id="main-content" className="aster-main">{children}</main>
        </div>
    );
}
