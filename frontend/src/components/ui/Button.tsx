import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'rounded-full bg-primary text-on-primary shadow-accent-primary font-semibold hover:brightness-110 active:brightness-95',
  secondary:
    'bg-surface-container-high border border-outline-variant/40 text-on-surface shadow-elevation-1 hover:bg-surface-container-highest',
  ghost: 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
  danger: 'border border-error/30 text-error hover:bg-error-container/20',
  outline:
    'border border-outline-variant/50 bg-transparent text-on-surface hover:bg-surface-container-high',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-space-sm text-body-sm gap-space-xs',
  md: 'h-9 px-space-sm text-body-sm gap-space-xs',
  lg: 'h-11 px-space-md text-body-md gap-space-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-body-sm font-medium transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : icon}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
