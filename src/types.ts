export type StatKey = 'academics' | 'vitality' | 'culture' | 'memories';

export interface StatInfo {
  key: StatKey;
  name: string;
  xp: number;
  rank: number; // 1 to 5
  rankName: string; // "I", "II", "III", "IV", "V"
  title: string;
  percent: number;
  currentRankXp: number;
  nextThreshold: number;
  color: string;
  accentColor: string;
  counterLabel: string;
  unitsValue: number;
}

export interface UserAccount {
  id: string;
  handle: string; // URL-safe slug e.g. "anas"
  displayName: string;
  createdAt: string;
}

export interface AcademicResource {
  id: string;
  title: string;
  subject: string;
  content: string;
  createdAt: string;
}

export type MediaCategory = 'movie' | 'series' | 'anime' | 'book' | 'manga' | 'game';

export interface MediaItem {
  id: string;
  category: MediaCategory;
  title: string;
  topRank: number; // 1 to 10
  status: 'done' | 'playing';
  tag?: string;
  createdAt: string;
}

export interface MemoryPhoto {
  id: string;
  caption: string;
  imageUrl: string;
  createdAt: string;
  likes: number;
}

export interface InterestUser {
  id: string;
  handle: string;
  displayName: string;
  avatar: string;
  cultureRank: string;
  cultureTitle: string;
  sharedTitles: string[];
  interestTags: string[];
  bio: string;
  hasLikedMe: boolean;
}

export interface MatchConnection {
  matchId: string;
  userId: string;
  handle: string;
  displayName: string;
  avatar: string;
  sharedTitles: string[];
  lastMessage?: string;
  updatedAt: string;
}

/**
 * A candidate in the Social Links interest deck.
 *
 * Distinct from MatchConnection: this is someone you have not connected to
 * yet, shown with their Arcana, social role and shared taste rather than a
 * message thread. The `arcana*`/`role` fields are Persona-flavoured flavour
 * text, not derived state.
 *
 * Fields were inferred from how SocialLinksTab reads them -- that component is
 * not currently mounted anywhere, so there is no data source to confirm the
 * exact shapes against. `rank` follows StatInfo's convention (1-5).
 */
export interface SocialLinkAlly {
  id: string;
  handle: string;
  displayName: string;
  avatar: string;
  arcana: string;
  arcanaNum: number;
  rank: number; // 1 to 5
  role: string;
  statusMessage: string;
  sharedInterests: string[];
  isMatched: boolean;
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  isMe: boolean;
}

export interface QuizQuestion {
  question: string;
  answer: string;
  explanation: string;
}
