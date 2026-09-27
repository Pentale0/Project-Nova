/**
 * Minimal localStorage for Node.
 *
 * The profile store is browser code, so its tests need somewhere to write. This
 * is a bare in-memory Map with the real Storage surface -- plus the ability to
 * be made to throw, which is how the private-browsing path gets exercised.
 *
 * Imported for side effects only, and only from test files.
 */

const store = new Map<string, string>();

const shim: Storage = {
  get length() {
    return store.size;
  },
  key(index: number): string | null {
    return Array.from(store.keys())[index] ?? null;
  },
  getItem(key: string): string | null {
    return store.has(key) ? store.get(key)! : null;
  },
  setItem(key: string, value: string): void {
    store.set(String(key), String(value));
  },
  removeItem(key: string): void {
    store.delete(key);
  },
  clear(): void {
    store.clear();
  },
};

(globalThis as { localStorage?: Storage }).localStorage = shim;

export {};
