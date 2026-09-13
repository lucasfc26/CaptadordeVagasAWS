import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDeleteAllJobs, useDeleteJob, useDeleteJobs, useJobs, useMarkJobViewed } from '@/hooks';
import { useSelection } from '@/hooks/useSelection';
import { useToast } from '@/context/ToastContext';
import { Icon } from '@/components/ui/Icon';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { facilityCode, formatPay, jobMapQuery, jobTypeLabel } from '@/lib/display';
import { jobMatchesPay } from '@/lib/pay';
import { formatRelativeTime } from '@/lib/utils';
import { JobMap } from '@/components/jobs/JobMap';
import { ShareJobButton } from '@/components/jobs/ShareJobButton';
import { WhatsAppNotifyButton } from '@/components/jobs/WhatsAppNotifyButton';
import type { Job, JobFilters, JobStatus, JobType } from '@/types';

function buildJobListFilters({
  query,
  status,
  jobType,
  sortBy,
}: {
  query: string;
  status?: string;
  jobType?: string;
  sortBy: string;
}): JobFilters {
  const filters: JobFilters = {};
  if (query) filters.title = query;
  if (status) filters.status = status as JobStatus;
  if (jobType) filters.jobType = jobType as JobType;
  if (sortBy) filters.sortBy = sortBy as JobFilters['sortBy'];
  return filters;
}

const JOB_TYPE_FILTERS: { value: '' | JobType; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'SEASONAL', label: 'Sazonal' },
  { value: 'TEMPORARY', label: 'Temporário' },
];

export function JobsPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payMin, setPayMin] = useState(0);
  const [payMax, setPayMax] = useState(100);

  const listFilters = useMemo(
    () =>
      buildJobListFilters({
        query,
        status: statusFilter,
        jobType: typeFilter,
        sortBy,
      }),
    [query, statusFilter, typeFilter, sortBy],
  );
  const countFilters = useMemo(
    () =>
      buildJobListFilters({
        query,
        jobType: typeFilter,
        sortBy,
      }),
    [query, typeFilter, sortBy],
  );

  const { data, isLoading, isPlaceholderData } = useJobs(listFilters);
  const { data: countData } = useJobs(countFilters);
  const markViewed = useMarkJobViewed();
  const deleteJob = useDeleteJob();
  const deleteJobs = useDeleteJobs();
  const deleteAllJobs = useDeleteAllJobs();
  const { toast } = useToast();
  const jobs = (data?.data ?? []).filter((job) => jobMatchesPay(job.salary, payMin, payMax));
  const selection = useSelection(jobs.map((job) => job.id));
  const jobsForCounts = (countData?.data ?? []).filter((job) => jobMatchesPay(job.salary, payMin, payMax));
  const selected = jobs.find((job) => job.id === selectedId) ?? jobs[0];
  const statusCounts = countData?.statusCounts ?? data?.statusCounts;
  const allCount = statusCounts?.all ?? jobsForCounts.length;
  const newCount = statusCounts?.NEW ?? jobsForCounts.filter((job) => job.status === 'NEW').length;
  const viewedCount = statusCounts?.VIEWED ?? jobsForCounts.filter((job) => job.status === 'VIEWED').length;
  const goneCount = statusCounts?.EXPIRED ?? jobsForCounts.filter((job) => job.status === 'EXPIRED').length;
  const facilities = useMemo(
    () => Array.from(new Set(jobsForCounts.map((job) => job.facility).filter(Boolean))).slice(0, 3),
    [jobsForCounts],
  );
  const showListSkeleton = isLoading && !isPlaceholderData;

  const handleSelectJob = (job: Job) => {
    setSelectedId(job.id);
    if (job.status === 'NEW') markViewed.mutate(job.id);
  };

  const handleDelete = (job: Job) => {
    if (!window.confirm(`Excluir a vaga "${job.title}"?`)) return;
    deleteJob.mutate(job.id, {
      onSuccess: () => {
        if (selectedId === job.id) setSelectedId(null);
        toast(`"${job.title}" excluída`);
      },
    });
  };

  const handleDeleteSelected = () => {
    if (!selection.count) return;
    if (!window.confirm(`Excluir ${selection.count} vaga${selection.count === 1 ? '' : 's'} selecionada${selection.count === 1 ? '' : 's'}?`)) return;
    deleteJobs.mutate(selection.selected, {
      onSuccess: (result) => {
        selection.clear();
        toast(`${result.deleted} vaga${result.deleted === 1 ? '' : 's'} excluída${result.deleted === 1 ? '' : 's'}`);
      },
    });
  };

  const handleDeleteAll = () => {
    if (!window.confirm('Excluir todas as vagas? Se aparecerem de novo, voltam como novas.')) return;
    deleteAllJobs.mutate(undefined, {
      onSuccess: (result) => {
        selection.clear();
        setSelectedId(null);
        toast(`${result.deleted} vaga${result.deleted === 1 ? '' : 's'} excluída${result.deleted === 1 ? '' : 's'}`);
      },
    });
  };

  return (
    <div className="flex w-full flex-col pb-space-xl">
      <header className="mb-space-lg flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
        <div>
          <div className="mb-1 flex items-center gap-space-xs">
            <span className="flex items-center gap-1.5 font-label-caps text-label-caps uppercase tracking-widest text-secondary">
              <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-secondary" />
              Feed em Tempo Real
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">Vagas Encontradas</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-space-sm py-0.5 font-mono-sm text-mono-sm font-semibold text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              {countData?.total ?? allCount} vagas ativas
            </span>
            {newCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-tertiary/15 px-space-xs py-0.5 font-mono-sm text-mono-sm font-semibold text-tertiary">
                <Icon name="bolt" className="text-[14px]" />
                {newCount} matches recentes
              </span>
            )}
          </div>
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Todas as vagas encontradas pelos seus monitoramentos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-space-sm">
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="appearance-none rounded-xl border border-outline-variant/30 bg-surface-container-high py-2 pl-3 pr-8 font-body-sm text-body-sm text-on-surface"
          >
            <option value="newest">Mais recentes primeiro</option>
            <option value="oldest">Mais antigas primeiro</option>
            <option value="location">Localização</option>
            <option value="title">Título</option>
          </select>
        </div>
      </header>

      <section className="mb-space-lg flex flex-col gap-space-sm rounded-xl border border-outline-variant/15 bg-surface-container-low p-space-sm shadow-elevation-1 md:p-space-md">
        <div className="flex flex-col items-stretch gap-space-sm md:flex-row md:items-center">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-outline" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-2.5 pr-space-md pl-10 font-body-md text-body-md text-on-surface placeholder:text-outline/70 transition-colors focus:border-secondary/60 focus:outline-none focus:ring-2 focus:ring-secondary/25"
              placeholder="Pesquisar por cargo, fulfillment center, turno ou ID..."
            />
          </div>
        </div>
        <div className="flex items-center gap-space-xs overflow-x-auto pt-1 pb-1 text-on-surface-variant">
          <span className="mr-1 shrink-0 font-label-caps text-label-caps uppercase text-outline">Filtros:</span>
          <FilterPill active={!statusFilter} onClick={() => setStatusFilter('')} label="Todas" count={allCount} />
          <FilterPill active={statusFilter === 'NEW'} onClick={() => setStatusFilter('NEW')} label="Novas" count={newCount} accent />
          <button
            type="button"
            onClick={() => setStatusFilter('VIEWED')}
            className={`shrink-0 rounded-full px-space-sm py-1 font-body-sm text-body-sm transition-colors ${statusFilter === 'VIEWED' ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container-high hover:bg-surface-container-highest'}`}
          >
            Visualizadas ({viewedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('EXPIRED')}
            className={`shrink-0 rounded-full px-space-sm py-1 font-body-sm text-body-sm transition-colors ${statusFilter === 'EXPIRED' ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container-high hover:bg-surface-container-highest'}`}
          >
            Não apresentadas ({goneCount})
          </button>
          <div className="mx-1 h-4 w-px shrink-0 bg-surface-container-highest" />
          {facilities.map((facility) => (
            <span key={facility} className="shrink-0 rounded-full bg-surface-container-high px-space-sm py-1 font-mono-data text-mono-data font-medium">
              {facility}
            </span>
          ))}
          <div className="mx-1 h-4 w-px shrink-0 bg-surface-container-highest" />
          {JOB_TYPE_FILTERS.map((item) => (
            <button
              key={item.value || 'all-types'}
              type="button"
              onClick={() => setTypeFilter(item.value)}
              className={`shrink-0 rounded-full px-space-sm py-1 font-body-sm text-body-sm transition-colors ${typeFilter === item.value ? 'bg-primary font-semibold text-on-primary' : 'bg-surface-container-high hover:bg-surface-container-highest'}`}
            >
              {item.label}
            </button>
          ))}
          <div className="mx-1 h-4 w-px shrink-0 bg-surface-container-highest" />
          <label className="flex shrink-0 items-center gap-2 rounded-full bg-surface-container-high px-space-sm py-1 font-body-sm text-body-sm">
            Payment
            <input
              type="number"
              min={0}
              max={100}
              value={payMin}
              onChange={(event) => setPayMin(Math.min(100, Math.max(0, Number(event.target.value) || 0)))}
              className="w-14 rounded-md bg-surface-container-lowest px-1 py-0.5 font-mono-sm text-mono-sm"
              aria-label="Payment mínimo"
            />
            <span className="text-outline">–</span>
            <input
              type="number"
              min={0}
              max={100}
              value={payMax}
              onChange={(event) => setPayMax(Math.min(100, Math.max(0, Number(event.target.value) || 0)))}
              className="w-14 rounded-md bg-surface-container-lowest px-1 py-0.5 font-mono-sm text-mono-sm"
              aria-label="Payment máximo"
            />
          </label>
        </div>
        <BulkActionBar
          noun="vagas"
          total={jobs.length}
          selectedCount={selection.count}
          allSelected={selection.allSelected}
          pending={deleteJobs.isPending || deleteAllJobs.isPending}
          onSelectAll={selection.selectAll}
          onClear={selection.clear}
          onDeleteSelected={handleDeleteSelected}
          onDeleteAll={handleDeleteAll}
        />
      </section>

      {showListSkeleton ? (
        <SkeletonList count={4} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Icon name="work_outline" className="text-[40px]" />}
          title="Nenhuma vaga encontrada"
          description="Ajuste os filtros ou aguarde a próxima varredura."
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-space-md xl:col-span-7">
            {jobs.map((job) => (
              <JobFeedCard
                key={job.id}
                job={job}
                selected={selected?.id === job.id}
                checked={selection.isSelected(job.id)}
                onSelect={() => handleSelectJob(job)}
                onToggleCheck={() => selection.toggle(job.id)}
                onDelete={() => handleDelete(job)}
              />
            ))}
          </div>
          {selected && (
            <aside className="sticky top-20 hidden rounded-2xl border border-outline-variant/15 bg-surface-container-low p-space-lg shadow-elevation-2 xl:col-span-5 xl:block">
              <div className="mb-space-sm flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-outline">Inspector</span>
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-surface-container px-2 py-0.5 font-mono-data text-mono-data text-secondary">
                    {facilityCode(selected.facility)}
                  </span>
                  <ShareJobButton job={selected} />
                </div>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">{selected.title}</h2>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                {selected.facility} • {selected.location.address || `${selected.location.city}, ${selected.location.state}`}
              </p>
              <div className="mt-space-md space-y-space-sm rounded-xl bg-surface-container p-space-sm">
                <InspectorRow label="Compensação" value={formatPay(selected.salary)} />
                <InspectorRow label="Duração" value={selected.schedule || 'Não informado'} />
                <InspectorRow label="Modalidade" value={jobTypeLabel(selected.jobType)} />
                <InspectorRow
                  label={selected.status === 'EXPIRED' ? 'Última vez apresentada' : 'Sinalizada'}
                  value={formatRelativeTime(selected.lastSeenAt || selected.foundAt)}
                />
                {selected.status === 'EXPIRED' && (
                  <InspectorRow label="Status" value="Não apresentada nesta rodada" />
                )}
              </div>
              {selected.description && (
                <p className="mt-space-md line-clamp-6 font-body-md text-body-md text-on-surface-variant">{selected.description}</p>
              )}
              <JobMap
                query={jobMapQuery(selected)}
                label={selected.location.address || `${selected.location.city}, ${selected.location.state}`}
              />
              <div className="mt-space-md flex flex-col gap-space-xs">
                <WhatsAppNotifyButton jobId={selected.id} jobTitle={selected.title} className="w-full py-2" />
                <a
                  href={selected.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 rounded-full bg-primary px-space-md py-2.5 font-body-sm font-bold text-on-primary shadow-accent-primary transition-all hover:brightness-110 active:scale-[0.97]"
                >
                  Candidate-se Agora
                  <Icon name="arrow_forward" className="text-[16px]" />
                </a>
                <Link
                  to={`/jobs/${selected.id}`}
                  className="inline-flex items-center justify-center rounded-lg bg-surface-container-high py-2 font-body-sm text-on-surface"
                >
                  Ver página completa
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(selected)}
                  className="inline-flex items-center justify-center rounded-lg bg-error/10 py-2 font-body-sm font-semibold text-error"
                >
                  Excluir vaga
                </button>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1 rounded-full px-space-sm py-1 font-body-sm text-body-sm font-semibold transition-colors ${
        active ? 'bg-primary text-on-primary' : accent ? 'bg-surface-container-high text-secondary hover:bg-surface-container-highest' : 'bg-surface-container-high hover:bg-surface-container-highest'
      }`}
    >
      {accent && <span className="h-1.5 w-1.5 rounded-full bg-secondary" />}
      <span>{label}</span>
      <span className={`rounded-full px-1.5 font-mono-sm text-mono-sm ${active ? 'bg-on-primary/20' : 'bg-secondary/15'}`}>
        {count}
      </span>
    </button>
  );
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block font-label-caps text-label-caps uppercase text-outline">{label}</span>
      <span className="font-body-sm text-body-sm font-semibold text-on-surface">{value}</span>
    </div>
  );
}

function JobFeedCard({
  job,
  selected,
  checked,
  onSelect,
  onToggleCheck,
  onDelete,
}: {
  job: Job;
  selected: boolean;
  checked: boolean;
  onSelect: () => void;
  onToggleCheck: () => void;
  onDelete: () => void;
}) {
  const isNew = job.status === 'NEW';
  const isGone = job.status === 'EXPIRED';
  const signaledAt = job.lastSeenAt || job.foundAt;
  return (
    <article
      onClick={onSelect}
      className={`group relative cursor-pointer overflow-hidden rounded-xl border p-space-md shadow-elevation-1 transition-all ${
        selected
          ? 'border-primary/40 bg-surface-container shadow-elevation-2'
          : isNew
            ? 'border-outline-variant/15 bg-surface-container hover:bg-surface-container-high'
            : 'border-outline-variant/10 bg-surface-container-low opacity-90 hover:bg-surface-container hover:opacity-100'
      }`}
    >
      <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${isNew ? 'bg-primary' : 'bg-outline-variant'}`} />
      <div className="flex items-start justify-between gap-space-sm">
        <div className="flex items-center gap-space-xs">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggleCheck}
            onClick={(event) => event.stopPropagation()}
            className="h-4 w-4 rounded border-outline-variant accent-primary"
            aria-label={`Selecionar ${job.title}`}
          />
          {isNew && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-space-xs py-0.5 font-mono-sm text-mono-sm font-bold tracking-wider text-primary">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-primary" />
              NOVO MATCH
            </span>
          )}
          {isGone && (
            <span className="inline-flex items-center gap-1 rounded-full bg-tertiary/15 px-space-xs py-0.5 font-mono-sm text-mono-sm font-bold tracking-wider text-tertiary">
              Não apresentada
            </span>
          )}
          <span className="rounded bg-surface-container-lowest px-2 py-0.5 font-mono-data text-mono-data font-bold text-secondary">
            {facilityCode(job.facility)}
          </span>
          <span className="flex items-center gap-1 font-mono-sm text-mono-sm text-on-surface-variant">
            <Icon name="schedule" className="text-[13px] text-primary" />
            {isGone ? `última vez ${formatRelativeTime(signaledAt)}` : formatRelativeTime(signaledAt)}
          </span>
        </div>
        <ShareJobButton job={job} className="-mt-1 -mr-1" />
      </div>
      <div className="mt-space-xs">
        <h2 className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-on-surface transition-colors group-hover:text-primary">
          {job.title}
        </h2>
        <p className="mt-0.5 flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
          <Icon name="domain" className="text-[15px] text-outline" />
          {job.facility || 'Amazon'} • {job.location.address || `${job.location.city}, ${job.location.state}`}
        </p>
      </div>
      <div className="mt-space-sm grid grid-cols-2 gap-space-xs rounded-xl bg-surface-container-lowest p-space-xs sm:grid-cols-3">
        <div className="rounded-lg p-space-xs">
          <span className="block font-label-caps text-label-caps uppercase text-outline">Compensação</span>
          <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary-fixed-dim">
            {formatPay(job.salary)}
            {job.salary && !/\/h|hora/i.test(job.salary) ? (
              <span className="text-body-sm font-normal text-on-surface-variant">/h</span>
            ) : null}
          </span>
        </div>
        <div className="rounded-lg p-space-xs">
          <span className="block font-label-caps text-label-caps uppercase text-outline">Duração</span>
          <span className="flex items-center gap-1 font-body-sm text-body-sm font-semibold text-on-surface">
            <Icon name="timelapse" className="text-[15px] text-secondary" />
            {job.schedule || '—'}
          </span>
        </div>
        <div className="col-span-2 rounded-lg p-space-xs sm:col-span-1">
          <span className="block font-label-caps text-label-caps uppercase text-outline">Modalidade</span>
          <span className="flex items-center gap-1 font-body-sm text-body-sm font-semibold text-on-surface">
            <Icon name="verified" className="text-[15px] text-tertiary" />
            {jobTypeLabel(job.jobType)}
          </span>
        </div>
      </div>
      <div className="mt-space-sm flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
        <div className="flex items-center gap-space-xs font-mono-sm text-mono-sm text-on-surface-variant">
          <span className={`h-2 w-2 rounded-full ${isNew ? 'bg-primary' : 'bg-outline'}`} />
          <span>Vaga verificada no job-board oficial</span>
        </div>
        <div className="flex items-center gap-space-xs">
          <WhatsAppNotifyButton jobId={job.id} jobTitle={job.title} />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="rounded-lg bg-error/10 px-space-sm py-1.5 font-body-sm text-body-sm font-medium text-error hover:bg-error/15"
          >
            Excluir
          </button>
          <a
            href={job.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-primary px-space-md py-1.5 font-body-sm text-body-sm font-bold text-on-primary shadow-accent-primary transition-all hover:brightness-110 active:scale-[0.97]"
          >
            Candidate-se Agora
            <Icon name="arrow_forward" className="text-[16px]" />
          </a>
        </div>
      </div>
    </article>
  );
}
