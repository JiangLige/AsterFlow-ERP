import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import Layout from "@/components/Layout";

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
        } catch (e: any) {
            setError(e.message || '库存预警加载失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWarnings();
    }, []);



    return (

        <Layout>

            <h1>库存预警</h1>

            <button onClick={loadWarnings} disabled={loading}>
                {loading ? '刷新中...' : '刷新'}
            </button>

            {error && (
                <div style={{ marginTop: '1rem', color: 'red' }}>
                    {error}
                </div>
            )}

            {!loading && products.length === 0 && (
                <p style={{ marginTop: '1rem', color: 'green' }}>
                    当前没有库存预警商品
                </p>
            )}

            {products.length > 0 && (
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
                            <td style={{ color: 'red', fontWeight: 'bold' }}>
                                {product.stock}
                            </td>
                            <td>{product.minStock}</td>
                            <td>{product.status}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </Layout>
    );
}