import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductsPage from '@/pages/products';
import { apiRequest } from '@/lib/api';

const push = vi.fn();

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

vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}));

beforeEach(() => {
  localStorage.setItem('role', 'ADMIN');
  vi.mocked(apiRequest).mockResolvedValue({
    records: [
      {
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
      },
    ],
    total: 1,
    page: 1,
    size: 10,
    pages: 1,
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('ProductsPage', () => {
  it('renders one Carbon overflow action for an administrator product row', async () => {
    render(<ProductsPage />);

    const productCode = await screen.findByText('SP-100398');
    const row = productCode.closest('tr');

    expect(row).not.toBeNull();
    expect(within(row as HTMLTableRowElement).getAllByRole('button', { name: '更多操作' })).toHaveLength(1);
    expect(within(row as HTMLTableRowElement).queryAllByRole('link')).toHaveLength(0);
    expect(within(row as HTMLTableRowElement).getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: '商品管理' })).toBeInTheDocument();
    expect(within(row as HTMLTableRowElement).getByText('¥268.00')).toBeInTheDocument();
    expect(within(row as HTMLTableRowElement).getByText('启用')).toBeInTheDocument();
  });
});
