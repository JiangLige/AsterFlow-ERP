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

type Customer = {
  id: number;
  customerCode: string;
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

const headers = [
  { key: 'customerCode', header: '编码' },
  { key: 'name', header: '名称' },
  { key: 'contactName', header: '联系人' },
  { key: 'phone', header: '电话' },
  { key: 'address', header: '地址' },
  { key: 'status', header: '状态' },
  { key: 'actions', header: '操作' },
];

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [role, setRole] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadCustomers(targetPage = page) {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams();
      query.set('page', String(targetPage));
      query.set('size', '10');

      if (keyword.trim()) {
        query.set('keyword', keyword.trim());
      }

      const data = await apiRequest<PageResponse<Customer>>(`/api/customers?${query.toString()}`);

      setCustomers(data.records);
      setPage(data.page);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '客户加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await apiRequest(`/api/customers/${pendingDelete.id}`, {
        method: 'DELETE',
      });

      setPendingDelete(null);
      await loadCustomers(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除客户失败');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    setRole(localStorage.getItem('role') || '');
    loadCustomers(1);
  }, []);

  function customerActions(customer: Customer, currentRole: string): OverflowAction[] {
    const actions: OverflowAction[] = [
      {
        label: '编辑',
        onClick: () => void router.push(`/customers/${customer.id}/edit`),
      },
    ];

    if (currentRole === 'ADMIN') {
      actions.push({
        label: '删除',
        danger: true,
        onClick: () => setPendingDelete(customer),
      });
    }

    return actions;
  }

  const rows = customers.map((customer) => ({
    id: String(customer.id),
    customerCode: <span className="numeric">{customer.customerCode}</span>,
    name: customer.name,
    contactName: customer.contactName || '-',
    phone: <span className="numeric">{customer.phone || '-'}</span>,
    address: customer.address || '-',
    status: <StatusTag status={customer.status} />,
    actions: <OverflowActions actions={customerActions(customer, role)} />,
  }));

  return (
    <Layout>
      <div className="master-data-list master-data-list--contacts">
        <PageHeader
          title="客户管理"
          description="维护客户编码、联系人和业务状态。"
          actions={(
            <Link className="cds--btn cds--btn--primary" href="/customers/new">
              新增客户
            </Link>
          )}
        />

        <BusinessDataTable
          empty={customers.length === 0}
          emptyDescription="新增客户后，客户档案会显示在这里。"
          emptyTitle="暂无客户数据"
          error={error}
          headers={headers}
          loading={loading}
          onRetry={() => void loadCustomers(page)}
          pagination={{
            page,
            pageSize: 10,
            total,
            onChange: ({ page: targetPage }: { page: number }) => void loadCustomers(targetPage),
          }}
          rows={rows}
          toolbar={(
            <>
              <Search
                id="customer-search"
                labelText="搜索客户"
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void loadCustomers(1);
                  }
                }}
                placeholder="输入客户编码、名称或电话"
                size="lg"
                value={keyword}
              />
              <Button
                disabled={loading}
                kind="secondary"
                onClick={() => void loadCustomers(1)}
                size="lg"
                type="button"
              >
                {loading ? '查询中...' : '查询'}
              </Button>
            </>
          )}
        />

        <ConfirmActionModal
          confirmLabel="确认删除"
          danger
          description={pendingDelete
            ? `删除客户“${pendingDelete.name}”后，客户档案将不再显示。`
            : ''}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => void handleDelete()}
          open={pendingDelete !== null}
          submitting={submitting}
          title="删除客户"
        />
      </div>
    </Layout>
  );
}
