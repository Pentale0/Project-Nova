/**
 * Adapter between Vercel's Node request/response objects and the plain
 * `{ status, body }` contract the handlers in server/handlers.ts speak.
 *
 * Kept separate from the handlers so that not one line of business logic is
 * duplicated between dev (Express) and production (Vercel).
 */

import {
  toHttpError,
  type Handler,
  type RequestContext,
} from '../server/http';

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
        body:
          req.body && typeof req.body === 'object'
            ? (req.body as Record<string, unknown>)
            : {},
      };

      const result = await handler(ctx);
      res.status(result.status).json(result.body);
    } catch (err) {
      const mapped = toHttpError(err);
      res.status(mapped.status).json(mapped.body);
    }
  };
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
