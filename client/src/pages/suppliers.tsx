import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';

type Supplier = {
    id: number;
    supplierCode: string;
    name: string;
    contactName: string;
    phone: string;
    address: string;
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

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [role, setRole] = useState('');

    const loadSuppliers = useCallback(async (
        targetPage: number,
        currentKeyword: string
    ) => {
        setLoading(true);
        setError('');

        try {
            const query = new URLSearchParams();
            query.set('page', String(targetPage));
            query.set('size', '10');

            if (currentKeyword.trim()) {
                query.set('keyword', currentKeyword.trim());
            }

            const data = await apiRequest<PageResponse<Supplier>>(`/api/suppliers?${query.toString()}`);

            setSuppliers(data.records);
            setPage(data.page);
            setPages(data.pages);
            setTotal(data.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : '供应商加载失败');
        } finally {
            setLoading(false);
        }
    }, []);

    async function handleChangeStatus(id: number, nextStatus: 'ACTIVE' | 'INACTIVE') {
        const actionText = nextStatus === 'ACTIVE' ? '启用' : '停用';
        const ok = window.confirm(`确定要${actionText}这个供应商吗？`);

        if (!ok) {
            return;
        }

        setError('');

        try {
            const action = nextStatus === 'ACTIVE' ? 'active' : 'inactive';

            await apiRequest(`/api/suppliers/${id}/${action}`, {
                method: 'PATCH',
            });

            loadSuppliers(page, keyword);
        } catch (err) {
            setError(err instanceof Error ? err.message : `${actionText}供应商失败`);
        }
    }

    useEffect(() => {
        setRole(localStorage.getItem('role') || '');
        loadSuppliers(1, '');
    }, [loadSuppliers]);

    return (
        <Layout>
            <section className="page-hero">
                <div>
                    <p className="eyebrow">供应网络</p>
                    <h1>供应商列表</h1>
                    <p className="muted">管理供应商资料、联系方式和启停状态。</p>
                </div>

                <div className="page-actions">
                    <Link className="btn-primary" href="/suppliers/new">
                        新增供应商
                    </Link>
                </div>
            </section>

            <div className="toolbar">
                <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="输入供应商编码/名称/电话"
                />

                <button onClick={() => loadSuppliers(1, keyword)} disabled={loading}>
                    {loading ? '查询中...' : '查询'}
                </button>
            </div>

            <ErrorMessage message={error} />

            <p className="muted" style={{ marginTop: '1rem' }}>
                第 {page} / {pages} 页，共 {total} 条
            </p>

            <table>
                <thead>
                    <tr>
                        <th>编码</th>
                        <th>名称</th>
                        <th>联系人</th>
                        <th>电话</th>
                        <th>地址</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {suppliers.map((supplier) => (
                        <tr key={supplier.id}>
                            <td>{supplier.supplierCode}</td>
                            <td>{supplier.name}</td>
                            <td>{supplier.contactName || '-'}</td>
                            <td>{supplier.phone || '-'}</td>
                            <td>{supplier.address || '-'}</td>
                            <td>
                                <span className={`status-badge ${supplier.status === 'ACTIVE' ? 'success' : 'warning'}`}>
                                    {formatStatus(supplier.status)}
                                </span>
                            </td>
                            <td className="action-cell">
                                <Link href={`/suppliers/${supplier.id}/edit`}>编辑</Link>

                                {role === 'ADMIN' && supplier.status === 'ACTIVE' && (
                                    <button onClick={() => handleChangeStatus(supplier.id, 'INACTIVE')}>
                                        停用
                                    </button>
                                )}

                                {role === 'ADMIN' && supplier.status === 'INACTIVE' && (
                                    <button onClick={() => handleChangeStatus(supplier.id, 'ACTIVE')}>
                                        启用
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {!loading && suppliers.length === 0 && (
                <EmptyState
                    title="暂无供应商数据"
                    description="可以新增供应商，或调整查询条件后重新搜索。"
                />
            )}

            <div className="toolbar">
                <button onClick={() => loadSuppliers(page - 1, keyword)} disabled={loading || page <= 1}>
                    上一页
                </button>
                <button onClick={() => loadSuppliers(page + 1, keyword)} disabled={loading || page >= pages}>
                    下一页
                </button>
            </div>
        </Layout>
    );
}
