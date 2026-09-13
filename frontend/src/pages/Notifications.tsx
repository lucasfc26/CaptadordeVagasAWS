import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useDeleteAllNotifications,
  useDeleteNotification,
  useDeleteNotifications,
  useMarkJobViewed,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks';
import { useSelection } from '@/hooks/useSelection';
import { useToast } from '@/context/ToastContext';
import { StatusBadge } from '@/components/ui/Badge';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { SkeletonList } from '@/components/ui/Skeleton';
import { channelLabel, notificationIcon, notificationTypeLabel } from '@/lib/display';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification, NotificationStatus, NotificationType } from '@/types';

export function NotificationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, isLoading } = useNotifications({
    status: (statusFilter || undefined) as NotificationStatus | undefined,
    type: (typeFilter || undefined) as NotificationType | undefined,
  });
  const markRead = useMarkNotificationRead();
  const markViewed = useMarkJobViewed();
  const deleteOne = useDeleteNotification();
  const deleteMany = useDeleteNotifications();
  const deleteAll = useDeleteAllNotifications();
  const items = data?.data ?? [];
  const selection = useSelection(items.map((item) => item.id));
  const unread = items.filter((item) => item.status === 'SENT' || item.status === 'PENDING').length;

  const openNotification = (notif: Notification) => {
    if (notif.status === 'SENT' || notif.status === 'PENDING') markRead.mutate(notif.id);
    if (notif.jobId) {
      markViewed.mutate(notif.jobId);
      navigate(`/jobs/${notif.jobId}`);
    }
  };

  const handleDelete = (notif: Notification) => {
    if (!window.confirm(`Excluir a notificação "${notif.title}"?`)) return;
    deleteOne.mutate(notif.id, { onSuccess: () => toast('Notificação excluída') });
  };

  return (
    <div className="space-y-space-lg">
      <section className="flex flex-col justify-between gap-space-md pt-space-xs md:flex-row md:items-center">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">Central de Notificações</h1>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Clique no card para marcar como lida. Exclua uma, várias ou todas.
          </p>
        </div>
        {unread > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-container/20 px-space-sm py-1 font-mono-sm text-mono-sm font-semibold text-tertiary">
            {unread} não lida{unread === 1 ? '' : 's'}
          </span>
        )}
      </section>

      <section className="flex flex-col justify-between gap-space-md rounded-xl border border-outline-variant/15 bg-surface-container-low p-space-sm shadow-elevation-1">
        <div className="flex flex-col justify-between gap-space-sm lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-space-xs">
            {[
              { value: '', label: 'Todas' },
              { value: 'SENT', label: 'Não lidas' },
              { value: 'READ', label: 'Lidas' },
              { value: 'FAILED', label: 'Falhas' },
              { value: 'PENDING', label: 'Pendentes' },
            ].map((item) => (
              <button
                key={item.value || 'all'}
                type="button"
                onClick={() => setStatusFilter(item.value)}
                className={`rounded-full px-space-sm py-1 font-body-sm text-body-sm ${statusFilter === item.value ? 'bg-primary font-semibold text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2 font-body-sm text-body-sm text-on-surface"
          >
            <option value="">Todos os tipos</option>
            <option value="NEW_JOB">Nova vaga</option>
            <option value="MONITORING_ERROR">Erro</option>
            <option value="SUMMARY">Resumo</option>
          </select>
        </div>
        <BulkActionBar
          noun="notificações"
          total={items.length}
          selectedCount={selection.count}
          allSelected={selection.allSelected}
          pending={deleteMany.isPending || deleteAll.isPending}
          onSelectAll={selection.selectAll}
          onClear={selection.clear}
          onDeleteSelected={() => {
            if (!selection.count) return;
            if (!window.confirm(`Excluir ${selection.count} notificaç${selection.count === 1 ? 'ão' : 'ões'}?`)) return;
            deleteMany.mutate(selection.selected, {
              onSuccess: (result) => {
                selection.clear();
                toast(`${result.deleted} excluída${result.deleted === 1 ? '' : 's'}`);
              },
            });
          }}
          onDeleteAll={() => {
            if (!window.confirm('Excluir todas as notificações?')) return;
            deleteAll.mutate(undefined, {
              onSuccess: (result) => {
                selection.clear();
                toast(`${result.deleted} excluída${result.deleted === 1 ? '' : 's'}`);
              },
            });
          }}
        />
      </section>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : items.length > 0 ? (
        <div className="space-y-space-md">
          {items.map((notif) => {
            const unreadItem = notif.status === 'SENT' || notif.status === 'PENDING';
            return (
              <article
                key={notif.id}
                onClick={() => openNotification(notif)}
                className={`group relative cursor-pointer overflow-hidden rounded-xl border p-space-md transition-all duration-200 hover:-translate-y-0.5 ${
                  unreadItem
                    ? 'border-primary/25 bg-surface-container shadow-elevation-1'
                    : 'border-outline-variant/10 bg-surface-container-low'
                }`}
              >
                {unreadItem && <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-primary" />}
                <div className="flex items-start gap-space-sm">
                  <input
                    type="checkbox"
                    checked={selection.isSelected(notif.id)}
                    onChange={() => selection.toggle(notif.id)}
                    onClick={(event) => event.stopPropagation()}
                    className="mt-1 h-4 w-4 rounded border-outline-variant accent-primary"
                    aria-label={`Selecionar ${notif.title}`}
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-primary">
                    <Icon name={notificationIcon(notif.type)} className="text-[20px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-label-caps text-label-caps uppercase text-outline">{notificationTypeLabel(notif.type)}</p>
                        <h2 className="font-headline-sm text-headline-sm font-semibold leading-tight text-on-surface">{notif.title}</h2>
                      </div>
                      <StatusBadge status={notif.status} />
                    </div>
                    <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{notif.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 font-mono-sm text-mono-sm text-on-surface-variant">
                      <span>{channelLabel(notif.channel)}</span>
                      <span>{formatRelativeTime(notif.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(notif);
                    }}
                    className="shrink-0 rounded-lg bg-error/10 px-space-sm py-1.5 font-body-sm text-body-sm font-semibold text-error hover:bg-error/15"
                  >
                    Excluir
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Icon name="notifications" className="text-[40px]" />}
          title="Nenhuma notificação"
          description="Notificações serão exibidas aqui quando forem enviadas."
        />
      )}
    </div>
  );
}
