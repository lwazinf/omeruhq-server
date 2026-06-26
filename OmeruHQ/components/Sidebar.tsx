'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Props {
  merchantName: string;
  merchantHandle: string;
  isOpen: boolean;
  pendingOrders?: number;
}

export default function Sidebar({ merchantName, merchantHandle, isOpen, pendingOrders = 0 }: Props) {
  const t = useTranslations('Sidebar');
  const pathname = usePathname();
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV = [
    { label: t('dashboard'), href: '/dashboard', icon: HomeIcon,   phase: 1 },
    { label: t('orders'),    href: '/orders',    icon: OrdersIcon, phase: 1 },
    { label: t('products'),  href: '/products',  icon: BoxIcon,    phase: 1 },
    { label: t('services'),  href: '/services',  icon: CalIcon,    phase: 2 },
    { label: t('analytics'), href: '/analytics', icon: ChartIcon,    phase: 3 },
    { label: t('customers'), href: '/customers', icon: UsersIcon,    phase: 3 },
    { label: t('payments'),  href: '/payments',  icon: CardIcon,     phase: 3 },
    { label: t('broadcast'), href: '/broadcast', icon: MegaIcon,     phase: 2 },
    { label: t('team'),      href: '/team',      icon: UsersIcon,    phase: 2 },
    { label: t('reviews'),   href: '/reviews',   icon: StarIcon,     phase: 3 },
    { label: t('settings'),  href: '/settings',  icon: GearIcon,     phase: 2 },
  ];

  // Lock body scroll when modal or mobile menu is open
  useEffect(() => {
    document.body.style.overflow = (previewOpen || mobileOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [previewOpen, mobileOpen]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const previewUrl = `https://omeru.io/@${merchantHandle}?preview=1`;
  const liveUrl = `https://omeru.io/@${merchantHandle}`;

  function closeMobileMenu() { setMobileOpen(false); }

  return (
    <>
    {/* ── Mobile top bar ── */}
    <div className="mobile-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, background: 'rgba(200,241,53,0.12)', border: '1px solid rgba(200,241,53,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
            <path d="M3 9C3 5.686 5.686 3 9 3s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" fill="var(--lime)"/>
            <path d="M9 6v6M6 9h6" stroke="rgba(0,0,0,0.5)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'white', letterSpacing: '-0.01em' }}>Omeru HQ</span>
      </div>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}
      >
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            height: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.7)', display: 'block',
            width: i === 1 ? 16 : 22,
            transform: mobileOpen ? (i === 0 ? 'rotate(45deg) translate(4.5px, 4.5px)' : i === 2 ? 'rotate(-45deg) translate(4.5px, -4.5px)' : 'scaleX(0)') : 'none',
            opacity: mobileOpen && i === 1 ? 0 : 1,
            transition: 'transform 0.22s ease, opacity 0.15s ease',
          }} />
        ))}
      </button>
    </div>

    {/* ── Mobile overlay backdrop ── */}
    {mobileOpen && (
      <div className="sidebar-overlay" onClick={closeMobileMenu} style={{ cursor: 'default' }} />
    )}

    {/* ── Preview modal ── */}
    {previewOpen && (
      <div
        onClick={() => setPreviewOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column',
          padding: '20px',
          animation: 'fadeIn 0.18s ease',
        }}
      >
        {/* Modal chrome */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            background: 'var(--dark-gray)', borderRadius: 18,
            overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
            maxHeight: '100%',
          }}
        >
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', background: 'rgba(0,0,0,0.3)',
            borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
          }}>
            {/* Traffic lights */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPreviewOpen(false)} style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', border: 'none', cursor: 'pointer' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            </div>
            {/* URL bar */}
            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 8,
              padding: '5px 12px', fontFamily: 'var(--font-body)', fontSize: 12,
              color: 'rgba(255,255,255,0.4)', letterSpacing: '0.01em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {previewUrl}
            </div>
            {/* Preview badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 100,
              background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.25)',
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase', color: '#f5c842',
            }}>
              <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                <circle cx="4" cy="4" r="3" stroke="#f5c842" strokeWidth="1.2"/>
                <circle cx="4" cy="4" r="1.2" fill="#f5c842"/>
              </svg>
              {t('previewBadge')}
            </div>
            {/* Open in tab */}
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.06)',
              border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
            }} title="Open in new tab">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7M8 1h3m0 0v3m0-3L5 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
          {/* iframe */}
          <iframe
            src={previewUrl}
            style={{ flex: 1, border: 'none', width: '100%', display: 'block' }}
            title="Store preview"
          />
        </div>
      </div>
    )}

    <aside className={`sidebar${mobileOpen ? ' sidebar-open' : ''}`}>
      {/* Logo */}
      <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, background: 'rgba(200,241,53,0.12)', border: '1px solid rgba(200,241,53,0.2)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
              <path d="M3 9C3 5.686 5.686 3 9 3s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" fill="var(--lime)"/>
              <path d="M9 6v6M6 9h6" stroke="rgba(0,0,0,0.5)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'white', letterSpacing: '-0.01em' }}>Omeru HQ</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)', letterSpacing: '0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 10 }}>
          {merchantName}
        </div>
        {merchantHandle && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPreviewOpen(true)}
              title="Preview — your store as currently saved (bypasses cache)"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 100,
                background: 'rgba(255,200,50,0.1)', border: '1px solid rgba(255,200,50,0.2)',
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                color: '#f5c842', cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <circle cx="4" cy="4" r="3" stroke="#f5c842" strokeWidth="1.2"/>
                <circle cx="4" cy="4" r="1.2" fill="#f5c842"/>
              </svg>
              {t('previewBadge')}
            </button>
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Live storefront — what customers see"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 100,
                background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.18)',
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                color: 'var(--lime)', textDecoration: 'none',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <circle cx="4" cy="4" r="3.2" fill="rgba(200,241,53,0.25)"/>
                <circle cx="4" cy="4" r="1.5" fill="var(--lime)"/>
              </svg>
              {t('liveBadge')}
            </a>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV.map(({ label, href, icon: Icon, phase }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          const disabled = phase > 3;
          const badge = href === '/orders' && pendingOrders > 0 ? pendingOrders : null;

          return (
            <Link
              key={href}
              href={disabled ? '#' : href}
              onClick={disabled ? e => e.preventDefault() : () => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 20px', margin: '1px 8px', borderRadius: 10,
                textDecoration: 'none', gap: 10,
                background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                borderLeft: active ? '2px solid var(--lime)' : '2px solid transparent',
                opacity: disabled ? 0.35 : 1,
                transition: 'background 0.15s, opacity 0.15s',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon active={active} />
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: active ? 500 : 400,
                  color: active ? 'white' : 'rgba(255,255,255,0.45)',
                }}>
                  {label}
                </span>
              </div>
              {badge && (
                <span style={{ background: 'var(--lime)', color: 'var(--black)', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100 }}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Open/close indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOpen ? 'var(--lime)' : '#ef4444', boxShadow: isOpen ? '0 0 6px var(--lime)' : '0 0 6px #ef4444' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            {isOpen ? t('storeOpen') : t('storeClosed')}
          </span>
        </div>
        <div style={{ marginBottom: 10 }}>
          <LanguageSwitcher compact />
        </div>
        <button onClick={logout} className="btn-ghost" style={{ width: '100%', color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: '6px 8px' }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2M10 10l3-3-3-3M13 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {t('logout')}
        </button>
      </div>
    </aside>
    </>
  );
}

// ── Icon components ──────────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M1 6.5L8 1l7 5.5V14a1 1 0 01-1 1H2a1 1 0 01-1-1V6.5z" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M5 15V9h6v6" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>;
}
function OrdersIcon({ active }: { active: boolean }) {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="14" height="14" rx="2" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3"/>
    <path d="M4 5h8M4 8h5M4 11h3" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>;
}
function BoxIcon({ active }: { active: boolean }) {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M1 4l7-3 7 3v8l-7 3-7-3V4z" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M8 1v14M1 4l7 3 7-3" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3"/>
  </svg>;
}
function CalIcon({ active }: { active: boolean }) {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="14" height="12" rx="2" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3"/>
    <path d="M5 1v4M11 1v4M1 7h14" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>;
}
function ChartIcon({ active }: { active: boolean }) {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M1 12l4-4 3 3 4-5 3 2" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 15h14" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>;
}
function UsersIcon({ active }: { active: boolean }) {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <circle cx="6" cy="5" r="3" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3"/>
    <path d="M1 14c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M12 7c1.657 0 3 1.343 3 3 0 1.105-.597 2.074-1.5 2.598" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>;
}
function MegaIcon({ active }: { active: boolean }) {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M13 3L3 7H2a1 1 0 000 2h1l10 4V3z" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M5 9v4" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>;
}
function StarIcon({ active }: { active: boolean }) {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M8 1l1.854 4.146L14 6.09l-3 2.925.708 4.127L8 11l-3.708 2.142L5 9.015 2 6.09l4.146-.944L8 1z" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>;
}
function GearIcon({ active }: { active: boolean }) {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2.5" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3"/>
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.414 1.414M11.536 11.536l1.414 1.414M3.05 12.95l1.414-1.414M11.536 4.464l1.414-1.414" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>;
}
function CardIcon({ active }: { active: boolean }) {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="14" height="10" rx="2" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3"/>
    <path d="M1 6h14" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3"/>
    <path d="M4 10h3M10 10h2" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>;
}
