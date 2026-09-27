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
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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

/**
 * A request whose `body` behaves like Vercel's.
 *
 * On Vercel, `body` is a getter that parses the request on access and throws
 * when the payload is unusable. Express caches a plain value instead, so a mock
 * with an ordinary property cannot reproduce the deployed behaviour -- the
 * throwing getter has to be simulated deliberately.
 */
function vercelStyleReq(body: Record<string, unknown>) {
  let reads = 0;
  return {
    method: 'POST',
    url: '/api/ai/vitality',
    get body() {
      // One-shot: a second read has nothing left to parse.
      if (reads++ > 0) throw new Error('Invalid JSON');
      return body;
    },
  };
}

console.log('\nvercel function adapters');

await check('every api/* entry point default-exports a function', () => {
  assertVercelShaped(academics, 'api/ai/academics');
  assertVercelShaped(vitality, 'api/ai/vitality');
  assertVercelShaped(culture, 'api/ai/culture');
  assertVercelShaped(search, 'api/search');
  assertVercelShaped(health, 'api/health');
});

await check('api/ contains no underscore-prefixed files or folders', () => {
  // Vercel treats every path in api/ as a function endpoint and drops anything
  // whose name starts with an underscore. A shared helper placed there -- an
  // earlier version of this repo had api/_adapter.ts -- is excluded from the
  // upload without warning: the build goes green, and every function then fails
  // at runtime with ERR_MODULE_NOT_FOUND. Nothing local catches that, so it is
  // checked here.
  const offenders: string[] = [];

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('_')) {
        offenders.push(join(dir, entry.name).replace(/\\/g, '/'));
        continue;
      }
      if (entry.isDirectory()) walk(join(dir, entry.name));
    }
  };

  walk(join(process.cwd(), 'api'));
  if (offenders.length > 0) {
    throw new Error(
      `Vercel will not upload: ${offenders.join(', ')}. Move shared helpers into server/.`
    );
  }
});

await check('no api/ entry point imports a path Vercel would rewrite', () => {
  // Belt and braces for the same rule: catches an underscore-prefixed helper
  // referenced by a relative import even if it lives outside api/.
  const sources = [
    'api/health.ts',
    'api/search.ts',
    'api/ai/academics.ts',
    'api/ai/vitality.ts',
    'api/ai/culture.ts',
  ];
  const bad: string[] = [];
  for (const file of sources) {
    const text = readFileSync(join(process.cwd(), file), 'utf8');
    for (const match of text.matchAll(/from\s+'([^']+)'/g)) {
      if (/(^|\/)_/.test(match[1])) bad.push(`${file} -> ${match[1]}`);
    }
  }
  if (bad.length > 0) throw new Error(bad.join('; '));
});

await check('every relative import in the deployed graph carries an extension', () => {
  // Vercel transpiles each api/*.ts to .js and copies server/ into the lambda
  // via `includeFiles`, but it does not bundle and does not rewrite specifiers.
  // Node's ESM resolver will not add a missing extension, so an import of
  // './http' survives the build intact and then throws ERR_MODULE_NOT_FOUND at
  // invoke time. tsx and tsc both paper over this locally, which is why the
  // dev server and the whole test suite pass while every deployed function
  // 500s with FUNCTION_INVOCATION_FAILED.
  const roots = ['api', 'server'];
  const bad: string[] = [];

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.ts')) {
        const text = readFileSync(full, 'utf8');
        for (const match of text.matchAll(/from\s+'(\.[^']*)'/g)) {
          const spec = match[1];
          if (!/\.[cm]?[jt]sx?$/.test(spec)) {
            bad.push(`${full.replace(/\\/g, '/')} -> ${spec}`);
          }
        }
      }
    }
  };

  for (const root of roots) walk(join(process.cwd(), root));
  if (bad.length > 0) {
    throw new Error(`Node ESM cannot resolve these; append .js:\n  ${bad.join('\n  ')}`);
  }
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

await check("reads Vercel's body getter once and does not depend on it twice", async () => {
  // A blank query keeps this off the network: the handler's own validation has
  // to answer it. Getting 400 proves the body survived; getting 500 means the
  // getter was read more than once and the second read threw.
  const res = mockRes();
  await vitality(vercelStyleReq({ query: '  ' }) as never, res as never);
  if (res.statusCode !== 400) {
    throw new Error(`expected 400 (a second read => 500), got ${res.statusCode}`);
  }
  if ((res.payload as { error?: string })?.error !== 'query is required') {
    throw new Error(`handler did not run: ${JSON.stringify(res.payload)}`);
  }
});

await check('an unparseable body is a 400, not an opaque 500', async () => {
  // This is the exact shape of a real failure: Vercel's getter rejects a body
  // it cannot parse (a UTF-8 BOM ahead of the JSON is enough) and throws
  // "Invalid JSON". Before readBody() the exception escaped as a 500 whose only
  // clue was the word "Invalid" -- true of the request, useless to whoever sent
  // it. The handler's own 400 names the actual problem.
  const res = mockRes();
  const unparseable = {
    method: 'POST',
    url: '/api/ai/vitality',
    get body(): never {
      throw new Error('Invalid JSON');
    },
  };
  await vitality(unparseable as never, res as never);
  if (res.statusCode !== 400) {
    throw new Error(`expected 400 for an unusable body, got ${res.statusCode}`);
  }
  if ((res.payload as { detail?: string })?.detail === 'Invalid JSON') {
    throw new Error("leaked the provider's parse message to the client");
  }
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);


