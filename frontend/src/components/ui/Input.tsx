import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { applyInputMask, type InputMask } from '@/lib/masks';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  mask?: InputMask;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, id, mask, onChange, inputMode, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block font-label-caps text-label-caps uppercase text-on-surface-variant">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">{icon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            inputMode={inputMode ?? (mask === 'email' ? 'email' : mask === 'phone' ? 'numeric' : undefined)}
            className={cn(
              'w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-space-md py-2.5 font-body-md text-body-md text-on-surface placeholder:text-outline/70 transition-colors',
              'focus:outline-none focus:border-secondary/60 focus:ring-2 focus:ring-secondary/25',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-error/50',
              icon && 'pl-10',
              className,
            )}
            {...props}
            onChange={(event) => {
              if (mask) {
                event.target.value = applyInputMask(mask, event.target.value);
              }
              onChange?.(event);
            }}
          />
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
        {hint && !error && <p className="text-xs text-on-surface-variant">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
