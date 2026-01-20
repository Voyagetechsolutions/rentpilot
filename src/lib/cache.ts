// Simple in-memory cache for API responses
// For production, consider using Redis or a similar solution

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

interface CacheOptions {
    ttlSeconds?: number;  // Time to live in seconds
    keyPrefix?: string;   // Prefix for cache keys
}

const defaultOptions: CacheOptions = {
    ttlSeconds: 60,  // 1 minute default
    keyPrefix: '',
};

export function getCached<T>(key: string, options: CacheOptions = {}): T | null {
    const opts = { ...defaultOptions, ...options };
    const fullKey = opts.keyPrefix ? `${opts.keyPrefix}:${key}` : key;

    const entry = cache.get(fullKey) as CacheEntry<T> | undefined;

    if (!entry) {
        return null;
    }

    if (Date.now() > entry.expiresAt) {
        cache.delete(fullKey);
        return null;
    }

    return entry.data;
}

export function setCache<T>(key: string, data: T, options: CacheOptions = {}): void {
    const opts = { ...defaultOptions, ...options };
    const fullKey = opts.keyPrefix ? `${opts.keyPrefix}:${key}` : key;
    const ttl = opts.ttlSeconds || 60;

    cache.set(fullKey, {
        data,
        expiresAt: Date.now() + (ttl * 1000),
    });
}

export function invalidateCache(pattern: string): void {
    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key);
        }
    }
}

export function clearCache(): void {
    cache.clear();
}

// Helper function for caching API responses
export async function withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    const cached = getCached<T>(key, options);
    if (cached !== null) {
        return cached;
    }

    const data = await fetcher();
    setCache(key, data, options);
    return data;
}

// Clean up expired entries periodically
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of cache.entries()) {
            if (now > entry.expiresAt) {
                cache.delete(key);
            }
        }
    }, 60 * 1000); // Clean every minute
}
