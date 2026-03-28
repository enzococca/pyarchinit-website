"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SmartSearch } from "./smart-search";

interface SearchContextValue {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

const SearchContext = createContext<SearchContextValue>({
  open: false,
  openSearch: () => {},
  closeSearch: () => {},
});

export function useSearch() {
  return useContext(SearchContext);
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  /* Global Cmd+K / Ctrl+K shortcut */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SearchContext.Provider value={{ open, openSearch, closeSearch }}>
      {children}
      <SmartSearch open={open} onClose={closeSearch} />
    </SearchContext.Provider>
  );
}
