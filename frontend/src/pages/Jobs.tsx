// ============================================
// JobWatch - Jobs List Page
// ============================================

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Briefcase, Eye, Search as SearchIcon, MapPin } from 'lucide-react';
import { useJobs, useMarkJobViewed } from '@/hooks';
import { useToast } from '@/context/ToastContext';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelativeTime } from '@/lib/utils';
import type { JobFilters, JobStatus, JobType } from '@/types';

export function JobsPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');

  const filters: JobFilters = {
    title: query || undefined,
    status: (statusFilter || undefined) as JobStatus | undefined,
    jobType: (typeFilter || undefined) as JobType | undefined,
    sortBy: sortBy as JobFilters['sortBy'],
  };

  const { data, isLoading } = useJobs(filters);
  const markViewed = useMarkJobViewed();
  const { toast } = useToast();

  const handleMarkViewed = (jobId: string, jobTitle: string) => {
    markViewed.mutate(jobId, {
      onSuccess: () => toast(`"${jobTitle}" marcada como visualizada`),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-100">Vagas</h1>
        <p className="text-sm text-slate-400">Todas as vagas encontradas pelos seus monitoramentos</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar vagas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-800/50 pl-10 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'NEW', label: 'Novo' },
              { value: 'VIEWED', label: 'Visualizado' },
              { value: 'APPLIED', label: 'Candidatado' },
              { value: 'EXPIRED', label: 'Expirado' },
            ]}
            placeholder="Status"
            className="w-36"
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'FULL_TIME', label: 'Tempo integral' },
              { value: 'PART_TIME', label: 'Meio período' },
              { value: 'SEASONAL', label: 'Sazonal' },
              { value: 'TEMPORARY', label: 'Temporário' },
            ]}
            placeholder="Tipo"
            className="w-40"
          />
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'newest', label: 'Mais recentes' },
              { value: 'oldest', label: 'Mais antigas' },
              { value: 'location', label: 'Localização' },
              { value: 'title', label: 'Cargo' },
            ]}
            className="w-40"
          />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <SkeletonList count={5} />
      ) : data?.data && data.data.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">{data.total} vaga{data.total !== 1 ? 's' : ''}</p>
          <div className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900/30">
            {data.data.map((job) => (
              <div key={job.id} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-800/30 transition-colors">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/jobs/${job.id}`} className="text-sm font-medium text-slate-100 hover:text-cyan-400 transition-colors">
                      {job.title}
                    </Link>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin className="h-3 w-3" />
                    <span>{job.location.city}, {job.location.state}</span>
                    <span className="text-slate-600">·</span>
                    <span>{job.facility}</span>
                    <span className="text-slate-600">·</span>
                    <span>Encontrada {formatRelativeTime(job.foundAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {job.status === 'NEW' && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkViewed(job.id, job.title)} icon={<Eye className="h-3.5 w-3.5" />}>
                      <span className="hidden md:inline">Visualizar</span>
                    </Button>
                  )}
                  <Link to={`/jobs/${job.id}`}>
                    <Button variant="ghost" size="sm">Ver</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Briefcase className="h-10 w-10" />}
          title="Nenhuma vaga encontrada"
          description="Ajuste os filtros ou aguarde novas vagas serem encontradas pelos seus monitoramentos."
        />
      )}
    </div>
  );
}
