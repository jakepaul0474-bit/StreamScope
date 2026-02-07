import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, ShieldAlert, ImageOff, Heart, X, Users, Globe, Film, PlayCircle, MonitorPlay, Zap, Volume2, Layers, ChevronDown, ShieldCheck, Clapperboard, Monitor, ExternalLink, Speaker, Play, AlertTriangle, Hash, Cpu, Radio, HardDrive, Share2, Settings, Scan, Activity, Binary, Terminal, Database, Fingerprint } from 'lucide-react';
import { MediaItem, MediaType, Episode } from '../types';
import { fetchMediaDetails, fetchRecommendations, fetchSeasonEpisodes, fetchTrailerUrl } from '../services/geminiService';
import MediaCard from './MediaCard';
import { useWatchlist } from '../hooks/useWatchlist';
import { useMediaContext } from '../context/MediaContext';

// Cyberpunk Aesthetic Configuration
const CP = {
    clips: {
        // Chamfered corners for panels
        panel: { clipPath: "polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)" },
        panelRev: { clipPath: "polygon(5% 0, 100% 0, 100% 100%, 0 100%, 0 15%)" },
        // Angled buttons
        buttonLeft: { clipPath: "polygon(0 0, 100% 0, 95% 100%, 0 100%)" },
        buttonRight: { clipPath: "polygon(5% 0, 100% 0, 100% 100%, 0 100%)" },
        tag: { clipPath: "polygon(0 0, 100% 0, 90% 100%, 0 100%)" }
    }
};

// Animated Data Stream Component
const DataStream: React.FC<{ className?: string; color?: string }> = ({ className, color }) => {
    const [data, setData] = useState('');
    useEffect(() => {
        const chars = '01AFX9';
        const interval = setInterval(() => {
            setData(Array(8).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join(''));
        }, 120);
        return () => clearInterval(interval);
    }, []);
    return <div className={`font-mono text-[10px] tracking-widest opacity-60 ${className}`} style={{ color: color }}>{data}</div>;
};

// Cybernetic Arm Interface Component
const CyberArmInterface: React.FC<{ color: string }> = ({ color }) => {
    return (
        <div className="relative h-24 w-full border border-white/10 mb-6 bg-black/40 overflow-hidden flex items-center justify-between px-6 select-none transition-all hover:bg-black/60"
             style={{
                 borderColor: `${color}30`,
                 clipPath: "polygon(0 0, 100% 0, 100% 75%, 98% 100%, 0 100%)",
                 boxShadow: `inset 0 0 20px ${color}05`
             }}>
             {/* Background Grid */}
             <div className="absolute inset-0 opacity-5 pointer-events-none"
                  style={{ backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`, backgroundSize: '30px 30px' }}>
             </div>

             {/* Left: Schematic Icon */}
             <div className="flex items-center gap-4 relative z-10">
                 <div className="relative w-12 h-12 border border-white/10 rounded-full flex items-center justify-center group">
                     <div className="absolute inset-0 border-t border-l border-transparent animate-[spin_3s_linear_infinite]" style={{ borderTopColor: color, borderLeftColor: color, borderRadius: '50%' }}></div>
                     <div className="absolute inset-2 border-b border-r border-transparent animate-[spin_2s_linear_infinite_reverse]" style={{ borderBottomColor: color, borderRightColor: color, borderRadius: '50%', opacity: 0.5 }}></div>
                     <Activity size={20} style={{ color: color }} className="animate-pulse" />
                 </div>
                 <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-orbitron font-bold text-cp-red tracking-widest">NEURAL_LINK</span>
                     <div className="flex gap-0.5">
                         {[...Array(8)].map((_, i) => (
                             <div key={i} className="w-1 h-1.5 bg-slate-800">
                                 <div className="w-full h-full animate-[pulse_1s_infinite]" style={{ backgroundColor: color, animationDelay: `${i * 0.1}s`, opacity: Math.random() > 0.5 ? 1 : 0.3 }}></div>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>

             {/* Middle: Abstract Arm Lines */}
             <div className="hidden md:flex flex-1 items-center justify-center gap-2 opacity-30 mx-8">
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20"></div>
                  <div className="text-[8px] font-mono whitespace-nowrap text-cp-yellow">/// SYNAPTIC_TRANSFER ///</div>
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20"></div>
             </div>

             {/* Right: Data Readouts */}
             <div className="text-right flex flex-col items-end relative z-10">
                 <div className="text-[9px] font-mono text-cp-yellow mb-1 flex items-center gap-2">
                     STATUS: <span className="animate-pulse text-cp-red">ONLINE</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <span className="text-[9px] font-mono text-cp-yellow">CPU</span>
                     <div className="w-16 h-1 bg-slate-800 relative overflow-hidden">
                         <div className="absolute top-0 left-0 h-full animate-[width_2s_ease-in-out_infinite]" style={{ backgroundColor: color, width: '45%' }}></div>
                     </div>
                 </div>
                 <div className="flex items-center gap-2 mt-1">
                     <span className="text-[9px] font-mono text-cp-yellow">MEM</span>
                     <div className="w-16 h-1 bg-slate-800 relative overflow-hidden">
                         <div className="absolute top-0 left-0 h-full animate-[width_3s_ease-in-out_infinite]" style={{ backgroundColor: color, width: '72%' }}></div>
                     </div>
                 </div>
                 <DataStream className="text-[8px] mt-1 opacity-50" color={color} />
             </div>
        </div>
    );
};

const PlatformLogo: React.FC<{ platform: string; className?: string; color: string }> = ({ platform, className = "w-6 h-6", color }) => {
    const { visualStyles } = useMediaContext();
    const [imgSrc, setImgSrc] = useState<string>('');
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const p = platform.toLowerCase().replace(/[^a-z0-9]/g, '');
        let domain = '';
        
        if (p.includes('netflix')) domain = 'netflix.com';
        else if (p.includes('prime') || p.includes('amazon')) domain = 'primevideo.com';
        else if (p.includes('disney')) domain = 'disneyplus.com';
        else if (p.includes('hulu')) domain = 'hulu.com';
        else if (p.includes('hbo') || p.includes('max')) domain = 'max.com';
        else if (p.includes('apple') || p.includes('itunes')) domain = 'apple.com';
        else if (p.includes('peacock')) domain = 'peacocktv.com';
        else if (p.includes('paramount')) domain = 'paramountplus.com';
        else if (p.includes('crunchyroll')) domain = 'crunchyroll.com';
        else if (p.includes('youtube')) domain = 'youtube.com';
        else if (p.includes('google')) domain = 'play.google.com';
        
        if (domain) {
            setImgSrc(`https://logo.clearbit.com/${domain}`);
            setHasError(false);
        } else {
            setHasError(true);
        }
    }, [platform]);

    const handleError = () => {
        if (imgSrc.includes('clearbit')) {
             const domain = imgSrc.split('/').pop();
             setImgSrc(`https://unavatar.io/${domain}?fallback=false`);
        } else {
            setHasError(true);
        }
    };

    if (hasError) return (
        <div 
            className={`flex items-center justify-center border transition-transform duration-300 hover:scale-110 ${className}`} 
            style={{ ...visualStyles.panel, borderColor: `${color}40` }}
            title={platform}
        >
            <span className="text-[6px] font-orbitron uppercase tracking-tighter leading-none text-center" style={{ color }}>{platform.substring(0, 2)}</span>
        </div>
    );

    return (
        <div 
            className={`p-[2px] border border-white/10 hover:border-opacity-100 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_10px_var(--glow-color)] ${className}`}
            style={{ ...visualStyles.panel, '--hover-color': color, '--glow-color': `${color}40` } as React.CSSProperties}
        >
             <style>{`.hover\\:border-opacity-100:hover { border-color: ${color} !important; }`}</style>
             <img src={imgSrc} alt={platform} className="w-full h-full object-contain grayscale hover:grayscale-0 transition-all" onError={handleError} />
        </div>
    );
};

const EpisodeImage: React.FC<{ ep: Episode; title: string; season: number; color: string }> = ({ ep, title, season, color }) => {
    const { visualStyles } = useMediaContext();
    const [src, setSrc] = useState(ep.stillUrl || `https://tse2.mm.bing.net/th?q=${encodeURIComponent(title + " S" + season + " E" + ep.episodeNumber + " scene")}&w=400&h=225&c=7&rs=1&p=0`);
    const [error, setError] = useState(false);
    return (
        <div 
            className="w-24 md:w-32 aspect-video relative overflow-hidden shrink-0 border-l-2 transition-all duration-300 group-hover:border-opacity-100 group-hover:shadow-[0_0_15px_var(--glow-color)]" 
            style={{ ...visualStyles.panel, borderColor: `${color}50`, '--glow-color': `${color}20` } as React.CSSProperties}
        >
             <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.5)_1px,transparent_1px)] bg-[length:100%_4px] pointer-events-none z-10 opacity-30"></div>
            {error && !src ? <ImageOff size={16} className="opacity-10" /> : <img src={src} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110" alt={ep.title} onError={() => setError(true)} />}
        </div>
    );
};

const DetailsView: React.FC = () => {
    const { type, title } = useParams<{ type: string; title: string }>();
    const navigate = useNavigate();
    const { isInWatchlist, toggleWatchlist } = useWatchlist();
    const { visualStyles, settings } = useMediaContext();
    const [item, setItem] = useState<MediaItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
    const [activeSeason, setActiveSeason] = useState<number>(1);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loadingEpisodes, setLoadingEpisodes] = useState(false);
    const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
    const [showTrailer, setShowTrailer] = useState(false);
    const [imgSrc, setImgSrc] = useState<string>('');
    const [isEpisodesExpanded, setIsEpisodesExpanded] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!title || !type) return;
            setLoading(true);
            try {
                const details = await fetchMediaDetails(decodeURIComponent(title), type);
                setItem(details);
                if (details) {
                    fetchRecommendations(details.title, details.type).then(setRecommendations);
                    if (details.type !== MediaType.MOVIE && details.seasons?.length) {
                        setActiveSeason(details.seasons[0].seasonNumber);
                        loadEpisodes(details.title, details.seasons[0].seasonNumber);
                    }
                }
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        load();
    }, [title, type]);

    useEffect(() => {
        if (!item) return;
        if (item.posterUrl) {
            setImgSrc(item.posterUrl);
        } else {
            setImgSrc(`https://tse2.mm.bing.net/th?q=${encodeURIComponent(item.title + " " + item.year + " official poster")}&w=400&h=600&c=7&rs=1&p=0`);
        }
    }, [item]);

    // -- ADAPTIVE COLOR LOGIC --
    const themeColor = useMemo(() => {
        if (!item?.genres) return '#00F0FF';
        const genres = item.genres.map(g => g.toLowerCase());
        
        // RED: Intense, Danger, Action
        if (genres.some(g => ['action', 'horror', 'war', 'crime'].includes(g))) return '#FF003C';
        
        // CYAN: Tech, Future, Magic
        if (genres.some(g => ['sci-fi', 'science fiction', 'fantasy', 'animation', 'anime', 'adventure'].includes(g))) return '#00F0FF';
        
        // YELLOW: Energy, Light, Human
        if (genres.some(g => ['comedy', 'drama', 'romance', 'family', 'music'].includes(g))) return '#FCEE0A';
        
        // PURPLE: Mystery, Thriller
        if (genres.some(g => ['mystery', 'thriller'].includes(g))) return '#b026ff';
        
        return '#00F0FF';
    }, [item]);

    const loadEpisodes = async (t: string, s: number) => {
        setLoadingEpisodes(true);
        try { const eps = await fetchSeasonEpisodes(t, s); setEpisodes(eps); } catch (e) { console.error(e); } finally { setLoadingEpisodes(false); }
    };

    const openImdb = () => {
        if (!item) return;
        const url = item.imdbId ? `https://www.imdb.com/title/${item.imdbId}` : `https://www.imdb.com/find?q=${encodeURIComponent(item.title)}`;
        window.open(url, '_blank');
    };

    // Prepare Glitch Config
    const glitchIntensity = settings.glitchIntensity || 0;
    const isGlitchActive = glitchIntensity > 0;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-transparent font-orbitron pl-0 md:pl-20 lg:pl-64 transition-all duration-300">
            <div className="flex flex-col items-center gap-4 relative">
                <div className="absolute inset-0 bg-[#FCEE0A] blur-3xl opacity-10"></div>
                <div className="text-[#FCEE0A] text-2xl font-black tracking-[0.2em] animate-pulse">ESTABLISHING LINK...</div>
                <div className="w-64 h-2 bg-[#2a2a2a] relative overflow-hidden clip-path-polygon-[0_0,100%_0,95%_100%,0%_100%]">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent animate-shimmer"></div>
                    <div className="h-full bg-[#00F0FF] w-1/3 animate-progress"></div>
                </div>
                <div className="font-mono text-xs text-[#00F0FF] mt-2 flex gap-4">
                     <span>B: <DataStream className="inline" color="#00F0FF" /></span>
                     <span>H: <DataStream className="inline" color="#00F0FF" /></span>
                </div>
            </div>
        </div>
    );

    if (!item) return <div className="min-h-screen flex items-center justify-center bg-transparent text-[#FF003C] font-orbitron text-2xl tracking-widest font-bold pl-0 md:pl-20 lg:pl-64 transition-all duration-300">SYSTEM_FAILURE // DATA_LOST</div>;

    const inList = isInWatchlist(item.id);
    const rating = Number(item.imdbRating || 0).toFixed(1);

    const metadataItems = [
        { icon: <Star size={10} />, value: rating, label: "RATING" },
        { icon: <Calendar size={10} />, value: item.releaseDate || item.year, label: "RELEASE" },
        { icon: <Globe size={10} />, value: item.country?.split(',')[0] || 'INTL', label: "REGION" },
        { icon: <Radio size={10} />, value: item.audioType?.split(' ')[0] || 'Unk', label: "AUDIO" },
        { icon: <Layers size={10} />, value: item.type === MediaType.SHOW ? 'SERIES' : 'MOVIE', label: "TYPE" },
        { icon: <ShieldAlert size={10} />, value: item.maturityRating || 'NR', label: "CLASS" }
    ];

    const techSpecs = [
        { icon: <MonitorPlay size={12} />, val: '4K_UHD', label: "RES" },
        { icon: <Speaker size={12} />, val: 'DOLBY', label: "AUDIO" },
        { icon: <Zap size={12} />, val: 'HDR10+', label: "COLOR" },
        { icon: <Clapperboard size={12} />, val: '2.39:1', label: "RATIO" }
    ];

    return (
        <div className="min-h-screen bg-transparent text-[#e0e0e0] relative pb-20 font-rajdhani selection:text-black overflow-x-hidden pl-0 md:pl-20 lg:pl-64 transition-all duration-300" 
             style={{ '--glow-color': themeColor } as React.CSSProperties}>
            <style>{`::selection { background-color: ${themeColor}; color: black; }`}</style>
            
            {/* DYNAMIC CYBERPUNK STYLES */}
            <style>{`
                .hover-glow { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .hover-glow:hover {
                    box-shadow: 0 0 15px ${themeColor}50, inset 0 0 10px ${themeColor}10;
                    border-color: ${themeColor} !important;
                    color: ${themeColor} !important;
                    text-shadow: 0 0 8px ${themeColor}80;
                }
                .hover-glow svg { transition: stroke 0.3s ease; }
                .hover-glow:hover svg { stroke: ${themeColor}; }
                
                .hover-glow-subtle { transition: all 0.3s ease; }
                .hover-glow-subtle:hover {
                    border-color: ${themeColor}80 !important;
                    box-shadow: 0 0 15px ${themeColor}20;
                    transform: translateY(-2px);
                }

                .active-press:active {
                    transform: scale(0.96);
                }

                .animate-slide-up { animation: slideUp 0.5s ease-out forwards; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                /* === BORDER PULSE ANIMATIONS === */
                @keyframes cyber-pulse-border {
                    0%, 100% { border-color: ${themeColor}30; box-shadow: 0 0 0 transparent; }
                    50% { border-color: ${themeColor}80; box-shadow: 0 0 10px ${themeColor}20; }
                }

                .cyber-border-pulse {
                    animation: cyber-pulse-border 4s infinite ease-in-out;
                }

                .cyber-border-pulse:hover {
                    animation-play-state: paused;
                }

                .cyber-btn-pulse {
                    animation: cyber-pulse-border 2s infinite ease-in-out;
                }

                .cyber-btn-pulse:hover {
                     animation-play-state: paused;
                }

                /* === HOLOGRAPHIC TEXT ANIMATION === */
                @keyframes holo-flicker {
                    0%, 100% { opacity: 1; text-shadow: 0 0 10px ${themeColor}, 0 0 2px ${themeColor}; transform: skew(0deg); }
                    33% { opacity: 0.9; text-shadow: 0 0 5px ${themeColor}, 0 0 0px transparent; transform: skew(0deg); }
                    66% { opacity: 1; text-shadow: 0 0 10px ${themeColor}, 0 0 2px ${themeColor}; transform: skew(0deg); }
                    
                    /* Glitch Jitter */
                    95% { opacity: 1; transform: skew(0deg); }
                    96% { opacity: 0.8; transform: skew(-2deg); text-shadow: 2px 0 0 ${themeColor}, -2px 0 0 #fff; }
                    97% { opacity: 1; transform: skew(0deg); }
                }

                .holo-text {
                    color: ${themeColor};
                    animation: holo-flicker 4s infinite linear;
                    position: relative;
                    display: inline-block;
                }
                
                /* Scanline overlay for text */
                .holo-text::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.2) 51%);
                    background-size: 100% 3px;
                    pointer-events: none;
                }

                /* === DYNAMIC GLITCH EFFECTS === */
                ${isGlitchActive ? `
                    .cyber-glitch-active {
                        position: relative;
                        display: inline-block;
                    }
                    .cyber-glitch-active::before,
                    .cyber-glitch-active::after {
                        content: attr(data-text);
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        opacity: ${Math.min(0.8, glitchIntensity + 0.3)};
                        background: transparent;
                    }
                    .cyber-glitch-active::before {
                        color: #00F0FF;
                        z-index: -1;
                        transform: translate(-${glitchIntensity * 2}px, 0);
                        animation: glitch-anim-1 ${3 / Math.max(0.1, glitchIntensity)}s infinite linear alternate-reverse;
                    }
                    .cyber-glitch-active::after {
                        color: #FF003C;
                        z-index: -2;
                        transform: translate(${glitchIntensity * 2}px, 0);
                        animation: glitch-anim-2 ${2 / Math.max(0.1, glitchIntensity)}s infinite linear alternate-reverse;
                    }
                    
                    @keyframes glitch-anim-1 {
                        0% { clip-path: inset(0 0 0 0); }
                        5% { clip-path: inset(10% 0 80% 0); }
                        10% { clip-path: inset(0 0 0 0); }
                        100% { clip-path: inset(0 0 0 0); }
                    }
                    @keyframes glitch-anim-2 {
                        0% { clip-path: inset(0 0 0 0); }
                        15% { clip-path: inset(80% 0 5% 0); }
                        20% { clip-path: inset(0 0 0 0); }
                        100% { clip-path: inset(0 0 0 0); }
                    }
                    
                    /* Button Glitch Hover */
                    .btn-cyber-glitch:hover {
                        animation: btn-glitch-pulse 0.2s infinite;
                        text-shadow: ${glitchIntensity * 2}px 0 #00F0FF, -${glitchIntensity * 2}px 0 #FF003C;
                        border-color: ${themeColor} !important;
                    }
                    
                    @keyframes btn-glitch-pulse {
                        0% { transform: skew(0deg); }
                        25% { transform: skew(-${glitchIntensity * 5}deg); }
                        75% { transform: skew(${glitchIntensity * 5}deg); }
                        100% { transform: skew(0deg); }
                    }
                ` : ''}
            `}</style>

            {/* Background Artifacts (Dynamic Color) */}
            <div className="fixed top-20 right-10 w-96 h-96 border rounded-full animate-[spin_20s_linear_infinite] border-t-transparent border-l-transparent pointer-events-none z-0 opacity-20" style={{ borderColor: `${themeColor}20` }}></div>
            <div className="fixed bottom-20 left-10 md:left-24 lg:left-72 w-64 h-64 border rotate-45 pointer-events-none z-0 opacity-20" style={{ borderColor: `${themeColor}20` }}></div>
            
            {/* Header */}
            <div 
                className="fixed top-0 right-0 z-50 border-b px-6 py-4 flex items-center justify-between backdrop-blur-md transition-all duration-300 left-0 md:left-20 lg:left-64"
                style={{ ...visualStyles.panel, ...visualStyles.border }}
            >
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="group relative px-6 py-2 border transition-all duration-300 hover-glow active-press btn-cyber-glitch"
                        style={{ ...visualStyles.panel, ...visualStyles.border, ...CP.clips.tag, borderColor: `${themeColor}60` }}
                    >
                        <div className="flex items-center gap-3">
                            <ArrowLeft size={16} className="text-white group-hover:text-[var(--theme-color)]" style={{ '--theme-color': themeColor } as React.CSSProperties} />
                            <span className="font-orbitron text-xs font-bold text-white group-hover:text-[var(--theme-color)] tracking-[0.2em]" style={{ '--theme-color': themeColor } as React.CSSProperties}>BACK</span>
                        </div>
                    </button>
                    
                    <div className="hidden md:flex items-center gap-4">
                        <div className="w-[1px] h-6 bg-white/20"></div>
                         <h1 
                            className={`font-orbitron font-black text-xl text-cp-yellow tracking-[0.1em] uppercase truncate max-w-md cursor-default ${isGlitchActive ? 'cyber-glitch-active' : 'group'}`}
                            data-text={item.title}
                         >
                            {isGlitchActive ? item.title : <span className="group-hover:animate-glitch inline-block">{item.title}</span>}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status Artifact */}
                    <div className="hidden lg:flex flex-col items-end mr-4">
                        <div className="flex items-center gap-2 text-[9px] font-mono animate-pulse" style={{ color: themeColor }}>
                            <Activity size={10} /> LINK_ESTABLISHED
                        </div>
                        <DataStream className="text-right" color={themeColor} />
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => navigate('/settings')} 
                            className="p-3 border border-transparent transition-all duration-300 text-slate-400 hover-glow active-press btn-cyber-glitch"
                            style={{ ...visualStyles.panel, ...visualStyles.border }}
                        >
                            <Settings size={18} />
                        </button>
                        <button 
                            onClick={() => toggleWatchlist(item)} 
                            className={`relative p-3 border transition-all duration-300 active-press btn-cyber-glitch ${inList ? 'bg-opacity-10 shadow-[0_0_15px_var(--glow)]' : 'text-slate-400 hover-glow'}`}
                            style={{ 
                                ...visualStyles.panel, 
                                ...CP.clips.tag,
                                borderColor: inList ? themeColor : 'rgba(255,255,255,0.2)',
                                color: inList ? themeColor : undefined,
                                backgroundColor: inList ? `${themeColor}1a` : undefined,
                                '--glow': `${themeColor}40`
                            } as React.CSSProperties}
                        >
                            <Heart size={18} fill={inList ? "currentColor" : "none"} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="relative z-10 pt-24 px-4 md:px-12 lg:px-20 max-w-7xl mx-auto flex flex-col gap-8 animate-slide-up">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Holo Poster */}
                    <div className="lg:col-span-3">
                        <div className="relative group">
                            {/* Scanline Overlay (Dynamic) */}
                            <div className="absolute inset-0 z-20 pointer-events-none h-[15%] w-full animate-scan opacity-50 group-hover:opacity-100"
                                 style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${themeColor}33, transparent)` }}></div>
                            
                            {/* Decorative Corners */}
                            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 z-20" style={{ borderColor: themeColor }}></div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 z-20" style={{ borderColor: themeColor }}></div>
                            
                            {/* Holo Projector Base */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] z-30"
                                 style={{ backgroundColor: themeColor, boxShadow: `0 0 20px ${themeColor}` }}></div>
                            
                            <div className="aspect-[2/3] bg-transparent relative overflow-hidden border transition-colors" 
                                style={{ ...visualStyles.border, ...visualStyles.glow, borderColor: `${themeColor}40`, boxShadow: `0 0 15px ${themeColor}20`, clipPath: "polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)" }}>
                                <img src={imgSrc} alt={item.title} className="w-full h-full object-cover transition-all duration-700 opacity-90 group-hover:opacity-100" />
                                {/* Grid Overlay */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.8)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none opacity-20"></div>
                            </div>
                            
                            <div className="mt-2 flex justify-between items-center text-[9px] font-mono text-slate-500">
                                <span>IMG_ID: {item.id.substring(0,6).toUpperCase()}</span>
                                <Scan size={12} style={{ color: themeColor }} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: 2x2 Grid + Details */}
                    <div className="lg:col-span-9 flex flex-col gap-6 relative">
                        {/* PCB Connecting Lines (Decoration) */}
                        <div className="absolute top-[70px] left-1/2 -translate-x-1/2 w-px h-10 bg-white/10 hidden md:block"></div>
                        <div className="absolute top-[140px] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full blur-md opacity-20 hidden md:block" style={{ backgroundColor: themeColor }}></div>

                        {/* 2x2 Grid System */}
                        <div className="grid grid-cols-2 gap-3 w-full">
                            
                            {/* Box 1: Metadata */}
                            <div className="border p-3 relative group flex flex-col min-h-[140px] hover-glow-subtle cyber-border-pulse" 
                                style={{ ...visualStyles.panel, ...visualStyles.border, ...CP.clips.panel }}>
                                <div className="absolute top-0 right-0 w-12 h-1" style={{ backgroundColor: themeColor }}></div>
                                <div className="flex items-center gap-1.5 mb-2 opacity-90 border-b border-white/5 pb-1 justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Hash size={10} style={{ color: themeColor }} />
                                        <span className="text-[10px] font-orbitron font-bold tracking-[0.2em] text-cp-red">METADATA</span>
                                    </div>
                                    <div className="w-1.5 h-1.5 animate-pulse" style={{ backgroundColor: themeColor }}></div>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2 gap-x-1 flex-1 content-start">
                                    {metadataItems.map((m, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 overflow-hidden group/item">
                                            <span className="opacity-80 shrink-0 group-hover/item:scale-110 transition-transform" style={{ color: themeColor }}>{m.icon}</span>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-orbitron tracking-wider leading-none mb-0.5 opacity-80 text-cp-yellow">{m.label}</span>
                                                <span className="text-[13px] font-bold text-cp-cyan tracking-wide truncate leading-none font-rajdhani">{m.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Box 2: Tech Specs */}
                            <div className="border p-3 relative group flex flex-col min-h-[140px] hover-glow-subtle cyber-border-pulse" 
                                style={{ ...visualStyles.panel, ...visualStyles.border, ...CP.clips.panelRev }}>
                                <div className="absolute top-0 left-0 w-12 h-1" style={{ backgroundColor: themeColor }}></div>
                                <div className="flex items-center gap-1.5 mb-2 opacity-90 border-b border-white/5 pb-1 justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Cpu size={10} style={{ color: themeColor }} />
                                        <span className="text-[10px] font-orbitron font-bold tracking-[0.2em] text-cp-red">TECH_SPECS</span>
                                    </div>
                                    <Database size={10} className="opacity-50" style={{ color: themeColor }} />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-2 gap-x-1 flex-1 content-start">
                                     {techSpecs.map((s, i) => (
                                        <div key={i} className="flex items-center gap-1.5 overflow-hidden">
                                            <span className="opacity-80 shrink-0" style={{ color: themeColor }}>{s.icon}</span>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-orbitron tracking-wider leading-none mb-0.5 opacity-80 text-cp-yellow">{s.label}</span>
                                                <span className="text-[13px] font-bold text-cp-cyan font-rajdhani tracking-wider truncate">{s.val}</span>
                                            </div>
                                        </div>
                                     ))}
                                </div>
                            </div>

                            {/* Box 3: Actions (Trailer & IMDb) */}
                            <div className="border p-3 relative flex flex-col justify-between gap-2 min-h-[100px] hover-glow-subtle"
                                style={{ ...visualStyles.panel, ...visualStyles.border }}>
                                <div className="absolute bottom-0 left-0 w-full h-[1px] opacity-50" style={{ background: `linear-gradient(to right, ${themeColor}, transparent)` }}></div>
                                <div className="flex items-center gap-1.5">
                                    <Play size={10} style={{ color: themeColor }} />
                                    <span className="text-[10px] font-orbitron font-bold text-cp-red uppercase tracking-widest">ACTIONS</span>
                                </div>
                                
                                <div className="flex gap-2 h-full items-end">
                                    <button 
                                        onClick={async () => { const u = await fetchTrailerUrl(item.title, item.type); if (u) { setTrailerUrl(u); setShowTrailer(true); } }} 
                                        className="flex-1 h-8 text-black font-orbitron font-black tracking-widest text-[9px] flex items-center justify-center gap-1 hover:bg-white transition-all duration-300 hover:scale-[1.02] active-press relative overflow-hidden group btn-cyber-glitch cyber-btn-pulse"
                                        style={{ ...CP.clips.buttonLeft, backgroundColor: themeColor, boxShadow: `0 0 10px ${themeColor}40` }}
                                    >
                                        <div className="absolute inset-0 bg-white/50 -translate-x-full group-hover:translate-x-full transition-transform duration-500 skew-x-12"></div>
                                        TRAILER
                                    </button>
                                    <button 
                                        onClick={openImdb} 
                                        className="flex-1 h-8 bg-transparent border font-orbitron font-bold tracking-widest text-[9px] flex items-center justify-center gap-1 transition-all duration-300 hover:scale-[1.02] hover-glow active-press btn-cyber-glitch cyber-btn-pulse"
                                        style={{ ...CP.clips.buttonRight, borderColor: `${themeColor}60`, color: themeColor }}
                                    >
                                        IMDb <ExternalLink size={10} />
                                    </button>
                                </div>
                            </div>

                            {/* Box 4: OTT Platforms */}
                            <div className="border p-3 relative flex flex-col min-h-[100px] hover-glow-subtle"
                                style={{ ...visualStyles.panel, ...visualStyles.border }}>
                                <div className="absolute bottom-0 right-0 w-full h-[1px] opacity-50" style={{ background: `linear-gradient(to left, ${themeColor}, transparent)` }}></div>
                                <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-1">
                                    <span className="text-[10px] font-orbitron font-bold text-cp-red uppercase tracking-widest">NETWORKS</span>
                                    <HardDrive size={10} style={{ color: themeColor }} />
                                </div>
                                <div className="flex flex-wrap gap-1.5 content-start overflow-hidden">
                                    {item.platforms?.length ? item.platforms.slice(0, 6).map(p => <PlatformLogo key={p} platform={p} className="w-6 h-6" color={themeColor} />) : <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-orbitron self-center mt-2">OFFLINE</span>}
                                </div>
                            </div>

                        </div>

                        {/* Synopsis Terminal */}
                        <div className="border-l-2 p-6 relative bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]"
                             style={{ ...visualStyles.panel, borderColor: themeColor }}>
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                    <Terminal size={14} style={{ color: themeColor }} />
                                    <span className="text-[11px] font-orbitron font-bold uppercase tracking-[0.2em] holo-text">PLOT_SUMMARY</span>
                                </div>
                                <div className="text-[9px] font-mono text-cp-yellow">LN: {item.description?.length || 0}</div>
                            </div>
                            <p className="text-cyan-400 text-base leading-7 font-rajdhani font-medium tracking-wide opacity-90 shadow-black drop-shadow-md">
                                {item.description ? <><span className="mr-2 opacity-70" style={{ color: themeColor }}>{'>>'}</span>{item.description}<span className="animate-pulse ml-1" style={{ color: themeColor }}>_</span></> : '>> ENCRYPTED_DATA // ACCESS_DENIED'}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-5">
                                {item.genres?.map(g => (
                                    <span key={g} 
                                        className="px-3 py-1 bg-white/5 border border-white/10 text-[9px] font-orbitron font-bold transition-colors cursor-default uppercase hover:bg-white/10 hover:text-white text-cp-yellow"
                                        style={{ borderColor: `${themeColor}40` }}
                                    >
                                        {g}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Content Advisory Section */}
                        {item.contentRatingDetails && item.contentRatingDetails.length > 0 && (
                            <div className="mt-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <ShieldCheck size={14} style={{ color: themeColor }} />
                                    <span className="text-[11px] font-orbitron font-bold uppercase tracking-[0.2em] holo-text">CONTENT_ADVISORY</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {item.contentRatingDetails.map((detail, idx) => (
                                        <div key={idx} className="border p-3 relative overflow-hidden group transition-all hover-glow-subtle"
                                             style={{ ...visualStyles.panel, ...visualStyles.border }}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-orbitron font-bold text-cp-yellow uppercase tracking-wider">{detail.category}</span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 border bg-black/50 backdrop-blur-sm ${
                                                    detail.severity === 'Severe' ? 'text-[#FF003C] border-[#FF003C]' :
                                                    detail.severity === 'Moderate' ? 'text-orange-400 border-orange-400' :
                                                    detail.severity === 'Mild' ? 'text-[#FCEE0A] border-[#FCEE0A]' :
                                                    'text-green-400 border-green-400'
                                                }`}>
                                                    {detail.severity}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-rose-300 font-rajdhani font-medium leading-relaxed">
                                                {detail.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cast Section with Face Recognition Reticles */}
                        <div className="border-t border-white/10 pt-6">
                            
                            {/* Inserted Cyber Arm Interface */}
                            <CyberArmInterface color={themeColor} />

                            <div className="flex items-center justify-between mb-5">
                                <div className="text-[11px] font-orbitron font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Fingerprint size={14} className="text-white" /> <span className="text-cp-red">BIOMETRIC_DATA // CAST</span>
                                </div>
                                <Binary size={14} className="text-white/20" />
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                {item.cast?.slice(0, 8).map((actor, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-2 group cursor-default relative">
                                        <div className="w-12 h-12 relative overflow-hidden border transition-all" 
                                             style={{ ...visualStyles.panel, ...visualStyles.border, clipPath: "polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)" }}>
                                            <style>{`.group:hover .border-reticle { border-color: ${themeColor} !important; }`}</style>
                                            <div className="border-reticle w-full h-full border border-transparent transition-colors">
                                                 <img src={`https://tse2.mm.bing.net/th?q=${encodeURIComponent(actor + " headshot")}&w=100&h=100&c=7&rs=1&p=0`} alt={actor} className="w-full h-full object-cover transition-all grayscale group-hover:grayscale-0" />
                                            </div>
                                            
                                            {/* Face ID Reticle Overlay (Dynamic) */}
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{ borderColor: themeColor }}></div>
                                                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r" style={{ borderColor: themeColor }}></div>
                                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l" style={{ borderColor: themeColor }}></div>
                                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{ borderColor: themeColor }}></div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-center font-bold text-cp-yellow font-orbitron leading-tight uppercase line-clamp-2 transition-colors group-hover:text-white"
                                        >
                                            {actor}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dropdowns (Episodes) */}
                <div className="space-y-4">
                    {item.type !== MediaType.MOVIE && item.seasons?.length && (
                        <div className="border relative overflow-hidden hover-glow-subtle"
                             style={{ ...visualStyles.panel, borderColor: `${themeColor}40` }}>
                            <button onClick={() => setIsEpisodesExpanded(!isEpisodesExpanded)} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 border bg-opacity-10" style={{ ...CP.clips.tag, borderColor: `${themeColor}40`, backgroundColor: `${themeColor}10`, color: themeColor }}><Film size={18} /></div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs font-orbitron font-bold uppercase tracking-[0.2em] text-cp-red">EPISODE_LIST</span>
                                        <span className="text-[8px] font-rajdhani font-bold uppercase tracking-widest text-cp-yellow">SEASON_BREAKDOWN</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <select 
                                            value={activeSeason} 
                                            onClick={(e) => e.stopPropagation()} 
                                            onChange={(e) => { const s = Number(e.target.value); setActiveSeason(s); loadEpisodes(item.title, s); }} 
                                            className="appearance-none border text-white text-[10px] font-orbitron font-bold uppercase pl-3 pr-8 py-2 outline-none"
                                            style={{ ...visualStyles.panel, ...visualStyles.border, borderColor: `${themeColor}40` }}
                                        >
                                            {item.seasons.map(s => <option key={s.seasonNumber} value={s.seasonNumber} className="bg-black">SEASON // {s.seasonNumber}</option>)}
                                        </select>
                                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                                    </div>
                                    <ChevronDown size={16} className={`text-slate-500 transition-transform ${isEpisodesExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            {isEpisodesExpanded && (
                                <div className="p-4 border-t border-white/5 relative">
                                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `linear-gradient(${themeColor} 1px, transparent 1px)`, backgroundSize: '100% 4px' }}></div>
                                    {loadingEpisodes ? <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 animate-spin" style={{ borderColor: `${themeColor}33`, borderTopColor: themeColor }}></div></div> : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                            {episodes.map(ep => (
                                                <div key={ep.episodeNumber} className="flex gap-4 p-3 border group hover:border-opacity-100 hover:bg-white/5 transition-all duration-300 hover-glow-subtle"
                                                     style={{ ...visualStyles.panel, borderColor: `${themeColor}20`, '--hover-border': themeColor } as React.CSSProperties}>
                                                    <style>{`.group:hover { border-color: ${themeColor} !important; }`}</style>
                                                    <EpisodeImage ep={ep} title={item.title} season={activeSeason} color={themeColor} />
                                                    <div className="flex flex-col justify-start gap-1 flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[9px] font-orbitron font-bold text-black px-1.5 py-0.5" style={{ backgroundColor: themeColor }}>E{ep.episodeNumber}</span>
                                                            <h4 className="text-[11px] font-bold text-cp-yellow font-orbitron line-clamp-1 uppercase tracking-wider truncate">{ep.title}</h4>
                                                        </div>
                                                        <p className="text-[11px] text-blue-300 leading-relaxed line-clamp-2 font-rajdhani font-medium opacity-80">{ep.overview || 'NO_DATA_AVAILABLE'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Recommendations */}
                <div className="mt-8 pt-8 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-6" style={{ backgroundColor: themeColor }}></div>
                        <span className="text-xs font-orbitron font-bold uppercase tracking-[0.3em] text-cp-red">RELATED_ENTRIES</span>
                    </div>
                    {recommendations?.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                            {recommendations.slice(0, 4).map(rec => <div key={rec.id} className="h-[240px] transition-all duration-500"><MediaCard item={rec} /></div>)}
                        </div>
                    ) : <div className="py-12 text-center text-[10px] font-orbitron font-bold text-slate-600 uppercase tracking-widest animate-pulse">Scanning Database...</div>}
                </div>
            </div>

            {/* Trailer Modal */}
            {showTrailer && trailerUrl && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(${themeColor}08 1px, transparent 1px)`, backgroundSize: '100% 4px' }}></div>
                    <button onClick={() => setShowTrailer(false)} className="absolute top-6 right-6 p-2 border border-transparent text-white transition-all group" style={{ '--hover-color': themeColor } as React.CSSProperties}>
                        <style>{`.group:hover { border-color: ${themeColor}; background-color: ${themeColor}20; }`}</style>
                        <X size={32} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                    <div className="w-full max-w-6xl aspect-video bg-black border-2 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative" style={{ borderColor: themeColor }}>
                         {/* Corner Accents */}
                         <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4" style={{ borderColor: themeColor }}></div>
                         <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4" style={{ borderColor: themeColor }}></div>
                        <iframe src={trailerUrl.includes('youtube') ? `https://www.youtube.com/embed/${trailerUrl.split('v=')[1]?.split('&')[0] || trailerUrl.split('/').pop()}?autoplay=1&modestbranding=1&rel=0` : trailerUrl} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen></iframe>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetailsView;