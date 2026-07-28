import type { NextPage } from 'next';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Add,
  ArrowRight,
  Delivery,
  InventoryManagement,
  Purchase,
  ShoppingCart,
  WarningAlt,
} from '@carbon/react/icons';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Layout from '@/components/Layout';
import DataState from '@/components/ui/DataState';
import PageHeader from '@/components/ui/PageHeader';
import { apiRequest } from '@/lib/api';
import {
  buildDashboardView,
  type DashboardSummary,
} from '@/lib/dashboard-view';

const taskIcons = [Purchase, ShoppingCart, WarningAlt];
const movementIcons = [InventoryManagement, Delivery];

function formatDate() {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date());
}

const Home: NextPage = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [displayName, setDisplayName] = useState('运营经理');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const summary = await apiRequest<DashboardSummary>('/api/dashboard-summary');
      setData(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : '运营总览加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setDisplayName(localStorage.getItem('realName') || localStorage.getItem('username') || '运营经理');
    loadDashboard();
  }, []);

  const dashboardView = useMemo(
    () => (data ? buildDashboardView(data) : null),
    [data],
  );

  return (
    <Layout>
      <PageHeader
        title={`运营总览，${displayName}`}
        description={formatDate()}
        actions={(
          <Link
            className="cds--btn cds--btn--primary"
            href="/purchase-orders/new"
          >
            新建采购单
            <Add aria-hidden="true" className="cds--btn__icon" size={16} />
          </Link>
        )}
      />

      <DataState
        loading={loading && !data}
        error={error}
        onRetry={loadDashboard}
        skeleton="text"
      />

      {data && dashboardView ? (
        <>
          <section className="metric-strip" aria-label="今日关键指标">
            {dashboardView.metrics.map((metric) => (
              <article className="metric-strip__item" key={metric.label}>
                <p>{metric.label}</p>
                <strong data-numeric="true">{metric.value}</strong>
                <span>{metric.detail}</span>
              </article>
            ))}
          </section>

          <section className="dashboard-grid">
            <article className="dashboard-panel task-queue">
              <header className="dashboard-panel__header">
                <div>
                  <h2>待办队列</h2>
                  <p>优先处理会影响订单流转和库存安全的事项。</p>
                </div>
                <span data-numeric="true">
                  {dashboardView.pendingCount + data.warningProductCount} 项
                </span>
              </header>

              <div className="task-queue__list">
                {dashboardView.tasks.map((task, index) => {
                  const TaskIcon = taskIcons[index];

                  return (
                    <Link className="task-queue__item" href={task.href} key={task.href}>
                      <TaskIcon aria-hidden="true" size={20} />
                      <span className="task-queue__copy">
                        <strong>{task.label}</strong>
                        <small>{task.description}</small>
                      </span>
                      <span className="task-queue__value" data-numeric="true">
                        {task.value}
                      </span>
                      <ArrowRight aria-hidden="true" size={16} />
                    </Link>
                  );
                })}
              </div>
            </article>

            <article className="dashboard-panel order-chart">
              <header className="dashboard-panel__header">
                <div>
                  <h2>订单状态分布</h2>
                  <p>采购与销售订单的当前状态汇总。</p>
                </div>
                <span>实时汇总</span>
              </header>

              <div className="order-chart__canvas" aria-label="采购与销售订单状态图表">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart
                    data={dashboardView.orderStatus}
                    margin={{ top: 16, right: 8, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="#e0e0e0"
                      strokeDasharray="2 2"
                      vertical={false}
                    />
                    <XAxis
                      axisLine={{ stroke: '#8d8d8d' }}
                      dataKey="status"
                      tick={{
                        fill: '#525252',
                        fontFamily: 'IBM Plex Sans, Noto Sans SC, sans-serif',
                        fontSize: 12,
                      }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tick={{
                        fill: '#8d8d8d',
                        fontFamily: 'IBM Plex Mono, monospace',
                        fontSize: 11,
                      }}
                      tickLine={false}
                      width={42}
                    />
                    <Tooltip
                      cursor={{ fill: '#f4f4f4' }}
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #8d8d8d',
                        borderRadius: 0,
                        boxShadow: 'none',
                        fontFamily: 'IBM Plex Sans, Noto Sans SC, sans-serif',
                      }}
                    />
                    <Legend
                      iconType="square"
                      wrapperStyle={{
                        color: '#525252',
                        fontFamily: 'IBM Plex Sans, Noto Sans SC, sans-serif',
                        fontSize: 12,
                        paddingTop: 12,
                      }}
                    />
                    <Bar
                      dataKey="purchase"
                      fill="#0f62fe"
                      maxBarSize={36}
                      name="采购"
                    />
                    <Bar
                      dataKey="sale"
                      fill="#4589ff"
                      maxBarSize={36}
                      name="销售"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="dashboard-panel movement-table">
              <header className="dashboard-panel__header">
                <div>
                  <h2>今日出入库动态</h2>
                  <p>按今日采购入库与销售出库汇总。</p>
                </div>
                <Link href="/stock-records">
                  查看全部
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </header>

              <div className="movement-table__scroll">
                <table aria-label="今日库存动态">
                  <thead>
                    <tr>
                      <th scope="col">类型</th>
                      <th scope="col">关联单据</th>
                      <th scope="col">数量</th>
                      <th scope="col">金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardView.movements.map((movement, index) => {
                      const MovementIcon = movementIcons[index];

                      return (
                        <tr key={movement.type}>
                          <th scope="row">
                            <MovementIcon aria-hidden="true" size={18} />
                            {movement.type}
                          </th>
                          <td>{movement.orders}</td>
                          <td data-numeric="true">{movement.quantity}</td>
                          <td data-numeric="true">{movement.amount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        </>
      ) : null}
    </Layout>
  );
};

export default Home;
