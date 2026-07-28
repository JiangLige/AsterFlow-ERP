import { Button, Search } from '@carbon/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import BusinessDataTable from '@/components/ui/BusinessDataTable';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import OverflowActions, { type OverflowAction } from '@/components/ui/OverflowActions';
import PageHeader from '@/components/ui/PageHeader';
import StatusTag from '@/components/ui/StatusTag';
import { apiRequest } from '@/lib/api';

type Supplier = {
  id: number;
  supplierCode: string;
  name: string;
  contactName: string;
  phone: string;
  address: string;
  status: string;
};

type PageResponse<T> = {
  records: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

type PendingStatusChange = {
  supplier: Supplier;
  nextStatus: 'ACTIVE' | 'INACTIVE';
};

const headers = [
  { key: 'supplierCode', header: '编码' },
  { key: 'name', header: '名称' },
  { key: 'contactName', header: '联系人' },
  { key: 'phone', header: '电话' },
  { key: 'address', header: '地址' },
  { key: 'status', header: '状态' },
  { key: 'actions', header: '操作' },
];

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [role, setRole] = useState('');
  const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadSuppliers(targetPage = page) {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams();
      query.set('page', String(targetPage));
      query.set('size', '10');

      if (keyword.trim()) {
        query.set('keyword', keyword.trim());
      }

      const data = await apiRequest<PageResponse<Supplier>>(`/api/suppliers?${query.toString()}`);

      setSuppliers(data.records);
      setPage(data.page);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '供应商加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeStatus(id: number, nextStatus: 'ACTIVE' | 'INACTIVE') {
    const actionText = nextStatus === 'ACTIVE' ? '启用' : '停用';
    setSubmitting(true);
    setError('');

    try {
      const action = nextStatus === 'ACTIVE' ? 'active' : 'inactive';

      await apiRequest(`/api/suppliers/${id}/${action}`, {
        method: 'PATCH',
      });

      setPendingStatusChange(null);
      await loadSuppliers(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : `${actionText}供应商失败`);
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    setRole(localStorage.getItem('role') || '');
    loadSuppliers(1);
  }, []);

  function supplierActions(supplier: Supplier, currentRole: string): OverflowAction[] {
    const actions: OverflowAction[] = [
      {
        label: '编辑',
        onClick: () => void router.push(`/suppliers/${supplier.id}/edit`),
      },
    ];

    if (currentRole === 'ADMIN' && supplier.status === 'ACTIVE') {
      actions.push({
        label: '停用',
        danger: true,
        onClick: () => setPendingStatusChange({ supplier, nextStatus: 'INACTIVE' }),
      });
    }

    if (currentRole === 'ADMIN' && supplier.status === 'INACTIVE') {
      actions.push({
        label: '启用',
        onClick: () => setPendingStatusChange({ supplier, nextStatus: 'ACTIVE' }),
      });
    }

    return actions;
  }

  const rows = suppliers.map((supplier) => ({
    id: String(supplier.id),
    supplierCode: <span className="numeric">{supplier.supplierCode}</span>,
    name: supplier.name,
    contactName: supplier.contactName || '-',
    phone: <span className="numeric">{supplier.phone || '-'}</span>,
    address: supplier.address || '-',
    status: <StatusTag status={supplier.status} />,
    actions: <OverflowActions actions={supplierActions(supplier, role)} />,
  }));

  const actionText = pendingStatusChange?.nextStatus === 'ACTIVE' ? '启用' : '停用';

  return (
    <Layout>
      <div className="master-data-list master-data-list--contacts">
        <PageHeader
          title="供应商管理"
          description="管理供应商资料、联系方式和启停状态。"
          actions={(
            <Link className="cds--btn cds--btn--primary" href="/suppliers/new">
              新增供应商
            </Link>
          )}
        />

        <BusinessDataTable
          empty={suppliers.length === 0}
          emptyDescription="新增供应商后，供应网络会显示在这里。"
          emptyTitle="暂无供应商数据"
          error={error}
          headers={headers}
          loading={loading}
          onRetry={() => void loadSuppliers(page)}
          pagination={{
            page,
            pageSize: 10,
            total,
            onChange: ({ page: targetPage }: { page: number }) => void loadSuppliers(targetPage),
          }}
          rows={rows}
          toolbar={(
            <>
              <Search
                id="supplier-search"
                labelText="搜索供应商"
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void loadSuppliers(1);
                  }
                }}
                placeholder="输入供应商编码、名称或电话"
                size="lg"
                value={keyword}
              />
              <Button
                disabled={loading}
                kind="secondary"
                onClick={() => void loadSuppliers(1)}
                size="lg"
                type="button"
              >
                {loading ? '查询中...' : '查询'}
              </Button>
            </>
          )}
        />

        <ConfirmActionModal
          confirmLabel={`确认${actionText}`}
          danger={pendingStatusChange?.nextStatus === 'INACTIVE'}
          description={pendingStatusChange
            ? `${actionText}供应商“${pendingStatusChange.supplier.name}”后，相关业务状态会立即更新。`
            : ''}
          onClose={() => setPendingStatusChange(null)}
          onConfirm={() => {
            if (pendingStatusChange) {
              void handleChangeStatus(pendingStatusChange.supplier.id, pendingStatusChange.nextStatus);
            }
          }}
          open={pendingStatusChange !== null}
          submitting={submitting}
          title={`${actionText}供应商`}
        />
      </div>
    </Layout>
  );
}
