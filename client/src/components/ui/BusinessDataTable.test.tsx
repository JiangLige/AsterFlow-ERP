import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BusinessDataTable from './BusinessDataTable';

describe('BusinessDataTable', () => {
  it('renders Carbon-compatible headers, row values, and the total summary', () => {
    render(
      <BusinessDataTable
        headers={[
          { key: 'code', header: '编码' },
          { key: 'name', header: '名称' },
        ]}
        rows={[{ id: 'product-1', code: 'P-001', name: '测试商品' }]}
        pagination={{
          page: 1,
          pageSize: 10,
          total: 1,
          onChange: vi.fn(),
        }}
      />,
    );

    expect(screen.getByRole('columnheader', { name: '编码' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '名称' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'P-001' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '测试商品' })).toBeInTheDocument();
    expect(screen.getByText('共 1 条')).toBeInTheDocument();
  });
});
