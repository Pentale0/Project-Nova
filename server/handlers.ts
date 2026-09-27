/**
 * The five API endpoints, as pure handlers.
 *
 * Each one maps a RequestContext to a `{ status, body }` result and throws on
 * failure. Neither the Express dev server nor the Vercel functions contain any
 * of this logic -- they only adapt a framework request into a RequestContext
 * and write the result back. See server/http.ts for the shared plumbing.
 */

import {
  buildStudyPrompt,
  buildVitalityPrompt,
  buildCulturePrompt,
  StudyCoachResult,
  VitalityCoachResult,
  CultureRecResult,
  MediaTitle,
} from './ai.js';
import { lookupTitle, isSupportedCategory, SUPPORTED_CATEGORIES, MediaLookup } from './sources.js';
import { searchMedia } from './sources.js';
import type { MediaCategory } from '../src/types.js';
import {
  askForJson,
  str,
  strArray,
  pickList,
  asRecords,
  asRecord,
  getProvider,
  Handler,
  HandlerResult,
} from './http.js';

// ---------------------------------------------------------------------------
// POST /api/ai/academics
// ---------------------------------------------------------------------------

export const academics: Handler = async ({ body }) => {
  const content = str(body.content);
  if (!content) {
    return { status: 400, body: { error: 'content is required' } };
  }

  const raw = asRecord(
    await askForJson(
      buildStudyPrompt({
        title: str(body.title, 'Untitled resource'),
        subject: str(body.subject, 'General'),
        content,
      })
    )
  );

  // Prefer the exact keys we asked for, but fall back to a hint-based search
  // so a wrapper object doesn't cost the user their notes and quizzes.
  const notes = strArray(
    Array.isArray(raw.summaryNotes) ? raw.summaryNotes : pickList(raw, ['note', 'summary']),
    4
  );
  const quizzes = asRecords(pickList(raw, ['quiz', 'question']))
    .map((item) => {
      const question = str(item.question);
      if (!question) return null;
      return {
        question,
        answer: str(item.answer, 'Not stated in the source material.'),
        explanation: str(item.explanation, 'Derived from the supplied resource.'),
      };
    })
    .filter((q): q is NonNullable<typeof q> => q !== null)
    .slice(0, 5);

  if (notes.length === 0 && quizzes.length === 0) {
    return { status: 502, body: { error: 'Model returned no usable study content' } };
  }

  const result: StudyCoachResult = {
    // The UI expects a list; the model may return one blob of prose instead.
    summaryNotes: notes.length ? notes : [str(raw.summaryNotes, 'No notes returned.')],
    conceptGraph: str(raw.conceptGraph, 'No diagram available.'),
    quizzes,
  };

  return { status: 200, body: result };
};

// ---------------------------------------------------------------------------
// POST /api/ai/vitality
// ---------------------------------------------------------------------------

const VITALITY_DOMAINS = ['workout', 'sleep', 'recovery', 'sports'];

export const vitality: Handler = async ({ body }) => {
  const requested = str(body.domain);
  const domain = VITALITY_DOMAINS.includes(requested) ? requested : 'workout';

  const query = str(body.query);
  if (!query.trim()) {
    return { status: 400, body: { error: 'query is required' } };
  }

  const stat = asRecord(body.stat);
  const raw = asRecord(
    await askForJson(
      buildVitalityPrompt({
        domain,
        query: query.slice(0, 2000),
        stat: {
          rank: Number(stat.rank) || 1,
          title: str(stat.title, 'Novice'),
          xp: Number(stat.xp) || 0,
        },
        recentSessions: Number(body.recentSessions) || 0,
      })
    )
  );

  const protocol = strArray(raw.protocol, 5);
  if (protocol.length === 0) {
    return { status: 502, body: { error: 'Model returned no usable protocol' } };
  }

  const plan = asRecord(raw.workoutPlan);
  const hasPlan = str(plan.warmup) || str(plan.mainRoutine) || str(plan.cooldown);

  const result: VitalityCoachResult = {
    headline: str(raw.headline, 'TRAINING PROTOCOL').toUpperCase(),
    protocol,
    workoutPlan: hasPlan
      ? {
          warmup: str(plan.warmup, '5 minutes of dynamic mobility work.'),
          mainRoutine: str(plan.mainRoutine, 'Complete your main working sets at a controlled tempo.'),
          cooldown: str(plan.cooldown, '5 minutes of easy stretching and nasal breathing.'),
        }
      : undefined,
  };

  return { status: 200, body: result };
};

// ---------------------------------------------------------------------------
// POST /api/ai/culture
// ---------------------------------------------------------------------------

const VALID_CATEGORIES: MediaCategory[] = [
  'movie',
  'series',
  'anime',
  'game',
  'book',
  'manga',
];

/** How many logged titles to look up when building culture prompt context. */
const FACT_LIMIT = Number(process.env.CULTURE_FACT_LIMIT ?? 5);

/**
 * Resolves real metadata for the user's highest-ranked logged titles.
 *
 * The AI reasons much better when handed facts ("Action, Sci-Fi, 1998, directed
 * by the Wachowskis") than bare title strings, which it otherwise confabulates
 * around. Failures are swallowed deliberately: a slow or unreachable provider
 * must not stop a recommendation from being generated.
 */
async function lookupFacts(logged: MediaTitle[]): Promise<MediaLookup[]> {
  const targets = logged.slice(0, FACT_LIMIT);
  if (targets.length === 0) return [];

  const settled = await Promise.allSettled(
    targets.map((t) => lookupTitle(t.title, t.category))
  );

  // flatMap rather than filter+map: Promise.allSettled's union type doesn't
  // narrow through a type predicate, and this reads more clearly anyway.
  return settled.flatMap((r) =>
    r.status === 'fulfilled' && r.value ? [r.value] : []
  );
}

export const culture: Handler = async ({ body }) => {
  const safeCategory = VALID_CATEGORIES.includes(body.category as MediaCategory)
    ? (body.category as MediaCategory)
    : 'game';

  const safeLogged: MediaTitle[] = Array.isArray(body.logged)
    ? body.logged
        .map((t) => {
          const item = asRecord(t);
          return {
            title: str(item.title),
            category: VALID_CATEGORIES.includes(item.category as MediaCategory)
              ? (item.category as MediaCategory)
              : safeCategory,
            topRank: Number(item.topRank) || undefined,
            tag: str(item.tag) || undefined,
          };
        })
        .filter((t) => t.title)
        .slice(0, 40)
    : [];

  // Ground the model in real genres/years/creators instead of letting it guess.
  // Only the top few titles are looked up, to bound the number of upstream
  // calls, and any failure is tolerated -- title text alone still produces a
  // usable prompt.
  const facts = await lookupFacts(safeLogged);

  const stat = asRecord(body.stat);
  const raw = await askForJson(
    buildCulturePrompt({
      category: safeCategory,
      logged: safeLogged,
      facts,
      stat: { rank: Number(stat.rank) || 1, title: str(stat.title, 'Unplugged') },
    })
  );

  const results: CultureRecResult[] = asRecords(
    pickList(raw, ['recommendation', 'result', 'title', 'item'])
  )
    .map((rec) => {
      const title = str(rec.title);
      if (!title) return null;
      return {
        title,
        type: str(rec.type, safeCategory),
        reason: str(rec.reason, 'Matches your logged taste profile.'),
      };
    })
    .filter((r): r is CultureRecResult => r !== null)
    .slice(0, 5);

  if (results.length === 0) {
    return { status: 502, body: { error: 'Model returned no recommendations' } };
  }

  return { status: 200, body: results };
};

// ---------------------------------------------------------------------------
// GET /api/search
// ---------------------------------------------------------------------------

export const search: Handler = async ({ query }) => {
  const q = str(query.q);
  const category = str(query.category) as MediaCategory;

  if (!isSupportedCategory(category)) {
    return {
      status: 400,
      body: { error: `category must be one of: ${SUPPORTED_CATEGORIES.join(', ')}` },
    };
  }

  const limit = Math.min(Math.max(Number(query.limit) || 8, 1), 12);
  const results = await searchMedia(q, category, limit);

  // An empty list is a valid answer (typo, or nothing matches), not an error.
  return { status: 200, body: { results, source: 'live' } };
};

// ---------------------------------------------------------------------------
// GET /api/health
// ---------------------------------------------------------------------------

export const health: Handler = async (): Promise<HandlerResult> => {
  const provider = getProvider();
  return {
    status: 200,
    body: {
      ok: true,
      aiConfigured: provider.configured,
      provider: provider.name,
      model: provider.model,
    },
  };
};


