/**
 * Exercises the Vercel functions (api/*) without deploying.
 *
 * The serverless entry points are the production path, and until a deploy
 * happens they are never run by anything -- the dev server exercises the
 * Express adapter instead. These tests call each function's default export with
 * a mock req/res, which is the same contract Vercel's runtime uses, so a
 * mismatch between the two adapters shows up here rather than in production.
 *
 * Only offline-safe routes are asserted. The three AI routes and the live search
 * are covered by a wiring test (correct handler wired to the right path); their
 * behaviour is already covered in scripts/test-parse.ts.
 *
 * Run: npx tsx scripts/test-vercel-adapters.ts
 */

import academics from '../api/ai/academics';
import vitality from '../api/ai/vitality';
import culture from '../api/ai/culture';
import search from '../api/search';
import health from '../api/health';

let pass = 0;
let fail = 0;

/**
 * Runs one assertion and records the result.
 *
 * Awaited by the caller: fire-and-forget here would let the `process.exit` at
 * the bottom run before any check had settled, reporting "0 passed" for a suite
 * that actually passed.
 */
async function check(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    console.log(`  ok   ${name}`);
    pass++;
  } catch (err) {
    console.log(
      `  FAIL ${name}\n         ${err instanceof Error ? err.message : String(err)}`
    );
    fail++;
  }
}

/** Minimal stand-in for Vercel's ServerResponse. */
function mockRes() {
  const res = {
    statusCode: 200,
    payload: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.payload = payload;
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value;
      return res;
    },
  };
  return res;
}

/** Asserts a function exists and is callable as Vercel requires. */
function assertVercelShaped(fn: unknown, label: string) {
  if (typeof fn !== 'function') {
    throw new Error(`${label} does not export a function (Vercel will 404)`);
  }
}

console.log('\nvercel function adapters');

await check('every api/* entry point default-exports a function', () => {
  assertVercelShaped(academics, 'api/ai/academics');
  assertVercelShaped(vitality, 'api/ai/vitality');
  assertVercelShaped(culture, 'api/ai/culture');
  assertVercelShaped(search, 'api/search');
  assertVercelShaped(health, 'api/health');
});

await check('health responds 200 with provider details', async () => {
  const res = mockRes();
  await health({ method: 'GET' }, res);
  if (res.statusCode !== 200) throw new Error(`status ${res.statusCode}`);
  const body = res.payload as { ok?: boolean; provider?: string; model?: string };
  if (body?.ok !== true) throw new Error(`not ok: ${JSON.stringify(res.payload)}`);
  if (!body.provider || !body.model) throw new Error('missing provider/model');
});

await check('health ignores a POST body and stays 200', async () => {
  // Guards against a handler accidentally reading the body it doesn't own.
  const res = mockRes();
  await health({ method: 'GET', body: { anything: 1 } }, res);
  if (res.statusCode !== 200) throw new Error(`status ${res.statusCode}`);
});

await check('search rejects an unknown category with 400', async () => {
  const res = mockRes();
  await search({ method: 'GET', query: { q: 'x', category: 'nonsense' } }, res);
  if (res.statusCode !== 400) throw new Error(`expected 400, got ${res.statusCode}`);
  const body = res.payload as { error?: string };
  if (!body?.error?.includes('category must be one of')) {
    throw new Error(`unhelpful error: ${body?.error}`);
  }
});

await check('search returns an empty list, not an error, for a 1-char query', async () => {
  // Matches the dev server: too-short queries short-circuit before any fetch.
  const res = mockRes();
  await search({ method: 'GET', query: { q: 'a', category: 'game' } }, res);
  if (res.statusCode !== 200) throw new Error(`expected 200, got ${res.statusCode}`);
  const body = res.payload as { results?: unknown[] };
  if (body?.results?.length !== 0) throw new Error('expected zero results');
});

await check('search falls back to the URL when query is absent', async () => {
  // Vercel only fills req.query for GETs; the adapter parses the URL otherwise.
  // A *valid* category proves parsing happened: if the URL were ignored,
  // category would be undefined and the handler would 400. A 1-char query keeps
  // this offline -- the handler short-circuits before any upstream call.
  const res = mockRes();
  await search({ method: 'GET', url: '/api/search?q=a&category=game' }, res);
  if (res.statusCode !== 200) {
    throw new Error(`expected 200 (URL parsed), got ${res.statusCode}`);
  }
  const body = res.payload as { results?: unknown[] };
  if (body?.results?.length !== 0) throw new Error('expected zero results');
});

await check('search 400s when neither query nor url supplies a category', async () => {
  // The control for the test above: same call minus the URL.
  const res = mockRes();
  await search({ method: 'GET' }, res);
  if (res.statusCode !== 400) throw new Error(`expected 400, got ${res.statusCode}`);
});

await check('academics rejects a missing content field with 400', async () => {
  const res = mockRes();
  await academics({ method: 'POST', body: { title: 'x' } }, res);
  if (res.statusCode !== 400) throw new Error(`expected 400, got ${res.statusCode}`);
});

await check('vitality rejects a missing query with 400', async () => {
  const res = mockRes();
  await vitality({ method: 'POST', body: { domain: 'workout' } }, res);
  if (res.statusCode !== 400) throw new Error(`expected 400, got ${res.statusCode}`);
});

await check('vitality rejects a blank-but-present query with 400', async () => {
  const res = mockRes();
  await vitality({ method: 'POST', body: { query: '   ' } }, res);
  if (res.statusCode !== 400) throw new Error(`expected 400, got ${res.statusCode}`);
});

await check('culture accepts a missing logged list without throwing', async () => {
  // No key configured in a bare test env, so this asserts the failure is
  // surfaced as a JSON response rather than crashing the function.
  const res = mockRes();
  await culture({ method: 'POST', body: { category: 'game' } }, res);
  if (res.statusCode < 400 || res.statusCode >= 600) {
    throw new Error(`expected a mapped error status, got ${res.statusCode}`);
  }
  if (!res.payload || typeof res.payload !== 'object') {
    throw new Error('error response was not an object');
  }
});

await check('an unparseable body does not crash the adapter', async () => {
  // Express json() can hand a handler a non-object; it must not throw.
  const res = mockRes();
  await academics({ method: 'POST', body: undefined }, res);
  if (res.statusCode !== 400) throw new Error(`expected 400, got ${res.statusCode}`);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

