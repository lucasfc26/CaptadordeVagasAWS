import { Outlet } from 'react-router-dom';
import { LogoMark } from '@/components/brand/Logo';
import { APP_NAME } from '@/lib/constants';
import { useTheme } from '@/context/ThemeContext';
import { Icon } from '@/components/ui/Icon';

export function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-surface text-on-surface">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-outline-variant/20 bg-surface-container-lowest p-12 lg:flex lg:w-1/2">
        <div className="bg-radar-grid pointer-events-none absolute inset-0" />
        <div className="relative z-10 flex items-center gap-space-sm">
          <LogoMark />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">{APP_NAME}</span>
            <span className="font-mono-sm text-mono-sm text-on-surface-variant">Radar de Vagas</span>
          </div>
        </div>
        <div className="relative z-10 max-w-lg space-y-space-md">
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Monitoramento automático de vagas Amazon Warehouse
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Configure suas buscas e receba notificações quando novas vagas aparecerem. O sistema monitora continuamente para você.
          </p>
        </div>
        <p className="relative z-10 font-mono-sm text-mono-sm text-outline">© {new Date().getFullYear()} {APP_NAME}</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-space-sm">
              <LogoMark className="h-8 w-8" />
              <span className="font-headline-sm text-headline-sm text-on-surface">{APP_NAME}</span>
            </div>
            <button type="button" onClick={toggleTheme} className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high">
              <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} className="text-[20px]" />
            </button>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
