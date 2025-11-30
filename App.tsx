import React, { useState } from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MediaPage from './pages/MediaPage';
import { DetailsView } from './components/DetailsView';
import WatchlistPage from './pages/WatchlistPage';
import { MediaType } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <MemoryRouter>
      <div className="flex bg-transparent min-h-screen font-sans text-slate-100 relative selection:bg-primary/30 selection:text-white">
        {/* Mobile Menu Button - Liquid Glass & Compact */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 bg-slate-900/30 backdrop-blur-xl border border-white/10 p-2 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 ring-1 ring-white/5"
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>

        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        
        <main className="flex-1 w-full relative z-0">
          <Routes>
            <Route path="/" element={<MediaPage category="All" />} />
            <Route path="/movies" element={<MediaPage category={MediaType.MOVIE} />} />
            <Route path="/shows" element={<MediaPage category={MediaType.SHOW} />} />
            <Route path="/anime" element={<MediaPage category={MediaType.ANIME} />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            
            <Route path="/details/:type/:title" element={<DetailsView />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </MemoryRouter>
  );
};

export default App;