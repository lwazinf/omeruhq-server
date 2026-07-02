'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { waProductLink, waServiceLink } from '@/lib/storefront';
import { trackEvent } from '@/lib/gtag';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_in_stock: boolean;
  variants: { price: number }[];
  type: 'product';
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_min: number;
  image_url: string | null;
  type: 'service';
};

type Item = Product | Service;

function formatZAR(n: number) {
  if (n === 0) return 'Free';
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n);
}

function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const spring = { type: 'spring' as const, stiffness: 380, damping: 32 };

export default function StoreAccordion({
  products,
  services,
  storeName,
  storeHandle,
}: {
  products: Omit<Product, 'type'>[];
  services: Omit<Service, 'type'>[];
  storeName: string;
  storeHandle: string;
}) {
  const allItems: Item[] = [
    ...products.map(p => ({ ...p, type: 'product' as const })),
    ...services.map(s => ({ ...s, type: 'service' as const })),
  ];

  const filters = [
    { id: 'all', label: 'All', count: allItems.length },
    ...(products.length ? [{ id: 'products', label: 'Products', count: products.length }] : []),
    ...(services.length ? [{ id: 'services', label: 'Services', count: services.length }] : []),
  ];

  const [activeFilter, setActiveFilter] = useState('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const isReposRef = useRef(false);
  const skipScrollRef = useRef(false);
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const filtered: Item[] = activeFilter === 'all'
    ? allItems
    : activeFilter === 'products'
    ? allItems.filter(i => i.type === 'product')
    : allItems.filter(i => i.type === 'service');

  const N = filtered.length;
  // Triple the array on mobile for infinite swipe; single on desktop
  const copies = isMobile && N > 1 ? 3 : 1;

  type VisualItem = Item & { vi: number; ri: number };
  const visualItems: VisualItem[] = copies === 1
    ? filtered.map((item, i) => ({ ...item, vi: i, ri: i }))
    : Array.from({ length: copies }, (_, c) =>
        filtered.map((item, i) => ({ ...item, vi: c * N + i, ri: i }))
      ).flat();

  const safeActive = N > 0 ? Math.min(activeIndex, N - 1) : 0;
  const midOffset = copies === 1 ? 0 : Math.floor(copies / 2) * N;

  // Scroll to middle copy's active card (used after nav-arrow press)
  const scrollToActive = useCallback(() => {
    const container = scrollContainerRef.current;
    const card = cardRefs.current.get(midOffset + safeActive);
    if (!container || !card) return;
    const cardLeft = card.offsetLeft;
    const cardRight = cardLeft + card.offsetWidth;
    const visibleLeft = container.scrollLeft;
    const visibleRight = container.scrollLeft + container.offsetWidth;
    if (cardLeft < visibleLeft || cardRight > visibleRight) {
      container.scrollTo({ left: Math.max(0, cardLeft - 16), behavior: 'smooth' });
    }
  }, [safeActive, midOffset]);

  // On filter change: reset to middle copy
  useEffect(() => {
    setActiveIndex(0);
    if (copies <= 1) return;
    requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      const midCard = cardRefs.current.get(midOffset);
      if (!container || !midCard) return;
      isReposRef.current = true;
      container.scrollLeft = Math.max(0, midCard.offsetLeft - 16);
      requestAnimationFrame(() => { isReposRef.current = false; });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, copies]);

  // On nav-arrow press: scroll active card into view
  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    scrollToActive();
  }, [safeActive, scrollToActive]);

  // After scroll settles on mobile:
  //   1. Auto-advance activeIndex to whichever card is centered
  //   2. Silently reposition from copy0/copy2 back to copy1
  const handleScroll = useCallback(() => {
    if (isReposRef.current) return;
    clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container || N === 0) return;

      // Find the card whose center is closest to the viewport center
      const viewCenter = container.scrollLeft + container.offsetWidth / 2;
      let closestVi = -1;
      let closestDist = Infinity;
      cardRefs.current.forEach((el, vi) => {
        const cardCenter = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(cardCenter - viewCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closestVi = vi;
        }
      });
      if (closestVi >= 0) {
        const newRi = closestVi % N;
        if (newRi !== safeActive) {
          skipScrollRef.current = true;
          setActiveIndex(newRi);
        }
      }

      // Reposition to middle copy if drifted into outer copies
      if (copies > 1) {
        const copy0Card = cardRefs.current.get(0);
        const copy1Card = cardRefs.current.get(N);
        const copy2Card = cardRefs.current.get(2 * N);
        if (copy0Card && copy1Card && copy2Card) {
          const copy1Start = copy1Card.offsetLeft;
          const copyWidth = copy1Start - copy0Card.offsetLeft;
          const scrollLeft = container.scrollLeft;
          if (scrollLeft < copy1Start - 50) {
            isReposRef.current = true;
            container.scrollLeft = scrollLeft + copyWidth;
            requestAnimationFrame(() => { isReposRef.current = false; });
          } else if (scrollLeft >= copy2Card.offsetLeft - 50) {
            isReposRef.current = true;
            container.scrollLeft = scrollLeft - copyWidth;
            requestAnimationFrame(() => { isReposRef.current = false; });
          }
        }
      }
    }, 150);
  }, [copies, N, safeActive]);

  useEffect(() => () => clearTimeout(scrollEndTimer.current), []);

  return (
    <div>
      {/* ── Filter tabs ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
        {filters.map(f => {
          const active = f.id === activeFilter;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                position: 'relative', display: 'inline-flex', alignItems: 'center',
                padding: '7px 16px', borderRadius: 100,
                border: active ? '1.5px solid transparent' : '1.5px solid rgba(0,0,0,0.1)',
                background: 'transparent', color: active ? 'white' : 'var(--mid-gray)',
                fontFamily: active ? 'var(--font-display)' : 'inherit',
                fontSize: 13, fontWeight: active ? 700 : 400,
                letterSpacing: active ? '-0.01em' : '0', cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'color 0.2s ease, border-color 0.2s ease',
              }}
            >
              {active && (
                <motion.span layoutId="store-accordion-pill" aria-hidden
                  style={{ position: 'absolute', inset: 0, borderRadius: 100, background: 'var(--black)', zIndex: 0 }}
                  transition={spring}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                {f.label}
                <motion.span layout style={{ fontSize: 10, fontWeight: 600, background: active ? 'rgba(200,241,53,0.2)' : 'rgba(0,0,0,0.07)', color: active ? 'var(--lime)' : 'var(--mid-gray)', borderRadius: 100, padding: '1px 7px', transition: 'background 0.2s, color 0.2s' }}>{f.count}</motion.span>
              </span>
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 100, border: '1.5px solid rgba(0,0,0,0.08)', color: 'var(--mid-gray)', fontSize: 12, fontWeight: 300 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          {N} {N === 1 ? 'item' : 'items'}
        </div>
      </div>

      {N === 0 ? (
        <p style={{ fontSize: 15, color: 'var(--mid-gray)', fontWeight: 300, padding: '32px 0' }}>Nothing here yet.</p>
      ) : (
        <>
          <div className="accordion-scroll-outer" ref={scrollContainerRef} onScroll={handleScroll}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex', gap: 10, alignItems: 'stretch', overflow: 'hidden' }}
              >
                {visualItems.map((item) => {
                  const { vi, ri } = item;
                  const isActive = ri === safeActive;
                  const isHovered = hoveredCard === vi;
                  const img = item.image_url;
                  const fromPrice = item.type === 'product' && item.variants.length
                    ? Math.min(...item.variants.map(v => v.price))
                    : item.price;
                  const isService = item.type === 'service';

                  return (
                    <motion.div
                      key={vi}
                      ref={(el) => { if (el) cardRefs.current.set(vi, el); else cardRefs.current.delete(vi); }}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.42, delay: Math.min(ri * 0.055, 0.25), ease: [0.16, 1, 0.3, 1] }}
                      className={isActive ? 'accordion-card-active' : 'accordion-card-inactive'}
                      onPointerDown={(e) => { pointerDownPos.current = { x: e.clientX, y: e.clientY }; }}
                      onPointerUp={(e) => {
                        if (!pointerDownPos.current) return;
                        const dx = Math.abs(e.clientX - pointerDownPos.current.x);
                        const dy = Math.abs(e.clientY - pointerDownPos.current.y);
                        if (dx < 12 && dy < 12 && !isMobile) {
                          // Desktop only: tap to expand
                          skipScrollRef.current = true;
                          setActiveIndex(ri);
                        }
                        pointerDownPos.current = null;
                      }}
                      onPointerCancel={() => { pointerDownPos.current = null; }}
                      onMouseEnter={() => !isActive && setHoveredCard(vi)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        flexShrink: 0,
                        // Desktop: accordion widths. Mobile: overridden by CSS to equal-width.
                        width: isActive ? 'clamp(260px, 34vw, 380px)' : 'clamp(88px, 11vw, 130px)',
                        transition: 'width 0.55s cubic-bezier(0.16,1,0.3,1)',
                        cursor: isActive ? 'default' : 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      {/* ── Card image area ── */}
                      <div style={{
                        borderRadius: 20, overflow: 'hidden', position: 'relative',
                        height: 'clamp(280px, 36vw, 440px)',
                        background: isActive ? 'var(--black)' : 'var(--card-bg)',
                        transition: 'background 0.4s ease, box-shadow 0.3s ease',
                        boxShadow: isHovered && !isActive ? '0 12px 40px rgba(0,0,0,0.12)' : 'none',
                      }}>
                        {/* Texture */}
                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', zIndex: 0, opacity: isActive ? 0.06 : 0, transition: isActive ? 'opacity 0.3s ease 0.2s' : 'opacity 0.15s ease' }} />

                        {/* Image */}
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={item.name} className="card-img" style={{
                            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                            opacity: isActive ? 0.5 : isHovered ? 1 : 0.85,
                            transform: isHovered && !isActive ? 'scale(1.04)' : 'scale(1)',
                            transition: 'opacity 0.4s ease, transform 0.55s cubic-bezier(0.16,1,0.3,1)',
                          }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <motion.div animate={{ scale: isHovered && !isActive ? 1.1 : 1 }} transition={spring}
                              style={{ width: 52, height: 52, borderRadius: 14, background: isActive ? 'rgba(200,241,53,0.12)' : 'rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s ease' }}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                {isService
                                  ? <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={isActive ? 'var(--lime)' : 'var(--mid-gray)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  : <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke={isActive ? 'var(--lime)' : 'var(--mid-gray)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                }
                              </svg>
                            </motion.div>
                          </div>
                        )}

                        {/* Dark gradient — active on desktop, always on mobile */}
                        <div className="card-active-gradient" style={{
                          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
                          background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 50%, transparent 75%)',
                          opacity: isActive ? 1 : 0,
                          transition: isActive ? 'opacity 0.3s ease 0.28s' : 'opacity 0.12s ease',
                        }} />

                        {/* Type + stock badges */}
                        <div className="card-active-content" style={{
                          position: 'absolute', top: 14, left: 14, zIndex: 3,
                          display: 'flex', gap: 6,
                          opacity: isActive ? 1 : 0,
                          pointerEvents: isActive ? 'auto' : 'none',
                          transition: isActive ? 'opacity 0.25s ease 0.44s' : 'opacity 0.08s ease',
                        }}>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: isService ? 'rgba(200,241,53,0.9)' : 'rgba(255,255,255,0.9)', color: 'var(--black)', borderRadius: 8, padding: '3px 9px' }}>
                            {isService ? 'Service' : 'Product'}
                          </span>
                          {item.type === 'product' && !item.is_in_stock && (
                            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '3px 9px' }}>
                              Out of stock
                            </span>
                          )}
                        </div>

                        {/* Name + description — active on desktop, always on mobile */}
                        <div className="card-active-content" style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          padding: '0 20px 22px', zIndex: 2,
                          opacity: isActive ? 1 : 0,
                          pointerEvents: isActive ? 'auto' : 'none',
                          transition: isActive ? 'opacity 0.28s ease 0.48s' : 'opacity 0.08s ease',
                        }}>
                          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(17px,2vw,22px)', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </p>
                          {item.description && (
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 300, lineHeight: 1.55 }}>
                              {item.description.substring(0, 90)}{item.description.length > 90 ? '…' : ''}
                            </p>
                          )}
                          {isService && (
                            <p style={{ fontSize: 11, color: 'rgba(200,241,53,0.7)', marginTop: 5, fontWeight: 500 }}>
                              {formatDuration((item as Service).duration_min)}
                            </p>
                          )}
                        </div>

                        {/* Inactive label (desktop only) — vertical text */}
                        <div className="card-inactive-overlay" style={{
                          position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                          padding: '0 0 16px', zIndex: 2,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)',
                          opacity: isActive ? 0 : 1,
                          pointerEvents: isActive ? 'none' : 'auto',
                          transition: isActive ? 'opacity 0.12s ease' : 'opacity 0.28s ease 0.28s',
                        }}>
                          <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase', writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', maxHeight: 100, overflow: 'hidden', textShadow: '0 1px 6px rgba(0,0,0,0.6)', lineHeight: 1 }}>
                            {item.name}
                          </p>
                        </div>
                      </div>

                      {/* ── Below card: link + price/CTA ── */}
                      <div style={{ marginTop: 10, height: 38, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <motion.a
                          href={item.type === 'product' ? `/@${storeHandle}/products/${item.id}` : waServiceLink(item.id)}
                          rel="nofollow"
                          title={item.type === 'product' ? 'View product page' : 'Book this service'}
                          onClick={e => e.stopPropagation()}
                          whileHover={{ scale: 1.08, rotate: -8 }} whileTap={{ scale: 0.92 }} transition={spring}
                          style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}
                        >
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                            <path d="M2 12L12 2M12 2H5M12 2v7" stroke="var(--lime)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </motion.a>

                        {/* Desktop: only show full CTA when active. Mobile: always show CTA. */}
                        <motion.a
                          href={item.type === 'product' ? waProductLink(item.id) : waServiceLink(item.id)}
                          rel="nofollow"
                          onClick={e => { e.stopPropagation(); trackEvent(item.type === 'product' ? 'wa_order_click' : 'wa_book_click', { item_id: item.id, item_name: item.name, store: storeHandle }); }}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={spring}
                          className={isActive ? 'card-cta-active' : 'card-cta-inactive'}
                          style={{ flex: 1, height: 38, background: 'var(--black)', color: 'white', borderRadius: 100, padding: '0 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, boxSizing: 'border-box', overflow: 'hidden' }}
                        >
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.type === 'product' ? 'Order on WhatsApp' : 'Book on WhatsApp'}</span>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--lime)', fontSize: 14, letterSpacing: '-0.02em', flexShrink: 0 }}>
                            {formatZAR(fromPrice)}
                          </span>
                        </motion.a>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Pagination ── */}
          <motion.div layout style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
            <span style={{ fontSize: 12, color: 'var(--mid-gray)', fontWeight: 300 }}>
              <strong style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--black)' }}>{safeActive + 1}</strong>
              <span style={{ margin: '0 3px', opacity: 0.4 }}>/</span>
              <span>{N}</span>
              <span style={{ margin: '0 8px', opacity: 0.3 }}>·</span>
              <span>{storeName}</span>
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { dir: -1, icon: 'M9 2L4 7l5 5' },
                { dir: 1,  icon: 'M5 2l5 5-5 5' },
              ] as const).map(({ dir, icon }) => (
                <motion.button
                  key={dir}
                  onClick={() => setActiveIndex(i => ((i + dir) % N + N) % N)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={spring}
                  aria-label={dir === -1 ? 'Previous' : 'Next'}
                  style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.12)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d={icon} stroke="var(--black)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}

      <style>{`
        .accordion-scroll-outer {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .accordion-scroll-outer::-webkit-scrollbar { display: none; }

        /* ── Desktop accordion behaviour ── */
        .card-cta-inactive {
          /* Hidden on desktop when not the active card */
          display: none !important;
        }
        .card-cta-active { display: flex !important; }

        @media (max-width: 768px) {
          /* ── Mobile swipe carousel ── */
          .accordion-scroll-outer {
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-x;
            /* Horizontal padding so the side peek is visible */
            padding-left: 0;
            padding-right: 0;
          }
          .accordion-scroll-outer > div {
            overflow: visible !important;
            /* Side padding: peeking gap on each side */
            padding: 0 20px;
          }

          /* All cards same width so swiping reveals a full card */
          .accordion-card-active,
          .accordion-card-inactive {
            width: calc(100vw - 72px) !important;
            min-width: 220px !important;
            max-width: 360px !important;
            scroll-snap-align: center !important;
            transition: none !important;
          }

          /* Card image height: slightly taller on mobile */
          .accordion-card-active > div:first-child,
          .accordion-card-inactive > div:first-child {
            height: clamp(300px, 55vw, 380px) !important;
          }

          /* Always show full card content on mobile */
          .card-active-gradient { opacity: 1 !important; }
          .card-active-content {
            opacity: 1 !important;
            pointer-events: auto !important;
            transition: none !important;
          }
          /* Hide the vertical-text overlay on mobile */
          .card-inactive-overlay { display: none !important; }

          /* Active card: dark bg, full image opacity */
          .accordion-card-active > div:first-child { background: var(--black) !important; }
          .accordion-card-active .card-img { opacity: 0.5 !important; }

          /* Inactive card: lighter treatment */
          .accordion-card-inactive > div:first-child { background: #1a1a1a !important; }
          .accordion-card-inactive .card-img { opacity: 0.35 !important; }

          /* Always show CTA button on mobile */
          .card-cta-inactive { display: flex !important; }
          /* Inactive card CTA: dimmed */
          .accordion-card-inactive .card-cta-inactive { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
