import { useEffect, useState } from 'react';
import { Form, InlineNotification, Select, SelectItem, TextArea, TextInput } from '@carbon/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import DataState from '@/components/ui/DataState';
import FormActions from '@/components/ui/FormActions';
import PageHeader from '@/components/ui/PageHeader';
import { apiRequest } from '@/lib/api';

type Customer = {
  id: number;
  customerCode: string;
  name: string;
  contactName: string;
  phone: string;
  address: string;
  status: string;
};

export default function CustomerEditPage() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({
    customerCode: '',
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

    async function loadCustomer() {
      setLoading(true);
      setError('');

      try {
        const customer = await apiRequest<Customer>(`/api/customers/${id}`);
        setForm({
          customerCode: customer.customerCode,
          name: customer.name,
          contactName: customer.contactName || '',
          phone: customer.phone || '',
          address: customer.address || '',
          status: customer.status || 'ACTIVE',
        });
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : '客户加载失败');
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
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
      await apiRequest(`/api/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      router.push('/customers');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '保存客户失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="aster-form-page">
        <PageHeader
          backHref="/customers"
          description="维护客户基础资料、联系人和业务状态。"
          title="编辑客户"
        />
        <DataState loading={loading} skeleton="text" />
        {!loading && error ? (
          <InlineNotification
            hideCloseButton
            kind="error"
            lowContrast
            role="alert"
            subtitle={error}
            title="客户处理失败"
          />
        ) : null}
        {!loading ? (
          <Form className="aster-form-grid" onSubmit={handleSubmit}>
            <TextInput
              id="customer-code"
              labelText="客户编码"
              name="customerCode"
              onChange={(event) => updateField('customerCode', event.target.value)}
              required
              value={form.customerCode}
            />
            <TextInput
              id="customer-name"
              labelText="客户名称"
              name="name"
              onChange={(event) => updateField('name', event.target.value)}
              required
              value={form.name}
            />
            <TextInput
              id="customer-contact-name"
              labelText="联系人"
              name="contactName"
              onChange={(event) => updateField('contactName', event.target.value)}
              value={form.contactName}
            />
            <TextInput
              id="customer-phone"
              labelText="电话"
              name="phone"
              onChange={(event) => updateField('phone', event.target.value)}
              value={form.phone}
            />
            <TextArea
              className="aster-form-field--full"
              id="customer-address"
              labelText="地址"
              name="address"
              onChange={(event) => updateField('address', event.target.value)}
              value={form.address}
            />
            <Select
              id="customer-status"
              labelText="状态"
              name="status"
              onChange={(event) => updateField('status', event.target.value)}
              value={form.status}
            >
              <SelectItem text="启用" value="ACTIVE" />
              <SelectItem text="停用" value="INACTIVE" />
            </Select>
            <FormActions cancelHref="/customers" submitLabel="保存客户" submitting={saving} />
          </Form>
        ) : null}
      </div>
    </Layout>
  );
}
