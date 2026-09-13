import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low/60 py-12 text-center', className)}>
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high text-outline">
          {icon}
        </div>
      )}
      <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm font-body-md text-body-md text-on-surface-variant">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
