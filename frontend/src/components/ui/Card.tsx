import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-outline-variant/15 bg-surface-container-low p-space-md shadow-elevation-1',
        className,
      )}
      {...props}
    />
  );
}
