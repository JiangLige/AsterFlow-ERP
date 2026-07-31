import { useEffect, useState } from 'react';
import { Form, InlineNotification, NumberInput, Select, SelectItem, TextArea, TextInput } from '@carbon/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import DataState from '@/components/ui/DataState';
import FormActions from '@/components/ui/FormActions';
import PageHeader from '@/components/ui/PageHeader';
import { apiRequest } from '@/lib/api';

type ProductForm = {
  productCode: string;
  name: string;
  category: string;
  unit: string;
  price: string;
  cost: string;
  stock: string;
  status: string;
  description: string;
};

export default function ProductEditPage() {
  const router = useRouter();
  const productId = typeof router.query.id === 'string' ? router.query.id : '';
  const [form, setForm] = useState<ProductForm>({
    productCode: '',
    name: '',
    category: '',
    unit: '',
    price: '',
    cost: '',
    stock: '',
    status: 'ACTIVE',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady || !productId) {
      return;
    }

    async function loadProduct() {
      setLoading(true);
      setError('');

      try {
        const data = await apiRequest<Record<string, unknown>>(`/api/products/${productId}`);
        setForm({
          productCode: String(data.productCode ?? ''),
          name: String(data.name ?? ''),
          category: String(data.category ?? ''),
          unit: String(data.unit ?? ''),
          price: String(data.price ?? ''),
          cost: String(data.cost ?? ''),
          stock: String(data.stock ?? ''),
          status: String(data.status ?? 'ACTIVE'),
          description: String(data.description ?? ''),
        });
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : '加载商品失败');
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [router.isReady, productId]);

  function updateField(name: keyof ProductForm, value: string | number) {
    setForm((previous) => ({
      ...previous,
      [name]: String(value),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await apiRequest(`/api/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          cost: Number(form.cost),
          stock: Number(form.stock),
        }),
      });
      router.push('/products');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="aster-form-page">
        <PageHeader
          backHref="/products"
          description={`当前商品 ID：${productId || '-'}`}
          title="编辑商品"
        />

        <DataState loading={loading} skeleton="text" />
        {!loading && error ? (
          <InlineNotification
            hideCloseButton
            kind="error"
            lowContrast
            role="alert"
            subtitle={error}
            title="商品处理失败"
          />
        ) : null}

        {!loading ? (
          <Form className="aster-form-grid" onSubmit={handleSubmit}>
            <TextInput
              id="product-code"
              labelText="商品编码"
              name="productCode"
              onChange={(event) => updateField('productCode', event.target.value)}
              value={form.productCode}
            />
            <TextInput
              id="product-name"
              labelText="商品名称"
              name="name"
              onChange={(event) => updateField('name', event.target.value)}
              value={form.name}
            />
            <TextInput
              id="product-category"
              labelText="分类"
              name="category"
              onChange={(event) => updateField('category', event.target.value)}
              value={form.category}
            />
            <TextInput
              id="product-unit"
              labelText="单位"
              name="unit"
              onChange={(event) => updateField('unit', event.target.value)}
              value={form.unit}
            />
            <NumberInput
              allowEmpty
              hideSteppers
              id="product-price"
              label="售价"
              name="price"
              onChange={(_event, state) => updateField('price', state.value)}
              value={form.price}
            />
            <NumberInput
              allowEmpty
              hideSteppers
              id="product-cost"
              label="成本价"
              name="cost"
              onChange={(_event, state) => updateField('cost', state.value)}
              value={form.cost}
            />
            <NumberInput
              allowEmpty
              hideSteppers
              id="product-stock"
              label="库存"
              name="stock"
              onChange={(_event, state) => updateField('stock', state.value)}
              value={form.stock}
            />
            <Select
              id="product-status"
              labelText="状态"
              name="status"
              onChange={(event) => updateField('status', event.target.value)}
              value={form.status}
            >
              <SelectItem text="启用" value="ACTIVE" />
              <SelectItem text="停用" value="INACTIVE" />
            </Select>
            <TextArea
              className="aster-form-field--full"
              id="product-description"
              labelText="描述"
              name="description"
              onChange={(event) => updateField('description', event.target.value)}
              value={form.description}
            />
            <FormActions cancelHref="/products" submitLabel="保存商品" submitting={saving} />
          </Form>
        ) : null}
      </div>
    </Layout>
  );
}
