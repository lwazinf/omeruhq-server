// Unit tests for the in-memory rate limiter fallback.
// Redis path is integration-tested against a live instance in CI; not tested here.

// Prevent ioredis from attempting a real connection during tests
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    incr: jest.fn().mockResolvedValue(1),
    pexpire: jest.fn().mockResolvedValue(1),
  }));
});

// Must be imported AFTER the mock
import { isRateLimited } from './rateLimit';

describe('isRateLimited (in-memory fallback)', () => {
  const KEY = () => `test:${Math.random().toString(36).slice(2)}`;

  it('allows first request', async () => {
    expect(await isRateLimited(KEY(), 5, 60_000)).toBe(false);
  });

  it('counts up to max without blocking', async () => {
    const k = KEY();
    for (let i = 0; i < 5; i++) {
      expect(await isRateLimited(k, 5, 60_000)).toBe(false);
    }
  });

  it('blocks the request that exceeds max', async () => {
    const k = KEY();
    for (let i = 0; i < 5; i++) await isRateLimited(k, 5, 60_000);
    expect(await isRateLimited(k, 5, 60_000)).toBe(true);
  });

  it('allows requests after the window expires', async () => {
    const k = KEY();
    // Fill the 1-request window with a 1ms window so it expires immediately
    await isRateLimited(k, 1, 1);
    await new Promise(r => setTimeout(r, 5));
    expect(await isRateLimited(k, 1, 1)).toBe(false);
  });

  it('tracks different keys independently', async () => {
    const k1 = KEY();
    const k2 = KEY();
    for (let i = 0; i < 3; i++) await isRateLimited(k1, 3, 60_000);
    expect(await isRateLimited(k1, 3, 60_000)).toBe(true);
    expect(await isRateLimited(k2, 3, 60_000)).toBe(false);
  });
});
