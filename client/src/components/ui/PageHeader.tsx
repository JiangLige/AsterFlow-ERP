import Link from 'next/link';
import type React from 'react';

export type PageHeaderProps = {
  title: string;
  description?: string;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
};

export default function PageHeader({
  title,
  description,
  status,
  actions,
  backHref,
}: PageHeaderProps) {
  return (
    <header className="aster-page-header">
      <div className="aster-page-header__content">
        {backHref ? (
          <Link className="aster-page-header__back" href={backHref}>
            返回
          </Link>
        ) : null}
        <div className="aster-page-header__title-row">
          <h1>{title}</h1>
          {status}
        </div>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="aster-page-actions">{actions}</div> : null}
    </header>
  );
}
