import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onChange, label, disabled, className }: SwitchProps) {
  return (
    <label className={cn('inline-flex items-center gap-2', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <button
        role="switch"
        aria-checked={checked}
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          checked ? 'bg-cyan-600' : 'bg-slate-600'
        )}
      >
        <span className={cn(
          'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform',
          checked && 'translate-x-4'
        )} />
      </button>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </label>
  );
}
