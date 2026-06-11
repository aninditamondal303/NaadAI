/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Sparkles, Moon, Sun, Sunrise, Sunset, ShieldAlert, Music } from 'lucide-react';

interface BackdropProps {
  timeOfDay: string;
  themeId: "peacock" | "sunset" | "monsoon";
}

interface ThemeState {
  glowClasses1: string;
  glowClasses2: string;
  themeLabel: string;
  starColor: string;
  gridOpacity: string;
  gridColor: string;
  icon: React.ReactNode;
  ambientTone: string;
  baseBg: string;
  samayChakraColor: string;
}

export const Backdrop: React.FC<BackdropProps> = ({ timeOfDay, themeId }) => {
  const theme = useMemo<ThemeState>(() => {
    const t = timeOfDay.toLowerCase();
    
    // Customize specific features per global theme mode
    if (themeId === "peacock") {
      // Royal Peacock & Cobalt Indigo Theme
      return {
        baseBg: "bg-[#030e12]", 
        glowClasses1: "bg-teal-500/15 mix-blend-screen animate-aurora-slow",
        glowClasses2: "bg-indigo-600/10 mix-blend-screen",
        themeLabel: "MAYŪRA PEACOCK (Royal Teal & Cobalt Indigo)",
        starColor: "text-teal-400/40",
        ambientTone: "border-teal-950 text-teal-400 bg-teal-950/20",
        gridOpacity: "opacity-30",
        gridColor: "[linear-gradient(to_right,#05222a_1px,transparent_1px),linear-gradient(to_bottom,#05222a_1px,transparent_1px)]",
        samayChakraColor: "border-teal-900/40",
        icon: <Music className="h-3 w-3 text-teal-400 animate-pulse" />
      };
    } else if (themeId === "sunset") {
      // Bhairavi Bhajans Marigold Sunset Theme
      return {
        baseBg: "bg-[#180802]", 
        glowClasses1: "bg-orange-500/15 mix-blend-screen animate-aurora-slow",
        glowClasses2: "bg-red-700/10 mix-blend-screen",
        themeLabel: "BHAIRAV SUNSET (Marigold & Temple Copper)",
        starColor: "text-orange-400/40",
        ambientTone: "border-amber-950 text-orange-400 bg-amber-950/20",
        gridOpacity: "opacity-25",
        gridColor: "[linear-gradient(to_right,#2a1208_1px,transparent_1px),linear-gradient(to_bottom,#2a1208_1px,transparent_1px)]",
        samayChakraColor: "border-orange-900/30",
        icon: <Sunrise className="h-3 w-3 text-orange-400" />
      };
    } else {
      // Megh Malhar Monsoon Rain Theme
      return {
        baseBg: "bg-[#04140e]", 
        glowClasses1: "bg-emerald-500/15 mix-blend-screen animate-aurora-slow",
        glowClasses2: "bg-teal-600/10 mix-blend-screen",
        themeLabel: "MEGH MALHAR (Monsoon Jade & Forest Emerald)",
        starColor: "text-emerald-400/40",
        ambientTone: "border-emerald-950 text-emerald-400 bg-emerald-50-20",
        gridOpacity: "opacity-35",
        gridColor: "[linear-gradient(to_right,#062319_1px,transparent_1px),linear-gradient(to_bottom,#062319_1px,transparent_1px)]",
        samayChakraColor: "border-emerald-900/30",
        icon: <Moon className="h-3 w-3 text-emerald-400 animate-pulse" />
      };
    }
  }, [timeOfDay, themeId]);

  // Generate memoized positions for stardust coordinates to prevent flickering or regenerations
  const stars = useMemo(() => {
    return Array.from({ length: 32 }).map((_, i) => ({
      id: i,
      x: (Math.sin(i * 123.45) * 0.5 + 0.5) * 100, // percentage x
      y: (Math.cos(i * 987.653) * 0.5 + 0.5) * 100, // percentage y
      size: (i % 3 === 0) ? 3 : (i % 2 === 0) ? 2 : 1.5,
      delay: `${(i % 5) * 1.5}s`,
      speed: `${4 + (i % 4) * 2}s`
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 transition-colors duration-1000">
      
      {/* 1. Base customizable background canvas */}
      <div className={`absolute inset-0 ${theme.baseBg} transition-colors duration-1000`} />

      {/* 2. Deep galactic time-of-day glowing nebulas with interactive animations */}
      <div className={`absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full blur-[160px] opacity-75 transition-all duration-1000 ${theme.glowClasses1}`} />
      <div className={`absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] rounded-full blur-[140px] opacity-65 transition-all duration-1000 ${theme.glowClasses2}`} />

      {/* 3. Mathematical blueprint frequency grid overlay */}
      <div 
        className={`absolute inset-0 bg-${theme.gridColor} bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] transition-opacity duration-1000 ${theme.gridOpacity}`} 
      />

      {/* 4. Samay Chakra: Slowly spinning ancient 24-hour classical musical compass wheel */}
      <div className={`absolute top-[15%] right-[-10%] md:right-[5%] w-[450px] h-[450px] rounded-full border ${theme.samayChakraColor} border-dashed animate-rotate-ring flex items-center justify-center opacity-30`}>
        <div className={`absolute w-[400px] h-[400px] rounded-full border ${theme.samayChakraColor} flex items-center justify-center`}>
          <div className="absolute text-[8px] font-mono tracking-widest uppercase text-slate-500">
            SURYODAYA ✦ DOPHAR ✦ TWILIGHT ✦ MADHYARATRI
          </div>
          <div className={`absolute w-[300px] h-[300px] rounded-full border ${theme.samayChakraColor} flex items-center justify-center`} />
          {/* Hour radial divisions */}
          {Array.from({ length: 8 }).map((_, idx) => (
            <div 
              key={idx} 
              className="absolute h-full w-[1px] bg-slate-800/10" 
              style={{ transform: `rotate(${idx * 45}deg)` }} 
            />
          ))}
        </div>
      </div>

      {/* 5. Shimmering stardust particles floating gently */}
      <div className="absolute inset-0 animate-float-slow opacity-90">
        {stars.map((star) => (
          <div
            key={star.id}
            className={`absolute rounded-full bg-white/70 animate-shimmer-star shadow-[0_0_8px_white]`}
            style={{
              top: `${star.y}%`,
              left: `${star.x}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: star.delay,
              animationDuration: star.speed
            }}
          />
        ))}
      </div>

      {/* 6. Glowing ambient Thaat/Time overlay status ribbon at the top margin */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10 hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[9px] font-mono tracking-wider font-extrabold uppercase transition-all duration-1000 backdrop-blur-md shadow-2xl bg-slate-950/80 border-slate-800/50 text-slate-100 shadow-purple-950/15">
        <span className="flex h-1.5 w-1.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
        </span>
        <span className="text-slate-400">RAGA DARBAR SYSTEM:</span>
        <span className="text-purple-400 flex items-center gap-1">
          {theme.icon}
          {theme.themeLabel}
        </span>
      </div>

    </div>
  );
};
