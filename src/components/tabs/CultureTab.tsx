import React, { useState } from 'react';
import { StatInfo, MediaItem, MediaCategory } from '../../types';
import {
  Compass,
  Film,
  Tv,
  BookOpen,
  Gamepad2,
  Plus,
  Trash2,
  Sparkles,
  BookMarked,
  Layers,
  Zap,
} from 'lucide-react';
import { playHoverSound, playSelectSound } from '../../utils/audio';

interface CultureTabProps {
  stat: StatInfo;
  mediaItems: MediaItem[];
  onAddMedia: (category: MediaCategory, title: string, topRank: number, tag?: string) => void;
  onDeleteMedia: (id: string) => void;
}

const CATEGORIES: { id: MediaCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'movie', label: 'MOVIES', icon: Film },
  { id: 'game', label: 'GAMES', icon: Gamepad2 },
  { id: 'anime', label: 'ANIME', icon: Layers },
  { id: 'series', label: 'SERIES', icon: Tv },
  { id: 'book', label: 'BOOKS', icon: BookOpen },
  { id: 'manga', label: 'MANGA', icon: BookMarked },
];

export const CultureTab: React.FC<CultureTabProps> = ({
  stat,
  mediaItems,
  onAddMedia,
  onDeleteMedia,
}) => {
  const [selectedCat, setSelectedCat] = useState<MediaCategory>('game');
  const [newTitle, setNewTitle] = useState('');
  const [newRank, setNewRank] = useState<number>(1);
  const [newTag, setNewTag] = useState('');

  // Recommender
  const [aiRecs, setAiRecs] = useState<{ title: string; type: string; reason: string }[] | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  // Items for the active category
  const categoryItems = mediaItems
    .filter((m) => m.category === selectedCat)
    .sort((a, b) => a.topRank - b.topRank);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    playSelectSound();
    onAddMedia(selectedCat, newTitle.trim(), newRank, newTag.trim());
    setNewTitle('');
    setNewTag('');
    setNewRank(Math.min(10, categoryItems.length + 2));
  };

  const handleGenerateRecs = () => {
    playSelectSound();
    setRecLoading(true);
    setTimeout(() => {
      setRecLoading(false);
      const suggestions: Record<MediaCategory, { title: string; type: string; reason: string }[]> = {
        game: [
          { title: 'Metaphor: ReFantazio', type: 'Game', reason: 'High-concept stylistic visual direction and deep societal storytelling.' },
          { title: 'Shin Megami Tensei V: Vengeance', type: 'Game', reason: 'Uncompromising tactical turn-based depth with post-apocalyptic mythos.' },
          { title: 'NieR: Automata', type: 'Game', reason: 'Transcendent philosophical narrative paired with a legendary orchestral score.' },
          { title: 'Elden Ring', type: 'Game', reason: 'Peerless environmental world design and open-ended exploration mastery.' },
          { title: 'Ghost of Tsushima', type: 'Game', reason: 'Cinematic Kurosawa homage with crisp swordplay and vivid color palettes.' },
        ],
        movie: [
          { title: 'Blade Runner 2049', type: 'Movie', reason: 'Supreme visual cinematography exploring identity and artificial memory.' },
          { title: 'Past Lives', type: 'Movie', reason: 'Profoundly moving contemplation on fate, choices, and unseen connections.' },
          { title: 'Arrival', type: 'Movie', reason: 'Intellectually rigorous science-fiction grounded in linguistic determinism.' },
          { title: 'Interstellar', type: 'Movie', reason: 'Grand emotional journey traversing relativistic physics and love.' },
          { title: 'Dune: Part Two', type: 'Movie', reason: 'Epic scale audiovisual immersion with complex political tragedy.' },
        ],
        anime: [
          { title: 'Neon Genesis Evangelion', type: 'Anime', reason: 'Foundational psychological anime exploring loneliness and human walls.' },
          { title: 'Mononoke', type: 'Anime', reason: 'Unmatched Japanese woodblock aesthetics investigating sorrow and spirits.' },
          { title: 'Cowboy Bebop', type: 'Anime', reason: 'Sublime blend of neo-noir, jazz improvisation, and bittersweet endings.' },
          { title: 'Steins;Gate', type: 'Anime', reason: 'Meticulously crafted thriller centered on causality and sacrifice.' },
          { title: 'Ping Pong The Animation', type: 'Anime', reason: 'Expressive rotoscoped art direction with honest youth character studies.' },
        ],
        series: [
          { title: 'Severance', type: 'Series', reason: 'Flawlessly directed psychological mystery dissecting corporate dissociation.' },
          { title: 'Dark', type: 'Series', reason: 'Intricately plotted German temporal mystery with unmatched attention to detail.' },
          { title: 'Succession', type: 'Series', reason: 'Shakespearean family dynamics with razor-sharp tragicomic dialogue.' },
          { title: 'The Bear', type: 'Series', reason: 'Kinetic visceral tension balancing grief, passion, and culinary craft.' },
          { title: 'Mr. Robot', type: 'Series', reason: 'Visually audacious psychological journey through cyber security and alienation.' },
        ],
        book: [
          { title: 'Dune', type: 'Book', reason: 'Towering ecology-driven sci-fi masterpiece examining prophetic religion.' },
          { title: 'The Memory Police', type: 'Book', reason: 'Haunting poetic parable about state-enforced collective amnesia.' },
          { title: 'Neuromancer', type: 'Book', reason: 'The stylistic genesis of cyberpunk literature and digital cyberspace.' },
          { title: 'Klara and the Sun', type: 'Book', reason: 'Gentle, heartbreaking perspective on human love from an artificial friend.' },
          { title: 'Fahrenheit 451', type: 'Book', reason: 'Enduring warning against intellectual passivity and shallow distractions.' },
        ],
        manga: [
          { title: 'Berserk', type: 'Manga', reason: 'Monolithic dark fantasy comic art unmatched in emotional gravity and detail.' },
          { title: 'Oyasumi Punpun', type: 'Manga', reason: 'Intensely vulnerable introspective exploration of youth and disillusionment.' },
          { title: 'Vagabond', type: 'Manga', reason: 'Breathtaking brushwork meditation on the way of the sword and enlightenment.' },
          { title: 'Chainsaw Man', type: 'Manga', reason: 'Subversive dark comedy balancing raw kinetic action with quiet longing.' },
          { title: 'Pluto', type: 'Manga', reason: 'Deeply compassionate retelling of Astro Boy exploring war trauma in robots.' },
        ],
      };
      setAiRecs(suggestions[selectedCat] || suggestions.game);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Banner - High Contrast with Corner Triangles & Lightning */}
      <div className="relative p-5 bg-[#002673] border-3 border-white shadow-[6px_6px_0px_#001F5C] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 overflow-hidden">
        {/* Corner Triangles */}
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-white rotate-45 pointer-events-none"></div>
        <div className="absolute -bottom-3 -left-3 w-7 h-7 bg-[#FF0055] rotate-45 pointer-events-none"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 flex items-center justify-center bg-white text-[#002673] text-2xl font-black font-p3r border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C] relative">
            {stat.rankName}
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF0055] rotate-45"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-sky-200 tracking-widest uppercase font-mono flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-[#FF0055] text-[#FF0055]" />
                <span>CULTURE FACULTY // TOP 10 CANON & TASTE</span>
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase font-p3r">
              RANK {stat.rank} — {stat.title}
            </h2>
            <div className="text-xs text-white font-mono font-bold">
              Progress: <span className="bg-[#FF0055] px-1.5 py-0.2 text-white">{stat.xp}</span> / {stat.nextThreshold} XP ({stat.percent}%) · <span className="text-sky-200">{stat.counterLabel}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerateRecs}
          disabled={recLoading}
          onMouseEnter={playHoverSound}
          className="relative z-10 flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FF0055] text-[#002673] hover:text-white font-p3r font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C]"
        >
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          <span>AI TASTE RECOMMENDER</span>
        </button>
      </div>

      {/* Category Tabs with Triangles */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCat === cat.id;
          const Icon = cat.icon;
          const count = mediaItems.filter((m) => m.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => {
                playSelectSound();
                setSelectedCat(cat.id);
              }}
              onMouseEnter={playHoverSound}
              className={`relative group flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer font-p3r border-2 ${
                isActive
                  ? 'bg-white text-[#002673] border-[#001F5C] shadow-[4px_4px_0px_#001F5C] -translate-y-0.5'
                  : 'bg-[#002673] text-white hover:bg-white hover:text-[#002673] border-white/70 shadow-[2px_2px_0px_#001F5C]'
              }`}
            >
              {isActive && (
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#FF0055] rotate-45 pointer-events-none"></div>
              )}
              <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{cat.label}</span>
              <span className={`text-[11px] font-mono px-1.5 py-0.2 font-extrabold ${
                isActive ? 'bg-[#FF0055] text-white' : 'bg-[#001740] text-white'
              }`}>
                {count}/10
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Top-10 Leaderboard for Selected Category */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative bg-[#002673] border-3 border-white shadow-[5px_5px_0px_#001F5C] p-5 overflow-hidden">
            <div className="absolute -top-3 -right-3 w-7 h-7 bg-white rotate-45 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4 border-b-2 border-white/40 pb-2 relative z-10">
              <h3 className="text-base font-black tracking-wide text-white uppercase font-p3r">
                TOP 10 CANON: {selectedCat.toUpperCase()}
              </h3>
              <span className="text-xs text-white font-mono font-extrabold bg-[#001740] px-2.5 py-0.5 border border-white/40">
                {categoryItems.length} OF 10 SLOTS FILLED
              </span>
            </div>

            {/* Add Title Form */}
            <form onSubmit={handleAdd} className="mb-5 space-y-3 bg-[#001740] p-4 border-2 border-white shadow-[3px_3px_0px_#001F5C]">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-3">
                  <label className="block text-xs uppercase font-extrabold text-sky-100 mb-1">
                    Rank Slot:
                  </label>
                  <select
                    value={newRank}
                    onChange={(e) => setNewRank(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-[#002673] border-2 border-white text-xs text-white font-bold focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n} className="bg-[#002673] text-white font-bold">
                        Rank #{n}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-9">
                  <label className="block text-xs uppercase font-extrabold text-sky-100 mb-1">
                    Work Title:
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={`e.g. Favorite ${selectedCat} title...`}
                    className="w-full px-3 py-1.5 bg-[#002673] border-2 border-white text-xs text-white font-bold placeholder:text-white/40 focus:border-[#38BDF8] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-extrabold text-sky-100 mb-1">
                  Tag / Interest Hook (Used for matching with other members):
                </label>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="e.g. #sci-fi, #turn-based, #cyberpunk..."
                  className="w-full px-3 py-1.5 bg-[#002673] border-2 border-white text-xs text-white font-bold placeholder:text-white/40 focus:border-[#38BDF8] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                onMouseEnter={playHoverSound}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FF0055] text-[#002673] hover:text-white font-p3r font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer border-2 border-[#001F5C] shadow-[2px_2px_0px_#001F5C]"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>CANONIZE TITLE (+4 CULTURE XP)</span>
              </button>
            </form>

            {/* Render 10 slots with high-contrast text */}
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slotNumber) => {
                const item = categoryItems.find((m) => m.topRank === slotNumber);

                return (
                  <div
                    key={slotNumber}
                    className={`p-3 flex items-center justify-between border-2 transition-all shadow-[2px_2px_0px_#001F5C] ${
                      item
                        ? 'bg-[#001740] border-white'
                        : 'bg-[#001740]/40 border-dashed border-white/30 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 flex items-center justify-center font-p3r font-black text-xs border ${
                          item ? 'bg-white text-[#002673] border-white' : 'bg-[#002673] text-white border-white/50'
                        }`}
                      >
                        {slotNumber}
                      </div>

                      {item ? (
                        <div>
                          <h4 className="font-extrabold text-sm text-white uppercase tracking-wide">
                            {item.title}
                          </h4>
                          {item.tag && (
                            <span className="text-xs text-sky-200 font-mono font-bold">
                              {item.tag}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-white/60 italic font-mono">
                          Unassigned slot #{slotNumber}
                        </span>
                      )}
                    </div>

                    {item && (
                      <button
                        onClick={() => {
                          playSelectSound();
                          onDeleteMedia(item.id);
                        }}
                        className="text-white hover:text-[#FF0055] p-1 transition-colors cursor-pointer"
                        title="Remove title"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: AI Culture Recommender */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative bg-[#002673] border-3 border-white shadow-[5px_5px_0px_#001F5C] p-5 overflow-hidden">
            <div className="absolute -bottom-3 -right-3 w-7 h-7 bg-[#FF0055] rotate-45 pointer-events-none"></div>

            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-white/40 relative z-10">
              <Compass className="w-4 h-4 text-white" />
              <h3 className="text-base font-black tracking-wide text-white uppercase font-p3r">
                5-ITEM CULTURE TASTE RECOMMENDER
              </h3>
            </div>

            <p className="text-xs text-sky-100 font-medium mb-4 leading-relaxed relative z-10">
              Curated recommendations synthesized based on your logged taste spectrum in {selectedCat}.
            </p>

            {aiRecs ? (
              <div className="space-y-2.5 relative z-10">
                {aiRecs.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-[#001740] border-l-4 border-white text-xs text-white leading-relaxed shadow-[3px_3px_0px_#001F5C]"
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-extrabold text-white uppercase font-p3r text-sm">
                        0{idx + 1}. {rec.title}
                      </span>
                      <span className="text-[11px] text-white font-mono font-bold px-1.5 py-0.2 bg-[#002673] border border-white">
                        {rec.type}
                      </span>
                    </div>
                    <p className="text-sky-100 text-xs font-medium">{rec.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 bg-[#001740] border-2 border-white text-center text-xs text-white font-mono font-bold relative z-10">
                Click "AI TASTE RECOMMENDER" above to synthesize five fresh cultural works matched to your palate.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
