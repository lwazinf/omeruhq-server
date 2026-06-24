'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function StatStrip() {
  const stats = [
    { value: '47M+', label: 'WhatsApp users in SA' },
    { value: '< 24h', label: 'Invite to first sale' },
    { value: '3×', label: 'Higher open vs email' },
    { value: 'R199', label: 'Starter from /mo' },
  ];
  return (
    <div style={{ background: 'var(--black)', borderTop: '1px solid rgba(0,0,0,0.07)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', opacity: 0.08 }} />
      <div className="stat-strip-inner" style={{ position: 'relative', zIndex: 1 }}>
        {stats.map((s, i) => (
          <div
            key={s.value}
            style={{
              padding: 'clamp(16px, 2.5vw, 26px) clamp(14px, 2vw, 24px)',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.8vw, 32px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: 'white', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  const outerRef    = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const dotRef      = useRef<HTMLSpanElement>(null);
  const [slide, setSlide] = useState(0);

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['end end', 'start start'],
  });

  const contentOpacity = useTransform(scrollYProgress, [0, 0.4, 0.75, 1], [1, 1, 0.5, 0]);

  useEffect(() => {
    if (dotRef.current) {
      gsap.to(dotRef.current, { opacity: 0.1, duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }
    if (headlineRef.current) {
      const words = headlineRef.current.querySelectorAll('.hw');
      gsap.fromTo(words,
        { y: '108%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 1.0, stagger: 0.055, ease: 'power3.out', delay: 0.1 }
      );
    }
  }, []);

  const isMerchant = slide === 0;

  const merchantLeft = {
    pill: 'WhatsApp Commerce · South Africa',
    headline: ['SELL MORE.', 'WHATSAPP', 'ALREADY.'],
    headlineAccent: 1,
    body: 'Zero-friction commerce for South African merchants. Customers browse and buy without ever leaving WhatsApp.',
    sub: 'Powered by Stitch · Invite-only · From R199/mo',
    primaryLabel: 'Apply as a merchant',
    primaryHref: 'mailto:merchants@omeru.io',
    secondaryLabel: 'Shop on WhatsApp',
    secondaryHref: 'https://wa.me/27750656348?text=Hi%2C+I%27d+like+to+browse+stores+on+Omeru',
  };
  const customerLeft = {
    pill: 'Shop Local · No App Needed',
    headline: ['SHOP LOCAL.', 'NO APP.', 'JUST WA.'],
    headlineAccent: 1,
    body: 'Discover South African merchants and buy from them directly on WhatsApp. No downloads, no accounts — just tap and shop.',
    sub: 'Secure checkout · PayFast · Works on any phone',
    primaryLabel: 'Open the bot',
    primaryHref: 'https://wa.me/27750656348?text=Hi%2C+I%27d+like+to+shop',
    secondaryLabel: 'Are you a merchant?',
    secondaryHref: 'mailto:merchants@omeru.io',
  };
  const left = isMerchant ? merchantLeft : customerLeft;

  return (
    <div style={{ position: 'relative' }} id="hero">
      <div
        className="hero-outer"
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Tile pattern */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: "url('/bg-tile.jpg')",
          backgroundSize: '500px 333px',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'multiply',
          opacity: 0.10,
        }} />

        {/* Ambient bg glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse 65% 55% at 75% 45%, rgba(200,241,53,0.13) 0%, transparent 65%)',
        }} />

        {/* Main grid */}
        <motion.div style={{ opacity: contentOpacity }} className="hero-main-grid">

          {/* ── LEFT column ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${slide}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="hero-left"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 28, zIndex: 1, position: 'relative' }}
            >
              {/* Pill */}
              <div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '5px 13px', borderRadius: 100,
                  border: '1px solid rgba(0,0,0,0.12)',
                  background: 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(8px)',
                  fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                  color: 'var(--mid-gray)',
                }}>
                  <span ref={dotRef} style={{ width: 6, height: 6, borderRadius: '50%', background: '#25D366', display: 'block', flexShrink: 0 }} />
                  {left.pill}
                </span>
              </div>

              {/* Headline */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div ref={headlineRef} style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(44px, 7vw, 108px)',
                  fontWeight: 800,
                  lineHeight: 0.9,
                  letterSpacing: '-0.035em',
                  color: 'var(--black)',
                }}>
                  {left.headline.map((line, i) => (
                    <div key={i} style={{ overflow: 'hidden', paddingBottom: '0.08em' }}>
                      <span className="hw" style={{ display: 'inline-block', color: i === left.headlineAccent ? 'var(--lime-dark)' : 'var(--black)' }}>
                        {line}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body + CTAs + Pagination */}
              <div>
                <p style={{ fontSize: 'clamp(13px, 1.3vw, 15px)', lineHeight: 1.7, color: 'var(--mid-gray)', maxWidth: 340, marginBottom: 6, fontWeight: 300 }}>
                  {left.body}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.28)', marginBottom: 24, fontWeight: 300 }}>
                  {left.sub}
                </p>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
                  <a
                    href={left.primaryHref}
                    target={left.primaryHref.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    data-hover
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--black)', color: 'white', borderRadius: 12, padding: 'clamp(12px, 1.5vw, 15px) clamp(16px, 2vw, 22px)', fontWeight: 600, fontSize: 'clamp(13px, 1.2vw, 14px)', textDecoration: 'none', transition: 'background 0.2s, transform 0.15s', whiteSpace: 'nowrap' as const }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#222'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--black)'; (e.currentTarget as HTMLElement).style.transform = ''; }}
                  >
                    {left.primaryLabel}
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </a>

                  <a
                    href={left.secondaryHref}
                    target={left.secondaryHref.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    data-hover
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--lime)', color: 'var(--black)', borderRadius: 12, padding: 'clamp(12px, 1.5vw, 15px) clamp(16px, 2vw, 22px)', fontWeight: 600, fontSize: 'clamp(13px, 1.2vw, 14px)', textDecoration: 'none', transition: 'background 0.2s, transform 0.15s', whiteSpace: 'nowrap' as const }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#a8d420'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lime)'; (e.currentTarget as HTMLElement).style.transform = ''; }}
                  >
                    {isMerchant && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L0 24l6.335-1.509A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                      </svg>
                    )}
                    {left.secondaryLabel}
                  </a>
                </div>

                {/* Pagination */}
                <div ref={outerRef} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {[0, 1].map(idx => (
                    <button
                      key={idx}
                      onClick={() => setSlide(idx)}
                      aria-label={idx === 0 ? 'Merchant view' : 'Customer view'}
                      style={{ width: 38, height: 38, borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.15)', background: slide === idx ? 'var(--black)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s' }}
                      onMouseEnter={e => { if (slide !== idx) (e.currentTarget as HTMLElement).style.borderColor = 'var(--black)'; }}
                      onMouseLeave={e => { if (slide !== idx) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.15)'; }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        {idx === 0
                          ? <path d="M8 2L4 6l4 4" stroke={slide === idx ? 'white' : 'var(--black)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          : <path d="M4 2l4 4-4 4" stroke={slide === idx ? 'white' : 'var(--black)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        }
                      </svg>
                    </button>
                  ))}
                  <span style={{ fontSize: 12, color: 'var(--mid-gray)', fontWeight: 400, letterSpacing: '0.05em' }}>
                    {slide + 1} / 2
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── RIGHT — one image per slide, identical dimensions ── */}
          <div className="hero-placeholders">
            <AnimatePresence mode="wait">
              <motion.div
                key={`hero-img-${slide}`}
                className="hero-rect"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <Image
                  src={slide === 0 ? '/omeru-hero.png' : '/hero-phone.png'}
                  alt={slide === 0 ? 'Omeru on WhatsApp' : 'Omeru merchant'}
                  fill
                  priority
                  style={{ objectFit: 'contain' }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

        </motion.div>
      </div>

      <div style={{ position: 'relative', zIndex: 2 }} >
        <StatStrip />
      </div>

      <style>{`
        .hero-outer {
          height: 100svh;
          min-height: 580px;
          overflow: hidden;
        }

        .hero-main-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: clamp(28px, 4vw, 56px);
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
          padding: clamp(90px, 12vh, 120px) clamp(20px, 4vw, 48px) clamp(28px, 4vh, 44px);
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .hero-placeholders {
          position: relative;
          height: clamp(480px, 75vh, 780px);
        }

        /* Fills the full placeholder — both slides are identical dimensions */
        .hero-rect {
          position: absolute;
          inset: 0;
          -webkit-mask-image: linear-gradient(to bottom, black 0%, black 95%, transparent 100%);
          mask-image: linear-gradient(to bottom, black 0%, black 95%, transparent 100%);
        }

        .stat-strip-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 clamp(20px, 4vw, 48px);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }

        @media (max-width: 900px) {
          /* Let hero be taller than viewport so image isn't clipped */
          .hero-outer {
            height: auto;
            min-height: 100svh;
            overflow: visible;
          }

          .hero-main-grid {
            grid-template-columns: 1fr;
            gap: 0;
            padding-bottom: 0;
          }

          /* Center all text content on mobile */
          .hero-left {
            align-items: center;
            text-align: center;
          }
          .hero-left p {
            max-width: 100% !important;
          }
          .hero-left > div:last-child > div {
            justify-content: center;
          }

          .hero-placeholders {
            height: clamp(340px, 90vw, 520px);
            width: 100%;
          }
        }

        @media (max-width: 600px) {
          .hero-placeholders {
            height: clamp(300px, 95vw, 420px);
          }
          .stat-strip-inner {
            grid-template-columns: repeat(2, 1fr);
          }
          .stat-strip-inner > div:nth-child(2n) {
            border-right: none !important;
          }
          .stat-strip-inner > div:nth-child(n+3) {
            border-top: 1px solid rgba(0,0,0,0.07);
          }
        }
      `}</style>
    </div>
  );
}
