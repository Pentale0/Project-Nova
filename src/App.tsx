import React, { useState, useEffect } from 'react';
import {
  StatKey,
  StatInfo,
  UserAccount,
  AcademicResource,
  MediaItem,
  MediaCategory,
  MemoryPhoto,
  InterestUser,
  MatchConnection,
} from './types';
import { buildStatInfo, calculateRankDetails } from './utils/xp';
import { fetchCultureRecs } from './utils/api';
import { WaterBackground } from './components/WaterBackground';
import { TopBarHUD } from './components/TopBarHUD';
import { NavigationDial, TabId } from './components/NavigationDial';
import { OverviewTab } from './components/tabs/OverviewTab';
import { AcademicsTab } from './components/tabs/AcademicsTab';
import { VitalityTab } from './components/tabs/VitalityTab';
import { CultureTab } from './components/tabs/CultureTab';
import { MemoriesTab } from './components/tabs/MemoriesTab';
import { InterestDeckTab } from './components/tabs/InterestDeckTab';
import { ChatTab } from './components/tabs/ChatTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { CreatorTab } from './components/tabs/CreatorTab';
import { RankUpModal } from './components/RankUpModal';

const DEFAULT_USER: UserAccount = {
  id: 'u-1',
  handle: 'anas',
  displayName: 'Anas',
  createdAt: 'April 2026',
};

// Number of XP snapshots retained per stat for the radar's history trail.
const MAX_HISTORY = 24;

const INITIAL_STATS: Record<StatKey, number> = {
  academics: 0, // Rank 1: Slacker (0 hours studied)
  vitality: 0,  // Rank 1: Resting (0 sessions)
  culture: 0,   // Rank 1: Unplugged (0 titles logged)
  memories: 0,  // Rank 1: Blank Film (0 photos)
};

// Every stat starts at Rank I, so the radar trail begins from a single baseline point.
const emptyHistory = (xp: Record<StatKey, number>): Record<StatKey, number[]> => ({
  academics: [xp.academics],
  vitality: [xp.vitality],
  culture: [xp.culture],
  memories: [xp.memories],
});

const INITIAL_RESOURCES: AcademicResource[] = [
  {
    id: 'res-1',
    title: 'Distributed Systems & Vector Clocks',
    subject: 'Computer Science',
    content: 'Vector clocks provide causal ordering of distributed events across asynchronous nodes. Each process maintains an array of logical timestamps that increment on local events and synchronize on message exchange.',
    createdAt: 'Today',
  },
  {
    id: 'res-2',
    title: 'Cognitive Science & Memory Consolidation',
    subject: 'Neuroscience',
    content: 'Synaptic plasticity and long-term potentiation (LTP) depend on cyclic sleep phases. Slow-wave sleep reorganizes hippocampal memory traces into neocortical circuits for permanent conceptual retention.',
    createdAt: 'Yesterday',
  },
];

const INITIAL_MEDIA: MediaItem[] = [
  {
    id: 'm1',
    category: 'game',
    title: 'Persona 3 Reload',
    topRank: 1,
    status: 'done',
    tag: '#azure-aesthetic',
    createdAt: '2 days ago',
  },
  {
    id: 'm2',
    category: 'movie',
    title: 'Blade Runner 2049',
    topRank: 1,
    status: 'done',
    tag: '#cyberpunk',
    createdAt: '3 days ago',
  },
  {
    id: 'm3',
    category: 'series',
    title: 'Severance',
    topRank: 1,
    status: 'done',
    tag: '#mystery',
    createdAt: '4 days ago',
  },
  {
    id: 'm4',
    category: 'book',
    title: 'Dune',
    topRank: 1,
    status: 'done',
    tag: '#sci-fi',
    createdAt: '5 days ago',
  },
  {
    id: 'm5',
    category: 'anime',
    title: 'Neon Genesis Evangelion',
    topRank: 1,
    status: 'done',
    tag: '#mecha-psych',
    createdAt: '6 days ago',
  },
  {
    id: 'm6',
    category: 'manga',
    title: 'Berserk',
    topRank: 1,
    status: 'done',
    tag: '#dark-fantasy',
    createdAt: '1 week ago',
  },
];

const INITIAL_PHOTOS: MemoryPhoto[] = [
  {
    id: 'p1',
    caption: 'Sunset run along the coastal shoreline after passing engineering finals.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    createdAt: 'Apr 11',
    likes: 12,
  },
  {
    id: 'p2',
    caption: 'Reaching the summit before dawn. Cool wind and clear horizon.',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
    createdAt: 'Apr 09',
    likes: 24,
  },
  {
    id: 'p3',
    caption: 'Midnight neon reflections on the rain-slicked city pavement.',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    createdAt: 'Apr 07',
    likes: 18,
  },
  {
    id: 'p4',
    caption: 'Deep focus study session at the university library stacks.',
    imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=600&q=80',
    createdAt: 'Apr 05',
    likes: 9,
  },
  {
    id: 'p5',
    caption: 'Post-workout coffee with teammates discussing project roadmaps.',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    createdAt: 'Apr 03',
    likes: 15,
  },
];

// Seeded users who share titles and have already pre-liked the user
const INITIAL_CANDIDATES: InterestUser[] = [
  {
    id: 'nova_demo_a',
    handle: 'kaito',
    displayName: 'Kaito',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    cultureRank: 'Rank III',
    cultureTitle: 'Well-Read',
    sharedTitles: ['Persona 3 Reload', 'Blade Runner 2049'],
    interestTags: ['#cyberpunk', '#turn-based', '#cinematics'],
    bio: 'Avid sci-fi reader, game design enthusiast, and evening runner.',
    hasLikedMe: true, // Pre-liked! Clicking Connect triggers instant LINKED!
  },
  {
    id: 'nova_demo_b',
    handle: 'maya',
    displayName: 'Maya',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    cultureRank: 'Rank IV',
    cultureTitle: 'Connoisseur',
    sharedTitles: ['Severance', 'Dune'],
    interestTags: ['#sci-fi', '#mystery', '#literature'],
    bio: 'Philosophy researcher exploring artificial intelligence ethics and epic speculative fiction.',
    hasLikedMe: true, // Pre-liked!
  },
  {
    id: 'nova_demo_c',
    handle: 'ren',
    displayName: 'Ren',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    cultureRank: 'Rank II',
    cultureTitle: 'Curious',
    sharedTitles: ['Neon Genesis Evangelion'],
    interestTags: ['#mecha-psych', '#animation'],
    bio: 'Software engineer by day, animator by night. Always looking for new series.',
    hasLikedMe: false,
  },
];

export function App() {
  const [currentTab, setCurrentTab] = useState<TabId>('overview');
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    try {
      const saved = localStorage.getItem('nova_user');
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  // Stats deliberately do not persist. This is a demo, and the rank-up
  // animations are the whole point -- a visitor who came back to a Rank IV
  // dashboard would never see the radar actually grow, which is the one thing
  // worth showing. So XP and its history start from the baseline on every load
  // and live only as long as the tab does.
  //
  // The two updates below spread rather than mutate, so handing out the shared
  // INITIAL_STATS constant cannot corrupt it for the next mount.
  const [xpMap, setXpMap] = useState<Record<StatKey, number>>(() => ({ ...INITIAL_STATS }));

  // XP history powers the radar's growth trail. Rank is derived from XP alone,
  // so a raw number per snapshot is all the radar needs.
  const [xpHistory, setXpHistory] = useState<Record<StatKey, number[]>>(() =>
    emptyHistory(INITIAL_STATS)
  );

  const [resources, setResources] = useState<AcademicResource[]>(() => {
    try {
      const saved = localStorage.getItem('nova_resources');
      return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
    } catch {
      return INITIAL_RESOURCES;
    }
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem('nova_media');
      return saved ? JSON.parse(saved) : INITIAL_MEDIA;
    } catch {
      return INITIAL_MEDIA;
    }
  });

  const [photos, setPhotos] = useState<MemoryPhoto[]>(() => {
    try {
      const saved = localStorage.getItem('nova_photos');
      return saved ? JSON.parse(saved) : INITIAL_PHOTOS;
    } catch {
      return INITIAL_PHOTOS;
    }
  });

  const [candidates, setCandidates] = useState<InterestUser[]>(INITIAL_CANDIDATES);
  const [matches, setMatches] = useState<MatchConnection[]>([
    {
      matchId: 'match-1',
      userId: 'nova_demo_a',
      handle: 'kaito',
      displayName: 'Kaito',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      sharedTitles: ['Persona 3 Reload', 'Blade Runner 2049'],
      lastMessage: 'Right? Did you check out the soundtrack too?',
      updatedAt: '16:43',
    },
  ]);

  const [activeMatch, setActiveMatch] = useState<MatchConnection | null>(null);

  // Link copy feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal Stamp (for RANK UP or LINKED)
  const [stampInfo, setStampInfo] = useState<{
    isOpen: boolean;
    statKey: StatKey;
    newRank: number;
    newRankName: string;
    newTitle: string;
    isLinked?: boolean;
    linkedName?: string;
  }>({
    isOpen: false,
    statKey: 'academics',
    newRank: 1,
    newRankName: 'I',
    newTitle: '',
  });

  // Drop the stats keys an earlier build wrote. Nothing reads them any more, but
  // anyone who loaded the previous deployment still has their progress sitting
  // in localStorage, and leaving it there is the kind of dead state that later
  // reads as a bug. Cheap to clear once, on mount.
  useEffect(() => {
    for (const key of ['nova_xp_map', 'nova_xp_history', 'nova_state_version']) {
      localStorage.removeItem(key);
    }
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem('nova_user', JSON.stringify(currentUser));
  }, [currentUser]);
  useEffect(() => {
    localStorage.setItem('nova_resources', JSON.stringify(resources));
  }, [resources]);
  useEffect(() => {
    localStorage.setItem('nova_media', JSON.stringify(mediaItems));
  }, [mediaItems]);
  useEffect(() => {
    localStorage.setItem('nova_photos', JSON.stringify(photos));
  }, [photos]);

  // Keyboard navigation [1-8]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      const map: Record<string, TabId> = {
        '1': 'overview',
        '2': 'academics',
        '3': 'vitality',
        '4': 'culture',
        '5': 'memories',
        '6': 'social',
        '7': 'chat',
        '8': 'profile',
        '9': 'creator',
      };
      if (map[e.key]) {
        setCurrentTab(map[e.key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute stat infos
  const statsInfo: Record<StatKey, StatInfo> = {
    academics: buildStatInfo('academics', xpMap.academics),
    vitality: buildStatInfo('vitality', xpMap.vitality),
    culture: buildStatInfo('culture', xpMap.culture),
    memories: buildStatInfo('memories', xpMap.memories),
  };

  const totalXp = Object.values(xpMap).reduce((sum, val) => sum + val, 0);
  const avgRank = Math.max(1, Math.round(Object.values(statsInfo).reduce((s, i) => s + i.rank, 0) / 4));
  const titles = ['Novice Seeker', 'Disciplined Operative', 'Architect of Self', 'Master Polymath', 'Apex Transcendent'];
  const overallTitle = titles[Math.min(avgRank - 1, titles.length - 1)];

  /**
   * AI fallback for culture search when the local catalog has no match.
   *
   * Reuses the recommender route and asks the model to complete the title. The
   * prompt is category-scoped by the caller, and results are filtered to titles
   * that actually overlap the query, since the model otherwise tends to return
   * generic top picks.
   *
   * The taste profile is the user's own library, highest-rated first. Sending it
   * is what makes the route worth having: the server looks up real metadata for
   * the top entries and grounds the model on it, so a completion matches the
   * user's taste instead of whatever is popular. Capped to match the server's
   * CULTURE_FACT_LIMIT default, since anything past that is dropped anyway and
   * this runs per query.
   */
  const handleAiTitleLookup = async (
    query: string,
    category: MediaCategory
  ): Promise<{ title: string; genres: string[] }[]> => {
    const tasteProfile = [...mediaItems]
      .sort((a, b) => b.topRank - a.topRank)
      .slice(0, 5)
      .map((m) => ({
        title: m.title,
        category: m.category,
        topRank: m.topRank,
        tag: m.tag,
      }));

    const recs = await fetchCultureRecs({
      category,
      logged: tasteProfile,
      stat: { rank: statsInfo.culture.rank, title: statsInfo.culture.title },
    });

    const tokens = query
      .toLowerCase()
      .split(/[\s:]+/)
      .filter((t) => t.length > 2);

    return recs
      .map((r) => ({ title: r.title, genres: [r.type.toLowerCase()] }))
      .filter((r) => {
        if (tokens.length === 0) return true;
        const hay = r.title.toLowerCase();
        return tokens.some((t) => hay.includes(t) || t.includes(hay));
      });
  };

  // Award XP
  const awardXp = (key: StatKey, amount: number) => {
    const oldDetails = calculateRankDetails(xpMap[key], key);
    const newXp = xpMap[key] + amount;
    const newDetails = calculateRankDetails(newXp, key);

    setXpMap((prev) => ({
      ...prev,
      [key]: newXp,
    }));

    setXpHistory((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), newXp].slice(-MAX_HISTORY),
    }));

    if (newDetails.rank > oldDetails.rank) {
      setStampInfo({
        isOpen: true,
        statKey: key,
        newRank: newDetails.rank,
        newRankName: newDetails.rankName,
        newTitle: newDetails.title,
        isLinked: false,
      });
    }
  };

  // Actions
  const handleLogStudy = (hours: number) => {
    const xpGained = Math.round(hours * 4);
    awardXp('academics', xpGained);
  };

  const handleAddResource = (title: string, subject: string, content: string) => {
    const newRes: AcademicResource = {
      id: Date.now().toString(),
      title,
      subject,
      content,
      createdAt: 'Just now',
    };
    setResources([newRes, ...resources]);
    // Per brief: study coach and adding notes don't grant XP, only logging study hours grants XP
  };

  const handleDeleteResource = (id: string) => {
    setResources(resources.filter((r) => r.id !== id));
  };

  const handleLogVitality = (sessions: number) => {
    const xpGained = sessions * 6;
    awardXp('vitality', xpGained);
  };

  const handleAddMedia = (
    category: MediaItem['category'],
    title: string,
    topRank: number,
    tag?: string
  ) => {
    const item: MediaItem = {
      id: Date.now().toString(),
      category,
      title,
      topRank,
      status: 'done',
      tag: tag || undefined,
      createdAt: 'Just now',
    };
    setMediaItems([item, ...mediaItems]);
    awardXp('culture', 4); // 4 XP per title
  };

  const handleDeleteMedia = (id: string) => {
    setMediaItems(mediaItems.filter((m) => m.id !== id));
  };

  const handleAddPhoto = (caption: string, imageUrl: string) => {
    const photo: MemoryPhoto = {
      id: Date.now().toString(),
      caption,
      imageUrl,
      createdAt: 'Just now',
      likes: 1,
    };
    setPhotos([photo, ...photos]);
    awardXp('memories', 3); // 3 XP per photo
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos(photos.filter((p) => p.id !== id));
  };

  const handleLikePhoto = (id: string) => {
    setPhotos(
      photos.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  const handleConnectCandidate = (user: InterestUser) => {
    // Check if match already exists
    const existing = matches.find((m) => m.userId === user.id);
    if (!existing) {
      const newMatch: MatchConnection = {
        matchId: `match-${Date.now()}`,
        userId: user.id,
        handle: user.handle,
        displayName: user.displayName,
        avatar: user.avatar,
        sharedTitles: user.sharedTitles,
        updatedAt: 'Just now',
      };
      setMatches([newMatch, ...matches]);
      setActiveMatch(newMatch);

      // Trigger LINKED celebratory stamp
      setStampInfo({
        isOpen: true,
        statKey: 'culture',
        newRank: 1,
        newRankName: 'LINK',
        newTitle: '',
        isLinked: true,
        linkedName: user.displayName,
      });

      // Jump to chat
      setCurrentTab('chat');
    }
  };

  const handlePassCandidate = (user: InterestUser) => {
    setCandidates((prev) => prev.filter((c) => c.id !== user.id));
  };

  const handleOpenChatWithMatch = (match: MatchConnection) => {
    setActiveMatch(match);
    setCurrentTab('chat');
  };

  const handleCopyProfileLink = () => {
    const profileUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/u/${currentUser.handle}`
      : `https://project-nova.app/u/${currentUser.handle}`;
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#003DA5] text-[#FFFFFF] font-['Plus_Jakarta_Sans'] selection:bg-white selection:text-[#002D80]">
      {/* Interactive Water Background */}
      <WaterBackground />

      {/* Main HUD Shell */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-col min-h-screen">
        {/* Top Metric HUD */}
        <TopBarHUD
          totalXp={totalXp}
          handle={currentUser.handle}
          displayName={currentUser.displayName}
          onOpenProfile={() => setCurrentTab('profile')}
          onCopyLink={handleCopyProfileLink}
          copied={copiedLink}
        />

        {/* Navigation Menu */}
        <NavigationDial
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />

        {/* Viewport Content */}
        <main className="flex-1 pb-10">
          {currentTab === 'overview' && (
            <OverviewTab
              stats={statsInfo}
              xpHistory={xpHistory}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onQuickLog={(statKey, units) => {
                if (statKey === 'academics') handleLogStudy(units);
                else if (statKey === 'vitality') handleLogVitality(units);
                else if (statKey === 'culture') awardXp('culture', 4);
                else if (statKey === 'memories') awardXp('memories', 3);
              }}
              onOpenProfile={() => setCurrentTab('profile')}
            />
          )}

          {currentTab === 'academics' && (
            <AcademicsTab
              stat={statsInfo.academics}
              resources={resources}
              onLogHours={handleLogStudy}
              onAddResource={handleAddResource}
              onDeleteResource={handleDeleteResource}
            />
          )}

          {currentTab === 'vitality' && (
            <VitalityTab
              stat={statsInfo.vitality}
              onLogSessions={handleLogVitality}
            />
          )}

          {currentTab === 'culture' && (
            <CultureTab
              stat={statsInfo.culture}
              mediaItems={mediaItems}
              onAddMedia={handleAddMedia}
              onDeleteMedia={handleDeleteMedia}
              onAiLookup={handleAiTitleLookup}
            />
          )}

          {currentTab === 'memories' && (
            <MemoriesTab
              stat={statsInfo.memories}
              photos={photos}
              onAddPhoto={handleAddPhoto}
              onDeletePhoto={handleDeletePhoto}
              onLikePhoto={handleLikePhoto}
            />
          )}

          {currentTab === 'social' && (
            <InterestDeckTab
              candidates={candidates}
              matches={matches}
              onConnect={handleConnectCandidate}
              onPass={handlePassCandidate}
              onOpenChat={handleOpenChatWithMatch}
            />
          )}

          {currentTab === 'chat' && (
            <ChatTab
              matches={matches}
              selectedMatch={activeMatch}
              onSelectMatch={(m) => setActiveMatch(m)}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileTab
              currentUser={currentUser}
              stats={statsInfo}
              totalXp={totalXp}
              overallRank={avgRank}
              overallTitle={overallTitle}
            />
          )}

          {currentTab === 'creator' && (
            <CreatorTab onBackToHud={() => setCurrentTab('overview')} />
          )}
        </main>

        {/* Footer */}
        <footer className="text-center py-3 text-xs border-t-2 border-white/30 font-mono text-white flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FF0055] clip-p3r-triangle"></span>
            <span className="font-p3r font-black text-white">PROJECT NOVA // DISCIPLINE HUD</span>
          </div>

          <button
            onClick={() => setCurrentTab('creator')}
            className="text-white hover:text-[#FF0055] font-p3r font-black text-xs uppercase transition-colors flex items-center gap-1 cursor-pointer bg-[#001F5C] px-3 py-1 border border-white/40"
          >
            <span>⚡ ABOUT THE CREATOR (ANAS)</span>
          </button>

          <span className="text-[#BAE6FD] font-bold">KEYS [1-9] SELECT MODULE</span>
        </footer>
      </div>

      {/* Kinetic Rank Up / Linked Stamp Modal */}
      <RankUpModal
        isOpen={stampInfo.isOpen}
        statKey={stampInfo.statKey}
        newRank={stampInfo.newRank}
        newRankName={stampInfo.newRankName}
        newTitle={stampInfo.newTitle}
        isLinked={stampInfo.isLinked}
        linkedName={stampInfo.linkedName}
        onClose={() => setStampInfo((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default App;
