import React from 'react';
import { StatInfo, StatKey } from '../../types';
import { StatsRadar } from '../StatsRadar';
import {
  BookOpen,
  Dumbbell,
  Compass,
  Camera,
  TrendingUp,
  Plus,
  Zap,
} from 'lucide-react';
import { playHoverSound, playSelectSound } from '../../utils/audio';

interface OverviewTabProps {
  stats: Record<StatKey, StatInfo>;
  onNavigateTab: (tab: any) => void;
  onQuickLog: (statKey: StatKey, units: number) => void;
  onOpenProfile: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  onNavigateTab,
  onQuickLog,
}) => {
  const statList: {
    key: StatKey;
    stat: StatInfo;
    icon: typeof BookOpen;
    actionLabel: string;
    xpBonus: string;
    units: number;
    badgeColor: string;
  }[] = [
    {
      key: 'academics',
      stat: stats.academics,
      icon: BookOpen,
      actionLabel: '+1H STUDY',
      xpBonus: '+4 XP',
      units: 1,
      badgeColor: 'bg-white text-[#002D80]',
    },
    {
      key: 'vitality',
      stat: stats.vitality,
      icon: Dumbbell,
      actionLabel: '+WORKOUT',
      xpBonus: '+6 XP',
      units: 1,
      badgeColor: 'bg-[#FF0055] text-white',
    },
    {
      key: 'culture',
      stat: stats.culture,
      icon: Compass,
      actionLabel: '+LOG CANON',
      xpBonus: '+4 XP',
      units: 1,
      badgeColor: 'bg-white text-[#002D80]',
    },
    {
      key: 'memories',
      stat: stats.memories,
      icon: Camera,
      actionLabel: '+ADD PHOTO',
      xpBonus: '+3 XP',
      units: 1,
      badgeColor: 'bg-[#FF0055] text-white',
    },
  ];

  return (
    <div className="w-full">
      {/* Main Grid: Graph on the LEFT, Stats on the RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: INTERACTIVE MULTI-SHAPE PARAMETER GRAPH      */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative bg-[#002673] border-3 border-white shadow-[6px_6px_0px_#001F5C] p-4 lg:p-5 overflow-hidden">
            {/* Persona Geometric Accents: Corner Triangles & Lightning */}
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-white rotate-45 pointer-events-none"></div>
            <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#FF0055] rotate-45 pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-3 border-b-2 border-white/40 pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#FF0055] text-white flex items-center justify-center border border-white">
                  <Zap className="w-3.5 h-3.5 fill-white stroke-[2.5]" />
                </div>
                <h3 className="font-p3r text-xl tracking-wide text-white font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  ATTRIBUTE RADAR
                </h3>
              </div>
              <span className="text-[11px] font-mono bg-white text-[#002673] px-2 py-0.5 font-black uppercase flex items-center gap-1">
                <span>INTERACTIVE</span>
              </span>
            </div>

            {/* Interactive Graph with 5 Geometric Shapes */}
            <StatsRadar
              stats={stats}
              size={270}
              onQuickLog={onQuickLog}
              onSelectStat={(k) => onNavigateTab(k)}
            />

            <div className="text-xs text-sky-100 font-mono font-bold mt-3 text-center bg-[#001B4E] p-2 border border-white/30 flex items-center justify-center gap-2">
              <span className="text-[#FF0055]">▲</span>
              <span>Tap shapes above to morph • Click nodes to view & boost XP</span>
              <span className="text-[#FF0055]">▲</span>
            </div>
          </div>

          {/* Quick Rank Progression Card with Triangle Accents */}
          <div className="relative bg-white text-[#002673] border-3 border-[#001F5C] shadow-[5px_5px_0px_#001F5C] p-4 flex items-center justify-between overflow-hidden">
            <div className="absolute -top-3 -left-3 w-7 h-7 bg-[#FF0055] rotate-45 pointer-events-none"></div>
            <div className="absolute -bottom-3 -right-3 w-7 h-7 bg-[#002673] rotate-45 pointer-events-none"></div>

            <div className="relative z-10 pl-2">
              <div className="text-xs font-mono tracking-wider text-[#002673] uppercase font-black flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-[#FF0055] text-[#FF0055]" />
                <span>OPERATIVE PROGRESSION</span>
              </div>
              <div className="font-p3r text-2xl font-black text-[#002673] tracking-tight">
                RANK II // WELL-READ
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('academics')}
              className="relative z-10 px-3.5 py-2 bg-[#002673] hover:bg-[#FF0055] text-white font-p3r text-xs font-black transition-colors cursor-pointer border-2 border-[#001F5C] shadow-[2px_2px_0px_#001F5C] flex items-center gap-1"
            >
              <span>DETAILS</span>
              <span className="text-xs">▶</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: 4 CORE STATS WITH ONE-TAP LOGGING BUTTONS   */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-3.5">
          {statList.map(({ key, stat, icon: Icon, actionLabel, xpBonus, units, badgeColor }) => (
            <div
              key={key}
              className="relative bg-[#002673] hover:bg-[#00318F] border-3 border-white shadow-[5px_5px_0px_#001F5C] p-4 transition-all duration-150 overflow-hidden"
            >
              {/* Corner decorative triangle shard */}
              <div className="absolute -top-3 -right-3 w-7 h-7 bg-white rotate-45 pointer-events-none opacity-80"></div>

              {/* Header Row */}
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div
                  onClick={() => onNavigateTab(key)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  {/* Roman Rank Badge with sharp lightning border */}
                  <div className={`w-10 h-10 ${badgeColor} border-2 border-[#001F5C] shadow-[2px_2px_0px_#001F5C] flex items-center justify-center font-p3r text-lg font-black shrink-0 relative`}>
                    {stat.rankName}
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#FF0055] rotate-45"></div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-p3r text-2xl text-white group-hover:text-sky-200 tracking-tight font-black">
                        {stat.name}
                      </span>
                      <span className="text-xs font-bold text-sky-200 tracking-wide uppercase bg-[#001B4E] px-2 py-0.5 border border-white/30">
                        {stat.title}
                      </span>
                    </div>
                    {/* High-Contrast Bold Counter Label */}
                    <div className="text-xs font-mono font-bold text-white mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#FF0055] rotate-45 inline-block"></span>
                      <span>{stat.counterLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Right: One-Tap Quick Log Button with Lightning */}
                <button
                  onClick={() => {
                    playSelectSound();
                    if (key === 'culture' || key === 'memories') {
                      onNavigateTab(key);
                    } else {
                      onQuickLog(key, units);
                    }
                  }}
                  onMouseEnter={playHoverSound}
                  className="px-3.5 py-2 bg-white hover:bg-[#FF0055] text-[#002673] hover:text-white border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C] font-p3r text-xs font-black tracking-normal transition-all duration-150 cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Zap className="w-3.5 h-3.5 fill-current stroke-[2.5]" />
                  <span>{actionLabel}</span>
                  <span className="bg-[#002673] text-white px-1.5 py-0.2 text-[10px] font-mono font-bold">
                    {xpBonus}
                  </span>
                </button>
              </div>

              {/* Solid Progress Bar (High-Contrast White on Deep Navy) */}
              <div className="w-full h-3.5 bg-[#001740] border-2 border-white/70 overflow-hidden relative shadow-inner">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${Math.max(5, stat.percent)}%` }}
                ></div>
              </div>

              {/* Progress Text - High-Contrast Readable */}
              <div className="flex justify-between items-center mt-1.5 text-xs font-mono font-bold text-white">
                <span className="bg-[#001B4E] px-2 py-0.5 border border-white/20">
                  XP: <strong className="text-sky-200">{stat.xp}</strong> / {stat.nextThreshold}
                </span>
                <span className="font-extrabold text-white bg-[#FF0055] px-2 py-0.5">
                  {stat.percent}% COMPLETE
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
