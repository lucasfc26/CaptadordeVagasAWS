import { cn } from '@/lib/utils';
import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block font-label-caps text-label-caps uppercase text-on-surface-variant">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full appearance-none rounded-xl border border-outline-variant/40 bg-surface-container-high px-3 py-2 font-body-sm text-body-sm text-on-surface transition-colors',
          'focus:outline-none focus:border-secondary/60 focus:ring-2 focus:ring-secondary/25',
          error && 'border-error/50',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
