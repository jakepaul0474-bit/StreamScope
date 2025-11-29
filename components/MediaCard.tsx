import React, { useState, useEffect } from 'react';
import { Star, Mic, ImageOff, Calendar, Heart, Shield, Award } from 'lucide-react';
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
    `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=400&output=webp&q=75`;

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
  
  const getPlatformLogo = (platform: string) => {
    const map: Record<string, string> = {
        'Netflix': 'netflix.com',
        'Prime Video': 'primevideo.com',
        'Amazon Prime': 'primevideo.com',
        'Disney+': 'disneyplus.com',
        'Hulu': 'hulu.com',
        'Max': 'max.com',
        'HBO Max': 'max.com',
        'Apple TV+': 'tv.apple.com',
        'Peacock': 'peacocktv.com',
        'Paramount+': 'paramountplus.com',
        'YouTube Premium': 'youtube.com',
        'Crunchyroll': 'crunchyroll.com',
        'Zee5': 'zee5.com',
        'Hotstar': 'hotstar.com',
        'Disney+ Hotstar': 'hotstar.com',
        'JioCinema': 'jiocinema.com',
        'SonyLIV': 'sonyliv.com',
        'Bilibili': 'bilibili.tv',
        'Voot': 'voot.com',
        'Discovery+': 'discoveryplus.com',
    };
    const domain = map[platform];
    if (domain) return `https://logo.clearbit.com/${domain}?size=24`;
    return null;
  };

  const genres = Array.isArray(item.genres) ? item.genres : [];
  const platforms = Array.isArray(item.platforms) ? item.platforms : [];
  const techSpecs = Array.isArray(item.techSpecs) ? item.techSpecs : [];

  return (
    <div 
        onClick={handleCardClick}
        className="group relative bg-slate-900/10 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:bg-slate-800/30 hover:border-white/10 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] transition-all duration-500 transform hover:-translate-y-2 h-full flex flex-col ring-1 ring-white/5"
    >
    {/* Poster Image */}
    <div className="aspect-[2/3] relative overflow-hidden bg-slate-800/10">
        {!hasError ? (
            <img
            src={imgSrc}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={handleError}
            />
        ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-500 bg-slate-900/10">
                <div className="bg-white/5 p-4 rounded-full mb-3 backdrop-blur-sm">
                <ImageOff size={32} className="opacity-50" />
                </div>
                <span className="text-xs text-center font-medium px-2 text-slate-400">{item.title}</span>
            </div>
        )}
        
        {/* Glass Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-10">
            <button className="w-full bg-primary/60 backdrop-blur-md border border-primary/20 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform scale-95 group-hover:scale-100 transition-all hover:bg-primary/80 hover:border-primary/40">
                View Details
            </button>
        </div>

        {/* Watchlist Toggle - Top Left */}
        <button 
            onClick={handleWatchlistClick}
            className={`
                absolute top-2 left-2 z-20 p-2 rounded-full backdrop-blur-md border shadow-lg transition-all duration-300
                ${inWatchlist 
                    ? 'bg-accent/60 border-accent/50 text-white' 
                    : 'bg-black/10 border-white/5 text-slate-300 hover:text-white hover:bg-black/40'}
            `}
            title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
        >
            <Heart size={16} fill={inWatchlist ? "currentColor" : "none"} />
        </button>

        {/* Top Right Badges: Certificate, Language, Quality */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end z-20">
            {/* Maturity/Certificate */}
            {item.maturityRating && (
                <span className="bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                     {item.maturityRating}
                </span>
            )}
            
            {/* Audio/Language */}
            {item.audioType && (
                <span className="bg-blue-600/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-lg border border-blue-400/20">
                    <Mic size={10} /> {item.audioType}
                </span>
            )}
            
            {/* Tech Specs / Quality */}
            {techSpecs.length > 0 && (
                <span className="bg-purple-600/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-lg border border-purple-400/20">
                    <Award size={10} /> {techSpecs[0]}
                </span>
            )}
        </div>
    </div>

    {/* Content Info */}
    <div className="p-4 flex flex-col flex-grow relative">
        {/* Subtle top shine */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

        <div className="flex justify-between items-start mb-1">
        <h3 className="text-white/90 font-semibold truncate w-full text-sm md:text-base leading-tight" title={item.title}>{item.title}</h3>
        </div>
        
        <div className="flex items-center justify-between text-sm text-slate-400 mt-1">
        <div className="flex items-center gap-1">
            <Calendar size={12} className="text-slate-500" />
            <span className="text-xs opacity-80">{formatDate(item.releaseDate)}</span>
        </div>
        <div className="flex items-center gap-1 text-yellow-400 bg-yellow-400/5 px-1.5 py-0.5 rounded-md border border-yellow-400/10">
            <Star size={10} fill="currentColor" />
            <span className="font-bold text-xs">{item.imdbRating.toFixed(1)}</span>
        </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
            {genres.slice(0, 2).map(g => (
                <span key={g} className="text-[10px] px-2 py-0.5 bg-white/5 text-slate-300 rounded-md border border-white/5 hover:bg-white/10 transition-colors">
                    {g}
                </span>
            ))}
        </div>

        {/* Platform Logos Footer */}
        {platforms.length > 0 && (
            <div className="mt-auto pt-3 flex items-center gap-2 border-t border-white/5">
                {platforms.slice(0, 4).map(p => {
                    const logo = getPlatformLogo(p);
                    return logo ? (
                        <img key={p} src={logo} alt={p} title={p} className="w-5 h-5 rounded-full object-cover ring-1 ring-white/5 bg-white/10" />
                    ) : (
                        <span key={p} className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded border border-white/5 text-slate-400">{p.slice(0,1)}</span>
                    );
                })}
            </div>
        )}
    </div>
    </div>
  );
};

export default MediaCard;