import { useState } from 'react';
import { Form, InlineNotification, NumberInput, Select, SelectItem, TextArea, TextInput } from '@carbon/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import FormActions from '@/components/ui/FormActions';
import PageHeader from '@/components/ui/PageHeader';
import { apiRequest } from '@/lib/api';

export default function ProductCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState({
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function updateField(name: keyof typeof form, value: string | number) {
    setForm((previous) => ({
      ...previous,
      [name]: String(value),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await apiRequest('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          cost: Number(form.cost),
          stock: Number(form.stock),
        }),
      });
      router.push('/products');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '新增失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <main className="aster-form-page">
        <PageHeader
          backHref="/products"
          description="录入商品编码、分类、价格与初始库存。"
          title="新增商品"
        />

        {error ? (
          <InlineNotification
            hideCloseButton
            kind="error"
            lowContrast
            role="alert"
            subtitle={error}
            title="商品保存失败"
          />
        ) : null}

        <Form className="aster-form-grid" onSubmit={handleSubmit}>
          <TextInput
            id="product-code"
            labelText="商品编码"
            name="productCode"
            onChange={(event) => updateField('productCode', event.target.value)}
            required
            value={form.productCode}
          />
          <TextInput
            id="product-name"
            labelText="商品名称"
            name="name"
            onChange={(event) => updateField('name', event.target.value)}
            required
            value={form.name}
          />
          <TextInput
            id="product-category"
            labelText="分类"
            name="category"
            onChange={(event) => updateField('category', event.target.value)}
            required
            value={form.category}
          />
          <TextInput
            id="product-unit"
            labelText="单位"
            name="unit"
            onChange={(event) => updateField('unit', event.target.value)}
            required
            value={form.unit}
          />
          <NumberInput
            allowEmpty
            hideSteppers
            id="product-price"
            label="售价"
            min={0}
            name="price"
            onChange={(_event, state) => updateField('price', state.value)}
            required
            step={0.01}
            value={form.price}
          />
          <NumberInput
            allowEmpty
            hideSteppers
            id="product-cost"
            label="成本价"
            min={0}
            name="cost"
            onChange={(_event, state) => updateField('cost', state.value)}
            required
            step={0.01}
            value={form.cost}
          />
          <NumberInput
            allowEmpty
            hideSteppers
            id="product-stock"
            label="库存"
            min={0}
            name="stock"
            onChange={(_event, state) => updateField('stock', state.value)}
            required
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
          <FormActions cancelHref="/products" submitLabel="保存商品" submitting={submitting} />
        </Form>
      </main>
    </Layout>
  );
}
