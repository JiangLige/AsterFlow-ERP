import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import Layout from "@/components/Layout";
import Link from 'next/link';


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

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

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
        } catch (e: any) {
            setError(e.message || '商品加载失败');
        } finally {
            setLoading(false);
        }
    };

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
            <h1>商品列表</h1>

            <Link href="/products/new">
                新增商品
            </Link>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="输入商品编码/名称/分类"
                />
                <button onClick={() => loadProducts(1)} disabled={loading}>
                    {loading ? '查询中...' : '查询'}
                </button>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        onClick={() => loadProducts(page - 1)}
                        disabled={loading || page <= 1}
                    >
                        上一页
                    </button>

                    <span>
        第 {page} / {pages} 页，共 {total} 条
    </span>

                    <button
                        onClick={() => loadProducts(page + 1)}
                        disabled={loading || page >= pages}
                    >
                        下一页
                    </button>

                </div>
            </div>



            {error && (
                <div style={{ marginTop: '1rem', color: 'red' }}>
                    {error}
                </div>
            )}

            <table
                style={{
                    marginTop: '1rem',
                    width: '100%',
                    borderCollapse: 'collapse',
                }}
            >
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
                        <td>{product.price}</td>
                        <td>{product.cost}</td>
                        <td>{product.stock}</td>
                        <td>{product.minStock}</td>
                        <td>{product.status}</td>
                        <td>
                            <Link href={`/products/${product.id}/edit`}>
                                编辑
                            </Link>
                            <Link href={`/products/${product.id}/stock`}>
                                库存调整
                            </Link>

                            <button onClick={() => handleDelete(product.id)}>
                                停用
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </Layout>
    );
}