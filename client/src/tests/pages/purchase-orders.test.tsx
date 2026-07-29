import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  OptionHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PurchaseOrdersPage from '@/pages/purchase-orders';
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
  Select: ({
    children,
    labelText,
    size: _size,
    ...props
  }: SelectHTMLAttributes<HTMLSelectElement> & {
    children: ReactNode;
    labelText: string;
    size?: string;
  }) => (
    <label>
      {labelText}
      <select {...props}>{children}</select>
    </label>
  ),
  SelectItem: (props: OptionHTMLAttributes<HTMLOptionElement>) => <option {...props} />,
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
    pagination,
    rows,
    toolbar,
  }: {
    error?: string;
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
      {rows.map((row) => (
        <article aria-label={`订单 ${row.orderNo}`} key={row.id}>
          {Object.entries(row)
            .filter(([key]) => key !== 'id')
            .map(([key, value]) => <div key={key}>{value}</div>)}
        </article>
      ))}
    </section>
  ),
}));

vi.mock('@/components/ui/OverflowActions', () => ({
  default: ({
    actions,
  }: {
    actions: Array<{ label: string; onClick?: () => void }>;
  }) => (
    <div aria-label="订单操作" role="group">
      {actions.map((action) => (
        <button key={action.label} onClick={action.onClick} type="button">
          {action.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/components/ui/ConfirmActionModal', () => ({
  default: ({
    confirmLabel,
    description,
    onConfirm,
    open,
    title,
  }: {
    confirmLabel: string;
    description: string;
    onConfirm: () => void;
    open: boolean;
    title: string;
  }) => open ? (
    <section aria-label={title} role="dialog">
      <p>{description}</p>
      <button onClick={onConfirm} type="button">{confirmLabel}</button>
    </section>
  ) : null,
}));

vi.mock('@/components/ui/StatusTag', () => ({
  default: ({ status }: { status: string }) => (
    <span>{status === 'DRAFT' ? '草稿' : status}</span>
  ),
}));

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}));

const draftOrder = {
  id: 7,
  orderNo: 'PO-202607-0007',
  supplierId: 19,
  supplierName: '华东工业供应',
  totalAmount: 18765.5,
  status: 'DRAFT',
  remark: '月末补货',
  createdAt: '2026-07-29 09:30:00',
  updatedAt: '2026-07-29 09:30:00',
};

beforeEach(() => {
  localStorage.setItem('role', 'ADMIN');
  vi.mocked(apiRequest).mockImplementation(async (url, options) => {
    if (options?.method) {
      return {} as never;
    }

    const query = new URLSearchParams(url.split('?')[1] ?? '');
    const page = Number(query.get('page') ?? 1);
    const size = Number(query.get('size') ?? 10);

    return {
      records: [draftOrder],
      total: 1,
      page,
      size,
      pages: Math.max(1, Math.ceil(1 / size)),
    } as never;
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('PurchaseOrdersPage', () => {
  it('shows the Carbon draft status and exactly four administrator actions', async () => {
    render(<PurchaseOrdersPage />);

    const orderNumber = await screen.findByText(draftOrder.orderNo);
    const row = orderNumber.closest('article');

    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText('草稿')).toBeInTheDocument();

    const actionGroup = within(row as HTMLElement).getByRole('group', { name: '订单操作' });
    expect(within(actionGroup).getAllByRole('button').map((button) => button.textContent)).toEqual([
      '查看',
      '编辑',
      '审核通过',
      '删除',
    ]);
  });

  it('calls the approve API only after the controlled confirmation is submitted', async () => {
    render(<PurchaseOrdersPage />);

    const orderNumber = await screen.findByText(draftOrder.orderNo);
    const row = orderNumber.closest('article');
    expect(row).not.toBeNull();

    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: '审核通过' }));

    expect(apiRequest).not.toHaveBeenCalledWith(
      '/api/purchase-orders/7/approve',
      expect.objectContaining({ method: 'PATCH' }),
    );

    const dialog = screen.getByRole('dialog', { name: '审核采购单' });
    expect(within(dialog).getByText(/增加商品库存/)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: '确认审核' }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/purchase-orders/7/approve', {
        method: 'PATCH',
      });
    });
  });

  it('uses Carbon page size changes and clears search without a stale keyword', async () => {
    render(<PurchaseOrdersPage />);
    await screen.findByText(draftOrder.orderNo);

    fireEvent.click(screen.getByRole('button', { name: '每页 20 条' }));

    await waitFor(() => {
      const request = vi.mocked(apiRequest).mock.calls
        .map(([url]) => url)
        .filter((url) => url.startsWith('/api/purchase-orders?'))
        .at(-1);
      const query = new URLSearchParams(request?.split('?')[1] ?? '');

      expect(query.get('page')).toBe('2');
      expect(query.get('size')).toBe('20');
    });

    const search = screen.getByRole('textbox', { name: '搜索采购单' });
    fireEvent.change(search, { target: { value: '华东' } });
    fireEvent.keyDown(search, { key: 'Enter' });

    await waitFor(() => {
      const request = vi.mocked(apiRequest).mock.calls
        .map(([url]) => url)
        .filter((url) => url.startsWith('/api/purchase-orders?'))
        .at(-1);
      const query = new URLSearchParams(request?.split('?')[1] ?? '');

      expect(query.get('keyword')).toBe('华东');
      expect(query.get('page')).toBe('1');
      expect(query.get('size')).toBe('20');
    });

    fireEvent.change(search, { target: { value: '' } });

    await waitFor(() => {
      const request = vi.mocked(apiRequest).mock.calls
        .map(([url]) => url)
        .filter((url) => url.startsWith('/api/purchase-orders?'))
        .at(-1);
      const query = new URLSearchParams(request?.split('?')[1] ?? '');

      expect(query.get('keyword')).toBeNull();
      expect(query.get('page')).toBe('1');
      expect(query.get('size')).toBe('20');
    });
  });

  it('closes a failed deletion confirmation and exposes the error', async () => {
    vi.mocked(apiRequest).mockImplementation(async (_url, options) => {
      if (options?.method === 'DELETE') {
        throw new Error('草稿删除失败');
      }

      return {
        records: [draftOrder],
        total: 1,
        page: 1,
        size: 10,
        pages: 1,
      } as never;
    });

    render(<PurchaseOrdersPage />);
    const orderNumber = await screen.findByText(draftOrder.orderNo);
    const row = orderNumber.closest('article');
    expect(row).not.toBeNull();

    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: '删除' }));
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('草稿删除失败');
    expect(screen.queryByRole('dialog', { name: '删除采购单' })).not.toBeInTheDocument();
  });

  it('loads the previous page after deleting the final order on page two', async () => {
    render(<PurchaseOrdersPage />);
    await screen.findByText(draftOrder.orderNo);

    fireEvent.click(screen.getByRole('button', { name: '第 2 页' }));
    await waitFor(() => {
      const request = vi.mocked(apiRequest).mock.calls
        .map(([url]) => url)
        .filter((url) => url.startsWith('/api/purchase-orders?'))
        .at(-1);
      const query = new URLSearchParams(request?.split('?')[1] ?? '');
      expect(query.get('page')).toBe('2');
    });

    fireEvent.click(screen.getByRole('button', { name: '删除' }));
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }));

    await waitFor(() => {
      const request = vi.mocked(apiRequest).mock.calls
        .map(([url]) => url)
        .filter((url) => url.startsWith('/api/purchase-orders?'))
        .at(-1);
      const query = new URLSearchParams(request?.split('?')[1] ?? '');

      expect(apiRequest).toHaveBeenCalledWith('/api/purchase-orders/7', {
        method: 'DELETE',
      });
      expect(query.get('page')).toBe('1');
    });
  });
});
