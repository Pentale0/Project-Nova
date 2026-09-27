/**
 * Tests for the local profile store.
 *
 * The module under test touches localStorage, which Node does not have, so a
 * minimal in-memory stand-in is installed before it is imported. ESM hoists
 * imports, so the shim has to be attached via a side-effect import rather than
 * assigned in this file's body.
 *
 * Run: npx tsx scripts/test-profile.ts
 */

import './test-localstorage-shim';
import {
  buildProfile,
  clearProfile,
  initialsOf,
  loadProfile,
  saveProfile,
  slugify,
  validateProfile,
  PROFILE_LIMITS,
  type LocalProfile,
} from '../src/lib/profile';

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
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${what}: expected ${e}, got ${a}`);
}

function ok(value: unknown, what: string): void {
  if (!value) throw new Error(`${what}: expected truthy, got ${JSON.stringify(value)}`);
}

/**
 * Runs `fn` with console.warn muted.
 *
 * The failure paths under test deliberately log a warning, which is the right
 * behaviour but reads like a crash in the test output.
 */
function silenced<T>(fn: () => T): T {
  const original = console.warn;
  console.warn = () => {};
  try {
    return fn();
  } finally {
    console.warn = original;
  }
}

console.log('\nlocal profile store');

await check('slugify turns a plain name into a handle', () => {
  eq(slugify('Anas'), 'anas', 'simple');
  eq(slugify('Anas B.'), 'anas-b', 'punctuation');
  eq(slugify('  Ana  Maria  '), 'ana-maria', 'collapse whitespace');
});

await check('slugify strips accents instead of dropping the word', () => {
  eq(slugify('José García'), 'jose-garcia', 'accents');
});

await check('slugify falls back when the name has no ASCII word characters', () => {
  // An empty handle would render as a bare "@" in the UI, so there is a default.
  eq(slugify('محمد'), 'nova-user', 'arabic');
  eq(slugify('さくら'), 'nova-user', 'japanese');
  eq(slugify('!!!'), 'nova-user', 'symbols only');
});

await check('slugify never ends on a hyphen after truncating', () => {
  const long = 'a'.repeat(PROFILE_LIMITS.handleMax) + 'bbbbbbbb';
  const handle = slugify(long);
  ok(!handle.endsWith('-'), 'trailing hyphen');
  ok(handle.length <= PROFILE_LIMITS.handleMax, 'length cap');
});

await check('validateProfile rejects an empty name', () => {
  eq(validateProfile({ displayName: '   ', email: 'a@b.co' }), 'name-empty', 'blank');
});

await check('validateProfile rejects an over-long name', () => {
  const name = 'x'.repeat(PROFILE_LIMITS.nameMax + 1);
  eq(validateProfile({ displayName: name, email: 'a@b.co' }), 'name-too-long', 'long');
});

await check('validateProfile accepts a name exactly at the limit', () => {
  const name = 'x'.repeat(PROFILE_LIMITS.nameMax);
  eq(validateProfile({ displayName: name, email: 'a@b.co' }), null, 'at limit');
});

await check('validateProfile rejects malformed emails', () => {
  const bad = ['a@b', 'a b@c.co', 'no-at-sign.co', '@b.co', 'a@.co', 'a@b.'];
  for (const email of bad) {
    eq(validateProfile({ displayName: 'Anas', email }), 'email-invalid', email);
  }
});

await check('validateProfile accepts ordinary emails', () => {
  for (const email of ['a@b.co', 'anas.b@example.com', 'x+tag@mail.io']) {
    eq(validateProfile({ displayName: 'Anas', email }), null, email);
  }
});

await check('buildProfile trims, lowercases the email and derives a handle', () => {
  const p = buildProfile({ displayName: '  Anas B.  ', email: '  ANAS@Example.COM ' });
  eq(p.displayName, 'Anas B.', 'displayName');
  eq(p.email, 'anas@example.com', 'email');
  eq(p.handle, 'anas-b', 'handle');
  ok(p.id.startsWith('local_'), 'id prefix');
  ok(!Number.isNaN(Date.parse(p.createdAt)), 'createdAt is a date');
});

await check('two profiles built in the same millisecond get distinct ids', () => {
  // Two clicks in the same tick must not collapse into one record.
  const a = buildProfile({ displayName: 'A', email: 'a@b.co' });
  const b = buildProfile({ displayName: 'B', email: 'b@b.co' });
  ok(a.id !== b.id, `ids collided: ${a.id}`);
});

await check('loadProfile returns null before anything is saved', () => {
  localStorage.clear();
  eq(loadProfile(), null, 'empty store');
});

await check('saveProfile round-trips through loadProfile', () => {
  localStorage.clear();
  const original = buildProfile({ displayName: 'Anas', email: 'anas@example.com' });
  const saved = saveProfile(original);
  ok(saved, 'save returned a profile');
  eq(loadProfile(), saved, 'round trip');
});

await check('saveProfile also writes nova_user for the app to read', () => {
  // App.tsx renders from nova_user, so the mirror is what actually makes the
  // new name appear in the dashboard.
  localStorage.clear();
  saveProfile(buildProfile({ displayName: 'Anas', email: 'anas@example.com' }));
  const raw = localStorage.getItem('nova_user');
  ok(raw, 'nova_user was written');
  const parsed = JSON.parse(raw!);
  eq(parsed.displayName, 'Anas', 'displayName in nova_user');
  eq(parsed.email, undefined, 'email must not leak into nova_user');
});

await check('a hand-edited profile with missing fields is treated as absent', () => {
  // A truncated or hand-tampered value must not crash the app on load.
  localStorage.clear();
  localStorage.setItem('nova_profile', JSON.stringify({ id: 'x' }));
  eq(loadProfile(), null, 'partial record');

  localStorage.setItem('nova_profile', 'not json at all');
  eq(loadProfile(), null, 'unparseable record');
});

await check('a profile missing optional fields is repaired, not rejected', () => {
  // id/displayName/email are the load-bearing fields; handle and createdAt
  // are filled in so the UI never renders an empty "@" or "Invalid Date".
  localStorage.clear();
  localStorage.setItem(
    'nova_profile',
    JSON.stringify({ id: 'x', displayName: 'Anas', email: 'a@b.co' })
  );
  const p = loadProfile() as LocalProfile;
  eq(p.handle, 'nova-user', 'handle default');
  ok(!Number.isNaN(Date.parse(p.createdAt)), 'createdAt repaired');
});

await check('clearProfile removes both keys', () => {
  // Leaving nova_user behind would keep the old name on the dashboard after
  // signing out.
  localStorage.clear();
  saveProfile(buildProfile({ displayName: 'Anas', email: 'anas@example.com' }));
  clearProfile();
  eq(localStorage.getItem('nova_profile'), null, 'nova_profile');
  eq(localStorage.getItem('nova_user'), null, 'nova_user');
  eq(loadProfile(), null, 'loadProfile after clear');
});

await check('saveProfile reports failure when storage throws', () => {
  // Private browsing can reject writes; the UI must be able to tell the user
  // rather than appearing to succeed.
  localStorage.clear();
  const original = localStorage.setItem.bind(localStorage);
  localStorage.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  try {
    const result = silenced(() =>
      saveProfile(buildProfile({ displayName: 'Anas', email: 'a@b.co' }))
    );
    eq(result, null, 'saveProfile returns null on failure');
  } finally {
    localStorage.setItem = original;
  }
});

await check('clearProfile survives storage throwing', () => {
  localStorage.clear();
  saveProfile(buildProfile({ displayName: 'Anas', email: 'a@b.co' }));
  const original = localStorage.removeItem.bind(localStorage);
  localStorage.removeItem = () => {
    throw new Error('storage disabled');
  };
  try {
    silenced(clearProfile); // must not throw
  } finally {
    localStorage.removeItem = original;
  }
});

await check('initialsOf handles single, multiple and empty names', () => {
  eq(initialsOf('Anas'), 'AN', 'single name');
  eq(initialsOf('Ana Maria'), 'AM', 'two names');
  eq(initialsOf('Ana Maria Costa'), 'AC', 'three names');
  eq(initialsOf('   '), 'NV', 'blank falls back');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
