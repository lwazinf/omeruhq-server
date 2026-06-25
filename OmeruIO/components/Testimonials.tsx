'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslations } from 'next-intl';

const testimonialMeta = [
  { name: 'Thandi Mokoena', role: 'Owner, Thandi\'s Kitchen', location: 'Soweto, GP', metric: 'R18,000/mo', color: '#2d1f0a' },
  { name: 'Sipho Dlamini',  role: 'Founder, Cape Biltong Co.', location: 'Cape Town, WC', metric: '0 unpaid', color: '#0a1f2d' },
  { name: 'Lerato Sithole', role: 'Maker, Ndebele Art House', location: 'Polokwane, LP', metric: '3 hours', color: '#1f0a2d' },
  { name: 'Amir Patel',     role: 'Director, Patel Spice Works', location: 'Durban, KZN', metric: '23 orders', color: '#1a2d0a' },
];

function TestimonialCard({ name, role, location, quote, metric, metricLabel, color }: { name: string; role: string; location: string; quote: string; metric: string; metricLabel: string; color: string }) {
  return (
    <div style={{ background: color, borderRadius: 20, padding: 'clamp(24px, 3vw, 36px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 64, lineHeight: 0.7, color: 'rgba(255,255,255,0.12)', userSelect: 'none', marginBottom: -8 }}>&ldquo;</div>
      <p style={{ fontSize: 'clamp(14px, 1.5vw, 16px)', lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', fontWeight: 300, flex: 1 }}>{quote}</p>
      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 800, color: 'var(--lime)', letterSpacing: '-0.03em', lineHeight: 1 }}>{metric}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{metricLabel}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
          {name.charAt(0)}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'white', lineHeight: 1.3 }}>{name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{role} · {location}</div>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const t = useTranslations('Testimonials');
  const titleRef = useRef<HTMLDivElement>(null);
  const inView = useInView(titleRef, { once: true });

  const cards = testimonialMeta.map((meta, i) => ({
    ...meta,
    quote: t(`items.${i}.quote`),
    metricLabel: t(`items.${i}.metricLabel`),
  }));

  return (
    <section id="merchants" style={{ padding: 'clamp(80px, 10vw, 120px) 0', background: 'var(--off-white)' }}>
      <div className="container">
        <div ref={titleRef} className="section-header-split" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(36px, 5vw, 56px)', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} style={{ marginBottom: 16 }}>
              <span className="pill">{t('pill')}</span>
            </motion.div>
            <motion.h2 className="display-lg" initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.08 }}>
              {t('heading')}<br />
              <span style={{ color: 'var(--lime-dark)' }}>{t('headingAccent')}</span>
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}
            className="section-sub"
            style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}
          >
            <p style={{ fontSize: 15, color: 'var(--mid-gray)', maxWidth: 300, lineHeight: 1.65, fontWeight: 300, textAlign: 'right' }}>
              {t('subtext')}
            </p>
            <button onClick={() => window.dispatchEvent(new CustomEvent('omeru:invite'))} className="btn-lime" style={{ fontSize: 13, padding: '10px 20px' }} data-hover>
              {t('joinButton')}
            </button>
          </motion.div>
        </div>

        <div className="testimonials-grid">
          {cards.map((card) => <TestimonialCard key={card.name} {...card} />)}
        </div>
      </div>

      <style>{`
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: clamp(10px, 1.5vw, 16px);
        }
        @media (max-width: 1100px) {
          .testimonials-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .testimonials-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
