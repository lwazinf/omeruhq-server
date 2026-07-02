'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

function scrollToSection(href: string) {
  const id = href.replace('#', '');
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = (window as unknown as Record<string, unknown>).__lenis as { scrollTo?: (el: Element, opts: Record<string, unknown>) => void } | undefined;
  if (lenis?.scrollTo) {
    lenis.scrollTo(el, { offset: -80, duration: 1.4 });
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export default function Nav({ darkHero = false }: { darkHero?: boolean }) {
  const t = useTranslations('Nav');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const dark = darkHero && !scrolled;

  const navItems = [
    { label: t('howItWorks'), href: '#how-it-works' },
    { label: t('features'),   href: '#features'     },
    { label: t('stores'),     href: '/stores'       },
    { label: t('pricing'),    href: '#pricing'       },
    { label: t('faq'),        href: '#faq'           },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMenuOpen(false);
    setTimeout(() => scrollToSection(href), menuOpen ? 320 : 0);
  }, [menuOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          padding: 'clamp(14px, 2vh, 18px) clamp(20px, 4vw, 48px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'background 0.35s, box-shadow 0.35s',
          background: scrolled ? 'rgba(245,244,239,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          boxShadow: scrolled ? '0 1px 0 rgba(0,0,0,0.07)' : 'none',
        }}
      >
        {/* Logo */}
        <a
          href="#"
          onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}
        >
          <div style={{
            width: 30, height: 30,
            background: dark ? 'rgba(255,255,255,0.1)' : 'var(--black)',
            border: dark ? '1px solid rgba(255,255,255,0.15)' : 'none',
            borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.35s, border-color 0.35s',
          }}>
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
              <path d="M3 9C3 5.686 5.686 3 9 3s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" fill="var(--lime)"/>
              <path d="M9 6v6M6 9h6" stroke={dark ? 'rgba(0,0,0,0.6)' : 'var(--black)'} strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: dark ? 'white' : 'var(--black)', transition: 'color 0.35s' }}>
            Omeru
          </span>
        </a>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="nav-links">
          {navItems.map(({ label, href }) =>
            href.startsWith('/') ? (
              <a key={label} href={href} className="nav-link" style={{ color: dark ? 'rgba(255,255,255,0.65)' : undefined, transition: 'color 0.35s' }}>{label}</a>
            ) : (
              <a key={label} href={href} className="nav-link" style={{ color: dark ? 'rgba(255,255,255,0.65)' : undefined, transition: 'color 0.35s' }} onClick={e => handleNavClick(e, href)}>{label}</a>
            )
          )}
        </div>

        {/* Desktop CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="nav-cta">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('omeru:invite'))}
            className="btn-outline"
            style={{ padding: '8px 16px', fontSize: 13, color: dark ? 'rgba(255,255,255,0.8)' : undefined, borderColor: dark ? 'rgba(255,255,255,0.25)' : undefined, transition: 'color 0.35s, border-color 0.35s' }}
          >
            {t('requestInvite')}
          </button>
          <a
            href="https://hq.omeru.io"
            className="btn-outline"
            style={{ padding: '8px 16px', fontSize: 13, color: dark ? 'rgba(255,255,255,0.8)' : undefined, borderColor: dark ? 'rgba(255,255,255,0.25)' : undefined, transition: 'color 0.35s, border-color 0.35s', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.7 }}>
              <rect x="1" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M4 4V3a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="7" cy="8.5" r="1.2" fill="currentColor"/>
            </svg>
            {t('merchantHQ')}
          </a>
          <a
            href="https://wa.me/27705736794?text=Hi"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-lime"
            style={{ padding: '8px 16px', fontSize: 13 }}
            data-hover
          >
            {t('shopOnWA')}
          </a>
        </div>

        {/* Hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}
        >
          {(['first', 'second', 'third'] as const).map((pos, i) => (
            <motion.span
              key={pos}
              animate={
                i === 0 ? { rotate: menuOpen ? 45 : 0, y: menuOpen ? 6.5 : 0 } :
                i === 1 ? { opacity: menuOpen ? 0 : 1 } :
                          { rotate: menuOpen ? -45 : 0, y: menuOpen ? -6.5 : 0 }
              }
              transition={{ duration: i === 1 ? 0.2 : 0.25 }}
              style={{ height: 1.5, width: i === 1 ? 16 : 22, background: dark ? 'rgba(255,255,255,0.8)' : 'var(--black)', borderRadius: 2, display: 'block', transformOrigin: 'center', transition: 'background 0.35s' }}
            />
          ))}
        </button>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'fixed', inset: 0, background: 'var(--off-white)', zIndex: 199, padding: '88px 28px 40px', display: 'flex', flexDirection: 'column' }}
          >
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              {navItems.map(({ label, href }, i) => (
                <motion.a
                  key={label}
                  href={href}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  onClick={href.startsWith('/') ? () => setMenuOpen(false) : e => handleNavClick(e, href)}
                  style={{ textDecoration: 'none', color: 'var(--black)', fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 7vw, 38px)', fontWeight: 700, letterSpacing: '-0.02em', padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  {label}
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 9h12M9 3l6 6-6 6" stroke="rgba(0,0,0,0.2)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.a>
              ))}
            </nav>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.45 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 28 }}
            >
              <button onClick={() => { setMenuOpen(false); setTimeout(() => window.dispatchEvent(new CustomEvent('omeru:invite')), 320); }} className="btn-lime" style={{ justifyContent: 'center', padding: '15px 24px' }}>
                {t('applyAsMerchant')}
              </button>
              <a href="https://hq.omeru.io" className="btn-outline" style={{ justifyContent: 'center', padding: '15px 24px' }}>
                {t('merchantHQ')}
              </a>
              <a href="https://wa.me/27705736794?text=Hi" target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ justifyContent: 'center', padding: '15px 24px' }}>
                {t('shopOnWhatsApp')}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .nav-links  { display: flex !important; }
        .nav-cta    { display: flex !important; }
        .nav-hamburger { display: none !important; }
        @media (max-width: 860px) {
          .nav-links     { display: none !important; }
          .nav-cta       { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
