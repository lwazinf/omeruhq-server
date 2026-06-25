import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ background: 'var(--off-white)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="noise" />
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(64px,12vw,96px)', fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 0 }}>
          404
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: 'var(--black)', letterSpacing: '-0.02em', marginBottom: 12, marginTop: 8 }}>
          Page not found
        </p>
        <p style={{ fontSize: 15, color: 'var(--mid-gray)', fontWeight: 300, lineHeight: 1.7, marginBottom: 36 }}>
          This page doesn&apos;t exist. If you were looking for a store, try browsing all merchants.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/stores" className="btn-lime">Browse stores →</Link>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', padding: '12px 22px', borderRadius: 100, border: '1.5px solid rgba(0,0,0,0.15)', color: 'var(--dark-gray)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
