import { useEffect, useState } from 'react';
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

function formatStatus(status: string) {
    if (status === 'ACTIVE') return '启用';
    if (status === 'INACTIVE') return '停用';
    return status;
}

export default function InventoryWarningsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadWarnings = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await apiRequest<Product[]>('/api/product-warnings');
            setProducts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '库存预警加载失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWarnings();
    }, []);

    return (
        <Layout>
            <section className="page-hero">
                <div>
                    <p className="eyebrow">库存风险</p>
                    <h1>库存预警</h1>
                    <p className="muted">集中查看低于最低库存线的商品。</p>
                </div>

                <div className="page-actions">
                    <button className="btn-secondary" onClick={loadWarnings} disabled={loading}>
                        {loading ? '刷新中...' : '刷新'}
                    </button>
                </div>
            </section>

            {error && <div className="alert alert-danger">{error}</div>}

            {!loading && products.length === 0 && !error && (
                <div className="alert alert-success">当前没有库存预警商品</div>
            )}

            {products.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            <th>编码</th>
                            <th>名称</th>
                            <th>分类</th>
                            <th>单位</th>
                            <th>库存</th>
                            <th>最低库存</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td>{product.productCode}</td>
                                <td>{product.name}</td>
                                <td>{product.category}</td>
                                <td>{product.unit}</td>
                                <td>
                                    <strong style={{ color: 'var(--danger)' }}>{product.stock}</strong>
                                </td>
                                <td>{product.minStock}</td>
                                <td>
                                    <span className={`status-badge ${product.status === 'ACTIVE' ? 'success' : 'warning'}`}>
                                        {formatStatus(product.status)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </Layout>
    );
}
