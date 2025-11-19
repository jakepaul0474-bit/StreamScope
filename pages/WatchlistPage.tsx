import React from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import MediaCard from '../components/MediaCard';
import { Bookmark } from 'lucide-react';

const WatchlistPage: React.FC = () => {
  const { watchlist } = useWatchlist();

  return (
    <div className="min-h-screen pl-0 md:pl-20 lg:pl-64 transition-all duration-300">
      {/* Header - Reusing FilterBar style somewhat but simpler */}
      <div className="w-full bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 p-4 shadow-2xl">
          <div className="max-w-8xl mx-auto">
             <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-accent/20 rounded-lg border border-accent/20 text-accent">
                    <Bookmark size={20} />
                </div>
                My Watchlist
             </h2>
          </div>
      </div>

      <div className="p-6 max-w-8xl mx-auto">
        {watchlist.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {watchlist.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-slate-500">
            <div className="bg-white/5 p-8 rounded-full mb-6 backdrop-blur-md border border-white/5">
                <Bookmark size={48} className="text-slate-600" />
            </div>
            <p className="text-2xl font-medium text-slate-300">Your watchlist is empty</p>
            <p className="text-base mt-2 opacity-70 max-w-md text-center">
                Start adding movies and shows to your watchlist by clicking the heart icon on any card.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchlistPage;