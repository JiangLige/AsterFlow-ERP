import { Button, DataTableSkeleton as TableSkeleton, InlineNotification, SkeletonText } from '@carbon/react';

export type DataStateProps = {
  loading: boolean;
  error?: string;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  skeleton?: 'table' | 'text';
};

export default function DataState({
  loading,
  error,
  empty = false,
  emptyTitle = '暂无数据',
  emptyDescription = '当前没有可显示的数据。',
  onRetry,
  skeleton = 'table',
}: DataStateProps) {
  if (loading) {
    return (
      <div className="aster-state" aria-label="正在加载" aria-busy="true">
        {skeleton === 'table' ? (
          <TableSkeleton columnCount={5} rowCount={5} showHeader={false} showToolbar={false} />
        ) : (
          <SkeletonText lineCount={4} paragraph />
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="aster-state">
        <InlineNotification
          hideCloseButton
          kind="error"
          lowContrast
          role="alert"
          subtitle={error}
          title="加载失败"
        />
        {onRetry ? (
          <div className="aster-state__actions">
            <Button kind="ghost" onClick={onRetry} size="sm" type="button">
              重试
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="aster-state aster-state--empty" role="status">
        <h2>{emptyTitle}</h2>
        {emptyDescription ? <p>{emptyDescription}</p> : null}
      </div>
    );
  }

  return null;
}
