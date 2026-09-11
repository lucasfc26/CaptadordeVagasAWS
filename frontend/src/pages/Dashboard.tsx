// ============================================
// JobWatch - Dashboard Page
// ============================================

import { Link } from 'react-router-dom';
import { Briefcase, Search, Clock, Eye, ExternalLink, Activity, Radar, Check } from 'lucide-react';
import { useDashboard, useNewJobs, useSearches, useMarkJobViewed } from '@/hooks';
import { useToast } from '@/context/ToastContext';
import { StatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonStats, SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelativeTime } from '@/lib/utils';
import type { Job } from '@/types';

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboard();
  const { data: newJobs, isLoading: jobsLoading } = useNewJobs();
  const { data: searches, isLoading: searchesLoading } = useSearches();
  const markViewed = useMarkJobViewed();
  const { toast } = useToast();

  const handleMarkViewed = (job: Job) => {
    markViewed.mutate(job.id, {
      onSuccess: () => toast(`"${job.title}" marcada como visualizada`),
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-100">Monitoramento de vagas</h1>
        <div className="flex items-center gap-2">
          {stats?.monitoringActive ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-sm text-slate-400">Seu monitoramento está ativo</p>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <p className="text-sm text-slate-400">Monitoramento pausado</p>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <SkeletonStats />
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatsItem label="Novas vagas" value={stats.newJobs} icon={<Briefcase className="h-4 w-4" />} highlight={stats.newJobs > 0} />
          <StatsItem label="Disponíveis" value={stats.availableJobs} icon={<Activity className="h-4 w-4" />} />
          <StatsItem label="Buscas ativas" value={stats.activeSearches} icon={<Search className="h-4 w-4" />} />
          <StatsItem
            label="Última verificação"
            value={stats.lastCheckedAt ? formatRelativeTime(stats.lastCheckedAt) : '—'}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatsItem
            label="Próxima verificação"
            value={stats.nextCheckAt ? formatRelativeTime(stats.nextCheckAt) : '—'}
            icon={<Radar className="h-4 w-4" />}
          />
        </div>
      ) : null}

      {/* New Jobs - PRIORITY */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-100">Novas vagas</h2>
          {newJobs && newJobs.length > 0 && (
            <Link to="/jobs?status=NEW" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              Ver todas →
            </Link>
          )}
        </div>

        {jobsLoading ? (
          <SkeletonList count={3} />
        ) : newJobs && newJobs.length > 0 ? (
          <div className="space-y-2">
            {newJobs.map((job) => (
              <NewJobCard key={job.id} job={job} onMarkViewed={() => handleMarkViewed(job)} marking={markViewed.isPending} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Radar className="h-10 w-10" />}
            title="Nenhuma vaga nova"
            description="Continuamos monitorando suas buscas. Você será avisado assim que uma nova vaga aparecer."
          />
        )}
      </section>

      {/* Active Searches */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-100">Monitoramentos ativos</h2>
          <Link to="/searches" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
            Ver todos →
          </Link>
        </div>

        {searchesLoading ? (
          <SkeletonList count={2} />
        ) : searches && searches.filter((s) => s.status === 'ACTIVE').length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {searches.filter((s) => s.status === 'ACTIVE').map((search) => (
              <Card key={search.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-slate-100">{search.name}</h3>
                    <p className="text-xs text-slate-400">{search.location} · Raio: {search.radius} miles</p>
                  </div>
                  <StatusBadge status={search.status} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{search.jobsFound} vagas</span>
                    {search.newJobsFound > 0 && <span className="text-cyan-400">{search.newJobsFound} nova{search.newJobsFound > 1 ? 's' : ''}</span>}
                    {search.lastCheckedAt && <span>Verificado {formatRelativeTime(search.lastCheckedAt)}</span>}
                  </div>
                  <Link to={`/searches/${search.id}`}>
                    <Button variant="ghost" size="sm">Detalhes</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Search className="h-10 w-10" />}
            title="Nenhum monitoramento ativo"
            action={
              <Link to="/searches/new">
                <Button variant="outline" size="sm">Criar monitoramento</Button>
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}

// --- Sub-components ---

function StatsItem({ label, value, icon, highlight }: { label: string; value: number | string; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <p className={`text-lg font-semibold ${highlight ? 'text-cyan-400' : 'text-slate-100'}`}>
        {value}
      </p>
    </div>
  );
}

function NewJobCard({ job, onMarkViewed, marking }: { job: Job; onMarkViewed: () => void; marking: boolean }) {
  return (
    <div className="group rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/40">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-slate-100 truncate">{job.title}</h3>
            <StatusBadge status="NEW" />
          </div>
          <p className="text-xs text-slate-400">
            {job.location.city}, {job.location.state} · {job.facility}
          </p>
          <p className="text-xs text-slate-500">Encontrada {formatRelativeTime(job.foundAt)}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="ghost" size="sm" onClick={onMarkViewed} loading={marking} icon={<Check className="h-3.5 w-3.5" />}>
            <span className="hidden sm:inline">Visualizar</span>
          </Button>
          <Link to={`/jobs/${job.id}`}>
            <Button variant="ghost" size="sm" icon={<Eye className="h-3.5 w-3.5" />}>
              <span className="hidden sm:inline">Ver vaga</span>
            </Button>
          </Link>
          <a href={job.externalUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" icon={<ExternalLink className="h-3.5 w-3.5" />}>
              <span className="hidden sm:inline">Candidatar</span>
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
