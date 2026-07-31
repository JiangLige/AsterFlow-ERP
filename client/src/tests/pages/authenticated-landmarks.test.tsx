import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductCreatePage from '@/pages/products/new';
import PurchaseOrderDetailPage from '@/pages/purchase-orders/[id]';

const router = vi.hoisted(() => ({
  isReady: true,
  pathname: '/products/new',
  push: vi.fn(),
  query: { id: '21' },
  replace: vi.fn(),
}));
const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('next/router', () => ({ useRouter: () => router }));
vi.mock('@/components/shell/AppHeader', () => ({ default: () => <header /> }));
vi.mock('@/components/shell/ModuleNavigation', () => ({ default: () => <nav /> }));
vi.mock('@/lib/api', () => ({ apiRequest }));

beforeEach(() => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('role', 'ADMIN');
  apiRequest.mockReset();
  router.pathname = '/products/new';
  router.query = { id: '21' };
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('authenticated landmark contract', () => {
  it('renders exactly one main landmark for an authenticated product form', async () => {
    render(<ProductCreatePage />);

    await screen.findByRole('heading', { name: '新增商品' });
    expect(document.querySelectorAll('main')).toHaveLength(1);
  });

  it('renders exactly one main landmark for an authenticated order detail', async () => {
    router.pathname = '/purchase-orders/[id]';
    apiRequest.mockResolvedValue({
      orderNo: 'PO-21', supplierName: '华东供应商', totalAmount: 50, status: 'DRAFT', remark: '', createdAt: '2026-07-31', items: [],
    });

    render(<PurchaseOrderDetailPage />);

    await waitFor(() => expect(screen.getByRole('heading', { name: '采购单详情' })).toBeInTheDocument());
    expect(document.querySelectorAll('main')).toHaveLength(1);
  });
});
