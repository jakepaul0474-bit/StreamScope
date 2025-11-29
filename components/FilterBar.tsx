import React, { useState, useEffect, useRef } from 'react';
import { Filter, Search, HelpCircle, X, ChevronDown, ChevronUp, SlidersHorizontal, Check, Square, CheckSquare } from 'lucide-react';
import { FilterState, MediaType } from '../types';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  category: MediaType | 'All';
}

// Reusable Custom Dropdown Component
interface CustomSelectProps {
  label: string;
  value: string | string[]; // Can be single or array
  options: { v: string; l: string }[];
  onChange: (val: string | string[]) => void;
  icon?: React.ReactNode;
  searchable?: boolean;
  multi?: boolean;
  colorTheme?: 'default' | 'accent' | 'yellow' | 'green';
}

const CustomSelect: React.FC<CustomSelectProps> = ({ 
  label, 
  value, 
  options, 
  onChange, 
  icon, 
  searchable = false,
  multi = false,
  colorTheme = 'default' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when closed
  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  const filteredOptions = options.filter(opt => 
    opt.l.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to check if option is selected
  const isSelected = (val: string) => {
    if (multi && Array.isArray(value)) {
      return value.includes(val);
    }
    return value === val;
  };

  const handleSelect = (val: string) => {
    if (multi && Array.isArray(value)) {
      // Toggle logic
      if (val === 'All') {
        onChange([]); // Clear all
      } else {
        const newValue = value.includes(val)
          ? value.filter(v => v !== val)
          : [...value, val];
        onChange(newValue);
      }
      // Don't close dropdown in multi mode
    } else {
      onChange(val);
      setIsOpen(false);
    }
  };

  // Label Logic
  let displayLabel = label;
  if (multi && Array.isArray(value)) {
    if (value.length > 0) {
      if (value.length === 1) {
        // Find the label for the single selected value
        const opt = options.find(o => o.v === value[0]);
        displayLabel = opt ? opt.l : value[0];
      } else {
        displayLabel = `${value.length} Selected`;
      }
    }
  } else if (!multi && typeof value === 'string') {
    const selectedOption = options.find(o => o.v === value);
    if (selectedOption && value !== 'All') {
      displayLabel = selectedOption.l;
    }
  }
  
  // Theme styles
  const themeStyles = {
    default: "border-white/10 text-slate-200 hover:border-white/20",
    accent: "border-accent/30 text-accent hover:border-accent/50",
    yellow: "border-yellow-500/30 text-yellow-400 hover:border-yellow-500/50",
    green: "border-green-500/30 text-green-400 hover:border-green-500/50"
  };

  const hasActiveValue = multi && Array.isArray(value) ? value.length > 0 : value !== 'All';

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2 
          min-w-[140px] px-3 py-2.5 rounded-xl
          bg-slate-900/40 backdrop-blur-md
          border transition-all duration-300
          text-sm font-medium shadow-sm hover:shadow-md hover:bg-slate-800/50
          group
          ${hasActiveValue ? themeStyles[colorTheme].replace('text-slate-200', 'text-white bg-slate-800/60') : themeStyles[colorTheme]}
        `}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="opacity-70">{icon}</span>}
          <span className="truncate max-w-[120px]">
            {displayLabel}
          </span>
        </div>
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-300 opacity-70 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 max-h-80 bg-[#0a0f1d]/95 backdrop-blur-3xl border border-white/10 rounded-xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
          
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-white/5 bg-white/5 sticky top-0 z-10">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-primary/50 transition-colors placeholder-slate-600"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const active = isSelected(opt.v);
                const isAll = opt.v === 'All';
                
                // If it's "All" option in multi mode, highlight it if array is empty
                const activeAll = multi && isAll && Array.isArray(value) && value.length === 0;

                return (
                  <button
                    key={opt.v}
                    onClick={() => handleSelect(opt.v)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-between
                      ${(active || activeAll)
                        ? 'bg-primary/20 text-white font-medium' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
                    `}
                  >
                    <span className="truncate">{opt.l}</span>
                    {multi ? (
                        (active || activeAll) ? <CheckSquare size={14} className="text-primary" /> : <Square size={14} className="text-slate-600" />
                    ) : (
                        active && <Check size={14} className="text-primary" />
                    )}
                  </button>
                )
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 italic">
                No results found
              </div>
            )}
          </div>
          
          {/* Footer for Multi-Select: Clear/Done */}
          {multi && (
             <div className="p-2 border-t border-white/5 bg-black/20 flex justify-between">
                <button 
                  onClick={() => onChange([])}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-xs bg-white/10 text-white px-3 py-1 rounded hover:bg-white/20"
                >
                  Done
                </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, category }) => {
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [allowOverflow, setAllowOverflow] = useState(false);
  
  // Handle overflow visibility for dropdowns after animation
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isExpanded) {
      timeout = setTimeout(() => setAllowOverflow(true), 300); // Match transition duration
    } else {
      setAllowOverflow(false);
    }
    return () => clearTimeout(timeout);
  }, [isExpanded]);

  const handleChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const sortOptions = [
      { value: 'trending', label: 'Trending' },
      { value: 'popular', label: 'Popular' },
      { value: 'in_theaters', label: 'In Theaters' },
      { value: 'newest', label: 'Newest' },
      { value: 'rating', label: 'Top Rated' },
  ];

  // Extended Genre List
  const genres = [
    { v: 'All', l: 'All Genres' },
    { v: 'Action', l: 'Action' },
    { v: 'Adventure', l: 'Adventure' },
    { v: 'Animation', l: 'Animation' },
    { v: 'Comedy', l: 'Comedy' },
    { v: 'Crime', l: 'Crime' },
    { v: 'Documentary', l: 'Documentary' },
    { v: 'Drama', l: 'Drama' },
    { v: 'Family', l: 'Family' },
    { v: 'Fantasy', l: 'Fantasy' },
    { v: 'History', l: 'History' },
    { v: 'Horror', l: 'Horror' },
    { v: 'Music', l: 'Music' },
    { v: 'Mystery', l: 'Mystery' },
    { v: 'Romance', l: 'Romance' },
    { v: 'Sci-Fi', l: 'Sci-Fi' },
    { v: 'Thriller', l: 'Thriller' },
    { v: 'War', l: 'War' },
    { v: 'Western', l: 'Western' },
  ];

  // Extended Country List
  const countries = [
    { v: 'All', l: 'All Countries' },
    { v: 'USA', l: 'USA' },
    { v: 'India', l: 'India' },
    { v: 'UK', l: 'United Kingdom' },
    { v: 'Japan', l: 'Japan' },
    { v: 'South Korea', l: 'South Korea' },
    { v: 'China', l: 'China' },
    { v: 'France', l: 'France' },
    { v: 'Germany', l: 'Germany' },
    { v: 'Spain', l: 'Spain' },
    { v: 'Italy', l: 'Italy' },
    { v: 'Canada', l: 'Canada' },
    { v: 'Australia', l: 'Australia' },
    { v: 'Brazil', l: 'Brazil' },
    { v: 'Mexico', l: 'Mexico' },
    { v: 'Russia', l: 'Russia' },
    { v: 'Sweden', l: 'Sweden' },
    { v: 'Norway', l: 'Norway' },
    { v: 'Denmark', l: 'Denmark' },
    { v: 'Thailand', l: 'Thailand' },
    { v: 'Turkey', l: 'Turkey' },
    { v: 'Argentina', l: 'Argentina' },
  ];

  const years = [
    { v: 'All', l: 'All Years' },
    { v: '2025', l: '2025' },
    { v: '2024', l: '2024' },
    { v: '2023', l: '2023' },
    { v: '2020-2022', l: '2020-2022' },
    { v: '2010-2019', l: '2010s' },
    { v: '2000-2009', l: '2000s' },
    { v: '1990-1999', l: '90s' },
    { v: 'Classic', l: 'Classics' },
  ];

  const maturityRatings = [
    { v: 'All', l: 'All Certifications' },
    { v: 'PG', l: 'PG / Family' },
    { v: 'PG-13', l: 'PG-13 / Teen' },
    { v: 'MA', l: 'TV-MA / Mature' },
    { v: '18+', l: 'Rated 18+ / R' },
  ];

  const minRatings = [
    { v: 'All', l: 'Rated 5+' }, 
    { v: '9', l: '9+ (Masterpiece)' },
    { v: '8', l: '8+ (Great)' },
    { v: '7', l: '7+ (Good)' },
    { v: '6', l: '6+ (Okay)' },
  ];

  // Calculate active filters count
  const activeFilterCount = [
      filters.genre.length > 0,
      filters.year !== 'All',
      filters.country.length > 0,
      filters.maturityRating.length > 0,
      filters.minRating !== 'All',
      filters.audioType.length > 0,
      filters.animeFormat.length > 0
  ].filter(Boolean).length;

  return (
    <div className="w-full bg-gradient-to-b from-slate-900/10 to-transparent backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 shadow-sm transition-all duration-300">
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
              className="w-full bg-slate-900/30 hover:bg-slate-900/40 border border-white/10 focus:border-primary/40 text-white pl-10 pr-10 py-2.5 rounded-xl backdrop-blur-md shadow-inner focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] focus:outline-none transition-all placeholder-slate-400/50"
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
                absolute top-full left-0 right-0 mt-2 p-4 rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-3xl shadow-2xl transition-all duration-300 origin-top
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
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 border select-none backdrop-blur-md
                ${isExpanded 
                    ? 'bg-gradient-to-r from-primary/80 to-primary/60 text-white border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'}
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
            transition-all duration-300 ease-in-out
            ${isExpanded ? 'opacity-100 mt-4 h-auto' : 'opacity-0 mt-0 h-0'}
            ${allowOverflow ? 'overflow-visible' : 'overflow-hidden'}
        `}>
           <div className="min-h-0 space-y-4 pb-4">
                {/* Sort Options */}
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center pb-2 border-b border-white/5">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest whitespace-nowrap">Sort By</span>
                    <div className="flex items-center gap-2 overflow-x-auto w-full no-scrollbar mask-image-linear-gradient pb-1">
                        {sortOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleChange('sortBy', option.value as any)}
                                className={`px-4 py-1.5 rounded-full text-sm capitalize transition-all whitespace-nowrap border flex-shrink-0 backdrop-blur-sm ${
                                    filters.sortBy === option.value 
                                    ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/10'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Dropdowns - Using CustomSelect */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="p-2 bg-white/5 rounded-xl border border-white/10 mr-1 backdrop-blur-sm">
                        <Filter size={16} className="text-primary" />
                    </div>
                    
                    {category === MediaType.ANIME && (
                      <CustomSelect 
                        label="Format" 
                        value={filters.animeFormat} 
                        onChange={(v) => handleChange('animeFormat', v)} 
                        options={[
                          { v: 'All', l: 'All Formats' }, 
                          { v: 'TV Series', l: 'TV Series' }, 
                          { v: 'Movie', l: 'Movies' }
                        ]}
                        colorTheme="accent"
                        multi
                      />
                    )}

                    <CustomSelect 
                      label="Genre" 
                      value={filters.genre} 
                      onChange={(v) => handleChange('genre', v)} 
                      options={genres}
                      searchable
                      multi
                    />

                    <CustomSelect 
                      label="Min Rating" 
                      value={filters.minRating} 
                      onChange={(v) => handleChange('minRating', v)} 
                      options={minRatings}
                      colorTheme="yellow"
                      // Single Select for Rating
                    />

                    <CustomSelect 
                      label="Maturity" 
                      value={filters.maturityRating} 
                      onChange={(v) => handleChange('maturityRating', v)} 
                      options={maturityRatings}
                      colorTheme="green"
                      multi
                    />

                    <CustomSelect 
                      label="Year" 
                      value={filters.year} 
                      onChange={(v) => handleChange('year', v)} 
                      options={years}
                      // Single select for year
                    />

                    <CustomSelect 
                      label="Country" 
                      value={filters.country} 
                      onChange={(v) => handleChange('country', v)} 
                      options={countries}
                      searchable
                      multi
                    />

                    {category === MediaType.ANIME && (
                       <CustomSelect 
                        label="Audio" 
                        value={filters.audioType} 
                        onChange={(v) => handleChange('audioType', v)} 
                        options={[
                          { v: 'All', l: 'All Audio' },
                          { v: 'Sub', l: 'Subbed' },
                          { v: 'Dub', l: 'Dubbed' },
                          { v: 'Sub & Dub', l: 'Sub & Dub' },
                        ]}
                        colorTheme="accent"
                        multi
                      />
                    )}
                    
                    {/* Reset Button if any filter is active */}
                    {activeFilterCount > 0 && (
                        <button
                            onClick={() => setFilters(prev => ({
                                ...prev,
                                genre: [],
                                year: 'All',
                                country: [],
                                maturityRating: [],
                                minRating: 'All',
                                audioType: [],
                                animeFormat: []
                            }))}
                            className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 hover:text-red-300 transition-colors backdrop-blur-sm"
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