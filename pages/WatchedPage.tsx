import React from 'react';
import { useWatched } from '../hooks/useWatched';
import MediaCard from '../components/MediaCard';
import { Eye } from 'lucide-react';
import { useMediaContext } from '../context/MediaContext';

const WatchedPage: React.FC = () => {
  const { watched } = useWatched();
  const { visualStyles } = useMediaContext();

  return (
    <div className="min-h-screen pl-0 md:pl-20 lg:pl-64 transition-all duration-300">
      <div 
          className="w-full border-b border-[#333] sticky top-0 z-40 p-6"
          style={visualStyles.panel}
      >
          <div className="max-w-8xl mx-auto flex items-center gap-4">
             <div className="p-2 bg-cp-cyan/10 border border-cp-cyan/30 text-cp-cyan" style={{ clipPath: "polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%)" }}>
                <Eye size={24} />
             </div>
             <div>
                <h2 className="text-2xl font-orbitron font-black text-white uppercase tracking-widest">
                    HISTORY_LOGS
                </h2>
                <p className="text-[10px] font-mono text-cp-muted mt-1 uppercase">// WATCHED_ENTRIES: {watched.length}</p>
             </div>
          </div>
      </div>

      <div className="p-6 max-w-8xl mx-auto">
        {watched.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {watched.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-gray-600">
            <Eye size={64} className="mb-4 opacity-20" />
            <p className="text-xl font-orbitron font-bold text-gray-500 uppercase">NO_LOGS_FOUND</p>
            <p className="text-xs font-mono mt-2 text-gray-700 uppercase tracking-wider">Visual logs are empty. Begin consumption.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchedPage;