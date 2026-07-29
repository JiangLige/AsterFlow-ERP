import type { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@carbon/react';
import PageHeader from '@/components/ui/PageHeader';
import StatusTag from '@/components/ui/StatusTag';

export type OrderDetailLayoutProps = {
  title: string;
  backHref: string;
  status: string;
  summary: Array<{ label: string; value: ReactNode; numeric?: boolean }>;
  items: Array<{ id: number; productCode: string; productName: string; quantity: number; price: number; amount: number }>;
};

export default function OrderDetailLayout({ title, backHref, status, summary, items }: OrderDetailLayoutProps) {
  return (
    <main className="aster-order-detail">
      <PageHeader backHref={backHref} status={<StatusTag status={status} />} title={title} />
      <section aria-label="订单基础信息" className="aster-detail-grid">
        <dl className="aster-order-summary">
          {summary.map(({ label, value, numeric }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={numeric ? 'numeric' : undefined}>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="order-detail-items-heading" className="aster-order-detail__items">
        <h2 id="order-detail-items-heading">商品明细</h2>
        <div className="aster-table-scroll">
          <Table aria-label="订单商品明细" size="md">
            <TableHead>
              <TableRow>
                <TableHeader>商品编码</TableHeader>
                <TableHeader>商品名称</TableHeader>
                <TableHeader className="numeric">数量</TableHeader>
                <TableHeader className="numeric">单价</TableHeader>
                <TableHeader className="numeric">金额</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="aster-mono">{item.productCode}</TableCell>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell className="numeric">{item.quantity}</TableCell>
                  <TableCell className="numeric">{item.price.toFixed(2)}</TableCell>
                  <TableCell className="numeric">{item.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
