// ============================================
// JobWatch - Header
// ============================================

import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getGreeting, getInitials } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-sm lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="text-slate-400 hover:text-slate-200 lg:hidden" aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden lg:block">
          <p className="text-sm text-slate-300">
            {getGreeting()}, <span className="font-medium text-slate-100">{user?.name?.split(' ')[0]}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* User avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-medium text-slate-300">
          {user ? getInitials(user.name) : '?'}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label="Sair"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
