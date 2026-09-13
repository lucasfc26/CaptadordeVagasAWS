import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useDeleteAllNotifications,
  useMarkJobViewed,
  useMarkNotificationRead,
  useNewJobs,
  useNotifications,
} from '@/hooks';
import { useToast } from '@/context/ToastContext';
import { Icon } from '@/components/ui/Icon';
import { formatRelativeTime } from '@/lib/utils';

export function NotificationTray() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: newJobs } = useNewJobs();
  const { data: notifications } = useNotifications({ limit: 12 });
  const markRead = useMarkNotificationRead();
  const markViewed = useMarkJobViewed();
  const deleteAll = useDeleteAllNotifications();

  const jobs = newJobs ?? [];
  const items = notifications?.data ?? [];
  const unreadNotifs = items.filter((item) => !item.readAt && item.status !== 'READ');
  const badgeCount = jobs.length || unreadNotifs.length;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openJob = (jobId: string) => {
    markViewed.mutate(jobId);
    items
      .filter((item) => item.jobId === jobId && !item.readAt)
      .forEach((item) => markRead.mutate(item.id));
    setOpen(false);
    navigate(`/jobs/${jobId}`);
  };

  const openNotification = (id: string, jobId?: string) => {
    markRead.mutate(id);
    if (jobId) {
      markViewed.mutate(jobId);
      navigate(`/jobs/${jobId}`);
    } else {
      navigate('/notifications');
    }
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        aria-label="Notificações"
        aria-expanded={open}
      >
        <Icon name="notifications" className="text-[20px]" />
        {badgeCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-tertiary ring-2 ring-surface-container-lowest" />
        )}
      </button>

      {open && (
        <div className="animate-in absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low/95 shadow-elevation-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2 border-b border-outline-variant/15 px-space-md py-space-sm">
            <div>
              <p className="font-label-caps text-label-caps uppercase text-outline">Vagas encontradas</p>
              <p className="font-body-sm text-body-sm text-on-surface">
                {jobs.length > 0
                  ? `${jobs.length} nova${jobs.length === 1 ? '' : 's'} sem abrir`
                  : unreadNotifs.length > 0
                    ? `${unreadNotifs.length} não lida${unreadNotifs.length === 1 ? '' : 's'}`
                    : 'Nada pendente'}
              </p>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm('Excluir todas as notificações?')) return;
                  deleteAll.mutate(undefined, {
                    onSuccess: () => toast('Notificações excluídas'),
                  });
                }}
                className="rounded-lg px-2 py-1 font-body-sm text-body-sm font-semibold text-error hover:bg-error/10"
              >
                Limpar
              </button>
            )}
          </div>

          {jobs.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto">
              {jobs.slice(0, 8).map((job) => (
                <li key={job.id}>
                  <button
                    type="button"
                    onClick={() => openJob(job.id)}
                    className="flex w-full flex-col items-start gap-0.5 bg-surface-container px-space-md py-space-sm text-left transition-colors hover:bg-surface-container-high"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
                      <span className="font-body-sm text-body-sm font-semibold text-on-surface">{job.title}</span>
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {job.location.city}, {job.location.state}
                      {job.salary ? ` · ${job.salary}` : ''}
                    </span>
                    <span className="font-mono-sm text-mono-sm text-outline">
                      {formatRelativeTime(job.lastSeenAt || job.foundAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : items.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((item) => {
                const isUnread = !item.readAt && item.status !== 'READ';
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(item.id, item.jobId)}
                      className={`flex w-full flex-col items-start gap-0.5 px-space-md py-space-sm text-left transition-colors hover:bg-surface-container-high ${
                        isUnread ? 'bg-surface-container' : ''
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />}
                        <span className="font-body-sm text-body-sm font-semibold text-on-surface">{item.title}</span>
                      </span>
                      <span className="line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">{item.message}</span>
                      <span className="font-mono-sm text-mono-sm text-outline">{formatRelativeTime(item.createdAt)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-space-md py-space-lg font-body-sm text-body-sm text-on-surface-variant">
              Nenhuma vaga nova no momento.
            </p>
          )}

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-outline-variant/15 px-space-md py-space-sm text-center font-body-sm text-body-sm font-semibold text-primary hover:bg-surface-container"
          >
            Ver todas as notificações
          </Link>
        </div>
      )}
    </div>
  );
}
