/**
 * PROJECT NOVA API — local development server.
 *
 * The browser never sees a model API key. Vite dev-proxies /api to this server
 * (see vite.config.ts), so the React app can call same-origin paths.
 *
 * In production this file is *not* used. Vercel is serverless, so a persistent
 * Express process on :8787 does not exist there; the same handlers are served by
 * the functions in api/*.ts instead. Both adapters are thin -- the behaviour
 * lives in server/handlers.ts and server/http.ts so the two can't drift.
 *
 * Backends are selected in server/provider.ts: OpenRouter if
 * OPENROUTER_API_KEY is set, otherwise Google Gemini.
 *
 * Run with: npm run dev:ai
 */

import 'dotenv/config';
import express from 'express';
import * as handlers from './handlers';
import { toHttpError, type RequestContext, type Handler } from './http';
import { getProvider } from './provider';

const PORT = Number(process.env.PORT ?? 8787);

const app = express();
// Generous cap: prompts carry whole syllabus documents.
app.use(express.json({ limit: '2mb' }));

/**
 * Wraps a handler so thrown errors become JSON responses instead of crashes.
 * Express 5 requires handlers to resolve to void, hence the loose return type.
 */
function route(handler: Handler) {
  return (req: express.Request, res: express.Response) => {
    const ctx: RequestContext = {
      method: req.method,
      query: req.query as RequestContext['query'],
      body: (req.body ?? {}) as Record<string, unknown>,
    };

    handler(ctx)
      .then((result) => res.status(result.status).json(result.body))
      .catch((err) => {
        if (res.headersSent) return;
        const mapped = toHttpError(err);
        res.status(mapped.status).json(mapped.body);
      });
  };
}

app.post('/api/ai/academics', route(handlers.academics));
app.post('/api/ai/vitality', route(handlers.vitality));
app.post('/api/ai/culture', route(handlers.culture));
app.get('/api/search', route(handlers.search));
app.get('/api/health', route(handlers.health));

app.listen(PORT, () => {
  const provider = getProvider();
  console.log(`[nova:ai] listening on http://localhost:${PORT}`);
  console.log(`[nova:ai] provider: ${provider.name}`);
  console.log(`[nova:ai] model: ${provider.model}`);
  if (!provider.configured) {
    console.warn(
      '[nova:ai] No AI key set - AI routes will return 503 until you add OPENROUTER_API_KEY (or GEMINI_API_KEY) to .env.'
    );
  }
});
