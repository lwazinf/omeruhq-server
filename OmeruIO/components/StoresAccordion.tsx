'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type Store = {
  handle: string;
  trading_name: string;
  description: string | null;
  image_url: string | null;
  manual_closed: boolean;
  store_category: string | null;
  product_count: number;
  service_count: number;
};

const spring = { type: 'spring' as const, stiffness: 380, damping: 32 };

export default function StoresAccordion({ stores }: { stores: Store[] }) {
  const categories = ['All', ...Array.from(new Set(stores.map(s => s.store_category || 'More stores')))];

  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const touchStartX = useRef(0);

  const q = search.trim().toLowerCase();

  const filtered = stores
    .filter(s => activeFilter === 'All' || (s.store_category || 'More stores') === activeFilter)
    .filter(s => !q || s.trading_name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q));

  const safeActive = Math.min(activeIndex, filtered.length - 1);

  return (
    <div>
      {/* ── Search input ── */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--mid-gray)' }}>
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <input
          type="search"
          placeholder="Search stores…"
          value={search}
          onChange={e => { setSearch(e.target.value); setActiveIndex(0); }}
          style={{ width: '100%', boxSizing: 'border-box', height: 42, paddingLeft: 38, paddingRight: 14, borderRadius: 100, border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', fontSize: 14, color: 'var(--black)', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
          onFocus={e => { e.target.style.borderColor = 'var(--black)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.1)'; }}
        />
      </div>

      {/* ── Filter tabs with sliding pill background ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
        {categories.map(cat => {
          const active = cat === activeFilter;
          const count = cat === 'All' ? stores.length : stores.filter(s => (s.store_category || 'More stores') === cat).length;
          return (
            <button
              key={cat}
              onClick={() => { setActiveFilter(cat); setActiveIndex(0); }}
              style={{
                position: 'relative',
                display: 'inline-flex', alignItems: 'center',
                padding: '7px 16px', borderRadius: 100,
                border: active ? '1.5px solid transparent' : '1.5px solid rgba(0,0,0,0.1)',
                background: 'transparent',
                color: active ? 'white' : 'var(--mid-gray)',
                fontFamily: active ? 'var(--font-display)' : 'inherit',
                fontSize: 13, fontWeight: active ? 700 : 400,
                letterSpacing: active ? '-0.01em' : '0',
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'color 0.2s ease, border-color 0.2s ease',
              }}
            >
              {active && (
                <motion.span
                  layoutId="stores-accordion-pill"
                  aria-hidden
                  style={{ position: 'absolute', inset: 0, borderRadius: 100, background: 'var(--black)', zIndex: 0 }}
                  transition={spring}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                {cat}
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  background: active ? 'rgba(200,241,53,0.2)' : 'rgba(0,0,0,0.07)',
                  color: active ? 'var(--lime)' : 'var(--mid-gray)',
                  borderRadius: 100, padding: '1px 7px',
                  transition: 'background 0.2s, color 0.2s',
                }}>{count}</span>
              </span>
            </button>
          );
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 100, border: '1.5px solid rgba(0,0,0,0.08)', color: 'var(--mid-gray)', fontSize: 12, fontWeight: 300 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          {filtered.length} {filtered.length === 1 ? 'store' : 'stores'}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontSize: 15, color: 'var(--mid-gray)', fontWeight: 300, padding: '32px 0' }}>
          {q ? `No stores match "${search}".` : 'No stores in this category yet.'}
        </p>
      ) : (
        <>
          {/* ── Accordion track ── */}
          <div
            className="accordion-scroll-outer"
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              const delta = touchStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(delta) < 50) return;
              if (delta > 0) setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
              else setActiveIndex(i => Math.max(i - 1, 0));
            }}
          >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ display: 'flex', gap: 10, alignItems: 'stretch', overflow: 'hidden' }}
            >
              {filtered.map((store, i) => {
                const isActive = i === safeActive;
                const isHovered = hoveredCard === store.handle;
                const isOpen = !store.manual_closed;
                const img = store.image_url;
                const itemCount = store.product_count + store.service_count;

                return (
                  <motion.div
                    key={store.handle}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.42, delay: i * 0.055, ease: [0.16, 1, 0.3, 1] }}
                    className={isActive ? 'accordion-card-active' : 'accordion-card-inactive'}
                    onClick={() => setActiveIndex(i)}
                    onMouseEnter={() => !isActive && setHoveredCard(store.handle)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      flexShrink: 0,
                      width: isActive ? 'clamp(260px, 34vw, 400px)' : 'clamp(88px, 11vw, 130px)',
                      transition: 'width 0.55s cubic-bezier(0.16,1,0.3,1)',
                      cursor: isActive ? 'default' : 'pointer',
                    }}
                  >
                    {/* ── Card ── */}
                    <div style={{
                      borderRadius: 20, overflow: 'hidden', position: 'relative',
                      height: 'clamp(280px, 36vw, 440px)',
                      background: isActive ? 'var(--black)' : 'var(--card-bg)',
                      transition: 'background 0.4s ease, box-shadow 0.3s ease',
                      boxShadow: isHovered && !isActive ? '0 12px 40px rgba(0,0,0,0.12)' : 'none',
                    }}>
                      {/* Tile texture — always mounted */}
                      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', zIndex: 0, opacity: isActive ? 0.06 : 0, transition: isActive ? 'opacity 0.3s ease 0.2s' : 'opacity 0.15s ease' }} />

                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={store.trading_name}
                          style={{
                            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                            opacity: isActive ? 0.5 : isHovered ? 1 : 0.85,
                            transform: isHovered && !isActive ? 'scale(1.04)' : 'scale(1)',
                            transition: 'opacity 0.4s ease, transform 0.55s cubic-bezier(0.16,1,0.3,1)',
                          }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <motion.div
                            animate={{ scale: isHovered && !isActive ? 1.12 : 1 }}
                            transition={spring}
                            style={{ width: 52, height: 52, borderRadius: 14, background: isActive ? 'rgba(200,241,53,0.12)' : 'rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s ease' }}
                          >
                            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                              <path d="M3 9C3 5.686 5.686 3 9 3s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" fill={isActive ? 'var(--lime)' : 'var(--mid-gray)'}/>
                              <path d="M9 6v6M6 9h6" stroke={isActive ? 'var(--black)' : 'var(--card-bg)'} strokeWidth="1.6" strokeLinecap="round"/>
                            </svg>
                          </motion.div>
                        </div>
                      )}

                      {/* Active dark gradient */}
                      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.25) 50%, transparent 75%)', opacity: isActive ? 1 : 0, transition: isActive ? 'opacity 0.3s ease 0.28s' : 'opacity 0.12s ease' }} />

                      {/* Active badges — top left, delayed */}
                      <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 3, display: 'flex', gap: 6, opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none', transition: isActive ? 'opacity 0.25s ease 0.44s' : 'opacity 0.08s ease' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: isOpen ? 'rgba(200,241,53,0.9)' : 'rgba(255,255,255,0.18)', color: isOpen ? 'var(--black)' : 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '3px 9px' }}>
                          {isOpen ? 'Open' : 'Closed'}
                        </span>
                        {store.store_category && (
                          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', borderRadius: 8, padding: '3px 9px', border: '1px solid rgba(255,255,255,0.12)' }}>
                            {store.store_category}
                          </span>
                        )}
                      </div>

                      {/* Active text — bottom, longest delay */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 22px', zIndex: 2, opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none', transition: isActive ? 'opacity 0.28s ease 0.48s' : 'opacity 0.08s ease' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(17px,2vw,23px)', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {store.trading_name}
                        </p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: store.description ? 6 : 0 }}>
                          @{store.handle}{itemCount > 0 && ` · ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
                        </p>
                        {store.description && (
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 300, lineHeight: 1.55 }}>
                            {store.description.substring(0, 90)}{store.description.length > 90 ? '…' : ''}
                          </p>
                        )}
                      </div>

                      {/* Inactive layer — gradient + vertical name */}
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 16px', zIndex: 2, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)', opacity: isActive ? 0 : 1, pointerEvents: isActive ? 'none' : 'auto', transition: isActive ? 'opacity 0.12s ease' : 'opacity 0.28s ease 0.28s' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase', writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', maxHeight: 100, overflow: 'hidden', textShadow: '0 1px 6px rgba(0,0,0,0.6)', lineHeight: 1 }}>
                          {store.trading_name}
                        </p>
                      </div>
                    </div>

                    {/* ── Below card — fixed 38px ── */}
                    <div style={{ marginTop: 10, height: 38, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <motion.div
                        whileHover={{ scale: 1.08, rotate: -8 }}
                        whileTap={{ scale: 0.92 }}
                        transition={spring}
                        style={{ flexShrink: 0 }}
                      >
                        <Link
                          href={`/@${store.handle}`}
                          onClick={e => e.stopPropagation()}
                          style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                            <path d="M2 12L12 2M12 2H5M12 2v7" stroke="var(--lime)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Link>
                      </motion.div>

                      {isActive ? (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          transition={spring}
                          style={{ flex: 1 }}
                        >
                          <Link
                            href={`/@${store.handle}`}
                            onClick={e => e.stopPropagation()}
                            style={{ width: '100%', height: 38, background: 'var(--black)', color: 'white', borderRadius: 100, padding: '0 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, boxSizing: 'border-box' }}
                          >
                            <span>Visit store</span>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: '-0.01em' }}>
                              @{store.handle}
                            </span>
                          </Link>
                        </motion.div>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--black)', letterSpacing: '-0.01em', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {store.trading_name}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
          </div>{/* end accordion-scroll-outer */}

          {/* ── Pagination ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
            <span style={{ fontSize: 12, color: 'var(--mid-gray)', fontWeight: 300 }}>
              <strong style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--black)' }}>{safeActive + 1}</strong>
              <span style={{ margin: '0 3px', opacity: 0.4 }}>/</span>
              <span>{filtered.length}</span>
              <span style={{ margin: '0 8px', opacity: 0.3 }}>·</span>
              <span>Omeru stores</span>
            </span>

            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { dir: -1, icon: 'M9 2L4 7l5 5', disabled: safeActive === 0 },
                { dir: 1,  icon: 'M5 2l5 5-5 5', disabled: safeActive === filtered.length - 1 },
              ] as const).map(({ dir, icon, disabled }) => (
                <motion.button
                  key={dir}
                  onClick={() => !disabled && setActiveIndex(i => Math.max(0, Math.min(i + dir, filtered.length - 1)))}
                  whileHover={disabled ? {} : { scale: 1.1 }}
                  whileTap={disabled ? {} : { scale: 0.9 }}
                  transition={spring}
                  aria-label={dir === -1 ? 'Previous' : 'Next'}
                  style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.12)', background: 'transparent', cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.25 : 1, transition: 'opacity 0.2s' }}
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d={icon} stroke="var(--black)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.button>
              ))}
            </div>
          </div>
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
        @media (max-width: 768px) {
          /* fix: the flex container had overflow:hidden, blocking horizontal scroll */
          .accordion-scroll-outer > div { overflow: visible !important; }
          /* active card: fills most of viewport so it feels like a focused card */
          .accordion-card-active { width: calc(82vw - 16px) !important; min-width: 220px !important; }
          /* inactive cards: slim peek strips */
          .accordion-card-inactive { width: 48px !important; min-width: 48px !important; }
        }
      `}</style>
    </div>
  );
}
