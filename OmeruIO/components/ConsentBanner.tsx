'use client';

import { useState, useEffect } from 'react';

const KEY = 'omeru_consent_v1';

type GtagFn = (...args: unknown[]) => void;
function gtag(...args: unknown[]) {
  const w = window as unknown as { gtag?: GtagFn };
  if (typeof w.gtag === 'function') w.gtag(...args);
}

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  function accept() {
    localStorage.setItem(KEY, 'granted');
    gtag('consent', 'update', {
      ad_storage:         'granted',
      ad_user_data:       'granted',
      ad_personalization: 'granted',
      analytics_storage:  'granted',
    });
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(KEY, 'denied');
    setVisible(false);
  }

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        width: 'min(360px, calc(100vw - 48px))',
        background: 'var(--black)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 16px 56px rgba(0,0,0,0.45), 0 2px 12px rgba(0,0,0,0.3)',
        padding: '22px 22px 20px',
        zIndex: 9999,
        transform: visible ? 'translateY(0)' : 'translateY(calc(100% + 32px))',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.45s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}>
        {/* Noise overlay matching site */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
          backgroundImage: "url('/bg-tile.jpg')",
          backgroundSize: '500px 333px',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'screen',
          filter: 'invert(1)',
          opacity: 0.05,
        }} />

        {/* Lime dot indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, position: 'relative' }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--lime)',
            display: 'block',
            boxShadow: '0 0 0 3px rgba(200,241,53,0.15)',
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            Cookie Preferences
          </span>
        </div>

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: '0 0 20px', fontWeight: 300, position: 'relative' }}>
          We use cookies to measure performance and improve your experience.{' '}
          <a href="/privacy" style={{ color: 'var(--lime)', textDecoration: 'none', fontWeight: 500 }}>
            Privacy Policy
          </a>
        </p>

        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
          <button
            onClick={decline}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.45)',
              borderRadius: 10,
              padding: '10px 0',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'border-color 0.2s, color 0.2s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
          >
            Decline
          </button>
          <button
            onClick={accept}
            style={{
              flex: 1,
              background: 'var(--lime)',
              border: 'none',
              color: 'var(--black)',
              borderRadius: 10,
              padding: '10px 0',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#a8d420'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--lime)'; e.currentTarget.style.transform = ''; }}
          >
            Accept all
          </button>
        </div>
      </div>
    </>
  );
}
