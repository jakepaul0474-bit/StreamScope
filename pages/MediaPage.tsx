import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { FilterState, MediaItem, MediaType } from '../types';
import { fetchMediaItems } from '../services/geminiService';
import FilterBar from '../components/FilterBar';
import MediaCard from '../components/MediaCard';
import { AlertTriangle, RefreshCcw, Key, Clock, Eye, EyeOff } from 'lucide-react';
import { useMediaContext } from '../context/MediaContext';

interface MediaPageProps {
  category: MediaType | 'All';
}

const MediaPage: React.FC<MediaPageProps> = ({ category }) => {
  const { getCachedState, setCachedState, getGlobalFilters, setGlobalFilters, isImmersiveMode, toggleImmersiveMode } = useMediaContext();
  
  // 1. Determine Initial Filters
  const globalFilters = getGlobalFilters();
  
  const defaultFilters: FilterState = {
    searchQuery: '',
    genre: [], 
    year: 'All',
    country: [], 
    maturityRating: [], 
    minRating: 'All',
    audioType: [], 
    animeFormat: [], 
    themes: [],
    aspectRatio: [],
    contentDescriptors: [],
    contentStyle: 'All', // Default to show everything
    sortBy: 'trending',
  };

  const [filters, setFilters] = useState<FilterState>(globalFilters || defaultFilters);

  // 2. Determine Cached Data Validity
  const cached = getCachedState(category);
  const canReuseCache = cached && JSON.stringify(cached.filters) === JSON.stringify(filters);

  // Initialize state based on cache validity
  const [items, setItems] = useState<MediaItem[]>(canReuseCache ? cached.items : []);
  const [loading, setLoading] = useState(!canReuseCache); 
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(canReuseCache ? cached.page : 1);
  const [hasMore, setHasMore] = useState(canReuseCache ? cached.hasMore : true);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);
  
  const skipInitialFetch = useRef(canReuseCache);

  // Restore Scroll Position synchronously before paint
  useLayoutEffect(() => {
    if (canReuseCache && cached.scrollY) {
      window.scrollTo(0, cached.scrollY);
    } else {
      window.scrollTo(0, 0);
    }
  }, [category, canReuseCache, cached]); 

  useEffect(() => {
      isMounted.current = true;
      return () => { isMounted.current = false; };
  }, []);

  // Update Global Filters whenever local filters change
  useEffect(() => {
    setGlobalFilters(filters);
  }, [filters, setGlobalFilters]);

  // Save state on unmount
  useEffect(() => {
    return () => {
      setCachedState(category, {
        items,
        filters,
        page,
        hasMore,
        scrollY: window.scrollY
      });
    };
  }, [items, filters, page, hasMore, category, setCachedState]);

  // Effect for Filter Changes (Reset & Refetch)
  useEffect(() => {
    if (skipInitialFetch.current) {
        skipInitialFetch.current = false;
        return;
    }

    setLoading(true);
    setItems([]);
    setError(null);
    setPage(1);
    setHasMore(true);

    const timeoutId = setTimeout(() => {
      if (isMounted.current) loadInitialData();
    }, 800);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, category]);

  // Effect for Infinite Scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && items.length > 0) {
          loadMoreData();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, loadingMore, items, page]);

  const loadInitialData = async () => {
    if (isMounted.current) {
        setLoading(true);
        setError(null);
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out")), 120000)
    );

    try {
      const data = await Promise.race([
          fetchMediaItems(category, filters, 1),
          timeoutPromise
      ]) as MediaItem[];

      if (isMounted.current) {
        setItems(data);
        if (data.length === 0) {
            setHasMore(false);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (isMounted.current) {
        let errMsg = err.message || "Failed to fetch media.";
        try {
            if (errMsg.trim().startsWith('{')) {
                const parsed = JSON.parse(errMsg);
                if (parsed.error && parsed.error.message) {
                    errMsg = parsed.error.message;
                }
            }
        } catch (e) {}

        if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
            errMsg = "Usage limit exceeded. The app is pausing to reset quota. Please wait ~60 seconds and click Try Again.";
        }

        setError(errMsg);
        setItems([]);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const loadMoreData = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const newItems = await fetchMediaItems(category, filters, nextPage);
      
      if (isMounted.current) {
        if (newItems.length === 0) {
            setHasMore(false);
        } else {
            setItems(prev => {
                const existingKeys = new Set(prev.map(p => (p.title + p.year).toLowerCase())); 
                const uniqueNewItems = newItems.filter(item => !existingKeys.has((item.title + item.year).toLowerCase()));
                
                if (uniqueNewItems.length === 0 && newItems.length > 0) {
                    if (page > 5) setHasMore(false); 
                    return prev;
                }
                return [...prev, ...uniqueNewItems];
            });
            setPage(nextPage);
        }
      }
    } catch (err) {
      console.error("Error loading more items:", err);
    } finally {
      if (isMounted.current) {
        setLoadingMore(false);
      }
    }
  };

  const isApiKeyError = error?.includes("API Key is missing") || error?.includes("configuration");
  const isTimeoutError = error?.includes("timed out");
  const isRateLimitError = error?.includes("Usage limit") || error?.includes("429") || error?.includes("RESOURCE_EXHAUSTED");

  return (
    <div className="min-h-screen pl-0 md:pl-20 lg:pl-64 transition-all duration-300 relative">
      
      {/* Immersive Mode Toggle (Floating Action Button) */}
      <button 
        onClick={toggleImmersiveMode}
        className={`
           fixed bottom-6 right-6 z-50 p-3.5 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 group/immersive
           ${isImmersiveMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-primary text-white hover:bg-blue-600 border-primary/50'}
        `}
        title={isImmersiveMode ? "Show Interface" : "Immersive Mode (Hide UI)"}
      >
        {/* Halo Glow for Immersive Button */}
        <div className="absolute -inset-2 bg-primary/40 rounded-full blur-xl opacity-40 group-hover/immersive:opacity-100 transition-opacity duration-300 z-[-1]"></div>

        {isImmersiveMode ? <Eye size={22} /> : <EyeOff size={22} />}
        
        {/* Tooltip */}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover/immersive:opacity-100 transition-opacity pointer-events-none border border-white/10">
            {isImmersiveMode ? "Show UI" : "Hide UI"}
        </span>
      </button>

      {/* Filter Bar Container - Slides out in Immersive Mode */}
      <div className={`
        z-40 transition-all duration-500 ease-in-out
        ${isImmersiveMode ? '-translate-y-full opacity-0 pointer-events-none fixed top-0 w-full' : 'sticky top-0 translate-y-0 opacity-100'}
      `}>
          <FilterBar filters={filters} setFilters={setFilters} category={category} isLoading={loading} />
      </div>
      
      <div className={`p-6 max-w-8xl mx-auto transition-all duration-500 ${isImmersiveMode ? 'pt-8' : ''}`}>
        {/* Page Title - Fades out in Immersive Mode */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isImmersiveMode ? 'max-h-0 opacity-0 mb-0' : 'max-h-20 opacity-100 mb-6'}`}>
            <h2 className="text-2xl font-bold text-white pl-2 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)]"></span>
            {filters.searchQuery 
                ? `Results for "${filters.searchQuery}"` 
                : `${filters.sortBy === 'trending' ? 'Trending' : filters.sortBy.replace('_', ' ')} ${category === 'All' ? 'Media' : category}s`}
            </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/5 h-96 rounded-2xl animate-pulse shadow-lg"></div>
            ))}
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center py-20 text-slate-400 px-4">
             {isApiKeyError ? (
                <div className="max-w-lg w-full bg-slate-900/80 backdrop-blur-xl border border-red-500/30 p-8 rounded-2xl shadow-2xl text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <Key size={32} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Configuration Required</h3>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                        The API Key is missing. To use StreamScope, you need to add your Gemini API Key to your environment variables.
                    </p>
                    <div className="text-left bg-black/40 p-4 rounded-lg border border-white/10 mb-6">
                        <p className="text-xs text-slate-400 mb-2 uppercase font-bold tracking-wider">If using Vercel:</p>
                        <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1">
                            <li>Go to Project Settings &gt; Environment Variables</li>
                            <li>Key: <code className="bg-white/10 px-1 py-0.5 rounded text-primary">API_KEY</code></li>
                            <li>Value: Your Gemini API Key</li>
                            <li>Redeploy the project</li>
                        </ol>
                    </div>
                    <button 
                        onClick={loadInitialData}
                        className="w-full py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 relative group/retry"
                    >
                         {/* Halo Glow */}
                        <div className="absolute -inset-1 bg-primary/40 rounded-xl blur-lg opacity-40 group-hover/retry:opacity-100 transition-opacity duration-300 z-[-1]"></div>
                        I've Added the Key, Try Again
                    </button>
                </div>
             ) : (
                <>
                    <div className="bg-red-500/10 p-6 rounded-full mb-4 border border-red-500/20">
                        {isRateLimitError ? <Clock size={48} className="text-yellow-500" /> : <AlertTriangle size={48} className="text-red-500" />}
                    </div>
                    <p className="text-xl font-bold text-white mb-2">
                        {isTimeoutError ? "Connection Timed Out" : isRateLimitError ? "Quota Exceeded" : "Something went wrong"}
                    </p>
                    <p className="text-sm opacity-80 max-w-md text-center mb-6 text-slate-300">
                        {isTimeoutError 
                            ? "The server is taking too long to respond. Complex real-time queries like 'In Theaters' perform live Google Searches and may take up to 60 seconds." 
                            : error}
                    </p>
                    <button 
                        onClick={loadInitialData}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg active:scale-95 transform duration-150 relative group/retry"
                    >
                        {/* Halo Glow */}
                        <div className="absolute -inset-1 bg-primary/40 rounded-lg blur-lg opacity-40 group-hover/retry:opacity-100 transition-opacity duration-300 z-[-1]"></div>
                        <RefreshCcw size={18} /> Try Again
                    </button>
                </>
             )}
           </div>
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {items.map((item, index) => (
                <MediaCard key={`${item.id}-${index}`} item={item} />
                ))}
            </div>
            
            {/* Infinite Scroll Loader */}
            {hasMore && (
              <div ref={observerTarget} className="w-full py-12 flex flex-col items-center justify-center mt-4 min-h-[100px]">
                  <div className="flex items-center gap-2">
                     <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                     <span className="text-slate-400 text-sm font-medium animate-pulse">Discovering more titles...</span>
                  </div>
              </div>
            )}
            
            {!hasMore && items.length > 10 && (
               <div className="w-full py-12 text-center text-slate-500 text-sm border-t border-white/5 mt-8">
                   You've reached the end of the list.
               </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-slate-500">
            <p className="text-xl font-medium text-slate-400">No results found.</p>
            <p className="text-base mt-2 opacity-70">Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPage;