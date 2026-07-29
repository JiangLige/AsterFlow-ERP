import { useEffect, useState } from 'react';
import { Form, InlineNotification, Select, SelectItem, TextInput } from '@carbon/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import OrderItemsEditor from '@/components/orders/OrderItemsEditor';
import DataState from '@/components/ui/DataState';
import FormActions from '@/components/ui/FormActions';
import PageHeader from '@/components/ui/PageHeader';
import { apiRequest } from '@/lib/api';

type SaleItemForm = { productId: string; quantity: string; price: string };
type SaleOrderItem = { productId: number; quantity: number; price: number };
type SaleOrder = { id: number; orderNo: string; customerId: number; remark?: string; status: string; items: SaleOrderItem[] };
type PageResponse<T> = { records: T[]; total: number; page: number; size: number; pages: number };
type Customer = { id: number; name: string; customerCode: string; status: string };
type Product = { id: number; productCode: string; name: string; price: number; stock: number; status: string };

export default function SaleOrderEditPage() {
  const router = useRouter();
  const saleOrderId = typeof router.query.id === 'string' ? router.query.id : '';
  const [orderNo, setOrderNo] = useState(''); const [customerId, setCustomerId] = useState(''); const [remark, setRemark] = useState(''); const [status, setStatus] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]); const [products, setProducts] = useState<Product[]>([]); const [items, setItems] = useState<SaleItemForm[]>([]);
  const [loading, setLoading] = useState(false); const [loaded, setLoaded] = useState(false); const [submitting, setSubmitting] = useState(false); const [loadError, setLoadError] = useState(''); const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!router.isReady || !saleOrderId) return;
    async function loadData() {
      setLoading(true); setLoaded(false); setLoadError('');
      try {
        const [order, customerData, productData] = await Promise.all([
          apiRequest<SaleOrder>(`/api/sale-orders/${saleOrderId}`),
          apiRequest<PageResponse<Customer>>('/api/customers?page=1&size=100&status=ACTIVE'),
          apiRequest<PageResponse<Product>>('/api/products?page=1&size=100&status=ACTIVE'),
        ]);
        setOrderNo(order.orderNo); setCustomerId(String(order.customerId)); setRemark(order.remark || ''); setStatus(order.status);
        setCustomers(customerData.records); setProducts(productData.records);
        setItems(order.items.map((item) => ({ productId: String(item.productId), quantity: String(item.quantity), price: String(item.price) })));
        setLoaded(true);
      } catch (requestError) { setLoadError(requestError instanceof Error ? requestError.message : '加载销售单失败'); }
      finally { setLoading(false); }
    }
    loadData();
  }, [router.isReady, saleOrderId]);

  function addItem() { setItems([...items, { productId: '', quantity: '', price: '' }]); }
  function removeItem(index: number) { if (items.length > 1) setItems(items.filter((_, itemIndex) => itemIndex !== index)); }
  function updateItem(index: number, field: keyof SaleItemForm, value: string) { const nextItems = [...items]; nextItems[index] = { ...nextItems[index], [field]: value }; setItems(nextItems); }
  function updateProduct(index: number, productId: string) { const selectedProduct = products.find((product) => String(product.id) === productId); const nextItems = [...items]; nextItems[index] = { ...nextItems[index], productId, price: selectedProduct ? String(selectedProduct.price) : nextItems[index].price }; setItems(nextItems); }
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); setFormError('');
    if (status !== 'DRAFT') { setFormError('只有草稿销售单可以修改'); return; }
    if (!customerId || Number(customerId) <= 0) { setFormError('请选择客户'); return; }
    const normalizedItems = items.map((item) => ({ productId: Number(item.productId), quantity: Number(item.quantity), price: Number(item.price) }));
    const invalidItem = normalizedItems.some((item) => !item.productId || item.productId <= 0 || !item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0 || !item.price || item.price <= 0);
    if (invalidItem) { setFormError('商品、数量、销售价都必须填写；数量必须是正整数，销售价必须大于0'); return; }
    const quantityByProductId = new Map<number, number>();
    for (const item of normalizedItems) quantityByProductId.set(item.productId, (quantityByProductId.get(item.productId) ?? 0) + item.quantity);
    for (const [productId, quantity] of quantityByProductId) { const product = products.find((item) => item.id === productId); if (product && quantity > product.stock) { setFormError(`商品库存不足：${product.name}，当前库存 ${product.stock}，本次销售 ${quantity}`); return; } }
    setSubmitting(true);
    try {
      await apiRequest(`/api/sale-orders/${saleOrderId}`, { method: 'PUT', body: JSON.stringify({ customerId: Number(customerId), remark, items: normalizedItems }) });
      router.push(`/sale-orders/${saleOrderId}`);
    } catch (requestError) { setFormError(requestError instanceof Error ? requestError.message : '修改销售单失败'); }
    finally { setSubmitting(false); }
  }

  const optionsEmpty = loaded && !loadError && (customers.length === 0 || products.length === 0);
  const formReady = loaded && !loadError && !optionsEmpty;

  return (
    <Layout>
      <main className="aster-form-page aster-order-form-page">
        <PageHeader backHref={`/sale-orders/${saleOrderId}`} description={orderNo ? `单号：${orderNo}` : undefined} title="编辑销售单" />
        <DataState
          empty={optionsEmpty}
          emptyDescription="请先维护至少一条启用的客户和商品。"
          emptyTitle="无法编辑销售单"
          error={loadError}
          loading={loading || (!loaded && !loadError)}
          skeleton="text"
        />
        {formError ? <InlineNotification hideCloseButton kind="error" lowContrast role="alert" subtitle={formError} title="销售单保存失败" /> : null}
        {status && status !== 'DRAFT' ? <InlineNotification hideCloseButton kind="error" lowContrast role="alert" subtitle="当前销售单不是草稿状态，不能修改" title="不可编辑" /> : null}
        {formReady ? <Form className="aster-form-grid" onSubmit={handleSubmit}>
          <Select disabled={status !== 'DRAFT'} id="sale-customer" labelText="客户" onChange={(event) => setCustomerId(event.target.value)} required value={customerId}>
            <SelectItem text="请选择客户" value="" />
            {customers.map((customer) => <SelectItem key={customer.id} text={`${customer.customerCode} - ${customer.name}`} value={String(customer.id)} />)}
          </Select>
          <TextInput disabled={status !== 'DRAFT'} id="sale-remark" labelText="备注" onChange={(event) => setRemark(event.target.value)} value={remark} />
          <fieldset className="aster-form-field--full aster-order-items-fieldset" disabled={status !== 'DRAFT'}>
            <OrderItemsEditor disableOutOfStockOptions items={items} onAdd={addItem} onChange={(index, field, value) => field === 'productId' ? updateProduct(index, value) : updateItem(index, field, value)} onRemove={removeItem} priceLabel="销售价" products={products} />
          </fieldset>
          <FormActions cancelHref={`/sale-orders/${saleOrderId}`} submitLabel="保存修改" submitting={submitting || status !== 'DRAFT'} />
        </Form> : null}
      </main>
    </Layout>
  );
}
