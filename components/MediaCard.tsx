import React, { useState, useEffect } from 'react';
import { Star, Mic, ImageOff, Calendar, Heart } from 'lucide-react';
import { MediaItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '../hooks/useWatchlist';

interface MediaCardProps {
  item: MediaItem;
}

const MediaCard: React.FC<MediaCardProps> = ({ item }) => {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const inWatchlist = isInWatchlist(item.id);
  
  const getBingUrl = (query: string) => 
    `https://tse2.mm.bing.net/th?q=${encodeURIComponent(query + " poster")}&w=400&h=600&c=7&rs=1&p=0`;

  const getProxiedUrl = (url: string) => 
    `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=400&output=webp`;

  const [imgSrc, setImgSrc] = useState<string>(
    item.posterUrl ? getProxiedUrl(item.posterUrl) : getBingUrl(`${item.title} ${item.year} ${item.type}`)
  );
  
  const [hasError, setHasError] = useState(false);
  const [isBingFallback, setIsBingFallback] = useState(!item.posterUrl);

  useEffect(() => {
    setHasError(false);
    setIsBingFallback(!item.posterUrl);
    setImgSrc(item.posterUrl ? getProxiedUrl(item.posterUrl) : getBingUrl(`${item.title} ${item.year} ${item.type}`));
  }, [item]);

  const handleError = () => {
    if (!isBingFallback) {
      setIsBingFallback(true);
      setImgSrc(getBingUrl(`${item.title} ${item.year} ${item.type}`));
    } else {
      setHasError(true);
    }
  };

  const handleCardClick = () => {
      navigate(`/details/${item.type}/${encodeURIComponent(item.title)}`);
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist(item);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return item.year;
    try {
        return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return item.year;
    }
  };

  return (
    <div 
        onClick={handleCardClick}
        className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] transition-all duration-500 transform hover:-translate-y-2 h-full flex flex-col"
    >
      {/* Poster Image */}
      <div className="aspect-[2/3] relative overflow-hidden bg-slate-800/50">
        {!hasError ? (
            <img
              src={imgSrc}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={handleError}
            />
        ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-500 bg-slate-900/50">
                <div className="bg-white/5 p-4 rounded-full mb-3 backdrop-blur-sm">
                   <ImageOff size={32} className="opacity-50" />
                </div>
                <span className="text-xs text-center font-medium px-2 text-slate-400">{item.title}</span>
            </div>
        )}
        
        {/* Glass Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
           <button className="bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold py-2 px-4 rounded-full shadow-lg transform scale-95 group-hover:scale-100 transition-all hover:bg-primary hover:border-primary">
             View Details
           </button>
        </div>

        {/* Watchlist Toggle - Top Left */}
        <button 
            onClick={handleWatchlistClick}
            className={`
                absolute top-2 left-2 z-20 p-2 rounded-full backdrop-blur-md border shadow-lg transition-all duration-300
                ${inWatchlist 
                    ? 'bg-accent/80 border-accent text-white' 
                    : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:bg-black/60'}
            `}
        >
            <Heart size={16} fill={inWatchlist ? "currentColor" : "none"} />
        </button>

        {/* Top Right Badges - Glass style */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            <span className="bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                {item.maturityRating}
            </span>
            {item.audioType && (
                 <span className="bg-accent/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-lg">
                    <Mic size={8} /> {item.audioType}
                 </span>
            )}
            {item.subType === 'Movie' && (
                <span className="bg-blue-500/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-lg">
                    Movie
                </span>
            )}
        </div>
      </div>

      {/* Content Info */}
      <div className="p-4 flex flex-col flex-grow relative">
        {/* Subtle top shine */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        <div className="flex justify-between items-start mb-1">
          <h3 className="text-white font-semibold truncate w-full text-sm md:text-base leading-tight" title={item.title}>{item.title}</h3>
        </div>
        
        <div className="flex items-center justify-between text-sm text-slate-400 mt-auto pt-3">
          <div className="flex items-center gap-1">
             <Calendar size={12} className="text-slate-500" />
             <span className="text-xs opacity-80">{formatDate(item.releaseDate)}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-md border border-yellow-400/20">
            <Star size={10} fill="currentColor" />
            <span className="font-bold text-xs">{item.imdbRating.toFixed(1)}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
            {(item.genres || []).slice(0, 2).map(g => (
                <span key={g} className="text-[10px] px-2 py-0.5 bg-white/5 text-slate-300 rounded-md border border-white/5">
                    {g}
                </span>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MediaCard;