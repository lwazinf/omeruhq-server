'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import GenieReveal from '@/components/GenieReveal';
import { useTranslations } from 'next-intl';

// ── Single source of truth for the platform price ──────────────────────────
// One flat monthly fee, everything included, 0% commission.
// Change this constant to reprice the entire site.
export const FLAT_PRICE_ZAR = 499;
const FEATURE_COUNT = 9;

function Check() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="7.5" cy="7.5" r="7.5" fill="rgba(200,241,53,0.14)" />
      <path d="M4.5 7.5l2 2 4-4" stroke="var(--lime)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Pricing() {
  const t = useTranslations('Pricing');
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true });

  const features = Array.from({ length: FEATURE_COUNT }, (_, j) => t(`features.${j}`));

  return (
    <section id="pricing" ref={ref} style={{ padding: 'clamp(80px, 10vw, 120px) 0' }}>
      <GenieReveal>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 5vw, 56px)' }}>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} style={{ marginBottom: 16 }}>
            <span className="pill">{t('pill')}</span>
          </motion.div>
          <motion.h2 className="display-lg" initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.08 }}>
            {t('heading')}<br />
            <span style={{ color: 'var(--lime-dark)' }}>{t('headingAccent')}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.16 }}
            style={{ fontSize: 15, color: 'var(--mid-gray)', marginTop: 14, fontWeight: 300, maxWidth: 440, margin: '14px auto 0', lineHeight: 1.65 }}
          >
            {t('subtext')}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
          style={{ maxWidth: 520, margin: '0 auto' }}
        >
          <div
            style={{
              padding: 'clamp(32px, 4vw, 48px)',
              borderRadius: 28,
              background: 'var(--black)',
              position: 'relative',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 24px 70px rgba(0,0,0,0.18)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
          >
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', opacity: 0.08, borderRadius: 'inherit', zIndex: 0 }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                  {t('planName')}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(200,241,53,0.12)', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--lime)' }}>
                  {t('flatBadge')}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 3, marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.4)', paddingTop: 12, lineHeight: 1 }}>R</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(56px, 7vw, 76px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: 'white' }}>{FLAT_PRICE_ZAR}</span>
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', paddingTop: 12, lineHeight: 1 }}>{t('perMonth')}</span>
              </div>

              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, fontWeight: 300, marginBottom: 26, maxWidth: 400 }}>
                {t('planDescription')}
              </p>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 26 }} />

              <ul className="flat-features" style={{ listStyle: 'none', marginBottom: 34 }}>
                {features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5 }}>
                    <Check />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => window.dispatchEvent(new CustomEvent('omeru:invite'))}
                style={{ display: 'block', textAlign: 'center', width: '100%', padding: '15px 20px', borderRadius: 100, background: 'var(--lime)', color: 'var(--black)', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s ease, transform 0.15s ease', marginBottom: 12 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lime-dark)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lime)'; (e.currentTarget as HTMLElement).style.transform = ''; }}
              >
                {t('cta')}
              </button>
              <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.03em' }}>
                {t('note')}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          style={{ textAlign: 'center', marginTop: 36, fontSize: 13, color: 'var(--mid-gray)', fontWeight: 300, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}
        >
          {t('footerNote')}
        </motion.p>
      </div>
      </GenieReveal>

      <style>{`
        .flat-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 18px;
        }
        @media (max-width: 560px) {
          .flat-features { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
