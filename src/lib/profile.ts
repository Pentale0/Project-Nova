/**
 * Local profile store.
 *
 * SCOPE AND LIMITS -- read this before treating this as authentication.
 *
 * There is no server, no password and no verification here. A profile is a
 * display name and an email written to this browser's localStorage. That is
 * enough to personalise the app, and nothing more: anyone with access to the
 * device can read the record, edit it, or delete it, and clearing site data
 * removes it permanently. It is a label on your progress, not an account.
 *
 * Two keys are used deliberately:
 *
 *   nova_profile - the record this module owns, including the email. Its
 *                  presence is the signal that a profile was deliberately
 *                  created, which is what the auth page keys off.
 *   nova_user    - the narrower UserAccount shape App.tsx already reads, so
 *                  the name set here shows up in the app.
 *
 * `nova_user` alone cannot be that signal: App.tsx writes its DEFAULT_USER on
 * first run, so the key exists for anyone who has merely opened the app. Using
 * it to decide "signed in" would report everyone as signed in.
 */

import type { UserAccount } from '../types';

const PROFILE_KEY = 'nova_profile';
/** Kept in sync with App.tsx, which reads this key for the account shell. */
const USER_KEY = 'nova_user';

export interface LocalProfile extends UserAccount {
  email: string;
}

/** Practical rather than exhaustive: rejects the shapes that break the UI. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ProfileError =
  | 'name-empty'
  | 'name-too-long'
  | 'email-invalid'
  | 'storage-unavailable';

export const PROFILE_LIMITS = {
  nameMax: 40,
  handleMax: 24,
} as const;

/**
 * URL-safe slug for the handle field.
 *
 * Falls back to a generic handle when the input has no ASCII word characters
 * (e.g. an Arabic or Japanese display name), because an empty handle would show
 * up as a broken `@` in the UI.
 */
export function slugify(input: string): string {
  const slug = input
    .normalize('NFKD')
    // Strip combining marks so "José" becomes "jose" rather than "jos".
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, PROFILE_LIMITS.handleMax)
    .replace(/-+$/g, '');

  return slug || 'nova-user';
}

export function validateProfile(input: {
  displayName: string;
  email: string;
}): ProfileError | null {
  const name = input.displayName.trim();
  if (!name) return 'name-empty';
  if (name.length > PROFILE_LIMITS.nameMax) return 'name-too-long';
  if (!EMAIL_PATTERN.test(input.email.trim())) return 'email-invalid';
  return null;
}

/** Turns a slug into something a user can plausibly own, not a bare slug. */
function makeId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `local_${Date.now().toString(36)}_${random}`;
}

export function buildProfile(input: {
  displayName: string;
  email: string;
}): LocalProfile {
  return {
    id: makeId(),
    handle: slugify(input.displayName),
    displayName: input.displayName.trim(),
    email: input.email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  };
}

/** Persists both keys. Returns the profile, or null if storage rejected it. */
export function saveProfile(profile: LocalProfile): LocalProfile | null {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    // Mirrored so App.tsx picks up the new name on its next read.
    localStorage.setItem(USER_KEY, JSON.stringify(stripEmail(profile)));
    return profile;
  } catch (err) {
    // Private-browsing quota errors and disabled storage both land here.
    console.warn('[nova:profile] could not persist profile:', err);
    return null;
  }
}

function stripEmail(profile: LocalProfile): UserAccount {
  const { id, handle, displayName, createdAt } = profile;
  return { id, handle, displayName, createdAt };
}

/**
 * Reads the profile, treating anything malformed as absent.
 *
 * A hand-edited or truncated value must not crash the app on load, so parse
 * failures resolve to null rather than propagating.
 */
export function loadProfile(): LocalProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<LocalProfile>;
    if (
      typeof parsed?.id !== 'string' ||
      typeof parsed.displayName !== 'string' ||
      typeof parsed.email !== 'string'
    ) {
      return null;
    }

    return {
      id: parsed.id,
      handle: typeof parsed.handle === 'string' ? parsed.handle : 'nova-user',
      displayName: parsed.displayName,
      email: parsed.email,
      createdAt:
        typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
    // Cleared too, so a sign-out actually returns the app to its default
    // identity instead of leaving the previous name behind.
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.warn('[nova:profile] could not clear profile:', err);
  }
}

/** Initials for the avatar chip, e.g. "Anas B" -> "AB". */
export function initialsOf(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'NV';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
