/**
 * Thin client for the server-side AI proxy (see server/index.ts).
 *
 * The Gemini key lives only on the server, so every call here is same-origin
 * /api/* which Vite dev-proxies. Failures are normalised into a readable
 * message: a missing key should tell the user what to do, not surface a raw
 * 503 body.
 */

import { MediaCategory } from '../types';

export class AiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AiError';
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AiError(
      'Could not reach the AI server. Is it running? Start it with "npm run dev".'
    );
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data?.detail) detail = data.detail;
    } catch {
      // Non-JSON error body; keep the status-based message.
    }
    throw new AiError(detail, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new AiError('The AI server returned a malformed response.');
  }
}

// --- Academics -------------------------------------------------------------

export interface StudyCoachOutput {
  summaryNotes: string[];
  conceptGraph: string;
  quizzes: { question: string; answer: string; explanation: string }[];
}

export function fetchStudyCoach(input: {
  title: string;
  subject: string;
  content: string;
}): Promise<StudyCoachOutput> {
  return post<StudyCoachOutput>('/api/ai/academics', input);
}

// --- Vitality --------------------------------------------------------------

export interface VitalityCoachOutput {
  headline: string;
  protocol: string[];
  workoutPlan?: { warmup: string; mainRoutine: string; cooldown: string };
}

export function fetchVitalityCoach(input: {
  domain: string;
  query: string;
  stat: { rank: number; title: string; xp: number };
  recentSessions: number;
}): Promise<VitalityCoachOutput> {
  return post<VitalityCoachOutput>('/api/ai/vitality', input);
}

// --- Culture ---------------------------------------------------------------

export interface CultureRec {
  title: string;
  type: string;
  reason: string;
}

export function fetchCultureRecs(input: {
  category: MediaCategory;
  logged: { title: string; category: MediaCategory; topRank?: number; tag?: string }[];
  stat: { rank: number; title: string };
}): Promise<CultureRec[]> {
  return post<CultureRec[]>('/api/ai/culture', input);
}

// --- Media search ----------------------------------------------------------

/** Which free database answered, so the UI can label results. */
export type MediaSource =
  | 'anilist'
  | 'cinemeta'
  | 'tvmaze'
  | 'steam'
  | 'openlibrary';

export interface MediaSearchResult {
  title: string;
  category: MediaCategory;
  year?: number;
  genres: string[];
  /** Normalized 0-100 across all sources. */
  rating?: number;
  creator?: string;
  description?: string;
  source: MediaSource;
  externalId?: string;
  /** Steam-only results are flagged so the console-coverage gap is visible. */
  platform?: 'steam';
}

export class MediaSearchError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'MediaSearchError';
  }
}

/**
 * Looks up titles in one category using the server's free metadata sources.
 *
 * Callers should treat this as best-effort: the whole point of the local
 * catalog is to keep the dropdown usable when this fails or returns nothing.
 */
export async function searchMediaTitles(input: {
  query: string;
  category: MediaCategory;
  limit?: number;
  signal?: AbortSignal;
}): Promise<MediaSearchResult[]> {
  const { query, category, limit = 8, signal } = input;
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed,
    category,
    limit: String(limit),
  });

  let response: Response;
  try {
    response = await fetch(`/api/search?${params.toString()}`, { signal });
  } catch (err) {
    // An abort is a normal part of debounced typing, not a failure to report.
    if (err instanceof DOMException && err.name === 'AbortError') return [];
    throw new MediaSearchError('Could not reach the search server.');
  }

  if (!response.ok) {
    let detail = `Search failed (${response.status})`;
    try {
      const data = await response.json();
      if (data?.error) detail = data.error;
    } catch {
      // Keep the status-based message.
    }
    throw new MediaSearchError(detail, response.status);
  }

  try {
    const data = await response.json();
    return Array.isArray(data?.results) ? data.results : [];
  } catch {
    throw new MediaSearchError('The search server returned a malformed response.');
  }
}
