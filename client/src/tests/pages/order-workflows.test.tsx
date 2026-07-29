import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const router = vi.hoisted(() => ({ isReady: true, push: vi.fn(), query: {} as Record<string, string> }));
const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('next/router', () => ({ useRouter: () => router }));
vi.mock('@/components/Layout', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/ui/PageHeader', () => ({ default: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/components/ui/FormActions', () => ({
  default: ({ submitLabel }: { submitLabel: string }) => <button type="submit">{submitLabel}</button>,
}));
vi.mock('@/components/ui/DataState', () => ({
  default: ({ loading, error }: { loading: boolean; error: string }) => loading ? <p>加载中</p> : error ? <p role="alert">{error}</p> : null,
}));
vi.mock('@/components/orders/OrderItemsEditor', () => ({
  default: ({ items, onChange, onRemove, priceLabel }: {
    items: Array<{ productId: string; quantity: string; price: string }>;
    onChange: (index: number, field: 'productId' | 'quantity' | 'price', value: string) => void;
    onRemove: (index: number) => void;
    priceLabel: string;
  }) => <div>
    {items.map((item, index) => <div key={index}>
      <select aria-label="商品" onChange={(event) => onChange(index, 'productId', event.target.value)} value={item.productId}><option value="">请选择商品</option><option value="3">商品 3</option></select>
      <input aria-label="数量" onChange={(event) => onChange(index, 'quantity', event.target.value)} value={item.quantity} />
      <input aria-label={priceLabel} onChange={(event) => onChange(index, 'price', event.target.value)} value={item.price} />
      <button aria-label={`删除明细 ${index + 1}`} onClick={() => onRemove(index)} type="button">删除</button>
    </div>)}
  </div>,
}));
vi.mock('@/components/orders/OrderDetailLayout', () => ({
  default: ({ title, status, summary }: { title: string; status: string; summary: Array<{ label: string; value: React.ReactNode }> }) => <section>
    <h1>{title}</h1><p>{status}</p>{summary.map((item) => <dl key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></dl>)}
  </section>,
}));
vi.mock('@/lib/api', () => ({ apiRequest }));

import PurchaseOrderCreatePage from '@/pages/purchase-orders/new';
import PurchaseOrderEditPage from '@/pages/purchase-orders/[id]/edit';
import PurchaseOrderDetailPage from '@/pages/purchase-orders/[id]';
import SaleOrderCreatePage from '@/pages/sale-orders/new';
import SaleOrderEditPage from '@/pages/sale-orders/[id]/edit';
import SaleOrderDetailPage from '@/pages/sale-orders/[id]';

function postRequest(path: string) {
  return apiRequest.mock.calls.find(([url, options]) => url === path && options?.method === 'POST');
}

function putRequest(path: string) {
  return apiRequest.mock.calls.find(([url, options]) => url === path && options?.method === 'PUT');
}

beforeEach(() => {
  router.isReady = true;
  router.query = {};
  router.push.mockReset();
  apiRequest.mockReset();
});

afterEach(cleanup);

describe('order workflow contracts', () => {
  it('posts normalized purchase items and redirects after create', async () => {
    apiRequest.mockImplementation(async (url: string) => {
      if (url.startsWith('/api/suppliers')) return { records: [{ id: 7, supplierCode: 'S-007', name: '供应商' }] };
      if (url.startsWith('/api/products')) return { records: [{ id: 3, productCode: 'P-003', name: '商品', cost: 12, stock: 8 }] };
      return {};
    });
    render(<PurchaseOrderCreatePage />);
    await waitFor(() => expect(screen.getByLabelText('供应商')).toHaveValue(''));
    fireEvent.change(screen.getByLabelText('供应商'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('备注'), { target: { value: '补货' } });
    fireEvent.change(screen.getByLabelText('商品'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('数量'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('采购价'), { target: { value: '18.5' } });
    fireEvent.click(screen.getByRole('button', { name: '保存采购单' }));
    await waitFor(() => expect(postRequest('/api/purchase-orders')).toBeDefined());
    expect(JSON.parse(String(postRequest('/api/purchase-orders')![1].body))).toEqual({ supplierId: 7, remark: '补货', items: [{ productId: 3, quantity: 2, price: 18.5 }] });
    expect(router.push).toHaveBeenCalledWith('/purchase-orders');
  });

  it('blocks insufficient sale stock then posts its normalized payload', async () => {
    apiRequest.mockImplementation(async (url: string) => {
      if (url.startsWith('/api/customers')) return { records: [{ id: 4, customerCode: 'C-004', name: '客户' }] };
      if (url.startsWith('/api/products')) return { records: [{ id: 3, productCode: 'P-003', name: '商品', price: 20, stock: 2 }] };
      return {};
    });
    render(<SaleOrderCreatePage />);
    await waitFor(() => expect(screen.getByLabelText('客户')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('客户'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('商品'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('数量'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('销售价'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: '保存销售单' }));
    expect(await screen.findByText('商品库存不足：商品，当前库存 2，本次销售 3')).toBeInTheDocument();
    expect(postRequest('/api/sale-orders')).toBeUndefined();
    fireEvent.change(screen.getByLabelText('数量'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: '保存销售单' }));
    await waitFor(() => expect(postRequest('/api/sale-orders')).toBeDefined());
    expect(JSON.parse(String(postRequest('/api/sale-orders')![1].body))).toEqual({ customerId: 4, remark: '', items: [{ productId: 3, quantity: 2, price: 20 }] });
    expect(router.push).toHaveBeenCalledWith('/sale-orders');
  });

  it('loads and updates purchase and sale draft routes with their original paths', async () => {
    router.query = { id: '12' };
    apiRequest.mockImplementation(async (url: string) => {
      if (url === '/api/purchase-orders/12') return { orderNo: 'PO-12', supplierId: 7, remark: '', status: 'DRAFT', items: [{ productId: 3, quantity: 1, price: 12 }] };
      if (url.startsWith('/api/suppliers')) return { records: [{ id: 7, supplierCode: 'S-007', name: '供应商' }] };
      if (url.startsWith('/api/products')) return { records: [{ id: 3, productCode: 'P-003', name: '商品', cost: 12, stock: 10 }] };
      return {};
    });
    render(<PurchaseOrderEditPage />);
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/api/purchase-orders/12'));
    await waitFor(() => expect(screen.getByRole('button', { name: '保存修改' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }));
    await waitFor(() => expect(putRequest('/api/purchase-orders/12')).toBeDefined());
    expect(router.push).toHaveBeenCalledWith('/purchase-orders/12');

    cleanup(); router.push.mockReset(); apiRequest.mockReset(); router.query = { id: '13' };
    apiRequest.mockImplementation(async (url: string) => {
      if (url === '/api/sale-orders/13') return { orderNo: 'SO-13', customerId: 4, remark: '', status: 'DRAFT', items: [{ productId: 3, quantity: 1, price: 20 }] };
      if (url.startsWith('/api/customers')) return { records: [{ id: 4, customerCode: 'C-004', name: '客户' }] };
      if (url.startsWith('/api/products')) return { records: [{ id: 3, productCode: 'P-003', name: '商品', price: 20, stock: 10 }] };
      return {};
    });
    render(<SaleOrderEditPage />);
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/api/sale-orders/13'));
    await waitFor(() => expect(screen.getByRole('button', { name: '保存修改' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }));
    await waitFor(() => expect(putRequest('/api/sale-orders/13')).toBeDefined());
    expect(router.push).toHaveBeenCalledWith('/sale-orders/13');
  });

  it('loads order details, exposes required summary labels, and renders request errors', async () => {
    router.query = { id: '21' };
    apiRequest.mockResolvedValue({ orderNo: 'PO-21', supplierName: '供应商', totalAmount: 50, status: 'DRAFT', remark: '', createdAt: '2026-07-29', items: [] });
    render(<PurchaseOrderDetailPage />);
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/api/purchase-orders/21'));
    for (const label of ['单号', '供应商', '状态', '总金额', '创建时间', '备注']) {
      expect((await screen.findAllByText(label)).length).toBeGreaterThan(0);
    }

    cleanup(); apiRequest.mockReset(); router.query = { id: '22' }; apiRequest.mockRejectedValue(new Error('加载失败'));
    render(<SaleOrderDetailPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('加载失败');
  });
});
