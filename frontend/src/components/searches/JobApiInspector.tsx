import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { getErrorMessage } from '@/lib/utils';
import type { ApiInspectField, ApiInspectResult } from '@/types';

interface JobApiInspectorProps {
  url: string;
  inspecting: boolean;
  onInspect: () => Promise<ApiInspectResult>;
  shape: ApiInspectResult | null;
  selected: Record<string, string[]>;
  onToggleValue: (path: string, value: string) => void;
}

function formatSampleValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function JobApiInspector({
  url,
  inspecting,
  onInspect,
  shape,
  selected,
  onToggleValue,
}: JobApiInspectorProps) {
  const [error, setError] = useState('');
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  const load = async () => {
    setError('');
    try {
      await onInspect();
    } catch (cause) {
      setError(getErrorMessage(cause, 'Não foi possível ler a API'));
    }
  };

  const addCustomValue = (field: ApiInspectField) => {
    const value = (customValues[field.path] ?? '').trim();
    if (!value) return;
    onToggleValue(field.path, value);
    setCustomValues((current) => ({ ...current, [field.path]: '' }));
  };

  return (
    <div className="space-y-space-md">
      <div className="flex flex-wrap items-end gap-2">
        <Button type="button" variant="secondary" onClick={load} loading={inspecting} disabled={!url.trim()}>
          Carregar resposta
        </Button>
        {shape && (
          <p className="font-mono-sm text-mono-sm text-on-surface-variant">
            {shape.itemCount} {shape.itemCount === 1 ? 'item' : 'itens'} em <span className="text-primary">{shape.itemPath}</span>
          </p>
        )}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}

      {shape && (
        <>
          <div className="space-y-2">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Elementos da resposta</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Itens retornados pela API. Use os filtros abaixo para escolher o que monitorar.
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {shape.items.map((item, index) => (
                <div key={index} className="rounded-xl bg-surface-container p-3">
                  <p className="mb-2 font-mono-sm text-mono-sm text-secondary">#{index + 1}</p>
                  <dl className="space-y-1">
                    {Object.entries(item).slice(0, 6).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <dt className="shrink-0 font-label-caps text-label-caps uppercase text-on-surface-variant">{key}</dt>
                        <dd className="min-w-0 truncate font-body-sm text-body-sm text-on-surface">{formatSampleValue(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Filtros</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Selecione os valores que a vaga precisa ter. Campos sem seleção não filtram.
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {shape.fields.map((field) => {
                const picked = selected[field.path] ?? [];
                return (
                  <div key={field.path} className="space-y-2 rounded-xl bg-surface-container p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-body-md text-body-md font-medium text-on-surface">{field.path}</p>
                      <span className="rounded-full bg-secondary-container/20 px-2 py-0.5 font-mono-sm text-mono-sm text-secondary">
                        {field.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {field.values.map((value) => {
                        const active = picked.includes(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => onToggleValue(field.path, value)}
                            className={`rounded-full px-2.5 py-1 font-body-sm text-body-sm transition-colors ${
                              active
                                ? 'bg-primary text-on-primary'
                                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customValues[field.path] ?? ''}
                        onChange={(event) =>
                          setCustomValues((current) => ({ ...current, [field.path]: event.target.value }))
                        }
                        onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addCustomValue(field))}
                        placeholder="Outro valor"
                        className="flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-1.5 font-body-sm text-body-sm text-on-surface placeholder:text-outline/70 focus:outline-none focus:ring-1 focus:ring-secondary"
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={() => addCustomValue(field)}>
                        <Icon name="add" className="text-[16px]" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
