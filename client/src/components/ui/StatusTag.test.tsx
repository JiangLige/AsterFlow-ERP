import { describe, expect, it } from 'vitest';
import { getStatusPresentation } from './StatusTag';

describe('StatusTag', () => {
  it('maps canonical and unknown business statuses to Carbon presentations', () => {
    expect(getStatusPresentation('DRAFT')).toEqual({ label: '草稿', type: 'blue' });
    expect(getStatusPresentation('APPROVED')).toEqual({ label: '已审核', type: 'green' });
    expect(getStatusPresentation('CANCELED')).toEqual({ label: '已取消', type: 'red' });
    expect(getStatusPresentation('INACTIVE')).toEqual({ label: '停用', type: 'gray' });
    expect(getStatusPresentation('UNKNOWN')).toEqual({ label: 'UNKNOWN', type: 'gray' });
  });
});
