'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const testimonials = [
  {
    name: 'Thandi Mokoena',
    role: 'Owner, Thandi\'s Kitchen',
    location: 'Soweto, GP',
    quote: 'I was selling pap and chakalaka through a simple WhatsApp group — no order tracking, no payments, just chaos. Omeru changed everything. Now customers browse, pick, and pay without calling me. I went from R4k to R18k a month in two months.',
    metric: 'R18,000/mo',
    metricLabel: 'after 2 months',
    color: '#2d1f0a',
  },
  {
    name: 'Sipho Dlamini',
    role: 'Founder, Cape Biltong Co.',
    location: 'Cape Town, WC',
    quote: 'My biggest problem before Omeru was people ordering, then not paying. The payment integration means they only get the order confirmation once they\'ve paid. My cash flow is night and day compared to before.',
    metric: '0 unpaid',
    metricLabel: 'orders this month',
    color: '#0a1f2d',
  },
  {
    name: 'Lerato Sithole',
    role: 'Maker, Ndebele Art House',
    location: 'Polokwane, LP',
    quote: 'I\'m not a tech person. I thought "online store" meant I needed a website and a developer. Omeru had me live in three hours and I made my first sale the same day. My customers didn\'t have to do anything new — they already had WhatsApp.',
    metric: '3 hours',
    metricLabel: 'setup to first sale',
    color: '#1f0a2d',
  },
  {
    name: 'Amir Patel',
    role: 'Director, Patel Spice Works',
    location: 'Durban, KZN',
    quote: 'We sell to restaurants and home cooks. The broadcast feature on Growth is incredible — we sent one message about a new chilli blend and had 23 orders in 40 minutes. That\'s better than any marketing I\'ve done.',
    metric: '23 orders',
    metricLabel: 'from one broadcast',
    color: '#1a2d0a',
  },
];

function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  return (
    <div
      style={{
        background: t.color,
        borderRadius: 20,
        padding: 'clamp(24px, 3vw, 36px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Quote mark */}
      <div style={{
        fontFamily: 'Georgia, serif',
        fontSize: 64,
        lineHeight: 0.7,
        color: 'rgba(255,255,255,0.12)',
        userSelect: 'none',
        marginBottom: -8,
      }}>&ldquo;</div>

      <p style={{
        fontSize: 'clamp(14px, 1.5vw, 16px)',
        lineHeight: 1.7,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: 300,
        flex: 1,
      }}>
        {t.quote}
      </p>

      {/* Metric callout */}
      <div style={{
        background: 'rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(20px, 2.5vw, 26px)',
            fontWeight: 800,
            color: 'var(--lime)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}>{t.metric}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{t.metricLabel}</div>
        </div>
      </div>

      {/* Author */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {t.name.charAt(0)}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'white', lineHeight: 1.3 }}>{t.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{t.role} · {t.location}</div>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const titleRef = useRef<HTMLDivElement>(null);
  const inView = useInView(titleRef, { once: true });

  return (
    <section id="merchants" style={{ padding: 'clamp(80px, 10vw, 120px) 0', background: 'var(--off-white)' }}>
      <div className="container">
        {/* Header — mirrors "Popular Destinations" layout */}
        <div ref={titleRef} style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 'clamp(36px, 5vw, 56px)',
          flexWrap: 'wrap',
          gap: 24,
        }}>
          <div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} style={{ marginBottom: 16 }}>
              <span className="pill">Merchant stories</span>
            </motion.div>
            <motion.h2
              className="display-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.08 }}
            >
              Real merchants.<br />
              <span style={{ color: 'var(--lime-dark)' }}>Real revenue.</span>
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}
          >
            <p style={{
              fontSize: 15, color: 'var(--mid-gray)', maxWidth: 300,
              lineHeight: 1.65, fontWeight: 300, textAlign: 'right',
            }}>
              Merchants who applied for early access and went live in under 24 hours.
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('omeru:invite'))}
              className="btn-lime"
              style={{ fontSize: 13, padding: '10px 20px' }}
              data-hover
            >
              Join them →
            </button>
          </motion.div>
        </div>

        {/* Cards grid */}
        <div className="testimonials-grid">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} t={t} />
          ))}
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
