import React from 'react';
import {
  Sparkles,
  ExternalLink,
  ShoppingBag,
  Zap,
  ArrowLeft,
  Cpu,
  Database,
  Palette,
} from 'lucide-react';
import { playHoverSound, playSelectSound } from '../../utils/audio';

interface CreatorTabProps {
  onBackToHud: () => void;
}

export const CreatorTab: React.FC<CreatorTabProps> = ({ onBackToHud }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-[#002D80] border-3 border-white shadow-[6px_6px_0px_#001F5C] relative overflow-hidden">
        {/* Corner triangle shards */}
        <div className="absolute top-0 right-0 w-8 h-8 bg-white clip-p3r-triangle pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-6 h-6 bg-[#FF0055] clip-p3r-triangle pointer-events-none rotate-180"></div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#FF0055] text-white text-[10px] font-black px-1.5 py-0.5 tracking-wider font-p3r">
              ⚡ SYSTEM
            </span>
            <span className="text-xs font-mono text-white font-extrabold tracking-widest uppercase">
              BUILDER PROFILE // OPERATIVE ARCHITECT
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-p3r">
            ABOUT THE CREATOR
          </h1>
        </div>

        <button
          onClick={() => {
            playSelectSound();
            onBackToHud();
          }}
          onMouseEnter={playHoverSound}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#FF0055] text-[#002D80] hover:text-white font-p3r font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C]"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
          <span>← BACK TO HUD</span>
        </button>
      </div>

      {/* Main Builder Card */}
      <div className="p-6 bg-[#002D80] border-3 border-white shadow-[6px_6px_0px_#001F5C] grid grid-cols-1 md:grid-cols-12 gap-8 relative overflow-hidden">
        {/* Floating corner lightning */}
        <div className="absolute -top-3 -right-3 text-white/10 pointer-events-none select-none">
          <Zap className="w-24 h-24 fill-white" />
        </div>

        {/* Creator Avatar & Identity Column */}
        <div className="md:col-span-4 flex flex-col items-center text-center">
          <div className="relative inline-block mb-3">
            {/* Corner triangle on avatar */}
            <div className="absolute -top-2 -left-2 w-5 h-5 bg-[#FF0055] clip-p3r-triangle z-10"></div>

            <img
              src="/static/creator.PNG"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=Anas';
              }}
              alt="Anas Ben Maouia"
              className="w-44 h-44 sm:w-48 sm:h-48 object-cover border-3 border-white shadow-[4px_4px_0px_#001F5C] bg-[#001F5C]"
            />

            {/* Rank Badge */}
            <div className="absolute -bottom-2 -right-2 bg-[#FF0055] text-white font-black font-p3r text-xs px-2.5 py-1 border-2 border-white shadow-[2px_2px_0px_#001F5C] tracking-wider">
              ⚡ RANK V
            </div>
          </div>

          <h2 className="text-xl font-black text-white uppercase font-p3r tracking-wide mt-2">
            Anas Ben Maouia
          </h2>
          <div className="text-xs font-mono font-black text-white bg-[#001F5C] px-2.5 py-0.5 border border-white/60 tracking-wider uppercase mt-1">
            LEAD DEVELOPER & ARCHITECT
          </div>

          <div className="text-[11px] font-mono font-bold text-white/90 mt-1">
            Alias: <span className="text-white font-black">@Echo</span> · Age 16
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap gap-2 justify-center mt-4 w-full">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={playHoverSound}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001F5C] hover:bg-white text-white hover:text-[#002D80] text-xs font-p3r font-black border-2 border-white/60 shadow-[2px_2px_0px_#001F5C] transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={playHoverSound}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001F5C] hover:bg-white text-white hover:text-[#002D80] text-xs font-p3r font-black border-2 border-white/60 shadow-[2px_2px_0px_#001F5C] transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <span>LinkedIn</span>
            </a>
          </div>

          {/* External Projects Links */}
          <div className="flex flex-col gap-2 w-full mt-3">
            <a
              href="https://www.instagram.com/_ech0_____/"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={playHoverSound}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FF0055] text-[#002D80] hover:text-white text-xs font-p3r font-black border-2 border-[#001F5C] shadow-[2px_2px_0px_#001F5C] transition-colors"
            >
              <span>📸 Instagram: @_ech0_____</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
            </a>

            <a
              href="https://kitsune-shop-six.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={playHoverSound}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#FF0055] hover:bg-white text-white hover:text-[#002D80] text-xs font-p3r font-black border-2 border-[#001F5C] shadow-[2px_2px_0px_#001F5C] transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>🚀 Kitsune Shop (Manga Store)</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
            </a>
          </div>
        </div>

        {/* Creator Bio & Info Column */}
        <div className="md:col-span-8 space-y-5">
          {/* Section 1: The Vision */}
          <div className="p-4 bg-[#001F5C] border-2 border-white/60 shadow-[3px_3px_0px_#001F5C] relative">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b-2 border-white/30">
              <span className="text-[#FF0055] font-black text-sm">⚡</span>
              <h3 className="text-xs font-black text-white uppercase tracking-widest font-p3r">
                // THE VISION & ORIGIN
              </h3>
            </div>
            <p className="text-white text-xs leading-relaxed font-bold">
              Hi! I'm <strong className="text-white bg-[#002D80] px-1 border border-white/40">Anas</strong>, also known as <strong className="text-white bg-[#002D80] px-1 border border-white/40">Echo</strong>, Creator of <strong className="text-white bg-[#002D80] px-1 border border-white/40">PROJECT NOVA</strong>. 
              I'm a 16-year-old student who studies at CIS International School of Tunis.
            </p>
            <p className="text-white text-xs leading-relaxed font-bold mt-2">
              I built NOVA to turn real-life progress—academics, vitality, culture, and memories—into a gamified, visible stats engine inspired by the UI/UX of <em className="text-white underline">Persona 3 Reload</em>.
            </p>
            <p className="text-white/90 text-xs leading-relaxed mt-2 font-medium">
              I also built another project during the summer called <strong>Kitsune Shop</strong> that facilitates the selling of real and authentic manga in Tunisia.
            </p>
          </div>

          {/* Section 2: Project Stack & Specs */}
          <div className="p-4 bg-[#001F5C] border-2 border-white/60 shadow-[3px_3px_0px_#001F5C]">
            <div className="flex items-center gap-2 mb-3 pb-1.5 border-b-2 border-white/30">
              <span className="text-[#FF0055] font-black text-sm">⚡</span>
              <h3 className="text-xs font-black text-white uppercase tracking-widest font-p3r">
                // PROJECT STACK & ARCHITECTURAL SPECS
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-[#002D80] border-2 border-white/40 shadow-[2px_2px_0px_#001F5C]">
                <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-mono font-bold mb-1">
                  <Cpu className="w-3 h-3 text-[#38BDF8]" />
                  <span>BACKEND</span>
                </div>
                <div className="text-xs font-black text-white font-p3r">
                  FastAPI / Python
                </div>
              </div>

              <div className="p-2.5 bg-[#002D80] border-2 border-white/40 shadow-[2px_2px_0px_#001F5C]">
                <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-mono font-bold mb-1">
                  <Database className="w-3 h-3 text-[#38BDF8]" />
                  <span>DATABASE</span>
                </div>
                <div className="text-xs font-black text-white font-p3r">
                  Turso (libSQL)
                </div>
              </div>

              <div className="p-2.5 bg-[#002D80] border-2 border-white/40 shadow-[2px_2px_0px_#001F5C]">
                <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-mono font-bold mb-1">
                  <Sparkles className="w-3 h-3 text-[#38BDF8]" />
                  <span>AI ENGINE</span>
                </div>
                <div className="text-xs font-black text-white font-p3r">
                  Gemini 1.5 Flash
                </div>
              </div>

              <div className="p-2.5 bg-[#002D80] border-2 border-white/40 shadow-[2px_2px_0px_#001F5C]">
                <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-mono font-bold mb-1">
                  <Palette className="w-3 h-3 text-[#38BDF8]" />
                  <span>STYLING</span>
                </div>
                <div className="text-xs font-black text-white font-p3r">
                  P3 Reload HUD
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Creator Top Deck */}
          <div className="p-4 bg-[#001F5C] border-2 border-white/60 shadow-[3px_3px_0px_#001F5C]">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b-2 border-white/30">
              <span className="text-[#FF0055] font-black text-sm">⚡</span>
              <h3 className="text-xs font-black text-white uppercase tracking-widest font-p3r">
                // CREATOR TOP DECK (CANON FAVORITES)
              </h3>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-3 py-1.5 bg-[#002D80] text-white border-2 border-white/60 font-p3r font-black text-xs shadow-[2px_2px_0px_#001F5C] flex items-center gap-1.5">
                🎮 Persona 3 Reload
              </span>
              <span className="px-3 py-1.5 bg-[#002D80] text-white border-2 border-white/60 font-p3r font-black text-xs shadow-[2px_2px_0px_#001F5C] flex items-center gap-1.5">
                📺 Steins;Gate
              </span>
              <span className="px-3 py-1.5 bg-[#002D80] text-white border-2 border-white/60 font-p3r font-black text-xs shadow-[2px_2px_0px_#001F5C] flex items-center gap-1.5">
                🎵 Cowboy Bebop OST
              </span>
              <span className="px-3 py-1.5 bg-[#002D80] text-white border-2 border-white/60 font-p3r font-black text-xs shadow-[2px_2px_0px_#001F5C] flex items-center gap-1.5">
                📖 JoJo: Steel Ball Run
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
