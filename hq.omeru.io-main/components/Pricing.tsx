'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import GenieReveal from '@/components/GenieReveal';

const tiers = [
  {
    name: 'Starter',
    price: 199,
    commission: '5%',
    description: 'For new merchants proving the concept.',
    featured: false,
    features: [
      'Up to 5 products',
      '5% commission per sale',
      'WhatsApp store + kitchen sink',
      'Real-time order alerts',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Apply for Starter',
    note: '5-product cap · upgrade when ready',
  },
  {
    name: 'Growth',
    price: 499,
    commission: '3.5%',
    description: 'For merchants ready to scale their catalogue.',
    featured: true,
    features: [
      'Up to 15 products',
      '3.5% commission per sale',
      'Everything in Starter',
      'Broadcasts × 2 per month',
      'Promotions & discount codes',
      'Full analytics dashboard',
    ],
    cta: 'Apply for Growth',
    note: 'Most popular',
  },
  {
    name: 'Pro',
    price: 999,
    commission: '2.5%',
    description: 'For established merchants scaling to multiple locations.',
    featured: false,
    features: [
      'Unlimited products',
      '2.5% commission per sale',
      'Everything in Growth',
      'Unlimited broadcasts + scheduling',
      'Multi-location (up to 3)',
      'Services module',
      'Real-time analytics + export',
    ],
    cta: 'Apply for Pro',
    note: 'Full platform access',
  },
];

function Check({ dark }: { dark?: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="7.5" cy="7.5" r="7.5" fill={dark ? 'rgba(200,241,53,0.14)' : 'rgba(0,0,0,0.06)'} />
      <path d="M4.5 7.5l2 2 4-4" stroke={dark ? 'var(--lime)' : 'var(--black)'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Pricing() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <section id="pricing" ref={ref} style={{ padding: 'clamp(80px, 10vw, 120px) 0' }}>
      <GenieReveal>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 5vw, 56px)' }}>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} style={{ marginBottom: 16 }}>
            <span className="pill">Pricing</span>
          </motion.div>
          <motion.h2 className="display-lg" initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.08 }}>
            Grow into the plan<br />
            <span style={{ color: 'var(--lime-dark)' }}>that fits your GMV.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.16 }}
            style={{ fontSize: 15, color: 'var(--mid-gray)', marginTop: 14, fontWeight: 300, maxWidth: 400, margin: '14px auto 0', lineHeight: 1.65 }}
          >
            All prices in ZAR. Commission only on successful sales — Omeru wins when you win.
          </motion.p>
        </div>

        <div className="pricing-grid">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.12 + i * 0.1 }}
            >
              <div
                style={{
                  padding: 'clamp(28px, 3.5vw, 40px)',
                  borderRadius: 24,
                  background: tier.featured ? 'var(--black)' : 'white',
                  border: tier.featured ? 'none' : '1px solid rgba(0,0,0,0.07)',
                  position: 'relative',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  height: '100%',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
              >
                {tier.featured && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', opacity: 0.08, borderRadius: 'inherit', zIndex: 0 }} />
                )}
                {tier.featured && (
                  <div style={{
                    position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', zIndex: 2,
                    background: 'var(--lime)', color: 'var(--black)',
                    borderRadius: 100, padding: '3px 14px',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
                    textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>Most popular</div>
                )}

                <div style={tier.featured ? { position: 'relative', zIndex: 1 } : {}}>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: tier.featured ? 'rgba(255,255,255,0.45)' : 'var(--mid-gray)' }}>
                    {tier.name}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: tier.featured ? 'rgba(255,255,255,0.4)' : 'var(--mid-gray)', paddingTop: 10, lineHeight: 1 }}>R</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(44px, 5vw, 56px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: tier.featured ? 'white' : 'var(--black)' }}>{tier.price}</span>
                  <span style={{ fontSize: 13, color: tier.featured ? 'rgba(255,255,255,0.35)' : 'var(--mid-gray)', paddingTop: 10, lineHeight: 1 }}>/mo</span>
                </div>

                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: tier.featured ? 'rgba(200,241,53,0.12)' : 'var(--warm-gray)',
                  borderRadius: 100, padding: '3px 10px',
                  fontSize: 11, fontWeight: 600,
                  color: tier.featured ? 'var(--lime)' : 'var(--black)',
                  marginBottom: 16,
                }}>
                  + {tier.commission} per sale
                </div>

                <p style={{ fontSize: 13, color: tier.featured ? 'rgba(255,255,255,0.4)' : 'var(--mid-gray)', lineHeight: 1.6, fontWeight: 300, marginBottom: 24 }}>
                  {tier.description}
                </p>

                <div style={{ height: 1, background: tier.featured ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', marginBottom: 24 }} />

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 32 }}>
                  {tier.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: tier.featured ? 'rgba(255,255,255,0.75)' : 'var(--dark-gray)', lineHeight: 1.5 }}>
                      <Check dark={tier.featured} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="mailto:merchants@omeru.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center',
                    padding: '13px 20px', borderRadius: 100,
                    background: tier.featured ? 'var(--lime)' : 'transparent',
                    color: 'var(--black)',
                    border: tier.featured ? 'none' : '1.5px solid rgba(0,0,0,0.15)',
                    fontWeight: 500, fontSize: 13,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    marginBottom: 10,
                  }}
                  onMouseEnter={e => { if (!tier.featured) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--black)'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)'; }}}
                  onMouseLeave={e => { if (!tier.featured) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.15)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}}
                >
                  {tier.cta}
                </a>
                <div style={{ textAlign: 'center', fontSize: 11, color: tier.featured ? 'rgba(255,255,255,0.25)' : 'var(--mid-gray)', letterSpacing: '0.03em' }}>
                  {tier.note}
                </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          style={{ textAlign: 'center', marginTop: 36, fontSize: 13, color: 'var(--mid-gray)', fontWeight: 300 }}
        >
          All plans include PayFast payment processing. Merchant payouts go directly to your SA bank account. Upgrade or downgrade at any time.
        </motion.p>
      </div>
      </GenieReveal>

      <style>{`
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(12px, 2vw, 20px);
          align-items: start;
        }
        @media (max-width: 860px) {
          .pricing-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
        }
      `}</style>
    </section>
  );
}
