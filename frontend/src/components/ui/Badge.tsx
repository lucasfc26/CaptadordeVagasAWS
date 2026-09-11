import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

const badgeVariants = {
  default: 'bg-slate-700 text-slate-300',
  success: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20',
  danger: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/20',
  info: 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/20',
  neutral: 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', badgeVariants[variant], className)}>
      {children}
    </span>
  );
}

// Status-specific badges
type StatusType = 'ACTIVE' | 'PAUSED' | 'ERROR' | 'NEW' | 'VIEWED' | 'APPLIED' | 'EXPIRED' | 'SENT' | 'FAILED' | 'PENDING' | 'READ' | 'SUCCESS' | 'RUNNING';

interface StatusBadgeProps {
  status: StatusType;
  withDot?: boolean;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: BadgeProps['variant'] }> = {
  ACTIVE: { label: 'Ativo', variant: 'success' },
  PAUSED: { label: 'Pausado', variant: 'warning' },
  ERROR: { label: 'Erro', variant: 'danger' },
  NEW: { label: 'Novo', variant: 'info' },
  VIEWED: { label: 'Visualizado', variant: 'neutral' },
  APPLIED: { label: 'Candidatado', variant: 'success' },
  EXPIRED: { label: 'Expirado', variant: 'neutral' },
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
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    info: 'bg-cyan-400',
    neutral: 'bg-slate-400',
  };

  return (
    <Badge variant={config.variant} className={cn('gap-1.5', className)}>
      {withDot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[config.variant || 'neutral'])} />}
      {config.label}
    </Badge>
  );
}
