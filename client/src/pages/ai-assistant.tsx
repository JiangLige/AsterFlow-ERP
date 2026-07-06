import { useState } from 'react';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';

export default function AiAssistantPage() {
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function loadAdvice() {
        setLoading(true);
        setError('');

        try {
            const data = await apiRequest<string>('/api/ai/inventory-advice');
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

            {error && <div className="alert alert-danger">{error}</div>}

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
                <div className="panel">
                    <div className="panel-header">
                        <div>
                            <p className="panel-title">正在生成</p>
                            <p className="panel-subtitle">AI 正在根据库存预警和看板数据整理建议。</p>
                        </div>
                    </div>
                </div>
            )}

            {advice && (
                <div className="panel">
                    <div className="panel-header">
                        <div>
                            <p className="panel-title">AI 库存建议</p>
                            <p className="panel-subtitle">建议只作为经营参考，最终库存调整仍以人工审核为准。</p>
                        </div>
                    </div>

                    <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, margin: 0 }}>
                        {advice}
                    </pre>
                </div>
            )}
        </Layout>
    );
}