import React, { createContext, useContext, useRef, useState } from 'react';
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
  getGlobalFilters: () => FilterState | undefined;
  setGlobalFilters: (filters: FilterState) => void;
  clearCache: () => void;
  enableAIImages: boolean;
  toggleAIImages: () => void;
  isImmersiveMode: boolean;
  toggleImmersiveMode: () => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cache = useRef<Record<string, PageState>>({});
  // Ref to store filters globally across the session
  const globalFiltersRef = useRef<FilterState | undefined>(undefined);

  // Preference for AI Images - Persisted in LocalStorage - DEFAULT FALSE
  const [enableAIImages, setEnableAIImages] = useState(() => {
    try {
        const saved = localStorage.getItem('enableAIImages');
        return saved !== null ? JSON.parse(saved) : false;
    } catch {
        return false;
    }
  });

  // Immersive Mode State (Hides UI)
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);

  const toggleAIImages = () => {
    setEnableAIImages((prev: boolean) => {
      const next = !prev;
      localStorage.setItem('enableAIImages', JSON.stringify(next));
      return next;
    });
  };

  const toggleImmersiveMode = () => {
    setIsImmersiveMode(prev => !prev);
  };

  const getCachedState = (key: string) => {
    return cache.current[key];
  };

  const setCachedState = (key: string, state: PageState) => {
    cache.current[key] = state;
  };

  const getGlobalFilters = () => {
    return globalFiltersRef.current;
  };

  const setGlobalFilters = (filters: FilterState) => {
    globalFiltersRef.current = filters;
  };

  const clearCache = () => {
    cache.current = {};
    globalFiltersRef.current = undefined;
  };

  return (
    <MediaContext.Provider value={{ 
        getCachedState, 
        setCachedState, 
        getGlobalFilters, 
        setGlobalFilters, 
        clearCache,
        enableAIImages,
        toggleAIImages,
        isImmersiveMode,
        toggleImmersiveMode
    }}>
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