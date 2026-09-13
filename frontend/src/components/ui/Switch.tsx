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
    <label className={cn('inline-flex items-center gap-space-sm', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <button
        role="switch"
        aria-checked={checked}
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-surface-container-highest',
        )}
      >
        <span
          className={cn(
            'absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-on-primary transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </button>
      {label && <span className="font-body-sm text-body-sm text-on-surface">{label}</span>}
    </label>
  );
}
