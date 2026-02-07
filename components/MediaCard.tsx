import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Star, Globe, Layers, MapPin, Play, Sparkles, Eye, Zap, Skull, Heart } from 'lucide-react';
import { MediaItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '../hooks/useWatchlist';
import { useWatched } from '../hooks/useWatched';
import { useMediaContext } from '../context/MediaContext';

interface MediaCardProps {
  item: MediaItem;
}

const MediaCard: React.FC<MediaCardProps> = ({ item }) => {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { isWatched, toggleWatched } = useWatched();
  const { visualStyles } = useMediaContext();
  
  const inWatchlist = isInWatchlist(item.id);
  const watched = isWatched(item.id);

  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [imgSrc, setImgSrc] = useState<string>('');
  
  // -- ADAPTIVE COLOR LOGIC --
  // Determines the "Element" color based on the primary genre
  const themeColor = useMemo(() => {
    const genres = (item.genres || []).map(g => g.toLowerCase());
    
    // RED: Intense, Danger, Action
    if (genres.some(g => ['action', 'horror', 'war', 'crime'].includes(g))) return '#FF003C';
    
    // CYAN: Tech, Future, Magic
    if (genres.some(g => ['sci-fi', 'science fiction', 'fantasy', 'animation', 'anime', 'adventure'].includes(g))) return '#00F0FF';
    
    // YELLOW: Energy, Light, Human
    if (genres.some(g => ['comedy', 'drama', 'romance', 'family', 'music'].includes(g))) return '#FCEE0A';
    
    // PURPLE: Mystery, Dark, Unknown
    if (genres.some(g => ['mystery', 'thriller', 'mystery'].includes(g))) return '#b026ff';
    
    // Default fallback
    return '#00F0FF';
  }, [item.genres]);

  // Fallback Logic
  const fallbackToBing = useCallback(() => {
    const query = `${item.title} ${item.year || ''} ${item.type || ''} official poster`.trim();
    setImgSrc(`https://tse2.mm.bing.net/th?q=${encodeURIComponent(query)}&w=400&h=600&c=7&rs=1&p=0`);
  }, [item]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); } }, { rootMargin: '100px' });
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    if (item.posterUrl) { 
        setImgSrc(`https://wsrv.nl/?url=${encodeURIComponent(item.posterUrl)}&w=400&output=webp&q=75`); 
    } else { 
        fallbackToBing(); 
    }
  }, [item, fallbackToBing, isVisible]);

  const handleCardClick = () => navigate(`/details/${item.type}/${encodeURIComponent(item.title)}`);
  
  const handleWatchlistClick = (e: React.MouseEvent) => { 
      e.stopPropagation(); 
      toggleWatchlist(item); 
  };

  const handleWatchedClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleWatched(item);
  };

  const rating = Number(item.imdbRating || 0).toFixed(1);

  return (
    <div 
        ref={cardRef} 
        onClick={handleCardClick} 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative w-full h-full cursor-pointer select-none"
    >
        {/* DECORATIVE: Hover Glow Container */}
        <div 
            className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"
            style={{ backgroundColor: themeColor, opacity: isHovered ? 0.3 : 0 }}
        ></div>

        {/* Card Container - Dynamic Theme Color */}
        <div 
            className={`
                relative h-full flex flex-col border bg-black/80 transition-all duration-300
                ${watched ? 'grayscale-[0.8] opacity-75' : ''}
            `}
            style={{ 
                ...visualStyles.panel,
                // Adaptive Border Color
                borderColor: isHovered ? themeColor : (watched ? '#333' : 'rgba(255,255,255,0.1)'),
                // Adaptive Glow
                boxShadow: isHovered 
                    ? `0 0 15px ${themeColor}40, 0 0 30px ${themeColor}10` 
                    : 'none',
                // Custom Clip for Tech Look
                clipPath: "polygon(0 0, 100% 0, 100% 90%, 90% 100%, 0 100%)"
            } as React.CSSProperties}
        >
            {/* ARTIFACT: Corner Brackets (HUD Look) */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,0 L10,0 M0,0 L0,10" fill="none" stroke={themeColor} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path d="M100,0 L90,0 M100,0 L100,10" fill="none" stroke={themeColor} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path d="M0,100 L10,100 M0,100 L0,90" fill="none" stroke={themeColor} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                {/* Bottom Right is clipped, so we adjust bracket */}
                <path d="M90,100 L80,100 M90,100 L90,95" fill="none" stroke={themeColor} strokeWidth="2" vectorEffect="non-scaling-stroke" transform="translate(-1, -1)" />
            </svg>

            {/* ARTIFACT: Tech Lines Overlay on Image */}
            <div className="absolute top-4 left-0 w-full h-[1px] bg-white/10 z-20 pointer-events-none group-hover:bg-white/30"></div>
            <div className="absolute top-4 right-2 text-[6px] font-orbitron text-white/50 z-20 pointer-events-none group-hover:text-white">SYS_ID: {item.id.substring(0,6)}</div>

            {/* Image Section */}
            <div className="aspect-[2/3] relative overflow-hidden bg-[#050505]">
                {isVisible ? (
                   <>
                     <img 
                        src={imgSrc} 
                        alt={item.title} 
                        className={`w-full h-full object-cover transition-transform duration-500 ${isHovered && !watched ? 'scale-105' : ''}`} 
                        onError={() => fallbackToBing()} 
                     />
                     {/* Watched Overlay */}
                     {watched && (
                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px] z-10">
                             <div className="border-2 border-cp-cyan text-cp-cyan px-3 py-1 font-orbitron font-black text-xl -rotate-12 opacity-90 uppercase tracking-widest flex items-center gap-2">
                                 <Eye size={20} /> VIEWED
                             </div>
                         </div>
                     )}
                     {/* Gradient Overlay for Text Readability */}
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                   </>
                ) : <div className="w-full h-full flex items-center justify-center"><Sparkles className="animate-pulse text-gray-800" /></div>}
                
                {/* Badge: Type */}
                <div 
                    className="absolute top-0 left-0 bg-black/80 backdrop-blur-md px-2 py-1 border-r border-b border-white/20 z-10"
                    style={{ borderRightColor: themeColor }}
                >
                     <span className="text-[9px] font-orbitron font-bold tracking-wider uppercase" style={{ color: themeColor }}>
                        {item.subType || item.type}
                     </span>
                </div>

                {/* Badge: Rating */}
                <div className="absolute top-0 right-0 bg-[#FCEE0A] text-black px-2 py-1 font-bold font-orbitron text-[10px] z-10 clip-tag-left">
                    {rating}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-3 flex flex-col flex-grow justify-between bg-transparent relative z-10">
                
                <div className="mb-2">
                    <h3 
                        className="font-bold font-orbitron truncate text-xs tracking-wide transition-colors group-hover:text-white"
                        style={{ 
                            color: isHovered ? themeColor : (watched ? '#6b7280' : '#e0e0e0'),
                            textShadow: isHovered ? `0 0 10px ${themeColor}` : 'none'
                        }}
                    >
                        {item.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-cp-cyan font-mono">{item.year}</span>
                        {item.maturityRating && (
                            <span className="text-[9px] text-cp-red border border-cp-red/50 px-1 rounded-sm group-hover:border-cp-red transition-colors">
                                {item.maturityRating}
                            </span>
                        )}
                        {/* Genre Tag */}
                        {item.genres?.[0] && (
                             <span className="text-[9px] font-mono uppercase text-cp-yellow/80 truncate max-w-[80px]">
                                 // {item.genres[0]}
                             </span>
                        )}
                    </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5 group-hover:border-white/20">
                    <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-400 group-hover:text-cp-cyan transition-colors">
                        <Globe size={10} /> {item.country ? item.country.split(',')[0] : 'N/A'}
                    </span>
                    
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={handleWatchedClick} 
                            className={`p-1.5 hover:bg-white/10 rounded-sm transition-all ${watched ? 'text-cp-cyan' : 'text-gray-600 hover:text-white'}`} 
                            title="Mark as Watched"
                        >
                             <Eye size={14} />
                        </button>

                        <button 
                            onClick={handleWatchlistClick} 
                            className={`p-1.5 hover:bg-white/10 rounded-sm transition-all ${inWatchlist ? 'text-cp-red' : 'text-gray-600 hover:text-white'}`} 
                            title="Add to Watchlist"
                        >
                             <Heart size={14} fill={inWatchlist ? "currentColor" : "none"} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default MediaCard;