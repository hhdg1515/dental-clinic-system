import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface SearchContextValue {
  query: string;
  setQuery: (value: string) => void;
  clear: () => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');

  const value = useMemo<SearchContextValue>(() => ({
    query,
    setQuery,
    clear: () => setQuery(''),
  }), [query]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
