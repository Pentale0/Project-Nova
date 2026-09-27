/**
 * Adapter between Vercel's Node request/response objects and the plain
 * `{ status, body }` contract the handlers in ./handlers.ts speak.
 *
 * Deliberately NOT in api/. Vercel treats any file in api/ as a function
 * endpoint and excludes paths beginning with an underscore, so a shared helper
 * called `_adapter.ts` there is silently dropped from the upload -- the build
 * succeeds and every function then dies at runtime with
 * ERR_MODULE_NOT_FOUND. Keeping it in server/ leaves api/ holding nothing but
 * entry points.
 */

import { toHttpError, type Handler, type RequestContext } from './http.js';

// Vercel types live in @vercel/node, which isn't installed -- the runtime passes
// plain IncomingMessage/ServerResponse objects. Declaring the minimum we use
// keeps the dependency (and its install scripts) out of the project.
interface VercelLikeRequest {
  method?: string;
  url?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface VercelLikeResponse {
  status(code: number): VercelLikeResponse;
  json(payload: unknown): unknown;
  setHeader?(name: string, value: string): unknown;
}

export function createHandler(handler: Handler) {
  return async (req: VercelLikeRequest, res: VercelLikeResponse): Promise<void> => {
    try {
      const ctx: RequestContext = {
        method: req.method ?? 'GET',
        // Vercel only populates `query` on GET; for POSTs it is empty, so fall
        // back to parsing the URL to keep behaviour identical across adapters.
        query: req.query ?? parseQuery(req.url),
        body: readBody(req),
      };

      const result = await handler(ctx);
      res.status(result.status).json(result.body);
    } catch (err) {
      const mapped = toHttpError(err);
      res.status(mapped.status).json(mapped.body);
    }
  };
}

/**
 * Reads the request body once, defensively.
 *
 * `req.body` is a getter on Vercel's Node shim, not a plain property: it parses
 * the request on access and throws `Error: Invalid JSON` when the payload is not
 * parseable. Express hides this entirely, because body-parser assigns a plain
 * cached value, so the dev server and the test suite both pass against a
 * deployment that returns 500 for every POST.
 *
 * Two things follow. Read it into a local rather than referencing it twice, so
 * the result cannot depend on the getter being re-entrant. And swallow a throw
 * as "no usable body", which routes naturally to the handler's own 400
 * ("query is required") instead of surfacing an opaque 500 whose only clue is
 * the word "Invalid JSON" -- a message that tells the caller nothing about what
 * was actually wrong with their request.
 */
function readBody(req: VercelLikeRequest): Record<string, unknown> {
  let raw: unknown;
  try {
    raw = req.body;
  } catch {
    return {};
  }
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function parseQuery(url?: string): Record<string, string | string[] | undefined> {
  if (!url) return {};
  const search = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  if (!search) return {};

  const out: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of new URLSearchParams(search)) {
    const existing = out[key];
    if (existing === undefined) out[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else out[key] = [existing, value];
  }
  return out;
}

