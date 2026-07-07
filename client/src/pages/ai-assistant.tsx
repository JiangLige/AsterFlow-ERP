import { useState } from 'react';
import Layout from '@/components/Layout';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import { apiRequest } from '@/lib/api';

type AiInventoryAdviceResponse = {
    summary: string;
    risks: string[];
    replenishmentSuggestions: string[];
    nextActions: string[];
};

function AdvicePanel({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
    const values = Array.isArray(items) ? items.filter(Boolean) : [];

    return (
        <article className="panel">
            <div className="panel-header">
                <div>
                    <h2 className="panel-title">{title}</h2>
                    <p className="panel-subtitle">{values.length > 0 ? `${values.length} 条建议` : emptyText}</p>
                </div>
            </div>

            {values.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
                    {values.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            ) : (
                <EmptyState title={emptyText} />
            )}
        </article>
    );
}

export default function AiAssistantPage() {
    const [advice, setAdvice] = useState<AiInventoryAdviceResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function loadAdvice() {
        setLoading(true);
        setError('');
        setAdvice(null);

        try {
            const data = await apiRequest<AiInventoryAdviceResponse>('/api/ai/inventory-advice');
            setAdvice(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'AI 建议生成失败');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout>
            <section className="page-hero">
                <div>
                    <p className="eyebrow">Spring AI</p>
                    <h1>AI 经营助手</h1>
                    <p className="muted">根据 ERP 看板数据和库存预警生成库存风险与补货建议。</p>
                </div>

                <div className="page-actions">
                    <button className="btn-primary" onClick={loadAdvice} disabled={loading}>
                        {loading ? '生成中...' : '生成库存建议'}
                    </button>
                </div>
            </section>

            <ErrorMessage message={error} />

            {!advice && !loading && !error && (
                <div className="panel">
                    <div className="panel-header">
                        <div>
                            <p className="panel-title">等待生成建议</p>
                            <p className="panel-subtitle">
                                点击右上角按钮后，系统会读取当前 ERP 数据并请求 Spring AI 生成分析。
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <EmptyState
                    title="AI 正在生成库存建议..."
                    description="系统正在读取 ERP 数据并调用 Spring AI，请稍候。"
                />
            )}

            {advice && (
                <section className="dashboard-grid">
                    <article className="panel">
                        <div className="panel-header">
                            <div>
                                <h2 className="panel-title">经营概况</h2>
                                <p className="panel-subtitle">AI 根据当前 ERP 数据生成</p>
                            </div>
                        </div>
                        <p style={{ margin: 0, lineHeight: 1.9 }}>{advice.summary}</p>
                    </article>

                    <AdvicePanel title="库存风险" items={advice.risks} emptyText="暂无库存风险" />
                    <AdvicePanel title="补货建议" items={advice.replenishmentSuggestions} emptyText="暂无补货建议" />
                    <AdvicePanel title="下一步动作" items={advice.nextActions} emptyText="暂无下一步动作" />
                </section>
            )}
        </Layout>
    );
}