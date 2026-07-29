import { useEffect, useState } from 'react';
import { Form, InlineNotification, Select, SelectItem, TextInput } from '@carbon/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import OrderItemsEditor from '@/components/orders/OrderItemsEditor';
import DataState from '@/components/ui/DataState';
import FormActions from '@/components/ui/FormActions';
import PageHeader from '@/components/ui/PageHeader';
import { apiRequest } from '@/lib/api';

type PurchaseItemForm = { productId: string; quantity: string; price: string };
type PurchaseOrderItem = { productId: number; quantity: number; price: number };
type PurchaseOrder = { id: number; orderNo: string; supplierId: number; remark?: string; status: string; items: PurchaseOrderItem[] };
type PageResponse<T> = { records: T[]; total: number; page: number; size: number; pages: number };
type Supplier = { id: number; supplierCode: string; name: string; status: string };
type Product = { id: number; productCode: string; name: string; cost: number; stock: number; status: string };

export default function PurchaseOrderEditPage() {
  const router = useRouter();
  const purchaseOrderId = typeof router.query.id === 'string' ? router.query.id : '';
  const [orderNo, setOrderNo] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [remark, setRemark] = useState('');
  const [status, setStatus] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<PurchaseItemForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!router.isReady || !purchaseOrderId) return;
    async function loadData() {
      setLoading(true); setLoaded(false); setLoadError('');
      try {
        const [order, supplierData, productData] = await Promise.all([
          apiRequest<PurchaseOrder>(`/api/purchase-orders/${purchaseOrderId}`),
          apiRequest<PageResponse<Supplier>>('/api/suppliers?page=1&size=100&status=ACTIVE'),
          apiRequest<PageResponse<Product>>('/api/products?page=1&size=100&status=ACTIVE'),
        ]);
        setOrderNo(order.orderNo); setSupplierId(String(order.supplierId)); setRemark(order.remark || ''); setStatus(order.status);
        setSuppliers(supplierData.records); setProducts(productData.records);
        setItems(order.items.map((item) => ({ productId: String(item.productId), quantity: String(item.quantity), price: String(item.price) })));
        setLoaded(true);
      } catch (requestError) {
        setLoadError(requestError instanceof Error ? requestError.message : '加载采购单失败');
      } finally { setLoading(false); }
    }
    loadData();
  }, [router.isReady, purchaseOrderId]);

  function addItem() { setItems([...items, { productId: '', quantity: '', price: '' }]); }
  function removeItem(index: number) { if (items.length > 1) setItems(items.filter((_, itemIndex) => itemIndex !== index)); }
  function updateProduct(index: number, productId: string) {
    const selectedProduct = products.find((product) => String(product.id) === productId);
    const nextItems = [...items];
    nextItems[index] = { ...nextItems[index], productId, price: selectedProduct ? String(selectedProduct.cost) : nextItems[index].price };
    setItems(nextItems);
  }
  function updateItem(index: number, field: keyof PurchaseItemForm, value: string) {
    const nextItems = [...items]; nextItems[index] = { ...nextItems[index], [field]: value }; setItems(nextItems);
  }
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); setFormError('');
    if (status !== 'DRAFT') { setFormError('只有草稿采购单可以修改'); return; }
    if (!supplierId || Number(supplierId) <= 0) { setFormError('请选择供应商'); return; }
    const normalizedItems = items.map((item) => ({ productId: Number(item.productId), quantity: Number(item.quantity), price: Number(item.price) }));
    const invalidItem = normalizedItems.some((item) => !item.productId || item.productId <= 0 || !item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0 || !item.price || item.price <= 0);
    if (invalidItem) { setFormError('商品、数量、采购价都必须填写；数量必须是正整数，采购价必须大于0'); return; }
    setSubmitting(true);
    try {
      await apiRequest(`/api/purchase-orders/${purchaseOrderId}`, { method: 'PUT', body: JSON.stringify({ supplierId: Number(supplierId), remark, items: normalizedItems }) });
      router.push(`/purchase-orders/${purchaseOrderId}`);
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : '修改采购单失败');
    } finally { setSubmitting(false); }
  }

  const optionsEmpty = loaded && !loadError && (suppliers.length === 0 || products.length === 0);
  const formReady = loaded && !loadError && !optionsEmpty;

  return (
    <Layout>
      <main className="aster-form-page aster-order-form-page">
        <PageHeader backHref={`/purchase-orders/${purchaseOrderId}`} description={orderNo ? `单号：${orderNo}` : undefined} title="编辑采购单" />
        <DataState
          empty={optionsEmpty}
          emptyDescription="请先维护至少一条启用的供应商和商品。"
          emptyTitle="无法编辑采购单"
          error={loadError}
          loading={loading || (!loaded && !loadError)}
          skeleton="text"
        />
        {formError ? <InlineNotification hideCloseButton kind="error" lowContrast role="alert" subtitle={formError} title="采购单保存失败" /> : null}
        {status && status !== 'DRAFT' ? <InlineNotification hideCloseButton kind="error" lowContrast role="alert" subtitle="当前采购单不是草稿状态，不能修改" title="不可编辑" /> : null}
        {formReady ? <Form className="aster-form-grid" onSubmit={handleSubmit}>
          <Select disabled={status !== 'DRAFT'} id="purchase-supplier" labelText="供应商" onChange={(event) => setSupplierId(event.target.value)} required value={supplierId}>
            <SelectItem text="请选择供应商" value="" />
            {suppliers.map((supplier) => <SelectItem key={supplier.id} text={`${supplier.supplierCode} - ${supplier.name}`} value={String(supplier.id)} />)}
          </Select>
          <TextInput disabled={status !== 'DRAFT'} id="purchase-remark" labelText="备注" onChange={(event) => setRemark(event.target.value)} value={remark} />
          <fieldset className="aster-form-field--full aster-order-items-fieldset" disabled={status !== 'DRAFT'}>
            <OrderItemsEditor items={items} onAdd={addItem} onChange={(index, field, value) => field === 'productId' ? updateProduct(index, value) : updateItem(index, field, value)} onRemove={removeItem} priceLabel="采购价" products={products} />
          </fieldset>
          <FormActions cancelHref={`/purchase-orders/${purchaseOrderId}`} submitLabel="保存修改" submitting={submitting || status !== 'DRAFT'} />
        </Form> : null}
      </main>
    </Layout>
  );
}
