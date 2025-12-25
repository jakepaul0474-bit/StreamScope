import React, { useState, useEffect, useCallback } from 'react';
import { Star, Mic, ImageOff, Calendar, Heart, Award, Sparkles } from 'lucide-react';
import { MediaItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '../hooks/useWatchlist';
import { generateMediaPoster } from '../services/geminiService';
import { useMediaContext } from '../context/MediaContext';

// Helper component for Platform Logos with Error Handling
const PlatformIcon: React.FC<{ platform: string }> = ({ platform }) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [error, setError] = useState(false);

  const getPlatformDomain = (platformName: string) => {
    const lower = platformName.toLowerCase().trim();
    
    if (lower.includes('netflix')) return 'netflix.com';
    if (lower.includes('prime') || lower.includes('amazon')) return 'primevideo.com';
    if (lower.includes('disney')) return 'disneyplus.com';
    if (lower.includes('hulu')) return 'hulu.com';
    if (lower.includes('hbo') || lower.includes('max')) return 'max.com';
    if (lower.includes('apple') && lower.includes('tv')) return 'tv.apple.com';
    if (lower.includes('peacock')) return 'peacocktv.com';
    if (lower.includes('paramount')) return 'paramountplus.com';
    if (lower.includes('youtube')) return 'youtube.com';
    if (lower.includes('crunchyroll')) return 'crunchyroll.com';
    if (lower.includes('zee5')) return 'zee5.com';
    if (lower.includes('hotstar')) return 'hotstar.com';
    if (lower.includes('jio')) return 'jiocinema.com';
    if (lower.includes('sony')) return 'sonyliv.com';
    if (lower.includes('bilibili')) return 'bilibili.tv';
    if (lower.includes('voot')) return 'voot.com';
    if (lower.includes('discovery')) return 'discoveryplus.com';
    if (lower.includes('tubi')) return 'tubitv.com';
    if (lower.includes('pluto')) return 'pluto.tv';
    if (lower.includes('vudu')) return 'vudu.com';
    if (lower.includes('google')) return 'play.google.com';
    if (lower.includes('mubi')) return 'mubi.com';
    if (lower.includes('starz')) return 'starz.com';
    if (lower.includes('showtime')) return 'showtime.com';
    if (lower.includes('britbox')) return 'britbox.com';
    if (lower.includes('acorn')) return 'acorn.tv';
    if (lower.includes('funimation')) return 'funimation.com';
    if (lower.includes('hidive')) return 'hidive.com';
    if (lower.includes('viki')) return 'viki.com';
    if (lower.includes('iqiyi')) return 'iq.com';
    if (lower.includes('lionsgate')) return 'lionsgateplay.com';
    if (lower.includes('sun nxt')) return 'sunnxt.com';
    if (lower.includes('aha')) return 'aha.video';
    if (lower.includes('eros')) return 'erosnow.com';
    if (lower.includes('alt')) return 'altbalaji.com';
    if (lower.includes('mx')) return 'mxplayer.in';

    return null;
  };

  const domain = getPlatformDomain(platform);
  
  useEffect(() => {
    if (domain) {
      setImgSrc(`https://logo.clearbit.com/${domain}`);
      setError(false);
    } else {
      setError(true);
    }
  }, [domain, platform]);

  const handleError = () => {
    if (imgSrc.includes('clearbit')) {
      setImgSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
    } else {
      setError(true);
    }
  };

  if (!domain || error) {
      return (
         <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded border border-white/10 text-slate-400 select-none cursor-help font-medium min-w-[20px] text-center" title={platform}>
            {platform.slice(0, 1).toUpperCase()}
         </span>
      );
  }

  return (
    <img 
        src={imgSrc}
        alt={platform} 
        title={platform} 
        className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10 bg-white/10 shadow-sm"
        onError={handleError}
        referrerPolicy="no-referrer"
        loading="lazy"
    />
  );
};

interface MediaCardProps {
  item: MediaItem;
}

const MediaCard: React.FC<MediaCardProps> = ({ item }) => {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { enableAIImages } = useMediaContext();
  const inWatchlist = isInWatchlist(item.id);

  const getBingUrl = useCallback((query: string) => 
    `https://tse2.mm.bing.net/th?q=${encodeURIComponent(query + " poster")}&w=400&h=600&c=7&rs=1&p=0`, []);

  const getProxiedUrl = useCallback((url: string) => 
    `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=400&output=webp&q=75`, []);

  const [imgSrc, setImgSrc] = useState<string>('');
  const [imageState, setImageState] = useState<'primary' | 'generating' | 'ai' | 'bing' | 'error'>('primary');

  const triggerAiGeneration = async () => {
    setImageState('generating');
    try {
        const aiPoster = await generateMediaPoster(item.title, item.type, item.year);
        if (aiPoster) {
            setImgSrc(aiPoster);
            setImageState('ai');
        } else {
            fallbackToBing();
        }
    } catch (e) {
        fallbackToBing();
    }
  };

  const fallbackToBing = useCallback(() => {
    setImgSrc(getBingUrl(`${item.title} ${item.year} ${item.type}`));
    setImageState('bing');
  }, [item, getBingUrl]);

  useEffect(() => {
    if (item.posterUrl) {
      setImgSrc(getProxiedUrl(item.posterUrl));
      setImageState('primary');
    } else {
      if (enableAIImages) {
        triggerAiGeneration();
      } else {
        fallbackToBing();
      }
    }
  }, [item, getProxiedUrl, enableAIImages, fallbackToBing]);

  const handleImageError = () => {
    if (imageState === 'primary') {
      if (enableAIImages) {
          triggerAiGeneration();
      } else {
          fallbackToBing();
      }
    } else if (imageState === 'ai') {
      fallbackToBing();
    } else if (imageState === 'bing') {
      setImageState('error');
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

  const genres = Array.isArray(item.genres) ? item.genres : [];
  const platforms = Array.isArray(item.platforms) ? item.platforms : [];
  const techSpecs = Array.isArray(item.techSpecs) ? item.techSpecs : [];

  const isDubbed = item.audioType && (item.audioType.includes('Dub') || item.audioType.includes('Multi'));
  const originalLang = item.originalLanguage ? item.originalLanguage.toUpperCase().slice(0, 2) : null;

  return (
    // Outer Wrapper with Group for Hover Effects
    // We use z-indexes to stack the glow behind the card content
    <div 
        onClick={handleCardClick}
        className="group relative w-full h-full cursor-pointer perspective-1000 z-0 hover:z-20 duration-300"
    >
        {/* THE GLOW LAYER - Behind the card */}
        {/* Increased base opacity to 60 for stronger constant glow, up to 100 on hover */}
        {/* Expanded by 1.25rem (-inset-5) to show edges */}
        <div 
            className="absolute -inset-5 rounded-[2rem] opacity-60 group-hover:opacity-100 transition-all duration-500 blur-2xl z-[-1] group-hover:-inset-6 group-hover:blur-3xl"
            style={{
                backgroundImage: imgSrc && imageState !== 'error' ? `url(${imgSrc})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        ></div>

        {/* Alternative Glow for fallback/loading state - Increased intensity */}
        {!imgSrc && (
            <div className="absolute -inset-5 rounded-[2rem] bg-primary/40 opacity-50 group-hover:opacity-80 blur-2xl transition-all duration-500 z-[-1] group-hover:-inset-6"></div>
        )}

        {/* MAIN CARD CONTAINER */}
        <div className="relative h-full flex flex-col bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-2xl overflow-hidden hover:bg-white/[0.08] hover:border-white/20 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300 transform group-hover:-translate-y-2 shadow-glass shadow-glass-inset ring-1 ring-white/5">
            
            {/* Poster Image Container */}
            <div className="aspect-[2/3] relative overflow-hidden bg-white/5">
                
                {imageState === 'generating' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-500 bg-white/5 animate-pulse relative z-10">
                        <div className="bg-primary/20 p-4 rounded-full mb-3 backdrop-blur-sm border border-primary/20">
                            <Sparkles size={32} className="text-primary animate-spin-slow" />
                        </div>
                        <span className="text-xs text-center font-medium px-2 text-primary">Generating Poster...</span>
                    </div>
                ) : imageState !== 'error' ? (
                    <img
                    src={imgSrc}
                    alt={item.title}
                    loading="lazy"
                    className={`w-full h-full object-cover relative z-10 transition-transform duration-700 group-hover:scale-105 opacity-95 group-hover:opacity-100 shadow-xl ${imageState === 'ai' ? 'saturate-[1.1] contrast-[1.1]' : ''}`}
                    onError={handleImageError}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-500 bg-white/5 relative z-10">
                        <div className="bg-white/5 p-4 rounded-full mb-3 backdrop-blur-sm border border-white/10">
                        <ImageOff size={32} className="opacity-50" />
                        </div>
                        <span className="text-xs text-center font-medium px-2 text-slate-400">{item.title}</span>
                    </div>
                )}
                
                {/* Glass Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-20 items-center">
                    <button className="flex items-center gap-2 bg-white/20 backdrop-blur-2xl border border-white/30 text-white text-xs font-bold py-2.5 px-6 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] transform scale-90 group-hover:scale-100 transition-all duration-300 hover:bg-white/30 hover:border-white/50 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]">
                        <span>View Details</span>
                    </button>
                </div>

                {/* Watchlist Toggle */}
                <button 
                    onClick={handleWatchlistClick}
                    className={`
                        absolute top-2 left-2 z-20 p-2.5 rounded-full backdrop-blur-md border shadow-lg transition-all duration-300
                        ${inWatchlist 
                            ? 'bg-accent/70 border-accent/50 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
                            : 'bg-black/30 border-white/10 text-slate-300 hover:text-white hover:bg-white/20'}
                    `}
                    title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                >
                    <Heart size={16} fill={inWatchlist ? "currentColor" : "none"} />
                </button>

                {/* Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end z-20">
                    {imageState === 'ai' && (
                        <span className="bg-primary/80 backdrop-blur-md border border-white/10 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                            <Sparkles size={8} /> AI
                        </span>
                    )}

                    {item.maturityRating && (
                        <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                            {item.maturityRating}
                        </span>
                    )}
                    
                    <div className="flex gap-1">
                        {originalLang && originalLang !== 'Unknown' && (
                            <span className="bg-slate-800/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-lg border border-slate-500/30">
                                {originalLang}
                            </span>
                        )}
                        
                        {isDubbed && (
                            <span className="bg-blue-600/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-lg border border-blue-400/30">
                                <Mic size={10} /> DUB
                            </span>
                        )}
                    </div>

                    {techSpecs.length > 0 && (
                        <span className="bg-purple-600/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-lg border border-purple-400/20">
                            <Award size={10} /> {techSpecs[0]}
                        </span>
                    )}
                </div>
            </div>

            {/* Content Info */}
            <div className="p-4 flex flex-col flex-grow relative bg-slate-950/40 backdrop-blur-sm z-10">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                <div className="flex justify-between items-start mb-1">
                <h3 className="text-white/90 font-semibold truncate w-full text-sm md:text-base leading-tight drop-shadow-sm" title={item.title}>{item.title}</h3>
                </div>
                
                <div className="flex items-center justify-between text-sm text-slate-400 mt-1">
                <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-slate-500" />
                    <span className="text-xs opacity-80">{formatDate(item.releaseDate)}</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-300 bg-yellow-400/10 px-1.5 py-0.5 rounded-md border border-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.1)]">
                    <Star size={10} fill="currentColor" />
                    <span className="font-bold text-xs">{(item.imdbRating || 0).toFixed(1)}</span>
                </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                    {genres.slice(0, 2).map(g => (
                        <span key={g} className="text-[10px] px-2 py-0.5 bg-white/5 text-slate-300 rounded-md border border-white/10 hover:bg-white/10 transition-colors shadow-sm">
                            {g}
                        </span>
                    ))}
                </div>

                {/* Platform Logos Footer */}
                {platforms.length > 0 && (
                    <div className="mt-auto pt-3 flex items-center gap-2 border-t border-white/5">
                        {platforms.slice(0, 4).map(p => (
                            <PlatformIcon key={p} platform={p} />
                        ))}
                        {platforms.length > 4 && (
                            <span className="text-[9px] text-slate-500">+{platforms.length - 4}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default MediaCard;