import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
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

    const loadProduct = useCallback(async (currentProductId: string) => {
        if (!currentProductId) return;

        setLoading(true);
        setError('');

        try {
            const data = await apiRequest<Product>(`/api/products/${currentProductId}`);
            setProduct(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '加载商品失败');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!router.isReady || !productId) return;
        loadProduct(productId);
    }, [router.isReady, productId, loadProduct]);

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

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
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
                headers: {
                    'Idempotency-Key': crypto.randomUUID(),
                },
            });

            setSuccess('库存调整成功，已生成库存流水');
            setQuantity('');
            setRemark('');
            await loadProduct(productId);
        } catch (err) {
            setError(err instanceof Error ? err.message : '库存调整失败');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Layout>
            <h1>库存调整</h1>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <Link href="/products">返回商品列表</Link>
                <Link href="/stock-records">查看库存流水</Link>
            </div>

            {loading && <p>加载中...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}

            {product && (
                <div style={{ marginTop: '1rem' }}>
                    <p>商品编码：{product.productCode}</p>
                    <p>商品名称：{product.name}</p>
                    <p>当前库存：{product.stock} {product.unit}</p>
                    <p>最低库存：{product.minStock}</p>
                    <p>状态：{product.status}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
                <div>
                    <label>调整类型</label>
                    <select value={type} onChange={(e) => setType(e.target.value as StockChangeType)}>
                        <option value="IN">入库</option>
                        <option value="OUT">出库</option>
                        <option value="ADJUST">盘点调整</option>
                    </select>
                </div>

                <div>
                    <label>变化数量</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder={type === 'ADJUST' ? '可输入正数或负数' : '请输入正数'}
                    />
                </div>

                <div>
                    <label>备注</label>
                    <textarea
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="例如：盘点差异、手工入库、损耗出库"
                    />
                </div>

                <button type="submit" disabled={submitting || !productId}>
                    {submitting ? '提交中...' : '确认调整'}
                </button>
            </form>
        </Layout>
    );
}
