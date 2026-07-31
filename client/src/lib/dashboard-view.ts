export type DashboardSummary = {
  productCount: number;
  warningProductCount: number;
  purchaseApprovedCount: number;
  purchaseCanceledCount: number;
  purchaseDraftCount: number;
  todayPurchaseOrderCount: number;
  todayPurchaseAmount: number;
  todayInQuantity: number;
  saleApprovedCount: number;
  saleCanceledCount: number;
  saleDraftCount: number;
  todaySaleOrderCount: number;
  todaySaleAmount: number;
  todayOutQuantity: number;
};

export type DashboardView = {
  pendingCount: number;
  metrics: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  tasks: Array<{
    label: string;
    description: string;
    value: string;
    href: '/purchase-orders' | '/sale-orders' | '/inventory-warnings';
  }>;
  orderStatus: Array<{
    status: string;
    purchase: number;
    sale: number;
  }>;
  movements: Array<{
    type: string;
    orders: string;
    quantity: string;
    amount: string;
  }>;
};

const numberFormatter = new Intl.NumberFormat('zh-CN');
const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 2,
});

function formatNumber(value: number) {
  return numberFormatter.format(value || 0);
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value || 0);
}

export function buildDashboardView(summary: DashboardSummary): DashboardView {
  const pendingCount = summary.purchaseDraftCount + summary.saleDraftCount;

  return {
    pendingCount,
    metrics: [
      {
        label: '今日销售额',
        value: formatCurrency(summary.todaySaleAmount),
        detail: `${formatNumber(summary.todaySaleOrderCount)} 张销售订单`,
      },
      {
        label: '今日采购额',
        value: formatCurrency(summary.todayPurchaseAmount),
        detail: `${formatNumber(summary.todayPurchaseOrderCount)} 张采购订单`,
      },
      {
        label: '待审核订单',
        value: formatNumber(pendingCount),
        detail: `采购 ${formatNumber(summary.purchaseDraftCount)} 笔，销售 ${formatNumber(summary.saleDraftCount)} 笔`,
      },
      {
        label: '库存风险商品',
        value: formatNumber(summary.warningProductCount),
        detail: `共 ${formatNumber(summary.productCount)} 项商品`,
      },
    ],
    tasks: [
      {
        label: '采购订单待审核',
        description: '审核后将自动完成商品入库',
        value: `${formatNumber(summary.purchaseDraftCount)} 笔`,
        href: '/purchase-orders',
      },
      {
        label: '销售订单待审核',
        description: '确认可用库存并完成销售出库',
        value: `${formatNumber(summary.saleDraftCount)} 笔`,
        href: '/sale-orders',
      },
      {
        label: '库存预警商品',
        description: '建议及时补货或调整安全库存',
        value: `${formatNumber(summary.warningProductCount)} 项`,
        href: '/inventory-warnings',
      },
    ],
    orderStatus: [
      {
        status: '草稿',
        purchase: summary.purchaseDraftCount,
        sale: summary.saleDraftCount,
      },
      {
        status: '已审核',
        purchase: summary.purchaseApprovedCount,
        sale: summary.saleApprovedCount,
      },
      {
        status: '已取消',
        purchase: summary.purchaseCanceledCount,
        sale: summary.saleCanceledCount,
      },
    ],
    movements: [
      {
        type: '采购入库',
        orders: `${formatNumber(summary.todayPurchaseOrderCount)} 张采购单`,
        quantity: formatNumber(summary.todayInQuantity),
        amount: formatCurrency(summary.todayPurchaseAmount),
      },
      {
        type: '销售出库',
        orders: `${formatNumber(summary.todaySaleOrderCount)} 张销售单`,
        quantity: formatNumber(summary.todayOutQuantity),
        amount: formatCurrency(summary.todaySaleAmount),
      },
    ],
  };
}
