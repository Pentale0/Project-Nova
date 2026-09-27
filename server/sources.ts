/**
 * Free, keyless metadata sources for the Culture section.
 *
 * Every source here was chosen because it needs no API key and no signup, and
 * because its ToS permits anonymous read access. They are used for two things:
 *   1. Powering the title-search dropdown, so users aren't limited to the
 *      hand-curated static catalog.
 *   2. Grounding the culture AI in real genres/years/creators instead of
 *      letting the model guess.
 *
 * Coverage, honestly:
 *   anime, manga -> AniList        (best of the bunch: genres, score, staff)
 *   movie        -> Stremio Cinemeta (IMDb rating, plot, cast, awards)
 *   series       -> TVmaze          (episodes, genres, network)
 *   game         -> Steam store + SteamSpy   (Steam titles ONLY, see below)
 *   book         -> Open Library    (weakest: no ratings, thin on recent fiction)
 *
 * Two gaps worth knowing about, since the user asked for SteamDB and
 * Letterboxd specifically:
 *   - SteamDB has no public API. The Steam store endpoints below are the
 *     closest free equivalent. They do NOT cover PlayStation, Xbox or Switch
 *     exclusives, so those games are genuinely unsearchable here. Results are
 *     tagged `platform: 'steam'` so the UI can say so out loud.
 *   - Letterboxd's API is request-only (you email them for approval), so its
 *     community ratings and lists are unavailable. We surface IMDb ratings
 *     from Cinemeta instead.
 *
 * All calls go through a small TTL cache. These are volunteer-run services;
 * caching both speeds up repeat searches and keeps us from hammering them.
 */

import type { MediaCategory } from '../src/types.js';

// ---------------------------------------------------------------------------
// Normalized result shape
// ---------------------------------------------------------------------------

/** Where a result came from. Surfaced in the UI so provenance is visible. */
export type SourceId = 'anilist' | 'cinemeta' | 'tvmaze' | 'steam' | 'openlibrary';

export interface MediaLookup {
  title: string;
  category: MediaCategory;
  year?: number;
  genres: string[];
  /** Normalized to 0-100 across every source, so they're comparable. */
  rating?: number;
  /** Author, studio, director, or developer depending on category. */
  creator?: string;
  description?: string;
  source: SourceId;
  /** Upstream id, kept for deep links and detail lookups later. */
  externalId?: string;
  /** Steam-only results get flagged so the console gap is visible. */
  platform?: 'steam';
}

const CREATOR_LABEL: Record<MediaCategory, string> = {
  movie: 'Director',
  series: 'Network',
  anime: 'Studio',
  manga: 'Author',
  game: 'Developer',
  book: 'Author',
};

// ---------------------------------------------------------------------------
// TTL cache
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = Number(process.env.MEDIA_CACHE_TTL_MS ?? 10 * 60 * 1000);
const CACHE_MAX = 500;

const cache = new Map<string, { expires: number; value: MediaLookup[] }>();

function cacheKey(category: MediaCategory, query: string): string {
  return `${category}:${query.trim().toLowerCase()}`;
}

/**
 * Returns cached results, or runs `produce` and caches the outcome. Empty
 * results are cached too: without that, a typo'd query would re-hit the
 * upstream service on every keystroke.
 */
async function cached(
  category: MediaCategory,
  query: string,
  produce: () => Promise<MediaLookup[]>
): Promise<MediaLookup[]> {
  const key = cacheKey(category, query);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  let value: MediaLookup[] = [];
  try {
    value = await produce();
  } catch (err) {
    console.warn(`[nova:sources] ${category} lookup failed:`, String(err).slice(0, 160));
    // Fall back to any stale entry rather than showing nothing.
    if (hit) return hit.value;
    return [];
  }

  // Simple insertion-order eviction; the map is small enough that this is fine.
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
  return value;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 12_000;

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    // Include the status so the caller's log line is diagnosable.
    throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
  }
  return (await res.json()) as T;
}

/** Strips HTML tags and collapses whitespace. TVmaze and Steam both return markup. */
function stripHtml(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

const clampGenres = (list: unknown, max = 6): string[] =>
  Array.isArray(list)
    ? list
        .map((g) => (typeof g === 'string' ? g.trim() : ''))
        .filter(Boolean)
        .slice(0, max)
    : [];

/** Lowercase, whitespace-collapsed, for case-insensitive title comparisons. */
const norm = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ');

/** Clamps a 0-100 score and drops implausible values. */
const asScore = (value: unknown): number | undefined => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(Math.min(100, n));
};

const clean = (value: unknown): string | undefined => {
  const s = typeof value === 'string' ? value.trim() : '';
  return s ? s.slice(0, 400) : undefined;
};

// ---------------------------------------------------------------------------
// AniList â€” anime + manga (GraphQL, no key, 90 req/min)
// ---------------------------------------------------------------------------

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

const MEDIA_TYPE: Record<'anime' | 'manga', 'ANIME' | 'MANGA'> = {
  anime: 'ANIME',
  manga: 'MANGA',
};

const ANILIST_QUERY = `
  query ($search: String, $type: MediaType) {
    Page(perPage: 8) {
      media(search: $search, type: $type, isAdult: false, sort: SEARCH_MATCH) {
        id
        title { english romaji }
        averageScore
        genres
        seasonYear
        description(asHtml: false)
        studios { edges { isMain node { name } } }
        staff(perPage: 6) {
          edges {
            role
            node { name { full } }
          }
        }
      }
    }
  }
`;

interface AniListMedia {
  id: number;
  title?: { english?: string | null; romaji?: string | null } | null;
  averageScore?: number | null;
  genres?: string[] | null;
  seasonYear?: number | null;
  description?: string | null;
  studios?: {
    edges?: { isMain?: boolean | null; node?: { name?: string | null } | null }[] | null;
  } | null;
  staff?: {
    edges?: {
      role?: string | null;
      node?: { name?: { full?: string | null } | null } | null;
    }[];
  } | null;
}

/** Prefers the English title, falls back to romaji. */
const anilistTitle = (m: Pick<AniListMedia, 'title'>): string =>
  m.title?.english?.trim() || m.title?.romaji?.trim() || '';

/**
 * The studio that actually made the show, flagged by AniList as main. Picking
 * the first edge instead would grab a licensor like "Funimation".
 */
function anilistStudio(m: Pick<AniListMedia, 'studios'>): string | undefined {
  const edges = m.studios?.edges ?? [];
  const main = edges.find((e) => e.isMain) ?? edges[0];
  return clean(main?.node?.name);
}

/**
 * The credited author/original creator for manga. AniList staff roles are free
 * text, so match on the role rather than position â€” otherwise voice actors and
 * translators crowd out the name that matters.
 */
function anilistAuthor(m: Pick<AniListMedia, 'staff'>): string | undefined {
  const edges = m.staff?.edges ?? [];
  const match =
    edges.find((e) => /author|original creator|story and art/i.test(e.role ?? '')) ??
    edges.find((e) => /story|art/i.test(e.role ?? ''));
  return clean(match?.node?.name?.full);
}

async function searchAniList(
  query: string,
  category: 'anime' | 'manga'
): Promise<MediaLookup[]> {
  const data = await getJson<{ data?: { Page?: { media?: AniListMedia[] } } }>(
    ANILIST_ENDPOINT,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: ANILIST_QUERY,
        variables: { search: query, type: MEDIA_TYPE[category] },
      }),
    }
  );

  return (data.data?.Page?.media ?? [])
    .map((m): MediaLookup | null => {
      const title = anilistTitle(m);
      if (!title) return null;
      const result: MediaLookup = {
        title,
        category,
        genres: clampGenres(m.genres),
        source: 'anilist',
        externalId: String(m.id),
      };
      if (m.seasonYear) result.year = m.seasonYear;
      const score = asScore(m.averageScore);
      if (score !== undefined) result.rating = score;
      // Anime is credited to a studio, manga to an author.
      const creator = category === 'anime' ? anilistStudio(m) : anilistAuthor(m);
      if (creator) result.creator = creator;
      const desc = clean(stripHtml(m.description));
      if (desc) result.description = desc;
      return result;
    })
    .filter((r): r is MediaLookup => r !== null);
}

// ---------------------------------------------------------------------------
// Stremio Cinemeta â€” movies (no key; IMDb ratings, plot, cast, awards)
// ---------------------------------------------------------------------------

interface CinemetaMeta {
  id?: string;
  imdb_id?: string;
  name?: string;
  year?: string | number;
  genres?: string[];
  genre?: string[];
  imdbRating?: string | number;
  description?: string;
  director?: string | string[];
  cast?: string[];
  poster?: string;
  releaseInfo?: string;
}

/** Maps one Cinemeta record (from either endpoint) to our shape. */
function cinemetaToLookup(
  m: CinemetaMeta,
  fallbackId?: string
): MediaLookup | null {
  const title = clean(m.name);
  if (!title) return null;

  const result: MediaLookup = {
    title,
    category: 'movie',
    genres: clampGenres(m.genres ?? m.genre),
    source: 'cinemeta',
  };

  const year = Number(m.year ?? m.releaseInfo);
  if (Number.isFinite(year) && year > 1800) result.year = year;

  // IMDb ratings arrive as strings like "8.0"; scale to 0-100 like AniList.
  const score = asScore(Number(m.imdbRating) * 10);
  if (score !== undefined) result.rating = score;

  const director = Array.isArray(m.director) ? m.director[0] : m.director;
  const creator = clean(director) ?? clean(m.cast?.[0]);
  if (creator) result.creator = creator;

  const desc = clean(m.description);
  if (desc) result.description = desc;

  const id = m.id ?? m.imdb_id ?? fallbackId;
  if (id) result.externalId = id;

  return result;
}

/**
 * Fills in a search hit that came back as a bare stub.
 *
 * Cinemeta's search catalog is inconsistent: some titles return a full record
 * (plot, rating, director) and others return little more than a name and an
 * IMDb id. The per-title `meta/movie/<id>` endpoint is consistently complete, so
 * hydrate the top few from it.
 */
function needsHydration(result: MediaLookup): boolean {
  return !result.genres.length || result.rating === undefined;
}

async function searchCinemeta(query: string): Promise<MediaLookup[]> {
  const url = `https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(
    query
  )}.json`;
  const data = await getJson<{ metas?: CinemetaMeta[] }>(url);

  const found = (data.metas ?? [])
    .map((m) => cinemetaToLookup(m))
    .filter((r): r is MediaLookup => r !== null)
    .slice(0, 6);

  const stubs = found.filter(needsHydration).slice(0, 4);
  if (stubs.length === 0) return found.slice(0, 8);

  const hydrated = await Promise.all(
    stubs.map(async (stub) => {
      if (!stub.externalId) return stub;
      try {
        const detail = await getJson<{ meta?: CinemetaMeta }>(
          `https://v3-cinemeta.strem.io/meta/movie/${stub.externalId}.json`
        );
        // Keep the stub's title if the detail record disagrees, so ordering and
        // spelling stay consistent with what the user typed.
        return detail.meta ? cinemetaToLookup(detail.meta, stub.externalId) ?? stub : stub;
      } catch {
        return stub;
      }
    })
  );

  const byTitle = new Map(hydrated.map((r) => [norm(r.title), r]));

  // Prefer the hydrated record, but keep the stub when hydration failed: a
  // title with no metadata beats no title at all.
  return found.map((r) => byTitle.get(norm(r.title)) ?? r).slice(0, 8);
}

// ---------------------------------------------------------------------------
// TVmaze â€” series (no key)
// ---------------------------------------------------------------------------

interface TvMazeShow {
  id?: number;
  name?: string;
  premiered?: string;
  ended?: string | null;
  genres?: string[];
  status?: string;
  rating?: { average?: number | null } | null;
  summary?: string | null;
  network?: { name?: string } | null;
  webChannel?: { name?: string } | null;
  image?: { original?: string } | null;
  url?: string;
}

async function searchTvMaze(query: string): Promise<MediaLookup[]> {
  const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`;
  const results = await getJson<
    { score?: number; show?: TvMazeShow }[]
  >(url);

  return results
    .filter((r) => r.show?.name)
    .map(({ show }): MediaLookup | null => {
      const s = show as TvMazeShow;
      const title = clean(s.name);
      if (!title) return null;
      const result: MediaLookup = {
        title,
        category: 'series',
        genres: clampGenres(s.genres),
        source: 'tvmaze',
      };
      const year = Number((s.premiered ?? '').slice(0, 4));
      if (Number.isFinite(year) && year > 1800) result.year = year;
      // TVmaze averages are 0-10.
      const score = asScore(Number(s.rating?.average) * 10);
      if (score !== undefined) result.rating = score;
      const network = clean(s.network?.name ?? s.webChannel?.name);
      if (network) result.creator = network;
      const desc = clean(stripHtml(s.summary));
      if (desc) result.description = desc;
      if (s.id) result.externalId = String(s.id);
      return result;
    })
    .filter((r): r is MediaLookup => r !== null)
    .slice(0, 8);
}

// ---------------------------------------------------------------------------
// Steam â€” games (no key). Steam titles only; see the note at the top of file.
// ---------------------------------------------------------------------------

const STEAM_SEARCH =
  'https://store.steampowered.com/api/storesearch/?l=english&cc=US&term=';

interface SteamSearchItem {
  id?: number;
  name?: string;
  tiny_image?: string;
  price?: { final?: number; final_formatted?: string } | null;
}

interface SteamAppDetails {
  success?: boolean;
  data?: {
    type?: string;
    name?: string;
    short_description?: string;
    genres?: { description?: string }[];
    release_date?: { date?: string };
    developers?: string[];
    publishers?: string[];
    metacritic?: { score?: number } | null;
  };
}

/** Steam dates look like "Nov 01, 2020" or just "2020". */
function steamYear(date: string | undefined): number | undefined {
  if (!date) return undefined;
  const match = date.match(/\d{4}/);
  const year = match ? Number(match[0]) : NaN;
  return Number.isFinite(year) && year > 1800 ? year : undefined;
}

/**
 * Fetches one app's details.
 *
 * Note the response is keyed by Steam's *group* id, which is frequently not the
 * appid we asked for (requesting 1145360 for Hades returns a body keyed
 * "1206340"). So read whichever single entry came back rather than indexing by
 * the requested id, which silently yields nothing.
 */
async function steamAppDetails(appId: number): Promise<SteamAppDetails['data'] | null> {
  try {
    const body = await getJson<Record<string, SteamAppDetails>>(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`
    );
    const first = body[Object.keys(body)[0]];
    return first?.success ? first.data ?? null : null;
  } catch {
    return null;
  }
}

async function searchSteam(query: string): Promise<MediaLookup[]> {
  const data = await getJson<{ total?: number; items?: SteamSearchItem[] }>(
    STEAM_SEARCH + encodeURIComponent(query)
  );

  // storesearch returns soundtracks, DLC and the occasional adult game under
  // the same "app" type, so inspect a wider slice and keep only real games.
  const items = (data.items ?? []).filter((i) => i.id && i.name).slice(0, 8);
  if (items.length === 0) return [];

  const detailed = await Promise.all(items.map((i) => steamAppDetails(i.id!)));

  return items
    .map((item, i): MediaLookup | null => {
      const title = clean(item.name);
      if (!title) return null;
      const data = detailed[i];
      // 'game' excludes soundtracks (music), DLC, demos and tools.
      if (data && data.type !== 'game') return null;

      const result: MediaLookup = {
        title,
        category: 'game',
        genres: clampGenres(data?.genres?.map((g) => g.description)),
        source: 'steam',
        platform: 'steam',
        externalId: String(item.id),
      };
      const year = steamYear(data?.release_date?.date);
      if (year) result.year = year;
      // Metacritic is 0-100 already, so it lines up with the other sources.
      const score = asScore(data?.metacritic?.score);
      if (score !== undefined) result.rating = score;
      const dev = clean(data?.developers?.[0] ?? data?.publishers?.[0]);
      if (dev) result.creator = dev;
      const desc = clean(data?.short_description);
      if (desc) result.description = desc;
      return result;
    })
    .filter((r): r is MediaLookup => r !== null)
    .slice(0, 6);
}

// ---------------------------------------------------------------------------
// Open Library â€” books (no key, no CORS header, so server-side only)
// ---------------------------------------------------------------------------

interface OpenLibraryDoc {
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  ratings_average?: number;
  key?: string;
  subject?: string[];
}

/** Open Library subjects are noisy ("Fiction", "Accessible book"); keep the useful ones. */
function cleanBookSubjects(subjects: unknown): string[] {
  if (!Array.isArray(subjects)) return [];
  const noise = /^(fiction|books|reading|literature|new york times|20th century)/i;
  return subjects
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter((s) => s && s.length < 28 && !noise.test(s))
    .slice(0, 5);
}

async function searchOpenLibrary(query: string): Promise<MediaLookup[]> {
  const fields = 'title,author_name,first_publish_year,ratings_average,key,subject';
  const url = `https://openlibrary.org/search.json?limit=8&fields=${fields}&q=${encodeURIComponent(
    query
  )}`;
  const data = await getJson<{ docs?: OpenLibraryDoc[] }>(url);

  return (data.docs ?? [])
    .map((d): MediaLookup | null => {
      const title = clean(d.title);
      if (!title) return null;
      const result: MediaLookup = {
        title,
        category: 'book',
        genres: cleanBookSubjects(d.subject),
        source: 'openlibrary',
      };
      if (d.first_publish_year) result.year = d.first_publish_year;
      // Open Library averages are 0-5; scale to 0-100.
      const score = asScore(Number(d.ratings_average) * 20);
      if (score !== undefined) result.rating = score;
      const author = clean(d.author_name?.[0]);
      if (author) result.creator = author;
      if (d.key) result.externalId = d.key;
      return result;
    })
    .filter((r): r is MediaLookup => r !== null);
}

// ---------------------------------------------------------------------------
// Public entry points
// ---------------------------------------------------------------------------

const SEARCHERS: Record<MediaCategory, (q: string) => Promise<MediaLookup[]>> = {
  anime: (q) => searchAniList(q, 'anime'),
  manga: (q) => searchAniList(q, 'manga'),
  movie: searchCinemeta,
  series: searchTvMaze,
  game: searchSteam,
  book: searchOpenLibrary,
};

/** Every category this module can look up. */
export const SUPPORTED_CATEGORIES = Object.keys(SEARCHERS) as MediaCategory[];

export function isSupportedCategory(value: unknown): value is MediaCategory {
  return typeof value === 'string' && value in SEARCHERS;
}

/**
 * Searches one category. Returns [] for a blank query or an unknown category.
 * Never throws: upstream failures degrade to an empty list so the UI can fall
 * back to its local catalog.
 */
export function searchMedia(
  query: string,
  category: MediaCategory,
  limit = 8
): Promise<MediaLookup[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return Promise.resolve([]);
  if (!isSupportedCategory(category)) return Promise.resolve([]);

  return cached(category, trimmed, () => SEARCHERS[category](trimmed)).then(
    (results) => results.slice(0, limit)
  );
}

/**
 * Looks up one specific title, for grounding the culture AI. Returns null when
 * the title can't be found, so callers can carry on with title text alone.
 */
export async function lookupTitle(
  title: string,
  category: MediaCategory
): Promise<MediaLookup | null> {
  const results = await searchMedia(title, category, 1);
  if (results.length === 0) return null;

  // The upstream may not rank our exact title first (e.g. a film series). Only
  // accept a result that actually looks like what was asked for.
  const want = title.trim().toLowerCase();
  const exact = results.find((r) => r.title.trim().toLowerCase() === want);
  if (exact) return exact;

  return results[0].title.toLowerCase().includes(want) ? results[0] : null;
}

/** Test seam: drops cached entries so specs can control timing. */
export function clearCache(): void {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Exported for tests
//
// These are the pure transforms that turn each provider's response into our
// shape. They're exported so the parsing can be checked without touching the
// network -- the upstream payloads are the part most likely to shift.
// ---------------------------------------------------------------------------

export const testing = {
  stripHtml,
  asScore,
  clampGenres,
  cleanBookSubjects,
  norm,
  steamYear,
  cinemetaToLookup,
  needsHydration,
  anilistTitle,
  anilistStudio,
  anilistAuthor,
};


