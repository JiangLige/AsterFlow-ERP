export type NavigationItem = { href: string; label: string };
export type NavigationModule = {
  key: 'overview' | 'master-data' | 'operations' | 'system';
  label: string;
  items: NavigationItem[];
};

export const MODULES: NavigationModule[] = [
  { key: 'overview', label: '运营总览', items: [{ href: '/', label: '运营总览' }] },
  {
    key: 'master-data',
    label: '基础资料',
    items: [
      { href: '/products', label: '商品管理' },
      { href: '/suppliers', label: '供应商' },
      { href: '/customers', label: '客户管理' },
    ],
  },
  {
    key: 'operations',
    label: '业务流转',
    items: [
      { href: '/purchase-orders', label: '采购订单' },
      { href: '/sale-orders', label: '销售订单' },
      { href: '/inventory-warnings', label: '库存预警' },
      { href: '/stock-records', label: '库存流水' },
    ],
  },
  { key: 'system', label: '系统', items: [{ href: '/audit-logs', label: '审计日志' }] },
];

export function isActiveRoute(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveModule(pathname: string) {
  return MODULES.find((module) => module.items.some((item) => isActiveRoute(pathname, item.href)));
}
