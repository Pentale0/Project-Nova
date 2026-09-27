import { StatKey, StatInfo } from '../types';

export const RANK_THRESHOLDS = [0, 12, 30, 55, 90];
export const ROMAN_RANKS = ['I', 'II', 'III', 'IV', 'V'];

export const STAT_RULES: Record<StatKey, {
  name: string;
  xpPerUnit: number;
  unitNoun: string;
  titles: [string, string, string, string, string];
  color: string;
  accentColor: string;
}> = {
  academics: {
    name: 'Academics',
    xpPerUnit: 4, // 4 XP per hour
    unitNoun: 'hours studied',
    titles: ['Slacker', 'Average', 'Diligent', 'Honor Student', 'Genius'],
    color: '#51EEFC',
    accentColor: '#1269CC',
  },
  vitality: {
    name: 'Vitality',
    xpPerUnit: 6, // 6 XP per session
    unitNoun: 'sessions',
    titles: ['Resting', 'Warming Up', 'Active', 'Athletic', 'Radiant'],
    color: '#00D2FF',
    accentColor: '#0A84FF',
  },
  culture: {
    name: 'Culture',
    xpPerUnit: 4, // 4 XP per title
    unitNoun: 'titles logged',
    titles: ['Unplugged', 'Curious', 'Well-Read', 'Connoisseur', 'Polymath'],
    color: '#38BDF8',
    accentColor: '#0284C7',
  },
  memories: {
    name: 'Memories',
    xpPerUnit: 3, // 3 XP per photo
    unitNoun: 'photos',
    titles: ['Blank Film', 'Snapshots', 'Album', 'Chronicle', 'Legacy'],
    color: '#70E1FF',
    accentColor: '#0369A1',
  },
};

export function calculateRankDetails(xp: number, statKey: StatKey): {
  rank: number;
  rankName: string;
  title: string;
  percent: number;
  currentRankXp: number;
  nextThreshold: number;
} {
  let rank = 1;
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= RANK_THRESHOLDS[i]) {
      rank = i + 1;
      break;
    }
  }

  const titles = STAT_RULES[statKey].titles;
  const title = titles[Math.min(rank - 1, titles.length - 1)];
  const rankName = ROMAN_RANKS[Math.min(rank - 1, ROMAN_RANKS.length - 1)];

  if (rank >= RANK_THRESHOLDS.length) {
    return {
      rank,
      rankName,
      title,
      percent: 100,
      currentRankXp: xp,
      nextThreshold: RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1],
    };
  }

  const currentBase = RANK_THRESHOLDS[rank - 1];
  const nextBase = RANK_THRESHOLDS[rank];
  const range = nextBase - currentBase;
  const progress = Math.max(0, xp - currentBase);
  const percent = Math.min(100, Math.round((progress / range) * 100));

  return {
    rank,
    rankName,
    title,
    percent,
    currentRankXp: xp,
    nextThreshold: nextBase,
  };
}

export function buildStatInfo(key: StatKey, xp: number): StatInfo {
  const rule = STAT_RULES[key];
  const details = calculateRankDetails(xp, key);
  
  // Calculate raw units based on XP and multiplier
  const units = key === 'academics' 
    ? Number((xp / rule.xpPerUnit).toFixed(1)) 
    : Math.floor(xp / rule.xpPerUnit);

  return {
    key,
    name: rule.name,
    xp,
    ...details,
    color: rule.color,
    accentColor: rule.accentColor,
    unitsValue: units,
    counterLabel: `${units} ${rule.unitNoun}`,
  };
}
