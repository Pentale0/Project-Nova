/**
 * Curated title catalog backing the culture search dropdown.
 *
 * Local and static on purpose: search stays instant, works offline, costs no
 * tokens, and has no rate limit or extra API key to manage. Gemini only fills
 * the gap for titles the user invents that aren't in here.
 */

import { MediaCategory } from '../types';

export interface CatalogEntry {
  title: string;
  category: MediaCategory;
  year: number;
  genres: string[];
  /** Lowercase title + aliases, precomputed at module load for fast matching. */
  search: string;
}

interface Seed {
  title: string;
  category: MediaCategory;
  year: number;
  genres: string[];
  alias?: string;
}

const SEEDS: Seed[] = [
  // --- MOVIES ---
  { title: 'Blade Runner 2049', category: 'movie', year: 2017, genres: ['sci-fi', 'noir'] },
  { title: 'Arrival', category: 'movie', year: 2016, genres: ['sci-fi', 'drama'] },
  { title: 'Interstellar', category: 'movie', year: 2014, genres: ['sci-fi', 'drama'] },
  { title: 'Dune: Part Two', category: 'movie', year: 2024, genres: ['sci-fi', 'epic'] },
  { title: 'Past Lives', category: 'movie', year: 2023, genres: ['drama', 'romance'] },
  { title: 'The Social Network', category: 'movie', year: 2010, genres: ['drama'] },
  { title: 'Whiplash', category: 'movie', year: 2014, genres: ['drama', 'music'] },
  { title: 'Mad Max: Fury Road', category: 'movie', year: 2015, genres: ['action', 'scifi'] },
  { title: 'Inception', category: 'movie', year: 2010, genres: ['sci-fi', 'thriller'] },
  { title: 'Spirited Away', category: 'movie', year: 2001, genres: ['fantasy', 'animation'] },
  { title: 'Your Name.', category: 'movie', year: 2016, genres: ['romance', 'animation'], alias: 'kimi no na wa' },
  { title: 'Perfect Blue', category: 'movie', year: 1997, genres: ['thriller', 'psychological'] },
  { title: 'Paprika', category: 'movie', year: 2006, genres: ['sci-fi', 'psychological'] },
  { title: 'The Matrix', category: 'movie', year: 1999, genres: ['sci-fi', 'action'] },
  { title: 'Coco', category: 'movie', year: 2017, genres: ['animation', 'family'] },
  { title: 'Spider-Man: Into the Spider-Verse', category: 'movie', year: 2018, genres: ['animation', 'action'] },
  { title: 'Akira', category: 'movie', year: 1988, genres: ['sci-fi', 'animation'] },
  { title: 'Grave of the Fireflies', category: 'movie', year: 1988, genres: ['drama', 'war'] },
  { title: 'Parasite', category: 'movie', year: 2019, genres: ['thriller', 'drama'] },
  { title: 'Get Out', category: 'movie', year: 2017, genres: ['horror', 'thriller'] },
  { title: 'Her', category: 'movie', year: 2013, genres: ['romance', 'scifi'] },
  { title: 'The Grand Budapest Hotel', category: 'movie', year: 2014, genres: ['comedy', 'drama'] },
  { title: 'Everything Everywhere All at Once', category: 'movie', year: 2022, genres: ['scifi', 'comedy'], alias: 'eeaao' },
  { title: 'The Dark Knight', category: 'movie', year: 2008, genres: ['action', 'crime'] },
  { title: 'Sinners', category: 'movie', year: 2025, genres: ['horror', 'drama'] },
  { title: 'Poor Things', category: 'movie', year: 2023, genres: ['fantasy', 'drama'] },
  { title: 'Anatomy of a Fall', category: 'movie', year: 2023, genres: ['drama', 'mystery'] },
  { title: 'Oppenheimer', category: 'movie', year: 2023, genres: ['drama', 'biography'] },
  { title: 'Barbie', category: 'movie', year: 2023, genres: ['comedy', 'fantasy'] },
  { title: 'La La Land', category: 'movie', year: 2016, genres: ['romance', 'musical'] },
  { title: 'Moonlight', category: 'movie', year: 2016, genres: ['drama'] },
  { title: 'Drive', category: 'movie', year: 2011, genres: ['noir', 'drama'] },
  { title: 'Heat', category: 'movie', year: 1995, genres: ['crime', 'drama'] },
  { title: 'Oldboy', category: 'movie', year: 2003, genres: ['thriller', 'revenge'] },

  // --- SERIES ---
  { title: 'Severance', category: 'series', year: 2022, genres: ['sci-fi', 'thriller'] },
  { title: 'Dark', category: 'series', year: 2017, genres: ['sci-fi', 'mystery'] },
  { title: 'Succession', category: 'series', year: 2018, genres: ['drama'] },
  { title: 'The Bear', category: 'series', year: 2022, genres: ['drama', 'comedy'] },
  { title: 'Mr. Robot', category: 'series', year: 2015, genres: ['thriller', 'drama'] },
  { title: 'Breaking Bad', category: 'series', year: 2008, genres: ['crime', 'drama'] },
  { title: 'Better Call Saul', category: 'series', year: 2015, genres: ['crime', 'drama'] },
  { title: 'The Last of Us', category: 'series', year: 2023, genres: ['drama', 'scifi'] },
  { title: 'Frieren: Beyond Journey\'s End', category: 'series', year: 2023, genres: ['fantasy', 'anime'], alias: 'sousou no frieren' },
  { title: 'Cyberpunk: Edgerunners', category: 'series', year: 2022, genres: ['scifi', 'anime'] },
  { title: 'Arcane', category: 'series', year: 2021, genres: ['fantasy', 'animation'] },
  { title: 'Attack on Titan', category: 'series', year: 2013, genres: ['anime', 'action'] },
  { title: 'Mob Psycho 100', category: 'series', year: 2016, genres: ['anime', 'comedy'] },
  { title: 'Chainsaw Man', category: 'series', year: 2022, genres: ['anime', 'action'] },
  { title: 'Jujutsu Kaisen', category: 'series', year: 2020, genres: ['anime', 'action'] },
  { title: 'Death Note', category: 'series', year: 2006, genres: ['anime', 'thriller'] },
  { title: 'Steins;Gate', category: 'series', year: 2011, genres: ['anime', 'scifi'], alias: 'steins gate' },
  { title: 'The Sopranos', category: 'series', year: 1999, genres: ['crime', 'drama'] },
  { title: 'Twin Peaks', category: 'series', year: 1990, genres: ['mystery', 'surreal'] },
  { title: 'Fleabag', category: 'series', year: 2016, genres: ['comedy', 'drama'] },
  { title: 'True Detective', category: 'series', year: 2014, genres: ['crime', 'mystery'] },
  { title: 'The Wire', category: 'series', year: 2002, genres: ['crime', 'drama'] },
  { title: 'Invincible', category: 'series', year: 2021, genres: ['animation', 'action'] },
  { title: 'Blue Eye Samurai', category: 'series', year: 2023, genres: ['animation', 'action'] },
  { title: 'Shogun', category: 'series', year: 2024, genres: ['drama', 'historical'] },
  { title: 'Scavengers Reign', category: 'series', year: 2023, genres: ['animation', 'scifi'] },

  // --- ANIME ---
  { title: 'Neon Genesis Evangelion', category: 'anime', year: 1995, genres: ['mecha', 'psychological'] },
  { title: 'Cowboy Bebop', category: 'anime', year: 1998, genres: ['noir', 'space'] },
  { title: 'Mononoke', category: 'anime', year: 2007, genres: ['supernatural', 'historical'] },
  { title: 'Ping Pong the Animation', category: 'anime', year: 2011, genres: ['sports', 'psychological'] },
  { title: 'Fullmetal Alchemist: Brotherhood', category: 'anime', year: 2009, genres: ['adventure', 'fantasy'] },
  { title: 'Vinland Saga', category: 'anime', year: 2019, genres: ['historical', 'adventure'] },
  { title: 'Mob Psycho 100 II', category: 'anime', year: 2019, genres: ['comedy', 'supernatural'] },
  { title: 'Made in Abyss', category: 'anime', year: 2017, genres: ['dark fantasy', 'adventure'] },
  { title: 'Serial Experiments Lain', category: 'anime', year: 1998, genres: ['psychological', 'scifi'] },
  { title: 'Revolutionary Girl Utena', category: 'anime', year: 1997, genres: ['psychological', 'fantasy'] },
  { title: 'Yuri on Ice', category: 'anime', year: 2016, genres: ['sports', 'drama'] },
  { title: 'March Comes in Like a Lion', category: 'anime', year: 2016, genres: ['slice of life', 'drama'] },
  { title: 'Kids on the Slope', category: 'anime', year: 2012, genres: ['music', 'drama'] },
  { title: 'Odd Taxi', category: 'anime', year: 2021, genres: ['mystery', 'comedy'] },
  { title: 'Tokyo Ghoul', category: 'anime', year: 2014, genres: ['horror', 'action'] },
  { title: 'Sword Art Online', category: 'anime', year: 2012, genres: ['fantasy', 'action'] },
  { title: 'Hunter x Hunter', category: 'anime', year: 2011, genres: ['adventure', 'fantasy'] },
  { title: 'One Punch Man', category: 'anime', year: 2015, genres: ['action', 'comedy'] },
  { title: 'Fire Force', category: 'anime', year: 2019, genres: ['action', 'scifi'] },
  { title: 'Solo Leveling', category: 'anime', year: 2024, genres: ['fantasy', 'action'] },
  { title: 'Dungeon Meshi', category: 'anime', year: 2024, genres: ['fantasy', 'comedy'] },
  { title: 'Zom 100: Bucket List of the Dead', category: 'anime', year: 2023, genres: ['comedy', 'horror'], alias: 'zom 100' },
  { title: 'Sakamoto Days', category: 'anime', year: 2024, genres: ['action', 'comedy'] },

  // --- GAMES ---
  { title: 'Persona 3 Reload', category: 'game', year: 2024, genres: ['rpg', 'jrpg'] },
  { title: 'Metaphor: ReFantazio', category: 'game', year: 2024, genres: ['rpg', 'jrpg'] },
  { title: 'Shin Megami Tensei V: Vengeance', category: 'game', year: 2023, genres: ['rpg', 'jrpg'] },
  { title: 'NieR: Automata', category: 'game', year: 2017, genres: ['rpg', 'action'] },
  { title: 'Elden Ring', category: 'game', year: 2022, genres: ['action', 'rpg'] },
  { title: 'Ghost of Tsushima', category: 'game', year: 2020, genres: ['action', 'adventure'] },
  { title: 'Bloodborne', category: 'game', year: 2015, genres: ['action', 'rpg'] },
  { title: 'Dark Souls', category: 'game', year: 2011, genres: ['rpg', 'action'] },
  { title: 'Final Fantasy VII Rebirth', category: 'game', year: 2024, genres: ['rpg', 'jrpg'] },
  { title: 'Final Fantasy XVI', category: 'game', year: 2023, genres: ['rpg', 'action'] },
  { title: 'Dragon Quest XI', category: 'game', year: 2017, genres: ['rpg', 'jrpg'] },
  { title: 'NieR', category: 'game', year: 2010, genres: ['rpg', 'dark'] },
  { title: 'Okami', category: 'game', year: 2006, genres: ['action', 'adventure'] },
  { title: 'Hollow Knight', category: 'game', year: 2017, genres: ['metroidvania', 'indie'] },
  { title: 'Celeste', category: 'game', year: 2018, genres: ['platformer', 'indie'] },
  { title: 'Outer Wilds', category: 'game', year: 2019, genres: ['adventure', 'indie'] },
  { title: 'Hades', category: 'game', year: 2020, genres: ['roguelike', 'indie'] },
  { title: 'Slay the Spire', category: 'game', year: 2019, genres: ['deckbuilder', 'indie'] },
  { title: 'Undertale', category: 'game', year: 2015, genres: ['rpg', 'indie'] },
  { title: 'Disco Elysium', category: 'game', year: 2019, genres: ['rpg', 'detective'] },
  { title: 'Red Dead Redemption 2', category: 'game', year: 2019, genres: ['open-world', 'adventure'] },
  { title: 'The Witcher 3', category: 'game', year: 2015, genres: ['rpg', 'open-world'] },
  { title: 'Mass Effect 2', category: 'game', year: 2010, genres: ['rpg', 'scifi'] },
  { title: 'Chrono Trigger', category: 'game', year: 1995, genres: ['rpg', 'jrpg'] },
  { title: 'Super Mario Bros.', category: 'game', year: 1985, genres: ['platformer'] },
  { title: 'The Legend of Zelda: Breath of the Wild', category: 'game', year: 2017, genres: ['adventure', 'open-world'] },
  { title: 'Animal Crossing: New Horizons', category: 'game', year: 2020, genres: ['simulation', 'cozy'] },
  { title: 'Stardew Valley', category: 'game', year: 2016, genres: ['simulation', 'cozy'] },
  { title: 'Terraria', category: 'game', year: 2011, genres: ['sandbox', 'indie'] },
  { title: 'Minecraft', category: 'game', year: 2011, genres: ['sandbox'] },
  { title: 'Genshin Impact', category: 'game', year: 2020, genres: ['rpg', 'gacha'] },
  { title: 'Honkai: Star Rail', category: 'game', year: 2023, genres: ['rpg', 'gacha'] },
  { title: 'Helldivers 2', category: 'game', year: 2024, genres: ['shooter', 'co-op'] },
  { title: 'Baldur\'s Gate 3', category: 'game', year: 2023, genres: ['rpg', 'crpg'] },
  { title: 'Alan Wake 2', category: 'game', year: 2023, genres: ['horror', 'adventure'] },
  { title: 'Resident Evil 4', category: 'game', year: 2023, genres: ['horror', 'action'] },
  { title: 'Silent Hill 2', category: 'game', year: 2001, genres: ['horror'] },
  { title: 'Portal 2', category: 'game', year: 2011, genres: ['puzzle', 'adventure'] },
  { title: 'Half-Life 2', category: 'game', year: 2004, genres: ['fps', 'scifi'] },
  { title: 'Doom Eternal', category: 'game', year: 2020, genres: ['fps', 'action'] },
  { title: 'Rocket League', category: 'game', year: 2015, genres: ['sports', 'racing'] },
  { title: 'Apex Legends', category: 'game', year: 2019, genres: ['fps', 'battle-royale'] },
  { title: 'Valorant', category: 'game', year: 2020, genres: ['fps', 'tactical'] },
  { title: 'League of Legends', category: 'game', year: 2009, genres: ['moba'] },
  { title: 'Dragon Ball FighterZ', category: 'game', year: 2018, genres: ['fighting', 'anime'] },
  { title: 'Guilty Gear Strive', category: 'game', year: 2021, genres: ['fighting'] },
  { title: 'Hades II', category: 'game', year: 2024, genres: ['roguelike', 'indie'] },
  { title: 'Fear and Hunger', category: 'game', year: 2022, genres: ['rpg', 'dark'] },
  { title: 'Sea of Stars', category: 'game', year: 2023, genres: ['rpg', 'jrpg'] },
  { title: 'Octopath Traveler II', category: 'game', year: 2023, genres: ['rpg', 'jrpg'] },
  { title: 'Ys IX: Monstrum No Shield', category: 'game', year: 2019, genres: ['rpg', 'action'], alias: 'ys ix' },

  // --- BOOKS ---
  { title: 'Dune', category: 'book', year: 1965, genres: ['sci-fi', 'classic'] },
  { title: 'The Memory Police', category: 'book', year: 1994, genres: ['sci-fi', 'literary'] },
  { title: 'Neuromancer', category: 'book', year: 1984, genres: ['sci-fi', 'cyberpunk'] },
  { title: 'Klara and the Sun', category: 'book', year: 2021, genres: ['sci-fi', 'literary'] },
  { title: 'Fahrenheit 451', category: 'book', year: 1953, genres: ['dystopia', 'classic'] },
  { title: '1984', category: 'book', year: 1949, genres: ['dystopia', 'classic'] },
  { title: 'Brave New World', category: 'book', year: 1932, genres: ['dystopia', 'classic'] },
  { title: 'The Handmaid\'s Tale', category: 'book', year: 1985, genres: ['dystopia'] },
  { title: 'Project Hail Mary', category: 'book', year: 2021, genres: ['sci-fi', 'adventure'] },
  { title: 'Children of Time', category: 'book', year: 2015, genres: ['sci-fi'] },
  { title: 'The Three-Body Problem', category: 'book', year: 2008, genres: ['sci-fi'] },
  { title: 'Cloud Atlas', category: 'book', year: 2004, genres: ['sci-fi', 'literary'] },
  { title: 'Never Let Me Go', category: 'book', year: 2005, genres: ['literary', 'scifi'] },
  { title: 'A Brief History of Time', category: 'book', year: 1988, genres: ['science', 'cosmology'] },
  { title: 'Sapiens', category: 'book', year: 2011, genres: ['history', 'science'] },
  { title: 'The Mythical Man-Month', category: 'book', year: 1975, genres: ['technology'] },
  { title: 'Clean Code', category: 'book', year: 2008, genres: ['technology', 'programming'] },
  { title: 'The Pragmatic Programmer', category: 'book', year: 1999, genres: ['technology', 'programming'] },
  { title: 'Structure and Interpretation of Computer Programs', category: 'book', year: 1985, genres: ['technology', 'programming'], alias: 'sicp' },
  { title: 'Thinking, Fast and Slow', category: 'book', year: 2011, genres: ['psychology'] },
  { title: 'Norwegian Wood', category: 'book', year: 1987, genres: ['literary', 'romance'] },
  { title: 'Kafka on the Shore', category: 'book', year: 2002, genres: ['fantasy', 'literary'] },
  { title: 'The Master and Margarita', category: 'book', year: 1967, genres: ['literary', 'fantasy'] },
  { title: 'Don Quixote', category: 'book', year: 1605, genres: ['classic', 'adventure'] },
  { title: 'One Hundred Years of Solitude', category: 'book', year: 1967, genres: ['literary', 'magical'] },

  // --- MANGA ---
  { title: 'Berserk', category: 'manga', year: 1989, genres: ['dark-fantasy', 'seinen'] },
  { title: 'Oyasumi Punpun', category: 'manga', year: 2007, genres: ['seinen', 'psychological'] },
  { title: 'Vagabond', category: 'manga', year: 1998, genres: ['historical', 'seinen'] },
  { title: 'Pluto', category: 'manga', year: 1997, genres: ['scifi', 'seinen'] },
  { title: 'Monster', category: 'manga', year: 1997, genres: ['psychological', 'seinen'], alias: 'naoki urasawa monster' },
  { title: '20th Century Boys', category: 'manga', year: 1999, genres: ['thriller', 'seinen'] },
  { title: 'JoJo\'s Bizarre Adventure: Steel Ball Run', category: 'manga', year: 2004, genres: ['adventure', 'supernatural'] },
  { title: 'JoJo\'s Bizarre Adventure', category: 'manga', year: 1986, genres: ['adventure', 'supernatural'] },
  { title: 'Chainsaw Man', category: 'manga', year: 2018, genres: ['action', 'shonen'] },
  { title: 'Jujutsu Kaisen', category: 'manga', year: 2018, genres: ['action', 'shonen'] },
  { title: 'Demon Slayer', category: 'manga', year: 2016, genres: ['action', 'shonen'] },
  { title: 'Attack on Titan', category: 'manga', year: 2009, genres: ['action', 'dark'] },
  { title: 'One Piece', category: 'manga', year: 1997, genres: ['adventure', 'shonen'] },
  { title: 'My Hero Academia', category: 'manga', year: 2014, genres: ['superhero', 'shonen'] },
  { title: 'Solo Leveling', category: 'manga', year: 2018, genres: ['fantasy', 'shonen'] },
  { title: 'Tokyo Ghoul', category: 'manga', year: 2011, genres: ['horror', 'seinen'] },
  { title: 'Vinland Saga', category: 'manga', year: 2005, genres: ['historical', 'seinen'] },
  { title: 'Mob Psycho 100', category: 'manga', year: 2015, genres: ['comedy', 'supernatural'] },
  { title: 'Dorohedoro', category: 'manga', year: 2018, genres: ['dark fantasy', 'seinen'] },
  { title: 'Golden Kamuy', category: 'manga', year: 2014, genres: ['historical', 'seinen'] },
  { title: 'Made in Abyss', category: 'manga', year: 2012, genres: ['dark fantasy', 'seinen'] },
  { title: 'Dungeon Meshi', category: 'manga', year: 2014, genres: ['fantasy', 'comedy'] },
  { title: 'Yokohama Kaidashi Kikou', category: 'manga', year: 1994, genres: ['slice of life', 'seinen'] },
  { title: 'Blame!', category: 'manga', year: 1997, genres: ['scifi', 'seinen'] },
  { title: 'Heavenly Delusion', category: 'manga', year: 2015, genres: ['scifi', 'horror'] },
  { title: 'Aria', category: 'manga', year: 2002, genres: ['slice of life', 'comedy'] },
  { title: 'Girls\' Last Tour', category: 'manga', year: 2013, genres: ['post-apocalyptic', 'slice of life'] },
  { title: 'Kokoro Button', category: 'manga', year: 1992, genres: ['drama', 'seinen'] },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/**
 * Indexed by category + normalized title. Several works legitimately appear in
 * two categories (a manga and its anime adaptation, say), so the key includes
 * the category while still collapsing accidental duplicate seeds.
 */
const BY_KEY = new Map<string, CatalogEntry>();
for (const seed of SEEDS) {
  const key = `${seed.category}:${norm(seed.title)}`;
  if (BY_KEY.has(key)) continue;
  BY_KEY.set(key, {
    title: seed.title,
    category: seed.category,
    year: seed.year,
    genres: seed.genres,
    // Title, optional alias, and genres all count as searchable text.
    search: norm([seed.title, seed.alias, ...seed.genres].filter(Boolean).join(' ')),
  });
}

export const CATALOG: CatalogEntry[] = Array.from(BY_KEY.values());

export interface CatalogMatch extends CatalogEntry {
  /** Higher is a better match. */
  score: number;
}

/**
 * Ranked prefix/substring search over one category of the catalog.
 *
 * Scoring favours, in order: exact title, title prefix, title substring, then an
 * alias/genre hit, then multi-word overlap. Results are alphabetical within a
 * score so the dropdown doesn't reshuffle between keystrokes.
 */
export function searchCatalog(
  query: string,
  category: MediaCategory,
  limit = 8
): CatalogMatch[] {
  const q = norm(query);
  if (q.length < 1) return [];

  const matches: CatalogMatch[] = [];

  for (const entry of CATALOG) {
    if (entry.category !== category) continue;

    const title = norm(entry.title);
    let score = 0;

    if (title === q) score = 100;
    else if (title.startsWith(q)) score = 80;
    else if (title.includes(q)) score = 60;
    else if (entry.search.includes(q)) score = 35;
    else {
      // Fall back to per-word matching, e.g. "2049 blade".
      const words = q.split(' ').filter((w) => w.length > 2);
      const hits = words.filter((w) => entry.search.includes(w)).length;
      if (hits > 0) score = 20 + hits * 5;
    }

    if (score > 0) matches.push({ ...entry, score });
  }

  return matches
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
