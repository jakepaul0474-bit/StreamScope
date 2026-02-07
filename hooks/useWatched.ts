import { useState, useEffect, useCallback } from 'react';
import { MediaItem } from '../types';

const STORAGE_KEY = 'streamscope_history';

export const useWatched = () => {
  const [watched, setWatched] = useState<MediaItem[]>([]);

  const loadHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setWatched(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load history", error);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    const handleStorageChange = () => loadHistory();
    window.addEventListener('history-update', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('history-update', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadHistory]);

  const toggleWatched = (item: MediaItem) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const currentList: MediaItem[] = stored ? JSON.parse(stored) : [];
      
      const exists = currentList.some(i => i.id === item.id);
      let newList;

      if (exists) {
        newList = currentList.filter(i => i.id !== item.id);
      } else {
        // Add to top of list
        newList = [item, ...currentList];
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      setWatched(newList);
      window.dispatchEvent(new Event('history-update'));
    } catch (error) {
      console.error("Failed to toggle history item", error);
    }
  };

  const isWatched = (id: string) => {
    return watched.some(i => i.id === id);
  };

  return { watched, toggleWatched, isWatched };
};