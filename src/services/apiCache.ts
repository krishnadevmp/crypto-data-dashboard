/**
 * Simple in-memory cache with optional TTL (time-to-live).
 *
 * Used to prevent redundant REST API calls when the user re-selects
 * a crypto pair whose data has already been fetched this session.
 */

interface CacheEntry<T> {
  data: T;
  /** Timestamp (ms) when this entry was stored */
  storedAt: number;
}

export interface Cache<T> {
  /** Store a value under `key`. */
  set: (key: string, data: T) => void;
  /**
   * Retrieve a cached value.
   * Returns `undefined` when the key is missing or the entry has expired.
   */
  get: (key: string) => T | undefined;
  /** Check whether a fresh value exists for `key`. */
  has: (key: string) => boolean;
  /** Manually invalidate a single key. */
  delete: (key: string) => void;
  /** Clear the entire cache. */
  clear: () => void;
}

/**
 * Creates an in-memory cache.
 *
 * @param ttlMs  How long (ms) a cached value is considered fresh.
 *               Defaults to Infinity (never expires within a session).
 */
export function createCache<T>(ttlMs: number = Infinity): Cache<T> {
  const store = new Map<string, CacheEntry<T>>();

  const get = (key: string): T | undefined => {
    const entry = store.get(key);
    if (!entry) return undefined;

    const isExpired = Date.now() - entry.storedAt > ttlMs;
    if (isExpired) {
      store.delete(key);
      return undefined;
    }

    return entry.data;
  };

  const set = (key: string, data: T): void => {
    store.set(key, { data, storedAt: Date.now() });
  };

  const has = (key: string): boolean => get(key) !== undefined;

  const deleteKey = (key: string): void => {
    store.delete(key);
  };

  const clear = (): void => {
    store.clear();
  };

  return { get, set, has, delete: deleteKey, clear };
}
