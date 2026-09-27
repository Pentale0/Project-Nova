import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Lazy-loaded on purpose.
 *
 * The auth page pulls in framer-motion, which adds ~170 kB. Importing it eagerly
 * would put that cost in the main chunk and charge it to every visitor, even
 * the 99% who land on `/` and never see this screen. Code-splitting keeps the
 * animation library in a chunk fetched only when `/auth` is actually requested.
 */
const AuthDemo = lazy(() => import('./pages/auth'));

/**
 * Single-path routing.
 *
 * The app has no router, and adding react-router for one static screen would be
 * a lot of machinery for the job. `dark` is set in index.html rather than here
 * so it is applied before first paint, avoiding a flash of unstyled content.
 */
const isAuthRoute = window.location.pathname.replace(/\/+$/, '') === '/auth';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAuthRoute ? (
      <Suspense fallback={<div className="min-h-screen bg-[#001740]" />}>
        <AuthDemo />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
