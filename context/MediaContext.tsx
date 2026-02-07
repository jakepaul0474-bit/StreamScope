import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { FilterState, MediaItem, AppSettings } from '../types';

interface PageState {
  items: MediaItem[];
  filters: FilterState;
  page: number;
  hasMore: boolean;
  scrollY: number;
}

interface VisualStyles {
    panel: React.CSSProperties;
    border: React.CSSProperties;
    glow: React.CSSProperties;
}

interface MediaContextType {
  getCachedState: (key: string) => PageState | undefined;
  setCachedState: (key: string, state: PageState) => void;
  
  // Persisted Filters
  savedFilters: FilterState | undefined;
  setSavedFilters: (filters: FilterState) => void;

  clearCache: () => void;
  
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  isImmersiveMode: boolean;
  toggleImmersiveMode: () => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  
  visualStyles: VisualStyles;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
    theme: 'dark',
    haloIntensity: 0.6,
    glassTransparency: 0.6,
    reflectionOpacity: 0.2,
    blurStrength: 10,
    backgroundImage: 'https://images.unsplash.com/photo-1605218427306-6354db696cea?q=80&w=2574&auto=format&fit=crop',
    scanlineIntensity: 0.1,
    glitchIntensity: 0,
    vignetteStrength: 0.4,
    distortionStrength: 0,
};

export const MediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use a Ref to store the cache, initialized from SessionStorage to persist across reloads
  // We use sessionStorage so the cache survives page reloads (dev cycles) but clears on tab close
  const cache = useRef<Record<string, PageState> | null>(null);

  // Synchronous initialization to ensure cache is available on first render
  if (cache.current === null) {
      try {
          const saved = sessionStorage.getItem('streamscope_media_cache');
          cache.current = saved ? JSON.parse(saved) : {};
      } catch (e) {
          console.warn('Failed to load media cache:', e);
          cache.current = {};
      }
  }
  
  // Persisted Filters State
  const [savedFilters, setSavedFiltersState] = useState<FilterState | undefined>(() => {
      try {
          const saved = localStorage.getItem('streamscope_filters');
          return saved ? JSON.parse(saved) : undefined;
      } catch {
          return undefined;
      }
  });

  const setSavedFilters = (filters: FilterState) => {
      setSavedFiltersState(filters);
      try {
        localStorage.setItem('streamscope_filters', JSON.stringify(filters));
      } catch (e) {
        console.warn('LocalStorage Write Failed (Filters):', e);
      }
  };

  // Initialize Settings from LocalStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
        const saved = localStorage.getItem('appSettings');
        if (saved) {
            // Merge with default to handle removed keys gracefully
            const parsed = JSON.parse(saved);
            return { ...DEFAULT_SETTINGS, ...parsed };
        }
        return DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
  });

  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // 1. Apply Background Image IMMEDIATELY so the UI updates regardless of storage success
    document.body.style.backgroundImage = `url('${settings.backgroundImage}')`;
    
    // 2. Apply Global Theme Classes
    if (settings.theme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }

    // 3. Set CSS Variables for Visual Effects
    const r = document.documentElement;
    r.style.setProperty('--scanline-opacity', settings.scanlineIntensity.toString());
    r.style.setProperty('--vignette-opacity', settings.vignetteStrength.toString());
    r.style.setProperty('--glitch-amount', `${settings.glitchIntensity * 2}px`);

    // 4. Try to save to LocalStorage LAST
    try {
        localStorage.setItem('appSettings', JSON.stringify(settings));
    } catch (e) {
        console.warn('Failed to save settings to localStorage (likely quota exceeded due to background image)', e);
    }

  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleImmersiveMode = () => {
    setIsImmersiveMode(prev => !prev);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const setMobileMenuOpen = (open: boolean) => {
    setIsMobileMenuOpen(open);
  };

  const getCachedState = (key: string) => {
    return cache.current ? cache.current[key] : undefined;
  };

  const setCachedState = (key: string, state: PageState) => {
    if (cache.current) {
        cache.current[key] = state;
        try {
            sessionStorage.setItem('streamscope_media_cache', JSON.stringify(cache.current));
        } catch (e) {
            console.warn('Failed to persist media cache to sessionStorage', e);
        }
    }
  };

  const clearCache = () => {
    cache.current = {};
    sessionStorage.removeItem('streamscope_media_cache');
    setSavedFiltersState(undefined);
    try {
        localStorage.removeItem('streamscope_filters');
    } catch (e) { console.warn('LocalStorage Remove Failed:', e); }
  };

  // Compute Dynamic Styles based on settings
  const glowOpacityPercent = Math.max(0, 100 - (settings.haloIntensity * 100));
  const glowColorString = `color-mix(in srgb, var(--glow-color, currentColor), transparent ${glowOpacityPercent}%)`;
  
  const visualStyles: VisualStyles = {
      panel: {
          backgroundColor: `rgba(0, 0, 0, ${settings.glassTransparency})`,
          backdropFilter: `blur(${settings.blurStrength}px)`,
          WebkitBackdropFilter: `blur(${settings.blurStrength}px)`,
      },
      glow: {
          boxShadow: settings.haloIntensity > 0.05 ? `
            0 0 ${settings.haloIntensity * 5}px ${glowColorString}, 
            0 0 ${settings.haloIntensity * 20}px ${glowColorString}, 
            0 0 ${settings.haloIntensity * 50}px ${glowColorString}
          ` : 'none',
          transition: 'box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
      },
      border: {
          borderColor: `rgba(255, 255, 255, ${settings.reflectionOpacity})`,
      }
  };

  return (
    <MediaContext.Provider value={{ 
        getCachedState, 
        setCachedState, 
        savedFilters,
        setSavedFilters,
        clearCache,
        settings,
        updateSettings,
        isImmersiveMode,
        toggleImmersiveMode,
        isMobileMenuOpen,
        setMobileMenuOpen,
        toggleMobileMenu,
        visualStyles
    }}>
      {children}
    </MediaContext.Provider>
  );
};

export const useMediaContext = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMediaContext must be used within a MediaProvider');
  }
  return context;
};