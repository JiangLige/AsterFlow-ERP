import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Home from '@/pages/index';

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

vi.mock('@/components/ui/PageHeader', () => ({
  default: ({ actions }: { actions?: ReactNode }) => <header>{actions}</header>,
}));

vi.mock('@/components/ui/DataState', () => ({
  default: () => null,
}));

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(() => new Promise(() => {})),
}));

afterEach(cleanup);

describe('Operations dashboard', () => {
  it('uses Next Link for the new purchase order action', () => {
    render(<Home />);

    const createOrderLink = screen.getByRole('link', { name: '新建采购单' });

    expect(createOrderLink).toHaveAttribute('data-next-link', 'true');
    expect(createOrderLink).toHaveAttribute('href', '/purchase-orders/new');
    expect(createOrderLink).toHaveClass('cds--btn', 'cds--btn--primary');
  });
});
