import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Filter, Search, X, ChevronDown, SlidersHorizontal, Check, Square, CheckSquare, Loader2, Tag, Monitor, ShieldAlert, Film, Tv, LayoutGrid, Zap, Sparkles, Calendar } from 'lucide-react';
import { FilterState, MediaType } from '../types';
import { useNavigate } from 'react-router-dom';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  category: MediaType | 'All';
  isLoading: boolean;
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
  colorTheme?: 'default' | 'accent' | 'yellow' | 'green' | 'red' | 'purple';
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
  
  // Theme styles - Updated for glass
  const themeStyles = {
    default: "border-white/10 text-slate-200 hover:border-white/20 hover:bg-white/5",
    accent: "border-accent/30 text-accent hover:border-accent/50 hover:bg-accent/5",
    yellow: "border-yellow-500/30 text-yellow-400 hover:border-yellow-500/50 hover:bg-yellow-500/5",
    green: "border-green-500/30 text-green-400 hover:border-green-500/50 hover:bg-green-500/5",
    red: "border-red-500/30 text-red-400 hover:border-red-500/50 hover:bg-red-500/5",
    purple: "border-purple-500/30 text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/5",
  };

  const hasActiveValue = multi && Array.isArray(value) ? value.length > 0 : value !== 'All';

  // Glow color mapping based on theme
  const glowColors = {
      default: "bg-blue-500/30",
      accent: "bg-pink-500/30",
      yellow: "bg-yellow-500/30",
      green: "bg-green-500/30",
      red: "bg-red-500/30",
      purple: "bg-purple-500/30",
  };

  return (
    <div className="relative group/btn" ref={containerRef}>
      {/* Halo Glow - Constant Low Opacity, High on Hover */}
      <div className={`absolute -inset-1 rounded-xl blur-md opacity-30 group-hover/btn:opacity-100 transition-opacity duration-300 z-[-1] ${hasActiveValue ? 'opacity-60' : ''} ${glowColors[colorTheme]}`}></div>

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2 
          min-w-[130px] px-3 py-2 rounded-xl
          bg-white/[0.03] backdrop-blur-xl
          border transition-all duration-300
          text-xs font-medium shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]
          relative z-10
          ${hasActiveValue ? themeStyles[colorTheme].replace('text-slate-200', 'text-white bg-white/10') : themeStyles[colorTheme]}
        `}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="opacity-70">{icon}</span>}
          <span className="truncate max-w-[110px]">
            {displayLabel}
          </span>
        </div>
        <ChevronDown 
          size={12} 
          className={`transition-transform duration-300 opacity-70 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 max-h-80 bg-[#0a0f1d]/90 backdrop-blur-3xl border border-white/10 rounded-xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
          {/* ... (Menu content remains same) ... */}
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
                  className="w-full bg-white/5 border border-white/5 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-white/20 transition-colors placeholder-slate-600"
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
                        ? 'bg-white/10 text-white font-medium border border-white/5 shadow-inner' 
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

const YearFilter: React.FC<{
    value: string;
    onChange: (val: string) => void;
}> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    
    // Config
    const MIN_YEAR = 1950;
    const MAX_YEAR = new Date().getFullYear() + 1;
    const GAP = 1; // Minimum years between thumbs

    const [minVal, setMinVal] = useState(MIN_YEAR);
    const [maxVal, setMaxVal] = useState(MAX_YEAR);

    // Initialize from props
    useEffect(() => {
        if (value && value !== 'All') {
             if (value === 'Classic') {
                 setMinVal(1900);
                 setMaxVal(1959);
             } else if (value.includes('-')) {
                 const [s, e] = value.split('-');
                 const parsedMin = Number(s);
                 const parsedMax = Number(e);
                 setMinVal(isNaN(parsedMin) ? MIN_YEAR : parsedMin);
                 setMaxVal(isNaN(parsedMax) ? MAX_YEAR : parsedMax);
             } else if (!isNaN(Number(value))) {
                 setMinVal(Number(value));
                 setMaxVal(Number(value));
             }
        } else {
             setMinVal(MIN_YEAR);
             setMaxVal(MAX_YEAR);
        }
    }, [value, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleApply = () => {
        onChange(`${minVal}-${maxVal}`);
        setIsOpen(false);
    };

    const getPercent = useCallback((val: number) => {
        const clampedVal = Math.min(Math.max(val, MIN_YEAR), MAX_YEAR);
        return Math.round(((clampedVal - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100);
    }, [MIN_YEAR, MAX_YEAR]);

    const handleRangeChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
        const val = Number(event.target.value);
        if (type === 'min') {
            const newMin = Math.min(val, maxVal - GAP);
            setMinVal(newMin);
        } else {
            const newMax = Math.max(val, minVal + GAP);
            setMaxVal(newMax);
        }
    };

    const presets = [
        { v: 'All', l: 'All Years' },
        { v: '2025', l: '2025' },
        { v: '2024', l: '2024' },
        { v: '2023', l: '2023' },
        { v: '2020-2022', l: '2020-2022' },
        { v: '2010-2019', l: '2010s' },
        { v: '2000-2009', l: '2000s' },
        { v: '1990-1999', l: '90s' },
        { v: '1980-1989', l: '80s' },
        { v: '1970-1979', l: '70s' },
        { v: 'Classic', l: 'Classics (<1970)' },
    ];

    let displayLabel = "Year";
    if (value !== 'All') {
        const preset = presets.find(p => p.v === value);
        displayLabel = preset ? preset.l : (minVal === maxVal ? `${minVal}` : `${minVal}-${maxVal}`);
    }

    return (
        <div className="relative group/btn" ref={containerRef}>
            {/* Halo Glow - Constant Low Opacity, High on Hover */}
            <div className={`absolute -inset-1 rounded-xl blur-md opacity-30 group-hover/btn:opacity-100 transition-opacity duration-300 z-[-1] ${value !== 'All' ? 'opacity-60 bg-blue-500/40' : 'bg-blue-500/30'}`}></div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between gap-2 
                    min-w-[130px] px-3 py-2 rounded-xl
                    bg-white/[0.03] backdrop-blur-xl
                    border transition-all duration-300
                    text-xs font-medium shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]
                    relative z-10
                    ${value !== 'All' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' : 'border-white/10 text-slate-200 hover:border-white/20 hover:bg-white/5'}
                `}
            >
                <div className="flex items-center gap-2 truncate">
                    <span className="opacity-70"><Calendar size={12} /></span>
                    <span className="truncate max-w-[90px]">{displayLabel}</span>
                </div>
                <ChevronDown size={12} className={`transition-transform duration-300 opacity-70 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-[#0a0f1d]/90 backdrop-blur-3xl border border-white/10 rounded-xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                     {/* ... (Slider content remains same) ... */}
                      <div className="p-4 border-b border-white/5 bg-white/5">
                        <div className="flex justify-between items-center mb-4">
                             <div className="text-[10px] uppercase font-bold text-slate-500">Range</div>
                             <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                {minVal} - {maxVal}
                             </div>
                        </div>

                        {/* Custom Slider Construction */}
                        <div className="relative h-10 w-full flex items-center justify-center">
                            {/* Visual Track */}
                            <div className="absolute w-full h-1.5 bg-white/10 rounded-full z-0 overflow-hidden">
                                 {/* Colored Range */}
                                 <div 
                                    className="absolute h-full bg-primary/80 transition-all duration-75" 
                                    style={{ 
                                        left: `${getPercent(minVal)}%`, 
                                        width: `${getPercent(maxVal) - getPercent(minVal)}%` 
                                    }} 
                                 />
                            </div>

                            {/* Range Inputs */}
                            <input 
                                type="range" 
                                min={MIN_YEAR} 
                                max={MAX_YEAR} 
                                value={minVal} 
                                onChange={(e) => handleRangeChange(e, 'min')}
                                className="absolute pointer-events-none appearance-none z-20 h-1.5 w-full opacity-0 cursor-pointer"
                                style={{ zIndex: minVal > MAX_YEAR - 10 ? 25 : 20 }}
                            />
                            <input 
                                type="range" 
                                min={MIN_YEAR} 
                                max={MAX_YEAR} 
                                value={maxVal} 
                                onChange={(e) => handleRangeChange(e, 'max')}
                                className="absolute pointer-events-none appearance-none z-20 h-1.5 w-full opacity-0 cursor-pointer"
                            />

                            {/* Visual Thumbs - Positioned via CSS/Style to match inputs */}
                            <div 
                                className="absolute h-4 w-4 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] border-2 border-primary z-30 pointer-events-none transition-all duration-75"
                                style={{ left: `calc(${getPercent(minVal)}% - 8px)` }}
                            />
                            <div 
                                className="absolute h-4 w-4 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] border-2 border-primary z-30 pointer-events-none transition-all duration-75"
                                style={{ left: `calc(${getPercent(maxVal)}% - 8px)` }}
                            />
                            
                            <style>{`
                                input[type=range]::-webkit-slider-thumb {
                                    pointer-events: auto;
                                    width: 20px;
                                    height: 20px;
                                    -webkit-appearance: none;
                                    cursor: grab;
                                }
                                input[type=range]::-moz-range-thumb {
                                    pointer-events: auto;
                                    width: 20px;
                                    height: 20px;
                                    cursor: grab;
                                    border: none;
                                }
                            `}</style>
                        </div>
                        
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                            <span>{MIN_YEAR}</span>
                            <span>{MAX_YEAR}</span>
                        </div>

                        <button 
                            onClick={handleApply}
                            className="w-full mt-4 bg-primary hover:bg-blue-600 text-white rounded-lg py-2 text-xs font-bold transition-colors shadow-lg"
                        >
                            Apply Filter
                        </button>
                     </div>

                     <div className="overflow-y-auto max-h-48 p-1 custom-scrollbar">
                        <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-2">Quick Select</div>
                        {presets.map((opt) => (
                            <button
                                key={opt.v}
                                onClick={() => {
                                    onChange(opt.v);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-between
                                    ${value === opt.v ? 'bg-white/10 text-white font-medium border border-white/5' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
                                `}
                            >
                                {opt.l}
                                {value === opt.v && <Check size={14} className="text-primary" />}
                            </button>
                        ))}
                     </div>
                </div>
            )}
        </div>
    )
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, category, isLoading }) => {
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [allowOverflow, setAllowOverflow] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(!!filters.searchQuery);
  const navigate = useNavigate();

  // Content Style Toggle Logic
  const [pillStyle, setPillStyle] = useState({ left: 4, width: 50, opacity: 0 });
  const allRef = useRef<HTMLButtonElement>(null);
  const liveRef = useRef<HTMLButtonElement>(null);
  const animeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
        let target: HTMLButtonElement | null = null;
        if (filters.contentStyle === 'All') target = allRef.current;
        else if (filters.contentStyle === 'Live Action') target = liveRef.current;
        else if (filters.contentStyle === 'Anime') target = animeRef.current;

        if (target) {
            setPillStyle({
                left: target.offsetLeft,
                width: target.offsetWidth,
                opacity: 1
            });
        }
    }, 50);
    return () => clearTimeout(timer);
  }, [filters.contentStyle, category, isSearchOpen]);

  // Updated Categories: Removed Labels for Movie/Series, kept All
  const categories = [
    { id: 'All', label: 'All', path: '/', icon: <LayoutGrid size={20} />, color: 'from-blue-600 to-indigo-600', showLabel: true },
    { id: MediaType.MOVIE, label: 'Movies', path: '/movies', icon: <Film size={20} />, color: 'from-cyan-500 to-blue-600', showLabel: false },
    { id: MediaType.SHOW, label: 'Series', path: '/shows', icon: <Tv size={20} />, color: 'from-fuchsia-500 to-purple-600', showLabel: false },
  ];
  
  useEffect(() => {
    if (filters.searchQuery) setIsSearchOpen(true);
  }, [filters.searchQuery]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isExpanded) {
      timeout = setTimeout(() => setAllowOverflow(true), 300);
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
      { value: 'trending_week', label: 'Trending This Week' },
      { value: 'popular', label: 'Popular' },
      { value: 'in_theaters', label: 'In Theaters' },
      { value: 'newest', label: 'Newest' },
      { value: 'rating', label: 'Top Rated' },
  ];

  // (Genre lists etc. remain same)
  // ...
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
  const generalThemes = [
    { v: 'All', l: 'All Themes' },
    { v: 'Gore', l: 'Gore / Extreme Violence' },
    { v: 'Slasher', l: 'Slasher' },
    { v: 'Psychological Thriller', l: 'Psychological Thriller' },
    { v: 'Dark Comedy', l: 'Dark Comedy' },
    { v: 'Noir', l: 'Noir / Neo-Noir' },
    { v: 'Survival', l: 'Survival' },
    { v: 'Zombie', l: 'Zombie' },
    { v: 'Cyberpunk', l: 'Cyberpunk' },
    { v: 'Space Opera', l: 'Space Opera' },
    { v: 'Superhero', l: 'Superhero' },
    { v: 'Time Travel', l: 'Time Travel' },
    { v: 'Coming of Age', l: 'Coming of Age' },
    { v: 'Biographical', l: 'Biographical' },
    { v: 'Period Piece', l: 'Period Piece' },
    { v: 'Satire', l: 'Satire' },
    { v: 'Found Footage', l: 'Found Footage' },
    { v: 'Martial Arts', l: 'Martial Arts' },
    { v: 'Isekai', l: 'Isekai' },
    { v: 'Shonen', l: 'Shonen' },
    { v: 'Seinen', l: 'Seinen' },
    { v: 'Shojo', l: 'Shojo' },
    { v: 'Mecha', l: 'Mecha' },
  ];
  const contentDescriptors = [
    { v: 'All', l: 'All Content' },
    { v: 'Nudity', l: 'Nudity / Naked' },
    { v: 'Semi-Nudity', l: 'Semi-Nudity' },
    { v: 'Foul Language', l: 'Foul Language' },
    { v: 'Sexual Content', l: 'Sexual Content' },
    { v: 'Violence', l: 'Violence' },
    { v: 'Abuse', l: 'Abuse / Harassment' },
    { v: 'Drug Use', l: 'Drug Use' },
    { v: 'Gore', l: 'Gore' },
    { v: 'Self-Harm', l: 'Self-Harm' },
  ];
  const aspectRatios = [
    { v: 'All', l: 'All Ratios' },
    { v: 'IMAX', l: 'IMAX' },
    { v: 'Widescreen', l: 'Widescreen (2.39:1)' },
    { v: 'Standard', l: 'Standard (16:9)' },
    { v: '4:3', l: 'Classic (4:3)' },
  ];
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

  const activeFilterCount = [
      filters.genre.length > 0,
      filters.year !== 'All',
      filters.country.length > 0,
      filters.maturityRating.length > 0,
      filters.minRating !== 'All',
      filters.audioType.length > 0,
      filters.animeFormat.length > 0,
      filters.themes.length > 0,
      (filters.aspectRatio && filters.aspectRatio.length > 0),
      filters.contentDescriptors.length > 0
  ].filter(Boolean).length;

  return (
    // Removed sticky from here, parent handles it
    <div className="w-full bg-white/[0.02] backdrop-blur-3xl border-b border-white/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 relative flex flex-col gap-3">
        
        {/* Main Row: Categories & Actions */}
        <div className="flex items-center justify-between gap-3 h-10">
            
            {/* Category Navigation Pills - Removed Padding Left Strip */}
            <div className={`
                flex items-center gap-2 transition-all duration-300 ease-in-out md:pl-0
                ${isSearchOpen ? 'hidden md:flex opacity-0 md:opacity-100' : 'flex opacity-100'}
            `}>
                {categories.map((cat, index) => {
                    const isActive = category === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => navigate(cat.path)}
                            title={cat.label}
                            className={`
                                relative flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-all duration-300 flex-shrink-0 group/pill
                                ${index === 0 ? 'md:ml-0 ml-10' : ''} /* Add margin ONLY to first item on mobile to clear hamburger */
                                ${isActive 
                                    ? `bg-gradient-to-r ${cat.color} text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-105 ring-1 ring-white/20` 
                                    : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white'}
                            `}
                        >
                            {/* Halo Glow for Category Pill - Increased Constant Visibility */}
                            <div className={`absolute -inset-1 rounded-xl bg-primary/40 blur-md opacity-40 group-hover/pill:opacity-100 transition-opacity duration-300 z-[-1] ${isActive ? 'opacity-60' : ''}`}></div>

                            {cat.icon}
                            {cat.showLabel && <span className="hidden xs:inline">{cat.label}</span>}
                            {isActive && (
                                <div className="absolute inset-0 rounded-xl bg-white/20 blur-sm -z-10"></div>
                            )}
                        </button>
                    )
                })}
            </div>
            
            {/* Right Side: Search & Filter Actions - Removed Padding Left Strip */}
            <div className={`flex items-center gap-2 ${isSearchOpen ? 'flex-1 md:flex-none justify-end md:justify-start md:pl-0' : 'ml-auto'}`}>
              
              {/* Expandable Search Input */}
              <div className={`
                flex items-center transition-all duration-300 ease-in-out
                ${isSearchOpen ? 'w-full md:w-64' : 'w-10 justify-end'}
              `}>
                {isSearchOpen ? (
                    <div className="relative w-full group animate-in fade-in zoom-in-95 duration-200">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            autoFocus
                            type="text"
                            placeholder={`Search ${category === 'All' ? 'media' : category}...`}
                            value={filters.searchQuery}
                            onChange={(e) => handleChange('searchQuery', e.target.value)}
                            className="w-full bg-white/10 hover:bg-white/15 border border-white/10 focus:border-white/30 text-white pl-9 pr-8 py-2 rounded-xl backdrop-blur-xl focus:outline-none transition-all placeholder-slate-400/50 text-sm"
                        />
                        <button 
                            onClick={() => {
                                if (filters.searchQuery) {
                                    handleChange('searchQuery', '');
                                } else {
                                    setIsSearchOpen(false);
                                }
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsSearchOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-transparent hover:border-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] relative group/search"
                        title="Search"
                    >
                        {/* Halo Glow for Search Button - Constant */}
                        <div className="absolute -inset-1 rounded-xl bg-primary/30 blur-md opacity-30 group-hover/search:opacity-100 transition-opacity duration-300 z-[-1]"></div>
                        <Search size={18} />
                    </button>
                )}
              </div>

              {/* Filter Toggle Button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                disabled={isLoading}
                className={`
                    w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 border flex-shrink-0 relative group/filter
                    ${isExpanded 
                        ? 'bg-white/10 text-white border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                        : 'bg-white/5 text-slate-300 border-transparent hover:bg-white/10 hover:text-white hover:border-white/10'}
                    ${isLoading ? 'opacity-80 cursor-wait' : ''}
                `}
                title="Filters"
              >
                {/* Halo Glow for Filter Toggle - Constant */}
                <div className={`absolute -inset-1 rounded-xl bg-primary/30 blur-md opacity-30 group-hover/filter:opacity-100 transition-opacity duration-300 z-[-1] ${isExpanded ? 'opacity-50' : ''}`}></div>

                {isLoading ? (
                    <Loader2 size={18} className="animate-spin text-white" />
                ) : (
                    <SlidersHorizontal size={18} />
                )}
                {/* Active Filter Indicator Dot */}
                {!isLoading && activeFilterCount > 0 && !isExpanded && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full shadow-lg ring-2 ring-black/20"></span>
                )}
              </button>
            </div>
        </div>
        
        {/* Content Style Toggle - Only Visible for Movies & Series (Not on Home) */}
        {category !== 'All' && !isSearchOpen && (
            <div className="flex justify-center animate-in fade-in slide-in-from-top-2 duration-300 relative group/style">
                {/* Halo Glow for Content Style Toggle - Constant */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-64 bg-primary/20 blur-xl opacity-20 group-hover/style:opacity-50 transition-opacity duration-500 rounded-full z-[-1]"></div>

                <div className="bg-black/30 backdrop-blur-md p-1 rounded-full border border-white/10 flex items-center relative shadow-inner scale-90 md:scale-100 origin-top">
                    <button 
                        ref={allRef}
                        onClick={() => handleChange('contentStyle', 'All')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all relative z-10 ${filters.contentStyle === 'All' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        All
                    </button>
                    <button 
                        ref={liveRef}
                        onClick={() => handleChange('contentStyle', 'Live Action')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all relative z-10 flex items-center gap-1 ${filters.contentStyle === 'Live Action' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Zap size={12} className={filters.contentStyle === 'Live Action' ? 'text-cyan-400' : ''} /> Live Action
                    </button>
                    <button 
                        ref={animeRef}
                        onClick={() => handleChange('contentStyle', 'Anime')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all relative z-10 flex items-center gap-1 ${filters.contentStyle === 'Anime' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Sparkles size={12} className={filters.contentStyle === 'Anime' ? 'text-pink-400' : ''} /> Anime
                    </button>

                    {/* Sliding Background Pill */}
                    <div 
                        className={`absolute top-1 bottom-1 bg-white/10 rounded-full border border-white/10 transition-all duration-300 ease-in-out shadow-sm`}
                        style={{
                            left: `${pillStyle.left}px`,
                            width: `${pillStyle.width}px`,
                            opacity: pillStyle.opacity
                        }}
                    ></div>
                </div>
            </div>
        )}

        {/* Collapsible Content */}
        <div className={`
            transition-all duration-300 ease-in-out
            ${isExpanded ? 'opacity-100 h-auto' : 'opacity-0 h-0'}
            ${allowOverflow ? 'overflow-visible' : 'overflow-hidden'}
        `}>
           <div className="min-h-0 space-y-4 pb-4 pt-2 border-t border-white/5 mt-2">
                {/* Sort Options */}
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center pb-2 border-b border-white/[0.05]">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Sort By</span>
                    <div className="flex items-center gap-2 overflow-x-auto w-full no-scrollbar mask-image-linear-gradient pb-1">
                        {sortOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleChange('sortBy', option.value as any)}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all whitespace-nowrap border flex-shrink-0 backdrop-blur-xl relative group/sort ${
                                    filters.sortBy === option.value 
                                    ? 'bg-white/10 text-white border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                                    : 'bg-white/[0.03] text-slate-400 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/10'
                                }`}
                            >
                                {/* Halo Glow for Sort Pills - Constant */}
                                <div className={`absolute -inset-1 rounded-full bg-primary/20 blur-md opacity-30 group-hover/sort:opacity-100 transition-opacity duration-300 z-[-1] ${filters.sortBy === option.value ? 'opacity-50' : ''}`}></div>
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Dropdowns - Using CustomSelect */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="p-2 bg-white/[0.03] rounded-full border border-white/10 mr-1 backdrop-blur-xl shadow-sm">
                        <Filter size={14} className="text-white" />
                    </div>
                    
                    <CustomSelect 
                      label="Themes & Tags" 
                      value={filters.themes} 
                      onChange={(v) => handleChange('themes', v)} 
                      options={generalThemes}
                      searchable
                      multi
                      colorTheme="red"
                      icon={<Tag size={12} />}
                    />
                    
                    {(category === MediaType.MOVIE || category === 'All') && (
                        <CustomSelect 
                            label="Aspect Ratio" 
                            value={filters.aspectRatio || []} 
                            onChange={(v) => handleChange('aspectRatio', v)} 
                            options={aspectRatios}
                            multi
                            colorTheme="purple"
                            icon={<Monitor size={12} />}
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
                      label="Content" 
                      value={filters.contentDescriptors} 
                      onChange={(v) => handleChange('contentDescriptors', v)} 
                      options={contentDescriptors}
                      colorTheme="red"
                      icon={<ShieldAlert size={12} />}
                      multi
                    />

                    <YearFilter 
                        value={filters.year}
                        onChange={(v) => handleChange('year', v)}
                    />

                    <CustomSelect 
                      label="Country" 
                      value={filters.country} 
                      onChange={(v) => handleChange('country', v)} 
                      options={countries}
                      searchable
                      multi
                    />
                    
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
                                animeFormat: [],
                                themes: [],
                                aspectRatio: [],
                                contentDescriptors: [],
                                contentStyle: 'All'
                            }))}
                            className="px-3 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 hover:text-red-300 transition-colors backdrop-blur-sm relative group/reset"
                        >
                            {/* Halo Glow for Reset Button - Constant */}
                            <div className="absolute -inset-2 bg-red-500/30 rounded-full blur-md opacity-30 group-hover/reset:opacity-100 transition-opacity duration-300 z-[-1]"></div>
                            Reset
                        </button>
                    )}
                </div>
           </div>
        </div>

        {/* Global Loading Line at the bottom */}
        {isLoading && (
            <div className="absolute bottom-0 left-0 right-0 h-[1px] w-full overflow-hidden">
                <div className="animate-[shimmer_2s_infinite] h-full w-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;