import React, { useState, useEffect, useRef } from 'react';
import { FilterState, MediaItem, MediaType } from '../types';
import { fetchMediaItems } from '../services/geminiService';
import FilterBar from '../components/FilterBar';
import MediaCard from '../components/MediaCard';
import { AlertTriangle, RefreshCcw, Key, Clock } from 'lucide-react';

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
  const isMounted = useRef(true);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    genre: [], // Changed to array
    year: 'All',
    country: [], // Changed to array
    maturityRating: [], // Changed to array
    minRating: 'All',
    audioType: [], // Changed to array
    animeFormat: [], // Changed to array
    sortBy: 'trending',
  });

  useEffect(() => {
      isMounted.current = true;
      return () => { isMounted.current = false; };
  }, []);

  // Effect for Filter Changes (Reset)
  useEffect(() => {
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
        setLoading(true); // Explicitly set loading to show skeletons immediately on retry
        setError(null);
    }

    // Safety timeout - Increased to 60s to allow for global "In Theaters" check with search
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out")), 60000)
    );

    try {
      // Race between the fetch and the timeout
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
        // Clean up error message if it's a JSON string (common with 429/Google errors)
        let errMsg = err.message || "Failed to fetch media.";
        try {
            // Check if error is a JSON string
            if (errMsg.trim().startsWith('{')) {
                const parsed = JSON.parse(errMsg);
                if (parsed.error && parsed.error.message) {
                    errMsg = parsed.error.message;
                }
            }
        } catch (e) {
            // Use original message if parsing fails
        }

        // User-friendly 429 message
        if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
            errMsg = "Usage limit exceeded. The app is pausing for 30s to reset quota. Please wait and click Try Again.";
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
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg active:scale-95 transform duration-150"
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