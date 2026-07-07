import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
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

function formatStatus(status: string) {
    if (status === 'DRAFT') return '草稿';
    if (status === 'APPROVED') return '已审核';
    if (status === 'CANCELED') return '已取消';
    return status;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        maximumFractionDigits: 2,
    }).format(value || 0);
}

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
            <section className="page-hero">
                <div>
                    <p className="eyebrow">销售出库</p>
                    <h1>销售单详情</h1>
                    <p className="muted">查看销售单头信息和商品明细。</p>
                </div>
            </section>

            {loading && (
                <EmptyState
                    title="正在加载销售单详情..."
                    description="请稍候，系统正在读取销售单和明细。"
                />
            )}
            <ErrorMessage message={error} />

            {order && (
                <>
                    <section className="detail-grid">
                        <div className="detail-item">
                            <p className="detail-label">单号</p>
                            <p className="detail-value">{order.orderNo}</p>
                        </div>
                        <div className="detail-item">
                            <p className="detail-label">客户</p>
                            <p className="detail-value">{order.customerName}</p>
                        </div>
                        <div className="detail-item">
                            <p className="detail-label">状态</p>
                            <p className="detail-value">{formatStatus(order.status)}</p>
                        </div>
                        <div className="detail-item">
                            <p className="detail-label">总金额</p>
                            <p className="detail-value">{formatCurrency(order.totalAmount)}</p>
                        </div>
                        <div className="detail-item">
                            <p className="detail-label">创建时间</p>
                            <p className="detail-value">{order.createdAt}</p>
                        </div>
                        <div className="detail-item">
                            <p className="detail-label">备注</p>
                            <p className="detail-value">{order.remark || '-'}</p>
                        </div>
                    </section>

                    <h2>销售明细</h2>
                    <table>
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
                                    <td>{formatCurrency(item.price)}</td>
                                    <td>{formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </Layout>
    );
}
