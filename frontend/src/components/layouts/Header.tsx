import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNewSearch } from '@/context/NewSearchContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useDashboard, useForceScan, useSearches } from '@/hooks';
import { Icon } from '@/components/ui/Icon';
import { NotificationTray } from './NotificationTray';
import { frequencyShort } from '@/lib/display';
import { formatRelativeTime, formatUntil, getErrorMessage } from '@/lib/utils';
import type { MonitoringFrequency } from '@/types';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { openNewSearch } = useNewSearch();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const forceScan = useForceScan();
  const { data: stats } = useDashboard();
  const { data: searches } = useSearches();

  const activeSearch = searches?.find((item) => item.status === 'ACTIVE');
  const frequency = activeSearch?.frequency as MonitoringFrequency | undefined;

  const handleForceScan = () => {
    forceScan.mutate(undefined, {
      onSuccess: (result) => {
        if (!result.queued) {
          toast('Nenhum monitoramento ativo para verificar');
          return;
        }
        toast(
          result.queued === 1
            ? 'Varredura enfileirada'
            : `${result.queued} varreduras enfileiradas`,
        );
      },
      onError: (error) => toast(getErrorMessage(error, 'Não foi possível forçar a verificação')),
    });
  };

  return (
    <header className="fixed top-0 right-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest/80 px-space-lg backdrop-blur-xl lg:left-72 left-0">
      <div className="flex items-center gap-space-md">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high lg:hidden"
          aria-label="Abrir menu"
        >
          <Icon name="menu" className="text-[22px]" />
        </button>

        <div className="inline-flex items-center gap-space-xs rounded-full border border-primary-container/30 bg-primary-container/10 px-space-sm py-1">
          <span className="relative flex h-2 w-2">
            {stats?.monitoringActive && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${stats?.monitoringActive ? 'bg-primary' : 'bg-tertiary'}`} />
          </span>
          <span className="font-body-sm text-body-sm font-semibold text-primary">
            {stats?.monitoringActive ? 'Monitoramento Ativo' : 'Monitoramento Pausado'}
          </span>
          {frequency && (
            <span className="font-mono-sm text-mono-sm text-on-surface-variant">(Freq: {frequencyShort(frequency)})</span>
          )}
        </div>

        <div className="hidden h-4 w-px bg-outline-variant/40 md:block" />
        <div className="hidden items-center gap-space-sm font-mono-data text-mono-data text-on-surface-variant md:flex">
          <span className="flex items-center gap-1">
            <Icon name="history" className="text-[14px] text-outline" />
            Varredura:{' '}
            <strong className="font-medium text-on-surface">
              {stats?.lastCheckedAt ? formatRelativeTime(stats.lastCheckedAt) : '—'}
            </strong>
          </span>
          <span className="text-outline-variant">•</span>
          <span className="flex items-center gap-1">
            <Icon name="update" className="text-[14px] text-outline" />
            Próxima:{' '}
            <strong className="font-medium text-secondary">
              {stats?.nextCheckAt ? formatUntil(stats.nextCheckAt) : '—'}
            </strong>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-space-sm">
        <button
          type="button"
          onClick={handleForceScan}
          disabled={forceScan.isPending}
          className="inline-flex items-center gap-space-xs rounded-full border border-outline-variant/40 bg-surface-container-high px-space-sm py-1.5 font-body-sm text-body-sm font-medium text-on-surface transition-all hover:bg-surface-container-highest active:scale-[0.97] disabled:opacity-60"
        >
          <Icon name="sync" className={`text-[16px] text-primary ${forceScan.isPending ? 'animate-spin' : ''}`} />
          <span className="hidden lg:inline">Forçar Verificação</span>
        </button>
        <button
          type="button"
          onClick={openNewSearch}
          className="inline-flex items-center gap-space-xs rounded-full bg-primary px-space-sm py-1.5 font-body-sm text-body-sm font-semibold text-on-primary shadow-accent-primary transition-all hover:brightness-110 active:scale-[0.97]"
        >
          <Icon name="add" className="text-[16px]" />
          <span>Nova Busca</span>
          <kbd className="hidden rounded bg-on-primary/10 px-1 font-mono-sm text-mono-sm text-on-primary sm:inline-block">
            ⌘K
          </kbd>
        </button>
        <div className="mx-1 h-4 w-px bg-outline-variant/40" />
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} className="text-[20px]" />
        </button>
        <NotificationTray />
        <Link
          to="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary"
          title={user?.name}
        >
          <Icon name="person" className="text-[18px] text-on-primary" />
        </Link>
      </div>
    </header>
  );
}
