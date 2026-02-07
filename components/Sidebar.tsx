import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Film, Tv, Home, X, Bookmark, Settings, HelpCircle, Zap, Flame, Trophy, CalendarClock, BarChart, Ticket, Eye, Activity, Wifi, Disc } from 'lucide-react';
import { useMediaContext } from '../context/MediaContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { settings, visualStyles } = useMediaContext();
  const [randomBars, setRandomBars] = useState<number[]>([]);

  // Simulate network activity graph
  useEffect(() => {
      const interval = setInterval(() => {
          setRandomBars(prev => {
              const next = [...prev, Math.random() * 100];
              if (next.length > 20) next.shift();
              return next;
          });
      }, 500);
      return () => clearInterval(interval);
  }, []);

  const menuGroups = [
      {
          title: "SYSTEM",
          items: [
            { label: 'DISCOVER', path: '/', icon: <Home size={18} /> },
            { label: 'MOVIES', path: '/movies', icon: <Film size={18} /> },
            { label: 'SERIES', path: '/shows', icon: <Tv size={18} /> },
            { label: 'ANIME', path: '/anime', icon: <Zap size={18} /> },
          ]
      },
      {
          title: "DATA_BANKS",
          items: [
            { label: 'WATCHLIST', path: '/watchlist', icon: <Bookmark size={18} /> },
            { label: 'HISTORY', path: '/watched', icon: <Eye size={18} /> },
          ]
      },
      {
          title: "FILTERS",
          items: [
             { label: 'TRENDING', path: '/movies?sort=trending', icon: <Flame size={18} /> },
             { label: 'TOP_RATED', path: '/movies?sort=rating', icon: <Trophy size={18} /> },
             { label: 'UPCOMING', path: '/movies?sort=newest', icon: <CalendarClock size={18} /> },
          ]
      },
      {
          title: "CONFIG",
          items: [
              { label: 'SETTINGS', path: '/settings', icon: <Settings size={18} /> },
          ]
      }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-[60] md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`
            fixed left-0 top-0 h-screen flex flex-col z-[70] transition-transform duration-300 ease-out border-r border-[#333] shadow-[5px_0_30px_rgba(0,0,0,0.5)]
            w-72 md:w-20 lg:w-64 backdrop-blur-xl overflow-hidden
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ ...visualStyles.border }}
      >
        {/* --- DYNAMIC CYBERPUNK BACKGROUND --- */}
        <div className="absolute inset-0 z-0">
            {/* 1. Base Image from Settings (Monochrome & Darkened) */}
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-40 grayscale mix-blend-luminosity"
                style={{ backgroundImage: `url('${settings.backgroundImage}')` }}
            ></div>

            {/* 2. Cyberpunk Grid Mesh Overlay */}
            <div 
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(0, 240, 255, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 240, 255, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                    maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)' 
                }}
            ></div>

            {/* 3. Vignette / Darkening Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#050505]/90 to-black"></div>
        </div>

        {/* Logo Section */}
        <div className="p-6 flex items-center justify-between md:justify-center lg:justify-start gap-3 border-b border-[#333] bg-transparent relative overflow-hidden shrink-0 z-10">
           <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cp-yellow"></div>
           <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cp-cyan to-transparent opacity-50"></div>
           
           <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-cp-yellow text-black flex items-center justify-center font-black text-xl clip-chamfer shadow-[0_0_15px_#FCEE0A]">
                  S
              </div>
              <h1 className="text-xl font-orbitron font-bold tracking-[0.2em] text-white md:hidden lg:block truncate">
                  <span className="text-cp-cyan">STREAM</span>SCOPE
              </h1>
           </div>
           
           <button onClick={onClose} className="md:hidden text-cp-red hover:text-white transition-colors">
              <X size={24} />
           </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide relative z-10">
          {menuGroups.map((group, idx) => (
              <div key={idx}>
                  <div className="px-2 mb-3 text-[11px] font-bold text-cp-yellow/90 font-orbitron tracking-[0.2em] md:hidden lg:block border-l-2 border-cp-yellow pl-2 shadow-[0_0_10px_rgba(252,238,10,0.2)]">
                      {group.title}
                  </div>
                  <div className="space-y-1">
                      {group.items.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.path}
                            onClick={() => onClose()}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-4 py-3 relative group overflow-hidden transition-all duration-200 rounded-sm
                                ${isActive 
                                    ? 'bg-cp-red/10 text-cp-red shadow-[inset_2px_0_0_0_#FF003C]' 
                                    : 'text-cp-yellow/60 hover:text-cp-yellow hover:bg-white/5'
                                }`
                            }
                            style={({ isActive }) => ({ 
                                clipPath: "polygon(0 0, 100% 0, 100% 100%, 10% 100%, 0 80%)",
                                '--glow-color': isActive ? '#FF003C' : '#FCEE0A' 
                            } as React.CSSProperties)}
                        >
                        {({ isActive }) => (
                            <>
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cp-red shadow-[0_0_10px_#FF003C]"></div>}
                                
                                <span className={`relative z-10 transition-colors ${isActive ? 'text-cp-red drop-shadow-[0_0_5px_var(--glow-color)]' : 'group-hover:text-cp-yellow'}`}>
                                    {item.icon}
                                </span>
                                <span className={`md:hidden lg:block text-xs font-bold font-orbitron tracking-wider ${isActive ? 'text-cp-red' : 'text-cp-yellow/60 group-hover:text-cp-yellow'}`}>
                                    {item.label}
                                </span>
                                
                                {/* Hover Decoration */}
                                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </>
                        )}
                        </NavLink>
                      ))}
                  </div>
              </div>
          ))}
        </nav>

        {/* ARTIFACT: Network Status Footer */}
        <div className="p-4 border-t border-[#333] bg-black/40 backdrop-blur-md shrink-0 space-y-3 relative overflow-hidden z-10">
             {/* Decorative Scanline */}
             <div className="absolute top-0 left-0 w-full h-[1px] bg-cp-red/50"></div>
             
             {/* Stats Row */}
             <div className="flex items-end justify-between md:hidden lg:flex">
                 <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-2 text-[10px] font-mono text-cp-cyan">
                         <Wifi size={10} className="animate-pulse" />
                         <span>NET_LINK: SECURE</span>
                     </div>
                     <div className="flex items-center gap-2 text-[10px] font-mono text-cp-yellow">
                         <Disc size={10} />
                         <span>MEM: 64TB</span>
                     </div>
                 </div>
                 <div className="flex gap-[1px] items-end h-6">
                     {randomBars.map((h, i) => (
                         <div key={i} className="w-1 bg-cp-red/50" style={{ height: `${h}%` }}></div>
                     ))}
                 </div>
             </div>

             {/* Version & Barcode */}
             <div className="flex items-center justify-between opacity-70 text-[10px] font-mono text-slate-400 pt-2 border-t border-white/10">
                 <div className="flex flex-col">
                    <span className="text-slate-300 font-bold">SYS.VER.2.0.77</span>
                    <span>UID: #884-X9</span>
                 </div>
                 {/* Fake Barcode */}
                 <div className="flex h-4 gap-[2px]">
                     {[...Array(10)].map((_,i) => (
                         <div key={i} className="w-[2px] bg-slate-500" style={{ opacity: Math.random() }}></div>
                     ))}
                 </div>
             </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;