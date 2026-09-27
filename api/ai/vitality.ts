/**
 * Produces a training / sleep / recovery protocol from a free-text query.
 *
 * Vercel serverless function. Thin by design: the behaviour lives in
 * server/handlers.ts, shared with the local Express dev server.
 */

import { createHandler } from '../../server/adapter.js';
import { vitality } from '../../server/handlers.js';

export default createHandler(vitality);


