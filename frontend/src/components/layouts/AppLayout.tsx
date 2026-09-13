import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { NewSearchProvider, useNewSearch } from '@/context/NewSearchContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { openNewSearch } = useNewSearch();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openNewSearch();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openNewSearch]);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-72">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="w-full flex-1 bg-surface px-space-lg py-space-md pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <NewSearchProvider>
      <AppShell />
    </NewSearchProvider>
  );
}
