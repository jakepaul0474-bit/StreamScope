import { useState, useEffect, useCallback } from 'react';
import { MediaItem } from '../types';

const STORAGE_KEY = 'streamscope_watchlist';

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<MediaItem[]>([]);

  const loadWatchlist = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setWatchlist(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load watchlist", error);
    }
  }, []);

  useEffect(() => {
    loadWatchlist();

    // Custom event to sync state across components
    const handleStorageChange = () => {
      loadWatchlist();
    };

    window.addEventListener('watchlist-update', handleStorageChange);
    // Also listen to storage events for cross-tab sync
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('watchlist-update', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadWatchlist]);

  const toggleWatchlist = (item: MediaItem) => {
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
      setWatchlist(newList);
      
      // Notify other components
      window.dispatchEvent(new Event('watchlist-update'));
    } catch (error) {
      console.error("Failed to toggle watchlist item", error);
    }
  };

  const isInWatchlist = (id: string) => {
    return watchlist.some(i => i.id === id);
  };

  return { watchlist, toggleWatchlist, isInWatchlist };
};