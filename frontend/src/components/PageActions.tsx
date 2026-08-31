import type { ReactNode } from 'react';

interface PageActionsProps {
  children: ReactNode;
  sticky?: boolean;
}

export function PageActions({ children, sticky = true }: PageActionsProps) {
  return (
    <div className={sticky ? 'page-actions sticky-actions' : 'page-actions'}>
      {children}
    </div>
  );
}
