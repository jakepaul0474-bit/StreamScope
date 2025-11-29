import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Globe, MonitorPlay, ShieldAlert, Mic, Info, ImageOff, Clock, ChevronDown, ChevronUp, PlayCircle, Heart, Check, Settings2, X, ExternalLink, Activity, Award } from 'lucide-react';
import { MediaItem, MediaType, Episode } from '../types';
import { fetchMediaDetails, fetchRecommendations, fetchSeasonEpisodes } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import MediaCard from './MediaCard';
import { useWatchlist } from '../hooks/useWatchlist';

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
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  const getBingUrl = (query: string, type: 'poster' | 'backdrop') => {
     const aspect = type === 'poster' ? '&w=400&h=600' : '&w=1280&h=720';
     return `https://tse2.mm.bing.net/th?q=${encodeURIComponent(query + " " + type)}&c=7&rs=1${aspect}&p=0`;
  }

  const getProxiedUrl = (url: string) => 
    `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=webp`;

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
    if (domain) return `https://logo.clearbit.com/${domain}?size=60`;
    return null;
  };

  const getYoutubeEmbedUrl = (url?: string) => {
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

        const [detailsData, recsData] = await Promise.all([
            fetchMediaDetails(title, type),
            fetchRecommendations(title, type)
        ]);
        
        if (detailsData) {
            setItem(detailsData);
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

    if (!episodesCache[seasonNumber] && item) {
      setLoadingEpisodes(true);
      const episodes = await fetchSeasonEpisodes(item.title, seasonNumber);
      setEpisodesCache(prev => ({ ...prev, [seasonNumber]: episodes }));
      setLoadingEpisodes(false);
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
        <div className="flex flex-col items-center gap-4 p-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl border border-white/5">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary shadow-lg"></div>
             <p className="text-slate-300 animate-pulse font-medium">Fetching details...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white gap-4">
        <p className="text-xl font-medium text-slate-300">Media not found.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-colors text-primary border border-white/10">Go Back</button>
      </div>
    );
  }

  const chartData = item.ratingsBreakdown ? [
    { name: 'Story', score: item.ratingsBreakdown.story, fill: '#3b82f6' }, // Blue
    { name: 'Acting', score: item.ratingsBreakdown.acting, fill: '#8b5cf6' }, // Purple
    { name: 'Visuals', score: item.ratingsBreakdown.visuals, fill: '#f43f5e' }, // Pink
    { name: 'Sound', score: item.ratingsBreakdown.sound, fill: '#10b981' }, // Emerald
  ] : [
    { name: 'Story', score: item.imdbRating, fill: '#3b82f6' },
    { name: 'Acting', score: item.imdbRating, fill: '#8b5cf6' },
    { name: 'Visuals', score: item.imdbRating, fill: '#f43f5e' },
    { name: 'Sound', score: item.imdbRating, fill: '#10b981' },
  ];

  const isSeries = (item.type === MediaType.SHOW || item.type === MediaType.ANIME) && item.subType !== 'Movie';
  const inWatchlist = isInWatchlist(item.id);
  const trailerEmbedUrl = getYoutubeEmbedUrl(item.trailerUrl);

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
            className="absolute top-6 left-6 bg-white/5 backdrop-blur-xl border border-white/10 p-3 rounded-full hover:bg-white/20 transition-all z-20 group shadow-lg"
            >
            <ArrowLeft size={24} className="text-white group-hover:-translate-x-1 transition-transform" />
            </button>
        </div>

        <div className="max-w-7xl mx-auto px-6 -mt-40 relative z-10">
            <div className="flex flex-col md:flex-row gap-8">
            
            {/* Left Column: Poster & Quick Info */}
            <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-6">
                {/* Poster - Glass Container */}
                <div className="w-full aspect-[2/3] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-slate-800/20 backdrop-blur-xl overflow-hidden relative z-20 group">
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
                    <div className="col-span-1 md:w-full bg-gradient-to-br from-white/10 to-transparent backdrop-blur-2xl p-3 md:p-5 rounded-xl md:rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3 className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1 md:gap-2">
                            <Activity size={12} className="text-primary md:w-[14px] md:h-[14px]" /> <span className="hidden xs:inline">Analysis</span>
                            </h3>
                            <div className="flex items-center gap-1 bg-black/30 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg border border-white/5">
                            <Star size={10} className="text-yellow-400" fill="currentColor" />
                            <span className="text-[10px] md:text-xs font-bold text-white">{item.imdbRating}</span>
                            </div>
                        </div>
                        
                        <div className="space-y-2 md:space-y-3 relative z-10">
                            {chartData.map((data, idx) => (
                            <div key={data.name} className="flex flex-col gap-1">
                                <div className="flex justify-between text-[8px] md:text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                    <span>{data.name}</span>
                                    <span style={{ color: data.fill }}>{data.score}/10</span>
                                </div>
                                <div className="h-1 md:h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
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
                    <div className="col-span-1 md:w-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-3 md:p-5 rounded-xl md:rounded-2xl border border-white/5 shadow-lg">
                        <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2">
                            <MonitorPlay size={12} className="md:w-[14px] md:h-[14px]" /> Available
                        </h3>
                        <div className="flex flex-wrap gap-2 md:gap-3">
                            {item.platforms && item.platforms.length > 0 ? item.platforms.map(platform => {
                            const logo = getPlatformLogo(platform);
                            return logo ? (
                                <a 
                                    key={platform} 
                                    href={`https://www.google.com/search?q=watch ${item.title} on ${platform}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="group relative block w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl overflow-hidden border border-white/5 hover:border-white/20 hover:scale-105 transition-all shadow-md"
                                    title={platform}
                                >
                                    <img src={logo} alt={platform} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                </a>
                            ) : (
                                <span key={platform} className="px-2 py-1 md:px-3 md:py-1.5 bg-primary/10 text-primary border border-primary/20 rounded md:rounded-lg text-[10px] md:text-sm font-medium hover:bg-primary/20 transition-colors cursor-default">
                                    {platform}
                                </span>
                            );
                            }) : <span className="text-slate-500 text-[10px] md:text-sm italic">Not available</span>}
                        </div>
                    </div>

                    {/* Tech Specs Panel */}
                    {item.techSpecs && item.techSpecs.length > 0 && (
                        <div className="col-span-2 sm:col-span-1 md:w-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-3 md:p-5 rounded-xl md:rounded-2xl border border-white/5 shadow-lg">
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
                <span className="flex items-center gap-1.5"><Calendar size={16} className="text-primary" /> {formatDate(item.releaseDate)}</span>
                {item.country && <span className="flex items-center gap-1.5"><Globe size={16} className="text-primary" /> {item.country}</span>}
                {item.maturityRating && <span className="flex items-center gap-1.5"><ShieldAlert size={16} className="text-accent" /> {item.maturityRating}</span>}
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold"><Star size={16} fill="currentColor" /> {item.imdbRating}</span>
                {item.audioType && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-xs"><Mic size={14} className="text-green-400" /> {item.audioType}</span>
                )}
                 {item.techSpecs && item.techSpecs.length > 0 && (
                     <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-xs"><Award size={14} className="text-purple-400" /> {item.techSpecs[0]}</span>
                 )}
                </div>

                {/* Genres & Actions */}
                <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {(item.genres || []).map(g => (
                            <span key={g} className="px-4 py-1.5 bg-gradient-to-r from-white/10 to-white/5 border border-white/5 rounded-full text-sm text-slate-200 hover:bg-white/10 hover:border-white/10 transition-all cursor-default">
                            {g}
                            </span>
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-3">
                         {/* Watch Trailer Button */}
                         {item.trailerUrl && (
                             <button 
                                onClick={() => setShowTrailerModal(true)}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all duration-300 border backdrop-blur-md bg-white/10 border-white/10 text-white hover:bg-white/20 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                             >
                                <PlayCircle size={18} />
                                Watch Trailer
                             </button>
                         )}

                        {/* Large Watchlist Button */}
                        <button 
                            onClick={() => toggleWatchlist(item)}
                            className={`
                                flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all duration-300 border backdrop-blur-md
                                ${inWatchlist 
                                    ? 'bg-accent/20 border-accent text-accent hover:bg-accent/30' 
                                    : 'bg-white/10 border-white/10 text-white hover:bg-white/20 hover:border-white/30'}
                            `}
                        >
                            {inWatchlist ? <Check size={18} /> : <Heart size={18} />}
                            {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                        </button>
                    </div>
                </div>

                {/* Next Episode Banner - Glossy Gradient */}
                {item.nextEpisode && (
                    <div className="mb-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-xl border border-white/5 p-1 rounded-2xl shadow-xl">
                    <div className="bg-slate-900/30 rounded-xl p-5 flex flex-col sm:flex-row gap-5 items-center justify-between">
                            <div className="flex gap-4 items-center">
                                <div className="p-3 bg-blue-600/80 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)] animate-pulse">
                                    <Clock className="text-white" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-blue-200 font-bold text-lg">Next Episode Arriving</h3>
                                    <p className="text-white font-medium">
                                        {formatDate(item.nextEpisode.airDate)} 
                                        {item.nextEpisode.episodeNumber && ` • Ep ${item.nextEpisode.episodeNumber}`}
                                    </p>
                                </div>
                            </div>
                            {item.nextEpisode.title && (
                                <div className="bg-black/40 px-5 py-2.5 rounded-xl text-sm text-blue-100 italic border border-white/10 shadow-inner">
                                    "{item.nextEpisode.title}"
                                </div>
                            )}
                    </div>
                    </div>
                )}

                {/* Content Advisory - Glass Alert */}
                {item.contentAdvisory && (
                    <div className="mb-8 bg-red-900/10 backdrop-blur-xl border border-red-500/10 p-4 rounded-2xl flex gap-4 items-start shadow-lg">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <Info className="text-red-400" size={20} />
                        </div>
                        <div>
                            <h3 className="text-red-300 font-semibold text-sm mb-1">Content Certification</h3>
                            <p className="text-slate-300 text-sm leading-relaxed opacity-90">{item.contentAdvisory}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 shadow-xl">
                        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                            Storyline
                        </h2>
                        <p className="text-slate-300 leading-relaxed text-lg font-light">
                        {item.description || "No description available."}
                        </p>
                    </div>

                    {/* Seasons Section for TV Shows/Anime */}
                    {isSeries && item.seasons && item.seasons.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold pl-2 flex items-center gap-2 text-slate-200">
                            Episodes & Seasons
                            </h2>
                            <div className="flex flex-col gap-4">
                                {item.seasons.map((season) => (
                                    <div key={season.seasonNumber} className="bg-gradient-to-br from-white/10 to-transparent backdrop-blur-2xl border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:bg-white/5 hover:border-white/10 shadow-lg">
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
                                                {loadingEpisodes && !episodesCache[season.seasonNumber] ? (
                                                    <div className="flex justify-center py-8">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                                    </div>
                                                ) : episodesCache[season.seasonNumber] && episodesCache[season.seasonNumber].length > 0 ? (
                                                    <div className="space-y-2">
                                                        {episodesCache[season.seasonNumber].map((ep) => (
                                                            <div key={ep.episodeNumber} className="flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5">
                                                                <div className="text-slate-600 font-mono text-xl font-bold w-8 shrink-0 flex items-start justify-center pt-1 group-hover:text-primary/50 transition-colors">
                                                                    {ep.episodeNumber}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex flex-wrap justify-between items-start mb-1 gap-2">
                                                                        <h5 className="font-bold text-slate-200 group-hover:text-white transition-colors">{ep.title}</h5>
                                                                        <span className="text-xs bg-black/40 border border-white/10 px-2 py-1 rounded text-slate-300 flex items-center gap-1 whitespace-nowrap">
                                                                            <Star size={10} className="text-yellow-500" fill="currentColor" /> {ep.rating}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-500 mb-2">{formatDate(ep.airDate)}</p>
                                                                    <p className="text-sm text-slate-400 leading-relaxed">
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
                <div className="mt-16 pt-8 border-t border-white/10">
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

        {/* Trailer Modal */}
        {showTrailerModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
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