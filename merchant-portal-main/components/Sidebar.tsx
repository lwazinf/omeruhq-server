'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { label: 'Dashboard',  href: '/dashboard',  icon: HomeIcon,    phase: 1 },
  { label: 'Orders',     href: '/orders',     icon: OrdersIcon,  phase: 1 },
  { label: 'Products',   href: '/products',   icon: BoxIcon,     phase: 1 },
  { label: 'Services',   href: '/services',   icon: CalIcon,     phase: 2 },
  { label: 'Analytics',  href: '/analytics',  icon: ChartIcon,   phase: 3 },
  { label: 'Customers',  href: '/customers',  icon: UsersIcon,   phase: 3 },
  { label: 'Broadcast',  href: '/broadcast',  icon: MegaIcon,    phase: 2 },
  { label: 'Reviews',    href: '/reviews',    icon: StarIcon,    phase: 3 },
  { label: 'Settings',   href: '/settings',   icon: GearIcon,    phase: 2 },
];

interface Props {
  merchantName: string;
  isOpen: boolean;
  pendingOrders?: number;
}

export default function Sidebar({ merchantName, isOpen, pendingOrders = 0 }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <aside className="sidebar">
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
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)', letterSpacing: '0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {merchantName}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV.map(({ label, href, icon: Icon, phase }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          const disabled = phase > 1;
          const badge = href === '/orders' && pendingOrders > 0 ? pendingOrders : null;

          return (
            <Link
              key={href}
              href={disabled ? '#' : href}
              onClick={disabled ? e => e.preventDefault() : undefined}
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
            Store {isOpen ? 'open' : 'closed'}
          </span>
        </div>
        <button onClick={logout} className="btn-ghost" style={{ width: '100%', color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: '6px 8px' }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2M10 10l3-3-3-3M13 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Log out
        </button>
      </div>
    </aside>
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
