// api/_lib/cache.ts

/**
 * In-memory LRU cache with TTL.
 *
 * Notes on Vercel serverless:
 * - This cache lives in the warm function instance's memory.
 * - It is NOT shared across cold starts or across regions.
 * - For wide caching, rely on the Cache-Control headers we set on responses
 *   (Vercel's edge cache). This in-memory layer is a best-effort burst buffer
 *   that protects upstream APIs during traffic spikes within a single warm
 *   instance.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface LRUCache<T = unknown> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttlSeconds: number): void;
  delete(key: string): boolean;
  clear(): void;
  size(): number;
}

export function createCache<T = unknown>(maxSize = 200): LRUCache<T> {
  const store = new Map<string, CacheEntry<T>>();

  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt < Date.now()) {
        store.delete(key);
        return undefined;
      }
      // Touch: move to end of insertion order to mark "recently used".
      store.delete(key);
      store.set(key, entry);
      return entry.value;
    },

    set(key, value, ttlSeconds) {
      if (!store.has(key) && store.size >= maxSize) {
        // Evict oldest (first insertion-ordered key).
        const oldest = store.keys().next().value;
        if (oldest !== undefined) store.delete(oldest);
      } else {
        // If key exists, delete first so re-set lands at end of order.
        store.delete(key);
      }
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    },

    delete(key) {
      return store.delete(key);
    },

    clear() {
      store.clear();
    },

    size() {
      return store.size;
    },
  };
}

/**
 * Module-scoped shared cache for the warm function instance.
 * All proxy routes import this same instance, so a price fetched by one
 * route can satisfy a subsequent request from another within the TTL.
 */
export const sharedCache: LRUCache = createCache(300);