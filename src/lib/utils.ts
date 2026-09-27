import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * The one helper every shadcn component imports.
 *
 * `clsx` flattens conditional class values (arrays, objects, falsy values) into
 * a single string. `twMerge` then resolves Tailwind conflicts in that string,
 * keeping the *last* class when two utilities target the same CSS property --
 * so a caller's `className` always beats a component's built-in default.
 *
 * That ordering is the whole reason this exists. Without twMerge, passing
 * `className="px-6"` to a component that already sets `px-4` leaves both in the
 * output, and the winner is decided by stylesheet order rather than by your
 * intent, which makes overrides silently unreliable.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
