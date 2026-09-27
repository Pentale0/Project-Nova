import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playRankUpFanfare, playSelectSound } from '../utils/audio';
import { StatKey } from '../types';
import { STAT_RULES } from '../utils/xp';

interface RankUpModalProps {
  isOpen: boolean;
  statKey: StatKey;
  newRank: number;
  newRankName: string;
  newTitle: string;
  isLinked?: boolean;
  linkedName?: string;
  onClose: () => void;
}

export const RankUpModal: React.FC<RankUpModalProps> = ({
  isOpen,
  statKey,
  newRank,
  newRankName,
  newTitle,
  isLinked = false,
  linkedName = '',
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      playRankUpFanfare();
      try {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#51EEFC', '#00D2FF', '#FFFFFF', '#1269CC', '#E23B3B'],
          shapes: ['square'],
          scalar: 1.2,
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#51EEFC', '#FFFFFF', '#E23B3B'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#51EEFC', '#FFFFFF', '#E23B3B'],
          });
        }, 180);
      } catch (e) {
        // Safe fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const statCfg = STAT_RULES[statKey] || {
    name: 'Stat',
    color: '#51EEFC',
  };

  const handleClose = () => {
    playSelectSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010915]/85 backdrop-blur-md animate-fadeIn">
      {/* Dynamic Background Slashes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-20 -left-20 w-[140%] h-40 bg-gradient-to-r from-transparent via-[#51eefc] to-transparent transform -rotate-12 blur-sm"></div>
        <div className="absolute top-1/2 -left-20 w-[140%] h-24 bg-gradient-to-r from-transparent via-[#e23b3b] to-transparent transform -rotate-12 blur-md"></div>
      </div>

      <div
        className="relative z-10 w-full max-w-lg mx-4 p-8 bg-gradient-to-b from-[#031d3d] via-[#05264c] to-[#02132b] border-2 border-[#51eefc] shadow-[0_0_50px_rgba(81,238,252,0.7)] text-center text-[#eaf6ff] animate-scaleUp transform -skew-x-3"
      >
        {isLinked ? (
          <>
            <div className="text-xs font-black tracking-[0.4em] text-[#51eefc] uppercase mb-1">
              MUTUAL CONNECTION ESTABLISHED
            </div>
            <div className="text-6xl font-black italic tracking-tighter text-[#e23b3b] drop-shadow-[0_0_25px_rgba(226,59,59,0.9)] transform -skew-x-6 font-['Rajdhani']">
              LINKED!
            </div>
            <div className="h-1 w-32 mx-auto my-4 bg-gradient-to-r from-transparent via-[#ffffff] to-transparent"></div>
            <p className="text-sm text-[#eaf6ff] max-w-sm mx-auto mb-6 leading-relaxed">
              You and <strong className="text-[#51eefc]">{linkedName}</strong> share cultural taste! A direct messaging channel has been unlocked.
            </p>
          </>
        ) : (
          <>
            <div className="text-xs font-black tracking-[0.4em] text-[#51eefc] uppercase mb-1">
              DISCIPLINE LEVEL ELEVATION
            </div>
            <div className="text-6xl font-black italic tracking-tighter text-[#51eefc] drop-shadow-[0_0_25px_rgba(81,238,252,0.9)] transform -skew-x-6 font-['Rajdhani']">
              RANK UP!
            </div>
            <div className="h-1 w-32 mx-auto my-4 bg-gradient-to-r from-transparent via-[#ffffff] to-transparent"></div>

            {/* Stat Name & Badge */}
            <div className="flex items-center justify-center gap-3 my-4">
              <div className="flex items-center justify-center w-12 h-12 bg-[#51eefc] text-[#020b18] text-2xl font-black shadow-[0_0_20px_#51eefc]">
                {newRankName}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#8fa6bf] tracking-widest uppercase">
                  {statCfg.name}
                </div>
                <div className="text-xl font-black text-[#eaf6ff] tracking-wider font-['Rajdhani']">
                  RANK {newRank} — {newTitle}
                </div>
              </div>
            </div>

            <p className="text-xs text-[#8fa6bf] max-w-sm mx-auto mb-6 leading-relaxed">
              Your real-life momentum deepens. Your capacity to execute with discipline has reached Rank {newRank}.
            </p>
          </>
        )}

        <button
          onClick={handleClose}
          className="px-8 py-3 bg-[#51eefc] hover:bg-[#ffffff] text-[#020b18] font-black tracking-widest text-xs uppercase transition-all duration-150 transform hover:scale-105 shadow-[0_0_25px_rgba(81,238,252,0.8)] cursor-pointer"
        >
          CONFIRM & CONTINUE
        </button>
      </div>
    </div>
  );
};
