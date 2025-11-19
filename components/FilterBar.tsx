import React, { useState } from 'react';
import { Filter, Search, HelpCircle, X, ChevronDown } from 'lucide-react';
import { FilterState, MediaType } from '../types';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  category: MediaType | 'All';
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, category }) => {
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  
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

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 p-4 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Top Row: Search and Sort */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Search Input - Liquid Glass */}
          <div className="relative w-full md:w-96 group z-50">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" size={18} />
            <input
              type="text"
              placeholder={`Search ${category === 'All' ? 'movies, shows...' : category}...`}
              value={filters.searchQuery}
              onChange={(e) => handleChange('searchQuery', e.target.value)}
              onFocus={() => setShowSearchHelp(true)}
              onBlur={() => setTimeout(() => setShowSearchHelp(false), 200)} // Delay to allow clicking inside help
              className="w-full bg-slate-800/50 hover:bg-slate-800/70 border border-white/10 focus:border-primary/50 text-white pl-10 pr-10 py-2.5 rounded-xl backdrop-blur-md shadow-inner focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] focus:outline-none transition-all placeholder-slate-400"
            />
            
            {/* Help Icon Toggle */}
            <button 
                onClick={() => setShowSearchHelp(!showSearchHelp)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
            >
                {showSearchHelp ? <X size={16} /> : <HelpCircle size={16} />}
            </button>

            {/* Advanced Search Tooltip - Liquid Glass */}
            <div className={`
                absolute top-full left-0 right-0 mt-2 p-4 rounded-xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl shadow-2xl transition-all duration-300 origin-top
                ${showSearchHelp ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
            `}>
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Advanced Search</h4>
                <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-start gap-2">
                        <span className="bg-white/10 px-1.5 rounded text-white font-mono text-xs mt-0.5">actor:</span>
                        <span>Find titles by cast<br/><span className="text-slate-500 text-xs">Example: "actor: Cillian Murphy"</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="bg-white/10 px-1.5 rounded text-white font-mono text-xs mt-0.5">director:</span>
                        <span>Find by director<br/><span className="text-slate-500 text-xs">Example: "director: Nolan"</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="bg-white/10 px-1.5 rounded text-white font-mono text-xs mt-0.5">Plot</span>
                        <span>Natural language search<br/><span className="text-slate-500 text-xs">Example: "80s sci-fi with aliens"</span></span>
                    </div>
                </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar mask-image-linear-gradient">
             <span className="text-slate-300 text-sm whitespace-nowrap mr-2 font-medium">Sort by:</span>
             {sortOptions.map((option) => (
                <button
                    key={option.value}
                    onClick={() => handleChange('sortBy', option.value as any)}
                    className={`px-4 py-1.5 rounded-full text-sm capitalize transition-all whitespace-nowrap border ${
                        filters.sortBy === option.value 
                        ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                        : 'bg-slate-800/50 text-slate-300 border-white/10 hover:bg-slate-700 hover:text-white hover:border-white/20'
                    }`}
                >
                    {option.label}
                </button>
             ))}
          </div>
        </div>

        {/* Bottom Row: Dropdown Filters */}
        <div className="flex flex-wrap gap-3 items-center">
            <div className="p-2 bg-slate-800/50 rounded-xl border border-white/10 mr-1">
                 <Filter size={16} className="text-primary" />
            </div>
            
            {/* Helper to render glass selects */}
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
                    ] 
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
                        { v: 'Brazil', l: 'Brazil' },
                        { v: 'Sweden', l: 'Sweden' },
                        { v: 'Norway', l: 'Norway' },
                        { v: 'Denmark', l: 'Denmark' },
                        { v: 'Russia', l: 'Russia' },
                        { v: 'Turkey', l: 'Turkey' },
                        { v: 'Thailand', l: 'Thailand' },
                        { v: 'Argentina', l: 'Argentina' },
                    ]
                },
                { 
                    key: 'maturityRating', 
                    show: true, 
                    options: [
                        { v: 'All', l: 'All Ratings' },
                        { v: 'G', l: 'G / TV-Y' },
                        { v: 'PG', l: 'PG / TV-PG' },
                        { v: 'PG-13', l: 'PG-13 / TV-14' },
                        { v: 'R', l: 'R / TV-MA' },
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
        </div>
      </div>
    </div>
  );
};

export default FilterBar;