import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Button,
  Form,
  InlineNotification,
  NumberInput,
  RadioButton,
  RadioButtonGroup,
  TextArea,
} from '@carbon/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import DataState from '@/components/ui/DataState';
import FormActions from '@/components/ui/FormActions';
import PageHeader from '@/components/ui/PageHeader';
import { apiRequest } from '@/lib/api';

type Product = {
  id: number;
  productCode: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  status: string;
};

type StockChangeType = 'IN' | 'OUT' | 'ADJUST';

export default function ProductStockAdjustPage() {
  const router = useRouter();
  const productId = typeof router.query.id === 'string' ? router.query.id : '';
  const [product, setProduct] = useState<Product | null>(null);
  const [type, setType] = useState<StockChangeType>('IN');
  const [quantity, setQuantity] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadProduct() {
    if (!productId) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiRequest<Product>(`/api/products/${productId}`);
      setProduct(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载商品失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!router.isReady || !productId) {
      return;
    }
    loadProduct();
  }, [router.isReady, productId]);

  function getChangeQuantity() {
    const value = Number(quantity);

    if (!Number.isFinite(value)) {
      throw new Error('请输入正确的库存变化数量');
    }

    if (type === 'ADJUST') {
      if (value === 0) {
        throw new Error('库存调整数量不能为0');
      }
      return value;
    }

    if (value <= 0) {
      throw new Error('入库或出库数量必须大于0');
    }

    return type === 'OUT' ? -value : value;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const changeQuantity = getChangeQuantity();
      setSubmitting(true);

      await apiRequest(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({
          type,
          changeQuantity,
          remark,
        }),
      });

      setSuccess('库存调整成功，已生成库存流水');
      setQuantity('');
      setRemark('');
      await loadProduct();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '库存调整失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <div className="aster-form-page">
        <PageHeader
          actions={(
            <Button as={Link} href="/stock-records" kind="ghost" size="sm">
              查看库存流水
            </Button>
          )}
          backHref="/products"
          description="记录入库、出库或盘点差异，并同步生成库存流水。"
          title="库存调整"
        />

        <DataState loading={loading} skeleton="text" />
        {!loading && error ? (
          <InlineNotification
            hideCloseButton
            kind="error"
            lowContrast
            role="alert"
            subtitle={error}
            title="库存调整失败"
          />
        ) : null}
        {success ? (
          <InlineNotification
            hideCloseButton
            kind="success"
            lowContrast
            role="status"
            subtitle={success}
            title="调整完成"
          />
        ) : null}

        {!loading && product ? (
          <section aria-label="商品库存信息" className="aster-stock-summary">
            <div>
              <span>商品编码</span>
              <strong className="aster-mono">{product.productCode}</strong>
            </div>
            <div>
              <span>商品名称</span>
              <strong>{product.name}</strong>
            </div>
            <div>
              <span>当前库存</span>
              <strong className="aster-mono">{product.stock} {product.unit}</strong>
            </div>
            <div>
              <span>最低库存</span>
              <strong className="aster-mono">{product.minStock}</strong>
            </div>
            <div>
              <span>状态</span>
              <strong>{product.status}</strong>
            </div>
          </section>
        ) : null}

        {productId ? (
          <Form className="aster-form-grid aster-stock-form" onSubmit={handleSubmit}>
            <RadioButtonGroup
              className="aster-form-field--full"
              legendText="调整类型"
              name="type"
              onChange={(selection) => setType(selection as StockChangeType)}
              orientation="horizontal"
              valueSelected={type}
            >
              <RadioButton id="stock-type-in" labelText="入库" value="IN" />
              <RadioButton id="stock-type-out" labelText="出库" value="OUT" />
              <RadioButton id="stock-type-adjust" labelText="盘点调整" value="ADJUST" />
            </RadioButtonGroup>
            <NumberInput
              allowEmpty
              hideSteppers
              id="stock-quantity"
              label="变化数量"
              name="quantity"
              onChange={(_event, state) => setQuantity(String(state.value))}
              placeholder={type === 'ADJUST' ? '可输入正数或负数' : '请输入正数'}
              value={quantity}
            />
            <TextArea
              className="aster-form-field--full"
              id="stock-remark"
              labelText="备注"
              name="remark"
              onChange={(event) => setRemark(event.target.value)}
              placeholder="例如：盘点差异、手工入库、损耗出库"
              value={remark}
            />
            <FormActions cancelHref="/products" submitLabel="确认调整" submitting={submitting} />
          </Form>
        ) : null}
      </div>
    </Layout>
  );
}
