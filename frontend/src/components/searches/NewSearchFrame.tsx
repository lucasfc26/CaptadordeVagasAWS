import { SEARCH_SOURCES } from '@/lib/constants';
import { Icon } from '@/components/ui/Icon';
import type { SearchSourceType } from '@/types';

interface NewSearchFrameProps {
  open: boolean;
  onClose: () => void;
  onSelect: (source: SearchSourceType) => void;
}

export function NewSearchFrame({ open, onClose, onSelect }: NewSearchFrameProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-space-md">
      <button
        type="button"
        className="absolute inset-0 bg-background/75 backdrop-blur-md"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div className="animate-in relative z-10 w-full max-w-2xl rounded-2xl border border-outline-variant/20 bg-surface-container-low p-space-lg shadow-elevation-3">
        <div className="mb-space-md flex items-start justify-between gap-space-sm">
          <div>
            <p className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">Nova Busca</p>
            <h2 className="mt-1 font-headline-md text-headline-md tracking-tight text-on-surface">
              Escolha a fonte de monitoramento
            </h2>
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              Selecione como o JobWatch deve encontrar e acompanhar as vagas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            aria-label="Fechar"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
          {SEARCH_SOURCES.map((source) => (
            <button
              key={source.value}
              type="button"
              onClick={() => onSelect(source.value)}
              className="group flex flex-col items-start gap-space-sm rounded-xl border border-outline-variant/15 bg-surface-container p-space-md text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-container-high"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container/20 text-primary">
                <Icon name={source.icon} className="text-[22px]" />
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary">
                {source.label}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{source.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
