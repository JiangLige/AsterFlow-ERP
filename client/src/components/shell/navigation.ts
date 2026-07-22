export type NavigationItem = { href: string; label: string };
export type NavigationModule = {
  key: 'overview' | 'master-data' | 'operations' | 'system';
  label: string;
  items: NavigationItem[];
};

export const MODULES: NavigationModule[] = [
  { key: 'overview', label: '杩愯惀鎬昏', items: [{ href: '/', label: '杩愯惀鎬昏' }] },
  {
    key: 'master-data',
    label: '鍩虹璧勬枡',
    items: [
      { href: '/products', label: '鍟嗗搧绠＄悊' },
      { href: '/suppliers', label: '渚涘簲鍟?' },
      { href: '/customers', label: '瀹㈡埛绠＄悊' },
    ],
  },
  {
    key: 'operations',
    label: '涓氬姟娴佽浆',
    items: [
      { href: '/purchase-orders', label: '閲囪喘璁㈠崟' },
      { href: '/sale-orders', label: '閿€鍞鍗?' },
      { href: '/inventory-warnings', label: '搴撳瓨棰勮' },
      { href: '/stock-records', label: '搴撳瓨娴佹按' },
    ],
  },
  { key: 'system', label: '绯荤粺', items: [{ href: '/audit-logs', label: '瀹¤鏃ュ織' }] },
];

export function isActiveRoute(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveModule(pathname: string) {
  return MODULES.find((module) => module.items.some((item) => isActiveRoute(pathname, item.href)));
}
