/**
 * Live title lookup across AniList, Cinemeta, TVmaze, Steam and Open Library. No key required.
 *
 * Vercel serverless function. Thin by design: the behaviour lives in
 * server/handlers.ts, shared with the local Express dev server.
 */

import { createHandler } from '../server/adapter.js';
import { search } from '../server/handlers.js';

export default createHandler(search);


