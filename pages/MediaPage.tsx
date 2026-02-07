import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { FilterState, MediaItem, MediaType } from '../types';
import { fetchMediaItems } from '../services/geminiService';
import FilterBar from '../components/FilterBar';
import MediaCard from '../components/MediaCard';
import { AlertTriangle, RefreshCcw, Key, Clock, Eye, EyeOff } from 'lucide-react';
import { useMediaContext } from '../context/MediaContext';
import { useLocation } from 'react-router-dom';

interface MediaPageProps {
  category: MediaType | 'All';
}

// Helper for deterministic JSON stringify (sorts keys)
const deterministicStringify = (obj: any): string => {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return JSON.stringify(obj.map(deterministicStringify));
  }
  return '{' + Object.keys(obj).sort().map(key => {
    return JSON.stringify(key) + ':' + deterministicStringify(obj[key]);
  }).join(',') + '}';
};

const MediaPage: React.FC<MediaPageProps> = ({ category }) => {
  const { getCachedState, setCachedState, savedFilters, setSavedFilters, isImmersiveMode, toggleImmersiveMode } = useMediaContext();
  const location = useLocation();

  const defaultFilters: FilterState = {
    searchQuery: '',
    genre: [], 
    year: ['All'],
    country: [], 
    maturityRating: [], 
    minRating: 'All',
    audioType: [], 
    animeFormat: [], 
    themes: [],
    aspectRatio: [],
    contentDescriptors: [],
    streamingPlatforms: [],
    contentStyle: 'All',
    sortBy: 'trending',
  };

  const [filters, setFilters] = useState<FilterState>(() => {
      const base = savedFilters || defaultFilters;
      const params = new URLSearchParams(location.search);
      const urlOverrides: Partial<FilterState> = {};
      if (params.get('sort')) urlOverrides.sortBy = params.get('sort') as FilterState['sortBy'];
      if (params.get('q')) urlOverrides.searchQuery = params.get('q') || '';
      return { ...base, ...urlOverrides };
  });

  // ROBUST CACHE CHECK: Uses sorted stringify to match filters even if key order differs
  const cached = getCachedState(category);
  const canReuseCache = cached && deterministicStringify(cached.filters) === deterministicStringify(filters);

  const [items, setItems] = useState<MediaItem[]>(canReuseCache ? cached.items : []);
  const [loading, setLoading] = useState(!canReuseCache); 
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(canReuseCache ? cached.page : 1);
  const [hasMore, setHasMore] = useState(canReuseCache ? cached.hasMore : true);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);
  const skipInitialFetch = useRef(canReuseCache);

  useLayoutEffect(() => {
    if (canReuseCache && cached.scrollY) window.scrollTo(0, cached.scrollY);
    else window.scrollTo(0, 0);
  }, [category, canReuseCache, cached]); 

  useEffect(() => {
      isMounted.current = true;
      return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    setSavedFilters(filters);
  }, [filters, setSavedFilters]);

  useEffect(() => {
    return () => {
      setCachedState(category, { items, filters, page, hasMore, scrollY: window.scrollY });
    };
  }, [items, filters, page, hasMore, category, setCachedState]);

  useEffect(() => {
    // If we determined cache is reusable, skip this effect once
    if (skipInitialFetch.current) { 
        skipInitialFetch.current = false; 
        return; 
    }
    
    // START FETCH
    setLoading(true); setItems([]); setError(null); setPage(1); setHasMore(true);
    const timeoutId = setTimeout(() => { if (isMounted.current) loadInitialData(); }, 800);
    return () => clearTimeout(timeoutId);
  }, [filters, category]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && items.length > 0) loadMoreData(); },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [hasMore, loading, loadingMore, items, page]);

  const loadInitialData = async () => {
    if (isMounted.current) { setLoading(true); setError(null); }
    await new Promise(resolve => setTimeout(resolve, 800));
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 180000));
    try {
      const data = await Promise.race([fetchMediaItems(category, filters, 1), timeoutPromise]) as MediaItem[];
      if (isMounted.current) { setItems(data); if (data.length === 0) setHasMore(false); }
    } catch (err: any) {
      console.error(err);
      if (isMounted.current) {
        let errMsg = err.message || "Failed to fetch media.";
        try { if (errMsg.trim().startsWith('{')) { const parsed = JSON.parse(errMsg); if (parsed.error?.message) errMsg = parsed.error.message; } } catch (e) {}
        if (errMsg.includes("429") || errMsg.includes("quota")) errMsg = "System overload. Resetting neural quota. Standby.";
        setError(errMsg); setItems([]);
      }
    } finally { if (isMounted.current) setLoading(false); }
  };

  const loadMoreData = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const newItems = await fetchMediaItems(category, filters, nextPage);
      if (isMounted.current) {
        if (newItems.length === 0) setHasMore(false);
        else {
            setItems(prev => {
                const existingKeys = new Set(prev.map(p => (p.title + p.year).toLowerCase())); 
                const uniqueNewItems = newItems.filter(item => !existingKeys.has((item.title + item.year).toLowerCase()));
                if (uniqueNewItems.length === 0 && newItems.length > 0) { if (page > 5) setHasMore(false); return prev; }
                return [...prev, ...uniqueNewItems];
            });
            setPage(nextPage);
        }
      }
    } catch (err) { console.error("Error loading more items:", err); } finally { if (isMounted.current) setLoadingMore(false); }
  };

  // Dynamic Category Color Logic
  const getCategoryColor = (cat: string) => {
    if (cat === MediaType.MOVIE) return '#FF003C';
    if (cat === MediaType.ANIME) return '#00F0FF';
    return '#FCEE0A'; // Default/Shows/All
  };
  const themeColor = getCategoryColor(category);

  return (
    <div className="min-h-screen pl-0 md:pl-20 lg:pl-64 transition-all duration-300 relative">
      {/* Floating Filter Bar */}
      <div className={`fixed top-4 z-40 transition-all duration-500 ease-in-out left-4 right-4 md:left-24 md:right-8 lg:left-72 lg:right-10 ${isImmersiveMode ? '-translate-y-[200%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
          <FilterBar filters={filters} setFilters={setFilters} category={category} isLoading={loading} />
      </div>
      
      {/* Main Content */}
      <div className={`p-6 max-w-8xl mx-auto transition-all duration-500 ${isImmersiveMode ? 'pt-8' : 'pt-32 md:pt-28'}`}>
        {/* HUD Header */}
        <div className={`transition-all duration-500 ease-in-out mb-8 ${isImmersiveMode ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'}`}>
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-12 shadow-[0_0_10px_var(--glow)]" style={{ backgroundColor: themeColor, '--glow': themeColor } as React.CSSProperties}></div>
                <div>
                    <h2 className="text-3xl font-orbitron font-black uppercase tracking-widest text-shadow-neon" style={{ color: themeColor }}>
                        {category === 'All' ? 'GLOBAL_DATABASE' : `${category}S_ARCHIVE`}
                    </h2>
                    <p className="text-xs font-mono tracking-widest mt-1 opacity-80" style={{ color: themeColor }}>
                        // {filters.searchQuery ? `QUERY: "${filters.searchQuery}"` : `SORT: ${filters.sortBy.toUpperCase().replace('_', ' ')}`}
                    </p>
                </div>
            </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-[#333] h-[400px] animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent opacity-20" style={{ backgroundImage: `linear-gradient(to top, ${themeColor}10, transparent)` }}></div>
                  <div className="absolute bottom-0 w-full h-1" style={{ backgroundColor: `${themeColor}80` }}></div>
              </div>
            ))}
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center py-20 text-center border border-cp-red/50 bg-cp-red/5 p-10 max-w-2xl mx-auto relative overflow-hidden">
               <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,0,60,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]"></div>
               <AlertTriangle size={48} className="text-cp-red mb-4 animate-pulse-fast" />
               <h3 className="text-xl font-orbitron font-bold text-cp-red uppercase tracking-widest mb-2">CRITICAL_ERROR</h3>
               <p className="text-sm font-mono text-cp-red/80 mb-6">{error}</p>
               <button onClick={loadInitialData} className="px-6 py-2 bg-cp-red text-black font-bold font-orbitron uppercase hover:bg-white transition-colors clip-chamfer">
                   REBOOT_SYSTEM
               </button>
           </div>
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {items.map((item, index) => <MediaCard key={`${item.id}-${index}`} item={item} />)}
            </div>
            
            {hasMore && (
              <div ref={observerTarget} className="w-full py-12 flex flex-col items-center justify-center mt-8">
                  <div className="flex items-center gap-3 p-2 border-b-2" style={{ borderColor: themeColor }}>
                     <span className="text-xs font-orbitron font-bold animate-pulse" style={{ color: themeColor }}>LOADING_ADDITIONAL_DATA...</span>
                  </div>
              </div>
            )}
            
            {!hasMore && items.length > 10 && (
               <div className="w-full py-12 text-center text-cp-cyan/50 text-[10px] font-orbitron font-bold uppercase tracking-[0.3em] mt-8" style={{ color: `${themeColor}80` }}>
                   // END_OF_LINE
               </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-40">
            <p className="text-2xl font-orbitron font-bold text-cp-red uppercase">NO_DATA_FOUND</p>
          </div>
        )}
      </div>
      
      {/* Immersive Toggle */}
      <button 
        onClick={toggleImmersiveMode}
        className={`fixed bottom-8 right-8 z-50 p-4 border transition-all duration-300 group
           ${isImmersiveMode 
                ? 'bg-black border-current shadow-[0_0_20px_var(--glow)]' 
                : 'bg-black text-gray-500 border-gray-700 hover:text-white hover:border-current'}
        `}
        style={{ 
            clipPath: "polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)",
            color: isImmersiveMode ? themeColor : undefined,
            '--glow': `${themeColor}66`
        } as React.CSSProperties}
      >
        {isImmersiveMode ? <Eye size={20} /> : <EyeOff size={20} />}
      </button>
    </div>
  );
};

export default MediaPage;