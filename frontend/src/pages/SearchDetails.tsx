import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useDeleteJob,
  useDeleteJobs,
  useJobs,
  useMarkJobViewed,
  useDeleteSearch,
  useSearch,
  useSearchHistory,
  useToggleSearch,
} from '@/hooks';
import { useSelection } from '@/hooks/useSelection';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { useToast } from '@/context/ToastContext';
import { StatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/components/ui/Icon';
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime, formatRelativeTime, formatUntil } from '@/lib/utils';
import { JOB_TYPES, NOTIFICATION_CHANNELS } from '@/lib/constants';
import { frequencyLabel, searchSourceLabel } from '@/lib/display';
import { WhatsAppNotifyButton } from '@/components/jobs/WhatsAppNotifyButton';

export function SearchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: search, isLoading } = useSearch(id || '');
  const { data: history, isLoading: historyLoading } = useSearchHistory(id || '');
  const toggleSearch = useToggleSearch();
  const deleteSearch = useDeleteSearch();
  const { data: jobsPage } = useJobs({ searchId: id, limit: 50, sortBy: 'newest' }, Boolean(id));
  const markViewed = useMarkJobViewed();
  const deleteJob = useDeleteJob();
  const deleteJobs = useDeleteJobs();
  const jobs = jobsPage?.data ?? [];
  const selection = useSelection(jobs.map((job) => job.id));
  const [deleteModal, setDeleteModal] = useState(false);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!search) {
    return (
      <div className="space-y-4 py-12 text-center">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Busca não encontrada</h2>
        <Link to="/searches"><Button variant="outline" size="sm">Voltar</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-space-lg">
      <Link to="/searches" className="inline-flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface">
        <Icon name="arrow_back" className="text-[16px]" /> Voltar para monitoramentos
      </Link>

      <div className="flex flex-col justify-between gap-space-md sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">{search.name}</h1>
            <StatusBadge status={search.status} />
            <span className="rounded-full bg-secondary-container/20 px-2 py-0.5 font-mono-sm text-mono-sm text-secondary">
              {searchSourceLabel(search.sourceType)}
            </span>
          </div>
          <p className="mt-1 font-mono-data text-mono-data text-on-surface-variant">
            {search.location} · Raio {search.radius} miles · {frequencyLabel(search.frequency)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={search.status === 'ACTIVE' ? 'outline' : 'primary'}
            size="sm"
            onClick={() =>
              toggleSearch.mutate(
                { id: search.id, action: search.status === 'ACTIVE' ? 'pause' : 'resume' },
                { onSuccess: () => toast(search.status === 'ACTIVE' ? 'Monitoramento pausado' : 'Monitoramento retomado') },
              )
            }
            loading={toggleSearch.isPending}
          >
            {search.status === 'ACTIVE' ? 'Pausar' : 'Retomar'}
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)}>Excluir</Button>
        </div>
      </div>

      <Card className="space-y-space-md p-space-lg">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Configurações</h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DetailItem label="Fonte" value={searchSourceLabel(search.sourceType)} />
          {search.targetUrl && <DetailItem label={search.sourceType === 'JOB_API' ? 'API' : 'URL'} value={search.targetUrl} />}
          {search.xpath && <DetailItem label="XPath" value={search.xpath} />}
          {search.warehouseFilters?.zipCode && (
            <DetailItem label="Zip / Address" value={search.warehouseFilters.zipCode} />
          )}
          {search.warehouseFilters?.jobTitle && (
            <DetailItem label="Job Search" value={search.warehouseFilters.jobTitle} />
          )}
          {search.warehouseFilters?.workHours != null && (
            <DetailItem label="Work Hours" value={`${search.warehouseFilters.workHours}+ h`} />
          )}
          {search.warehouseFilters?.length && <DetailItem label="Length / Duration" value={search.warehouseFilters.length} />}
          {search.warehouseFilters?.employmentType && (
            <DetailItem label="Type" value={search.warehouseFilters.employmentType} />
          )}
          {(search.warehouseFilters?.payRateMin != null || search.warehouseFilters?.payRateMax != null) && (
            <DetailItem
              label="Pay rate"
              value={`Payment US$ ${search.warehouseFilters.payRateMin ?? 0} – ${search.warehouseFilters.payRateMax ?? 100}`}
            />
          )}
          {search.warehouseFilters?.whenStart && (
            <DetailItem label="When Start" value={search.warehouseFilters.whenStart} />
          )}
          <DetailItem label="Localização" value={search.location} />
          {search.sourceType !== 'AMAZON_WAREHOUSE' && <DetailItem label="Raio" value={`${search.radius} miles`} />}
          <DetailItem label="Frequência" value={frequencyLabel(search.frequency)} />
          <DetailItem label="Vagas encontradas" value={String(search.jobsFound)} />
          <DetailItem label="Novas vagas" value={String(search.newJobsFound)} />
          <DetailItem label="Última verificação" value={search.lastCheckedAt ? formatRelativeTime(search.lastCheckedAt) : '—'} />
          <DetailItem label="Próxima verificação" value={search.nextCheckAt ? formatUntil(search.nextCheckAt) : '—'} />
        </dl>
        {search.warehouseFilters?.schedule?.length ? (
          <ChipGroup label="Schedule" items={search.warehouseFilters.schedule} />
        ) : null}
        {search.apiFilters?.filters?.map((filter) => (
          <ChipGroup key={filter.path} label={filter.path} items={filter.values} />
        ))}
        <ChipGroup label="Palavras-chave" items={search.keywords} />
        <ChipGroup label="Tipos de vaga" items={search.jobTypes.map((type) => JOB_TYPES.find((item) => item.value === type)?.label || type)} />
        <ChipGroup label="Cidades adicionais" items={search.additionalCities} />
        <ChipGroup label="Canais de notificação" items={search.notificationChannels.map((channel) => NOTIFICATION_CHANNELS.find((item) => item.value === channel)?.label || channel)} />
      </Card>

      <section className="space-y-space-md">
        <div className="flex flex-col gap-space-sm sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface">Vagas deste monitoramento</h2>
          <BulkActionBar
            noun="vagas"
            total={jobs.length}
            selectedCount={selection.count}
            allSelected={selection.allSelected}
            pending={deleteJobs.isPending}
            onSelectAll={selection.selectAll}
            onClear={selection.clear}
            onDeleteSelected={() => {
              if (!selection.count) return;
              if (!window.confirm(`Excluir ${selection.count} vaga${selection.count === 1 ? '' : 's'}?`)) return;
              deleteJobs.mutate(selection.selected, {
                onSuccess: (result) => {
                  selection.clear();
                  toast(`${result.deleted} vaga${result.deleted === 1 ? '' : 's'} excluída${result.deleted === 1 ? '' : 's'}`);
                },
              });
            }}
            onDeleteAll={() => {
              if (!jobs.length) return;
              if (!window.confirm('Excluir as vagas selecionáveis deste monitoramento?')) return;
              deleteJobs.mutate(jobs.map((job) => job.id), {
                onSuccess: (result) => {
                  selection.clear();
                  toast(`${result.deleted} vaga${result.deleted === 1 ? '' : 's'} excluída${result.deleted === 1 ? '' : 's'}`);
                },
              });
            }}
          />
        </div>
        {jobs.length === 0 ? (
          <EmptyState
            icon={<Icon name="work_outline" className="text-[32px]" />}
            title="Nenhuma vaga neste monitoramento"
            description="As vagas encontradas nesta busca aparecem aqui. Clique no card para marcar como vista."
          />
        ) : (
          <div className="space-y-space-sm">
            {jobs.map((job) => (
              <article
                key={job.id}
                onClick={() => {
                  if (job.status === 'NEW') markViewed.mutate(job.id);
                  navigate(`/jobs/${job.id}`);
                }}
                className="flex cursor-pointer items-start gap-space-sm rounded-xl border border-outline-variant/15 bg-surface-container-low p-space-md hover:bg-surface-container"
              >
                <input
                  type="checkbox"
                  checked={selection.isSelected(job.id)}
                  onChange={() => selection.toggle(job.id)}
                  onClick={(event) => event.stopPropagation()}
                  className="mt-1 h-4 w-4 rounded border-outline-variant accent-primary"
                  aria-label={`Selecionar ${job.title}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">{job.title}</h3>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {job.location.city}, {job.location.state} · {job.salary || 'A consultar'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1" onClick={(event) => event.stopPropagation()}>
                  <WhatsAppNotifyButton jobId={job.id} jobTitle={job.title} />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!window.confirm(`Excluir a vaga "${job.title}"?`)) return;
                      deleteJob.mutate(job.id, { onSuccess: () => toast(`"${job.title}" excluída`) });
                    }}
                    className="rounded-lg bg-error/10 px-space-sm py-1.5 font-body-sm font-semibold text-error"
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-space-md">
        <h2 className="font-headline-md text-headline-md text-on-surface">Histórico de Execuções</h2>
        {historyLoading ? (
          <SkeletonList count={4} />
        ) : history && history.length > 0 ? (
          <div className="space-y-0">
            {history.map((exec, index) => (
              <div key={exec.id} className="flex gap-3 pb-4">
                <div className="flex flex-col items-center">
                  <Icon
                    name={exec.status === 'SUCCESS' ? 'check_circle' : exec.status === 'ERROR' ? 'error' : 'progress_activity'}
                    className={`text-[18px] ${exec.status === 'SUCCESS' ? 'text-primary' : exec.status === 'ERROR' ? 'text-error' : 'text-secondary'}`}
                  />
                  {index < history.length - 1 && <div className="mt-1 w-px flex-1 bg-outline-variant/30" />}
                </div>
                <div className="min-w-0 space-y-0.5 pb-1">
                  <p className="font-body-md text-body-md text-on-surface">
                    {exec.status === 'SUCCESS' ? 'Verificação concluída' : exec.status === 'ERROR' ? 'Erro na verificação' : 'Executando...'}
                  </p>
                  <p className="font-mono-sm text-mono-sm text-on-surface-variant">{formatDateTime(exec.executedAt)}</p>
                  {exec.status === 'SUCCESS' ? (
                    <p className="font-mono-sm text-mono-sm text-on-surface-variant">
                      {exec.jobsFound} vaga{exec.jobsFound !== 1 ? 's' : ''} encontrada{exec.jobsFound !== 1 ? 's' : ''} · {exec.newJobsFound} nova{exec.newJobsFound !== 1 ? 's' : ''}
                    </p>
                  ) : exec.errorMessage ? (
                    <p className="font-body-sm text-body-sm text-error">{exec.errorMessage}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Icon name="history" className="text-[32px]" />} title="Nenhum histórico" description="O histórico de verificações será exibido aqui." />
        )}
      </section>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Excluir monitoramento" description="Esta ação não pode ser desfeita.">
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => setDeleteModal(false)}>Cancelar</Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              deleteSearch.mutate(search.id, {
                onSuccess: () => {
                  toast('Monitoramento excluído');
                  navigate('/searches');
                },
              })
            }
            loading={deleteSearch.isPending}
          >
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-label-caps text-label-caps uppercase text-outline">{label}</dt>
      <dd className="font-body-md text-body-md text-on-surface">{value}</dd>
    </div>
  );
}

function ChipGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <dt className="font-label-caps text-label-caps uppercase text-outline">{label}</dt>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <span className="font-body-sm text-body-sm text-on-surface-variant">—</span>
        ) : items.map((item) => (
          <span key={item} className="rounded bg-surface-container px-2 py-0.5 font-body-sm text-body-sm text-on-surface">{item}</span>
        ))}
      </div>
    </div>
  );
}
