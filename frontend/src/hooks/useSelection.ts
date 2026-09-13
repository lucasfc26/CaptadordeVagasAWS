import { useMemo, useState } from 'react';

export function useSelection(ids: string[]) {
  const [selected, setSelected] = useState<string[]>([]);
  const available = useMemo(() => new Set(ids), [ids]);
  const visibleSelected = selected.filter((id) => available.has(id));

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const selectAll = () => setSelected(ids);
  const clear = () => setSelected([]);
  const isSelected = (id: string) => visibleSelected.includes(id);

  return {
    selected: visibleSelected,
    count: visibleSelected.length,
    allSelected: ids.length > 0 && visibleSelected.length === ids.length,
    toggle,
    selectAll,
    clear,
    isSelected,
  };
}
