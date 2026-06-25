import Redis from 'ioredis';

interface Entry { count: number; resetAt: number }
const memStore = new Map<string, Entry>();

// Periodic sweep of expired in-memory entries
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memStore.entries()) {
        if (entry.resetAt <= now) memStore.delete(key);
    }
}, 5 * 60 * 1000).unref();

// Redis client — only created when REDIS_URL is set in env
let redis: Redis | null = null;
if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
    });
    redis.on('error', (err: Error) => {
        console.warn('[rateLimit] Redis error — falling back to in-memory:', err.message);
    });
}

function memIsRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = memStore.get(key);
    if (!entry || entry.resetAt <= now) {
        memStore.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }
    if (entry.count >= maxRequests) return true;
    entry.count++;
    return false;
}

/**
 * Returns true if the key has exceeded maxRequests within windowMs.
 * Uses Redis (atomic INCR + PEXPIRE) when REDIS_URL is configured;
 * falls back to an in-memory sliding-window store for single-instance deployments.
 */
export async function isRateLimited(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
    if (redis) {
        try {
            const count = await redis.incr(key);
            if (count === 1) await redis.pexpire(key, windowMs);
            return count > maxRequests;
        } catch {
            // Redis unavailable — fall through to in-memory
        }
    }
    return memIsRateLimited(key, maxRequests, windowMs);
}
