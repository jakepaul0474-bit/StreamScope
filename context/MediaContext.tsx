import React, { createContext, useContext, useRef } from 'react';
import { FilterState, MediaItem } from '../types';

interface PageState {
  items: MediaItem[];
  filters: FilterState;
  page: number;
  hasMore: boolean;
  scrollY: number;
}

interface MediaContextType {
  getCachedState: (key: string) => PageState | undefined;
  setCachedState: (key: string, state: PageState) => void;
  clearCache: () => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cache = useRef<Record<string, PageState>>({});

  const getCachedState = (key: string) => {
    return cache.current[key];
  };

  const setCachedState = (key: string, state: PageState) => {
    cache.current[key] = state;
  };

  const clearCache = () => {
    cache.current = {};
  };

  return (
    <MediaContext.Provider value={{ getCachedState, setCachedState, clearCache }}>
      {children}
    </MediaContext.Provider>
  );
};

export const useMediaContext = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMediaContext must be used within a MediaProvider');
  }
  return context;
};
