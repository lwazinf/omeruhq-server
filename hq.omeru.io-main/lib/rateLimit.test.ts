import { isRateLimited, clientIp } from './rateLimit';

describe('isRateLimited', () => {
  const KEY = () => `test:${Math.random().toString(36).slice(2)}`;

  it('allows first request', () => {
    expect(isRateLimited(KEY(), 5, 60_000)).toBe(false);
  });

  it('counts up to max without blocking', () => {
    const k = KEY();
    for (let i = 0; i < 5; i++) {
      expect(isRateLimited(k, 5, 60_000)).toBe(false);
    }
  });

  it('blocks after limit is reached', () => {
    const k = KEY();
    for (let i = 0; i < 5; i++) isRateLimited(k, 5, 60_000);
    expect(isRateLimited(k, 5, 60_000)).toBe(true);
  });

  it('resets after window expires', async () => {
    const k = KEY();
    isRateLimited(k, 1, 1);
    await new Promise(r => setTimeout(r, 5));
    expect(isRateLimited(k, 1, 1)).toBe(false);
  });

  it('tracks keys independently', () => {
    const k1 = KEY();
    const k2 = KEY();
    for (let i = 0; i < 3; i++) isRateLimited(k1, 3, 60_000);
    expect(isRateLimited(k1, 3, 60_000)).toBe(true);
    expect(isRateLimited(k2, 3, 60_000)).toBe(false);
  });
});

describe('clientIp', () => {
  const h = (val: string | null) => ({
    get: (key: string) => key === 'x-forwarded-for' ? val : null,
  } as unknown as Headers);

  it('extracts first IP from x-forwarded-for', () => {
    expect(clientIp(h('1.2.3.4, 5.6.7.8'))).toBe('1.2.3.4');
  });

  it('handles single IP', () => {
    expect(clientIp(h('10.0.0.1'))).toBe('10.0.0.1');
  });

  it('returns "unknown" when header is missing', () => {
    expect(clientIp(h(null))).toBe('unknown');
  });
});
