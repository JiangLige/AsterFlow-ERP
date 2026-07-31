import { useEffect, useState } from 'react';
import { Button, Search, Select, SelectItem } from '@carbon/react';
import Layout from '@/components/Layout';
import BusinessDataTable from '@/components/ui/BusinessDataTable';
import PageHeader from '@/components/ui/PageHeader';
import { apiRequest } from '@/lib/api';

type StockRecord = {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  changeQuantity: number;
  beforeStock: number;
  afterStock: number;
  type: string;
  remark: string;
  createdAt: string;
  sourceType: string;
  sourceId: number;
  sourceNo: string;
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
  { key: 'product', header: '商品' },
  { key: 'type', header: '类型' },
  { key: 'changeQuantity', header: '变更数量' },
  { key: 'beforeStock', header: '变更前库存' },
  { key: 'afterStock', header: '变更后库存' },
  { key: 'source', header: '来源单据' },
  { key: 'remark', header: '备注' },
];

function formatType(type: string) {
  if (type === 'IN') return '入库';
  if (type === 'OUT') return '出库';
  if (type === 'ADJUST') return '调整';
  return type;
}

function formatSource(record: StockRecord) {
  if (record.sourceNo) {
    return record.sourceNo;
  }

  if (record.sourceType) {
    return record.sourceType;
  }

  return '-';
}

export default function StockRecordsPage() {
  const [records, setRecords] = useState<StockRecord[]>([]);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRecords = async (
    targetPage: number,
    targetPageSize: number,
    targetKeyword: string,
    targetType: string,
  ) => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams();
      query.set('page', String(targetPage));
      query.set('size', String(targetPageSize));

      if (targetKeyword.trim()) {
        query.set('keyword', targetKeyword.trim());
      }

      if (targetType) {
        query.set('type', targetType);
      }

      const data = await apiRequest<PageResponse<StockRecord>>(
        `/api/stock-records?${query.toString()}`,
      );

      setRecords(data.records);
      setPage(data.page);
      setPageSize(data.size);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '库存流水加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords(1, 10, '', '');
  }, []);

  const rows = records.map((record) => ({
    id: String(record.id),
    createdAt: record.createdAt,
    product: (
      <span className="aster-product-reference">
        <span className="numeric">{record.productCode}</span>
        <span>{record.productName}</span>
      </span>
    ),
    type: <span className={`aster-stock-type aster-stock-type--${record.type.toLowerCase()}`}>{formatType(record.type)}</span>,
    changeQuantity: (
      <strong
        className={`numeric ${record.changeQuantity < 0 ? 'aster-quantity--negative' : 'aster-quantity--positive'}`}
      >
        {record.changeQuantity}
      </strong>
    ),
    beforeStock: <span className="numeric">{record.beforeStock}</span>,
    afterStock: <span className="numeric">{record.afterStock}</span>,
    source: <span className="numeric">{formatSource(record)}</span>,
    remark: record.remark || '-',
  }));

  return (
    <Layout>
      <div className="operations-list operations-list--stock">
        <PageHeader
          title="库存流水"
          description="查看入库、出库和调整记录，追溯来源单据。"
        />

        <BusinessDataTable
          empty={records.length === 0}
          emptyDescription="商品发生入库、出库或调整后，流水会显示在这里。"
          emptyTitle="暂无库存流水"
          error={error}
          headers={headers}
          loading={loading}
          onRetry={() => void loadRecords(page, pageSize, keyword, type)}
          pagination={{
            page,
            pageSize,
            total,
            onChange: ({ page: targetPage, pageSize: targetPageSize }) => {
              setPageSize(targetPageSize);
              void loadRecords(targetPage, targetPageSize, keyword, type);
            },
          }}
          rows={rows}
          toolbar={(
            <>
              <Search
                id="stock-record-search"
                labelText="搜索库存流水"
                onChange={(event) => {
                  const nextKeyword = event.target.value;
                  setKeyword(nextKeyword);

                  if (nextKeyword === '') {
                    void loadRecords(1, pageSize, '', type);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void loadRecords(1, pageSize, keyword, type);
                  }
                }}
                placeholder="输入商品编码或名称"
                size="lg"
                value={keyword}
              />
              <Select
                id="stock-record-type"
                labelText="流水类型"
                onChange={(event) => setType(event.target.value)}
                size="lg"
                value={type}
              >
                <SelectItem text="全部类型" value="" />
                <SelectItem text="入库" value="IN" />
                <SelectItem text="出库" value="OUT" />
                <SelectItem text="调整" value="ADJUST" />
              </Select>
              <Button
                disabled={loading}
                kind="secondary"
                onClick={() => void loadRecords(1, pageSize, keyword, type)}
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
