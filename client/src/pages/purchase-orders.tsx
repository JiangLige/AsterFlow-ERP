import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, Search, Select, SelectItem } from '@carbon/react';
import Layout from '@/components/Layout';
import BusinessDataTable from '@/components/ui/BusinessDataTable';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import OverflowActions, { type OverflowAction } from '@/components/ui/OverflowActions';
import PageHeader from '@/components/ui/PageHeader';
import StatusTag from '@/components/ui/StatusTag';
import { apiRequest } from '@/lib/api';

type PurchaseOrder = {
  id: number;
  orderNo: string;
  supplierId: number;
  supplierName: string;
  totalAmount: number;
  status: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
};

type PageResponse<T> = {
  records: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

type PendingAction = {
  kind: 'approve' | 'cancel' | 'delete';
  order: PurchaseOrder;
};

const headers = [
  { key: 'orderNo', header: '单号' },
  { key: 'counterparty', header: '往来单位' },
  { key: 'amount', header: '金额' },
  { key: 'status', header: '状态' },
  { key: 'remark', header: '备注' },
  { key: 'createdAt', header: '创建时间' },
  { key: 'actions', header: '操作' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function modalContent(action: PendingAction | null) {
  if (!action) {
    return {
      confirmLabel: '',
      danger: false,
      description: '',
      title: '',
    };
  }

  if (action.kind === 'approve') {
    return {
      confirmLabel: '确认审核',
      danger: false,
      description: `审核采购单“${action.order.orderNo}”后，将按明细数量增加商品库存。`,
      title: '审核采购单',
    };
  }

  if (action.kind === 'cancel') {
    return {
      confirmLabel: '确认取消',
      danger: true,
      description: `取消采购单“${action.order.orderNo}”后，将扣回该订单审核时增加的商品库存。`,
      title: '取消采购单',
    };
  }

  return {
    confirmLabel: '确认删除',
    danger: true,
    description: `删除草稿采购单“${action.order.orderNo}”。草稿尚未影响商品库存。`,
    title: '删除采购单',
  };
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadOrders = async (
    targetPage: number,
    targetPageSize: number,
    targetKeyword: string,
    targetStatus: string,
  ) => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams();
      query.set('page', String(targetPage));
      query.set('size', String(targetPageSize));

      if (targetKeyword.trim()) {
        query.set('keyword', targetKeyword.trim());
      }

      if (targetStatus) {
        query.set('status', targetStatus);
      }

      const data = await apiRequest<PageResponse<PurchaseOrder>>(
        `/api/purchase-orders?${query.toString()}`,
      );

      setOrders(data.records);
      setPage(data.page);
      setPageSize(data.size);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载采购单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRole(localStorage.getItem('role') || '');
    void loadOrders(1, 10, '', '');
  }, []);

  async function handleConfirmedAction() {
    if (!pendingAction) {
      return;
    }

    const action = pendingAction;
    setSubmitting(true);
    setError('');

    try {
      const suffix = action.kind === 'delete' ? '' : `/${action.kind}`;
      const method = action.kind === 'delete' ? 'DELETE' : 'PATCH';
      await apiRequest(`/api/purchase-orders/${action.order.id}${suffix}`, { method });

      setPendingAction(null);
      const targetPage = action.kind === 'delete' && orders.length === 1 && page > 1
        ? page - 1
        : page;
      await loadOrders(targetPage, pageSize, keyword, status);
    } catch (err) {
      setPendingAction(null);
      setError(
        err instanceof Error
          ? err.message
          : action.kind === 'approve'
            ? '审核入库失败'
            : action.kind === 'cancel'
              ? '取消采购单失败'
              : '删除采购单失败',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function orderActions(order: PurchaseOrder): OverflowAction[] {
    const actions: OverflowAction[] = [
      {
        label: '查看',
        onClick: () => void router.push(`/purchase-orders/${order.id}`),
      },
    ];

    if (order.status === 'DRAFT') {
      actions.push(
        {
          label: '编辑',
          onClick: () => void router.push(`/purchase-orders/${order.id}/edit`),
        },
        {
          label: '审核通过',
          onClick: () => setPendingAction({ kind: 'approve', order }),
        },
      );

      if (role === 'ADMIN') {
        actions.push({
          label: '删除',
          danger: true,
          onClick: () => setPendingAction({ kind: 'delete', order }),
        });
      }
    }

    if (order.status === 'APPROVED') {
      actions.push({
        label: '取消订单',
        danger: true,
        onClick: () => setPendingAction({ kind: 'cancel', order }),
      });
    }

    return actions;
  }

  const rows = orders.map((order) => ({
    id: String(order.id),
    orderNo: <span className="numeric">{order.orderNo}</span>,
    counterparty: order.supplierName,
    amount: <span className="numeric">{formatCurrency(order.totalAmount)}</span>,
    status: <StatusTag status={order.status} />,
    remark: order.remark || '-',
    createdAt: order.createdAt,
    actions: <OverflowActions actions={orderActions(order)} />,
  }));
  const modal = modalContent(pendingAction);

  return (
    <Layout>
      <div className="operations-list operations-list--orders">
        <PageHeader
          title="采购单列表"
          description="跟踪采购草稿、审核入库和取消流转。"
          actions={(
            <Link className="cds--btn cds--btn--primary" href="/purchase-orders/new">
              新增采购单
            </Link>
          )}
        />

        <BusinessDataTable
          empty={orders.length === 0}
          emptyDescription="新增采购单后，订单会显示在这里。"
          emptyTitle="暂无采购单数据"
          error={error}
          headers={headers}
          loading={loading}
          onRetry={() => void loadOrders(page, pageSize, keyword, status)}
          pagination={{
            page,
            pageSize,
            total,
            onChange: ({ page: targetPage, pageSize: targetPageSize }) => {
              setPageSize(targetPageSize);
              void loadOrders(targetPage, targetPageSize, keyword, status);
            },
          }}
          rows={rows}
          toolbar={(
            <>
              <Search
                id="purchase-order-search"
                labelText="搜索采购单"
                onChange={(event) => {
                  const nextKeyword = event.target.value;
                  setKeyword(nextKeyword);

                  if (nextKeyword === '') {
                    void loadOrders(1, pageSize, '', status);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void loadOrders(1, pageSize, keyword, status);
                  }
                }}
                placeholder="输入采购单号或供应商"
                size="lg"
                value={keyword}
              />
              <Select
                id="purchase-order-status"
                labelText="订单状态"
                onChange={(event) => setStatus(event.target.value)}
                size="lg"
                value={status}
              >
                <SelectItem text="全部状态" value="" />
                <SelectItem text="草稿" value="DRAFT" />
                <SelectItem text="已审核" value="APPROVED" />
                <SelectItem text="已取消" value="CANCELED" />
              </Select>
              <Button
                disabled={loading}
                kind="secondary"
                onClick={() => void loadOrders(1, pageSize, keyword, status)}
                size="lg"
                type="button"
              >
                {loading ? '查询中...' : '查询'}
              </Button>
            </>
          )}
        />

        <ConfirmActionModal
          confirmLabel={modal.confirmLabel}
          danger={modal.danger}
          description={modal.description}
          onClose={() => setPendingAction(null)}
          onConfirm={() => void handleConfirmedAction()}
          open={pendingAction !== null}
          submitting={submitting}
          title={modal.title}
        />
      </div>
    </Layout>
  );
}
