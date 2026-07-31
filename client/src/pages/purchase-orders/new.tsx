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
type PageResponse<T> = { records: T[]; total: number; page: number; size: number; pages: number };
type Supplier = { id: number; supplierCode: string; name: string; status: string };
type Product = { id: number; productCode: string; name: string; cost: number; stock: number; status: string };

export default function PurchaseOrderCreatePage() {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState('');
  const [remark, setRemark] = useState('');
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<PurchaseItemForm[]>([{ productId: '', quantity: '', price: '' }]);

  useEffect(() => {
    async function loadOptions() {
      setOptionsLoading(true);
      setLoadError('');
      try {
        const supplierData = await apiRequest<PageResponse<Supplier>>('/api/suppliers?page=1&size=100&status=ACTIVE');
        const productData = await apiRequest<PageResponse<Product>>('/api/products?page=1&size=100&status=ACTIVE');
        setSuppliers(supplierData.records);
        setProducts(productData.records);
      } catch (requestError) {
        setLoadError(requestError instanceof Error ? requestError.message : '基础资料加载失败');
      } finally {
        setOptionsLoading(false);
      }
    }
    loadOptions();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');
    if (!supplierId || Number(supplierId) <= 0) {
      setFormError('请选择供应商');
      return;
    }
    const normalizedItems = items.map((item) => ({ productId: Number(item.productId), quantity: Number(item.quantity), price: Number(item.price) }));
    const invalidItem = normalizedItems.some((item) => !item.productId || item.productId <= 0 || !item.quantity || item.quantity <= 0 || !item.price || item.price <= 0);
    if (invalidItem) {
      setFormError('商品、数量、采购价都必须填写，并且数量和采购价必须大于0');
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest('/api/purchase-orders', {
        method: 'POST',
        body: JSON.stringify({ supplierId: Number(supplierId), remark, items: normalizedItems }),
      });
      router.push('/purchase-orders');
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : '新增采购单失败');
    } finally {
      setSubmitting(false);
    }
  }

  function addItem() { setItems([...items, { productId: '', quantity: '', price: '' }]); }
  function removeItem(index: number) { if (items.length > 1) setItems(items.filter((_, itemIndex) => itemIndex !== index)); }
  function updateProduct(index: number, productId: string) {
    const selectedProduct = products.find((product) => String(product.id) === productId);
    const nextItems = [...items];
    nextItems[index] = { ...nextItems[index], productId, price: selectedProduct ? String(selectedProduct.cost) : nextItems[index].price };
    setItems(nextItems);
  }
  function updateItem(index: number, field: keyof PurchaseItemForm, value: string) {
    const nextItems = [...items];
    nextItems[index] = { ...nextItems[index], [field]: value };
    setItems(nextItems);
  }

  const optionsEmpty = !optionsLoading && !loadError && (suppliers.length === 0 || products.length === 0);
  const formReady = !optionsLoading && !loadError && !optionsEmpty;

  return (
    <Layout>
      <div className="aster-form-page aster-order-form-page">
        <PageHeader backHref="/purchase-orders" description="选择供应商并录入商品明细，保存后进入采购流转。" title="新增采购单" />
        <DataState
          empty={optionsEmpty}
          emptyDescription="请先维护至少一条启用的供应商和商品。"
          emptyTitle="无法创建采购单"
          error={loadError}
          loading={optionsLoading}
          skeleton="text"
        />
        {formError ? <InlineNotification hideCloseButton kind="error" lowContrast role="alert" subtitle={formError} title="采购单保存失败" /> : null}
        {formReady ? <Form className="aster-form-grid" onSubmit={handleSubmit}>
          <Select id="purchase-supplier" labelText="供应商" onChange={(event) => setSupplierId(event.target.value)} required value={supplierId}>
            <SelectItem text="请选择供应商" value="" />
            {suppliers.map((supplier) => <SelectItem key={supplier.id} text={`${supplier.supplierCode} - ${supplier.name}`} value={String(supplier.id)} />)}
          </Select>
          <TextInput id="purchase-remark" labelText="备注" onChange={(event) => setRemark(event.target.value)} value={remark} />
          <div className="aster-form-field--full">
            <OrderItemsEditor
              items={items}
              onAdd={addItem}
              onChange={(index, field, value) => field === 'productId' ? updateProduct(index, value) : updateItem(index, field, value)}
              onRemove={removeItem}
              priceLabel="采购价"
              products={products}
            />
          </div>
          <FormActions cancelHref="/purchase-orders" submitLabel="保存采购单" submitting={submitting} />
        </Form> : null}
      </div>
    </Layout>
  );
}
