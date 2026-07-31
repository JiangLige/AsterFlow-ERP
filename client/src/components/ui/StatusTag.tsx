import { Tag } from '@carbon/react';

const STATUS = {
  DRAFT: { label: '草稿', type: 'blue' },
  PROCESSING: { label: '处理中', type: 'blue' },
  APPROVED: { label: '已审核', type: 'green' },
  COMPLETED: { label: '已完成', type: 'green' },
  ACTIVE: { label: '启用', type: 'green' },
  CANCELED: { label: '已取消', type: 'red' },
  RISK: { label: '存在风险', type: 'red' },
  INACTIVE: { label: '停用', type: 'gray' },
} as const;

export function getStatusPresentation(status: string) {
  return STATUS[status as keyof typeof STATUS] ?? { label: status, type: 'gray' as const };
}

export default function StatusTag({ status }: { status: string }) {
  const presentation = getStatusPresentation(status);
  return <Tag type={presentation.type}>{presentation.label}</Tag>;
}
