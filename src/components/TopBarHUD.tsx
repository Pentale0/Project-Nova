import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Copy, Check, Calendar, User, Zap } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playSelectSound, playHoverSound } from '../utils/audio';

interface TopBarHUDProps {
  totalXp: number;
  handle: string;
  displayName: string;
  onOpenProfile: () => void;
  onCopyLink: () => void;
  copied: boolean;
}

export const TopBarHUD: React.FC<TopBarHUDProps> = ({
  totalXp,
  handle,
  onOpenProfile,
  onCopyLink,
  copied,
}) => {
  const [soundOn, setSoundOn] = useState(true);
  const [period, setPeriod] = useState<'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'>('AFTERNOON');

  useEffect(() => {
    setSoundOn(isSoundEnabled());
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) setPeriod('MORNING');
    else if (hours >= 12 && hours < 17) setPeriod('AFTERNOON');
    else if (hours >= 17 && hours < 21) setPeriod('EVENING');
    else setPeriod('NIGHT');
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playSelectSound();
  };

  const today = new Date();
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthName = months[today.getMonth()];
  const day = today.getDate();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dayOfWeek = dayNames[today.getDay()];

  return (
    <header className="relative z-30 w-full mb-4 select-none">
      <div className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#002673] border-b-3 border-white shadow-[0_4px_0px_#001F5C] overflow-hidden">
        
        {/* Decorative corner triangles */}
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-white rotate-45 pointer-events-none opacity-40"></div>
        <div className="absolute -bottom-3 -left-3 w-7 h-7 bg-[#FF0055] rotate-45 pointer-events-none"></div>

        {/* Left: Project title & total XP */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-2">
            {/* Persona Lightning Icon Badge */}
            <div className="w-8 h-8 bg-[#FF0055] text-white flex items-center justify-center border-2 border-white shadow-[2px_2px_0px_#001F5C] transform -skew-x-12">
              <Zap className="w-5 h-5 fill-white transform skew-x-12 stroke-[2.5]" />
            </div>

            <div className="flex flex-col">
              <span className="font-p3r text-2xl font-black tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                PROJECT <span className="text-[#38BDF8]">NOVA</span>
              </span>
              <span className="text-[11px] font-mono font-bold tracking-widest text-sky-200 uppercase">
                DISCIPLINE HUD
              </span>
            </div>
          </div>

          <div className="h-6 w-[2px] bg-white/40 hidden sm:block"></div>

          {/* Clean Total XP Counter */}
          <div className="bg-white text-[#002673] px-3.5 py-1 border-2 border-[#001F5C] shadow-[2px_2px_0px_#001F5C] font-p3r text-sm font-black flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#FF0055] inline-block transform rotate-45"></span>
            <span>TOTAL XP: {totalXp.toLocaleString()}</span>
          </div>
        </div>

        {/* Center/Date: Compact date with high-contrast text */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-[#0038A8] text-xs font-mono font-bold text-white border-2 border-white/80 shadow-[2px_2px_0px_#001F5C]">
          <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="tracking-wide">{monthName} {day < 10 ? `0${day}` : day} {dayOfWeek}</span>
          <span className="text-white/50">/</span>
          <span className="text-[11px] font-black text-white uppercase bg-[#FF0055] px-1.5 py-0.5">
            {period}
          </span>
        </div>

        {/* Right: User handle, Share, Sound */}
        <div className="flex items-center gap-2 relative z-10">
          {/* User Button */}
          <button
            onClick={onOpenProfile}
            onMouseEnter={playHoverSound}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0038A8] hover:bg-white text-white hover:text-[#002673] text-xs font-mono font-bold transition-all cursor-pointer border-2 border-white/80 shadow-[2px_2px_0px_#001F5C]"
          >
            <User className="w-3.5 h-3.5 text-sky-300" />
            <span>@{handle}</span>
          </button>

          {/* Share Profile */}
          <button
            onClick={onCopyLink}
            onMouseEnter={playHoverSound}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#FF0055] text-[#002673] hover:text-white border-2 border-[#001F5C] shadow-[2px_2px_0px_#001F5C] text-xs font-p3r font-black transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 stroke-[3]" />}
            <span>{copied ? 'COPIED' : 'SHARE'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            onMouseEnter={playHoverSound}
            title={soundOn ? 'Mute SFX' : 'Enable SFX'}
            className="p-1.5 bg-[#0038A8] hover:bg-white text-white hover:text-[#002673] border-2 border-white/80 shadow-[2px_2px_0px_#001F5C] transition-all cursor-pointer"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </header>
  );
};
