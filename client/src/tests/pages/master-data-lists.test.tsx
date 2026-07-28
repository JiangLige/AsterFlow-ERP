import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ComponentType,
  InputHTMLAttributes,
  ReactNode,
} from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CustomersPage from '@/pages/customers';
import ProductsPage from '@/pages/products';
import SuppliersPage from '@/pages/suppliers';
import { apiRequest } from '@/lib/api';

const { push } = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/router', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) => (
    <a data-next-link="true" {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@carbon/react', () => ({
  Button: ({
    children,
    kind: _kind,
    size: _size,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: string; size?: string }) => (
    <button {...props}>{children}</button>
  ),
  Search: ({
    labelText,
    size: _size,
    ...props
  }: InputHTMLAttributes<HTMLInputElement> & { labelText: string; size?: string }) => (
    <input aria-label={labelText} {...props} />
  ),
}));

vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/PageHeader', () => ({
  default: ({ actions, title }: { actions?: ReactNode; title: string }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  ),
}));

vi.mock('@/components/ui/BusinessDataTable', () => ({
  default: ({
    error,
    loading,
    pagination,
    rows,
    toolbar,
  }: {
    error?: string;
    loading?: boolean;
    pagination: {
      page: number;
      pageSize: number;
      onChange: (value: { page: number; pageSize: number }) => void;
    };
    rows: Array<{ id: string; [key: string]: ReactNode }>;
    toolbar?: ReactNode;
  }) => (
    <section>
      {toolbar}
      {error ? <div role="alert">{error}</div> : null}
      <button
        onClick={() => pagination.onChange({ page: 2, pageSize: 20 })}
        type="button"
      >
        每页 20 条
      </button>
      <button
        onClick={() => pagination.onChange({ page: 2, pageSize: pagination.pageSize })}
        type="button"
      >
        第 2 页
      </button>
      {!loading
        ? rows.map((row) => (
            <div key={row.id}>
              {Object.entries(row)
                .filter(([key]) => key !== 'id')
                .map(([key, value]) => <div key={key}>{value}</div>)}
            </div>
          ))
        : null}
    </section>
  ),
}));

vi.mock('@/components/ui/OverflowActions', () => ({
  default: ({
    actions,
  }: {
    actions: Array<{ disabled?: boolean; label: string; onClick?: () => void }>;
  }) => (
    <>
      {actions.map((action) => (
        <button
          disabled={action.disabled}
          key={action.label}
          onClick={action.onClick}
          type="button"
        >
          {action.label}
        </button>
      ))}
    </>
  ),
}));

vi.mock('@/components/ui/ConfirmActionModal', () => ({
  default: ({
    confirmLabel,
    onConfirm,
    open,
    title,
  }: {
    confirmLabel: string;
    onConfirm: () => void;
    open: boolean;
    title: string;
  }) => open ? (
    <section aria-label={title} role="dialog">
      <button onClick={onConfirm} type="button">{confirmLabel}</button>
    </section>
  ) : null,
}));

vi.mock('@/components/ui/StatusTag', () => ({
  default: ({ status }: { status: string }) => (
    <span>{status === 'ACTIVE' ? '启用' : '停用'}</span>
  ),
}));

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}));

const product = {
  id: 398,
  productCode: 'SP-100398',
  name: '工业级扭矩扳手',
  category: '工业工具',
  unit: '把',
  price: 268,
  cost: 188,
  stock: 42,
  minStock: 12,
  status: 'ACTIVE',
};

const supplier = {
  id: 88,
  supplierCode: 'SUP-0088',
  name: '华东工业供应',
  contactName: '周工',
  phone: '021-55558888',
  address: '上海市浦东新区',
  status: 'ACTIVE',
};

const customer = {
  id: 66,
  customerCode: 'CUS-0066',
  name: '北辰制造',
  contactName: '陈经理',
  phone: '010-55556666',
  address: '北京市海淀区',
  status: 'ACTIVE',
};

type PageCase = {
  Component: ComponentType;
  endpoint: string;
  record: Record<string, unknown>;
  searchLabel: string;
  visibleCode: string;
};

const pageCases: PageCase[] = [
  {
    Component: ProductsPage,
    endpoint: '/api/products',
    record: product,
    searchLabel: '搜索商品',
    visibleCode: product.productCode,
  },
  {
    Component: SuppliersPage,
    endpoint: '/api/suppliers',
    record: supplier,
    searchLabel: '搜索供应商',
    visibleCode: supplier.supplierCode,
  },
  {
    Component: CustomersPage,
    endpoint: '/api/customers',
    record: customer,
    searchLabel: '搜索客户',
    visibleCode: customer.customerCode,
  },
];

function paginatedResponse(url: string, record: Record<string, unknown>) {
  const query = new URLSearchParams(url.split('?')[1] || '');
  const page = Number(query.get('page') || 1);
  const size = Number(query.get('size') || 10);

  return {
    records: [record],
    total: 65,
    page,
    size,
    pages: Math.ceil(65 / size),
  };
}

function arrangeSuccessfulList(endpoint: string, record: Record<string, unknown>) {
  vi.mocked(apiRequest).mockImplementation(async (url, options) => {
    if (options?.method) {
      return {} as never;
    }

    expect(url).toMatch(new RegExp(`^${endpoint.replaceAll('/', '\\/')}`));
    return paginatedResponse(url, record) as never;
  });
}

function listRequestUrls(endpoint: string) {
  return vi.mocked(apiRequest).mock.calls
    .filter(([url, options]) => url.startsWith(`${endpoint}?`) && !options?.method)
    .map(([url]) => url);
}

function expectLastQuery(
  endpoint: string,
  expected: { keyword?: string; page: string; size: string },
) {
  const urls = listRequestUrls(endpoint);
  const query = new URLSearchParams(urls.at(-1)?.split('?')[1] || '');

  expect(query.get('page')).toBe(expected.page);
  expect(query.get('size')).toBe(expected.size);
  expect(query.get('keyword')).toBe(expected.keyword ?? null);
}

beforeEach(() => {
  localStorage.setItem('role', 'ADMIN');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('master data pagination and search', () => {
  it.each(pageCases)(
    '$endpoint sends the page size selected by Carbon Pagination',
    async ({ Component, endpoint, record, visibleCode }) => {
      arrangeSuccessfulList(endpoint, record);
      render(<Component />);
      await screen.findByText(visibleCode);

      fireEvent.click(screen.getByRole('button', { name: '每页 20 条' }));

      await waitFor(() => {
        expectLastQuery(endpoint, { page: '2', size: '20' });
      });
    },
  );

  it.each(pageCases)(
    '$endpoint clears search on page 1 with the current page size and no stale keyword',
    async ({ Component, endpoint, record, searchLabel, visibleCode }) => {
      arrangeSuccessfulList(endpoint, record);
      render(<Component />);
      await screen.findByText(visibleCode);

      fireEvent.click(screen.getByRole('button', { name: '每页 20 条' }));
      await waitFor(() => {
        expectLastQuery(endpoint, { page: '2', size: '20' });
      });

      const search = screen.getByRole('textbox', { name: searchLabel });
      fireEvent.change(search, { target: { value: '华东' } });
      fireEvent.keyDown(search, { key: 'Enter' });
      await waitFor(() => {
        expectLastQuery(endpoint, { keyword: '华东', page: '1', size: '20' });
      });

      fireEvent.change(search, { target: { value: '' } });

      await waitFor(() => {
        expectLastQuery(endpoint, { page: '1', size: '20' });
      });
    },
  );
});

describe('master data mutation recovery', () => {
  it.each([
    {
      Component: ProductsPage,
      actionLabel: '停用',
      confirmLabel: '确认停用',
      endpoint: '/api/products',
      method: 'DELETE',
      mutationUrl: '/api/products/398',
      record: product,
      visibleCode: product.productCode,
    },
    {
      Component: SuppliersPage,
      actionLabel: '停用',
      confirmLabel: '确认停用',
      endpoint: '/api/suppliers',
      method: 'PATCH',
      mutationUrl: '/api/suppliers/88/inactive',
      record: supplier,
      visibleCode: supplier.supplierCode,
    },
    {
      Component: CustomersPage,
      actionLabel: '删除',
      confirmLabel: '确认删除',
      endpoint: '/api/customers',
      method: 'DELETE',
      mutationUrl: '/api/customers/66',
      record: customer,
      visibleCode: customer.customerCode,
    },
  ])(
    '$endpoint closes the confirmation and exposes the mutation error',
    async ({
      Component,
      actionLabel,
      confirmLabel,
      method,
      mutationUrl,
      record,
      visibleCode,
    }) => {
      vi.mocked(apiRequest).mockImplementation(async (url, options) => {
        if (options?.method) {
          throw new Error('服务器拒绝操作');
        }

        return paginatedResponse(url, record) as never;
      });

      render(<Component />);
      await screen.findByText(visibleCode);
      fireEvent.click(screen.getByRole('button', { name: actionLabel }));
      fireEvent.click(screen.getByRole('button', { name: confirmLabel }));

      expect(await screen.findByRole('alert')).toHaveTextContent('服务器拒绝操作');
      expect(apiRequest).toHaveBeenCalledWith(mutationUrl, { method });
      expect(screen.queryByRole('button', { name: confirmLabel })).not.toBeInTheDocument();
    },
  );

  it('loads the previous customer page after deleting its final row', async () => {
    arrangeSuccessfulList('/api/customers', customer);
    render(<CustomersPage />);
    await screen.findByText(customer.customerCode);

    fireEvent.click(screen.getByRole('button', { name: '第 2 页' }));
    await waitFor(() => {
      expectLastQuery('/api/customers', { page: '2', size: '10' });
    });

    fireEvent.click(screen.getByRole('button', { name: '删除' }));
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/customers/66', { method: 'DELETE' });
      expectLastQuery('/api/customers', { page: '1', size: '10' });
    });
  });
});
