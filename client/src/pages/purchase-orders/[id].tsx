import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import OrderDetailLayout from '@/components/orders/OrderDetailLayout';
import DataState from '@/components/ui/DataState';
import StatusTag from '@/components/ui/StatusTag';
import { apiRequest } from '@/lib/api';

type PurchaseOrderItem = { id: number; productId: number; productCode: string; productName: string; quantity: number; price: number; amount: number };
type PurchaseOrder = { id: number; orderNo: string; supplierId: number; supplierName: string; totalAmount: number; status: string; remark: string; createdAt: string; updatedAt: string; items: PurchaseOrderItem[] };
function formatCurrency(value: number) { return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 }).format(value || 0); }

export default function PurchaseOrderDetailPage() {
  const router = useRouter();
  const purchaseOrderId = typeof router.query.id === 'string' ? router.query.id : '';
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!router.isReady || !purchaseOrderId) return;
    async function loadDetail() {
      setLoading(true); setError('');
      try { setOrder(await apiRequest<PurchaseOrder>(`/api/purchase-orders/${purchaseOrderId}`)); }
      catch (requestError) { setError(requestError instanceof Error ? requestError.message : '加载采购单详情失败'); }
      finally { setLoading(false); }
    }
    loadDetail();
  }, [router.isReady, purchaseOrderId]);
  return (
    <Layout>
      <DataState error={error} loading={loading} skeleton="text" />
      {order ? <OrderDetailLayout
        backHref="/purchase-orders"
        items={order.items}
        status={order.status}
        summary={[
          { label: '单号', value: order.orderNo },
          { label: '供应商', value: order.supplierName },
          { label: '状态', value: <StatusTag status={order.status} /> },
          { label: '总金额', value: formatCurrency(order.totalAmount), numeric: true },
          { label: '创建时间', value: order.createdAt },
          { label: '备注', value: order.remark || '-' },
        ]}
        title="采购单详情"
      /> : null}
    </Layout>
  );
}
