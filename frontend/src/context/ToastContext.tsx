import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/Icon';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons: Record<ToastType, string> = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
  };

  const colors: Record<ToastType, string> = {
    success: 'text-primary',
    error: 'text-error',
    info: 'text-secondary',
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 shadow-elevation-3',
              'animate-in',
            )}
          >
            <Icon name={icons[t.type]} className={cn('text-[18px]', colors[t.type])} />
            <p className="font-body-sm text-body-sm text-on-surface">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="ml-2 text-outline hover:text-on-surface">
              <Icon name="close" className="text-[16px]" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
