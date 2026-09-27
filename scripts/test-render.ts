/**
 * Render smoke test.
 *
 * A passing build proves the auth page *compiles*, not that it runs: a bad
 * import, an undefined identifier or a bad hook order all typecheck and bundle
 * fine, then throw on first paint. Rendering it here catches that class of
 * failure without a browser, and asserts the security note is actually present
 * rather than quietly dropped in a refactor.
 *
 * Run: npx tsx scripts/test-render.ts
 */

import './test-localstorage-shim';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AuthPage } from '../src/components/ui/auth-page';
import { ProfileTab } from '../src/components/tabs/ProfileTab';
import { App } from '../src/App';
import type { UserAccount } from '../src/types';

let pass = 0;
let fail = 0;

async function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ok   ${name}`);
    pass++;
  } catch (err) {
    console.log(`  FAIL ${name}\n         ${err instanceof Error ? err.message : String(err)}`);
    fail++;
  }
}

function eq(actual: unknown, expected: unknown, what: string): void {
  if (actual !== expected) throw new Error(`${what}: expected ${expected}, got ${actual}`);
}

/**
 * Removes React's server-render text separators.
 *
 * renderToString emits `<!-- -->` between adjacent text expressions, so
 * `RANK {roman}` comes back as `RANK <!-- -->V`. That is an artefact of
 * string-matching server output -- a browser parses the comment away -- so
 * strip it before asserting on visible text.
 */
function visible(html: string): string {
  return html.replace(/<!--\s*-->/g, '');
}

/**
 * Visible text with markup removed.
 *
 * `visible()` only drops React's separators, so a label and the rank that
 * follows it can still be split by real elements -- the HUD renders each stat's
 * name and its band in separate tags. Assertions about two pieces of text being
 * adjacent need them flattened first.
 */
function flat(html: string): string {
  return visible(html)
    // A space, not '': adjacent text nodes are separated by markup, and joining
    // them would weld "ACADEMICS" and its rank into one unmatchable token.
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

console.log('\nauth page render');

await check('renders without throwing', () => {
  const html = renderToString(React.createElement(AuthPage));
  if (html.length < 500) throw new Error(`suspiciously short output: ${html.length} chars`);
});

await check('signed-out view offers the profile form', () => {
  const html = renderToString(React.createElement(AuthPage));
  for (const needle of [
    'Create your Nova profile',
    'Display name',
    'Email',
    'Create profile',
  ]) {
    if (!html.includes(needle)) throw new Error(`missing: ${needle}`);
  }
});

await check('does not render dead "Continue with" OAuth buttons', () => {
  // These had no provider behind them. Leaving them in would present a
  // sign-in option that silently does nothing.
  const html = renderToString(React.createElement(AuthPage));
  for (const needle of ['Continue with Google', 'Continue with Apple', 'Continue with GitHub']) {
    if (html.includes(needle)) throw new Error(`dead OAuth button still present: ${needle}`);
  }
});

await check('states the local-only limitation in place', () => {
  // Without this the form reads as a real account with a real gate in front.
  const html = renderToString(React.createElement(AuthPage));
  if (!html.includes('no password and no verification')) {
    throw new Error('security note missing');
  }
});

await check('the form is labelled for assistive tech', () => {
  const html = renderToString(React.createElement(AuthPage));
  if (!html.includes('for="nova-display-name"')) throw new Error('name input has no <label for>');
  if (!html.includes('for="nova-email"')) throw new Error('email input has no <label for>');
});

await check('inputs are typed and autocomplete-friendly', () => {
  // Matched case-insensitively: React 19's renderToString emits the attribute
  // as autoComplete rather than autocomplete. A real HTML parser lowercases
  // attribute names, so the browser sees the correct spelling -- this is an
  // artefact of string-matching server output, not a defect.
  const html = renderToString(React.createElement(AuthPage)).toLowerCase();
  if (!html.includes('autocomplete="email"')) throw new Error('email lacks autocomplete');
  if (!html.includes('autocomplete="name"')) throw new Error('name lacks autocomplete');
  if (!html.includes('type="email"')) throw new Error('email input is not type=email');
});

await check('an existing profile switches to the signed-in summary', () => {
  localStorage.setItem(
    'nova_profile',
    JSON.stringify({
      id: 'local_1',
      handle: 'anas',
      displayName: 'Anas B',
      email: 'anas@example.com',
      createdAt: new Date().toISOString(),
    })
  );
  const html = renderToString(React.createElement(AuthPage));
  if (!html.includes('Profile active')) throw new Error('did not switch to signed-in view');
  if (!html.includes('Anas B')) throw new Error('display name missing');
  if (html.includes('Create profile')) throw new Error('form still rendered while signed in');
  localStorage.clear();
});

await check('a corrupt profile record falls back to the form', () => {
  // The one path a browser screenshot would not have caught.
  localStorage.setItem('nova_profile', '{{{not json');
  const html = renderToString(React.createElement(AuthPage));
  if (!html.includes('Create your Nova profile')) {
    throw new Error('corrupt record did not fall back to the form');
  }
  localStorage.clear();
});

await check('the home link is present so the page is escapable', () => {
  const html = renderToString(React.createElement(AuthPage));
  if (!html.includes('href="/"')) throw new Error('no route back to the app');
});

console.log('\nprofile tab prop contract');

// ProfileTab used to recompute its own rank from totalXp, on a different
// threshold and with different title names than App.tsx, so the profile page
// could contradict the dashboard. It now takes both from App. These assertions
// pin that down: if the recomputation ever comes back, they fail.
const user: UserAccount = {
  id: 'local_1',
  handle: 'anas',
  displayName: 'Anas B',
  createdAt: '2026-01-15',
};

await check('renders with the current-name prop shape', () => {
  const html = renderToString(
    React.createElement(ProfileTab, {
      currentUser: user,
      stats: {},
      totalXp: 120,
      overallRank: 3,
      overallTitle: 'Architect of Self',
    })
  );
  if (html.length < 500) throw new Error('suspiciously short output');
});

await check('shows the rank and title it was given, not a recomputed one', () => {
  const html = visible(
    renderToString(
      React.createElement(ProfileTab, {
        currentUser: user,
        stats: {},
        totalXp: 0,
        // Rank 5 with a 0 XP total: only possible if the props are obeyed.
        overallRank: 5,
        overallTitle: 'Apex Transcendent',
      })
    )
  );
  if (!html.includes('Apex Transcendent')) throw new Error('overallTitle prop ignored');
  if (!html.includes('RANK V')) throw new Error('overallRank prop ignored');
});

await check('renders the account name and handle', () => {
  const html = visible(
    renderToString(
      React.createElement(ProfileTab, {
        currentUser: user,
        stats: {},
        totalXp: 10,
        overallRank: 1,
        overallTitle: 'Novice Seeker',
      })
    )
  );
  if (!html.includes('Anas B')) throw new Error('displayName missing');
  if (!html.includes('@anas')) throw new Error('handle missing');
});

console.log('\nstats do not survive a reload');

/** Every stat pushed far past Rank I, as a previous build would have left it. */
const EARNED_XP = { academics: 900, vitality: 900, culture: 900, social: 900 };

await check('a stored XP record is ignored and the HUD starts at Rank I', () => {
  // The demo's whole point is the rank-up animation, so XP and its history are
  // deliberately not persisted. A reload must land back at the baseline even
  // when localStorage still holds progress from an earlier visit -- otherwise
  // the first-time viewer and the returning one see different dashboards, and
  // the returning one never sees the radar grow.
  localStorage.setItem('nova_xp_map', JSON.stringify(EARNED_XP));
  localStorage.setItem('nova_xp_history', JSON.stringify({ academics: [0, 300, 900] }));
  localStorage.setItem('nova_state_version', '2');

  const html = visible(renderToString(React.createElement(App)));

  if (!html.includes('TOTAL XP: 0')) {
    const found = html.match(/TOTAL XP: [^<]*/)?.[0] ?? 'no total at all';
    throw new Error(`stored XP was honoured: ${found}`);
  }
  if (!/\bRANK I\b/.test(html)) throw new Error('overall rank is not I');
  if (/\bRANK (II|III|IV|V)\b/.test(html)) {
    throw new Error('a stat is showing above Rank I');
  }
  localStorage.clear();
});

await check('the baseline is Rank I across every stat', () => {
  localStorage.clear();
  const text = flat(renderToString(React.createElement(App)));
  for (const stat of ['ACADEMICS', 'VITALITY', 'CULTURE']) {
    // Each stat's band label follows its name, as "ACADEMICS I".
    if (!new RegExp(`${stat} I\\b`).test(text)) {
      throw new Error(`${stat} is not at Rank I`);
    }
  }
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
