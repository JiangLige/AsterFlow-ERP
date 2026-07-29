import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductCreatePage from '@/pages/products/new';
import { apiRequest } from '@/lib/api';

const { push } = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/router', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(apiRequest).mockResolvedValue({} as never);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ProductCreatePage', () => {
  it('keeps the visible field order and submits the exact product contract', async () => {
    render(<ProductCreatePage />);

    const labels = Array.from(document.querySelectorAll('label')).map((label) =>
      label.textContent?.trim(),
    );
    expect(labels).toEqual([
      '商品编码',
      '商品名称',
      '分类',
      '单位',
      '售价',
      '成本价',
      '库存',
      '状态',
      '描述',
    ]);
    labels.forEach((label) => {
      expect(screen.getByText(label as string, { selector: 'label' })).toBeVisible();
    });

    fireEvent.change(screen.getByLabelText('商品编码'), {
      target: { value: 'SP-900001' },
    });
    fireEvent.change(screen.getByLabelText('商品名称'), {
      target: { value: '测试商品' },
    });
    fireEvent.submit(screen.getByRole('button', { name: '保存商品' }).closest('form')!);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledOnce();
    });

    const [url, requestInit] = vi.mocked(apiRequest).mock.calls[0];
    expect(url).toBe('/api/products');
    expect(requestInit?.method).toBe('POST');
    expect(JSON.parse(requestInit?.body as string)).toEqual({
      productCode: 'SP-900001',
      name: '测试商品',
      category: '',
      unit: '',
      price: 0,
      cost: 0,
      stock: 0,
      status: 'ACTIVE',
      description: '',
    });
    expect(push).toHaveBeenCalledWith('/products');
  });
});
