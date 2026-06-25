'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Forward to Sentry if initialised via instrumentation.ts
    if (typeof window !== 'undefined' && (window as any).__SENTRY__ && error) {
      import('@sentry/nextjs').then(({ captureException }) => captureException(error)).catch(() => {});
    }
    console.error('[app-error]', error);
  }, [error]);

  return (
    <div style={{ background: 'var(--off-white)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="noise" />
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(64px,12vw,96px)', fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 0 }}>
          500
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: 'var(--black)', letterSpacing: '-0.02em', marginBottom: 12, marginTop: 8 }}>
          Something went wrong
        </p>
        <p style={{ fontSize: 15, color: 'var(--mid-gray)', fontWeight: 300, lineHeight: 1.7, marginBottom: 36 }}>
          An unexpected error occurred. The team has been notified — please try again.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            className="btn-lime"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            Try again
          </button>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', padding: '12px 22px', borderRadius: 100, border: '1.5px solid rgba(0,0,0,0.15)', color: 'var(--dark-gray)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            Go home
          </Link>
        </div>
        {error.digest && (
          <p style={{ marginTop: 24, fontSize: 11, color: 'var(--mid-gray)', fontFamily: 'monospace' }}>
            ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
