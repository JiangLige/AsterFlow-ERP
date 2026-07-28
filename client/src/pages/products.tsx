import { Button, Search } from '@carbon/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import BusinessDataTable from '@/components/ui/BusinessDataTable';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import OverflowActions, { type OverflowAction } from '@/components/ui/OverflowActions';
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

type PageResponse<T> = {
  records: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

const headers = [
  { key: 'code', header: '编码' },
  { key: 'name', header: '名称' },
  { key: 'category', header: '分类' },
  { key: 'unit', header: '单位' },
  { key: 'price', header: '售价' },
  { key: 'cost', header: '成本' },
  { key: 'stock', header: '库存' },
  { key: 'minStock', header: '最低库存' },
  { key: 'status', header: '状态' },
  { key: 'actions', header: '操作' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [role, setRole] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = async (targetPage = page) => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams();
      query.set('page', String(targetPage));
      query.set('size', '10');

      if (keyword.trim()) {
        query.set('keyword', keyword.trim());
      }

      const data = await apiRequest<PageResponse<Product>>(`/api/products?${query.toString()}`);

      setProducts(data.records);
      setPage(data.page);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '商品加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRole(localStorage.getItem('role') || '');
    loadProducts(1);
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      loadProducts(page);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [page, keyword]);

  async function handleDelete() {
    if (!pendingDelete) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await apiRequest(`/api/products/${pendingDelete.id}`, {
        method: 'DELETE',
      });

      setPendingDelete(null);
      await loadProducts(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : '停用失败');
    } finally {
      setSubmitting(false);
    }
  }

  function productActions(product: Product, currentRole: string): OverflowAction[] {
    const actions: OverflowAction[] = [
      {
        label: '编辑',
        onClick: () => void router.push(`/products/${product.id}/edit`),
      },
      {
        label: '库存调整',
        onClick: () => void router.push(`/products/${product.id}/stock`),
      },
    ];

    if (currentRole === 'ADMIN') {
      actions.push({
        label: '停用',
        danger: true,
        onClick: () => setPendingDelete(product),
      });
    }

    return actions;
  }

  const rows = products.map((product) => ({
    id: String(product.id),
    code: <span className="numeric">{product.productCode}</span>,
    name: product.name,
    category: product.category,
    unit: product.unit,
    price: <span className="numeric">{formatCurrency(product.price)}</span>,
    cost: <span className="numeric">{formatCurrency(product.cost)}</span>,
    stock: <strong data-risk={product.stock <= product.minStock}>{product.stock}</strong>,
    minStock: product.minStock,
    status: <StatusTag status={product.status} />,
    actions: <OverflowActions actions={productActions(product, role)} />,
  }));

  return (
    <Layout>
      <div className="master-data-list master-data-list--products">
        <PageHeader
          title="商品管理"
          description="维护商品编码、分类、价格和库存安全线。"
          actions={(
            <Link className="cds--btn cds--btn--primary" href="/products/new">
              新增商品
            </Link>
          )}
        />

        <BusinessDataTable
          empty={products.length === 0}
          emptyDescription="新增商品后，商品档案会显示在这里。"
          emptyTitle="暂无商品数据"
          error={error}
          headers={headers}
          loading={loading}
          onRetry={() => void loadProducts(page)}
          pagination={{
            page,
            pageSize: 10,
            total,
            onChange: ({ page: targetPage }: { page: number }) => void loadProducts(targetPage),
          }}
          rows={rows}
          toolbar={(
            <>
              <Search
                id="product-search"
                labelText="搜索商品"
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void loadProducts(1);
                  }
                }}
                placeholder="输入商品编码、名称或分类"
                size="lg"
                value={keyword}
              />
              <Button
                disabled={loading}
                kind="secondary"
                onClick={() => void loadProducts(1)}
                size="lg"
                type="button"
              >
                {loading ? '查询中...' : '查询'}
              </Button>
            </>
          )}
        />

        <ConfirmActionModal
          confirmLabel="确认停用"
          danger
          description={pendingDelete
            ? `停用后，商品“${pendingDelete.name}”将不能用于新的业务单据。`
            : ''}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => void handleDelete()}
          open={pendingDelete !== null}
          submitting={submitting}
          title="停用商品"
        />
      </div>
    </Layout>
  );
}
