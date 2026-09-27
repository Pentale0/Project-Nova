import React, { useState } from 'react';
import { MatchConnection, ChatMessage } from '../../types';
import { MessageSquare, Send, CheckCircle2, Zap } from 'lucide-react';
import { playHoverSound, playSelectSound } from '../../utils/audio';

interface ChatTabProps {
  matches: MatchConnection[];
  selectedMatch: MatchConnection | null;
  onSelectMatch: (match: MatchConnection) => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  matches,
  selectedMatch,
  onSelectMatch,
}) => {
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    '1': [
      {
        id: 'm1',
        matchId: '1',
        senderId: '2',
        senderName: 'Maya Lin',
        body: 'Saw your top 10 list! Metaphor and Nier are absolute masterclasses. Have you reached the final dungeon yet?',
        createdAt: '10:42 AM',
        isMe: false,
      },
      {
        id: 'm2',
        matchId: '1',
        senderId: 'current',
        senderName: 'You',
        body: 'Just reached the mid-game archetype junction. The stylistic interface and music sync are incredible.',
        createdAt: '10:45 AM',
        isMe: true,
      },
    ],
    '2': [
      {
        id: 'm3',
        matchId: '2',
        senderId: '3',
        senderName: 'Ren Amamiya',
        body: 'Your study consistency in systems architecture is formidable. Do you use the Pomodoro technique or deep 90-min blocks?',
        createdAt: 'Yesterday',
        isMe: false,
      },
    ],
    '3': [
      {
        id: 'm4',
        matchId: '3',
        senderId: '4',
        senderName: 'Yukari T.',
        body: 'Hey! Loved the photo from your morning run. Good to see another operative taking recovery seriously.',
        createdAt: '2 days ago',
        isMe: false,
      },
    ],
  });

  const [inputVal, setInputVal] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || !inputVal.trim()) return;

    playSelectSound();
    const matchId = selectedMatch.matchId;
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      matchId,
      senderId: 'current',
      senderName: 'You',
      body: inputVal.trim(),
      createdAt: timeStr,
      isMe: true,
    };

    setMessages((prev) => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), newMsg],
    }));
    setInputVal('');

    // Auto simulated reply from ally
    setTimeout(() => {
      const replies = [
        "Completely agree! The discipline routine has been paying off huge for my focus as well.",
        "That's a great takeaway. What other titles are you planning to canonize next?",
        "Solid point. Let's keep the streak going this week!",
        "Fascinating perspective. Will definitely add that study resource to my syllabus as well.",
      ];
      const replyBody = replies[Math.floor(Math.random() * replies.length)];
      const allyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        matchId,
        senderId: selectedMatch.userId,
        senderName: selectedMatch.displayName,
        body: replyBody,
        createdAt: timeStr,
        isMe: false,
      };

      setMessages((prev) => ({
        ...prev,
        [matchId]: [...(prev[matchId] || []), allyMsg],
      }));
    }, 700);
  };

  const currentChatMessages = selectedMatch ? messages[selectedMatch.matchId] || [] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[620px]">
      {/* Matches Channel Sidebar - Chamfered Polygon Card */}
      <div className="lg:col-span-4 p-4 bg-[#002673] border-3 border-white shadow-[5px_5px_0px_#001F5C] clip-p3r-card flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-white/40">
          <MessageSquare className="w-4 h-4 text-white" />
          <h3 className="text-xs font-black tracking-widest text-white uppercase font-p3r">
            COMM CHANNELS // ALLIES
          </h3>
        </div>

        <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
          {matches.length === 0 ? (
            <div className="text-center py-8 text-xs text-white font-mono font-bold bg-[#001740] p-4 border border-white/30">
              No linked allies yet. Go to Interest Deck to connect!
            </div>
          ) : (
            matches.map((m) => {
              const isSelected = selectedMatch?.matchId === m.matchId;
              return (
                <div
                  key={m.matchId}
                  onClick={() => {
                    playSelectSound();
                    onSelectMatch(m);
                  }}
                  onMouseEnter={playHoverSound}
                  className={`p-3 transition-all cursor-pointer flex items-center gap-3 border-2 shadow-[3px_3px_0px_#001F5C] relative ${
                    isSelected
                      ? 'bg-white text-[#002673] border-[#001F5C] font-black'
                      : 'bg-[#001740] text-white border-white/60 hover:border-white'
                  }`}
                >
                  {/* Triangular Active Notch */}
                  {isSelected && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-4 bg-[#FF0055] clip-p3r-triangle rotate-90"></div>
                  )}

                  <img
                    src={m.avatar}
                    alt={m.displayName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover border-2 border-current"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="font-extrabold text-sm truncate uppercase font-p3r">
                        {m.displayName}
                      </span>
                      <span className={`text-xs font-mono font-bold ${
                        isSelected ? 'text-[#002673]' : 'text-sky-200'
                      }`}>
                        @{m.handle}
                      </span>
                    </div>
                    <div className={`text-xs truncate font-medium ${
                      isSelected ? 'text-[#001740]' : 'text-white'
                    }`}>
                      {m.sharedTitles.length} Shared Top-10 Titles
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Box - Angled Persona Box */}
      <div className="lg:col-span-8 bg-[#002673] border-3 border-white shadow-[6px_6px_0px_#001F5C] clip-p3r-card flex flex-col overflow-hidden">
        {selectedMatch ? (
          <>
            {/* Header with Lightning Bolt Accent */}
            <div className="p-3.5 bg-[#001740] border-b-2 border-white/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedMatch.avatar}
                    alt={selectedMatch.displayName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover border-2 border-white"
                  />
                  {/* Lightning Shard Online Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#FF0055] clip-p3r-lightning"></div>
                </div>
                <div>
                  <h3 className="font-p3r text-base text-white tracking-normal flex items-center gap-1.5 font-black">
                    {selectedMatch.displayName}
                    <span className="text-xs font-mono text-sky-200">
                      (@{selectedMatch.handle})
                    </span>
                  </h3>
                  <div className="text-xs text-sky-100 font-mono font-bold">
                    Culture Overlap: {selectedMatch.sharedTitles.join(' · ')}
                  </div>
                </div>
              </div>

              {/* Parallelogram Status Pill */}
              <div className="p3r-parallelogram bg-white px-3 py-1 text-xs font-mono text-[#002673] font-black border-2 border-[#001F5C]">
                <span className="transform skew-x-14 inline-block">SECURE LINK</span>
              </div>
            </div>

            {/* Messages Feed - High Contrast Readable Text */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#002673]">
              {currentChatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-baseline gap-2 mb-1 px-1">
                    <span className="text-xs font-black text-white uppercase font-p3r">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-sky-200">
                      {msg.createdAt}
                    </span>
                  </div>

                  {/* Asymmetric Cut Chat Bubble with Crisp Readable Text */}
                  <div
                    className={`max-w-[80%] p-3.5 text-sm leading-relaxed border-2 shadow-[3px_3px_0px_#001F5C] ${
                      msg.isMe
                        ? 'bg-white text-[#001740] border-[#001740] font-bold'
                        : 'bg-[#001740] text-white border-white font-medium'
                    }`}
                    style={{
                      clipPath: msg.isMe
                        ? 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 12px) 100%, 0 100%)'
                        : 'polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px)',
                    }}
                  >
                    {msg.body}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Composer with Lightning Send Button */}
            <form
              onSubmit={handleSend}
              className="p-3 bg-[#001740] border-t-2 border-white/40 flex items-center gap-3"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={`Transmitting encrypted transmission to @${selectedMatch.handle}...`}
                className="flex-1 px-3.5 py-2.5 bg-[#002673] border-2 border-white text-xs text-white font-bold placeholder:text-white/40 focus:border-[#38BDF8] focus:outline-none"
              />

              <button
                type="submit"
                disabled={!inputVal.trim()}
                onMouseEnter={playHoverSound}
                className="p3r-parallelogram bg-white hover:bg-[#FF0055] text-[#002673] hover:text-white px-5 py-2.5 font-p3r font-black text-xs uppercase tracking-wider transition-colors cursor-pointer border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C] flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <div className="transform skew-x-14 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>TRANSMIT</span>
                </div>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#002673]">
            <div className="w-14 h-14 bg-white text-[#002673] flex items-center justify-center border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C] mb-3 transform -skew-x-12">
              <MessageSquare className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h4 className="font-p3r text-lg text-white uppercase font-black">
              NO ALLY CHANNEL SELECTED
            </h4>
            <p className="text-xs text-sky-100 font-mono font-bold mt-1">
              Select an ally from the left channel list to initiate transmission.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
