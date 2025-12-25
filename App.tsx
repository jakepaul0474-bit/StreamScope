import React, { useState } from 'react';
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MediaPage from './pages/MediaPage';
import { DetailsView } from './components/DetailsView';
import WatchlistPage from './pages/WatchlistPage';
import { MediaType } from './types';
import { Menu } from 'lucide-react';
import { MediaProvider, useMediaContext } from './context/MediaContext';

const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isDetailsPage = location.pathname.startsWith('/details');
  const { isImmersiveMode } = useMediaContext();

  return (
    <div className="flex bg-transparent min-h-screen font-sans text-slate-100 relative selection:bg-primary/30 selection:text-white overflow-x-hidden">
      {/* Mobile Menu Button - Small & Compact Floating */}
      {!isDetailsPage && (
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className={`
            md:hidden fixed top-3 left-3 z-[60] text-slate-300 hover:text-white transition-all duration-300 active:scale-95 bg-black/20 backdrop-blur-md p-1.5 rounded-md border border-white/5 hover:bg-white/10
            ${isImmersiveMode || isMobileMenuOpen ? '-translate-x-[200%] opacity-0' : 'translate-x-0 opacity-100'}
          `}
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>
      )}

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <main className="flex-1 w-full relative z-0">
        <Routes>
          {/* Added 'key' props to force re-mounting when switching categories, ensuring correct state restoration logic runs */}
          <Route path="/" element={<MediaPage key="home" category="All" />} />
          <Route path="/movies" element={<MediaPage key="movies" category={MediaType.MOVIE} />} />
          <Route path="/shows" element={<MediaPage key="shows" category={MediaType.SHOW} />} />
          <Route path="/anime" element={<MediaPage key="anime" category={MediaType.ANIME} />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          
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