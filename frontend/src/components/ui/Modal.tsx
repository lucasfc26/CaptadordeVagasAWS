import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative z-50 w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl', className)}>
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 transition-colors" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
        {title && <h2 className="text-lg font-semibold text-slate-100">{title}</h2>}
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
        <div className={cn(title && 'mt-4')}>{children}</div>
      </div>
    </div>
  );
}
