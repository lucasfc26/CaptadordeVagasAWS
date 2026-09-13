import { Link } from 'react-router-dom';
import { useNewSearch } from '@/context/NewSearchContext';
import { useSearches } from '@/hooks';
import { searchSourceLabel } from '@/lib/display';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { SkeletonList } from '@/components/ui/Skeleton';
import { frequencyShort } from '@/lib/display';
import { formatRelativeTime, formatUntil } from '@/lib/utils';

export function SearchesPage() {
  const { openNewSearch } = useNewSearch();
  const { data: searches, isLoading } = useSearches();
  const active = searches?.filter((search) => search.status === 'ACTIVE').length ?? 0;

  return (
    <div className="space-y-space-lg">
      <div className="flex flex-col justify-between gap-space-md sm:flex-row sm:items-end">
        <div>
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">Monitoramentos Ativos</h1>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Gerencie rotinas de varredura e acompanhe o health check de cada busca.
          </p>
        </div>
        <button
          type="button"
          onClick={openNewSearch}
          className="inline-flex items-center gap-space-xs rounded-full bg-primary px-space-md py-2.5 font-body-sm font-semibold text-on-primary shadow-accent-primary transition-all hover:brightness-110 active:scale-[0.97]"
        >
          <Icon name="add" className="text-[18px]" />
          Nova Busca
        </button>
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : searches && searches.length > 0 ? (
        <div className="space-y-space-md">
          <div className="flex items-center gap-space-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Rotinas Customizadas</h2>
            <span className="font-mono-sm text-mono-sm text-on-surface-variant">{active} ativas</span>
          </div>
          {searches.map((search) => (
            <article key={search.id} className="space-y-space-md rounded-xl border border-outline-variant/15 bg-surface-container-low p-space-md shadow-elevation-1">
              <div className="flex flex-col gap-space-sm sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-space-sm">
                  <span
                    className={`mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ${
                      search.status === 'ACTIVE' ? 'bg-primary ring-primary/20' : search.status === 'ERROR' ? 'bg-error ring-error/20' : 'bg-tertiary ring-tertiary/20'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-space-sm">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">{search.name}</h3>
                      <StatusBadge status={search.status} />
                      <span className="rounded-full bg-secondary-container/20 px-2 py-0.5 font-mono-sm text-mono-sm text-secondary">
                        {searchSourceLabel(search.sourceType)}
                      </span>
                    </div>
                    <p className="mt-1 font-mono-data text-mono-data text-on-surface-variant">
                      {[search.location, ...search.additionalCities].filter(Boolean).join(' • ')} • Raio {search.radius} mi • {frequencyShort(search.frequency)}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/searches/${search.id}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-surface-container-high px-space-sm py-1.5 font-body-sm text-on-surface hover:bg-surface-container-highest"
                >
                  Ver detalhes
                  <Icon name="arrow_forward" className="text-[16px]" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-space-sm rounded-lg bg-surface-container p-space-sm sm:grid-cols-4">
                <Stat label="Vagas" value={String(search.jobsFound)} />
                <Stat label="Novas" value={String(search.newJobsFound)} accent />
                <Stat label="Última" value={search.lastCheckedAt ? formatRelativeTime(search.lastCheckedAt) : '—'} />
                <Stat label="Próxima" value={search.nextCheckAt ? formatUntil(search.nextCheckAt) : '—'} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {search.keywords.map((keyword) => (
                  <span key={keyword} className="rounded bg-surface-container px-2 py-0.5 font-mono-sm text-mono-sm text-on-surface-variant">
                    {keyword}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Icon name="radar" className="text-[40px]" />}
          title="Nenhum monitoramento"
          description="Você ainda não possui nenhum monitoramento. Crie sua primeira busca para começar a receber vagas."
          action={
            <button type="button" onClick={openNewSearch} className="inline-flex items-center gap-space-xs rounded-full bg-primary px-space-md py-2 font-body-sm font-semibold text-on-primary transition-all hover:brightness-110 active:scale-[0.97]">
              Criar primeira busca
            </button>
          }
        />
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="font-label-caps text-label-caps uppercase text-outline">{label}</div>
      <div className={`font-mono-data text-mono-data font-semibold ${accent ? 'text-primary' : 'text-on-surface'}`}>{value}</div>
    </div>
  );
}
