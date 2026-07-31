import { describe, expect, it } from 'vitest';
import { buildDashboardView, type DashboardSummary } from './dashboard-view';

describe('buildDashboardView', () => {
  it('projects the full dashboard summary without inventing historical data', () => {
    const summary: DashboardSummary = {
      productCount: 128,
      warningProductCount: 6,
      purchaseApprovedCount: 36,
      purchaseCanceledCount: 4,
      purchaseDraftCount: 5,
      todayPurchaseOrderCount: 8,
      todayPurchaseAmount: 215480,
      todayInQuantity: 420,
      saleApprovedCount: 42,
      saleCanceledCount: 3,
      saleDraftCount: 3,
      todaySaleOrderCount: 12,
      todaySaleAmount: 328760.5,
      todayOutQuantity: 286,
    };

    const view = buildDashboardView(summary);

    expect(view.pendingCount).toBe(8);
    expect(view.metrics).toEqual([
      { label: '今日销售额', value: '¥328,760.50', detail: '12 张销售订单' },
      { label: '今日采购额', value: '¥215,480.00', detail: '8 张采购订单' },
      { label: '待审核订单', value: '8', detail: '采购 5 笔，销售 3 笔' },
      { label: '库存风险商品', value: '6', detail: '共 128 项商品' },
    ]);
    expect(view.tasks).toEqual([
      {
        label: '采购订单待审核',
        description: '审核后将自动完成商品入库',
        value: '5 笔',
        href: '/purchase-orders',
      },
      {
        label: '销售订单待审核',
        description: '确认可用库存并完成销售出库',
        value: '3 笔',
        href: '/sale-orders',
      },
      {
        label: '库存预警商品',
        description: '建议及时补货或调整安全库存',
        value: '6 项',
        href: '/inventory-warnings',
      },
    ]);
    expect(view.orderStatus).toEqual([
      { status: '草稿', purchase: 5, sale: 3 },
      { status: '已审核', purchase: 36, sale: 42 },
      { status: '已取消', purchase: 4, sale: 3 },
    ]);
    expect(view.movements).toEqual([
      {
        type: '采购入库',
        orders: '8 张采购单',
        quantity: '420',
        amount: '¥215,480.00',
      },
      {
        type: '销售出库',
        orders: '12 张销售单',
        quantity: '286',
        amount: '¥328,760.50',
      },
    ]);
  });
});
