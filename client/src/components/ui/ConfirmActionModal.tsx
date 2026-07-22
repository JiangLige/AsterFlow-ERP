import { Button, ComposedModal, ModalBody, ModalFooter, ModalHeader } from '@carbon/react';

export type ConfirmActionModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  submitting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmActionModal({
  open,
  title,
  description,
  confirmLabel,
  danger = false,
  submitting = false,
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  return (
    <ComposedModal danger={danger} onClose={onClose} open={open} size="sm">
      <ModalHeader closeModal={onClose} iconDescription="关闭" title={title} />
      <ModalBody>
        <p>{description}</p>
      </ModalBody>
      <ModalFooter>
        <Button disabled={submitting} kind="secondary" onClick={onClose} type="button">
          取消
        </Button>
        <Button
          disabled={submitting}
          kind={danger ? 'danger' : 'primary'}
          onClick={onConfirm}
          type="button"
        >
          {submitting ? '处理中...' : confirmLabel}
        </Button>
      </ModalFooter>
    </ComposedModal>
  );
}
