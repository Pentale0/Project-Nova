/**
 * Gemini prompt construction for PROJECT NOVA's three coaches.
 *
 * Every prompt demands raw JSON (no markdown fences, no prose) so the client
 * can render structured pieces instead of dumping raw model text. The parsing
 * and fallback handling lives in index.ts.
 *
 * Reminder from the brief: AI actions never grant XP. Only the logging actions
 * in the React app award XP.
 */

import { StatInfo } from '../src/types';
import { MediaCategory } from '../src/types';

export interface MediaTitle {
  title: string;
  category: MediaCategory;
  topRank?: number;
  tag?: string;
}

/**
 * Verified metadata for one logged title, resolved from the free sources in
 * server/sources.ts. Kept as a structural type rather than importing
 * MediaLookup so the prompt builder stays free of transport concerns.
 */
export interface MediaFact {
  title: string;
  year?: number;
  genres?: string[];
  rating?: number;
  creator?: string;
  description?: string;
  /** Which database the fields came from, so ratings aren't mislabelled. */
  source?: string;
}

export interface StudyCoachResult {
  summaryNotes: string[];
  conceptGraph: string;
  quizzes: { question: string; answer: string; explanation: string }[];
}

export interface VitalityCoachResult {
  headline: string;
  protocol: string[];
  workoutPlan?: { warmup: string; mainRoutine: string; cooldown: string };
}

export interface CultureRecResult {
  title: string;
  type: string;
  reason: string;
}

/** Shared guard: keeps the model from inventing facts outside the supplied source. */
const GROUNDING_RULE = `Ground your answer ONLY in the material provided below. Do not
invent facts that are absent from it. If the material is insufficient for a
request, say so plainly in the relevant field rather than guessing.`;

// ---------------------------------------------------------------------------
// Academics coach
// ---------------------------------------------------------------------------

export function buildStudyPrompt(input: {
  title: string;
  subject: string;
  content: string;
}): string {
  return `You are NOVA's Academics Coach: calm, precise, and rigorous. You teach
strictly from the student's own material and never pad with filler.

RESOURCE TITLE: ${input.title}
SUBJECT: ${input.subject}

SOURCE MATERIAL:
"""
${input.content}
"""

${GROUNDING_RULE}

Return ONLY raw JSON (no markdown fences, no preamble) with exactly this shape:
{
  "summaryNotes": ["structured study note 1", "structured study note 2", "structured study note 3", "structured study note 4"],
  "conceptGraph": "ASCII art concept diagram, max 14 lines wide, using box-drawing characters. Must show how the core concepts in the source relate to each other.",
  "quizzes": [
    {"question": "...", "answer": "...", "explanation": "which part of the source supports this"},
    {"question": "...", "answer": "...", "explanation": "..."},
    {"question": "...", "answer": "...", "explanation": "..."},
    {"question": "...", "answer": "...", "explanation": "..."},
    {"question": "...", "answer": "...", "explanation": "..."}
  ]
}

Requirements:
- summaryNotes must have exactly 4 items, each a self-contained study point.
- quizzes must have exactly 5 items, and every answer must be derivable from the
  source material. Do not write questions the source cannot answer.
- explanation must cite the specific supporting idea, not generic filler.`;
}

// ---------------------------------------------------------------------------
// Vitality coach
// ---------------------------------------------------------------------------

const VITALITY_DOMAIN_BRIEF: Record<string, string> = {
  workout:
    'Training programming: sets, reps, progression, volume, and exercise selection.',
  sleep:
    'Sleep quality and circadian rhythm: onset, deep sleep, REM, and recovery timing.',
  recovery:
    'Recovery and soft tissue: soreness, nutrition, hydration, and load management.',
  sports:
    'Sport-specific conditioning: skill practice, intervals, and competition prep.',
};

export function buildVitalityPrompt(input: {
  domain: string;
  query: string;
  stat: Pick<StatInfo, 'rank' | 'title' | 'xp'>;
  recentSessions: number;
}): string {
  const brief = VITALITY_DOMAIN_BRIEF[input.domain] ?? VITALITY_DOMAIN_BRIEF.workout;

  return `You are NOVA's Vitality Coach: practical, encouraging, and safety-first.

FOCUS AREA: ${input.domain} — ${brief}
THE USER'S QUESTION OR GOAL: ${input.query}

CONTEXT: The user is at Vitality rank ${input.stat.rank} (${input.stat.title}),
${input.stat.xp} XP total, and has logged ${input.recentSessions} training session(s) so far.

SAFETY RULES (non-negotiable):
- Give generic guidance suitable for a healthy teenager or adult doing recreational training.
- Do NOT diagnose injuries or conditions, and do NOT make clinical claims.
- If the question sounds medical, injury-related, or mentions pain, chest discomfort,
  or eating-disorder behaviours, do not treat it. Put a clear recommendation to see a
  doctor or qualified professional in the protocol list.
- Never recommend supplement dosages as medical advice. If mentioning a supplement,
  frame it as optional and note consulting a professional first.

${GROUNDING_RULE.replace(
  'the material provided below',
  'general exercise and sleep science'
)}

Return ONLY raw JSON (no markdown fences, no preamble) with exactly this shape:
{
  "headline": "SHORT ALL-CAPS PROTOCOL NAME, max 6 words",
  "protocol": ["actionable step 1", "actionable step 2", "actionable step 3", "actionable step 4", "actionable step 5"],
  "workoutPlan": {
    "warmup": "one short paragraph",
    "mainRoutine": "one paragraph that directly addresses the user's stated goal",
    "cooldown": "one short paragraph"
  }
}

Requirements:
- protocol must have exactly 5 items, each a concrete instruction with a number or
  duration where relevant.
- workoutPlan is REQUIRED and must be tailored to the user's stated goal, not generic.
- Keep the tone direct and coach-like. No disclaimers longer than one sentence.`;
}

// ---------------------------------------------------------------------------
// Culture recommender
// ---------------------------------------------------------------------------

const CATEGORY_LABEL: Record<MediaCategory, string> = {
  movie: 'movie',
  series: 'TV series',
  anime: 'anime',
  game: 'video game',
  book: 'book',
  manga: 'manga',
};

/** How each source's rating scale is labelled, so 86 doesn't read as "86%". */
const RATING_LABEL: Record<string, string> = {
  anilist: 'AniList score',
  cinemeta: 'IMDb rating',
  tvmaze: 'TVmaze rating',
  steam: 'Metacritic score',
  openlibrary: 'Open Library average rating',
};

/** Renders one verified fact as a compact prompt line. */
function describeFact(fact: MediaFact, category: MediaCategory): string {
  const parts: string[] = [];

  if (fact.year) parts.push(String(fact.year));
  if (fact.genres?.length) parts.push(fact.genres.join(', '));
  if (fact.creator) {
    const role =
      category === 'movie'
        ? 'dir.'
        : category === 'game'
          ? 'dev.'
          : category === 'series'
            ? 'network'
            : category === 'book' || category === 'manga'
              ? 'author'
              : 'studio';
    parts.push(`${role} ${fact.creator}`);
  }
  if (fact.rating !== undefined) {
    const label = fact.source ? RATING_LABEL[fact.source] : undefined;
    parts.push(label ? `${fact.rating}/100 (${label})` : `${fact.rating}/100`);
  }

  // A short plot/description gives the model something concrete to connect on
  // when two titles share a genre but nothing else obvious.
  const blurb = fact.description?.slice(0, 180);
  const detail = parts.length ? `${parts.join('; ')}.` : '';
  const tail = blurb ? ` ${blurb}` : '';

  return detail || tail
    ? `${fact.title} — ${detail}${tail}`
    : `${fact.title} — (no reference data available)`;
}

export function buildCulturePrompt(input: {
  category: MediaCategory;
  logged: MediaTitle[];
  /**
   * Verified metadata for some of the logged titles, from the free sources in
   * server/sources.ts. Treat as ground truth; it may be absent for titles the
   * sources don't carry.
   */
  facts?: MediaFact[];
  stat: Pick<StatInfo, 'rank' | 'title'>;
}): string {
  const loggedStr =
    input.logged
      .map(
        (t) =>
          `- ${t.title} (${CATEGORY_LABEL[t.category]}${
            t.topRank ? `, ranked #${t.topRank}` : ''
          })${t.tag ? ` ${t.tag}` : ''}`
      )
      .join('\n') || '(nothing logged in this category yet)';

  const targetLabel = CATEGORY_LABEL[input.category];

  // Only present this block when we actually resolved something, so the model
  // isn't invited to invent facts for titles we know nothing about.
  const factsStr = (input.facts ?? []).length
    ? `
VERIFIED REFERENCE DATA (fetched from a ${CATEGORY_LABEL[
        input.category
      ].toLowerCase()} database — treat every field as fact, and use it to make
reasons concrete and specific):
${input.facts!.map((f) => `- ${describeFact(f, input.category)}`).join('\n')}
`
    : '';

  return `You are NOVA's Culture Recommender: a sharp, opinionated tastemaker who
justifies every pick.

The user is building a Top 10 ${targetLabel} list. Their current Culture rank is
${input.stat.rank} (${input.stat.title}). A low rank does NOT mean they have logged
nothing — always work from the list below, never assume it is empty.

THEIR LOGGED TITLES (the basis for every recommendation):
${loggedStr}
${factsStr}
Recommend 5 ${targetLabel} titles to add to this list.

${GROUNDING_RULE.replace(
  'the material provided below',
  'the logged taste profile above'
)}

Return ONLY raw JSON (no markdown fences, no preamble) as a single JSON object
with one key, "recommendations", holding an array of exactly 5 objects:
{"recommendations": [
  {"title": "exact official title", "type": "${targetLabel}", "reason": "1-2 sentences tying this to something they already logged"}
]}

Requirements:
- Every title must be a real, existing, well-known work. Never invent a title.
- Never recommend a title that already appears in their logged list above.
- Every reason must name a specific trait (theme, tone, genre, creator, or structure)
  shared with a title from their logged list, naming that title. A reason that says
  they have "no logged preferences", or that a pick is good "for everyone", is a
  failure — pick something that connects to what they actually logged.
- When the reference data above covers the connection, cite the concrete detail
  it provides (a shared genre, creator, era, or rating) rather than gesturing at
  it vaguely.
- Match the user's apparent taste level; do not recommend obscure entries.`;
}
