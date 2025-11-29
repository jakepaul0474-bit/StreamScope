import React from 'react';
import { NavLink } from 'react-router-dom';
import { Film, Tv, Clapperboard, Home, X, Bookmark } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { label: 'Discover', path: '/', icon: <Home size={20} /> },
    { label: 'Movies', path: '/movies', icon: <Film size={20} /> },
    { label: 'TV Shows', path: '/shows', icon: <Tv size={20} /> },
    { label: 'Anime', path: '/anime', icon: <Clapperboard size={20} /> },
    { label: 'Watchlist', path: '/watchlist', icon: <Bookmark size={20} /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container - Liquid Glass Gradient */}
      <div className={`
        fixed left-0 top-0 h-screen flex flex-col z-50 transition-transform duration-300
        w-64 md:w-20 lg:w-64
        bg-gradient-to-b from-white/10 to-transparent backdrop-blur-2xl border-r border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between md:justify-center lg:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary/80 to-accent/80 rounded-lg flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-1 ring-white/20"></div>
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 md:hidden lg:block tracking-wider drop-shadow-sm">StreamScope</h1>
          </div>
          
          {/* Mobile Close Button */}
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-2 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()} // Close on mobile when clicked
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-white/15 to-white/5 text-white font-medium border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-md'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white hover:border-white/5 border border-transparent hover:backdrop-blur-sm'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative z-10 flex items-center gap-4">
                    {item.icon}
                    <span className="md:hidden lg:block">{item.label}</span>
                  </div>
                  {isActive && (
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-xl"></div>
                  )}
                  
                  {/* Tooltip for collapsed desktop sidebar */}
                  <div className="hidden md:block lg:hidden absolute left-full top-2 ml-4 px-3 py-1 bg-slate-900/60 backdrop-blur-xl text-white text-xs rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-opacity">
                    {item.label}
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-gradient-to-br from-white/5 to-transparent p-4 rounded-xl md:hidden lg:block backdrop-blur-md border border-white/5 hover:bg-white/10 transition-colors">
              <p className="text-xs text-slate-400 text-center">Powered by Gemini 2.5</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;