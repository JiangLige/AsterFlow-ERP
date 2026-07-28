import {
  DataTable,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type DataTableHeader,
  type PaginationProps,
} from '@carbon/react';
import type React from 'react';
import DataState from './DataState';

export type BusinessDataTableRow = {
  id: string;
  [key: string]: React.ReactNode;
};

export type BusinessDataTablePagination = {
  page: number;
  pageSize: number;
  pageSizes?: number[];
  total: number;
  onChange: NonNullable<PaginationProps['onChange']>;
};

export type BusinessDataTableProps<Row extends BusinessDataTableRow = BusinessDataTableRow> = {
  headers: DataTableHeader[];
  rows: Row[];
  toolbar?: React.ReactNode;
  loading?: boolean;
  error?: string;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  pagination: BusinessDataTablePagination;
};

export default function BusinessDataTable<Row extends BusinessDataTableRow>({
  headers,
  rows,
  toolbar,
  loading = false,
  error,
  empty = rows.length === 0,
  emptyTitle,
  emptyDescription,
  onRetry,
  pagination,
}: BusinessDataTableProps<Row>) {
  const hasState = loading || Boolean(error) || empty;
  const pageSizes = Array.from(
    new Set([10, 20, 50, ...(pagination.pageSizes ?? []), pagination.pageSize]),
  ).sort((left, right) => left - right);

  return (
    <section className="aster-business-table">
      {toolbar ? <div className="aster-toolbar">{toolbar}</div> : null}
      {hasState ? (
        <DataState
          empty={empty}
          emptyDescription={emptyDescription}
          emptyTitle={emptyTitle}
          error={error}
          loading={loading}
          onRetry={onRetry}
          skeleton="table"
        />
      ) : (
        <>
          <div className="aster-table-scroll">
            <DataTable headers={headers} rows={rows} size="sm">
              {({ rows: tableRows, headers: tableHeaders, getHeaderProps, getRowProps, getTableProps }) => (
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {tableHeaders.map((header) => (
                        <TableHeader {...getHeaderProps({ header })} key={header.key}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRows.map((row) => (
                      <TableRow {...getRowProps({ row })} key={row.id}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataTable>
          </div>
          <Pagination
            backwardText="上一页"
            forwardText="下一页"
            itemRangeText={() => `共 ${pagination.total} 条`}
            itemsPerPageText="每页条数"
            onChange={pagination.onChange}
            page={pagination.page}
            pageNumberText="页码"
            pageRangeText={(current, total) => `${current} / ${total} 页`}
            pageSize={pagination.pageSize}
            pageSizes={pageSizes}
            totalItems={pagination.total}
          />
        </>
      )}
    </section>
  );
}
