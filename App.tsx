import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MediaPage from './pages/MediaPage';
import DetailsView from './components/DetailsView';
import WatchlistPage from './pages/WatchlistPage';
import { MediaType } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <HashRouter>
      <div className="flex bg-background min-h-screen font-sans text-slate-100 relative">
        {/* Mobile Menu Button - Increased visibility and Z-index */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 bg-primary p-2.5 rounded-lg shadow-xl text-white hover:bg-blue-600 transition-all active:scale-95"
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>

        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        
        <main className="flex-1 w-full">
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
    </HashRouter>
  );
};

export default App;