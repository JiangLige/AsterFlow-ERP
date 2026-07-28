import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BusinessDataTable from './BusinessDataTable';

afterEach(cleanup);

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

  it('renders a toolbar and ReactNode cell content inside the scroll container', () => {
    const { container } = render(
      <BusinessDataTable
        headers={[
          { key: 'code', header: '编码' },
          { key: 'name', header: '名称' },
        ]}
        pagination={{ page: 1, pageSize: 10, total: 1, onChange: vi.fn() }}
        rows={[
          {
            id: 'product-1',
            code: <code>P-001</code>,
            name: <strong>测试商品</strong>,
          },
        ]}
        toolbar={<button type="button">新建商品</button>}
      />,
    );

    expect(screen.getByRole('button', { name: '新建商品' })).toBeInTheDocument();
    expect(screen.getByText('P-001').tagName).toBe('CODE');
    expect(screen.getByText('测试商品').tagName).toBe('STRONG');

    const scrollContainer = screen.getByRole('table').closest('.aster-table-scroll');
    expect(scrollContainer).not.toBeNull();
    expect(scrollContainer?.nextElementSibling).toHaveClass('cds--pagination');
    expect(container.querySelector('.aster-toolbar')).not.toBeNull();
  });

  it('forwards pagination changes from the Carbon control', () => {
    const onChange = vi.fn();
    render(
      <BusinessDataTable
        headers={[{ key: 'code', header: '编码' }]}
        pagination={{ page: 1, pageSize: 10, total: 25, onChange }}
        rows={[{ id: 'product-1', code: 'P-001' }]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '下一页' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ page: 2, pageSize: 10 }));
  });

  it('offers standard Carbon page sizes and preserves a non-standard current size', () => {
    render(
      <BusinessDataTable
        headers={[{ key: 'code', header: '编码' }]}
        pagination={{
          page: 1,
          pageSize: 25,
          pageSizes: [100],
          total: 75,
          onChange: vi.fn(),
        }}
        rows={[{ id: 'product-1', code: 'P-001' }]}
      />,
    );

    const pageSizeValues = screen
      .getAllByRole('option')
      .map((option) => option.getAttribute('value'));

    expect(pageSizeValues).toEqual(expect.arrayContaining(['10', '20', '25', '50', '100']));
  });

  it('prioritizes loading, error, empty, and data states in that order', () => {
    const baseProps = {
      headers: [{ key: 'code', header: '编码' }],
      rows: [{ id: 'product-1', code: 'P-001' }],
      pagination: { page: 1, pageSize: 10, total: 1, onChange: vi.fn() },
    };
    const { rerender } = render(
      <BusinessDataTable
        {...baseProps}
        empty
        emptyTitle="没有商品"
        error="加载商品失败"
        loading
      />,
    );

    expect(screen.getByLabelText('正在加载')).toBeInTheDocument();
    expect(screen.queryByText('加载商品失败')).not.toBeInTheDocument();
    expect(screen.queryByText('没有商品')).not.toBeInTheDocument();
    expect(screen.queryByText('P-001')).not.toBeInTheDocument();

    rerender(
      <BusinessDataTable
        {...baseProps}
        empty
        emptyTitle="没有商品"
        error="加载商品失败"
      />,
    );
    expect(screen.getByText('加载商品失败')).toBeInTheDocument();
    expect(screen.queryByText('没有商品')).not.toBeInTheDocument();

    rerender(<BusinessDataTable {...baseProps} empty emptyTitle="没有商品" />);
    expect(screen.getByText('没有商品')).toBeInTheDocument();
    expect(screen.queryByText('P-001')).not.toBeInTheDocument();

    rerender(<BusinessDataTable {...baseProps} />);
    expect(screen.getByText('P-001')).toBeInTheDocument();
    expect(screen.getByText('共 1 条')).toBeInTheDocument();
  });
});
