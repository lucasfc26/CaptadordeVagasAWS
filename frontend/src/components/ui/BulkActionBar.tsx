import { Icon } from './Icon';

export function BulkActionBar({
  noun,
  total,
  selectedCount,
  allSelected,
  pending,
  onSelectAll,
  onClear,
  onDeleteSelected,
  onDeleteAll,
}: {
  noun: string;
  total: number;
  selectedCount: number;
  allSelected: boolean;
  pending?: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onDeleteSelected: () => void;
  onDeleteAll: () => void;
}) {
  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-space-xs">
      <button
        type="button"
        onClick={allSelected ? onClear : onSelectAll}
        className="inline-flex items-center gap-1 rounded-lg bg-surface-container-high px-space-sm py-1.5 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-highest"
      >
        <Icon name={allSelected ? 'deselect' : 'select_all'} className="text-[16px]" />
        {allSelected ? 'Limpar seleção' : `Selecionar todas (${total})`}
      </button>
      <button
        type="button"
        disabled={selectedCount === 0 || pending}
        onClick={onDeleteSelected}
        className="inline-flex items-center gap-1 rounded-lg bg-error/10 px-space-sm py-1.5 font-body-sm text-body-sm font-semibold text-error disabled:opacity-50"
      >
        <Icon name="delete" className="text-[16px]" />
        Excluir selecionadas{selectedCount ? ` (${selectedCount})` : ''}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onDeleteAll}
        className="inline-flex items-center gap-1 rounded-lg bg-error/10 px-space-sm py-1.5 font-body-sm text-body-sm font-semibold text-error disabled:opacity-50"
      >
        <Icon name="delete_sweep" className="text-[16px]" />
        Excluir todas as {noun}
      </button>
    </div>
  );
}
