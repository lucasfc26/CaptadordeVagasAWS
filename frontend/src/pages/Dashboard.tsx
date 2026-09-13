import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNewSearch } from '@/context/NewSearchContext';
import { useDashboard, useDeleteJob, useForceScan, useMarkJobViewed, useNewJobs, useSearches } from '@/hooks';
import { useToast } from '@/context/ToastContext';
import { Icon } from '@/components/ui/Icon';
import { StatusBadge } from '@/components/ui/Badge';
import { ShareJobButton } from '@/components/jobs/ShareJobButton';
import { WhatsAppNotifyButton } from '@/components/jobs/WhatsAppNotifyButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList, SkeletonStats } from '@/components/ui/Skeleton';
import { facilityCode, formatPay, frequencyShort, jobLocation, jobTypeLabel } from '@/lib/display';
import { formatRelativeTime, formatUntil, getErrorMessage } from '@/lib/utils';
import type { Job, Search } from '@/types';

export function DashboardPage() {
  const { openNewSearch } = useNewSearch();
  const { data: stats, isLoading: statsLoading } = useDashboard();
  const { data: newJobs, isLoading: jobsLoading } = useNewJobs();
  const { data: searches, isLoading: searchesLoading } = useSearches();
  const markViewed = useMarkJobViewed();
  const deleteJob = useDeleteJob();
  const forceScan = useForceScan();
  const { toast } = useToast();

  const activeSearches = searches?.filter((search) => search.status === 'ACTIVE') ?? [];
  const locations = activeSearches.map((search) => search.location).filter(Boolean);
  const newestTitles = (newJobs ?? []).slice(0, 3).map((job) => job.facility || job.location.city).filter(Boolean);

  const handleOpenJob = (job: Job) => {
    if (job.status === 'NEW') markViewed.mutate(job.id);
  };

  const handleDeleteJob = (job: Job) => {
    if (!window.confirm(`Excluir a vaga "${job.title}"?`)) return;
    deleteJob.mutate(job.id, {
      onSuccess: () => toast(`"${job.title}" excluída`),
    });
  };

  return (
    <div className="flex w-full flex-col space-y-space-xl">
      <section className="edge-top-primary relative overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-low p-space-lg shadow-elevation-2">
        <div className="bg-radar-grid pointer-events-none absolute inset-0" />
        <div className="relative z-10 flex flex-col gap-space-md lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-space-xs">
            <div className="flex flex-wrap items-center gap-space-sm">
              <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">Monitoramento de Vagas</h1>
              {stats?.monitoringActive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-container/15 px-space-sm py-0.5 font-mono-sm text-mono-sm font-semibold uppercase tracking-wide text-primary">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-primary" />
                  Tempo Real
                </span>
              )}
              {locations[0] && (
                <span className="hidden items-center gap-1 rounded bg-surface-container px-space-xs py-0.5 font-mono-sm text-mono-sm text-on-surface-variant sm:inline-flex">
                  {locations[0]}
                </span>
              )}
            </div>
            <p className="flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className={`absolute inline-flex h-full w-full rounded-full ${stats?.monitoringActive ? 'animate-ping bg-primary opacity-75' : 'bg-tertiary/40'}`} />
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${stats?.monitoringActive ? 'bg-primary' : 'bg-tertiary'}`} />
              </span>
              <span>
                {stats?.monitoringActive ? (
                  <>
                    Seu monitoramento está ativo.{' '}
                    <strong className="font-semibold text-on-surface">{stats.activeSearches} buscas</strong> sendo verificadas.
                  </>
                ) : (
                  'Nenhum monitoramento ativo no momento.'
                )}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-space-sm self-start lg:self-center">
            <div className="flex items-center gap-space-sm rounded-lg bg-surface-container px-space-md py-space-sm">
              <Icon name="bolt" className="text-[20px] text-secondary" />
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Engine Feed</span>
                <span className="font-mono-data text-mono-data font-medium text-secondary">
                  {stats?.monitoringActive ? 'Online' : 'Pausado'}
                  {stats?.lastCheckedAt ? ` • ${formatRelativeTime(stats.lastCheckedAt)}` : ''}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
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
                  onError: (error) => toast(getErrorMessage(error, 'Não foi possível forçar a varredura')),
                })
              }
              disabled={forceScan.isPending}
              className="inline-flex items-center gap-space-xs rounded-full bg-primary px-space-md py-2.5 font-body-sm text-body-sm font-semibold text-on-primary shadow-accent-primary transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
            >
              <Icon name="autorenew" className={`text-[18px] ${forceScan.isPending ? 'animate-spin' : ''}`} />
              <span>Forçar Varredura</span>
            </button>
          </div>
        </div>

        {(stats?.newJobs ?? 0) > 0 && (
          <div className="relative z-10 mt-space-md flex flex-wrap items-center justify-between gap-space-sm rounded-lg bg-surface-container-high/90 px-space-md py-space-sm backdrop-blur-md">
            <div className="flex items-center gap-space-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-tertiary-container/30 text-tertiary">
                <Icon name="notification_important" className="text-[18px]" />
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                <strong className="font-semibold text-tertiary">
                  {stats?.newJobs} nova{stats?.newJobs === 1 ? '' : 's'} vaga{stats?.newJobs === 1 ? '' : 's'} identificada{stats?.newJobs === 1 ? '' : 's'}
                </strong>
                {newestTitles.length > 0 ? ` (${newestTitles.join(', ')})` : ''}.
              </span>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="font-mono-sm text-mono-sm text-on-surface-variant">
                {stats?.lastCheckedAt ? `Sincronizado ${formatRelativeTime(stats.lastCheckedAt)}` : 'Aguardando varredura'}
              </span>
              <Icon name="verified" className="text-[16px] text-outline" />
            </div>
          </div>
        )}
      </section>

      {statsLoading ? (
        <SkeletonStats />
      ) : (
        <section className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Novas Vagas"
            value={stats?.newJobs ?? 0}
            suffix="Descobertas"
            hint={stats?.newJobs ? 'Identificadas recentemente' : 'Nenhuma descoberta pendente'}
            badge={stats?.newJobs ? 'Requer atenção' : undefined}
            highlight
          />
          <MetricCard
            label="Disponíveis Agora"
            value={stats?.availableJobs ?? 0}
            suffix="posições"
            hint="Pool atual das buscas"
            chip="Ativas"
          />
          <MetricCard
            label="Buscas Ativas"
            value={stats?.activeSearches ?? 0}
            suffix="polos"
            hint={locations.join(' • ') || 'Nenhuma busca configurada'}
            chip={activeSearches.length ? `${activeSearches.length} Polling Loops` : undefined}
          />
          <div className="relative overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-low p-space-md shadow-elevation-1 transition-transform duration-200 hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Última Verificação</span>
              <span className={`h-2 w-2 rounded-full ${stats?.monitoringActive ? 'animate-pulse bg-primary' : 'bg-outline'}`} />
            </div>
            <div className="mt-space-sm flex items-baseline gap-space-xs">
              <span className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
                {stats?.lastCheckedAt ? formatRelativeTime(stats.lastCheckedAt) : '—'}
              </span>
            </div>
            <div className="mt-space-xs flex items-center justify-between font-mono-data text-mono-data text-on-surface-variant">
              <span>{stats?.nextCheckAt ? `Próxima ${formatUntil(stats.nextCheckAt)}` : 'Sem próxima varredura'}</span>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <div className="h-6 w-1 rounded-full bg-primary" />
            <h2 className="font-headline-md text-headline-md tracking-tight text-on-surface">Novas Vagas Descobertas</h2>
            {newJobs && newJobs.length > 0 && (
              <span className="rounded-full bg-primary-container/20 px-2.5 py-0.5 font-mono-sm text-mono-sm font-semibold text-primary">
                {newJobs.length} não visualizada{newJobs.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
          {newJobs && newJobs.length > 0 && (
            <Link
              to="/jobs?status=NEW"
              className="inline-flex items-center gap-space-xs rounded-lg bg-surface-container-high px-space-sm py-1.5 font-body-sm text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-bright hover:text-on-surface"
            >
              Ver todas
              <Icon name="arrow_forward" className="text-[16px]" />
            </Link>
          )}
        </div>

        {jobsLoading ? (
          <SkeletonList count={3} />
        ) : newJobs && newJobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-space-md lg:grid-cols-3">
            {newJobs.slice(0, 3).map((job) => (
              <NewJobCard
                key={job.id}
                job={job}
                onOpen={() => handleOpenJob(job)}
                onDelete={() => handleDeleteJob(job)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Icon name="radar" className="text-[40px]" />}
            title="Nenhuma vaga nova"
            description="Continuamos monitorando suas buscas. Você será avisado assim que uma nova vaga aparecer."
          />
        )}
      </section>

      <section className="space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="h-6 w-1 rounded-full bg-secondary" />
            <h2 className="font-headline-md text-headline-md tracking-tight text-on-surface">Monitoramentos Ativos</h2>
            <span className="font-mono-sm text-mono-sm text-on-surface-variant">
              {activeSearches.length} configurado{activeSearches.length === 1 ? '' : 's'}
            </span>
          </div>
          <Link to="/searches" className="inline-flex items-center gap-1 font-body-sm text-body-sm font-medium text-primary transition-colors hover:text-primary-fixed-dim">
            Gerenciar todos
            <Icon name="arrow_forward" className="text-[16px]" />
          </Link>
        </div>

        {searchesLoading ? (
          <SkeletonList count={2} />
        ) : activeSearches.length > 0 ? (
          <div className="grid gap-space-md lg:grid-cols-2">
            {activeSearches.map((search) => (
              <SearchCard key={search.id} search={search} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Icon name="radar" className="text-[40px]" />}
            title="Nenhum monitoramento ativo"
            action={
              <button
                type="button"
                onClick={openNewSearch}
                className="inline-flex items-center gap-space-xs rounded-full bg-primary px-space-md py-2 font-body-sm font-semibold text-on-primary transition-all hover:brightness-110 active:scale-[0.97]"
              >
                Criar monitoramento
              </button>
            }
          />
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  hint,
  badge,
  chip,
  highlight,
}: {
  label: string;
  value: number;
  suffix: string;
  hint: string;
  badge?: string;
  chip?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-surface-container-low p-space-md shadow-elevation-1 transition-transform duration-200 hover:-translate-y-0.5',
        highlight ? 'edge-top-primary border-primary/20' : 'border-outline-variant/15',
      )}
    >
      <div className="flex items-start justify-between">
        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">{label}</span>
        {badge && (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary-container/30 bg-primary-container/20 px-2 py-0.5 font-mono-sm text-mono-sm font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {badge}
          </span>
        )}
        {chip && (
          <span className="inline-flex items-center rounded bg-surface-container px-2 py-0.5 font-mono-sm text-mono-sm text-secondary">
            {chip}
          </span>
        )}
      </div>
      <div className="mt-space-sm flex items-baseline gap-space-xs">
        <span className="font-display text-display font-bold tracking-tight text-on-surface">{value}</span>
        <span className={`font-label-caps text-label-caps uppercase tracking-wider ${highlight ? 'text-primary' : 'text-on-surface-variant'}`}>
          {suffix}
        </span>
      </div>
      <div className="mt-space-xs truncate font-mono-data text-mono-data text-on-surface-variant">{hint}</div>
    </div>
  );
}

function NewJobCard({
  job,
  onOpen,
  onDelete,
}: {
  job: Job;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className="edge-top-primary group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-low p-space-lg shadow-elevation-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-elevation-3"
    >
      <div className="space-y-space-md">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-container/20 px-2.5 py-0.5 font-mono-sm text-mono-sm font-bold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-primary" />
              Novo Match
            </span>
            <span className="rounded bg-surface-container px-2 py-0.5 font-mono-data text-mono-data font-semibold text-on-surface">
              {facilityCode(job.facility)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <ShareJobButton job={job} />
            <Link
              to={`/jobs/${job.id}`}
              onClick={onOpen}
              className="rounded-lg p-1 transition-colors hover:bg-surface-container-high hover:text-tertiary"
              title="Ver vaga"
            >
              <Icon name="bookmark_border" className="text-[20px]" />
            </Link>
          </div>
        </div>
        <div className="space-y-space-xs">
          <h3 className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface transition-colors group-hover:text-primary">
            {job.title}
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant">{jobLocation(job)}</p>
          <div className="flex items-center gap-1 font-mono-sm text-mono-sm text-on-surface-variant">
            <Icon name="near_me" className="text-[14px] text-outline" />
            <span>
              {job.location.city}
              {job.location.distance ? ` • ${job.location.distance} mi` : ''}
            </span>
          </div>
        </div>
        <div className="space-y-1 rounded-lg bg-surface-container p-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Compensação Estimada</span>
            <span className="font-mono-sm text-mono-sm font-semibold text-primary">{jobTypeLabel(job.jobType)}</span>
          </div>
          <div className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">
            {formatPay(job.salary)}
          </div>
          {job.schedule && (
            <div className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
              <Icon name="schedule" className="text-[14px] text-outline" />
              <span>{job.schedule}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between font-mono-sm text-mono-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-1 text-primary">
            <Icon name="radar" className="text-[14px]" />
            {job.status === 'EXPIRED'
              ? `Não apresentada · última vez ${formatRelativeTime(job.lastSeenAt || job.foundAt)}`
              : `Sinalizada ${formatRelativeTime(job.lastSeenAt || job.foundAt)}`}
          </span>
          <span>ID: #{job.id.slice(0, 8)}</span>
        </div>
      </div>
      <div className="mt-space-lg flex flex-col gap-space-xs">
        <a
          href={job.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-space-xs rounded-full bg-primary px-space-md py-2.5 font-body-sm text-body-sm font-semibold text-on-primary shadow-accent-primary transition-all hover:brightness-110 active:scale-[0.97]"
        >
          Candidate-se Agora
          <Icon name="open_in_new" className="text-[16px]" />
        </a>
        <WhatsAppNotifyButton jobId={job.id} jobTitle={job.title} className="w-full py-2" />
        <div className="flex items-center gap-space-xs">
          <Link
            to={`/jobs/${job.id}`}
            onClick={onOpen}
            className="flex-1 rounded-lg bg-surface-container py-2 text-center font-body-sm text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            Ver detalhes
          </Link>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="rounded-lg bg-error/10 px-3 py-2 font-body-sm text-body-sm font-semibold text-error hover:bg-error/15"
          >
            Excluir
          </button>
        </div>
      </div>
    </article>
  );
}

function SearchCard({ search }: { search: Search }) {
  const dotColor =
    search.status === 'ACTIVE' ? 'bg-primary ring-primary/20' : search.status === 'ERROR' ? 'bg-error ring-error/20' : 'bg-tertiary ring-tertiary/20';
  const coverage = [search.location, ...search.additionalCities].filter(Boolean);

  return (
    <div className="space-y-space-md rounded-xl border border-outline-variant/15 bg-surface-container-low p-space-md shadow-elevation-1 transition-all hover:bg-surface-container">
      <div className="flex flex-col gap-space-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-space-sm">
          <span className={`h-3 w-3 shrink-0 rounded-full ring-4 ${dotColor}`} />
          <div className="min-w-0">
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">{search.name}</h3>
            <p className="truncate font-mono-data text-mono-data text-on-surface-variant">
              {coverage.length > 1 ? `Cobrindo: ${coverage.join(' • ')}` : search.location} + {search.radius} mi
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 self-start sm:self-auto">
          <StatusBadge status={search.status} />
          <span className="font-mono-sm text-mono-sm text-on-surface-variant">{frequencyShort(search.frequency)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-space-sm rounded-lg bg-surface-container-high/60 p-space-sm font-mono-sm text-mono-sm sm:grid-cols-4">
        <div>
          <div className="text-outline">Vagas</div>
          <div className="font-semibold text-on-surface">{search.jobsFound}</div>
        </div>
        <div>
          <div className="text-outline">Novas</div>
          <div className="font-semibold text-primary">{search.newJobsFound}</div>
        </div>
        <div>
          <div className="text-outline">Última</div>
          <div className="font-semibold text-on-surface">{search.lastCheckedAt ? formatRelativeTime(search.lastCheckedAt) : '—'}</div>
        </div>
        <div>
          <div className="text-outline">Próxima</div>
          <div className="font-semibold text-secondary">{search.nextCheckAt ? formatUntil(search.nextCheckAt) : '—'}</div>
        </div>
      </div>
      <Link to={`/searches/${search.id}`} className="inline-flex items-center gap-1 font-body-sm text-body-sm font-medium text-primary">
        Ver detalhes
        <Icon name="arrow_forward" className="text-[16px]" />
      </Link>
    </div>
  );
}
