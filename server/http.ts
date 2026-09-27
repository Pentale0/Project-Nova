/**
 * Transport-agnostic request plumbing shared by the Express dev server
 * (server/index.ts) and the Vercel functions (api/*).
 *
 * Nothing in this file knows which framework is calling it. Handlers are plain
 * functions from a request context to a `{ status, body }` result, and errors
 * are thrown rather than written to a response object. That is what lets the
 * same business logic serve `npm run dev` and a production deploy without being
 * duplicated.
 */

import { getProvider, ProviderConfigError } from './provider.js';

export { getProvider, ProviderConfigError };

// ---------------------------------------------------------------------------
// Handler contract
// ---------------------------------------------------------------------------

/** The slice of a request a handler is allowed to see. */
export interface RequestContext {
  method: string;
  query: Record<string, string | string[] | undefined>;
  body: Record<string, unknown>;
}

export interface HandlerResult {
  status: number;
  body: unknown;
}

/**
 * A route body. Returning early (validation failure) is just an early return;
 * unexpected failures throw and are mapped by `toHttpError` in the adapter.
 */
export type Handler = (ctx: RequestContext) => Promise<HandlerResult>;

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export interface ParseFailure {
  error: string;
  raw: string;
}

export class NoApiKeyError extends Error {
  constructor() {
    // Generic on purpose: server/provider.ts prefers OpenRouter and only falls
    // back to Gemini, so naming one key here used to send people to edit the
    // wrong line of their .env.
    super('No AI provider key is set on the server.');
    this.name = 'NoApiKeyError';
  }
}

export class ParseFailureError extends Error {
  constructor(public failure: ParseFailure) {
    super(failure.error);
    this.name = 'ParseFailureError';
  }
}

export class TransientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransientError';
  }
}

/**
 * Maps a thrown error onto an HTTP response.
 *
 * The point of the specific cases is that a user should never be shown a wall of
 * upstream JSON. The overwhelmingly common causes are a missing key, an
 * exhausted quota, or a model that has been retired, and each of those has a
 * concrete action attached to it.
 */
export function toHttpError(err: unknown): HandlerResult {
  const provider = getProvider();

  if (err instanceof NoApiKeyError) {
    return {
      status: 503,
      body: {
        error: 'AI unavailable',
        detail:
          'No AI key is set. Add OPENROUTER_API_KEY (or GEMINI_API_KEY) to your environment and restart.',
      },
    };
  }

  if (err instanceof ParseFailureError) {
    return {
      status: 502,
      body: { error: 'Could not read the model response', detail: err.failure.error },
    };
  }

  if (err instanceof TransientError) {
    console.error('[nova:ai] gave up after retries:', err.message);
    return {
      status: 503,
      body: {
        error: 'AI is busy',
        detail:
          'The model provider is under heavy load right now. Wait a few seconds and try again.',
      },
    };
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  // Log the name and top stack frames, not just the message. A bare message like
  // "Invalid JSON" is ambiguous -- it can come from the provider, from Vercel's
  // request parsing, or from our own code -- and on a deployed function the
  // stack is the only way to tell those apart. The class name is what decided
  // which branch above was skipped, so it is the first thing worth seeing.
  const stack = err instanceof Error && err.stack ? err.stack.split('\n').slice(1, 4).join(' | ') : '';
  console.error(
    `[nova:ai] ${err instanceof Error ? err.name : typeof err}: ${message}`,
    stack
  );

  const keyName =
    provider.name === 'openrouter' ? 'OPENROUTER_API_KEY' : 'GEMINI_API_KEY';

  if (
    /\b(401|403)\b|PERMISSION_DENIED|API key not valid|API_KEY_INVALID|Insufficient credits/i.test(
      message
    )
  ) {
    return {
      status: 502,
      body: {
        error: 'Provider rejected the request',
        detail: `Your ${keyName} was refused. Check that the key is correct and has credits/quota.`,
      },
    };
  }

  if (/no longer available|NOT_FOUND|model.*not found|No endpoints found/i.test(message)) {
    const varName =
      provider.name === 'openrouter' ? 'OPENROUTER_MODEL' : 'GEMINI_MODEL';
    return {
      status: 502,
      body: {
        error: 'Model unavailable',
        detail: `"${provider.model}" is not served by ${provider.name}. Set ${varName} to a current model.`,
      },
    };
  }

  return { status: 500, body: { error: 'AI request failed', detail: message } };
}

// ---------------------------------------------------------------------------
// JSON extraction
// ---------------------------------------------------------------------------

/** Strips markdown fences and extracts the outermost JSON value. */
export function extractJson(text: string): unknown {
  let cleaned = text.trim();
  // Models sometimes wrap JSON in ```json ... ``` despite instructions.
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall back to the first balanced object/array in the response.
    const start = cleaned.search(/[[{]/);
    if (start === -1) throw new Error('No JSON found in model response');

    const opener = cleaned[start];
    const closer = opener === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (ch === opener) depth++;
      else if (ch === closer) {
        depth--;
        if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1));
      }
    }
    throw new Error('Unbalanced JSON in model response');
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * True for the failures that usually clear on their own: capacity spikes,
 * quota throttling, and timeouts. A bad key or an unknown model is *not*
 * transient, so retrying those would just waste the user's time.
 */
export function isTransient(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /\b(429|500|502|503|504)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED|high demand|overloaded|rate limit|ETIMEDOUT|ECONNRESET|fetch failed|socket hang up|terminated/i.test(
    message
  );
}

const RETRYABLE_MAX = Number(process.env.AI_MAX_RETRIES ?? 3);

/**
 * Calls the active provider, retrying temporary capacity errors with
 * exponential backoff.
 *
 * Providers throttle unpredictably, and a single failed request would otherwise
 * read to the user as a broken feature.
 */
async function generateWithRetry(prompt: string): Promise<string> {
  const provider = getProvider();
  if (!provider.configured) throw new NoApiKeyError();

  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRYABLE_MAX; attempt++) {
    if (attempt > 0) {
      // 1s, 2s, 4s, 8s with a little jitter so retries don't sync up.
      const backoff = 1000 * 2 ** (attempt - 1);
      const jitter = Math.random() * 400;
      await sleep(backoff + jitter);
      console.warn(
        `[nova:ai] transient failure, retry ${attempt}/${RETRYABLE_MAX} in ${Math.round(
          backoff + jitter
        )}ms`
      );
    }

    try {
      return await provider.generate(prompt);
    } catch (err) {
      // A config error (bad key, retired model) will never fix itself.
      if (err instanceof ProviderConfigError) throw err;
      lastError = err;
      if (!isTransient(err) || attempt === RETRYABLE_MAX) break;
    }
  }

  throw lastError instanceof Error
    ? new TransientError(lastError.message)
    : new TransientError('AI request failed');
}

/** Runs a prompt and returns the parsed JSON, with retries and fence-stripping. */
export async function askForJson(prompt: string): Promise<unknown> {
  const text = await generateWithRetry(prompt);

  try {
    return extractJson(text);
  } catch (err) {
    throw new ParseFailureError({
      error: err instanceof Error ? err.message : 'Unknown parse error',
      raw: text.slice(0, 500),
    });
  }
}

// ---------------------------------------------------------------------------
// Validation helpers â€” never trust the model's shape
// ---------------------------------------------------------------------------

export const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' && v.trim() ? v : fallback;

export const strArray = (v: unknown, max = 12): string[] =>
  Array.isArray(v) ? v.map((i) => str(i)).filter(Boolean).slice(0, max) : [];

/**
 * Finds the list a prompt asked for inside a parsed model response.
 *
 * Providers disagree about list shape. Some honour a request for a top-level
 * array; others (anything using `response_format: json_object`) always wrap it,
 * under a name we can't predict â€” `{"result": [...]}`, `{"recommendations":
 * [...]}`, and so on. So: look for a key matching one of `hints` first, then
 * fall back to the first array present, at any depth.
 */
export function pickList(value: unknown, hints: string[] = []): unknown[] {
  if (Array.isArray(value)) return value;

  if (!value || typeof value !== 'object') return [];
  const entries = Object.entries(value as Record<string, unknown>);

  for (const hint of hints) {
    const match = entries.find(
      ([key, nested]) => key.toLowerCase().includes(hint) && Array.isArray(nested)
    );
    if (match) return match[1] as unknown[];
  }

  for (const [, nested] of entries) {
    if (Array.isArray(nested)) return nested;
    // One level of nesting is enough for the wrappers models actually emit.
    if (nested && typeof nested === 'object') {
      const deeper = Object.values(nested as Record<string, unknown>).find(Array.isArray);
      if (Array.isArray(deeper)) return deeper;
    }
  }

  return [];
}

/** Narrowing filter for the record-shaped lists (quizzes, recommendations). */
export function asRecords(list: unknown[]): Record<string, unknown>[] {
  return list
    .map((item) =>
      item && typeof item === 'object' ? (item as Record<string, unknown>) : null
    )
    .filter((item): item is Record<string, unknown> => item !== null);
}

/** Normalises anything a framework hands us into a plain record. */
export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

