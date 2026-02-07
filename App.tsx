import React from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MediaPage from './pages/MediaPage';
import DetailsView from './components/DetailsView';
import WatchlistPage from './pages/WatchlistPage';
import WatchedPage from './pages/WatchedPage';
import SettingsPage from './pages/SettingsPage';
import { MediaType } from './types';
import { MediaProvider, useMediaContext } from './context/MediaContext';

const VisualEffectsOverlay: React.FC = () => {
    const { settings } = useMediaContext();

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {/* SVG Filter Definition for Screen Distortion */}
            <svg className="absolute w-0 h-0">
                <defs>
                    <filter id="screen-distortion">
                        {/* Fractal Noise creates the 'map' for distortion */}
                        <feTurbulence type="fractalNoise" baseFrequency="0.01 0.02" numOctaves="1" result="noise" seed="5" />
                        {/* Displacement Map uses the noise to warp the source graphic */}
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale={settings.distortionStrength * 30} xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </defs>
            </svg>

            {/* Vignette */}
            <div 
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)]"
                style={{ opacity: settings.vignetteStrength }}
            />

            {/* Scanlines */}
            <div 
                className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]"
                style={{ 
                    backgroundSize: "100% 4px, 3px 100%", 
                    opacity: settings.scanlineIntensity 
                }}
            />
            
            {/* Global Glitch Styles Injection */}
            {settings.glitchIntensity > 0 && (
                 <style>{`
                    h1, h2, h3 {
                        text-shadow: 
                            ${settings.glitchIntensity * 2}px 0 rgba(255,0,60,0.5), 
                            -${settings.glitchIntensity * 2}px 0 rgba(0,240,255,0.5);
                    }
                `}</style>
            )}
        </div>
    );
};

const Layout: React.FC = () => {
  const { isMobileMenuOpen, setMobileMenuOpen, settings } = useMediaContext();

  return (
    <div className="flex bg-transparent min-h-screen relative overflow-x-hidden">
      <VisualEffectsOverlay />
      
      {/* Sidebar - Fixed Position, usually stays clearer than content */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      {/* Main Content Area - Applies Distortion Filter here */}
      <main 
        className="flex-1 w-full relative z-0"
        style={{ 
            filter: settings.distortionStrength > 0 ? 'url(#screen-distortion)' : 'none',
            // Ensure hardware acceleration for smoother filtering
            transform: 'translateZ(0)'
        }}
      >
        <Routes>
          <Route path="/" element={<MediaPage key="home" category="All" />} />
          <Route path="/movies" element={<MediaPage key="movies" category={MediaType.MOVIE} />} />
          <Route path="/shows" element={<MediaPage key="shows" category={MediaType.SHOW} />} />
          <Route path="/anime" element={<MediaPage key="anime" category={MediaType.ANIME} />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/watched" element={<WatchedPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/details/:type/:title" element={<DetailsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <MediaProvider>
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    </MediaProvider>
  );
};

export default App;