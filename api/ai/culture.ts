/**
 * Recommends titles for a Top 10 list, grounded in verified metadata for what the user logged.
 *
 * Vercel serverless function. Thin by design: the behaviour lives in
 * server/handlers.ts, shared with the local Express dev server.
 */

import { createHandler } from '../_adapter';
import { culture } from '../../server/handlers';

export default createHandler(culture);
