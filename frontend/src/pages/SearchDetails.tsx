// ============================================
// JobWatch - Search Details Page
// ============================================

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pause, Play, Trash2, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useSearch, useSearchHistory, useToggleSearch, useDeleteSearch } from '@/hooks';
import { useToast } from '@/context/ToastContext';
import { StatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelativeTime, formatDateTime } from '@/lib/utils';
import { MONITORING_FREQUENCIES, JOB_TYPES, NOTIFICATION_CHANNELS } from '@/lib/constants';

export function SearchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: search, isLoading } = useSearch(id || '');
  const { data: history, isLoading: historyLoading } = useSearchHistory(id || '');
  const toggleSearch = useToggleSearch();
  const deleteSearch = useDeleteSearch();
  const [deleteModal, setDeleteModal] = useState(false);
  const { toast } = useToast();

  const handleToggle = () => {
    if (!search) return;
    toggleSearch.mutate(
      { id: search.id, action: search.status === 'ACTIVE' ? 'pause' : 'resume' },
      { onSuccess: () => toast(search.status === 'ACTIVE' ? 'Monitoramento pausado' : 'Monitoramento retomado') }
    );
  };

  const handleDelete = () => {
    if (!search) return;
    deleteSearch.mutate(search.id, {
      onSuccess: () => {
        toast('Monitoramento excluído');
        navigate('/searches');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!search) {
    return (
      <div className="space-y-4 text-center py-12">
        <h2 className="text-sm font-medium text-slate-300">Busca não encontrada</h2>
        <Link to="/searches"><Button variant="outline" size="sm">Voltar</Button></Link>
      </div>
    );
  }

  const freqLabel = MONITORING_FREQUENCIES.find((f) => f.value === search.frequency)?.label || search.frequency;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/searches" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para monitoramentos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-100">{search.name}</h1>
            <StatusBadge status={search.status} />
          </div>
          <p className="text-sm text-slate-400">{search.location} · Raio: {search.radius} miles · Frequência: {freqLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {search.status === 'ACTIVE' ? (
            <Button variant="outline" size="sm" onClick={handleToggle} icon={<Pause className="h-3.5 w-3.5" />} loading={toggleSearch.isPending}>
              Pausar
            </Button>
          ) : (
            <Button size="sm" onClick={handleToggle} icon={<Play className="h-3.5 w-3.5" />} loading={toggleSearch.isPending}>
              Retomar
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)} icon={<Trash2 className="h-3.5 w-3.5" />}>
            Excluir
          </Button>
        </div>
      </div>

      {/* Configuration */}
      <Card className="p-5 space-y-4">
        <h2 className="text-sm font-medium text-slate-200">Configurações</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <DetailItem label="Localização" value={search.location} />
          <DetailItem label="Raio" value={`${search.radius} miles`} />
          <DetailItem label="Frequência" value={freqLabel} />
          <DetailItem label="Vagas encontradas" value={String(search.jobsFound)} />
          <DetailItem label="Novas vagas" value={String(search.newJobsFound)} />
          <DetailItem label="Última verificação" value={search.lastCheckedAt ? formatRelativeTime(search.lastCheckedAt) : '—'} />
          <DetailItem label="Próxima verificação" value={search.nextCheckAt ? formatRelativeTime(search.nextCheckAt) : '—'} />
        </dl>

        <div className="space-y-2 pt-2">
          <dt className="text-xs text-slate-500">Palavras-chave</dt>
          <div className="flex flex-wrap gap-1.5">
            {search.keywords.map((kw) => (
              <span key={kw} className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{kw}</span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <dt className="text-xs text-slate-500">Tipos de vaga</dt>
          <div className="flex flex-wrap gap-1.5">
            {search.jobTypes.map((jt) => {
              const label = JOB_TYPES.find((t) => t.value === jt)?.label || jt;
              return <span key={jt} className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{label}</span>;
            })}
          </div>
        </div>

        <div className="space-y-2">
          <dt className="text-xs text-slate-500">Cidades adicionais</dt>
          <div className="flex flex-wrap gap-1.5">
            {search.additionalCities.map((city) => (
              <span key={city} className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{city}</span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <dt className="text-xs text-slate-500">Canais de notificação</dt>
          <div className="flex flex-wrap gap-1.5">
            {search.notificationChannels.map((ch) => {
              const label = NOTIFICATION_CHANNELS.find((c) => c.value === ch)?.label || ch;
              return <span key={ch} className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{label}</span>;
            })}
          </div>
        </div>
      </Card>

      {/* Execution History */}
      <section className="space-y-4">
        <h2 className="text-base font-medium text-slate-100">Histórico de verificações</h2>
        {historyLoading ? (
          <SkeletonList count={4} />
        ) : history && history.length > 0 ? (
          <div className="space-y-0">
            {history.map((exec, i) => (
              <div key={exec.id} className="flex gap-3 pb-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  {exec.status === 'SUCCESS' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : exec.status === 'ERROR' ? (
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-cyan-400 shrink-0 animate-spin" />
                  )}
                  {i < (history?.length || 0) - 1 && <div className="w-px flex-1 bg-slate-800 mt-1" />}
                </div>
                <div className="space-y-0.5 min-w-0 pb-1">
                  <p className="text-sm text-slate-300">
                    {exec.status === 'SUCCESS' ? 'Verificação concluída' : exec.status === 'ERROR' ? 'Erro na verificação' : 'Executando...'}
                  </p>
                  <p className="text-xs text-slate-500">{formatDateTime(exec.executedAt)}</p>
                  {exec.status === 'SUCCESS' ? (
                    <p className="text-xs text-slate-500">
                      {exec.jobsFound} vaga{exec.jobsFound !== 1 ? 's' : ''} encontrada{exec.jobsFound !== 1 ? 's' : ''} · {exec.newJobsFound} nova{exec.newJobsFound !== 1 ? 's' : ''}
                    </p>
                  ) : exec.errorMessage ? (
                    <p className="text-xs text-red-400">{exec.errorMessage}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Clock className="h-8 w-8" />}
            title="Nenhum histórico"
            description="O histórico de verificações será exibido aqui."
          />
        )}
      </section>

      {/* Delete Modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Excluir monitoramento" description="Esta ação não pode ser desfeita.">
        <div className="flex items-center gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setDeleteModal(false)}>Cancelar</Button>
          <Button variant="danger" size="sm" onClick={handleDelete} loading={deleteSearch.isPending}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-300">{value}</dd>
    </div>
  );
}
