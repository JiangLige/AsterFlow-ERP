"use client";

import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';
import { FadeIn, FormField } from '@/components/motion';

export default function ProductCreatePage() {
    const router = useRouter();

    const [form, setForm] = useState({
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

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await apiRequest('/api/products', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    price: Number(form.price),
                    cost: Number(form.cost),
                    stock: Number(form.stock),
                }),
            });

            router.push('/products');
        } catch (err) {
            setError(err instanceof Error ? err.message : '新增失败');
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    return (
        <Layout>
            <FadeIn direction="up" distance={16} duration={0.5}>
                <section className="page-hero">
                    <div>
                        <p className="eyebrow">商品档案</p>
                        <h1>新增商品</h1>
                        <p className="muted">录入新商品的基本信息</p>
                    </div>
                </section>
            </FadeIn>

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

            <FadeIn direction="up" delay={0.1} distance={20}>
                <form onSubmit={handleSubmit} className="form-container">
                    <div className="form-grid">
                        <FormField label="商品编码" index={0}>
                            <input
                                name="productCode"
                                value={form.productCode}
                                onChange={handleChange}
                                required
                                placeholder="请输入商品编码"
                            />
                        </FormField>

                        <FormField label="商品名称" index={1}>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                placeholder="请输入商品名称"
                            />
                        </FormField>

                        <FormField label="分类" index={2}>
                            <input
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                required
                                placeholder="请输入商品分类"
                            />
                        </FormField>

                        <FormField label="单位" index={3}>
                            <input
                                name="unit"
                                value={form.unit}
                                onChange={handleChange}
                                required
                                placeholder="例如：件、箱、个"
                            />
                        </FormField>

                        <FormField label="售价" index={4}>
                            <input
                                name="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.price}
                                onChange={handleChange}
                                required
                                placeholder="0.00"
                            />
                        </FormField>

                        <FormField label="成本价" index={5}>
                            <input
                                name="cost"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.cost}
                                onChange={handleChange}
                                required
                                placeholder="0.00"
                            />
                        </FormField>

                        <FormField label="库存" index={6}>
                            <input
                                name="stock"
                                type="number"
                                min="0"
                                value={form.stock}
                                onChange={handleChange}
                                required
                                placeholder="0"
                            />
                        </FormField>

                        <FormField label="状态" index={7}>
                            <select name="status" value={form.status} onChange={handleChange}>
                                <option value="ACTIVE">启用</option>
                                <option value="INACTIVE">停用</option>
                            </select>
                        </FormField>

                        <FormField label="描述" index={8}>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={4}
                                placeholder="请输入商品描述（可选）"
                            />
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
                            {isSubmitting ? '保存中...' : '保存'}
                        </motion.button>
                    </div>
                </form>
            </FadeIn>
        </Layout>
    );
}