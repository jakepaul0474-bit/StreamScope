import React from 'react';
import { NavLink } from 'react-router-dom';
import { Film, Tv, Home, X, Bookmark, Sparkles, Zap, Flame, Trophy, CalendarClock, History, Settings, HelpCircle, LogOut } from 'lucide-react';
import { useMediaContext } from '../context/MediaContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { enableAIImages, toggleAIImages } = useMediaContext();

  const menuGroups = [
      {
          title: "Menu",
          items: [
            { label: 'Discover', path: '/', icon: <Home size={20} /> },
            { label: 'Movies', path: '/movies', icon: <Film size={20} /> },
            { label: 'Series', path: '/shows', icon: <Tv size={20} /> },
            { label: 'Anime', path: '/anime', icon: <Zap size={20} /> },
          ]
      },
      {
          title: "Library",
          items: [
            { label: 'Watchlist', path: '/watchlist', icon: <Bookmark size={20} /> },
            { label: 'History', path: '/history', icon: <History size={20} /> }, // Placeholder route
          ]
      },
      {
          title: "Collections",
          items: [
             { label: 'Trending', path: '/movies?sort=trending', icon: <Flame size={20} /> },
             { label: 'Top Rated', path: '/movies?sort=rating', icon: <Trophy size={20} /> },
             { label: 'Upcoming', path: '/movies?sort=newest', icon: <CalendarClock size={20} /> },
          ]
      },
      {
          title: "General",
          items: [
              { label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
              { label: 'Help', path: '/help', icon: <HelpCircle size={20} /> },
          ]
      }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container - Liquid Glass Gradient */}
      <div className={`
        fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 ease-out
        /* Desktop Styles (Always Visible) */
        md:translate-x-0 md:w-20 lg:w-64 md:opacity-100 md:visible
        md:bg-[#0f172a]/95 md:backdrop-blur-3xl md:border-r md:border-white/[0.05] md:shadow-[0_0_50px_rgba(0,0,0,0.5)]
        
        /* Mobile Styles (Conditional) */
        ${isOpen 
            ? 'translate-x-0 w-72 opacity-100 visible bg-[#0f172a]/95 backdrop-blur-3xl border-r border-white/[0.05] shadow-[0_0_50px_rgba(0,0,0,0.5)]' 
            : '-translate-x-full w-0 opacity-0 invisible bg-transparent border-none shadow-none'}
      `}>
        <div className="p-6 flex items-center justify-between md:justify-center lg:justify-start gap-3 relative overflow-hidden shrink-0">
          {/* Decorative background glow for logo area */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex-shrink-0 shadow-[0_0_20px_rgba(59,130,246,0.5)] ring-1 ring-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-bold text-white md:hidden lg:block tracking-wide drop-shadow-sm">StreamScope</h1>
          </div>
          
          {/* Mobile Close Button */}
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full border border-white/10 hover:bg-white/10 relative group/close">
            <div className="absolute -inset-1 rounded-full bg-red-500/20 blur-md opacity-30 group-hover/close:opacity-100 transition-opacity duration-300 z-[-1]"></div>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-2 space-y-6">
          {menuGroups.map((group, idx) => (
              <div key={idx}>
                  <div className="px-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest md:hidden lg:block opacity-70">
                      {group.title}
                  </div>
                  <div className="space-y-1">
                      {group.items.map((item) => (
                        <NavLink
                        key={item.label}
                        to={item.path}
                        onClick={() => onClose()}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-visible ${
                            isActive
                                ? 'bg-gradient-to-r from-primary/20 to-blue-600/10 text-white font-semibold border border-white/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white hover:border-white/5 border border-transparent'
                            }`
                        }
                        >
                        {({ isActive }) => (
                            <>
                            {/* Halo Glow for Active Items */}
                            {isActive && (
                                <div className="absolute -inset-1 bg-primary/30 rounded-xl blur-lg opacity-60 z-[-1]"></div>
                            )}
                            
                            {/* Hover Glow for Inactive Items - Constant Low Opacity */}
                            {!isActive && (
                                <div className="absolute -inset-1 bg-white/10 rounded-xl blur-md opacity-20 group-hover:opacity-100 transition-opacity duration-300 z-[-1]"></div>
                            )}

                            <div className={`relative z-10 flex items-center gap-4 transition-transform duration-300 ${isActive ? 'translate-x-1' : ''}`}>
                                <span className={`${isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''}`}>{item.icon}</span>
                                <span className="md:hidden lg:block text-sm">{item.label}</span>
                            </div>
                            
                            {/* Active Indicator Bar */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                            )}

                            {/* Tooltip for collapsed desktop sidebar */}
                            <div className="hidden md:block lg:hidden absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-slate-900/90 backdrop-blur-xl text-white text-xs font-medium rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                                {item.label}
                            </div>
                            </>
                        )}
                        </NavLink>
                      ))}
                  </div>
              </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/[0.05] space-y-3 bg-black/20 shrink-0">
          {/* AI Toggle for Desktop/Mobile */}
          <div className="flex flex-col gap-2 p-3 bg-white/[0.03] rounded-xl border border-white/[0.05] relative group/ai">
             {/* Glow for container */}
             <div className="absolute -inset-1 bg-white/5 rounded-xl blur-md opacity-20 group-hover/ai:opacity-100 transition-opacity duration-300 z-[-1]"></div>
             
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300 md:hidden lg:flex">
                    <Sparkles size={14} className={enableAIImages ? "text-primary" : "text-slate-500"} />
                    <span>AI Posters</span>
                </div>
                {/* Collapsed Icon Only */}
                <div className="hidden md:flex lg:hidden justify-center w-full">
                     <Sparkles size={16} className={enableAIImages ? "text-primary" : "text-slate-500"} />
                </div>

                <button 
                  onClick={toggleAIImages}
                  className={`w-9 h-5 rounded-full transition-all duration-300 relative flex-shrink-0 cursor-pointer group/toggle ${enableAIImages ? 'bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}`}
                  title="Toggle AI Generated Posters"
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm ${enableAIImages ? 'translate-x-5' : 'translate-x-1'}`}></div>
                  
                  {/* Toggle Glow */}
                   <div className={`absolute -inset-2 bg-primary/40 rounded-full blur-md opacity-20 transition-opacity duration-300 z-[-1] ${enableAIImages ? 'group-hover/toggle:opacity-100' : ''}`}></div>
                </button>
             </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-3 px-2 py-2 text-slate-500 hover:text-white cursor-pointer transition-colors relative group/logout">
              <div className="absolute -inset-1 bg-red-500/10 rounded-lg blur-md opacity-20 group-hover/logout:opacity-100 transition-opacity duration-300 z-[-1]"></div>
              <LogOut size={18} />
              <span className="text-xs font-medium">Log Out</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;