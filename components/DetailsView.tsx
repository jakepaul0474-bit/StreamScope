import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Globe, MonitorPlay, ShieldAlert, Mic, Info, ImageOff, Clock, ChevronDown, PlayCircle, Heart, Check, Settings2, X, ExternalLink, Activity, Award, Users, Languages } from 'lucide-react';
import { MediaItem, MediaType, Episode, ContentRatingDetail } from '../types';
import { fetchMediaDetails, fetchRecommendations, fetchSeasonEpisodes, fetchTrailerUrl } from '../services/geminiService';
import MediaCard from './MediaCard';
import { useWatchlist } from '../hooks/useWatchlist';

// Helper component for Platform Item with independent image state and fallback
const PlatformItem: React.FC<{ platform: string; title: string }> = ({ platform, title }) => {
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
             setImgSrc(`https://logo.clearbit.com/${domain}?size=60`);
             setError(false);
        } else {
             setError(true);
        }
    }, [domain, platform]);

    const handleError = () => {
        if (imgSrc.includes('clearbit')) {
            // Fallback to Google
            setImgSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
        } else {
            setError(true);
        }
    };

    return (
        <a 
            href={`https://www.google.com/search?q=watch ${title} on ${platform}`} 
            target="_blank" 
            rel="noreferrer"
            className="group relative block w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl overflow-hidden border border-white/10 hover:border-white/30 hover:scale-105 transition-all shadow-md"
            title={platform}
        >
            {!error && domain ? (
                 <img 
                    src={imgSrc} 
                    alt={platform} 
                    className="w-full h-full object-cover" 
                    onError={handleError}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                 />
            ) : null}
            
            {/* Fallback Text */}
            <div className={`w-full h-full flex items-center justify-center bg-slate-800 text-[10px] font-bold text-slate-300 ${!error && domain ? 'hidden' : ''}`}>
                {platform.slice(0,1).toUpperCase()}
            </div>

            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
        </a>
    );
};

// Helper Component for Individual Content Rating Rows
const ContentRatingItem: React.FC<{ detail: ContentRatingDetail }> = ({ detail }) => {
    const [isOpen, setIsOpen] = useState(false);

    const getSeverityColor = (severity: string) => {
      const s = severity?.toLowerCase() || '';
      if (s.includes('severe') || s.includes('high')) return 'bg-red-500/20 text-red-400 border-red-500/30';
      if (s.includes('moderate') || s.includes('medium')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      if (s.includes('mild') || s.includes('low')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    };

    return (
        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden transition-all duration-200 hover:bg-white/[0.07]">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3.5 text-left focus:outline-none group"
            >
                <span className="font-semibold text-slate-200 text-sm group-hover:text-white transition-colors">{detail.category}</span>
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider min-w-[70px] text-center ${getSeverityColor(detail.severity)}`}>
                        {detail.severity}
                    </span>
                    <ChevronDown size={16} className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out bg-black/20 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-4 pb-4 pt-2">
                    <div className="h-px w-full bg-white/5 mb-3"></div>
                    <p className="text-xs text-slate-400 leading-relaxed font-light">
                        {detail.description || "No specific scenes described for this category."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export const DetailsView: React.FC = () => {
  const { type, title } = useParams<{ type: string; title: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const [backdropSrc, setBackdropSrc] = useState('');
  const [posterSrc, setPosterSrc] = useState('');
  const [backdropError, setBackdropError] = useState(false);
  const [posterError, setPosterError] = useState(false);
  
  const [isBackdropBing, setIsBackdropBing] = useState(false);
  const [isPosterBing, setIsPosterBing] = useState(false);

  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [episodesCache, setEpisodesCache] = useState<Record<number, Episode[]>>({});
  // Changed to track which specific season is loading
  const [loadingSeason, setLoadingSeason] = useState<number | null>(null);
  
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [loadingTrailer, setLoadingTrailer] = useState(false);
  
  const [isRatingExpanded, setIsRatingExpanded] = useState(false);

  // Updated to support 'cast' and 'episode' types
  const getBingUrl = (query: string, type: 'poster' | 'backdrop' | 'cast' | 'episode') => {
     let aspect = '';
     let suffix = '';
     
     if (type === 'poster') {
         aspect = '&w=400&h=600';
         suffix = ' poster';
     } else if (type === 'backdrop') {
         aspect = '&w=1280&h=720';
         suffix = ' backdrop';
     } else if (type === 'cast') {
         aspect = '&w=200&h=200&c=7&rs=1'; // Face focus crop
         suffix = ' face';
     } else if (type === 'episode') {
         aspect = '&w=320&h=180&c=7&rs=1'; 
         suffix = ' episode still';
     }

     return `https://tse2.mm.bing.net/th?q=${encodeURIComponent(query + suffix)}&c=7&rs=1${aspect}&p=0`;
  }

  const getProxiedUrl = (url: string) => 
    `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=webp`;

  const getYoutubeEmbedUrl = (url?: string | null) => {
    if (!url) return null;
    try {
        const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regExp);
        const videoId = match ? match[1] : null;

        if (videoId) {
            // Simplified Embed URL to prevent "Error 153"
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1`;
        }
    } catch(e) {
        console.error("Invalid YouTube URL", e);
    }
    return null;
  };

  useEffect(() => {
    const loadData = async () => {
      if (title && type) {
        setLoading(true);
        setItem(null);
        setRecommendations([]);
        setBackdropError(false);
        setPosterError(false);
        setIsBackdropBing(false);
        setIsPosterBing(false);
        setExpandedSeason(null);
        setEpisodesCache({});
        setLoadingSeason(null);
        setTrailerUrl(null);
        setIsRatingExpanded(false);

        // Fetch main details and recommendations in parallel
        const [detailsData, recsData] = await Promise.all([
            fetchMediaDetails(title, type),
            fetchRecommendations(title, type)
        ]);
        
        if (detailsData) {
            setItem(detailsData);
            
            // Set trailer if available in initial data (rare with optimized schema)
            if (detailsData.trailerUrl) {
                setTrailerUrl(detailsData.trailerUrl);
            }

            if (detailsData.backdropUrl) {
                setBackdropSrc(getProxiedUrl(detailsData.backdropUrl));
                setIsBackdropBing(false);
            } else {
                setBackdropSrc(getBingUrl(`${detailsData.title} ${detailsData.type}`, 'backdrop'));
                setIsBackdropBing(true);
            }

            if (detailsData.posterUrl) {
                setPosterSrc(getProxiedUrl(detailsData.posterUrl));
                setIsPosterBing(false);
            } else {
                setPosterSrc(getBingUrl(`${detailsData.title} ${detailsData.type}`, 'poster'));
                setIsPosterBing(true);
            }

            // Lazy load trailer in background if not present
            if (!detailsData.trailerUrl) {
                setLoadingTrailer(true);
                fetchTrailerUrl(detailsData.title, detailsData.type).then(url => {
                    setTrailerUrl(url);
                    setLoadingTrailer(false);
                });
            }
        }

        if (recsData) {
            setRecommendations(recsData);
        }

        setLoading(false); 
      }
    };
    loadData();
  }, [title, type]);


  const handleBackdropError = () => {
      if (!isBackdropBing && item) {
          setIsBackdropBing(true);
          setBackdropSrc(getBingUrl(`${item.title} movie`, 'backdrop'));
      } else {
          setBackdropError(true);
      }
  }

  const handlePosterError = () => {
      if (!isPosterBing && item) {
          setIsPosterBing(true);
          setPosterSrc(getBingUrl(`${item.title} movie`, 'poster'));
      } else {
          setPosterError(true);
      }
  }

  const toggleSeason = async (seasonNumber: number) => {
    if (expandedSeason === seasonNumber) {
      setExpandedSeason(null);
      return;
    }

    setExpandedSeason(seasonNumber);

    // If already cached, don't fetch again
    if (episodesCache[seasonNumber]) {
        return;
    }

    if (item) {
      setLoadingSeason(seasonNumber);
      try {
          const episodes = await fetchSeasonEpisodes(item.title, seasonNumber);
          setEpisodesCache(prev => ({ ...prev, [seasonNumber]: episodes }));
      } catch (e) {
          console.error("Failed to fetch episodes", e);
      } finally {
          // Only clear loading if the current expanded season matches (handle rapid clicks)
          setLoadingSeason(prev => prev === seasonNumber ? null : prev);
      }
    }
  };

  const formatDate = (dateStr?: string) => {
      if (!dateStr) return 'Unknown Date';
      try {
          return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      } catch {
          return dateStr;
      }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="flex flex-col items-center gap-4 p-8 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-glass">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/80 shadow-lg"></div>
             <p className="text-slate-300 animate-pulse font-medium">Fetching details...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white gap-4">
        <p className="text-xl font-medium text-slate-300">Media not found.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-colors text-white border border-white/10">Go Back</button>
      </div>
    );
  }

  const chartData = item.ratingsBreakdown ? [
    { name: 'Story', score: item.ratingsBreakdown.story, fill: '#60a5fa' }, // Light Blue
    { name: 'Acting', score: item.ratingsBreakdown.acting, fill: '#a78bfa' }, // Light Purple
    { name: 'Visuals', score: item.ratingsBreakdown.visuals, fill: '#fb7185' }, // Light Rose
    { name: 'Sound', score: item.ratingsBreakdown.sound, fill: '#34d399' }, // Light Emerald
  ] : [
    { name: 'Story', score: item.imdbRating || 0, fill: '#60a5fa' },
    { name: 'Acting', score: item.imdbRating || 0, fill: '#a78bfa' },
    { name: 'Visuals', score: item.imdbRating || 0, fill: '#fb7185' },
    { name: 'Sound', score: item.imdbRating || 0, fill: '#34d399' },
  ];

  const isSeries = (item.type === MediaType.SHOW || item.type === MediaType.ANIME) && item.subType !== 'Movie';
  const inWatchlist = isInWatchlist(item.id);
  const trailerEmbedUrl = getYoutubeEmbedUrl(trailerUrl);
  
  // Logic to determine display string for Audio
  const isDubbed = item.audioType && (item.audioType.includes('Dub') || item.audioType.includes('Multi'));
  const originalLang = item.originalLanguage ? item.originalLanguage.toUpperCase() : null;

  const hasSevereContent = item.contentRatingDetails?.some(d => d.severity.toLowerCase() === 'severe') ?? false;

  return (
    <>
        <div className="min-h-screen pb-20 pl-0 md:pl-20 lg:pl-64 transition-all duration-300 overflow-x-hidden">
        {/* Backdrop Banner */}
        <div className="relative h-[45vh] w-full bg-slate-950 overflow-hidden">
            {!backdropError ? (
                <img 
                src={backdropSrc} 
                alt="Backdrop" 
                className="w-full h-full object-cover opacity-60"
                onError={handleBackdropError}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center opacity-20 bg-slate-800">
                    <ImageOff size={64} />
                </div>
            )}
        
            {/* Fade to Transparent instead of solid color */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/10 to-transparent" />
            
            <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 bg-white/5 backdrop-blur-2xl border border-white/10 p-3 rounded-full hover:bg-white/10 transition-all z-20 group shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
            <ArrowLeft size={24} className="text-white group-hover:-translate-x-1 transition-transform" />
            </button>
        </div>

        <div className="max-w-7xl mx-auto px-6 -mt-40 relative z-10">
            <div className="flex flex-col md:flex-row gap-8">
            
            {/* Left Column: Poster & Quick Info */}
            <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-6">
                {/* Poster - Glass Container */}
                <div className="w-full aspect-[2/3] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-white/5 backdrop-blur-3xl overflow-hidden relative z-20 group">
                    {!posterError ? (
                        <img 
                        src={posterSrc} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={handlePosterError}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-500">
                            <ImageOff size={48} className="mb-2 opacity-50" />
                            <span className="text-center text-sm">{item.title}</span>
                        </div>
                    )}
                </div>
                
                {/* Info Cards Grid - Compact on Mobile */}
                <div className="grid grid-cols-2 gap-3 md:flex md:flex-col md:gap-6">
                    
                    {/* Rating Breakdown - Compact Glass Card */}
                    <div className="col-span-1 md:w-full bg-white/[0.03] backdrop-blur-3xl p-3 md:p-5 rounded-xl md:rounded-2xl border border-white/[0.05] shadow-glass relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3 className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1 md:gap-2">
                            <Activity size={12} className="text-white md:w-[14px] md:h-[14px]" /> <span className="hidden xs:inline">Analysis</span>
                            </h3>
                            <div className="flex items-center gap-1 bg-black/30 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg border border-white/5">
                            <Star size={10} className="text-yellow-400" fill="currentColor" />
                            <span className="text-[10px] md:text-xs font-bold text-white">{item.imdbRating || 'N/A'}</span>
                            </div>
                        </div>
                        
                        <div className="space-y-2 md:space-y-3 relative z-10">
                            {chartData.map((data, idx) => (
                            <div key={data.name} className="flex flex-col gap-1">
                                <div className="flex justify-between text-[8px] md:text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                    <span>{data.name}</span>
                                    <span style={{ color: data.fill }}>{data.score}/10</span>
                                </div>
                                <div className="h-1 md:h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{ 
                                        width: `${data.score * 10}%`, 
                                        backgroundColor: data.fill,
                                        boxShadow: `0 0 10px ${data.fill}40`
                                        }}
                                    ></div>
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>

                    {/* Platforms List - Glass Panel */}
                    <div className="col-span-1 md:w-full bg-white/[0.03] backdrop-blur-3xl p-3 md:p-5 rounded-xl md:rounded-2xl border border-white/[0.05] shadow-glass">
                        <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2">
                            <MonitorPlay size={12} className="md:w-[14px] md:h-[14px]" /> Available
                        </h3>
                        <div className="flex flex-wrap gap-2 md:gap-3">
                            {item.platforms && item.platforms.length > 0 ? item.platforms.map(platform => (
                                <PlatformItem key={platform} platform={platform} title={item.title} />
                            )) : <span className="text-slate-500 text-[10px] md:text-sm italic">Not available</span>}
                        </div>
                    </div>

                    {/* Tech Specs Panel */}
                    {item.techSpecs && item.techSpecs.length > 0 && (
                        <div className="col-span-2 sm:col-span-1 md:w-full bg-white/[0.03] backdrop-blur-3xl p-3 md:p-5 rounded-xl md:rounded-2xl border border-white/[0.05] shadow-glass">
                            <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2">
                                <Settings2 size={12} className="md:w-[14px] md:h-[14px]" /> Specs
                            </h3>
                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                                {item.techSpecs.map(spec => (
                                    <span key={spec} className="px-1.5 py-0.5 md:px-2 md:py-1 bg-white/5 text-slate-300 border border-white/10 rounded text-[10px] md:text-xs font-semibold">
                                        {spec}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Main Content Info */}
            <div className="flex-1 pt-4 md:pt-12">
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-4xl md:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 drop-shadow-lg">{item.title}</h1>
                    {item.subType && (
                        <span className="bg-white/10 backdrop-blur-md border border-white/10 text-white px-3 py-1 rounded-lg text-sm font-bold tracking-wide shadow-lg">
                            {item.subType}
                        </span>
                    )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-slate-300 mb-6 mt-3">
                <span className="flex items-center gap-1.5"><Calendar size={16} className="text-slate-400" /> {formatDate(item.releaseDate)}</span>
                {item.country && <span className="flex items-center gap-1.5"><Globe size={16} className="text-slate-400" /> {item.country}</span>}
                {item.maturityRating && <span className="flex items-center gap-1.5"><ShieldAlert size={16} className="text-accent" /> {item.maturityRating}</span>}
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 font-bold"><Star size={16} fill="currentColor" /> {item.imdbRating || 'N/A'}</span>
                
                {/* Audio Info */}
                {(originalLang || isDubbed) && (
                    <span className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-medium">
                        <Languages size={14} className="text-blue-300" />
                        <span className="text-slate-200">
                             {originalLang || 'Unknown'} 
                             {isDubbed && <span className="text-slate-400 ml-1">• Dub Available</span>}
                        </span>
                    </span>
                )}
                
                 {item.techSpecs && item.techSpecs.length > 0 && (
                     <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-xs"><Award size={14} className="text-purple-300" /> {item.techSpecs[0]}</span>
                 )}
                </div>

                {/* Genres & Actions */}
                <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {(item.genres || []).map(g => (
                            <span key={g} className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-sm text-slate-200 hover:bg-white/10 hover:border-white/10 transition-all cursor-default">
                            {g}
                            </span>
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-3">
                         {/* Watch Trailer Button */}
                         <button 
                            onClick={() => setShowTrailerModal(true)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all duration-300 border backdrop-blur-2xl
                            ${loadingTrailer 
                                ? 'bg-white/5 border-white/5 text-slate-400 cursor-wait' 
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                            }`}
                            disabled={loadingTrailer}
                         >
                            {loadingTrailer ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div> : <PlayCircle size={18} />}
                            {loadingTrailer ? 'Finding Trailer...' : 'Watch Trailer'}
                         </button>

                        {/* Large Watchlist Button */}
                        <button 
                            onClick={() => toggleWatchlist(item)}
                            className={`
                                flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all duration-300 border backdrop-blur-2xl
                                ${inWatchlist 
                                    ? 'bg-accent/20 border-accent text-accent hover:bg-accent/30' 
                                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30'}
                            `}
                        >
                            {inWatchlist ? <Check size={18} /> : <Heart size={18} />}
                            {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                        </button>
                    </div>
                </div>

                {/* Next Episode Banner - Glossy Gradient */}
                {item.nextEpisode && (
                    <div className="mb-8 bg-white/[0.03] backdrop-blur-3xl border border-white/[0.05] p-1 rounded-2xl shadow-glass">
                    <div className="bg-black/10 rounded-xl p-5 flex flex-col sm:flex-row gap-5 items-center justify-between">
                            <div className="flex gap-4 items-center">
                                <div className="p-3 bg-blue-600/60 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.3)] animate-pulse">
                                    <Clock className="text-white" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-blue-100 font-bold text-lg">Next Episode Arriving</h3>
                                    <p className="text-white font-medium">
                                        {formatDate(item.nextEpisode.airDate)} 
                                        {item.nextEpisode.episodeNumber && ` • Ep ${item.nextEpisode.episodeNumber}`}
                                    </p>
                                </div>
                            </div>
                            {item.nextEpisode.title && (
                                <div className="bg-white/5 px-5 py-2.5 rounded-xl text-sm text-blue-100 italic border border-white/10 shadow-inner">
                                    "{item.nextEpisode.title}"
                                </div>
                            )}
                    </div>
                    </div>
                )}

                {/* Content Rating Section (Collapsible) */}
                {(item.contentRatingDetails && item.contentRatingDetails.length > 0) || item.contentAdvisory ? (
                    <div className="mb-8 bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-2xl overflow-hidden shadow-glass">
                        <button 
                            onClick={() => setIsRatingExpanded(!isRatingExpanded)}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors group focus:outline-none"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-colors ${
                                    hasSevereContent ? 'bg-red-500/20 text-red-400 group-hover:bg-red-500/30' : 'bg-slate-500/20 text-slate-400 group-hover:bg-slate-500/30'
                                }`}>
                                    <ShieldAlert size={20} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-slate-200 font-bold text-base">Content Rating</h3>
                                    <p className="text-slate-400 text-xs flex items-center gap-2">
                                        {item.maturityRating ? `Rated ${item.maturityRating}` : 'Content Advisory'}
                                        {hasSevereContent && <span className="text-red-400 font-semibold">• Severe Content</span>}
                                    </p>
                                </div>
                            </div>
                            <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isRatingExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        <div className={`transition-all duration-300 ease-in-out ${isRatingExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-4 pt-0 border-t border-white/5 space-y-3">
                               {item.contentRatingDetails ? item.contentRatingDetails.map((detail, idx) => (
                                   <ContentRatingItem key={idx} detail={detail} />
                               )) : (
                                   <p className="text-sm text-slate-400 p-2 italic">{item.contentAdvisory || "No detailed content rating available."}</p>
                               )}
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="space-y-8">
                    <div className="bg-white/[0.03] backdrop-blur-3xl p-6 rounded-3xl border border-white/[0.05] shadow-glass">
                        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                            Storyline
                        </h2>
                        <p className="text-slate-300 leading-relaxed text-lg font-light">
                        {item.description || "No description available."}
                        </p>
                    </div>

                    {/* Top Cast Section - Compact Strip */}
                    {item.cast && item.cast.length > 0 && (
                        <div className="bg-white/[0.03] backdrop-blur-3xl p-4 md:p-6 rounded-3xl border border-white/[0.05] shadow-glass">
                            <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                                <Users size={20} className="text-slate-200" /> Top Cast
                            </h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
                                {item.cast.map((actor, idx) => (
                                    <div key={idx} className="flex flex-col items-center text-center p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                        <div className="w-14 h-14 rounded-full overflow-hidden shadow-md mb-2 bg-slate-700 ring-2 ring-white/10 group-hover:ring-white/30 transition-all">
                                             <img 
                                                src={getBingUrl(actor, 'cast')} 
                                                alt={actor}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                }}
                                             />
                                             <div className="hidden w-full h-full flex items-center justify-center bg-slate-700 text-xs font-bold text-slate-400">
                                                {actor.charAt(0)}
                                             </div>
                                        </div>
                                        <span className="text-xs font-medium text-slate-300 leading-tight line-clamp-2">{actor}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Seasons Section for TV Shows/Anime */}
                    {isSeries && item.seasons && item.seasons.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold pl-2 flex items-center gap-2 text-slate-200">
                            Episodes & Seasons
                            </h2>
                            <div className="flex flex-col gap-4">
                                {item.seasons.map((season) => (
                                    <div key={season.seasonNumber} className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] rounded-2xl overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-white/10 shadow-glass">
                                        <button 
                                        onClick={() => toggleSeason(season.seasonNumber)}
                                        className="w-full p-5 flex items-center justify-between text-left focus:outline-none"
                                        >
                                            <div className="flex flex-col">
                                                <h4 className="font-bold text-white text-lg flex items-center gap-3">
                                                    Season {season.seasonNumber}
                                                    {season.title && <span className="text-sm font-normal text-slate-400 italic bg-black/20 px-2 py-0.5 rounded border border-white/5">{season.title}</span>}
                                                </h4>
                                                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                                                    <span className="bg-white/10 px-2 py-0.5 rounded">{season.episodeCount} Episodes</span>
                                                    <span>•</span>
                                                    <span>Premiered {formatDate(season.releaseDate)}</span>
                                                </p>
                                            </div>
                                            <div className={`p-2 rounded-full bg-white/5 transition-transform duration-300 ${expandedSeason === season.seasonNumber ? 'rotate-180 bg-white/10' : ''}`}>
                                                <ChevronDown className="text-slate-300" size={20} />
                                            </div>
                                        </button>
                                        
                                        {/* Expanded Episodes List */}
                                        {expandedSeason === season.seasonNumber && (
                                            <div className="border-t border-white/5 bg-black/10 p-2 md:p-4">
                                                {loadingSeason === season.seasonNumber ? (
                                                    <div className="flex justify-center py-8">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/50"></div>
                                                    </div>
                                                ) : episodesCache[season.seasonNumber] && episodesCache[season.seasonNumber].length > 0 ? (
                                                    <div className="space-y-4">
                                                        {episodesCache[season.seasonNumber].map((ep) => (
                                                            <div key={ep.episodeNumber} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5 items-start">
                                                                {/* Episode Image */}
                                                                <div className="w-full md:w-40 aspect-video rounded-lg overflow-hidden bg-black/20 flex-shrink-0 border border-white/5 relative">
                                                                     <img 
                                                                        src={ep.stillUrl ? getProxiedUrl(ep.stillUrl) : getBingUrl(`${item.title} "${ep.title}"`, 'episode')}
                                                                        alt={ep.title}
                                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                                        loading="lazy"
                                                                        onError={(e) => {
                                                                            // Fallback to title card style if image fails
                                                                            e.currentTarget.style.display = 'none';
                                                                            e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                                                                            e.currentTarget.parentElement!.innerHTML = `<span class="text-xs text-slate-500 font-mono">Ep ${ep.episodeNumber}</span>`;
                                                                        }}
                                                                     />
                                                                     <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                                                </div>
                                                                
                                                                <div className="flex-1 w-full">
                                                                     <div className="flex flex-wrap justify-between items-start mb-1 gap-2">
                                                                        <h5 className="font-bold text-slate-200 group-hover:text-white transition-colors text-base">
                                                                            <span className="text-slate-500 font-mono mr-2">#{ep.episodeNumber}</span>
                                                                            {ep.title}
                                                                        </h5>
                                                                        <span className="text-xs bg-black/40 border border-white/10 px-2 py-1 rounded text-slate-300 flex items-center gap-1 whitespace-nowrap">
                                                                            <Star size={10} className="text-yellow-500" fill="currentColor" /> {ep.rating}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-500 mb-2">{formatDate(ep.airDate)}</p>
                                                                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                                                                        {ep.overview}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 text-slate-500 bg-black/20 rounded-xl m-2">No episode details available.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Recommendations Section */}
                <div className="mt-16 pt-8 border-t border-white/5">
                    <h2 className="text-2xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">You Might Also Like</h2>
                    {recommendations.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {recommendations.map(rec => (
                                <MediaCard key={rec.id} item={rec} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex justify-center py-10">
                            <div className="bg-white/5 px-6 py-3 rounded-full animate-pulse text-slate-400 text-sm border border-white/5">Looking for similar titles...</div>
                        </div>
                    )}
                </div>

            </div>
            </div>
        </div>
        </div> 
        {/* ^^^ ADDED THIS MISSING DIV to close min-h-screen */}

        {/* Trailer Modal */}
        {showTrailerModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-3xl animate-in fade-in duration-200">
                <div 
                    className="absolute inset-0" 
                    onClick={(e) => { e.stopPropagation(); setShowTrailerModal(false); }}
                ></div>
                <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 pointer-events-none">
                         <div className="pointer-events-auto">
                            {item.trailerUrl && (
                                <a 
                                    href={item.trailerUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-red-600/80 text-white rounded-full backdrop-blur-md transition-colors border border-white/10 text-sm font-medium"
                                >
                                    <ExternalLink size={16} /> Open in YouTube
                                </a>
                            )}
                         </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowTrailerModal(false); }}
                            className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors border border-white/10"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {trailerEmbedUrl ? (
                        <>
                         <iframe
                            src={trailerEmbedUrl}
                            title="Trailer"
                            className="w-full h-full"
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        ></iframe>
                         <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                            <p className="text-[10px] text-slate-400 bg-black/40 inline-block px-2 py-1 rounded">If video doesn't load, use "Open in YouTube"</p>
                        </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white gap-4 bg-slate-900">
                             <p className="text-lg font-medium text-slate-300">Preview unavailable directly</p>
                             {item.trailerUrl ? (
                                <a 
                                    href={item.trailerUrl}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-bold"
                                >
                                    <PlayCircle size={20} /> Watch on YouTube
                                </a>
                             ) : (
                                <p className="text-slate-500">No trailer link provided</p>
                             )}
                        </div>
                    )}
                </div>
            </div>
        )}
    </>
  );
};