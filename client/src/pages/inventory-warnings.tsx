import { useEffect, useState } from 'react';
import { Button, Link } from '@carbon/react';
import Layout from '@/components/Layout';
import BusinessDataTable from '@/components/ui/BusinessDataTable';
import PageHeader from '@/components/ui/PageHeader';
import StatusTag from '@/components/ui/StatusTag';
import { apiRequest } from '@/lib/api';

type Product = {
  id: number;
  productCode: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  status: string;
};

const headers = [
  { key: 'code', header: '编码' },
  { key: 'name', header: '名称' },
  { key: 'category', header: '分类' },
  { key: 'unit', header: '单位' },
  { key: 'stock', header: '当前库存' },
  { key: 'minStock', header: '最低库存' },
  { key: 'shortageGap', header: '库存缺口' },
  { key: 'status', header: '状态' },
  { key: 'actions', header: '操作' },
];

function formatStatus(status: string) {
  if (status === 'ACTIVE') return '启用';
  if (status === 'INACTIVE') return '停用';
  return status;
}

export default function InventoryWarningsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadWarnings = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest<Product[]>('/api/product-warnings');
      setProducts(data);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '库存预警加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWarnings();
  }, []);

  const visibleProducts = products.slice((page - 1) * pageSize, page * pageSize);
  const rows = visibleProducts.map((product) => ({
    id: String(product.id),
    code: <span className="numeric">{product.productCode}</span>,
    name: product.name,
    category: product.category,
    unit: product.unit,
    stock: <strong className="aster-risk-value numeric">{product.stock}</strong>,
    minStock: <span className="numeric">{product.minStock}</span>,
    shortageGap: <strong className="aster-risk-value numeric">{Math.max(product.minStock - product.stock, 0)}</strong>,
    status: (
      <span className="aster-risk-status">
        <StatusTag status="RISK" />
        <span className="aster-sr-only">商品状态：{formatStatus(product.status)}</span>
      </span>
    ),
    actions: (
      <span className="aster-warning-actions">
        <Link href={`/products/${product.id}/stock`}>库存调整</Link>
        <Link href="/purchase-orders/new">发起补货</Link>
      </span>
    ),
  }));

  return (
    <Layout>
      <div className="operations-list operations-list--warnings">
        <PageHeader
          title="库存预警"
          description="集中查看低于最低库存线的商品。"
          actions={(
            <Button
              disabled={loading}
              kind="secondary"
              onClick={() => void loadWarnings()}
              size="lg"
              type="button"
            >
              {loading ? '刷新中...' : '刷新'}
            </Button>
          )}
        />

        <BusinessDataTable
          empty={products.length === 0}
          emptyDescription="所有商品库存均在安全线以上。"
          emptyTitle="当前没有低于安全库存的商品"
          error={error}
          headers={headers}
          loading={loading}
          onRetry={() => void loadWarnings()}
          pagination={{
            page,
            pageSize,
            total: products.length,
            onChange: ({ page: targetPage, pageSize: targetPageSize }) => {
              setPage(targetPage);
              setPageSize(targetPageSize);
            },
          }}
          rows={rows}
        />
      </div>
    </Layout>
  );
}
