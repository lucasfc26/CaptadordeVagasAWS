import { createContext, useContext, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewSearchFrame } from '@/components/searches/NewSearchFrame';
import type { SearchSourceType } from '@/types';

interface NewSearchContextType {
  openNewSearch: () => void;
}

const NewSearchContext = createContext<NewSearchContextType | undefined>(undefined);

export function NewSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const openNewSearch = () => setOpen(true);

  const selectSource = (source: SearchSourceType) => {
    setOpen(false);
    navigate(`/searches/new?source=${source}`);
  };

  return (
    <NewSearchContext.Provider value={{ openNewSearch }}>
      {children}
      <NewSearchFrame open={open} onClose={() => setOpen(false)} onSelect={selectSource} />
    </NewSearchContext.Provider>
  );
}

export function useNewSearch() {
  const context = useContext(NewSearchContext);
  if (!context) throw new Error('useNewSearch must be used within NewSearchProvider');
  return context;
}
