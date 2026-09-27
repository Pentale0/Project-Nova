/**
 * Reports which AI provider and model are active, and whether a key is configured.
 *
 * Vercel serverless function. Thin by design: the behaviour lives in
 * server/handlers.ts, shared with the local Express dev server.
 */

import { createHandler } from './_adapter';
import { health } from '../server/handlers';

export default createHandler(health);
