// In-memory sliding-window rate limiter — resets on server restart.
// Fine for single-instance Next.js deployments; swap for Redis/Upstash if you scale horizontally.

interface Entry { count: number; resetAt: number }
const store = new Map<string, Entry>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store.entries()) if (v.resetAt <= now) store.delete(k);
}, 5 * 60 * 1000).unref();

export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= max) return true;
  entry.count++;
  return false;
}

/** Extract the real client IP from a NextRequest */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  return (forwarded ? forwarded.split(',')[0] : '').trim() || 'unknown';
}
