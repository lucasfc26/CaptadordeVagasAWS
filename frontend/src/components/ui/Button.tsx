// ============================================
// JobWatch - Button Component
// ============================================

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
  primary: 'bg-cyan-600 text-white hover:bg-cyan-500 focus-visible:ring-cyan-500',
  secondary: 'bg-slate-700 text-slate-200 hover:bg-slate-600 focus-visible:ring-slate-500',
  ghost: 'text-slate-300 hover:bg-slate-800 hover:text-slate-100 focus-visible:ring-slate-500',
  danger: 'bg-red-600/90 text-white hover:bg-red-500 focus-visible:ring-red-500',
  outline: 'border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-slate-100 focus-visible:ring-slate-500',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
