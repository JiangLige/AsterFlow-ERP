import { Button } from '@carbon/react';
import Link from 'next/link';

export type FormActionsProps = {
  submitting: boolean;
  submitLabel: string;
  cancelHref: string;
};

export default function FormActions({ submitting, submitLabel, cancelHref }: FormActionsProps) {
  return (
    <div className="aster-form-actions">
      <Button disabled={submitting} type="submit">
        {submitting ? '提交中...' : submitLabel}
      </Button>
      <Button as={Link} href={cancelHref} kind="secondary">
        取消
      </Button>
    </div>
  );
}
