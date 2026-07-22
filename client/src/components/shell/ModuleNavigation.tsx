import Link from 'next/link';
import { getActiveModule, isActiveRoute } from './navigation';

type ModuleNavigationProps = {
  pathname: string;
  mobileOpen: boolean;
  onNavigate: () => void;
};

export default function ModuleNavigation({ pathname, mobileOpen, onNavigate }: ModuleNavigationProps) {
  const items = getActiveModule(pathname)?.items ?? [];

  const links = (className: string, onClick?: () => void) => items.map((item) => {
    const active = isActiveRoute(pathname, item.href);

    return (
      <Link
        key={item.href}
        className={className}
        data-active={active}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        onClick={onClick}
      >
        {item.label}
      </Link>
    );
  });

  return (
    <nav className="aster-module-navigation" aria-label="二级导航">
      <div className="aster-context-nav">
        <div className="aster-context-nav-content">{links('aster-context-link')}</div>
      </div>
      <div id="aster-mobile-navigation" className="aster-mobile-panel" hidden={!mobileOpen}>
        <div className="aster-mobile-panel-content">{links('aster-mobile-link', onNavigate)}</div>
      </div>
    </nav>
  );
}
