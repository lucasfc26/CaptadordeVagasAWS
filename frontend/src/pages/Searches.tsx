// ============================================
// JobWatch - Searches List Page
// ============================================

import { Link } from 'react-router-dom';
import { Plus, Search, Clock, MapPin } from 'lucide-react';
import { useSearches } from '@/hooks';
import { StatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelativeTime } from '@/lib/utils';

export function SearchesPage() {
  const { data: searches, isLoading } = useSearches();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-100">Monitoramentos</h1>
          <p className="text-sm text-slate-400">Gerencie suas buscas de vagas</p>
        </div>
        <Link to="/searches/new">
          <Button icon={<Plus className="h-3.5 w-3.5" />} size="sm">Nova busca</Button>
        </Link>
      </div>

      {/* List */}
      {isLoading ? (
        <SkeletonList count={3} />
      ) : searches && searches.length > 0 ? (
        <div className="space-y-3">
          {searches.map((search) => (
            <Card key={search.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-slate-100">{search.name}</h3>
                    <StatusBadge status={search.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {search.location}</span>
                    <span>Raio: {search.radius} miles</span>
                    <span>{search.keywords.slice(0, 2).join(', ')}{search.keywords.length > 2 ? '...' : ''}</span>
                    <span>{search.jobsFound} vagas</span>
                    {search.lastCheckedAt && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatRelativeTime(search.lastCheckedAt)}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {search.keywords.map((kw) => (
                      <span key={kw} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{kw}</span>
                    ))}
                  </div>
                </div>
                <Link to={`/searches/${search.id}`}>
                  <Button variant="ghost" size="sm">Ver detalhes</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search className="h-10 w-10" />}
          title="Nenhum monitoramento"
          description="Você ainda não possui nenhum monitoramento. Crie sua primeira busca para começar a receber vagas."
          action={
            <Link to="/searches/new">
              <Button variant="outline" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>Criar primeira busca</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
