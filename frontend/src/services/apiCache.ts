// src/services/apiCache.ts

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Fetch with in-memory caching and configurable Time-To-Live (TTL).
 * @param key Unique key for the cache entry
 * @param fetcher Async function to fetch data if cache is missing or expired
 * @param ttlMs Time-to-live in milliseconds (default: 3 minutes)
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 3 * 60 * 1000
): Promise<T> {
  const now = Date.now();
  const existing = memoryCache.get(key);

  if (existing && existing.expiry > now) {
    return existing.data;
  }

  const data = await fetcher();

  // Only cache non-null, non-undefined, and valid data
  if (data !== null && data !== undefined) {
    memoryCache.set(key, {
      data,
      expiry: now + ttlMs,
    });
  }

  return data;
}

/**
 * Invalidate specific cache entries by prefix, regex, or clear everything.
 */
export function invalidateCache(pattern?: string | RegExp): void {
  if (!pattern) {
    memoryCache.clear();
    return;
  }

  for (const key of memoryCache.keys()) {
    if (typeof pattern === 'string') {
      if (key.startsWith(pattern)) {
        memoryCache.delete(key);
      }
    } else if (pattern.test(key)) {
      memoryCache.delete(key);
    }
  }
}
