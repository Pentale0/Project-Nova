import React, { useState } from 'react';
import { UserAccount, StatInfo } from '../../types';
import {
  Share2,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { playHoverSound, playSelectSound } from '../../utils/audio';

interface ProfileTabProps {
  currentUser: UserAccount;
  stats: Record<string, StatInfo>;
  totalXp: number;
  /**
   * Overall rank and designation are computed in App.tsx from the same
   * statsInfo the rest of the HUD uses. They were previously recomputed here
   * from `totalXp`, which used a different threshold and different title
   * names, so the profile could disagree with the dashboard above it.
   */
  overallRank: number;
  overallTitle: string;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  currentUser,
  stats,
  totalXp,
  overallRank,
  overallTitle,
}) => {
  const [copied, setCopied] = useState(false);

  const rankNames = ['I', 'II', 'III', 'IV', 'V'];
  const overallRankName = rankNames[overallRank - 1] || 'V';

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?u=${currentUser.handle}`
    : `https://discipline.app/?u=${currentUser.handle}`;

  const copyLink = () => {
    playSelectSound();
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Operative ID Dossier Card - Asymmetric Chamfered Shape */}
      <div className="relative p-6 sm:p-8 bg-[#002673] border-3 border-white shadow-[8px_8px_0px_#001F5C] clip-p3r-card overflow-hidden">
        {/* Decorative corner triangles */}
        <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rotate-45 pointer-events-none"></div>
        <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-[#FF0055] rotate-45 pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar with Chamfered Shape */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white p-1 border-3 border-[#001F5C] shadow-[4px_4px_0px_#001F5C] clip-p3r-wedge flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#001740] flex items-center justify-center text-4xl font-black text-white font-p3r">
              {currentUser.displayName.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Details - High Contrast */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-black px-3 py-1 bg-[#FF0055] text-white tracking-widest uppercase font-p3r shadow-[2px_2px_0px_#001F5C] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>PROJECT NOVA OPERATIVE</span>
              </span>
              <span className="text-xs font-mono font-bold text-white bg-[#001740] px-2.5 py-0.5 border border-white">
                JOINED {currentUser.createdAt}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase font-p3r drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {currentUser.displayName}
            </h1>

            <div className="text-xs text-white flex flex-wrap justify-center sm:justify-start gap-2.5 font-mono font-bold">
              <span className="bg-[#001740] px-2.5 py-1 border border-white shadow-[2px_2px_0px_#001F5C]">
                Handle: <strong className="text-sky-200">@{currentUser.handle}</strong>
              </span>
              <span className="bg-[#001740] px-2.5 py-1 border border-white shadow-[2px_2px_0px_#001F5C]">
                Overall: <strong className="text-white bg-[#FF0055] px-1.5 py-0.2">RANK {overallRankName}</strong>
              </span>
              <span className="bg-[#001740] px-2.5 py-1 border border-white shadow-[2px_2px_0px_#001F5C]">
                Discipline: <strong className="text-sky-200">{totalXp.toLocaleString()} XP</strong>
              </span>
            </div>

            <div className="inline-block mt-2 px-4 py-1.5 bg-white text-[#002673] border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C] font-p3r font-black text-sm tracking-wider">
              ACTIVE DESIGNATION: {overallTitle}
            </div>
          </div>
        </div>

        {/* Shareable Link Bar with Parallelogram Button */}
        <div className="mt-6 pt-4 border-t-2 border-white/40 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <div className="text-xs text-white font-extrabold flex items-center gap-1.5 font-mono">
            <Share2 className="w-4 h-4 text-sky-200" />
            <span>Public Shareable URL:</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              readOnly
              value={profileUrl}
              className="px-3.5 py-2 bg-[#001740] border-2 border-white text-xs text-white font-mono font-bold w-full sm:w-80 select-all outline-none"
            />
            <button
              onClick={copyLink}
              onMouseEnter={playHoverSound}
              className="p3r-parallelogram bg-white hover:bg-[#FF0055] text-[#002673] hover:text-white px-5 py-2 font-p3r font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0 border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C]"
            >
              <div className="transform skew-x-14 flex items-center gap-1.5">
                {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
                <span>{copied ? 'COPIED!' : 'COPY LINK'}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Four Pillars of Discipline */}
      <div className="relative p-5 bg-[#002673] border-3 border-white shadow-[5px_5px_0px_#001F5C] clip-p3r-card space-y-4 overflow-hidden">
        <div className="flex items-center justify-between border-b-2 border-white/40 pb-2 relative z-10">
          <h3 className="text-sm font-black tracking-widest text-white uppercase font-p3r">
            FOUR PILLARS OF DISCIPLINE // PUBLIC DOSSIER
          </h3>
          <span className="text-xs font-mono font-extrabold text-white bg-[#001740] px-2.5 py-0.5 border border-white/40">
            VERIFIED METRICS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {Object.values(stats).map((s) => (
            <div
              key={s.key}
              className="p-4 bg-[#001740] border-2 border-white shadow-[3px_3px_0px_#001F5C] space-y-2.5 relative overflow-hidden"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
              }}
            >
              {/* Acute Triangle Corner Shard */}
              <div className="absolute top-0 right-0 w-4 h-4 bg-[#FF0055] clip-p3r-triangle rotate-90"></div>

              <div className="flex justify-between items-start">
                <span className="text-xs font-black font-p3r uppercase tracking-wider text-sky-200">
                  {s.name}
                </span>
                <span className="w-7 h-7 bg-white text-[#002673] flex items-center justify-center font-p3r text-sm font-black border border-[#001F5C]">
                  {s.rankName}
                </span>
              </div>

              <div className="text-base font-extrabold text-white uppercase font-p3r">
                {s.title}
              </div>

              <div className="w-full h-2.5 bg-[#002673] border border-white/70 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${Math.max(8, s.percent)}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-xs font-mono font-bold text-white">
                <span>{s.xp} XP</span>
                <span className="text-sky-200">{s.counterLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
