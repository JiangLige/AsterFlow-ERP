import { describe, expect, it } from 'vitest';
import { getActiveModule, isActiveRoute, MODULES } from './navigation';

describe('AsterFlow navigation', () => {
  it('preserves every approved route label', () => {
    expect(MODULES.flatMap((module) => module.items.map((item) => item.label))).toEqual([
      '运营总览',
      '商品管理', '供应商', '客户管理',
      '采购订单', '销售订单', '库存预警', '库存流水',
      '审计日志',
    ]);
    expect(MODULES.map((module) => module.label)).toEqual([
      '运营总览', '基础资料', '业务流转', '系统',
    ]);
  });

  it('selects a module for nested routes', () => {
    expect(getActiveModule('/products/12/edit')?.key).toBe('master-data');
    expect(getActiveModule('/sale-orders/8')?.key).toBe('operations');
  });

  it('does not mark the dashboard active for every route', () => {
    expect(isActiveRoute('/products', '/')).toBe(false);
    expect(isActiveRoute('/products/3/edit', '/products')).toBe(true);
  });
});
