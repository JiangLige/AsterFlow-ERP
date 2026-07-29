import type { ComponentType, ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductEditPage from '@/pages/products/[id]/edit';
import ProductStockAdjustPage from '@/pages/products/[id]/stock';
import SupplierCreatePage from '@/pages/suppliers/new';
import SupplierEditPage from '@/pages/suppliers/[id]/edit';
import CustomerCreatePage from '@/pages/customers/new';
import CustomerEditPage from '@/pages/customers/[id]/edit';
import { apiRequest } from '@/lib/api';

const { push, routerState } = vi.hoisted(() => ({
  push: vi.fn(),
  routerState: {
    isReady: true,
    query: {} as Record<string, string>,
  },
}));

vi.mock('next/router', () => ({
  useRouter: () => ({ ...routerState, push }),
}));

vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}));

beforeEach(() => {
  routerState.isReady = true;
  routerState.query = {};
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function mutationCall(method: string) {
  return vi.mocked(apiRequest).mock.calls.find(([, options]) => options?.method === method);
}

describe('product edit and stock contracts', () => {
  it('loads a product and PUTs the unchanged product payload', async () => {
    routerState.query = { id: '398' };
    vi.mocked(apiRequest).mockResolvedValue({
      productCode: 'SP-100398',
      name: '工业级扭矩扳手',
      category: '工业工具',
      unit: '把',
      price: 268,
      cost: 188,
      stock: 42,
      status: 'ACTIVE',
      description: '校准工具',
    } as never);

    render(<ProductEditPage />);

    expect(await screen.findByDisplayValue('SP-100398')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('商品名称'), {
      target: { value: '精密扭矩扳手' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存商品' }));

    await waitFor(() => {
      expect(mutationCall('PUT')).toBeDefined();
    });
    const [url, options] = mutationCall('PUT')!;
    expect(url).toBe('/api/products/398');
    expect(JSON.parse(options?.body as string)).toEqual({
      productCode: 'SP-100398',
      name: '精密扭矩扳手',
      category: '工业工具',
      unit: '把',
      price: 268,
      cost: 188,
      stock: 42,
      status: 'ACTIVE',
      description: '校准工具',
    });
    expect(push).toHaveBeenCalledWith('/products');
  });

  it.each([
    { label: '入库', type: 'IN', quantity: '6', changeQuantity: 6 },
    { label: '出库', type: 'OUT', quantity: '6', changeQuantity: -6 },
    { label: '盘点调整', type: 'ADJUST', quantity: '-3', changeQuantity: -3 },
  ])(
    '$type preserves getChangeQuantity semantics',
    async ({ label, type, quantity, changeQuantity }) => {
      routerState.query = { id: '398' };
      vi.mocked(apiRequest).mockImplementation(async (_url, options) => {
        if (options?.method === 'PATCH') {
          return {} as never;
        }
        return {
          id: 398,
          productCode: 'SP-100398',
          name: '工业级扭矩扳手',
          unit: '把',
          stock: 42,
          minStock: 12,
          status: 'ACTIVE',
        } as never;
      });

      render(<ProductStockAdjustPage />);

      expect(await screen.findByText(/SP-100398/)).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText(label));
      fireEvent.change(screen.getByLabelText('变化数量'), {
        target: { value: quantity },
      });
      fireEvent.change(screen.getByLabelText('备注'), {
        target: { value: '季度盘点' },
      });
      fireEvent.click(screen.getByRole('button', { name: '确认调整' }));

      await waitFor(() => {
        expect(mutationCall('PATCH')).toBeDefined();
      });
      const [url, options] = mutationCall('PATCH')!;
      expect(url).toBe('/api/products/398/stock');
      expect(JSON.parse(options?.body as string)).toEqual({
        type,
        changeQuantity,
        remark: '季度盘点',
      });
    },
  );
});

type CreateCase = {
  Component: ComponentType;
  codeLabel: string;
  codeName: string;
  codeValue: string;
  endpoint: string;
  nameValue: string;
  saveLabel: string;
};

const createCases: CreateCase[] = [
  {
    Component: SupplierCreatePage,
    codeLabel: '供应商编码',
    codeName: 'supplierCode',
    codeValue: 'SUP-9001',
    endpoint: '/api/suppliers',
    nameValue: '华东精工供应',
    saveLabel: '保存供应商',
  },
  {
    Component: CustomerCreatePage,
    codeLabel: '客户编码',
    codeName: 'customerCode',
    codeValue: 'CUS-9001',
    endpoint: '/api/customers',
    nameValue: '北辰制造',
    saveLabel: '保存客户',
  },
];

describe('supplier and customer create contracts', () => {
  it.each(createCases)(
    '$endpoint POST payload does not drift',
    async ({ Component, codeLabel, codeName, codeValue, endpoint, nameValue, saveLabel }) => {
      vi.mocked(apiRequest).mockResolvedValue({} as never);
      render(<Component />);

      fireEvent.change(screen.getByLabelText(codeLabel), {
        target: { value: codeValue },
      });
      fireEvent.change(screen.getByLabelText(codeLabel.replace('编码', '名称')), {
        target: { value: nameValue },
      });
      fireEvent.click(screen.getByRole('button', { name: saveLabel }));

      await waitFor(() => {
        expect(mutationCall('POST')).toBeDefined();
      });
      const [url, options] = mutationCall('POST')!;
      expect(url).toBe(endpoint);
      expect(JSON.parse(options?.body as string)).toEqual({
        [codeName]: codeValue,
        name: nameValue,
        contactName: '',
        phone: '',
        address: '',
        status: 'ACTIVE',
      });
    },
  );
});

describe('supplier and customer edit contracts', () => {
  it.each([
    {
      Component: SupplierEditPage,
      endpoint: '/api/suppliers/88',
      record: {
        id: 88,
        supplierCode: 'SUP-0088',
        name: '华东工业供应',
        contactName: '周工',
        phone: '021-55558888',
        address: '上海市浦东新区',
        status: 'ACTIVE',
      },
      saveLabel: '保存供应商',
    },
    {
      Component: CustomerEditPage,
      endpoint: '/api/customers/66',
      record: {
        id: 66,
        customerCode: 'CUS-0066',
        name: '北辰制造',
        contactName: '陈经理',
        phone: '010-55556666',
        address: '北京市海淀区',
        status: 'ACTIVE',
      },
      saveLabel: '保存客户',
    },
  ])('$endpoint loads and PUTs the complete payload', async ({ Component, endpoint, record, saveLabel }) => {
    routerState.query = { id: endpoint.split('/').at(-1)! };
    vi.mocked(apiRequest).mockResolvedValue(record as never);

    render(<Component />);

    expect(await screen.findByDisplayValue(record.name)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('联系人'), {
      target: { value: '新的联系人' },
    });
    fireEvent.click(screen.getByRole('button', { name: saveLabel }));

    await waitFor(() => {
      expect(mutationCall('PUT')).toBeDefined();
    });
    const [url, options] = mutationCall('PUT')!;
    const { id: _id, ...expectedPayload } = record;
    expect(url).toBe(endpoint);
    expect(JSON.parse(options?.body as string)).toEqual({
      ...expectedPayload,
      contactName: '新的联系人',
    });
  });
});
