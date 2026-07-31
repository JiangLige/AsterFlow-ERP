import { useEffect, useState } from 'react';
import { Form, InlineNotification, Select, SelectItem, TextArea, TextInput } from '@carbon/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import DataState from '@/components/ui/DataState';
import FormActions from '@/components/ui/FormActions';
import PageHeader from '@/components/ui/PageHeader';
import { apiRequest } from '@/lib/api';

type Supplier = {
  id: number;
  supplierCode: string;
  name: string;
  contactName: string;
  phone: string;
  address: string;
  status: string;
};

export default function SupplierEditPage() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({
    supplierCode: '',
    name: '',
    contactName: '',
    phone: '',
    address: '',
    status: 'ACTIVE',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || Array.isArray(id)) {
      return;
    }

    async function loadSupplier() {
      setLoading(true);
      setError('');

      try {
        const supplier = await apiRequest<Supplier>(`/api/suppliers/${id}`);
        setForm({
          supplierCode: supplier.supplierCode,
          name: supplier.name,
          contactName: supplier.contactName || '',
          phone: supplier.phone || '',
          address: supplier.address || '',
          status: supplier.status || 'ACTIVE',
        });
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : '供应商加载失败');
      } finally {
        setLoading(false);
      }
    }

    loadSupplier();
  }, [id]);

  function updateField(name: keyof typeof form, value: string) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!id || Array.isArray(id)) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      await apiRequest(`/api/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      router.push('/suppliers');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '保存供应商失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="aster-form-page">
        <PageHeader
          backHref="/suppliers"
          description="维护供应商基础资料、联系人和业务状态。"
          title="编辑供应商"
        />
        <DataState loading={loading} skeleton="text" />
        {!loading && error ? (
          <InlineNotification
            hideCloseButton
            kind="error"
            lowContrast
            role="alert"
            subtitle={error}
            title="供应商处理失败"
          />
        ) : null}
        {!loading ? (
          <Form className="aster-form-grid" onSubmit={handleSubmit}>
            <TextInput
              id="supplier-code"
              labelText="供应商编码"
              name="supplierCode"
              onChange={(event) => updateField('supplierCode', event.target.value)}
              required
              value={form.supplierCode}
            />
            <TextInput
              id="supplier-name"
              labelText="供应商名称"
              name="name"
              onChange={(event) => updateField('name', event.target.value)}
              required
              value={form.name}
            />
            <TextInput
              id="supplier-contact-name"
              labelText="联系人"
              name="contactName"
              onChange={(event) => updateField('contactName', event.target.value)}
              value={form.contactName}
            />
            <TextInput
              id="supplier-phone"
              labelText="电话"
              name="phone"
              onChange={(event) => updateField('phone', event.target.value)}
              value={form.phone}
            />
            <TextArea
              className="aster-form-field--full"
              id="supplier-address"
              labelText="地址"
              name="address"
              onChange={(event) => updateField('address', event.target.value)}
              value={form.address}
            />
            <Select
              id="supplier-status"
              labelText="状态"
              name="status"
              onChange={(event) => updateField('status', event.target.value)}
              value={form.status}
            >
              <SelectItem text="启用" value="ACTIVE" />
              <SelectItem text="停用" value="INACTIVE" />
            </Select>
            <FormActions cancelHref="/suppliers" submitLabel="保存供应商" submitting={saving} />
          </Form>
        ) : null}
      </div>
    </Layout>
  );
}
