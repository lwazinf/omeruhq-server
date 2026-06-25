'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import GenieReveal from '@/components/GenieReveal';
import { useTranslations } from 'next-intl';

const stepIcons = [
  <svg key="0" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg key="1" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg key="2" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg key="3" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
];

function StepCard({ title, body, number, accent, icon, index }: { title: string; body: string; number: string; accent: boolean; icon: React.ReactNode; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
      style={{ height: '100%' }}
    >
      <div
        style={{
          padding: 'clamp(24px, 3vw, 36px)',
          background: accent ? 'var(--lime)' : 'white',
          borderRadius: 20,
          border: accent ? 'none' : '1px solid rgba(0,0,0,0.06)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
        onMouseEnter={e => { if (!accent) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.07)'; }}}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: accent ? 'rgba(0,0,0,0.1)' : 'var(--warm-gray)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {icon}
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 800, color: accent ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)', lineHeight: 1, letterSpacing: '-0.04em' }}>{number}</span>
        </div>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px, 2vw, 22px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.25 }}>{title}</h3>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: accent ? 'rgba(0,0,0,0.58)' : 'var(--mid-gray)', fontWeight: 300 }}>{body}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  const t = useTranslations('HowItWorks');
  const titleRef = useRef<HTMLDivElement>(null);
  const inView = useInView(titleRef, { once: true, margin: '-60px' });

  const steps = [0, 1, 2, 3].map((i) => ({
    number: String(i + 1).padStart(2, '0'),
    title: t(`steps.${i}.title`),
    body: t(`steps.${i}.body`),
    accent: i === 1,
    icon: stepIcons[i],
  }));

  return (
    <section id="how-it-works" style={{ padding: 'clamp(80px, 10vw, 120px) 0' }}>
      <GenieReveal>
      <div className="container">
        <div ref={titleRef} style={{ marginBottom: 'clamp(40px, 6vw, 64px)' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} style={{ marginBottom: 18 }}>
            <span className="pill">{t('pill')}</span>
          </motion.div>
          <motion.h2
            className="display-lg"
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.08 }}
            style={{ maxWidth: 520 }}
          >
            {t('heading')}<br />
            <span style={{ color: 'var(--lime-dark)' }}>{t('headingAccent')}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.16 }}
            style={{ fontSize: 16, color: 'var(--mid-gray)', maxWidth: 440, marginTop: 16, lineHeight: 1.65, fontWeight: 300 }}
          >
            {t('subtext')}
          </motion.p>
        </div>

        <div className="steps-grid">
          {steps.map((step, i) => (
            <StepCard key={step.number} {...step} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          style={{
            marginTop: 'clamp(32px, 5vw, 56px)',
            background: 'var(--black)',
            borderRadius: 20,
            padding: 'clamp(28px, 4vw, 44px) clamp(24px, 4vw, 48px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', opacity: 0.08 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', marginBottom: 5 }}>
              {t('ctaHeading')}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 300 }}>
              {t('ctaSub')}
            </div>
          </div>
          <button onClick={() => window.dispatchEvent(new CustomEvent('omeru:invite'))} className="btn-lime" data-hover style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
            {t('ctaButton')}
          </button>
        </motion.div>
      </div>
      </GenieReveal>

      <style>{`
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: clamp(12px, 2vw, 20px);
        }
        @media (max-width: 960px) {
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .steps-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
