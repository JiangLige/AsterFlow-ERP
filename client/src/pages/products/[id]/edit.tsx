"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';
import { FadeIn, FormField } from '@/components/motion';

type ProductForm = {
    productCode: string;
    name: string;
    category: string;
    unit: string;
    price: string;
    cost: string;
    stock: string;
    status: string;
    description: string;
};

export default function ProductEditPage() {
    const router = useRouter();
    const productId = typeof router.query.id === 'string' ? router.query.id : '';

    const [form, setForm] = useState<ProductForm>({
        productCode: '',
        name: '',
        category: '',
        unit: '',
        price: '',
        cost: '',
        stock: '',
        status: 'ACTIVE',
        description: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!router.isReady || !productId) {
            return;
        }

        async function loadProduct() {
            setLoading(true);
            setError('');

            try {
                const data = await apiRequest<any>(`/api/products/${productId}`);

                setForm({
                    productCode: data.productCode,
                    name: data.name,
                    category: data.category,
                    unit: data.unit,
                    price: String(data.price),
                    cost: String(data.cost),
                    stock: String(data.stock),
                    status: data.status,
                    description: data.description || '',
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : '加载商品失败');
            } finally {
                setLoading(false);
            }
        }

        loadProduct();
    }, [router.isReady, productId]);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await apiRequest(`/api/products/${productId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...form,
                    price: Number(form.price),
                    cost: Number(form.cost),
                    stock: Number(form.stock),
                }),
            });

            router.push('/products');
        } catch (err) {
            setError(err instanceof Error ? err.message : '保存失败');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Layout>
            <FadeIn direction="up" distance={16} duration={0.5}>
                <section className="page-hero">
                    <div>
                        <p className="eyebrow">商品档案</p>
                        <h1>编辑商品</h1>
                        <p className="muted">当前商品 ID：{productId || '-'}</p>
                    </div>
                </section>
            </FadeIn>

            {loading && (
                <FadeIn direction="up" delay={0.1}>
                    <div className="empty-state">加载中...</div>
                </FadeIn>
            )}

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="alert alert-danger">{error}</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!loading && (
                <FadeIn direction="up" delay={0.1} distance={20}>
                    <form onSubmit={handleSubmit} className="form-container">
                        <div className="form-grid">
                            <FormField label="商品编码" index={0}>
                                <input name="productCode" value={form.productCode} onChange={handleChange} />
                            </FormField>

                            <FormField label="商品名称" index={1}>
                                <input name="name" value={form.name} onChange={handleChange} />
                            </FormField>

                            <FormField label="分类" index={2}>
                                <input name="category" value={form.category} onChange={handleChange} />
                            </FormField>

                            <FormField label="单位" index={3}>
                                <input name="unit" value={form.unit} onChange={handleChange} />
                            </FormField>

                            <FormField label="售价" index={4}>
                                <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} />
                            </FormField>

                            <FormField label="成本价" index={5}>
                                <input name="cost" type="number" min="0" step="0.01" value={form.cost} onChange={handleChange} />
                            </FormField>

                            <FormField label="库存" index={6}>
                                <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} />
                            </FormField>

                            <FormField label="状态" index={7}>
                                <select name="status" value={form.status} onChange={handleChange}>
                                    <option value="ACTIVE">启用</option>
                                    <option value="INACTIVE">停用</option>
                                </select>
                            </FormField>

                            <FormField label="描述" index={8}>
                                <textarea name="description" value={form.description} onChange={handleChange} rows={4} />
                            </FormField>
                        </div>

                        <div className="form-actions">
                            <motion.button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => router.push('/products')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                                取消
                            </motion.button>
                            <motion.button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                                {isSubmitting ? '保存中...' : '保存修改'}
                            </motion.button>
                        </div>
                    </form>
                </FadeIn>
            )}
        </Layout>
    );
}