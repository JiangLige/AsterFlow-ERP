import { describe, expect, it } from 'vitest';
import { getActiveModule, isActiveRoute, MODULES } from './navigation';

describe('AsterFlow navigation', () => {
  it('preserves every approved route label', () => {
    expect(MODULES.flatMap((module) => module.items.map((item) => item.label))).toEqual([
      '杩愯惀鎬昏',
      '鍟嗗搧绠＄悊', '渚涘簲鍟?', '瀹㈡埛绠＄悊',
      '閲囪喘璁㈠崟', '閿€鍞鍗?', '搴撳瓨棰勮', '搴撳瓨娴佹按',
      '瀹¤鏃ュ織',
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
