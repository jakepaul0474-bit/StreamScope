import React, { useState, useEffect } from 'react';
import { FilterState, MediaItem, MediaType } from '../types';
import { fetchMediaItems } from '../services/geminiService';
import FilterBar from '../components/FilterBar';
import MediaCard from '../components/MediaCard';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface MediaPageProps {
  category: MediaType | 'All';
}

const MediaPage: React.FC<MediaPageProps> = ({ category }) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    genre: 'All',
    year: 'All',
    country: 'All',
    maturityRating: 'All',
    audioType: 'All',
    animeFormat: 'All', 
    sortBy: 'trending',
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadMedia();
    }, 800);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, category]);

  const loadMedia = async () => {
    setLoading(true);
    setError(null);
    try {
        const data = await fetchMediaItems(category, filters);
        setItems(data);
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to fetch media. Please check your internet connection or API Key.");
        setItems([]);
    }
    setLoading(false);
  };

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
           <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <div className="bg-red-500/10 p-6 rounded-full mb-4 border border-red-500/20">
                 <AlertTriangle size={48} className="text-red-500" />
             </div>
             <p className="text-xl font-bold text-white mb-2">Something went wrong</p>
             <p className="text-sm opacity-80 max-w-md text-center mb-6">{error}</p>
             <button 
                onClick={loadMedia}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
             >
                <RefreshCcw size={18} /> Try Again
             </button>
           </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {items.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
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