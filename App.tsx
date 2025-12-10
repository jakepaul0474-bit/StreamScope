import React, { useState } from 'react';
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MediaPage from './pages/MediaPage';
import { DetailsView } from './components/DetailsView';
import WatchlistPage from './pages/WatchlistPage';
import { MediaType } from './types';
import { Menu } from 'lucide-react';
import { MediaProvider } from './context/MediaContext';

const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isDetailsPage = location.pathname.startsWith('/details');

  return (
    <div className="flex bg-transparent min-h-screen font-sans text-slate-100 relative selection:bg-primary/30 selection:text-white">
      {/* Mobile Menu Button - Liquid Glass & Compact - Hidden on Details Page to prevent overlap with Back Button */}
      {!isDetailsPage && (
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 bg-white/[0.05] backdrop-blur-xl border border-white/10 p-2 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 ring-1 ring-white/5"
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