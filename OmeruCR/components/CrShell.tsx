'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/broadcast', label: 'Broadcast' },
  { href: '/fraud', label: 'Fraud' },
  { href: '/operators', label: 'Operators' },
  { href: '/audit', label: 'Audit trail' },
];

export default function CrShell({
  name,
  isRoot,
  mode,
  children,
}: {
  name: string;
  isRoot: boolean;
  mode?: 'DEMO' | 'LIVE';
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, padding: '14px clamp(16px, 3vw, 32px)',
          borderBottom: '1px solid var(--line)', flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16, letterSpacing: '-0.01em' }}>
            OMERU<span style={{ color: 'var(--lime)' }}> CR</span>
          </span>
          {mode && (
            <span
              className={mode === 'DEMO' ? 'cr-chip' : 'cr-chip cr-chip-ok'}
              title="Platform mode — visible only inside the Control Room"
            >
              {mode === 'DEMO' ? 'demo mode' : 'live'}
            </span>
          )}
          <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }} aria-label="Control Room">
            {NAV.map((n) => {
              const active = pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  style={{
                    padding: '7px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                    textDecoration: 'none',
                    color: active ? '#0a0a0a' : 'var(--text-2)',
                    background: active ? 'var(--lime)' : 'transparent',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
            {name} {isRoot && <span className="cr-chip" style={{ marginLeft: 6 }}>root</span>}
          </span>
          <button className="cr-btn cr-btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }} onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      <main style={{ flex: 1, padding: 'clamp(20px, 3.5vw, 40px)', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
