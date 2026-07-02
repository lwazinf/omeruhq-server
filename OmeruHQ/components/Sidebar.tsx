'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Props {
  merchantName: string;
  merchantHandle: string;
  merchantAddress?: string;
  isOpen: boolean;
  pendingOrders?: number;
}

export default function Sidebar({ merchantName, merchantHandle, merchantAddress, isOpen, pendingOrders = 0 }: Props) {
  const t = useTranslations('Sidebar');
  const pathname = usePathname();
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('omeru-theme');
    if (stored === 'light') { setIsLight(true); document.documentElement.classList.add('theme-light'); }
  }, []);

  function toggleTheme(light: boolean) {
    setIsLight(light);
    if (light) {
      document.documentElement.classList.add('theme-light');
      localStorage.setItem('omeru-theme', 'light');
    } else {
      document.documentElement.classList.remove('theme-light');
      localStorage.setItem('omeru-theme', 'dark');
    }
  }

  const NAV = [
    { label: t('dashboard'), href: '/dashboard', icon: HomeIcon   },
    { label: t('orders'),    href: '/orders',    icon: OrdersIcon },
    { label: t('products'),  href: '/products',  icon: BoxIcon    },
    { label: t('services'),  href: '/services',  icon: CalIcon    },
    { label: t('analytics'), href: '/analytics', icon: ChartIcon  },
    { label: t('customers'), href: '/customers', icon: UsersIcon  },
    { label: t('payments'),  href: '/payments',  icon: CardIcon   },
    { label: t('broadcast'), href: '/broadcast', icon: MegaIcon   },
    { label: t('team'),      href: '/team',      icon: TeamIcon   },
    { label: t('reviews'),   href: '/reviews',   icon: StarIcon   },
    { label: t('settings'),  href: '/settings',  icon: GearIcon   },
  ];

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

  return (
    <>
    {/* ── Mobile top bar ── */}
    <div className="mobile-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, background: 'var(--lime)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="11" height="11" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="4.5" fill="rgba(0,0,0,0.7)"/></svg>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'white', letterSpacing: '-0.01em' }}>
          Omeru <span style={{ color: 'var(--lime)' }}>HQ</span>
        </span>
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

    {/* ── Mobile overlay ── */}
    {mobileOpen && (
      <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} style={{ cursor: 'default' }} />
    )}

    {/* ── Preview modal ── */}
    {previewOpen && (
      <div
        onClick={() => setPreviewOpen(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', padding: 20, animation: 'fadeIn 0.18s ease' }}
      >
        <div onClick={e => e.stopPropagation()} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--dark-gray)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.6)', maxHeight: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPreviewOpen(false)} style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', border: 'none', cursor: 'pointer' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '5px 12px', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {previewUrl}
            </div>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7M8 1h3m0 0v3m0-3L5 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          </div>
          <iframe src={previewUrl} style={{ flex: 1, border: 'none', width: '100%', display: 'block' }} title="Store preview" />
        </div>
      </div>
    )}

    <aside className={`sidebar${mobileOpen ? ' sidebar-open' : ''}`}>
      {/* ── Wordmark ── */}
      <div style={{ padding: '22px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, background: 'var(--lime)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="4.5" fill="rgba(0,0,0,0.75)"/></svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>
            <span style={{ color: 'white' }}>Omeru </span><span style={{ color: 'var(--lime)' }}>HQ</span>
          </span>
        </div>

        {/* ── Store card ── */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: merchantHandle ? 10 : 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
              {merchantName.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {merchantName}
              </div>
              {merchantAddress && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {merchantAddress}
                </div>
              )}
            </div>
          </div>

          {merchantHandle && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setPreviewOpen(true)}
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px 0', borderRadius: 7, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
              >
                {t('previewBadge')}
              </button>
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '5px 0', borderRadius: 7, background: 'rgba(200,241,53,0.06)', border: '1px solid rgba(200,241,53,0.25)', fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--lime)', textDecoration: 'none' }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)', display: 'inline-block' }} />
                {t('liveBadge')}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          const badge = href === '/orders' && pendingOrders > 0 ? pendingOrders : null;

          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', marginBottom: 2, borderRadius: 10,
                textDecoration: 'none', gap: 10,
                background: active ? 'rgba(200,241,53,0.08)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon active={active} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--lime)' : 'rgba(255,255,255,0.5)' }}>
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

      {/* ── Footer ── */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: isOpen ? 'var(--lime)' : '#ef4444', boxShadow: isOpen ? '0 0 6px var(--lime)' : '0 0 6px #ef4444', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            {isOpen ? t('storeOpen') : t('storeClosed')}
          </span>
        </div>
        <div style={{ marginBottom: 10 }}>
          <LanguageSwitcher compact />
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
          {[{ key: false, label: 'Dark' }, { key: true, label: 'Light' }].map(({ key, label }) => (
            <button
              key={label}
              onClick={() => toggleTheme(key)}
              style={{
                flex: 1, padding: '4px 0', borderRadius: 5, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                background: isLight === key ? 'rgba(200,241,53,0.15)' : 'transparent',
                color: isLight === key ? 'var(--lime)' : 'rgba(255,255,255,0.28)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={logout} className="btn-ghost" style={{ width: '100%', color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: '6px 8px', justifyContent: 'flex-start' }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2M10 10l3-3-3-3M13 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {t('logout')}
        </button>
      </div>
    </aside>
    </>
  );
}

// ── Icons — lime when active, gray when not ──

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--lime)' : 'rgba(255,255,255,0.4)';
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M1 6.5L8 1l7 5.5V14a1 1 0 01-1 1H2a1 1 0 01-1-1V6.5z" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M5 15V9h6v6" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>;
}
function OrdersIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--lime)' : 'rgba(255,255,255,0.4)';
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="14" height="14" rx="2" stroke={c} strokeWidth="1.4"/>
    <path d="M4 5h8M4 8h5M4 11h3" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function BoxIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--lime)' : 'rgba(255,255,255,0.4)';
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M1 4l7-3 7 3v8l-7 3-7-3V4z" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M8 1v14M1 4l7 3 7-3" stroke={c} strokeWidth="1.4"/>
  </svg>;
}
function CalIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--lime)' : 'rgba(255,255,255,0.4)';
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="14" height="12" rx="2" stroke={c} strokeWidth="1.4"/>
    <path d="M5 1v4M11 1v4M1 7h14" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function ChartIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--lime)' : 'rgba(255,255,255,0.4)';
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M1 12l4-4 3 3 4-5 3 2" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 15h14" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function UsersIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--lime)' : 'rgba(255,255,255,0.4)';
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="6" cy="5" r="3" stroke={c} strokeWidth="1.4"/>
    <path d="M1 14c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M12 7c1.657 0 3 1.343 3 3 0 1.105-.597 2.074-1.5 2.598" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function TeamIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--lime)' : 'rgba(255,255,255,0.4)';
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="5" cy="5" r="2.5" stroke={c} strokeWidth="1.4"/>
    <circle cx="11" cy="5" r="2.5" stroke={c} strokeWidth="1.4"/>
    <path d="M1 13c0-2.209 1.791-4 4-4s4 1.791 4 4" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M11 9c1.657 0 4 1 4 4" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function MegaIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--lime)' : 'rgba(255,255,255,0.4)';
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M13 3L3 7H2a1 1 0 000 2h1l10 4V3z" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M5 9v4" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function StarIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--lime)' : 'rgba(255,255,255,0.4)';
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 1l1.854 4.146L14 6.09l-3 2.925.708 4.127L8 11l-3.708 2.142L5 9.015 2 6.09l4.146-.944L8 1z" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>;
}
function GearIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--lime)' : 'rgba(255,255,255,0.4)';
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function CardIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--lime)' : 'rgba(255,255,255,0.4)';
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="14" height="10" rx="2" stroke={c} strokeWidth="1.4"/>
    <path d="M1 6h14" stroke={c} strokeWidth="1.4"/>
    <path d="M4 10h3M10 10h2" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
