// ============================================
// JobWatch - Notifications Page
// ============================================

import { useState } from 'react';
import { Bell, Mail, Send, AlertCircle, FileText } from 'lucide-react';
import { useNotifications, useMarkNotificationRead } from '@/hooks';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelativeTime } from '@/lib/utils';
import type { NotificationStatus, NotificationType } from '@/types';

const typeIcons: Record<string, React.ReactNode> = {
  NEW_JOB: <Bell className="h-3.5 w-3.5 text-cyan-400" />,
  MONITORING_ERROR: <AlertCircle className="h-3.5 w-3.5 text-red-400" />,
  MONITORING_PAUSED: <AlertCircle className="h-3.5 w-3.5 text-amber-400" />,
  SUMMARY: <FileText className="h-3.5 w-3.5 text-slate-400" />,
};

const typeLabels: Record<string, string> = {
  NEW_JOB: 'Nova vaga encontrada',
  MONITORING_ERROR: 'Erro no monitoramento',
  MONITORING_PAUSED: 'Monitoramento pausado',
  SUMMARY: 'Resumo periódico',
};

const channelIcons: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="h-3 w-3" />,
  PUSH: <Send className="h-3 w-3" />,
  SMS: <Send className="h-3 w-3" />,
};

export function NotificationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const { data, isLoading } = useNotifications({
    status: (statusFilter || undefined) as NotificationStatus | undefined,
    type: (typeFilter || undefined) as NotificationType | undefined,
  });
  const markRead = useMarkNotificationRead();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-100">Notificações</h1>
        <p className="text-sm text-slate-400">Histórico de notificações enviadas</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'SENT', label: 'Enviadas' },
            { value: 'FAILED', label: 'Falhas' },
            { value: 'READ', label: 'Lidas' },
            { value: 'PENDING', label: 'Pendentes' },
          ]}
          placeholder="Todas"
          className="w-32"
        />
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: 'NEW_JOB', label: 'Nova vaga' },
            { value: 'MONITORING_ERROR', label: 'Erro' },
            { value: 'SUMMARY', label: 'Resumo' },
          ]}
          placeholder="Todos os tipos"
          className="w-40"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <SkeletonList count={4} />
      ) : data?.data && data.data.length > 0 ? (
        <div className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900/30">
          {data.data.map((notif) => (
            <div key={notif.id} className="flex items-start gap-3 p-4 hover:bg-slate-800/30 transition-colors">
              <div className="mt-0.5 shrink-0">{typeIcons[notif.type] || <Bell className="h-3.5 w-3.5 text-slate-400" />}</div>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{typeLabels[notif.type] || notif.type}</p>
                    <p className="text-sm text-slate-200 mt-0.5">{notif.title}</p>
                  </div>
                  <StatusBadge status={notif.status} />
                </div>
                <p className="text-xs text-slate-400">{notif.message}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">{channelIcons[notif.channel] || null} {notif.channel}</span>
                  <span>{formatRelativeTime(notif.createdAt)}</span>
                </div>
              </div>
              {notif.status === 'SENT' && (
                <Button variant="ghost" size="sm" onClick={() => markRead.mutate(notif.id)} className="shrink-0">
                  Marcar lida
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell className="h-10 w-10" />}
          title="Nenhuma notificação"
          description="Notificações serão exibidas aqui quando forem enviadas."
        />
      )}
    </div>
  );
}
