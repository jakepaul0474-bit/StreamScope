import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMediaContext } from '../context/MediaContext';
import { RotateCcw, Check, ArrowLeft, Zap, Eye, Sliders, Image, Monitor, Upload, CloudLightning, AlertTriangle, WifiOff } from 'lucide-react';

// MOVED OUTSIDE to prevent re-renders killing drag state
const TechSlider = ({ label, value, onChange, min, max, step, style, glowStyle }: any) => {
    const safeValue = isNaN(value) ? min : value;
    const percentage = ((safeValue - min) / (max - min)) * 100;
    
    return (
        <div 
            className="border border-[#333] p-5 relative group hover:border-current transition-colors"
            style={{ ...style, ...glowStyle, color: 'var(--glow-color, #00F0FF)' } as React.CSSProperties}
        >
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">{label}</span>
                <span className="text-xs font-mono text-white/80 bg-white/10 px-2 py-1 rounded-sm min-w-[3rem] text-center" style={{ color: 'var(--glow-color)' }}>
                    {max <= 1 ? Math.round(safeValue * 100) + '%' : safeValue}
                </span>
            </div>
            
            <div className="relative w-full flex items-center justify-center">
                <input 
                    type="range" 
                    min={min} 
                    max={max} 
                    step={step} 
                    value={safeValue} 
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="cyberpunk-slider w-full cursor-pointer appearance-none bg-transparent focus:outline-none"
                    style={{
                        height: '24px', // Taller hit area
                        // Dynamic Gradient Track
                        backgroundImage: `linear-gradient(to right, var(--glow-color) 0%, #fff ${percentage}%, #333 ${percentage}%, #333 100%)`,
                        backgroundSize: '100% 4px', // Thickness of the visual track
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                    }}
                />
            </div>
            
            {/* Custom Thumb Style Override to match glow color */}
            <style>{`
                .group:hover .cyberpunk-slider::-webkit-slider-thumb {
                    border-color: var(--glow-color);
                    box-shadow: 0 0 10px var(--glow-color);
                }
            `}</style>
        </div>
    );
};

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, visualStyles } = useMediaContext();
  const navigate = useNavigate();
  const [originalSettings] = useState(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleBack = () => { updateSettings(originalSettings); navigate(-1); };
  const handleApply = () => navigate(-1);
  const handleReset = () => updateSettings({ 
      haloIntensity: 0.6, 
      glassTransparency: 0.6, 
      reflectionOpacity: 0.3, 
      blurStrength: 40, 
      theme: 'dark',
      scanlineIntensity: 0.1,
      glitchIntensity: 0,
      vignetteStrength: 0.4,
      distortionStrength: 0,
      backgroundImage: 'https://images.unsplash.com/photo-1605218427306-6354db696cea?q=80&w=2574&auto=format&fit=crop'
  });

  // UPDATED BACKGROUNDS: Verified High-Quality Unsplash URLs
  const PRESET_BACKGROUNDS = [
    { id: 'nightcity', url: 'https://images.unsplash.com/photo-1605218427306-6354db696cea?q=80&w=2574&auto=format&fit=crop', label: 'NIGHT_CITY_V1' },
    { id: 'street', url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2574&auto=format&fit=crop', label: 'STREET_LEVEL' },
    { id: 'netrunner', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2574&auto=format&fit=crop', label: 'NETRUNNER' },
    { id: 'arasaka', url: 'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?q=80&w=2574&auto=format&fit=crop', label: 'CORPO_PLAZA' },
    { id: 'badlands', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=2574&auto=format&fit=crop', label: 'BADLANDS' },
    { id: 'pacifica', url: 'https://images.unsplash.com/photo-1496504175726-c7b4523c7e81?q=80&w=2574&auto=format&fit=crop', label: 'PACIFICA' },
    { id: 'afterlife', url: 'https://images.unsplash.com/photo-1553649033-36192d4f3849?q=80&w=2574&auto=format&fit=crop', label: 'AFTERLIFE' },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = event.target.files?.[0];
    if (file) {
      // 4MB limit to prevent localStorage quotas and hanging logic
      if (file.size > 4 * 1024 * 1024) {
          setUploadError("DATA_OVERFLOW: File exceeds 4MB system limit. Compress data packet.");
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            updateSettings({ backgroundImage: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen pl-0 md:pl-20 lg:pl-64 transition-all duration-300 flex flex-col pb-20">
      {/* Header */}
      <div 
          className="w-full border-b border-[#333] sticky top-0 z-50 p-5 flex items-center justify-between shadow-lg"
          style={visualStyles.panel}
      >
          <div className="flex items-center gap-4">
             <button onClick={handleBack} className="p-2 border border-[#333] text-gray-400 hover:text-white hover:border-white transition-all">
                <ArrowLeft size={20} />
             </button>
             <h2 className="text-xl md:text-2xl font-orbitron font-black text-white uppercase tracking-widest flex items-center gap-3">
                 <Sliders className="text-cp-cyan" /> SYS_CONFIG
             </h2>
          </div>
          <div className="flex gap-3">
             <button onClick={handleReset} className="px-4 py-2 border border-[#333] text-xs font-orbitron font-bold text-gray-400 hover:text-white uppercase flex items-center gap-2 hover:bg-white/5 transition-colors">
                 <RotateCcw size={14} /> <span className="hidden sm:inline">RESET</span>
             </button>
             <button onClick={handleApply} className="px-6 py-2 bg-cp-yellow text-black text-xs font-orbitron font-bold uppercase hover:bg-white transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(252,238,10,0.4)]" style={{ clipPath: "polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 30%)" }}>
                 <Check size={14} /> APPLY
             </button>
          </div>
      </div>

      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full flex-1 flex flex-col gap-12">
        
        {/* Background Selection (Cyan Theme) */}
        <section className="space-y-4" style={{ '--glow-color': '#00F0FF' } as React.CSSProperties}>
             <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                <div className="w-1.5 h-4 bg-cp-cyan shadow-[0_0_8px_#00F0FF]"></div>
                <h3 className="text-sm font-orbitron font-bold text-gray-400 uppercase tracking-[0.2em]">ENVIRONMENT_DATA</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {PRESET_BACKGROUNDS.map(bg => (
                    <button 
                        key={bg.id}
                        onClick={() => updateSettings({ backgroundImage: bg.url })}
                        className={`aspect-video relative group overflow-hidden border-2 transition-all ${settings.backgroundImage === bg.url ? 'border-cp-cyan shadow-[0_0_10px_#00F0FF]' : 'border-transparent hover:border-cp-cyan/50'}`}
                    >
                        <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-orbitron font-bold text-white text-center px-1">{bg.label}</span>
                        </div>
                        {settings.backgroundImage === bg.url && (
                             <div className="absolute top-1 right-1 bg-cp-cyan text-black p-0.5 rounded-full"><Check size={10} /></div>
                        )}
                    </button>
                ))}
                
                {/* Custom Upload */}
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video border border-dashed border-gray-600 hover:border-cp-cyan flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-cp-cyan transition-colors bg-black/20 relative"
                >
                    <Upload size={20} />
                    <span className="text-[10px] font-orbitron font-bold">UPLOAD_CUSTOM</span>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept="image/*"
                    />
                </button>
            </div>
            {uploadError && (
                <div className="flex items-center gap-2 text-cp-red text-xs font-mono mt-2 bg-cp-red/10 p-2 border border-cp-red/30">
                    <AlertTriangle size={14} />
                    {uploadError}
                </div>
            )}
        </section>

        {/* Visual Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Column 1: Interface & Core (Yellow Theme) */}
            <div className="space-y-8" style={{ '--glow-color': '#FCEE0A' } as React.CSSProperties}>
                {/* Interface Sliders */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                        <div className="w-1.5 h-4 bg-cp-yellow shadow-[0_0_8px_#FCEE0A]"></div>
                        <h3 className="text-sm font-orbitron font-bold text-gray-400 uppercase tracking-[0.2em]">UI_CALIBRATION</h3>
                    </div>
                    <div className="space-y-6">
                        <TechSlider label="GLASS_OPACITY" value={settings.glassTransparency} onChange={(v: number) => updateSettings({ glassTransparency: v })} min={0} max={1} step={0.01} style={visualStyles.panel} glowStyle={visualStyles.glow} />
                        <TechSlider label="BLUR_INTENSITY" value={settings.blurStrength} onChange={(v: number) => updateSettings({ blurStrength: v })} min={0} max={60} step={1} style={visualStyles.panel} glowStyle={visualStyles.glow} />
                        <TechSlider label="HALO_GLOW" value={settings.haloIntensity} onChange={(v: number) => updateSettings({ haloIntensity: v })} min={0} max={1} step={0.01} style={visualStyles.panel} glowStyle={visualStyles.glow} />
                        <TechSlider label="BORDER_VISIBILITY" value={settings.reflectionOpacity} onChange={(v: number) => updateSettings({ reflectionOpacity: v })} min={0} max={1} step={0.01} style={visualStyles.panel} glowStyle={visualStyles.glow} />
                    </div>
                </section>
            </div>

            {/* Column 2: Advanced Visuals (Red Theme) */}
            <div className="space-y-8" style={{ '--glow-color': '#FF003C' } as React.CSSProperties}>
                <section className="space-y-6">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                        <div className="w-1.5 h-4 bg-cp-red shadow-[0_0_8px_#FF003C]"></div>
                        <h3 className="text-sm font-orbitron font-bold text-gray-400 uppercase tracking-[0.2em]">ADVANCED_POST_FX</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4 text-xs font-mono text-gray-500">
                             <Monitor size={14} className="text-cp-red" />
                             <span>WARNING: HIGH VALUES MAY IMPACT READABILITY</span>
                        </div>

                        <TechSlider label="SCANLINE_DENSITY" value={settings.scanlineIntensity} onChange={(v: number) => updateSettings({ scanlineIntensity: v })} min={0} max={1} step={0.05} style={visualStyles.panel} glowStyle={visualStyles.glow} />
                        <TechSlider label="CHROMATIC_ABERRATION" value={settings.glitchIntensity} onChange={(v: number) => updateSettings({ glitchIntensity: v })} min={0} max={1} step={0.05} style={visualStyles.panel} glowStyle={visualStyles.glow} />
                        <TechSlider label="SCREEN_VIGNETTE" value={settings.vignetteStrength} onChange={(v: number) => updateSettings({ vignetteStrength: v })} min={0} max={1} step={0.05} style={visualStyles.panel} glowStyle={visualStyles.glow} />
                        <TechSlider label="SCREEN_DISTORTION" value={settings.distortionStrength} onChange={(v: number) => updateSettings({ distortionStrength: v })} min={0} max={1} step={0.05} style={visualStyles.panel} glowStyle={visualStyles.glow} />
                    </div>

                    {/* Preview Box for Effects */}
                    <div className="mt-8 border border-[#333] p-4 relative overflow-hidden" style={{ ...visualStyles.panel, ...visualStyles.glow } as React.CSSProperties}>
                         <div className="absolute top-0 left-0 w-4 h-1 bg-cp-red"></div>
                         <h4 className="text-xs font-orbitron font-bold text-white mb-2">FX_PREVIEW</h4>
                         <div className="text-4xl font-black font-orbitron text-white text-center py-8 tracking-widest relative">
                             CYBERPUNK
                             {/* Local glitch preview just for this text */}
                             <div className="absolute inset-0 text-cp-red opacity-50 mix-blend-screen" style={{ transform: `translate(${settings.glitchIntensity * 2}px, 0)` }}>CYBERPUNK</div>
                             <div className="absolute inset-0 text-cp-cyan opacity-50 mix-blend-screen" style={{ transform: `translate(-${settings.glitchIntensity * 2}px, 0)` }}>CYBERPUNK</div>
                         </div>
                         {settings.distortionStrength > 0 && (
                             <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[9px] font-mono text-cp-red animate-pulse">
                                 <WifiOff size={10} /> SIGNAL_LOSS: {Math.round(settings.distortionStrength * 100)}%
                             </div>
                         )}
                    </div>
                </section>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;