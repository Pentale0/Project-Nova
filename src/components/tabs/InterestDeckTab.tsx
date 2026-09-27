import React, { useState } from 'react';
import { InterestUser, MatchConnection } from '../../types';
import { Users, X, Link2, Sparkles, MessageSquare, Zap, Flame, Shield } from 'lucide-react';
import { playHoverSound, playSelectSound } from '../../utils/audio';

interface InterestDeckTabProps {
  candidates: InterestUser[];
  matches: MatchConnection[];
  onConnect: (user: InterestUser) => void;
  onPass: (user: InterestUser) => void;
  onOpenChat: (match: MatchConnection) => void;
}

export const InterestDeckTab: React.FC<InterestDeckTabProps> = ({
  candidates,
  matches,
  onConnect,
  onPass,
  onOpenChat,
}) => {
  const [activeDeckIndex, setActiveDeckIndex] = useState(0);

  const currentCandidate = candidates[activeDeckIndex];

  const handleConnect = () => {
    if (!currentCandidate) return;
    onConnect(currentCandidate);
    if (activeDeckIndex < candidates.length - 1) {
      setActiveDeckIndex((prev) => prev + 1);
    }
  };

  const handlePass = () => {
    if (!currentCandidate) return;
    playSelectSound();
    onPass(currentCandidate);
    if (activeDeckIndex < candidates.length - 1) {
      setActiveDeckIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Geometric Chamfered Wedge with Lightning Accent */}
      <div className="relative p-5 bg-[#002D80] border-3 border-white shadow-[6px_6px_0px_#001F5C] clip-p3r-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Left: Decorative Lightning Flash */}
        <div className="flex items-center gap-3">
          {/* Triangular Badge */}
          <div className="w-12 h-12 bg-white text-[#002D80] border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C] flex items-center justify-center font-p3r text-xl font-black shrink-0 relative overflow-hidden">
            <Zap className="w-6 h-6 text-[#FF0055] fill-[#FF0055]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#FF0055] text-white px-2 py-0.5 font-p3r text-[10px] tracking-wider">
                AFFINITY ENGINE
              </span>
              <span className="font-mono text-xs text-white/80">
                MUTUAL TASTE DISCOVERY
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase font-p3r mt-0.5">
              INTEREST DECK & SHARED CANON
            </h2>
            <p className="text-xs text-white/80">
              Discover operatives with identical Top-10 works in anime, literature, games, and film.
            </p>
          </div>
        </div>

        {/* Right: Skewed Parallelogram Badge */}
        <div className="p3r-parallelogram bg-white px-4 py-1.5 text-xs font-p3r text-[#002D80] font-black border-2 border-[#001F5C]">
          <span className="transform skew-x-14 inline-block">
            {matches.length} CONNECTIONS LINKED
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Asymmetrical Playing Card Deck */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {currentCandidate ? (
            <div className="relative w-full max-w-lg">
              {/* Triangular Decorative Shard Behind Card */}
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-[#FF0055] clip-p3r-triangle pointer-events-none transform rotate-12"></div>
              
              {/* Lightning Accent Shard on Left Edge */}
              <div className="absolute -left-2 top-12 w-6 h-20 bg-white clip-p3r-lightning pointer-events-none z-10"></div>

              {/* Main Card: Chamfered Angular Cut */}
              <div className="relative p-6 bg-[#002D80] border-3 border-white shadow-[8px_8px_0px_#001F5C] clip-p3r-card">
                
                {/* Top Info Bar */}
                <div className="flex justify-between items-start mb-4 border-b-2 border-white/20 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-p3r text-2xl text-white tracking-tight">
                        {currentCandidate.displayName}
                      </h3>
                      <span className="font-mono text-xs text-white/80 bg-[#001F5C] px-2 py-0.5 border border-white/30">
                        @{currentCandidate.handle}
                      </span>
                    </div>
                    <div className="text-xs text-white/80 mt-1 font-mono">
                      Culture Rank: <strong className="text-white">{currentCandidate.cultureRank}</strong> ({currentCandidate.cultureTitle})
                    </div>
                  </div>

                  {currentCandidate.hasLikedMe && (
                    <div className="bg-[#FF0055] text-white px-2.5 py-1 text-[10px] font-p3r tracking-wider border border-white shadow-[2px_2px_0px_#001F5C] flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current" />
                      <span>CANON OVERLAP</span>
                    </div>
                  )}
                </div>

                {/* Profile Body with Chamfered Avatar */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-20 h-20 bg-white p-1 shadow-[3px_3px_0px_#001F5C] shrink-0 border-2 border-[#001F5C] clip-p3r-wedge">
                    <img
                      src={currentCandidate.avatar}
                      alt={currentCandidate.displayName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-3 bg-[#001F5C] border-2 border-white/40 shadow-[3px_3px_0px_#001F5C] flex-1">
                    <p className="text-xs text-white italic leading-relaxed">
                      "{currentCandidate.bio}"
                    </p>
                  </div>
                </div>

                {/* Shared Canon Section with Arrow Badges */}
                <div className="mb-6 space-y-2">
                  <div className="text-xs font-p3r text-white flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-[#FF0055]" />
                    <span>SHARED TOP-10 CANON ({currentCandidate.sharedTitles.length} MATCHES):</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {currentCandidate.sharedTitles.map((title, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-white text-[#002D80] border-2 border-[#001F5C] font-p3r text-xs tracking-normal shadow-[2px_2px_0px_#001F5C] font-black"
                      >
                        ★ {title}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons: Parallelograms & Triangular Cuts */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t-2 border-white/20">
                  <button
                    onClick={handlePass}
                    onMouseEnter={playHoverSound}
                    className="p3r-parallelogram bg-[#001F5C] hover:bg-[#FF0055] text-white py-3 px-4 font-p3r text-sm font-black tracking-normal transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <div className="transform skew-x-14 flex items-center gap-1.5">
                      <X className="w-4 h-4 stroke-[3]" />
                      <span>PASS</span>
                    </div>
                  </button>

                  <button
                    onClick={handleConnect}
                    onMouseEnter={playHoverSound}
                    className="p3r-parallelogram bg-white hover:bg-[#FF0055] text-[#002D80] hover:text-white py-3 px-4 font-p3r text-sm font-black tracking-normal transition-all duration-150 cursor-pointer shadow-[4px_4px_0px_#001F5C] flex items-center justify-center gap-2"
                  >
                    <div className="transform skew-x-14 flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 stroke-[3]" />
                      <span>CONNECT // LINK</span>
                    </div>
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="w-full p-10 bg-[#002D80] border-3 border-white shadow-[6px_6px_0px_#001F5C] text-center space-y-4 clip-p3r-card">
              <Sparkles className="w-10 h-10 text-white mx-auto animate-bounce" />
              <h3 className="font-p3r text-2xl text-white tracking-tight">
                ALL DECK PROFILES REVIEWED
              </h3>
              <p className="text-xs text-white/80 max-w-sm mx-auto leading-relaxed font-mono">
                You've browsed through all active interest cards. Check mutual links on the right to start messaging!
              </p>
              <button
                onClick={() => setActiveDeckIndex(0)}
                className="px-6 py-2.5 bg-white text-[#002D80] hover:bg-[#FF0055] hover:text-white font-p3r text-xs font-black tracking-normal cursor-pointer border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C]"
              >
                RESET CARD DECK
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Mutual Connections */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-[#002D80] border-3 border-white shadow-[5px_5px_0px_#001F5C] clip-p3r-card">
            <div className="flex items-center justify-between mb-4 border-b-2 border-white/20 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white" />
                <h3 className="font-p3r text-base tracking-tight text-white">
                  MUTUAL CONNECTIONS ({matches.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-white font-bold px-2 py-0.5 bg-[#001F5C] border border-white/30">
                ACTIVE
              </span>
            </div>

            <div className="space-y-3">
              {matches.length === 0 ? (
                <div className="text-center py-8 text-xs text-white/70 font-mono">
                  No mutual connections yet. Click CONNECT on the card deck to immediately form a link!
                </div>
              ) : (
                matches.map((m) => (
                  <div
                    key={m.matchId}
                    className="p-3 bg-[#001F5C] border-2 border-white/40 hover:border-white transition-all flex items-center justify-between gap-3 shadow-[2px_2px_0px_#001F5C]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={m.avatar}
                          alt={m.displayName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 object-cover border-2 border-white"
                        />
                        {/* Triangle online indicator */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF0055] clip-p3r-triangle"></div>
                      </div>
                      <div>
                        <h4 className="font-p3r text-sm text-white tracking-normal">
                          {m.displayName}
                        </h4>
                        <div className="text-[10px] font-mono text-white/70">
                          @{m.handle}
                        </div>
                        <div className="text-[10px] text-white/80 truncate max-w-[170px]">
                          Shared: {m.sharedTitles.join(', ')}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        playSelectSound();
                        onOpenChat(m);
                      }}
                      onMouseEnter={playHoverSound}
                      className="px-3 py-1.5 bg-white hover:bg-[#FF0055] text-[#002D80] hover:text-white font-p3r font-black text-xs tracking-normal transition-all duration-150 cursor-pointer border-2 border-[#001F5C] shadow-[2px_2px_0px_#001F5C] flex items-center gap-1 shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>CHAT</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
