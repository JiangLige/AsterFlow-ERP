import { Header, HeaderGlobalAction, HeaderGlobalBar, HeaderMenuButton, HeaderNavigation } from '@carbon/react';
import { Logout, UserAvatar } from '@carbon/react/icons';
import Link from 'next/link';
import BrandMark from '@/components/brand/BrandMark';
import { getActiveModule, MODULES } from './navigation';

type AppHeaderProps = {
  pathname: string;
  displayName: string;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onLogout: () => void;
};

export default function AppHeader(props: AppHeaderProps) {
  const activeModule = getActiveModule(props.pathname);

  return (
    <Header aria-label="AsterFlow ERP">
      <HeaderMenuButton aria-label="打开导航" isActive={props.mobileOpen} onClick={props.onToggleMobile} />
      <Link className="aster-brand" href="/" aria-label="返回运营总览">
        <BrandMark />
        <span>AsterFlow ERP</span>
      </Link>
      <HeaderNavigation aria-label="一级模块">
        {MODULES.map((module) => (
          <Link
            key={module.key}
            className="aster-module-link"
            data-active={activeModule?.key === module.key}
            href={module.items[0].href}
          >
            {module.label}
          </Link>
        ))}
      </HeaderNavigation>
      <HeaderGlobalBar>
        <div className="aster-user" title={props.displayName}>
          <UserAvatar size={20} />
          <span>{props.displayName}</span>
        </div>
        <HeaderGlobalAction aria-label="退出登录" onClick={props.onLogout}>
          <Logout size={20} />
        </HeaderGlobalAction>
      </HeaderGlobalBar>
    </Header>
  );
}
