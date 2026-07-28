import { OverflowMenu, OverflowMenuItem } from '@carbon/react';

export type OverflowAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  danger?: boolean;
};

export type OverflowActionsProps = {
  actions: OverflowAction[];
};

export default function OverflowActions({ actions }: OverflowActionsProps) {
  return (
    <OverflowMenu aria-label="更多操作" iconDescription="更多操作" size="sm">
      {actions.map((action, index) => {
        const disabled = action.disabled === true;

        return (
          <OverflowMenuItem
            disabled={disabled}
            href={disabled ? undefined : action.href}
            isDelete={action.danger}
            itemText={action.label}
            key={`${action.label}-${index}`}
            onClick={!disabled && action.onClick ? () => action.onClick?.() : undefined}
          />
        );
      })}
    </OverflowMenu>
  );
}
