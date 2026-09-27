import React, { useState } from 'react';
import { SocialLinkAlly } from '../../types';
import { Users, Link2, Sparkles, Check, MessageSquare, Heart } from 'lucide-react';
import { playHoverSound, playSelectSound, playRankUpFanfare } from '../../utils/audio';

interface SocialLinksTabProps {
  allies: SocialLinkAlly[];
  onConnectAlly: (id: string) => void;
  onOpenChatWith: (ally: SocialLinkAlly) => void;
}

export const SocialLinksTab: React.FC<SocialLinksTabProps> = ({
  allies,
  onConnectAlly,
  onOpenChatWith,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'connected' | 'deck'>('all');

  const filteredAllies = allies.filter((ally) => {
    if (filterMode === 'connected') return ally.isMatched;
    if (filterMode === 'deck') return !ally.isMatched;
    return true;
  });

  const handleConnect = (id: string) => {
    playRankUpFanfare();
    onConnectAlly(id);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className="p-5 bg-gradient-to-r from-[#031d3d] via-[#052b54] to-[#02132b] border border-[#00d2ff]/40 shadow-[0_4px_25px_rgba(0,210,255,0.15)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style={{
          clipPath:
            'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#51eefc] tracking-widest uppercase">
              SEES ALLY NETWORK // コミュニティ
            </span>
          </div>
          <h2 className="text-xl font-black text-[#eaf6ff] tracking-wide uppercase">
            SOCIAL LINKS & INTEREST DECK
          </h2>
          <p className="text-xs text-[#8fa6bf] mt-1">
            Forge unbreakable bonds with allies sharing your literary, cinematic, and philosophical tastes.
          </p>
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex items-center gap-1 bg-[#020b18]/80 p-1 border border-[#00d2ff]/30">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-[#00d2ff] text-[#020b18]'
                : 'text-[#8fa6bf] hover:text-[#51eefc]'
            }`}
          >
            All ({allies.length})
          </button>
          <button
            onClick={() => setFilterMode('connected')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              filterMode === 'connected'
                ? 'bg-[#00d2ff] text-[#020b18]'
                : 'text-[#8fa6bf] hover:text-[#51eefc]'
            }`}
          >
            Bonded ({allies.filter((a) => a.isMatched).length})
          </button>
          <button
            onClick={() => setFilterMode('deck')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              filterMode === 'deck'
                ? 'bg-[#00d2ff] text-[#020b18]'
                : 'text-[#8fa6bf] hover:text-[#51eefc]'
            }`}
          >
            Deck ({allies.filter((a) => !a.isMatched).length})
          </button>
        </div>
      </div>

      {/* Allies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAllies.map((ally) => (
          <div
            key={ally.id}
            className={`p-5 relative bg-gradient-to-b from-[#051e3d] via-[#03152c] to-[#020d1c] border transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)] ${
              ally.isMatched
                ? 'border-[#00d2ff] shadow-[0_0_20px_rgba(0,210,255,0.25)]'
                : 'border-[#00d2ff]/25 hover:border-[#00d2ff]/70'
            }`}
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
            }}
          >
            {/* Top row: Arcana & Rank */}
            <div className="flex justify-between items-start mb-3 border-b border-[#00d2ff]/20 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-[#00d2ff] bg-[#00d2ff]/10 px-1.5 py-0.5 border border-[#00d2ff]/30">
                  {ally.arcanaNum}
                </span>
                <span className="text-xs font-black text-[#51eefc] uppercase tracking-wider">
                  {ally.arcana} ARCANA
                </span>
              </div>

              {ally.isMatched ? (
                <div className="flex items-center gap-1 text-[11px] font-black text-[#00d2ff]">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>RANK {ally.rank}</span>
                </div>
              ) : (
                <span className="text-[10px] font-mono text-[#8fa6bf]">UNBOUND</span>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-3.5 mb-3">
              <div
                className="w-13 h-13 flex-shrink-0 bg-gradient-to-tr from-[#00d2ff] to-[#0044aa] p-0.5"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                }}
              >
                <img
                  src={ally.avatar}
                  alt={ally.displayName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-0.5">
                <h3 className="font-black text-sm text-[#eaf6ff] uppercase tracking-wide">
                  {ally.displayName}
                </h3>
                <div className="text-[11px] font-mono text-[#51eefc]">
                  @{ally.handle}
                </div>
                <div className="text-[10px] text-[#8fa6bf] uppercase">
                  {ally.role}
                </div>
              </div>
            </div>

            {/* Status Quote */}
            <p className="text-xs text-[#8fa6bf] italic bg-[#020e20]/80 p-2 border-l-2 border-[#00d2ff] mb-3 leading-relaxed">
              "{ally.statusMessage}"
            </p>

            {/* Shared Interests */}
            <div className="mb-4">
              <span className="block text-[9px] uppercase font-bold text-[#8fa6bf] tracking-widest mb-1">
                SHARED MEDIA TASTE:
              </span>
              <div className="flex flex-wrap gap-1">
                {ally.sharedInterests.map((interest, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium px-2 py-0.5 bg-[#00d2ff]/10 text-[#51eefc] border border-[#00d2ff]/20"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Action */}
            {ally.isMatched ? (
              <button
                onClick={() => {
                  playSelectSound();
                  onOpenChatWith(ally);
                }}
                onMouseEnter={playHoverSound}
                className="w-full py-2 bg-[#00d2ff] hover:bg-[#51eefc] text-[#020b18] font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-[0_0_15px_rgba(0,210,255,0.7)] flex items-center justify-center gap-1.5"
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                INITIATE VELVET COMM // 通信
              </button>
            ) : (
              <button
                onClick={() => handleConnect(ally.id)}
                onMouseEnter={playHoverSound}
                className="w-full py-2 bg-[#03254c] hover:bg-[#00d2ff] hover:text-[#020b18] text-[#51eefc] border border-[#00d2ff]/40 font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-[0_0_12px_rgba(0,210,255,0.3)] flex items-center justify-center gap-1.5"
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                }}
              >
                <Link2 className="w-3.5 h-3.5" />
                FORM SOCIAL LINK // 絆を結ぶ
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
