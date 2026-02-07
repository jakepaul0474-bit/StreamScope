import React, { useState, useEffect, useRef } from 'react';
import { 
  Filter, Search, ChevronDown, SlidersHorizontal, Check, Square, CheckSquare, Loader2, 
  Film, Tv, LayoutGrid, Zap, ArrowUpDown, Menu, Globe, Calendar, ShieldAlert, Layers, 
  ArrowRight, Tag, Star, AlertTriangle, Cast, Volume2, Sparkles, Monitor, Skull, X,
  TrendingUp, Users, Ticket, Crosshair, Compass, Smile, Siren, FileText, Home, 
  Scroll, Music, Heart, Cpu, Eye, Swords, Target, Play, Package, Command, 
  RectangleVertical, Feather, Disc, MapPin, Radio, Clapperboard, Ghost, 
  Thermometer, Rocket, Brain, GraduationCap, Coffee, Video, Palette, EyeOff, Pill, 
  MessageSquareWarning, Mic, MessageCircle, ThumbsUp, Shield, ShieldCheck, Trophy, Bot, Wifi,
  Globe2, Lock, Unlock, Clock, Biohazard
} from 'lucide-react';
import { FilterState, MediaType } from '../types';
import { useNavigate } from 'react-router-dom';
import { useMediaContext } from '../context/MediaContext';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  category: MediaType | 'All';
  isLoading: boolean;
}

// Helper for Country Codes
const CountryTag = ({ code }: { code: string }) => (
  <span className="text-[9px] font-mono font-bold border border-current px-1 py-0.5 rounded-[1px] opacity-80 tracking-tighter">{code}</span>
);

// Comprehensive Option Lists with Cyberpunk Icons
const sortOptions = [
    { v: 'trending', l: 'TRENDING', icon: <TrendingUp size={12} /> },
    { v: 'popular', l: 'POPULAR', icon: <Users size={12} /> },
    { v: 'rating', l: 'TOP RATED', icon: <Star size={12} /> },
    { v: 'newest', l: 'NEWEST', icon: <Calendar size={12} /> },
    { v: 'in_theaters', l: 'IN THEATERS', icon: <Ticket size={12} /> },
];

const genreOptions = [
    { v: 'All', l: 'ALL GENRES', icon: <LayoutGrid size={12} /> },
    { v: 'Action', l: 'ACTION', icon: <Crosshair size={12} /> },
    { v: 'Adventure', l: 'ADVENTURE', icon: <Compass size={12} /> },
    { v: 'Animation', l: 'ANIMATION', icon: <Layers size={12} /> },
    { v: 'Comedy', l: 'COMEDY', icon: <Smile size={12} /> },
    { v: 'Crime', l: 'CRIME', icon: <Siren size={12} /> },
    { v: 'Documentary', l: 'DOCS', icon: <FileText size={12} /> },
    { v: 'Drama', l: 'DRAMA', icon: <Clapperboard size={12} /> },
    { v: 'Family', l: 'FAMILY', icon: <Home size={12} /> },
    { v: 'Fantasy', l: 'FANTASY', icon: <Sparkles size={12} /> },
    { v: 'History', l: 'HISTORY', icon: <Scroll size={12} /> },
    { v: 'Horror', l: 'HORROR', icon: <Ghost size={12} /> },
    { v: 'Music', l: 'MUSIC', icon: <Music size={12} /> },
    { v: 'Mystery', l: 'MYSTERY', icon: <Search size={12} /> },
    { v: 'Romance', l: 'ROMANCE', icon: <Heart size={12} /> },
    { v: 'Sci-Fi', l: 'SCI-FI', icon: <Cpu size={12} /> },
    { v: 'Thriller', l: 'THRILLER', icon: <Eye size={12} /> },
    { v: 'War', l: 'WAR', icon: <Swords size={12} /> },
    { v: 'Western', l: 'WESTERN', icon: <Target size={12} /> },
];

const yearOptions = [
    { v: 'All', l: 'ALL TIME', icon: <Clock size={12} /> },
    { v: '2025', l: '2025', icon: <Calendar size={12} /> },
    { v: '2024', l: '2024', icon: <Calendar size={12} /> },
    { v: '2023', l: '2023', icon: <Calendar size={12} /> },
    { v: '2022', l: '2022', icon: <Calendar size={12} /> },
    { v: '2021', l: '2021', icon: <Calendar size={12} /> },
    { v: '2020', l: '2020', icon: <Calendar size={12} /> },
    { v: '2010s', l: '2010-2019', icon: <Calendar size={12} /> },
    { v: '2000s', l: '2000-2009', icon: <Calendar size={12} /> },
    { v: '1990s', l: '1990-1999', icon: <Calendar size={12} /> },
    { v: '1980s', l: '1980-1989', icon: <Calendar size={12} /> },
    { v: 'Classic', l: 'CLASSICS', icon: <Scroll size={12} /> },
];

const platformOptions = [
    { v: 'Netflix', l: 'NETFLIX', icon: <Tv size={12} /> },
    { v: 'Prime Video', l: 'PRIME', icon: <Package size={12} /> },
    { v: 'Disney+', l: 'DISNEY+', icon: <Sparkles size={12} /> },
    { v: 'Hulu', l: 'HULU', icon: <RectangleVertical size={12} /> },
    { v: 'Max', l: 'HBO MAX', icon: <Zap size={12} /> },
    { v: 'Apple TV+', l: 'APPLE TV+', icon: <Command size={12} /> },
    { v: 'Peacock', l: 'PEACOCK', icon: <Feather size={12} /> },
    { v: 'Crunchyroll', l: 'CRUNCHYROLL', icon: <Disc size={12} /> },
    { v: 'Paramount+', l: 'PARAMOUNT+', icon: <Video size={12} /> },
];

const regionOptions = [
    { v: 'All', l: 'GLOBAL', icon: <Globe2 size={12} /> },
    { v: 'United States', l: 'USA', icon: <CountryTag code="US" /> },
    { v: 'United Kingdom', l: 'UK', icon: <CountryTag code="UK" /> },
    { v: 'Japan', l: 'JAPAN', icon: <CountryTag code="JP" /> },
    { v: 'South Korea', l: 'KOREA', icon: <CountryTag code="KR" /> },
    { v: 'France', l: 'FRANCE', icon: <CountryTag code="FR" /> },
    { v: 'Germany', l: 'GERMANY', icon: <CountryTag code="DE" /> },
    { v: 'Spain', l: 'SPAIN', icon: <CountryTag code="ES" /> },
    { v: 'India', l: 'INDIA', icon: <CountryTag code="IN" /> },
    { v: 'Canada', l: 'CANADA', icon: <CountryTag code="CA" /> },
    { v: 'Australia', l: 'AUSTRALIA', icon: <CountryTag code="AU" /> },
    { v: 'Brazil', l: 'BRAZIL', icon: <CountryTag code="BR" /> },
];

const audioOptions = [
    { v: 'All', l: 'ANY AUDIO', icon: <Volume2 size={12} /> },
    { v: 'Sub', l: 'SUBTITLED', icon: <FileText size={12} /> },
    { v: 'Dub', l: 'DUBBED', icon: <Mic size={12} /> },
    { v: 'Native', l: 'NATIVE', icon: <MessageCircle size={12} /> },
];

const ratingOptions = [
    { v: 'All', l: 'ANY RATING', icon: <Star size={12} /> },
    { v: '9', l: '9+ MASTERPIECE', icon: <Trophy size={12} /> },
    { v: '8', l: '8+ GREAT', icon: <Star size={12} /> },
    { v: '7', l: '7+ GOOD', icon: <ThumbsUp size={12} /> },
    { v: '6', l: '6+ OKAY', icon: <Check size={12} /> },
];

const maturityOptions = [
    { v: 'All', l: 'ALL AGES', icon: <ShieldCheck size={12} /> },
    { v: 'TV-MA', l: 'MATURE (TV-MA)', icon: <ShieldAlert size={12} /> },
    { v: 'R', l: 'RESTRICTED (R)', icon: <Lock size={12} /> },
    { v: 'PG-13', l: 'TEEN (PG-13)', icon: <Shield size={12} /> },
    { v: 'TV-14', l: 'TV-14', icon: <Shield size={12} /> },
    { v: 'PG', l: 'PG', icon: <Unlock size={12} /> },
    { v: 'G', l: 'GENERAL', icon: <Check size={12} /> },
];

const animeFormatOptions = [
    { v: 'All', l: 'ALL FORMATS', icon: <Layers size={12} /> },
    { v: 'TV Series', l: 'TV SERIES', icon: <Tv size={12} /> },
    { v: 'Movie', l: 'MOVIE', icon: <Film size={12} /> },
    { v: 'OVA', l: 'OVA', icon: <Disc size={12} /> },
    { v: 'ONA', l: 'ONA', icon: <Wifi size={12} /> },
    { v: 'Special', l: 'SPECIAL', icon: <Star size={12} /> },
];

const themeOptions = [
    { v: 'All', l: 'ALL THEMES', icon: <Sparkles size={12} /> },
    { v: 'Cyberpunk', l: 'CYBERPUNK', icon: <Cpu size={12} /> },
    { v: 'Dystopian', l: 'DYSTOPIAN', icon: <AlertTriangle size={12} /> },
    { v: 'Space', l: 'SPACE', icon: <Rocket size={12} /> },
    { v: 'Supernatural', l: 'SUPERNATURAL', icon: <Ghost size={12} /> },
    { v: 'Psychological', l: 'PSYCHOLOGICAL', icon: <Brain size={12} /> },
    { v: 'Mecha', l: 'MECHA', icon: <Bot size={12} /> },
    { v: 'Isekai', l: 'ISEKAI', icon: <Globe size={12} /> },
    { v: 'School', l: 'SCHOOL', icon: <GraduationCap size={12} /> },
    { v: 'Slice of Life', l: 'SLICE OF LIFE', icon: <Coffee size={12} /> },
];

const contentStyleOptions = [
    { v: 'All', l: 'ALL STYLES', icon: <LayoutGrid size={12} /> },
    { v: 'Live Action', l: 'LIVE ACTION', icon: <Video size={12} /> },
    { v: 'Animation', l: 'ANIMATION', icon: <Palette size={12} /> },
];

const contentDescriptorOptions = [
    { v: 'All', l: 'ANY CONTENT', icon: <LayoutGrid size={12} /> },
    { v: 'Extreme Gore/Gruesome', l: 'EXTREME GORE', icon: <Biohazard size={12} /> },
    { v: 'Naked/Nudity', l: 'NUDITY', icon: <EyeOff size={12} /> },
    { v: 'Semi Nudity', l: 'SEMI NUDITY', icon: <EyeOff size={12} /> },
    { v: 'Sexual Content', l: 'SEXUAL', icon: <Heart size={12} /> },
    { v: 'Foul Language', l: 'LANGUAGE', icon: <MessageSquareWarning size={12} /> },
    { v: 'Gore/Extreme Violence', l: 'GORE', icon: <Skull size={12} /> },
    { v: 'Violence', l: 'VIOLENCE', icon: <Swords size={12} /> },
    { v: 'Drug Use', l: 'DRUGS', icon: <Pill size={12} /> },
    { v: 'Frightening Scenes', l: 'HORROR', icon: <Ghost size={12} /> },
];

const TechSelect: React.FC<{
  label: string;
  value: string | string[]; 
  options: { v: string; l: string; icon?: React.ReactNode }[];
  onChange: (val: string | string[]) => void;
  icon?: React.ReactNode;
  multi?: boolean;
}> = ({ label, value, options, onChange, icon, multi = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { visualStyles } = useMediaContext();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSelected = (val: string) => multi && Array.isArray(value) ? value.includes(val) : value === val;
  const hasSelection = multi && Array.isArray(value) ? value.length > 0 && !value.includes('All') : value !== 'All';
  const selectedOption = !multi && hasSelection ? options.find(o => o.v === value) : null;

  return (
    <div className="relative font-orbitron" ref={containerRef}>
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`
                h-10 px-3 flex items-center gap-2 border transition-all text-[11px] font-bold tracking-wider uppercase whitespace-nowrap
                ${hasSelection 
                    ? 'border-cp-red text-cp-red bg-cp-red/5' 
                    : 'border-[#333] text-cp-yellow/70 hover:border-cp-yellow hover:text-cp-yellow'}
            `}
            style={{ 
                ...visualStyles.panel,
                ...visualStyles.glow,
                '--glow-color': hasSelection ? '#FF003C' : '#FCEE0A',
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 10% 100%, 0 70%)" 
            } as React.CSSProperties}
        >
            {icon && <span className="opacity-80">{icon}</span>}
            
            <div className="flex items-center gap-2 truncate max-w-[120px]">
                {selectedOption?.icon && <span className="opacity-100">{selectedOption.icon}</span>}
                <span className="truncate">{hasSelection && !multi ? selectedOption?.l : label}</span>
            </div>

            <div className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] ${hasSelection ? 'border-t-cp-red' : 'border-t-cp-yellow/70'}`}></div>
        </button>

        {isOpen && (
            <div 
                className="absolute top-full left-0 mt-1 w-56 border border-[#333] z-[100] max-h-96 overflow-y-auto shadow-[0_10px_40px_rgba(0,0,0,0.8)] scrollbar-thin scrollbar-thumb-cp-yellow scrollbar-track-black"
                style={visualStyles.panel}
            >
                <div className="h-1 bg-cp-yellow w-full sticky top-0 z-10"></div>
                {options.map(opt => (
                    <button
                        key={opt.v}
                        onClick={() => handleSelect(opt.v)}
                        className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase hover:bg-white/5 flex items-center justify-between border-b border-white/5 last:border-0 group
                            ${isSelected(opt.v) ? 'text-cp-red bg-cp-red/10' : 'text-cp-yellow/70 hover:text-cp-yellow'}
                        `}
                    >
                        <div className="flex items-center gap-2">
                             {opt.icon && <span className={`transition-colors ${isSelected(opt.v) ? 'text-cp-red' : 'text-white/40 group-hover:text-cp-yellow'}`}>{opt.icon}</span>}
                             {opt.l}
                        </div>
                        {isSelected(opt.v) && <div className="w-1.5 h-1.5 bg-cp-red rotate-45 shadow-[0_0_5px_#FF003C]"></div>}
                    </button>
                ))}
            </div>
        )}
    </div>
  );
  
  function handleSelect(val: string) {
    if (multi && Array.isArray(value)) {
        if (val === 'All') onChange(['All']);
        else {
            let newValue = value.filter(v => v !== 'All');
            if (value.includes(val)) newValue = newValue.filter(v => v !== val);
            else newValue = [...newValue, val];
            onChange(newValue.length === 0 ? ['All'] : newValue);
        }
    } else {
        onChange(val);
        setIsOpen(false);
    }
  }
};

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, category, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { toggleMobileMenu, visualStyles } = useMediaContext();
  
  // Local state for pending changes
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Sync local filters if props change externally
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    setFilters(localFilters);
    setIsExpanded(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setFilters(prev => ({ ...prev, searchQuery: localFilters.searchQuery }));
      setIsExpanded(false);
  };

  const categories = [
    { id: 'All', label: 'ALL', path: '/', icon: <LayoutGrid size={14} /> },
    { id: MediaType.MOVIE, label: 'MOVIES', path: '/movies', icon: <Film size={14} /> },
    { id: MediaType.SHOW, label: 'SERIES', path: '/shows', icon: <Tv size={14} /> },
    { id: MediaType.ANIME, label: 'ANIME', path: '/anime', icon: <Zap size={14} /> },
  ];
  
  // Dynamic Category Color Logic
  const getCategoryColor = (cat: string) => {
    if (cat === MediaType.MOVIE) return '#FF003C';
    if (cat === MediaType.ANIME) return '#00F0FF';
    return '#FCEE0A'; // Default/Shows/All
  };
  const themeColor = getCategoryColor(category);

  const updateLocalFilter = (key: keyof FilterState, val: any) => setLocalFilters(prev => ({ ...prev, [key]: val }));

  return (
    <div className="w-full flex flex-col gap-4 pointer-events-none">
        {/* Top Bar - Flex Container with Gap */}
        <div className="flex items-center gap-3 pointer-events-auto w-full h-10">
            
            {/* Mobile Menu Toggle */}
            <button 
                onClick={toggleMobileMenu} 
                className="md:hidden w-10 h-10 border border-[#333] text-cp-yellow flex items-center justify-center shrink-0"
                style={{...visualStyles.panel, ...visualStyles.glow, '--glow-color': '#FCEE0A'} as React.CSSProperties}
            >
                <Menu size={18} />
            </button>
            
            {/* Categories - Tab Style */}
            <div 
                className="flex items-end gap-1 overflow-x-auto no-scrollbar mask-fade-right max-w-[calc(100vw-180px)] md:max-w-none h-10"
            >
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => navigate(cat.path)}
                        className={`px-4 h-full text-[11px] font-orbitron font-bold uppercase transition-all whitespace-nowrap flex items-center gap-2 pt-1 border-t-2
                            ${category === cat.id 
                                ? 'bg-cp-red text-black border-cp-red shadow-[0_0_15px_rgba(255,0,60,0.4)]' 
                                : 'bg-black/40 text-cp-yellow/60 border-gray-800 hover:text-cp-yellow hover:border-cp-yellow/50'}
                        `}
                        // Cyberpunk Folder Tab Shape
                        style={{ clipPath: "polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 20%)" }}
                    >
                        {cat.icon} <span className="hidden sm:inline">{cat.label}</span>
                    </button>
                ))}
                {/* Decorative End Line */}
                <div className="flex-1 h-[2px] bg-[#333] self-end mb-[1px]"></div>
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Right Side: Search & Filter - NOW PERFECTLY ALIGNED */}
            <div className="flex items-center gap-2 shrink-0 h-10">
                <form 
                    onSubmit={handleSearchSubmit} 
                    className="relative group w-32 md:w-48 h-10 flex items-center border border-[#333] transition-all duration-300 focus-within:border-current m-0 p-0 box-border bg-black/40 backdrop-blur-sm"
                    style={{ 
                        ...visualStyles.glow, 
                        '--glow-color': themeColor,
                        borderColor: isExpanded || localFilters.searchQuery ? themeColor : '#333'
                    } as React.CSSProperties}
                >
                    <div className="flex items-center justify-center pl-3 pr-2 h-full text-white/50 group-focus-within:text-[var(--glow-color)] pointer-events-none" style={{ color: isExpanded ? themeColor : undefined }}>
                        <Search size={14} />
                    </div>
                    <input 
                        type="text" 
                        value={localFilters.searchQuery}
                        onChange={(e) => updateLocalFilter('searchQuery', e.target.value)}
                        placeholder="SEARCH..." 
                        className="w-full h-full bg-transparent border-none outline-none text-xs font-mono text-white placeholder-white/30 m-0 p-0 leading-normal focus:placeholder-white/50"
                        style={{ color: themeColor }}
                    />
                </form>

                <button 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    className={`w-10 h-10 flex items-center justify-center border transition-all shrink-0 m-0 p-0 box-border ${isExpanded ? 'bg-current text-black border-current' : 'text-white/80 border-[#333] hover:text-[var(--glow-color)] bg-black/40'}`}
                    disabled={isLoading}
                    style={{
                        ...visualStyles.glow, 
                        '--glow-color': themeColor,
                        color: isExpanded ? themeColor : undefined
                    } as React.CSSProperties}
                >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <SlidersHorizontal size={16} />}
                </button>
            </div>
        </div>

        {/* Expanded Filter Panel */}
        {isExpanded && (
            <div 
                className="pointer-events-auto border border-[#333] p-4 relative animate-in slide-in-from-top-2 bg-black/95 backdrop-blur-xl"
                style={{...visualStyles.glow, '--glow-color': themeColor} as React.CSSProperties}
            >
                <div className="absolute top-0 left-0 w-20 h-1 bg-cp-red shadow-[0_0_10px_#FF003C]"></div>
                <div className="absolute bottom-0 right-0 w-20 h-1 bg-cp-yellow shadow-[0_0_10px_#FCEE0A]"></div>
                
                <div className="flex items-start justify-between mb-4">
                     <h3 className="text-xs font-orbitron font-bold text-cp-yellow tracking-widest uppercase flex items-center gap-2 drop-shadow-[0_0_5px_rgba(252,238,10,0.5)]">
                        <SlidersHorizontal size={12} /> CONFIG_FILTERS
                     </h3>
                     <button onClick={() => setIsExpanded(false)} className="text-cp-yellow/50 hover:text-cp-red transition-colors">
                        <X size={16} />
                     </button>
                </div>

                <div className="flex flex-wrap gap-3">
                    <TechSelect label="SORT BY" value={localFilters.sortBy} onChange={(v) => updateLocalFilter('sortBy', v)} options={sortOptions} icon={<ArrowUpDown size={12} />} />
                    
                    <TechSelect label="GENRE" value={localFilters.genre} onChange={(v) => updateLocalFilter('genre', v)} options={genreOptions} multi icon={<Zap size={12} />} />

                    <TechSelect label="YEAR" value={localFilters.year} onChange={(v) => updateLocalFilter('year', v)} options={yearOptions} multi icon={<Calendar size={12} />} />
                    
                    <TechSelect label="PLATFORM" value={localFilters.streamingPlatforms} onChange={(v) => updateLocalFilter('streamingPlatforms', v)} options={platformOptions} multi icon={<Cast size={12} />} />
                    
                    <TechSelect label="RATING" value={localFilters.minRating} onChange={(v) => updateLocalFilter('minRating', v)} options={ratingOptions} icon={<Star size={12} />} />

                    <TechSelect label="AGE_RATING" value={localFilters.maturityRating} onChange={(v) => updateLocalFilter('maturityRating', v)} options={maturityOptions} multi icon={<ShieldAlert size={12} />} />

                    <TechSelect label="REGION" value={localFilters.country} onChange={(v) => updateLocalFilter('country', v)} options={regionOptions} multi icon={<Globe size={12} />} />
                    
                    <TechSelect label="AUDIO" value={localFilters.audioType} onChange={(v) => updateLocalFilter('audioType', v)} options={audioOptions} icon={<Volume2 size={12} />} />

                    {category === MediaType.ANIME && (
                        <TechSelect label="FORMAT" value={localFilters.animeFormat} onChange={(v) => updateLocalFilter('animeFormat', v)} options={animeFormatOptions} multi icon={<Layers size={12} />} />
                    )}

                    <TechSelect label="THEMES" value={localFilters.themes} onChange={(v) => updateLocalFilter('themes', v)} options={themeOptions} multi icon={<Sparkles size={12} />} />

                    <TechSelect label="CONTENT_STYLE" value={localFilters.contentStyle} onChange={(v) => updateLocalFilter('contentStyle', v)} options={contentStyleOptions} icon={<Monitor size={12} />} />

                    <TechSelect label="CONTENT_TAGS" value={localFilters.contentDescriptors} onChange={(v) => updateLocalFilter('contentDescriptors', v)} options={contentDescriptorOptions} multi icon={<Skull size={12} />} />
                </div>
                
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[#333]">
                     <button 
                        onClick={handleApplyFilters}
                        className="px-8 py-2 bg-cp-red text-black text-xs font-orbitron font-bold uppercase hover:bg-white transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(255,0,60,0.4)]"
                        style={{ clipPath: "polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)" }}
                     >
                        <Check size={14} /> APPLY_CONFIG
                     </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default FilterBar;