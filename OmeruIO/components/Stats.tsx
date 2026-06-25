'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslations } from 'next-intl';

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * to));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(to);
    };
    requestAnimationFrame(tick);
  }, [inView, to]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const statValues = [
  { value: 47, suffix: 'M+' },
  { value: 7,  suffix: '%'  },
  { value: 24, suffix: 'h'  },
  { value: 3,  suffix: '×'  },
];

export default function Stats() {
  const t = useTranslations('Stats');
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true });

  const items = statValues.map((s, i) => ({
    ...s,
    label: t(`items.${i}.label`),
    sub: t(`items.${i}.sub`),
  }));

  return (
    <section ref={ref} style={{ padding: 'clamp(60px, 8vw, 100px) 0' }}>
      <div className="container">
        <div style={{
          background: 'var(--black)',
          borderRadius: 'clamp(16px, 2.5vw, 28px)',
          padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 64px)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', opacity: 0.08, borderRadius: 'inherit' }} />
          <div style={{ position: 'absolute', top: '-30%', right: '-8%', width: '55%', height: '160%', background: 'radial-gradient(ellipse at center, rgba(200,241,53,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: 'clamp(32px, 5vw, 52px)' }}>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} style={{ marginBottom: 16 }}>
                <span className="pill" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}>
                  {t('pill')}
                </span>
              </motion.div>
              <motion.h2
                className="display-lg" style={{ color: 'white', maxWidth: 480 }}
                initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.08 }}
              >
                {t('heading')}<br />
                <span style={{ color: 'var(--lime)' }}>{t('headingAccent')}</span>
              </motion.h2>
            </div>

            <div className="stats-grid">
              {items.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  style={{ padding: 'clamp(20px, 3vw, 32px)', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                >
                  <div className="stat-number" style={{ color: i === 0 ? 'var(--lime)' : 'white', marginBottom: 8 }}>
                    <CountUp to={s.value} suffix={s.suffix} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.65)', marginBottom: 4, lineHeight: 1.4 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>{s.sub}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 860px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0; }
          .stats-grid > div { border-left: none !important; border-top: 1px solid rgba(255,255,255,0.06); }
          .stats-grid > div:nth-child(even) { border-left: 1px solid rgba(255,255,255,0.06) !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
          .stats-grid > div:nth-child(even) { border-left: none !important; }
        }
      `}</style>
    </section>
  );
}
