import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
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

function formatStatus(status: string) {
    if (status === 'ACTIVE') return '启用';
    if (status === 'INACTIVE') return '停用';
    return status;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        maximumFractionDigits: 2,
    }).format(value || 0);
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [role, setRole] = useState('');

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
            setPages(data.pages);
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

    async function handleDelete(id: number) {
        const ok = window.confirm('确定要停用这个商品吗？');

        if (!ok) {
            return;
        }

        setError('');

        try {
            await apiRequest(`/api/products/${id}`, {
                method: 'DELETE',
            });

            loadProducts(page);
        } catch (err) {
            setError(err instanceof Error ? err.message : '停用失败');
        }
    }

    return (
        <Layout>
            <section className="page-hero">
                <div>
                    <p className="eyebrow">商品档案</p>
                    <h1>商品列表</h1>
                    <p className="muted">维护编码、分类、价格和库存安全线。</p>
                </div>

                <div className="page-actions">
                    <Link className="btn-primary" href="/products/new">
                        新增商品
                    </Link>
                </div>
            </section>

            <div className="toolbar">
                <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="输入商品编码/名称/分类"
                />
                <button onClick={() => loadProducts(1)} disabled={loading}>
                    {loading ? '查询中...' : '查询'}
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <p className="muted" style={{ marginTop: '1rem' }}>
                第 {page} / {pages} 页，共 {total} 条
            </p>

            <table>
                <thead>
                    <tr>
                        <th>编码</th>
                        <th>名称</th>
                        <th>分类</th>
                        <th>单位</th>
                        <th>售价</th>
                        <th>成本</th>
                        <th>库存</th>
                        <th>最低库存</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.id}>
                            <td>{product.productCode}</td>
                            <td>{product.name}</td>
                            <td>{product.category}</td>
                            <td>{product.unit}</td>
                            <td>{formatCurrency(product.price)}</td>
                            <td>{formatCurrency(product.cost)}</td>
                            <td>
                                <strong style={{ color: product.stock <= product.minStock ? 'var(--danger)' : 'inherit' }}>
                                    {product.stock}
                                </strong>
                            </td>
                            <td>{product.minStock}</td>
                            <td>
                                <span className={`status-badge ${product.status === 'ACTIVE' ? 'success' : 'warning'}`}>
                                    {formatStatus(product.status)}
                                </span>
                            </td>
                            <td className="action-cell">
                                <Link href={`/products/${product.id}/edit`}>编辑</Link>
                                <Link href={`/products/${product.id}/stock`}>库存调整</Link>

                                {role === 'ADMIN' && (
                                    <button onClick={() => handleDelete(product.id)}>
                                        停用
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {!loading && products.length === 0 && (
                <div className="empty-state">暂无商品数据</div>
            )}

            <div className="toolbar">
                <button onClick={() => loadProducts(page - 1)} disabled={loading || page <= 1}>
                    上一页
                </button>
                <button onClick={() => loadProducts(page + 1)} disabled={loading || page >= pages}>
                    下一页
                </button>
            </div>
        </Layout>
    );
}
