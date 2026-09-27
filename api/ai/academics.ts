/**
 * Turns a pasted study resource into summary notes, a concept diagram and grounded quizzes.
 *
 * Vercel serverless function. Thin by design: the behaviour lives in
 * server/handlers.ts, shared with the local Express dev server.
 */

import { createHandler } from '../../server/adapter.js';
import { academics } from '../../server/handlers.js';

export default createHandler(academics);


