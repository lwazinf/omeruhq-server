'use client';

import { openInviteModal } from '@/components/InviteModal';
import Link from 'next/link';

/* ── Icons ── */
const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const FEATURES = [
  {
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    label: 'Orders',
    desc: 'Kanban board for every incoming order. Accept, mark ready, complete — all in one view.',
  },
  {
    icon: 'M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m8 4l8-4M4 7l8 4',
    label: 'Products',
    desc: 'Add products with photos, prices, variants and categories. Publish or archive in seconds.',
  },
  {
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    label: 'Bookings',
    desc: 'Full service booking engine with a 7-day diary, slot generation, and auto-reminders.',
  },
  {
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    label: 'Analytics',
    desc: 'Revenue, order counts, peak hours, and top-selling products — updated in real time.',
  },
  {
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    label: 'Team',
    desc: 'Invite co-owners and staff to manage your store. Role-based access keeps things clean.',
  },
  {
    icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
    label: 'Broadcasts',
    desc: 'Send a WhatsApp message to all opted-in customers at once. No third-party tools needed.',
  },
];

const STATS = [
  { value: '7%', label: 'Platform fee — only on completed orders' },
  { value: '0', label: 'App downloads required for your customers' },
  { value: '6', label: 'Steps to go live from first invite' },
  { value: '24h', label: 'Typical time from invite to first order' },
];

/* ── WhatsApp chat mock ── */
function ChatMock() {
  return (
    <div style={{
      background: '#1a1a18',
      borderRadius: 20,
      padding: '16px',
      width: '100%',
      maxWidth: 300,
      border: '1px solid rgba(255,255,255,0.08)',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--black)' }}>O</span>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Omeru Bot</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>WhatsApp Business</p>
        </div>
        <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#25d366' }} />
      </div>

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px 12px 12px 4px', padding: '9px 12px', maxWidth: '85%' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
            🛍️ <strong style={{ color: 'white' }}>New order #A3F2</strong><br />
            Spicy Chicken Wrap × 2<br />
            <span style={{ color: 'var(--lime)' }}>R89.00 — Paid via EFT</span>
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, textAlign: 'right' }}>09:14</p>
        </div>

        <div style={{ background: 'rgba(200,241,53,0.12)', borderRadius: '12px 12px 4px 12px', padding: '9px 12px', maxWidth: '85%', alignSelf: 'flex-end', border: '1px solid rgba(200,241,53,0.15)' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
            ✅ Order marked <strong style={{ color: 'var(--lime)' }}>Ready</strong>
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, textAlign: 'right' }}>09:17 ✓✓</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px 12px 12px 4px', padding: '9px 12px', maxWidth: '85%' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
            ⭐⭐⭐⭐⭐<br />
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>"Always fresh, fast delivery!"</span>
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, textAlign: 'right' }}>09:42</p>
        </div>
      </div>

      {/* Input bar mock */}
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '7px 12px' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Type a message…</p>
        </div>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function LandingPage() {
  return (
    <div style={{ overflowX: 'hidden' }}>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 5vw, 52px)',
        height: 64,
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M3 9C3 5.686 5.686 3 9 3s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" fill="var(--lime)" />
              <path d="M9 6v6M6 9h6" stroke="rgba(0,0,0,0.5)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'white', letterSpacing: '-0.01em' }}>
            omeru <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>hq</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={openInviteModal}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)', padding: '8px 12px', borderRadius: 8, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          >
            Apply
          </button>
          <Link href="/login" className="btn-lime" style={{ padding: '9px 20px', fontSize: 13 }}>
            Log in →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        background: 'var(--black)',
        minHeight: '100vh',
        paddingTop: 'clamp(100px, 16vh, 140px)',
        paddingBottom: 'clamp(64px, 10vh, 100px)',
        paddingLeft: 'clamp(20px, 5vw, 52px)',
        paddingRight: 'clamp(20px, 5vw, 52px)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: '40%', height: '60%', background: 'radial-gradient(ellipse at center, rgba(200,241,53,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '35%', height: '60%', background: 'radial-gradient(ellipse at center, rgba(200,241,53,0.03) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div className="hero-inner" style={{ width: '100%', maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: 64, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          {/* Left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 100, border: '1px solid rgba(200,241,53,0.25)', marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)' }} />
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--lime)' }}>Merchant Portal</span>
            </div>

            <h1 className="display-lg hero-h1" style={{ color: 'white', marginBottom: 24, wordBreak: 'break-word' }}>
              Run your entire<br />
              <span style={{ color: 'var(--lime)' }}>WhatsApp store</span><br />
              from one place.
            </h1>

            <p style={{ fontSize: 'clamp(14px, 1.5vw, 17px)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, maxWidth: 480, marginBottom: 36, fontWeight: 300, wordBreak: 'break-word' }}>
              Omeru HQ is the command centre for your Omeru store — manage orders, products, bookings, your team, and more. Invite only.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={openInviteModal} className="btn-lime" style={{ padding: '14px 28px', fontSize: 15 }}>
                Apply for access
              </button>
              <Link href="/login" className="btn-outline" style={{ padding: '13px 26px', fontSize: 15, color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.15)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'white'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
              >
                Log in →
              </Link>
            </div>

            {/* Trust line */}
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 24, fontWeight: 300 }}>
              Invite only · South African merchants · Powered by WhatsApp
            </p>
          </div>

          {/* Right: chat mock */}
          <div className="hero-chat">
            <ChatMock />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{
        background: 'var(--off-white)',
        padding: 'clamp(64px, 10vh, 100px) clamp(20px, 5vw, 52px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)' }}>Everything in one dashboard</span>
            <h2 className="display-md" style={{ marginTop: 12, color: 'var(--black)', wordBreak: 'break-word' }}>
              Built for how SA merchants actually work.
            </h2>
          </div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {FEATURES.map((f) => (
              <div key={f.label} className="card" style={{ padding: '24px', borderRadius: 18, background: 'white' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--lime)' }}>
                  <Icon d={f.icon} size={18} />
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--black)', marginBottom: 8, letterSpacing: '-0.01em' }}>{f.label}</p>
                <p style={{ fontSize: 13, color: 'var(--mid-gray)', lineHeight: 1.7, fontWeight: 300 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ background: 'var(--dark-gray)', padding: 'clamp(48px, 8vh, 72px) clamp(20px, 5vw, 52px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{
                padding: '24px 28px',
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}>
                <p className="kpi-number" style={{ color: 'var(--lime)', marginBottom: 8 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, fontWeight: 300 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section style={{
        background: 'var(--off-white)',
        padding: 'clamp(64px, 10vh, 96px) clamp(20px, 5vw, 52px)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 className="display-md" style={{ color: 'var(--black)', marginBottom: 16, wordBreak: 'break-word' }}>
            Ready to open your store?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--mid-gray)', lineHeight: 1.7, marginBottom: 36, fontWeight: 300 }}>
            Apply for an invite and we'll reach out on WhatsApp within a few days to get you set up.
          </p>
          <button onClick={openInviteModal} className="btn-lime" style={{ padding: '16px 36px', fontSize: 16 }}>
            Apply for access
          </button>
          <p style={{ fontSize: 12, color: 'var(--mid-gray)', marginTop: 16, fontWeight: 300 }}>
            Already have access?{' '}
            <Link href="/login" style={{ color: 'var(--black)', fontWeight: 500, textUnderlineOffset: 3 }}>
              Log in here
            </Link>
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: 'var(--black)',
        padding: 'clamp(32px, 5vw, 48px) clamp(20px, 5vw, 52px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.25)', letterSpacing: '-0.01em' }}>
          omeru hq
        </span>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>
          © {new Date().getFullYear()} REMOLUHLE (PTY) Ltd. ·{' '}
          <a href="https://omeru.io/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
            Privacy
          </a>
        </p>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .hero-inner { grid-template-columns: 1fr !important; gap: 48px !important; }
          .hero-chat { display: flex; justify-content: center; }
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-row { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-row > div:nth-child(2) { border-left: 1px solid rgba(255,255,255,0.07) !important; }
          .stats-row > div:nth-child(3) { border-left: none !important; border-top: 1px solid rgba(255,255,255,0.07); }
          .stats-row > div:nth-child(4) { border-left: 1px solid rgba(255,255,255,0.07) !important; border-top: 1px solid rgba(255,255,255,0.07); }
        }
        @media (max-width: 560px) {
          .hero-chat { display: none !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-row { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
