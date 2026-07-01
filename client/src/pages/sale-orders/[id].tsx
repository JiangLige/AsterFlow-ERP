import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';

type SaleOrderItem = {
    id: number;
    productId: number;
    productCode: string;
    productName: string;
    quantity: number;
    price: number;
    amount: number;
};

type SaleOrder = {
    id: number;
    orderNo: string;
    customerName: string;
    totalAmount: number;
    status: string;
    remark: string;
    createdAt: string;
    updatedAt: string;
    items: SaleOrderItem[];
};

export default function SaleOrderDetailPage() {
    const router = useRouter();
    const saleOrderId = typeof router.query.id === 'string' ? router.query.id : '';

    const [order, setOrder] = useState<SaleOrder | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!router.isReady || !saleOrderId) {
            return;
        }

        async function loadDetail() {
            setLoading(true);
            setError('');

            try {
                const data = await apiRequest<SaleOrder>(`/api/sale-orders/${saleOrderId}`);
                setOrder(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : '加载销售单详情失败');
            } finally {
                setLoading(false);
            }
        }

        loadDetail();
    }, [router.isReady, saleOrderId]);

    return (
        <Layout>
            <h1>销售单详情</h1>

            {loading && <p>加载中...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {order && (
                <div style={{ marginTop: '1rem' }}>
                    <p>单号：{order.orderNo}</p>
                    <p>客户：{order.customerName}</p>
                    <p>状态：{order.status}</p>
                    <p>总金额：{order.totalAmount}</p>
                    <p>备注：{order.remark}</p>

                    <h2 style={{ marginTop: '1rem' }}>销售明细</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th>商品编码</th>
                                <th>商品名称</th>
                                <th>数量</th>
                                <th>单价</th>
                                <th>金额</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.productCode}</td>
                                    <td>{item.productName}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.price}</td>
                                    <td>{item.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Layout>
    );
}
