import React, { useState } from 'react';
import { Filter, Search, HelpCircle, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { FilterState, MediaType } from '../types';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  category: MediaType | 'All';
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, category }) => {
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const sortOptions = [
      { value: 'trending', label: 'Trending' },
      { value: 'popular', label: 'Popular' },
      { value: 'in_theaters', label: 'In Theaters' },
      { value: 'newest', label: 'Newest' },
      { value: 'rating', label: 'Top Rated' },
  ];

  // Calculate active filters count to show badge
  const activeFilterCount = [
      filters.genre !== 'All',
      filters.year !== 'All',
      filters.country !== 'All',
      filters.maturityRating !== 'All',
      filters.minRating !== 'All',
      filters.audioType !== 'All',
      filters.animeFormat !== 'All'
  ].filter(Boolean).length;

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 shadow-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto p-4">
        
        {/* Top Row: Search and Toggle */}
        <div className="flex gap-3 items-center">
          
          {/* Search Input - Liquid Glass */}
          <div className="relative flex-1 group z-50">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" size={18} />
            <input
              type="text"
              placeholder={`Search ${category === 'All' ? 'movies, shows...' : category}...`}
              value={filters.searchQuery}
              onChange={(e) => handleChange('searchQuery', e.target.value)}
              onFocus={() => setShowSearchHelp(true)}
              onBlur={() => setTimeout(() => setShowSearchHelp(false), 200)}
              className="w-full bg-slate-800/50 hover:bg-slate-800/70 border border-white/10 focus:border-primary/50 text-white pl-10 pr-10 py-2.5 rounded-xl backdrop-blur-md shadow-inner focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] focus:outline-none transition-all placeholder-slate-400"
            />
            
            {/* Help Icon Toggle */}
            <button 
                onClick={() => setShowSearchHelp(!showSearchHelp)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
            >
                {showSearchHelp ? <X size={16} /> : <HelpCircle size={16} />}
            </button>

            {/* Advanced Search Tooltip */}
            <div className={`
                absolute top-full left-0 right-0 mt-2 p-4 rounded-xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl shadow-2xl transition-all duration-300 origin-top
                ${showSearchHelp ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
            `}>
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Advanced Search</h4>
                <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-start gap-2">
                        <span className="bg-white/10 px-1.5 rounded text-white font-mono text-xs mt-0.5">actor:</span>
                        <span>Find by cast <span className="text-slate-500 text-xs">(e.g. "actor: Cillian Murphy")</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="bg-white/10 px-1.5 rounded text-white font-mono text-xs mt-0.5">director:</span>
                        <span>Find by director <span className="text-slate-500 text-xs">(e.g. "director: Nolan")</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="bg-white/10 px-1.5 rounded text-white font-mono text-xs mt-0.5">Plot</span>
                        <span>Description search <span className="text-slate-500 text-xs">(e.g. "80s sci-fi with aliens")</span></span>
                    </div>
                </div>
            </div>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 border select-none
                ${isExpanded 
                    ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                    : 'bg-slate-800/50 text-slate-300 border-white/10 hover:bg-slate-700 hover:text-white'}
            `}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden md:inline">Filters</span>
            {activeFilterCount > 0 && !isExpanded && (
                <span className="flex items-center justify-center w-5 h-5 bg-accent text-white text-[10px] rounded-full font-bold shadow-lg">
                    {activeFilterCount}
                </span>
            )}
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Collapsible Content */}
        <div className={`
            grid transition-all duration-300 ease-in-out overflow-hidden
            ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}
        `}>
           <div className="min-h-0 space-y-4">
                {/* Sort Options */}
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center pb-2 border-b border-white/5">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest whitespace-nowrap">Sort By</span>
                    <div className="flex items-center gap-2 overflow-x-auto w-full no-scrollbar mask-image-linear-gradient pb-1">
                        {sortOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleChange('sortBy', option.value as any)}
                                className={`px-4 py-1.5 rounded-full text-sm capitalize transition-all whitespace-nowrap border flex-shrink-0 ${
                                    filters.sortBy === option.value 
                                    ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                                    : 'bg-slate-800/30 text-slate-400 border-white/5 hover:bg-slate-700 hover:text-white hover:border-white/10'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Dropdowns */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="p-2 bg-slate-800/50 rounded-xl border border-white/10 mr-1">
                        <Filter size={16} className="text-primary" />
                    </div>
                    
                    {[
                        { 
                            key: 'animeFormat', 
                            show: category === MediaType.ANIME, 
                            options: [
                                { v: 'All', l: 'All Formats' }, 
                                { v: 'TV Series', l: 'TV Series' }, 
                                { v: 'Movie', l: 'Movies' }
                            ],
                            style: "text-accent border-accent/20 focus:border-accent bg-slate-800/50"
                        },
                        { 
                            key: 'genre', 
                            show: true,
                            options: [
                                { v: 'All', l: 'All Genres' },
                                { v: 'Action', l: 'Action' },
                                { v: 'Comedy', l: 'Comedy' },
                                { v: 'Drama', l: 'Drama' },
                                { v: 'Sci-Fi', l: 'Sci-Fi' },
                                { v: 'Horror', l: 'Horror' },
                                { v: 'Romance', l: 'Romance' },
                                { v: 'Fantasy', l: 'Fantasy' },
                                { v: 'Thriller', l: 'Thriller' },
                                { v: 'Animation', l: 'Animation' },
                                { v: 'Mystery', l: 'Mystery' },
                                { v: 'Crime', l: 'Crime' },
                                { v: 'Documentary', l: 'Documentary' },
                            ] 
                        },
                        { 
                            key: 'minRating', 
                            show: true, 
                            options: [
                                { v: 'All', l: 'Rated 5+' }, 
                                { v: '9', l: '9+ (Masterpiece)' },
                                { v: '8', l: '8+ (Great)' },
                                { v: '7', l: '7+ (Good)' },
                                { v: '6', l: '6+ (Okay)' },
                            ],
                            style: "text-yellow-400 border-yellow-500/20 focus:border-yellow-500 bg-slate-800/50"
                        },
                        { 
                            key: 'maturityRating', 
                            show: true, 
                            options: [
                                { v: 'All', l: 'All Certifications' },
                                { v: 'PG', l: 'PG / Family' },
                                { v: 'PG-13', l: 'PG-13 / Teen' },
                                { v: 'MA', l: 'TV-MA / Mature' },
                                { v: '18+', l: 'Rated 18+ / R' },
                            ],
                            style: "text-green-400 border-green-500/20 focus:border-green-500 bg-slate-800/50"
                        },
                        { 
                            key: 'year', 
                            show: true, 
                            options: [
                                { v: 'All', l: 'All Years' },
                                { v: '2025', l: '2025' },
                                { v: '2024', l: '2024' },
                                { v: '2023', l: '2023' },
                                { v: '2020-2022', l: '2020-2022' },
                                { v: '2010-2019', l: '2010s' },
                                { v: '2000-2009', l: '2000s' },
                                { v: '1990-1999', l: '90s' },
                                { v: 'Classic', l: 'Classics' },
                            ]
                        },
                        { 
                            key: 'country', 
                            show: true, 
                            options: [
                                { v: 'All', l: 'All Countries' },
                                { v: 'USA', l: 'USA' },
                                { v: 'India', l: 'India' },
                                { v: 'UK', l: 'UK' },
                                { v: 'Japan', l: 'Japan' },
                                { v: 'South Korea', l: 'South Korea' },
                                { v: 'China', l: 'China' },
                                { v: 'France', l: 'France' },
                                { v: 'Germany', l: 'Germany' },
                                { v: 'Spain', l: 'Spain' },
                                { v: 'Italy', l: 'Italy' },
                            ]
                        },
                        { 
                            key: 'audioType', 
                            show: category === MediaType.ANIME, 
                            options: [
                                { v: 'All', l: 'All Audio' },
                                { v: 'Sub', l: 'Subbed' },
                                { v: 'Dub', l: 'Dubbed' },
                                { v: 'Sub & Dub', l: 'Sub & Dub' },
                            ],
                            style: "text-accent border-accent/20 focus:border-accent bg-slate-800/50"
                        },
                    ].map((filter) => {
                        if (!filter.show) return null;
                        return (
                            <div key={filter.key} className="relative group">
                                <select 
                                    value={(filters as any)[filter.key]} 
                                    onChange={(e) => handleChange(filter.key as any, e.target.value)}
                                    className={`
                                        appearance-none 
                                        bg-slate-800/50
                                        hover:bg-slate-700/70
                                        border ${filter.style ? filter.style : 'border-white/10 text-slate-200 focus:border-primary/50'} 
                                        text-sm font-medium rounded-xl pl-3 pr-9 py-2 
                                        focus:outline-none focus:ring-2 focus:ring-primary/20 
                                        backdrop-blur-md
                                        shadow-sm
                                        transition-all duration-300 cursor-pointer
                                    `}
                                >
                                    {filter.options.map(o => (
                                        <option key={o.v} value={o.v} className="bg-slate-900 text-slate-200 py-2">{o.l}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 group-hover:text-white transition-colors">
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Reset Button if any filter is active */}
                    {activeFilterCount > 0 && (
                        <button
                            onClick={() => setFilters(prev => ({
                                ...prev,
                                genre: 'All',
                                year: 'All',
                                country: 'All',
                                maturityRating: 'All',
                                minRating: 'All',
                                audioType: 'All',
                                animeFormat: 'All'
                            }))}
                            className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 hover:text-red-300 transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;