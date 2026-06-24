'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <footer ref={ref} style={{ background: 'var(--black)', padding: 'clamp(60px, 8vw, 80px) 0 36px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', opacity: 0.08 }} />
      <div style={{
        position: 'absolute', bottom: '-40%', left: '20%',
        width: '60%', height: '100%',
        background: 'radial-gradient(ellipse at center, rgba(200,241,53,0.05) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          style={{ marginBottom: 'clamp(48px, 7vw, 72px)', textAlign: 'center' }}
        >
          <h2 className="display-lg" style={{ color: 'white', marginBottom: 20 }}>
            Your customers are on<br />
            <span style={{ color: 'var(--lime)' }}>WhatsApp right now.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15, fontWeight: 300, marginBottom: 36 }}>
            Apply for an invite and start selling this week.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => window.dispatchEvent(new CustomEvent('omeru:invite'))} className="btn-lime" data-hover>
              Apply for invite →
            </button>
            <a href="mailto:hello@omeru.io" target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.12)' }} data-hover>
              Talk to us
            </a>
          </div>
        </motion.div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 'clamp(32px, 5vw, 48px)' }} />

        {/* Footer grid */}
        <div className="footer-grid" style={{ marginBottom: 'clamp(32px, 5vw, 48px)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, background: 'var(--lime)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9C3 5.686 5.686 3 9 3s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" fill="var(--black)"/>
                  <path d="M9 6v6M6 9h6" stroke="var(--black)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'white', letterSpacing: '-0.02em' }}>Omeru</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, lineHeight: 1.7, fontWeight: 300, maxWidth: 220 }}>
              Zero-friction WhatsApp commerce for South African merchants. Powered by{' '}
              <a href="https://stitch.money/express" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.18)', textUnderlineOffset: 3, transition: 'color 0.2s' }}>Stitch Money</a>.
            </p>
          </div>

          {[
            { heading: 'Product',  links: [{ label: 'How it works', href: '#how-it-works' }, { label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }] },
            { heading: 'Contact',  links: [{ label: 'hello@omeru.io', href: 'mailto:hello@omeru.io' }, { label: 'sales@omeru.io', href: 'mailto:sales@omeru.io' }, { label: 'merchants@omeru.io', href: 'mailto:merchants@omeru.io' }] },
            { heading: 'Social',   links: [{ label: '@OmeruHQ on X', href: 'https://x.com/OmeruHQ' }, { label: 'Facebook', href: '#' }, { label: 'omeru.io', href: 'https://omeru.io' }] },
          ].map((col) => (
            <div key={col.heading}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 18 }}>
                {col.heading}
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href.startsWith('#') ? undefined : '_blank'}
                      rel={link.href.startsWith('#') ? undefined : 'noopener noreferrer'}
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
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>© 2026 Omeru. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <a href="/privacy" style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 300, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}>
              Privacy Policy
            </a>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>Made in South Africa 🇿🇦</span>
          </div>
        </div>
      </div>

      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: clamp(24px, 4vw, 48px);
        }
        @media (max-width: 860px) {
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>
    </footer>
  );
}
