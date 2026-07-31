import Link from 'next/link';
import { getActiveModule, isActiveRoute, MODULES, type NavigationItem } from './navigation';

type ModuleNavigationProps = {
  pathname: string;
  mobileOpen: boolean;
  onNavigate: () => void;
};

export default function ModuleNavigation({ pathname, mobileOpen, onNavigate }: ModuleNavigationProps) {
  const items = getActiveModule(pathname)?.items ?? [];

  const links = (
    navigationItems: NavigationItem[],
    className: string,
    onClick?: () => void,
  ) => navigationItems.map((item) => {
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
        <div className="aster-context-nav-content">
          {links(items, 'aster-context-link')}
        </div>
      </div>
      <div id="aster-mobile-navigation" className="aster-mobile-panel" hidden={!mobileOpen}>
        <div className="aster-mobile-panel-content">
          {MODULES.map((module) => (
            <div
              key={module.key}
              aria-label={module.label}
              className="aster-mobile-group"
              role="group"
            >
              <span className="aster-mobile-group-label">{module.label}</span>
              {links(module.items, 'aster-mobile-link', onNavigate)}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
