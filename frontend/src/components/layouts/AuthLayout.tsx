// ============================================
// JobWatch - Auth Layout (Public)
// ============================================

import { Outlet } from 'react-router-dom';
import { Radar } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-900 p-12 border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600/10 text-cyan-500">
            <Radar className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-slate-100 tracking-tight">{APP_NAME}</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-100 leading-tight">
            Monitoramento automático de vagas Amazon Warehouse
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Configure suas buscas e receba notificações quando novas vagas aparecerem. 
            O sistema monitora continuamente para você.
          </p>
        </div>
        <p className="text-xs text-slate-600">© {new Date().getFullYear()} {APP_NAME}</p>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-600/10 text-cyan-500">
              <Radar className="h-4.5 w-4.5" />
            </div>
            <span className="text-sm font-semibold text-slate-100 tracking-tight">{APP_NAME}</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
