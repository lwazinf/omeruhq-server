'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import GenieReveal from '@/components/GenieReveal';
import { useTranslations } from 'next-intl';

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ delay: index * 0.04, duration: 0.5 }}
      style={{
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        background: open ? 'white' : 'transparent',
        borderRadius: open ? 12 : 0,
        transition: 'background 0.25s ease, border-radius 0.25s ease',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: open ? 'clamp(16px, 2vw, 22px) clamp(16px, 2vw, 22px) clamp(8px, 1vw, 12px)' : 'clamp(18px, 2.5vw, 24px) 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: open ? 'var(--lime-dark)' : 'rgba(0,0,0,0.25)', minWidth: 24, paddingTop: 3, transition: 'color 0.2s', letterSpacing: '0.04em' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(15px, 1.7vw, 18px)', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--black)', lineHeight: 1.3 }}>
            {q}
          </span>
        </div>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: 28, height: 28, borderRadius: '50%', background: open ? 'var(--lime)' : 'var(--warm-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="var(--black)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="a"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ padding: '0 clamp(16px, 2vw, 22px) clamp(18px, 2.5vw, 22px) clamp(16px, 2vw, 22px)', paddingLeft: 'calc(14px + 24px + clamp(16px, 2vw, 22px))', fontSize: 14, lineHeight: 1.78, color: '#444', fontWeight: 300, maxWidth: 680 }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const t = useTranslations('FAQ');
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true });

  const items = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
    q: t(`items.${i}.q`),
    a: t(`items.${i}.a`),
  }));

  return (
    <section id="faq" ref={ref} style={{ padding: 'clamp(80px, 10vw, 120px) 0', background: 'var(--warm-gray)', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'multiply', opacity: 0.08 }} />
      <GenieReveal>
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="faq-layout">
          <div className="faq-sidebar">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} style={{ marginBottom: 16 }}>
              <span className="pill">{t('pill')}</span>
            </motion.div>
            <motion.h2
              className="display-md"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.08 }}
              style={{ marginBottom: 16 }}
            >
              {t('heading')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.16 }}
              style={{ fontSize: 14, color: 'var(--mid-gray)', lineHeight: 1.7, fontWeight: 300, marginBottom: 28 }}
            >
              {t('contactPrompt')}{' '}
              <a href="mailto:hello@omeru.io" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--black)', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid rgba(0,0,0,0.2)' }}>
                hello@omeru.io
              </a>
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.22 }}>
              <button onClick={() => window.dispatchEvent(new CustomEvent('omeru:invite'))} className="btn-lime" style={{ fontSize: 14, padding: '12px 22px' }} data-hover>
                {t('applyButton')}
              </button>
            </motion.div>
          </div>

          <div style={{ background: 'var(--off-white)', borderRadius: 20, padding: 'clamp(16px, 3vw, 32px)' }}>
            {items.map((item, i) => (
              <FAQItem key={i} {...item} index={i} />
            ))}
          </div>
        </div>
      </div>
      </GenieReveal>

      <style>{`
        .faq-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: clamp(40px, 7vw, 80px);
          align-items: start;
        }
        .faq-sidebar { position: sticky; top: 100px; }
        @media (max-width: 800px) {
          .faq-layout { grid-template-columns: 1fr; gap: 36px; }
          .faq-sidebar { position: static; }
        }
      `}</style>
    </section>
  );
}
