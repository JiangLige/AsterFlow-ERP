import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import OrderDetailLayout from '@/components/orders/OrderDetailLayout';
import DataState from '@/components/ui/DataState';
import StatusTag from '@/components/ui/StatusTag';
import { apiRequest } from '@/lib/api';

type SaleOrderItem = { id: number; productId: number; productCode: string; productName: string; quantity: number; price: number; amount: number };
type SaleOrder = { id: number; orderNo: string; customerName: string; totalAmount: number; status: string; remark: string; createdAt: string; updatedAt: string; items: SaleOrderItem[] };
function formatCurrency(value: number) { return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 }).format(value || 0); }

export default function SaleOrderDetailPage() {
  const router = useRouter();
  const saleOrderId = typeof router.query.id === 'string' ? router.query.id : '';
  const [order, setOrder] = useState<SaleOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!router.isReady || !saleOrderId) return;
    async function loadDetail() {
      setLoading(true); setError('');
      try { setOrder(await apiRequest<SaleOrder>(`/api/sale-orders/${saleOrderId}`)); }
      catch (requestError) { setError(requestError instanceof Error ? requestError.message : '加载销售单详情失败'); }
      finally { setLoading(false); }
    }
    loadDetail();
  }, [router.isReady, saleOrderId]);
  return (
    <Layout>
      <DataState error={error} loading={loading} skeleton="text" />
      {order ? <OrderDetailLayout
        backHref="/sale-orders"
        items={order.items}
        status={order.status}
        summary={[
          { label: '单号', value: order.orderNo },
          { label: '客户', value: order.customerName },
          { label: '状态', value: <StatusTag status={order.status} /> },
          { label: '总金额', value: formatCurrency(order.totalAmount), numeric: true },
          { label: '创建时间', value: order.createdAt },
          { label: '备注', value: order.remark || '-' },
        ]}
        title="销售单详情"
      /> : null}
    </Layout>
  );
}
