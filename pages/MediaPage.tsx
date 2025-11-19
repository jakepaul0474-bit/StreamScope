import React, { useState, useEffect, useRef } from 'react';
import { FilterState, MediaItem, MediaType } from '../types';
import { fetchMediaItems } from '../services/geminiService';
import FilterBar from '../components/FilterBar';
import MediaCard from '../components/MediaCard';
import { AlertTriangle, RefreshCcw, Key } from 'lucide-react';

interface MediaPageProps {
  category: MediaType | 'All';
}

const MediaPage: React.FC<MediaPageProps> = ({ category }) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false); // Initial load state
  const [loadingMore, setLoadingMore] = useState(false); // Infinite scroll state
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    genre: 'All',
    year: 'All',
    country: 'All',
    maturityRating: 'All',
    minRating: 'All',
    audioType: 'All',
    animeFormat: 'All', 
    sortBy: 'trending',
  });

  // Effect for Filter Changes (Reset)
  useEffect(() => {
    setLoading(true);
    // Clear state for new filter search
    setItems([]);
    setError(null);
    setPage(1);
    setHasMore(true);

    const timeoutId = setTimeout(() => {
      loadInitialData();
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
    try {
      const data = await fetchMediaItems(category, filters, 1);
      setItems(data);
      if (data.length === 0) {
          setHasMore(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch media.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreData = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const newItems = await fetchMediaItems(category, filters, nextPage);
      
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        // Filter out duplicates just in case the AI repeats an item from previous pages
        setItems(prev => {
            const existingIds = new Set(prev.map(p => p.title + p.year)); // Use Title+Year as unique key
            const uniqueNewItems = newItems.filter(item => !existingIds.has(item.title + item.year));
            
            // If AI returned only duplicates, assume we reached the end
            if (uniqueNewItems.length === 0 && newItems.length > 0) {
                setHasMore(false); 
                return prev;
            }
            return [...prev, ...uniqueNewItems];
        });
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Error loading more items:", err);
      // Don't set main error state, just stop pagination for now or show toast
      setHasMore(false); 
    } finally {
      setLoadingMore(false);
    }
  };

  const isApiKeyError = error?.includes("API Key is missing");

  return (
    <div className="min-h-screen pl-0 md:pl-20 lg:pl-64 transition-all duration-300">
      <FilterBar filters={filters} setFilters={setFilters} category={category} />
      
      <div className="p-6 max-w-8xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-white pl-2 flex items-center gap-3">
          <span className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)]"></span>
          {filters.searchQuery 
            ? `Results for "${filters.searchQuery}"` 
            : `${filters.sortBy === 'trending' ? 'Trending' : filters.sortBy.replace('_', ' ')} ${category === 'All' ? 'Media' : category}s`}
        </h2>

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
                        className="w-full py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg"
                    >
                        I've Added the Key, Try Again
                    </button>
                </div>
             ) : (
                <>
                    <div className="bg-red-500/10 p-6 rounded-full mb-4 border border-red-500/20">
                        <AlertTriangle size={48} className="text-red-500" />
                    </div>
                    <p className="text-xl font-bold text-white mb-2">Something went wrong</p>
                    <p className="text-sm opacity-80 max-w-md text-center mb-6">{error}</p>
                    <button 
                        onClick={loadInitialData}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
                    >
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
            <div ref={observerTarget} className="w-full py-8 flex justify-center items-center mt-4 min-h-[80px]">
                {loadingMore && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                )}
                {!hasMore && items.length > 20 && (
                    <p className="text-slate-500 text-sm italic">You've reached the end of the list.</p>
                )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-slate-500">
            <div className="bg-white/5 p-6 rounded-full mb-4 backdrop-blur-md border border-white/5">
                <div className="text-4xl">🔍</div>
            </div>
            <p className="text-xl font-medium text-slate-300">No results found.</p>
            <p className="text-sm mt-1 opacity-70">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPage;