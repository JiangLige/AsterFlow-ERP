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
        items={[{ productId: '3', quantity: '2', price: '18.5' }]}
        products={[{ id: 3, productCode: 'P-003', name: '演示商品', price: 18.5, cost: 12, stock: 8 }]}
        priceLabel="单价"
        onAdd={onAdd}
        onChange={onChange}
        onRemove={onRemove}
      />
    );

    expect(screen.getByLabelText('商品')).toHaveValue('3');
    expect(screen.getByLabelText('数量')).toHaveValue(2);
    expect(screen.getByLabelText('单价')).toHaveValue(18.5);

    fireEvent.change(screen.getByLabelText('商品'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('数量'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('单价'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: '删除明细 1' }));

    expect(onChange).toHaveBeenNthCalledWith(1, 0, 'productId', '3');
    expect(onChange).toHaveBeenNthCalledWith(2, 0, 'quantity', '4');
    expect(onChange).toHaveBeenNthCalledWith(3, 0, 'price', '20');
    expect(onRemove).toHaveBeenCalledWith(0);
  });
});
