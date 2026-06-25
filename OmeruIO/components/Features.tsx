'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import GenieReveal from '@/components/GenieReveal';
import { useTranslations } from 'next-intl';

const featureIcons = [
  <svg key="0" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg key="1" width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 10h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg key="2" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg key="3" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.63a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg key="4" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>,
  <svg key="5" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
];

const highlightIndex = 0;

function FeatureCard({ title, body, badge, icon, highlight, index }: { title: string; body: string; badge: string; icon: React.ReactNode; highlight: boolean; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: (index % 3) * 0.08 }}
    >
      <div
        style={{ background: 'white', borderRadius: 18, padding: 'clamp(22px, 3vw, 30px)', border: '1px solid rgba(0,0,0,0.06)', height: '100%', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.07)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: highlight ? 'var(--lime)' : 'var(--warm-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--black)' }}>
            {icon}
          </div>
          <span style={{ background: 'var(--warm-gray)', borderRadius: 100, padding: '4px 10px', fontSize: 11, fontWeight: 500, color: 'var(--mid-gray)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{badge}</span>
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 1.6vw, 19px)', fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 8, lineHeight: 1.3 }}>{title}</h3>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--mid-gray)', fontWeight: 300 }}>{body}</p>
      </div>
    </motion.div>
  );
}

export default function Features() {
  const t = useTranslations('Features');
  const titleRef = useRef<HTMLDivElement>(null);
  const inView = useInView(titleRef, { once: true });

  const items = [0, 1, 2, 3, 4, 5].map((i) => ({
    title: t(`items.${i}.title`),
    body: t(`items.${i}.body`),
    badge: t(`items.${i}.badge`),
    icon: featureIcons[i],
    highlight: i === highlightIndex,
  }));

  return (
    <section id="features" style={{ padding: 'clamp(80px, 10vw, 120px) 0', background: 'var(--warm-gray)', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'multiply', opacity: 0.08 }} />
      <GenieReveal>
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div ref={titleRef} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(36px, 5vw, 56px)', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} style={{ marginBottom: 16 }}>
              <span className="pill">{t('pill')}</span>
            </motion.div>
            <motion.h2 className="display-lg" initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.08 }}>
              {t('heading').split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.16 }}
            style={{ fontSize: 15, color: 'var(--mid-gray)', maxWidth: 320, lineHeight: 1.7, fontWeight: 300 }}
          >
            {t('subtext')}
          </motion.p>
        </div>

        <div className="features-grid">
          {items.map((f, i) => <FeatureCard key={i} {...f} index={i} />)}
        </div>
      </div>
      </GenieReveal>

      <style>{`
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(10px, 1.5vw, 16px);
        }
        @media (max-width: 900px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .features-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
