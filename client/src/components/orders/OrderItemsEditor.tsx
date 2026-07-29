import { Button, NumberInput, Select, SelectItem, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@carbon/react';
import { TrashCan } from '@carbon/icons-react';

export type EditableOrderItem = { productId: string; quantity: string | number; price: string | number };
export type ProductOption = { id: number; productCode: string; name: string; price?: number; cost?: number; stock?: number };
export type OrderItemsEditorProps<T extends EditableOrderItem> = {
  items: T[];
  products: ProductOption[];
  priceLabel: string;
  disableOutOfStockOptions?: boolean;
  onAdd: () => void;
  onChange: (index: number, field: keyof T, value: string) => void;
  onRemove: (index: number) => void;
};

function formatAmount(quantity: string | number, price: string | number) {
  const amount = Number(quantity) * Number(price);
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
}

export default function OrderItemsEditor<T extends EditableOrderItem>({
  items,
  products,
  priceLabel,
  disableOutOfStockOptions = false,
  onAdd,
  onChange,
  onRemove,
}: OrderItemsEditorProps<T>) {
  return (
    <section className="aster-order-items" aria-labelledby="order-items-heading">
      <div className="aster-order-items__header">
        <h2 id="order-items-heading">商品明细</h2>
        <Button kind="tertiary" onClick={onAdd} size="sm" type="button">
          添加明细
        </Button>
      </div>
      <div className="aster-table-scroll aster-order-items__table">
        <Table aria-label="订单商品明细" size="md">
          <TableHead>
            <TableRow>
              <TableHeader>商品</TableHeader>
              <TableHeader>数量</TableHeader>
              <TableHeader>{priceLabel}</TableHeader>
              <TableHeader className="numeric">金额</TableHeader>
              <TableHeader className="aster-order-items__actions">操作</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={`${item.productId}-${index}`}>
                <TableCell>
                  <Select
                    id={`order-item-product-${index}`}
                    labelText="商品"
                    onChange={(event) => onChange(index, 'productId' as keyof T, event.target.value)}
                    value={item.productId}
                  >
                    <SelectItem text="请选择商品" value="" />
                    {products.map((product) => (
                      <SelectItem
                        key={product.id}
                        disabled={disableOutOfStockOptions && product.stock !== undefined && product.stock <= 0}
                        text={`${product.productCode} - ${product.name}${product.stock === undefined ? '' : ` - 库存 ${product.stock}`}`}
                        value={String(product.id)}
                      />
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <NumberInput
                    allowEmpty
                    hideSteppers
                    id={`order-item-quantity-${index}`}
                    label="数量"
                    min={1}
                    onChange={(_event, state) => onChange(index, 'quantity' as keyof T, String(state.value))}
                    step={1}
                    value={item.quantity}
                  />
                </TableCell>
                <TableCell>
                  <NumberInput
                    allowEmpty
                    hideSteppers
                    id={`order-item-price-${index}`}
                    label={priceLabel}
                    min={0.01}
                    onChange={(_event, state) => onChange(index, 'price' as keyof T, String(state.value))}
                    step={0.01}
                    value={item.price}
                  />
                </TableCell>
                <TableCell className="numeric">{formatAmount(item.quantity, item.price)}</TableCell>
                <TableCell className="aster-order-items__actions">
                  <Button
                    aria-label={`删除明细 ${index + 1}`}
                    disabled={items.length === 1}
                    hasIconOnly
                    iconDescription={`删除明细 ${index + 1}`}
                    kind="danger--ghost"
                    onClick={() => onRemove(index)}
                    renderIcon={TrashCan}
                    size="sm"
                    tooltipPosition="left"
                    type="button"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
