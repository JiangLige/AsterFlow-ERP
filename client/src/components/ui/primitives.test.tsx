import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConfirmActionModal from './ConfirmActionModal';
import DataState from './DataState';
import FormActions from './FormActions';
import OverflowActions from './OverflowActions';

afterEach(cleanup);

describe('OverflowActions', () => {
  it('keeps disabled actions inert while enabled actions retain navigation and callbacks', () => {
    const disabledClick = vi.fn();
    const enabledClick = vi.fn();

    render(
      <OverflowActions
        actions={[
          {
            label: '删除',
            href: '/products/1/delete',
            onClick: disabledClick,
            disabled: true,
            danger: true,
          },
          {
            label: '查看',
            href: '/products/1',
            onClick: enabledClick,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '更多操作' }));

    const disabledAction = screen.getByText('删除').closest('[role="menuitem"]');
    expect(disabledAction).not.toBeNull();
    expect(disabledAction).not.toHaveAttribute('href');
    fireEvent.click(disabledAction as HTMLElement);
    expect(disabledClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '更多操作' }));
    const enabledAction = screen.getByText('查看').closest('[role="menuitem"]');
    expect(enabledAction).not.toBeNull();
    expect(enabledAction).toHaveAttribute('href', '/products/1');
    enabledAction?.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(enabledAction as HTMLElement);
    expect(enabledClick).toHaveBeenCalledOnce();
  });
});

describe('ConfirmActionModal', () => {
  it('blocks every close path while submitting', () => {
    const onClose = vi.fn();

    render(
      <ConfirmActionModal
        confirmLabel="确认删除"
        description="删除后无法恢复。"
        onClose={onClose}
        onConfirm={vi.fn()}
        open
        submitting
        title="删除商品"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(screen.getByRole('button', { name: '处理中...' })).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('allows the modal to close when it is not submitting', () => {
    const onClose = vi.fn();

    render(
      <ConfirmActionModal
        confirmLabel="确认"
        description="确认执行该操作。"
        onClose={onClose}
        onConfirm={vi.fn()}
        open
        title="确认操作"
      />,
    );

    expect(screen.getByRole('dialog', { name: '确认操作' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('DataState', () => {
  it('calls the retry callback from the error notification', () => {
    const onRetry = vi.fn();
    render(<DataState error="网络连接失败" loading={false} onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: '重试' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe('FormActions', () => {
  it('keeps submit semantics and the cancel destination while submitting', () => {
    render(<FormActions cancelHref="/products" submitLabel="保存商品" submitting />);

    const submit = screen.getByRole('button', { name: '提交中...' });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('type', 'submit');
    expect(screen.getByRole('link', { name: '取消' })).toHaveAttribute('href', '/products');
  });
});
