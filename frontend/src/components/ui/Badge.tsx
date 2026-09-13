import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

const badgeVariants = {
  default: 'bg-surface-container-high text-on-surface border border-outline-variant/25',
  success: 'bg-primary-container/15 text-primary border border-primary-container/30',
  warning: 'bg-tertiary-container/15 text-tertiary border border-tertiary-container/35',
  danger: 'bg-error-container/15 text-error border border-error/30',
  info: 'bg-secondary-container/15 text-secondary border border-secondary-container/30',
  neutral: 'bg-surface-container text-on-surface-variant border border-outline-variant/20',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 font-mono-sm text-mono-sm font-semibold',
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

type StatusType =
  | 'ACTIVE'
  | 'PAUSED'
  | 'ERROR'
  | 'NEW'
  | 'VIEWED'
  | 'APPLIED'
  | 'EXPIRED'
  | 'SENT'
  | 'FAILED'
  | 'PENDING'
  | 'READ'
  | 'SUCCESS'
  | 'RUNNING';

interface StatusBadgeProps {
  status: StatusType;
  withDot?: boolean;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: BadgeProps['variant'] }> = {
  ACTIVE: { label: 'Ativo', variant: 'success' },
  PAUSED: { label: 'Pausado', variant: 'warning' },
  ERROR: { label: 'Erro', variant: 'danger' },
  NEW: { label: 'Novo', variant: 'success' },
  VIEWED: { label: 'Visualizado', variant: 'neutral' },
  APPLIED: { label: 'Candidatado', variant: 'success' },
  EXPIRED: { label: 'Não apresentada', variant: 'warning' },
  SENT: { label: 'Enviado', variant: 'success' },
  FAILED: { label: 'Falhou', variant: 'danger' },
  PENDING: { label: 'Pendente', variant: 'warning' },
  READ: { label: 'Lido', variant: 'neutral' },
  SUCCESS: { label: 'Sucesso', variant: 'success' },
  RUNNING: { label: 'Executando', variant: 'info' },
};

export function StatusBadge({ status, withDot = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const dotColors: Record<string, string> = {
    success: 'bg-primary',
    warning: 'bg-tertiary',
    danger: 'bg-error',
    info: 'bg-secondary',
    neutral: 'bg-outline',
  };

  return (
    <Badge variant={config.variant} className={cn('gap-1.5', className)}>
      {withDot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[config.variant || 'neutral'])} />}
      {config.label}
    </Badge>
  );
}
