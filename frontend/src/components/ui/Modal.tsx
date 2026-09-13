import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('animate-in relative z-50 w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-low p-space-lg shadow-elevation-3', className)}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Fechar"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
        {title && <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>}
        {description && <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{description}</p>}
        <div className={cn(title && 'mt-4')}>{children}</div>
      </div>
    </div>
  );
}
