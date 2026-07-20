import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';

type PurchaseOrderItem = {
    id: number;
    productId: number;
    productCode: string;
    productName: string;
    quantity: number;
    price: number;
    amount: number;
};

type PurchaseOrder = {
    id: number;
    orderNo: string;
    supplierId: number;
    supplierName: string;
    totalAmount: number;
    status: string;
    remark: string;
    createdAt: string;
    updatedAt: string;
    items: PurchaseOrderItem[];
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

export default function PurchaseOrderDetailPage() {
    const router = useRouter();
    const purchaseOrderId = typeof router.query.id === 'string' ? router.query.id : '';

    const [order, setOrder] = useState<PurchaseOrder | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!router.isReady || !purchaseOrderId) {
            return;
        }

        async function loadDetail() {
            setLoading(true);
            setError('');

            try {
                const data = await apiRequest<PurchaseOrder>(`/api/purchase-orders/${purchaseOrderId}`);
                setOrder(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : '加载采购单详情失败');
            } finally {
                setLoading(false);
            }
        }

        loadDetail();
    }, [router.isReady, purchaseOrderId]);

    return (
        <Layout>
            <section className="page-hero">
                <div>
                    <p className="eyebrow">采购入库</p>
                    <h1>采购单详情</h1>
                    <p className="muted">查看采购单头信息和商品明细。</p>
                </div>
            </section>

            {loading && <div className="empty-state">加载中...</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {order && (
                <>
                    <section className="detail-grid">
                        <div className="detail-item">
                            <p className="detail-label">单号</p>
                            <p className="detail-value">{order.orderNo}</p>
                        </div>
                        <div className="detail-item">
                            <p className="detail-label">供应商</p>
                            <p className="detail-value">{order.supplierName}</p>
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

                    <h2>采购明细</h2>
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
