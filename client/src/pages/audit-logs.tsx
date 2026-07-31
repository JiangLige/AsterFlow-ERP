import { useEffect, useState } from 'react';
import { Button, Search, Select, SelectItem } from '@carbon/react';
import Layout from '@/components/Layout';
import BusinessDataTable from '@/components/ui/BusinessDataTable';
import PageHeader from '@/components/ui/PageHeader';
import { apiRequest } from '@/lib/api';

type AuditLog = {
  id: number;
  operatorId: number;
  operatorName: string;
  operatorRole: string;
  action: string;
  targetType: string;
  targetId: number;
  targetNo: string;
  description: string;
  createdAt: string;
};

type PageResponse<T> = {
  records: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

const headers = [
  { key: 'createdAt', header: '时间' },
  { key: 'operator', header: '操作人' },
  { key: 'action', header: '动作' },
  { key: 'targetType', header: '对象' },
  { key: 'targetNo', header: '对象编号' },
  { key: 'description', header: '描述' },
];

function formatAction(action: string) {
  const map: Record<string, string> = {
    STOCK_ADJUST: '库存调整',
    PURCHASE_APPROVE: '采购审核',
    PURCHASE_CANCEL: '采购取消',
    SALE_APPROVE: '销售审核',
    SALE_CANCEL: '销售取消',
  };

  return map[action] || action;
}

function formatTargetType(targetType: string) {
  const map: Record<string, string> = {
    PRODUCT: '商品',
    PURCHASE_ORDER: '采购单',
    SALE_ORDER: '销售单',
  };

  return map[targetType] || targetType;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [keyword, setKeyword] = useState('');
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadLogs(
    targetPage: number,
    targetPageSize: number,
    targetKeyword: string,
    targetAction: string,
    targetTargetType: string,
  ) {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams();
      query.set('page', String(targetPage));
      query.set('size', String(targetPageSize));

      if (targetKeyword.trim()) {
        query.set('keyword', targetKeyword.trim());
      }

      if (targetAction) {
        query.set('action', targetAction);
      }

      if (targetTargetType) {
        query.set('targetType', targetTargetType);
      }

      const data = await apiRequest<PageResponse<AuditLog>>(
        `/api/audit-logs?${query.toString()}`,
      );

      setLogs(data.records);
      setPage(data.page);
      setPageSize(data.size);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '审计日志加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs(1, 10, '', '', '');
  }, []);

  const rows = logs.map((log) => ({
    id: String(log.id),
    createdAt: log.createdAt,
    operator: (
      <span className="aster-operator-reference">
        <span>{log.operatorName}</span>
        <span className="aster-secondary-text">{log.operatorRole}</span>
      </span>
    ),
    action: formatAction(log.action),
    targetType: formatTargetType(log.targetType),
    targetNo: <span className="numeric">{log.targetNo || '-'}</span>,
    description: log.description,
  }));

  return (
    <Layout>
      <div className="operations-list operations-list--audit">
        <PageHeader
          title="审计日志"
          description="查看关键库存和订单动作的操作记录。"
        />

        <BusinessDataTable
          empty={logs.length === 0}
          emptyDescription="关键库存和订单操作发生后，审计记录会显示在这里。"
          emptyTitle="暂无审计日志"
          error={error}
          headers={headers}
          loading={loading}
          onRetry={() => void loadLogs(page, pageSize, keyword, action, targetType)}
          pagination={{
            page,
            pageSize,
            total,
            onChange: ({ page: targetPage, pageSize: targetPageSize }) => {
              setPageSize(targetPageSize);
              void loadLogs(targetPage, targetPageSize, keyword, action, targetType);
            },
          }}
          rows={rows}
          toolbar={(
            <>
              <Search
                id="audit-log-search"
                labelText="搜索审计日志"
                onChange={(event) => {
                  const nextKeyword = event.target.value;
                  setKeyword(nextKeyword);

                  if (nextKeyword === '') {
                    void loadLogs(1, pageSize, '', action, targetType);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void loadLogs(1, pageSize, keyword, action, targetType);
                  }
                }}
                placeholder="输入操作人、单号或描述"
                size="lg"
                value={keyword}
              />
              <Select
                id="audit-action"
                labelText="审计动作"
                onChange={(event) => setAction(event.target.value)}
                size="lg"
                value={action}
              >
                <SelectItem text="全部动作" value="" />
                <SelectItem text="库存调整" value="STOCK_ADJUST" />
                <SelectItem text="采购审核" value="PURCHASE_APPROVE" />
                <SelectItem text="采购取消" value="PURCHASE_CANCEL" />
                <SelectItem text="销售审核" value="SALE_APPROVE" />
                <SelectItem text="销售取消" value="SALE_CANCEL" />
              </Select>
              <Select
                id="audit-target-type"
                labelText="对象类型"
                onChange={(event) => setTargetType(event.target.value)}
                size="lg"
                value={targetType}
              >
                <SelectItem text="全部对象" value="" />
                <SelectItem text="商品" value="PRODUCT" />
                <SelectItem text="采购单" value="PURCHASE_ORDER" />
                <SelectItem text="销售单" value="SALE_ORDER" />
              </Select>
              <Button
                disabled={loading}
                kind="secondary"
                onClick={() => void loadLogs(1, pageSize, keyword, action, targetType)}
                size="lg"
                type="button"
              >
                {loading ? '查询中...' : '查询'}
              </Button>
            </>
          )}
        />
      </div>
    </Layout>
  );
}
