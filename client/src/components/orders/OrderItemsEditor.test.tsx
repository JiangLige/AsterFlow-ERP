import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OrderItemsEditor from './OrderItemsEditor';

afterEach(cleanup);

describe('OrderItemsEditor', () => {
  it('renders editable order values and delegates field and delete actions', () => {
    const onAdd = vi.fn();
    const onChange = vi.fn();
    const onRemove = vi.fn();

    render(
      <OrderItemsEditor
        items={[
          { productId: '3', quantity: '2', price: '18.5' },
          { productId: '3', quantity: '1', price: '18.5' },
        ]}
        products={[{ id: 3, productCode: 'P-003', name: '演示商品', price: 18.5, cost: 12, stock: 8 }]}
        priceLabel="单价"
        onAdd={onAdd}
        onChange={onChange}
        onRemove={onRemove}
      />
    );

    expect(screen.getAllByLabelText('商品')[0]).toHaveValue('3');
    expect(screen.getAllByLabelText('数量')[0]).toHaveValue(2);
    expect(screen.getAllByLabelText('单价')[0]).toHaveValue(18.5);

    fireEvent.change(screen.getAllByLabelText('商品')[0], { target: { value: '3' } });
    fireEvent.change(screen.getAllByLabelText('数量')[0], { target: { value: '4' } });
    fireEvent.change(screen.getAllByLabelText('单价')[0], { target: { value: '20' } });
    const deleteButton = screen.getByRole('button', { name: '删除明细 2' });
    expect(deleteButton).toHaveClass('cds--btn--ghost');
    expect(deleteButton).toHaveClass('aster-order-items__delete');
    expect(deleteButton).not.toHaveClass('cds--btn--danger--ghost');
    fireEvent.click(deleteButton);

    expect(onChange).toHaveBeenNthCalledWith(1, 0, 'productId', '3');
    expect(onChange).toHaveBeenNthCalledWith(2, 0, 'quantity', '4');
    expect(onChange).toHaveBeenNthCalledWith(3, 0, 'price', '20');
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('disables the only delete action and out-of-stock sale options', () => {
    render(
      <OrderItemsEditor
        disableOutOfStockOptions
        items={[{ productId: '3', quantity: '2', price: '18.5' }]}
        products={[
          { id: 3, productCode: 'P-003', name: '可售商品', stock: 8 },
          { id: 4, productCode: 'P-004', name: '缺货商品', stock: 0 },
        ]}
        priceLabel="销售价"
        onAdd={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: '删除明细 1' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'P-004 - 缺货商品 - 库存 0' })).toBeDisabled();
  });
});
