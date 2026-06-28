'use client';

import { openInviteModal } from '@/components/InviteModal';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

/* ─── Icon ─────────────────────────────────────────────── */
const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

/* ─── Dashboard mockup ──────────────────────────────────── */
const SIDEBAR_ITEMS = [
  { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Orders', active: true },
  { icon: 'M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m8 4l8-4M4 7l8 4', label: 'Products' },
  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Bookings' },
  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Analytics' },
  { icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', label: 'Broadcasts' },
];

const COLS = [
  {
    status: 'NEW', dot: '#c8f135', count: 3,
    cards: [
      { id: '#A3F2', name: 'Spicy Chicken Wrap ×2', price: 'R89.00' },
      { id: '#A3F3', name: 'Cheese Burger', price: 'R79.00' },
    ],
  },
  {
    status: 'PREPARING', dot: '#f5a623', count: 5,
    cards: [
      { id: '#A3G1', name: 'Beef Bunny Chow', price: 'R65.00' },
      { id: '#A3EA', name: 'Lamb Curry × 2', price: 'R160.00' },
    ],
  },
  {
    status: 'READY', dot: '#4cd964', count: 4,
    cards: [
      { id: '#A2D1', name: 'Veg Thai', price: 'R120.00' },
      { id: '#A3D5', name: 'Masala Chips', price: 'R30.00' },
    ],
  },
];

function DashboardMockup() {
  const s = {
    wrap: {
      borderRadius: 14,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 40px 120px rgba(0,0,0,0.7)',
      background: '#111',
      width: '100%',
      maxWidth: 860,
      margin: '0 auto',
      position: 'relative' as const,
    },
    chrome: {
      background: '#1c1c1c',
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    },
    dot: (c: string) => ({ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 as const }),
    urlBar: {
      flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 6,
      padding: '4px 10px', fontSize: 11, color: 'rgba(255,255,255,0.35)',
      fontFamily: 'var(--font-body)', textAlign: 'center' as const,
    },
    body: { display: 'flex', height: 320 },
    sidebar: {
      width: 150, background: '#0f0f0f', borderRight: '1px solid rgba(255,255,255,0.06)',
      padding: '16px 0', flexShrink: 0,
    },
    sidebarLogo: {
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '0 12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 10,
    },
    main: { flex: 1, background: '#111', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const },
    mainHeader: {
      padding: '14px 16px 10px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    kanban: { flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, overflow: 'hidden' },
    col: { padding: '10px 10px', borderRight: '1px solid rgba(255,255,255,0.05)' },
    colHeader: { display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 },
    card: {
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 7, padding: '8px 10px', marginBottom: 6,
    },
  };

  return (
    <div style={s.wrap}>
      {/* Browser chrome */}
      <div style={s.chrome}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={s.dot('#ff5f57')} />
          <div style={s.dot('#febc2e')} />
          <div style={s.dot('#28c840')} />
        </div>
        <div style={s.urlBar}>hq.omeru.io/orders</div>
        <div style={{ width: 44 }} />
      </div>

      {/* App body */}
      <div style={s.body}>
        {/* Sidebar */}
        <div style={s.sidebar}>
          <div style={s.sidebarLogo}>
            <div style={{ width: 20, height: 20, background: 'var(--lime)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 18 18" fill="none">
                <path d="M3 9C3 5.686 5.686 3 9 3s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" fill="var(--black)" />
                <path d="M9 6v6M6 9h6" stroke="var(--black)" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'white', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>omeru hq</span>
          </div>
          {SIDEBAR_ITEMS.map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 12px', margin: '1px 6px',
              borderRadius: 6, cursor: 'default',
              background: item.active ? 'rgba(200,241,53,0.1)' : 'transparent',
              color: item.active ? 'var(--lime)' : 'rgba(255,255,255,0.35)',
            }}>
              <Icon d={item.icon} size={13} />
              <span style={{ fontSize: 11, fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Main */}
        <div style={s.main}>
          <div style={s.mainHeader}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>Orders</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>12 today · <span style={{ color: 'var(--lime)' }}>R1,940</span></span>
          </div>
          <div style={s.kanban}>
            {COLS.map(col => (
              <div key={col.status} style={s.col}>
                <div style={s.colHeader}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: col.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>{col.status}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>· {col.count}</span>
                </div>
                {col.cards.map(card => (
                  <div key={card.id} style={s.card}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 3, lineHeight: 1.35 }}>{card.name}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{card.id}</span>
                      <span style={{ fontSize: 9, color: 'var(--lime)', fontWeight: 600 }}>{card.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WhatsApp notification overlay */}
      <div style={{
        position: 'absolute', bottom: 20, right: 16,
        background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: '10px 14px',
        display: 'flex', alignItems: 'flex-start', gap: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        maxWidth: 220,
      }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--black)' }}>O</span>
        </div>
        <div>
          <p style={{ fontSize: 9, fontWeight: 600, color: 'white', marginBottom: 2 }}>Omeru Bot <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>· WhatsApp Business</span></p>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
            ✅ Order <strong style={{ color: 'white' }}>#A3F2</strong> marked Ready<br />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Customer notified on WhatsApp</span>
          </p>
        </div>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#25d366', marginTop: 3, flexShrink: 0 }} />
      </div>
    </div>
  );
}

/* ─── Features ──────────────────────────────────────────── */
const FEATURES = [
  { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Orders', desc: 'Kanban board for every incoming order. Accept, mark ready, complete — all in one view.' },
  { icon: 'M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m8 4l8-4M4 7l8 4', label: 'Products', desc: 'Add products with photos, prices, variants and categories. Publish or archive in seconds.' },
  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Bookings', desc: 'Full service booking engine with a 7-day diary, slot generation, and auto-reminders.' },
  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Analytics', desc: 'Revenue, order counts, peak hours, and top-selling products — updated in real time.' },
  { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', label: 'Team', desc: 'Invite co-owners and staff to manage your store. Role-based access keeps things clean.' },
  { icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', label: 'Broadcasts', desc: 'Send a WhatsApp message to all opted-in customers at once. No third-party tools needed.' },
];

const STATS = [
  { value: '7%', label: 'Platform fee — only on completed orders' },
  { value: '0', label: 'App downloads required for your customers' },
  { value: '6', label: 'Steps to go live from first invite' },
  { value: '24h', label: 'Typical time from invite to first order' },
];

/* ─── Footer columns ────────────────────────────────────── */
const FOOTER_COLUMNS = [
  {
    heading: 'Portal',
    links: [
      { label: 'Orders',    href: '#features' },
      { label: 'Products',  href: '#features' },
      { label: 'Bookings',  href: '#features' },
      { label: 'Analytics', href: '#features' },
    ],
  },
  {
    heading: 'Contact',
    links: [
      { label: 'hello@omeru.io',     href: 'mailto:hello@omeru.io'     },
      { label: 'merchants@omeru.io', href: 'mailto:merchants@omeru.io' },
    ],
  },
  {
    heading: 'Connect',
    links: [
      { label: '@OmeruHQ on X', href: 'https://x.com/OmeruHQ' },
      { label: 'omeru.io',      href: 'https://omeru.io'       },
    ],
  },
];

function HQFooter() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <footer ref={ref} style={{ background: 'var(--black)', padding: 'clamp(60px, 8vw, 80px) clamp(20px, 5vw, 52px) 36px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', opacity: 0.08 }} />
      <div style={{ position: 'absolute', bottom: '-40%', left: '20%', width: '60%', height: '100%', background: 'radial-gradient(ellipse at center, rgba(200,241,53,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 'clamp(48px, 7vw, 72px)', textAlign: 'center' }}
        >
          <h2 className="display-lg" style={{ color: 'white', marginBottom: 20, wordBreak: 'break-word' }}>
            Start selling on WhatsApp<br />
            <span style={{ color: 'var(--lime)' }}>in days, not months.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15, fontWeight: 300, marginBottom: 36 }}>
            We handle the tech. You focus on your customers.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={openInviteModal} className="btn-lime">Apply for access</button>
            <a href="mailto:hello@omeru.io" className="btn-outline" style={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.12)' }}>Talk to us</a>
          </div>
        </motion.div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 'clamp(32px, 5vw, 48px)' }} />

        <div className="hq-footer-grid" style={{ marginBottom: 'clamp(32px, 5vw, 48px)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, background: 'var(--lime)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9C3 5.686 5.686 3 9 3s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" fill="var(--black)" />
                  <path d="M9 6v6M6 9h6" stroke="var(--black)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'white', letterSpacing: '-0.02em' }}>
                omeru <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>hq</span>
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, lineHeight: 1.7, fontWeight: 300, maxWidth: 220 }}>
              The merchant portal for South African WhatsApp stores. Powered by{' '}
              <a href="https://stitch.money/express" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.18)', textUnderlineOffset: 3 }}>Stitch Money</a>.
            </p>
          </div>
          {FOOTER_COLUMNS.map(col => (
            <div key={col.heading}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 18 }}>{col.heading}</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(link => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href.startsWith('#') || link.href.startsWith('mailto') ? undefined : '_blank'}
                      rel={link.href.startsWith('#') || link.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                      style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: 13, fontWeight: 300, transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                    >{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 24 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>© {new Date().getFullYear()} REMOLUHLE (PTY) Ltd. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <a href="https://omeru.io/privacy" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 300, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}>Privacy Policy</a>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>Made in 🇿🇦</span>
          </div>
        </div>
      </div>

      <style>{`
        .hq-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: clamp(24px, 4vw, 48px); }
        @media (max-width: 860px) { .hq-footer-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .hq-footer-grid { grid-template-columns: 1fr; gap: 32px; } }
      `}</style>
    </footer>
  );
}

/* ─── Main page ─────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ overflowX: 'hidden' }}>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 4vw, 48px)',
        height: 56,
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
              <path d="M3 9C3 5.686 5.686 3 9 3s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" fill="var(--lime)" />
              <path d="M9 6v6M6 9h6" stroke="rgba(0,0,0,0.5)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'white', letterSpacing: '-0.01em' }}>
            omeru <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>hq</span>
          </span>
        </div>

        {/* Center links */}
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {['Features', 'Pricing', 'FAQ'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} className="nav-link">{l}</a>
          ))}
          <Link href="/login" className="nav-link">Log in</Link>
        </div>

        {/* Right CTA */}
        <button onClick={openInviteModal} className="btn-lime" style={{ padding: '8px 18px', fontSize: 13 }}>
          Apply for access
        </button>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        background: 'var(--black)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px clamp(20px, 5vw, 52px) 0',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}>
        {/* Subtle noise/texture */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', opacity: 0.04 }} />
        {/* Lime glow top-center */}
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '70%', height: '60%', background: 'radial-gradient(ellipse at center, rgba(200,241,53,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 900 }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 100, border: '1px solid rgba(200,241,53,0.25)', background: 'rgba(200,241,53,0.06)', marginBottom: 32 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)' }} />
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lime)' }}>Merchant Portal · Invite Only</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(44px, 7.5vw, 96px)',
            fontWeight: 800,
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            color: 'white',
            marginBottom: 28,
            wordBreak: 'break-word',
          }}>
            Run your entire{' '}
            <span style={{ color: 'var(--lime)' }}>WhatsApp store</span>{' '}
            from one place.
          </h1>

          {/* Subtext */}
          <p style={{
            fontSize: 'clamp(15px, 1.6vw, 18px)',
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.75,
            fontWeight: 300,
            maxWidth: 620,
            margin: '0 auto 36px',
            wordBreak: 'break-word',
          }}>
            The command centre for your Omeru store — orders, products,
            bookings, team and broadcasts, all in one dashboard your
            customers never have to download.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <button onClick={openInviteModal} className="btn-lime" style={{ padding: '14px 32px', fontSize: 15 }}>
              Apply for access
            </button>
            <Link href="/login" className="landing-btn-dark" style={{ padding: '13px 28px', fontSize: 15 }}>
              Log in →
            </Link>
          </div>

          {/* Trust line */}
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 300, marginBottom: 56 }}>
            No app for customers · Live in ~24 hours · 7% per completed order
          </p>

          {/* Dashboard mockup — bleeds into next section */}
          <DashboardMockup />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ background: 'var(--off-white)', padding: 'clamp(64px, 10vh, 96px) clamp(20px, 5vw, 52px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)' }}>Everything in one dashboard</span>
            <h2 className="display-md" style={{ marginTop: 12, color: 'var(--black)', wordBreak: 'break-word' }}>Built for how SA merchants actually work.</h2>
          </div>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.label} className="card" style={{ padding: '26px', borderRadius: 18, background: 'white' }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--lime)' }}>
                  <Icon d={f.icon} size={18} />
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--black)', marginBottom: 8, letterSpacing: '-0.01em' }}>{f.label}</p>
                <p style={{ fontSize: 13, color: 'var(--mid-gray)', lineHeight: 1.75, fontWeight: 300 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ background: 'var(--dark-gray)', padding: 'clamp(48px, 8vh, 72px) clamp(20px, 5vw, 52px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{ padding: '28px 32px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <p className="kpi-number" style={{ color: 'var(--lime)', marginBottom: 8 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6, fontWeight: 300 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'var(--off-white)', padding: 'clamp(64px, 10vh, 96px) clamp(20px, 5vw, 52px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <h2 className="display-md" style={{ color: 'var(--black)', marginBottom: 16, wordBreak: 'break-word' }}>Ready to open your store?</h2>
          <p style={{ fontSize: 15, color: 'var(--mid-gray)', lineHeight: 1.75, marginBottom: 36, fontWeight: 300 }}>
            Apply for an invite and we&apos;ll reach out on WhatsApp within a few days to get you set up.
          </p>
          <button onClick={openInviteModal} className="btn-lime" style={{ padding: '16px 36px', fontSize: 16 }}>Apply for access</button>
          <p style={{ fontSize: 12, color: 'var(--mid-gray)', marginTop: 20, fontWeight: 300 }}>
            Already have access?{' '}
            <Link href="/login" style={{ color: 'var(--black)', fontWeight: 500, textUnderlineOffset: 3 }}>Log in here</Link>
          </p>
        </div>
      </section>

      <HQFooter />

      <style>{`
        .nav-link {
          font-size: 13px; color: rgba(255,255,255,0.45); text-decoration: none;
          padding: 6px 12px; border-radius: 7px; font-family: var(--font-body);
          transition: color 0.15s, background 0.15s;
        }
        .nav-link:hover { color: white; background: rgba(255,255,255,0.06); }
        .landing-btn-dark {
          display: inline-flex; align-items: center;
          background: transparent; color: rgba(255,255,255,0.6);
          border-radius: 100px; font-family: var(--font-body);
          font-weight: 500; cursor: pointer; text-decoration: none;
          border: 1.5px solid rgba(255,255,255,0.15);
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }
        .landing-btn-dark:hover { color: white; border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.06); }
        @media (max-width: 860px) {
          .nav-links { display: none !important; }
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-row { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-row > div:nth-child(3) { border-left: none !important; border-top: 1px solid rgba(255,255,255,0.07); }
          .stats-row > div:nth-child(4) { border-top: 1px solid rgba(255,255,255,0.07); }
        }
        @media (max-width: 560px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-row { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
