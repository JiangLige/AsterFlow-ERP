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
import AuditLogsPage from '@/pages/audit-logs';
import InventoryWarningsPage from '@/pages/inventory-warnings';
import SaleOrdersPage from '@/pages/sale-orders';
import StockRecordsPage from '@/pages/stock-records';
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
      <select aria-label={labelText} {...props}>{children}</select>
    </label>
  ),
  SelectItem: ({
    text,
    ...props
  }: OptionHTMLAttributes<HTMLOptionElement> & { text?: string }) => (
    <option {...props}>{text}</option>
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
    empty,
    emptyTitle,
    error,
    onRetry,
    pagination,
    rows,
    toolbar,
  }: {
    empty?: boolean;
    emptyTitle?: string;
    error?: string;
    onRetry?: () => void;
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
      {error && onRetry ? <button onClick={onRetry}>重试</button> : null}
      {!error && empty ? <p>{emptyTitle}</p> : null}
      <button
        onClick={() => pagination.onChange({ page: 2, pageSize: 20 })}
        type="button"
      >
        每页 20 条
      </button>
      {rows.map((row) => (
        <article key={row.id}>
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
  default: ({ status }: { status: string }) => <span>{status}</span>,
}));

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}));

function listQuery(endpoint: string) {
  const request = vi.mocked(apiRequest).mock.calls
    .map(([url]) => url)
    .filter((url) => url.startsWith(`${endpoint}?`))
    .at(-1);

  return new URLSearchParams(request?.split('?')[1] ?? '');
}

beforeEach(() => {
  localStorage.setItem('role', 'ADMIN');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('remaining Carbon operations lists', () => {
  it('renders inventory warnings with risk semantics and the underlying product status', async () => {
    vi.mocked(apiRequest).mockResolvedValue([
      {
        id: 2,
        productCode: 'SP-LOW-02',
        name: '低库存扭矩扳手',
        category: '工业工具',
        unit: '把',
        price: 260,
        cost: 180,
        stock: 2,
        minStock: 8,
        status: 'ACTIVE',
      },
    ]);

    render(<InventoryWarningsPage />);

    const code = await screen.findByText('SP-LOW-02');
    const row = code.closest('article');
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText('RISK')).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText('商品状态：启用')).toBeInTheDocument();
  });

  it('retries inventory failures and shows the exact safe-stock empty state', async () => {
    vi.mocked(apiRequest)
      .mockRejectedValueOnce(new Error('预警服务不可用'))
      .mockResolvedValueOnce([]);

    render(<InventoryWarningsPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('预警服务不可用');

    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(await screen.findByText('当前没有低于安全库存的商品')).toBeInTheDocument();
  });

  it('keeps stock keyword and type filters when Carbon changes the page size', async () => {
    vi.mocked(apiRequest).mockImplementation(async (url) => {
      const query = new URLSearchParams(url.split('?')[1] ?? '');
      return {
        records: [],
        total: 0,
        page: Number(query.get('page') ?? 1),
        size: Number(query.get('size') ?? 10),
        pages: 1,
      } as never;
    });

    render(<StockRecordsPage />);
    await waitFor(() => expect(apiRequest).toHaveBeenCalled());

    fireEvent.change(screen.getByRole('textbox', { name: '搜索库存流水' }), {
      target: { value: 'SP-100' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: '流水类型' }), {
      target: { value: 'OUT' },
    });
    fireEvent.click(screen.getByRole('button', { name: '每页 20 条' }));

    await waitFor(() => {
      const query = listQuery('/api/stock-records');
      expect(query.get('page')).toBe('2');
      expect(query.get('size')).toBe('20');
      expect(query.get('keyword')).toBe('SP-100');
      expect(query.get('type')).toBe('OUT');
    });
  });

  it('preserves the audit action and targetType query names', async () => {
    vi.mocked(apiRequest).mockImplementation(async (url) => {
      const query = new URLSearchParams(url.split('?')[1] ?? '');
      return {
        records: [],
        total: 0,
        page: Number(query.get('page') ?? 1),
        size: Number(query.get('size') ?? 10),
        pages: 1,
      } as never;
    });

    render(<AuditLogsPage />);
    await waitFor(() => expect(apiRequest).toHaveBeenCalled());

    fireEvent.change(screen.getByRole('textbox', { name: '搜索审计日志' }), {
      target: { value: '王工' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: '审计动作' }), {
      target: { value: 'PURCHASE_APPROVE' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: '对象类型' }), {
      target: { value: 'PURCHASE_ORDER' },
    });
    fireEvent.click(screen.getByRole('button', { name: '每页 20 条' }));

    await waitFor(() => {
      const query = listQuery('/api/audit-logs');
      expect(query.get('size')).toBe('20');
      expect(query.get('keyword')).toBe('王工');
      expect(query.get('action')).toBe('PURCHASE_APPROVE');
      expect(query.get('targetType')).toBe('PURCHASE_ORDER');
    });
  });

  it('uses the sale order action contract and confirms stock reduction before approval', async () => {
    vi.mocked(apiRequest).mockImplementation(async (_url, options) => {
      if (options?.method) {
        return {} as never;
      }

      return {
        records: [{
          id: 9,
          orderNo: 'SO-202607-0009',
          customerName: '北辰制造',
          totalAmount: 9200,
          status: 'DRAFT',
          remark: '',
          createdAt: '2026-07-29 10:00:00',
          updatedAt: '2026-07-29 10:00:00',
        }],
        total: 1,
        page: 1,
        size: 10,
        pages: 1,
      } as never;
    });

    render(<SaleOrdersPage />);
    const code = await screen.findByText('SO-202607-0009');
    const row = code.closest('article');
    expect(row).not.toBeNull();

    const actions = within(row as HTMLElement).getByRole('group', { name: '订单操作' });
    expect(within(actions).getAllByRole('button').map((button) => button.textContent)).toEqual([
      '查看',
      '编辑',
      '审核通过',
      '删除',
    ]);

    fireEvent.click(within(actions).getByRole('button', { name: '审核通过' }));
    expect(apiRequest).not.toHaveBeenCalledWith('/api/sale-orders/9/approve', {
      method: 'PATCH',
    });

    const dialog = screen.getByRole('dialog', { name: '审核销售单' });
    expect(within(dialog).getByText(/扣减商品库存/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: '确认审核' }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/sale-orders/9/approve', {
        method: 'PATCH',
      });
    });
  });
});
