import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { db } from '@/lib/db';
import { waStoreLink, waServicesListLink, displayableImage, SITE_URL } from '@/lib/storefront';
import StoreAccordion from '@/components/StoreAccordion';
import TrackEvent from '@/components/TrackEvent';

export const revalidate = 300;

type Props = { params: Promise<{ handle: string }> };

const getMerchant = async (rawHandle: string) => {
  const handle = decodeURIComponent(rawHandle).replace(/^@/, '').toLowerCase().trim();
  if (!handle || !/^[a-z0-9_]{2,40}$/.test(handle)) return null;
  return db.merchant.findFirst({
    where: { handle, status: 'ACTIVE' },
    include: {
      products: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 48,
        include: { variants: { where: { is_in_stock: true } } },
      },
      services: { where: { is_active: true }, orderBy: { price: 'asc' } },
      branding: true,
    },
  });
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle: raw } = await params;
  const merchant = await getMerchant(raw);
  if (!merchant) return { title: 'Store not found — Omeru' };

  const title = `${merchant.trading_name} (@${merchant.handle}) — Shop on WhatsApp | Omeru`;
  const description =
    merchant.description?.substring(0, 155) ||
    `Browse ${merchant.trading_name}'s products and book services on WhatsApp. Pay securely with instant EFT. Powered by Omeru.`;
  const image = displayableImage(merchant.welcome_image_url) || displayableImage(merchant.image_url);

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/@${merchant.handle}` },
    openGraph: {
      title, description, url: `${SITE_URL}/@${merchant.handle}`, type: 'website', siteName: 'Omeru',
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description },
  };
}

export default async function StorefrontPage({ params }: Props) {
  const { handle: raw } = await params;
  const decoded = decodeURIComponent(raw);

  if (!decoded.startsWith('@')) {
    const exists = await getMerchant(decoded);
    if (exists) permanentRedirect(`/@${exists.handle}`);
    notFound();
  }

  const merchant = await getMerchant(decoded);
  if (!merchant) notFound();

  const chatLink = waStoreLink(merchant.handle);
  const heroImage =
    displayableImage(merchant.welcome_image_url) ||
    displayableImage(merchant.branding?.logo_url) ||
    displayableImage(merchant.image_url);
  const isOpen = !merchant.manual_closed;
  const hasProducts = merchant.products.length > 0;
  const hasServices = merchant.services.length > 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: merchant.trading_name,
    url: `${SITE_URL}/@${merchant.handle}`,
    ...(merchant.description ? { description: merchant.description } : {}),
    ...(heroImage ? { image: heroImage } : {}),
    ...(merchant.location_visible && merchant.address
      ? { address: { '@type': 'PostalAddress', streetAddress: merchant.address, addressCountry: 'ZA' } }
      : {}),
    openingHours: `Mo-Fr ${merchant.open_time}-${merchant.close_time}`,
    currenciesAccepted: 'ZAR',
    paymentAccepted: 'Instant EFT',
    makesOffer: [
      ...merchant.products.slice(0, 20).map((p) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Product', name: p.name, ...(p.description ? { description: p.description } : {}) },
        price: p.price, priceCurrency: 'ZAR',
        availability: p.is_in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      })),
      ...merchant.services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, ...(s.description ? { description: s.description } : {}) },
        price: s.price, priceCurrency: 'ZAR',
      })),
    ],
  };

  // Build hours rows for the info table
  const hoursRows = [
    ['Mon–Fri', merchant.open_time === '00:00' ? 'Closed' : `${merchant.open_time} – ${merchant.close_time}`],
    ['Saturday', merchant.sat_open_time === '00:00' ? 'Closed' : `${merchant.sat_open_time} – ${merchant.sat_close_time}`],
    ['Sunday', merchant.sun_open ? 'Open' : 'Closed'],
  ];

  return (
    <div style={{ background: 'var(--off-white)', minHeight: '100vh' }}>
      <div className="noise" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackEvent event="view_store" params={{ store_name: merchant.trading_name, store_handle: merchant.handle }} />

      {/* ── Dark hero (nav lives inside so the whole top is black) ── */}
      <div style={{ background: 'var(--black)', paddingBottom: 64, position: 'relative', overflow: 'hidden' }}>
        {/* Tile texture */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', opacity: 0.08 }} />
        {/* Lime glow */}
        <div style={{ position: 'absolute', bottom: '-60%', right: '5%', width: '50%', height: '130%', background: 'radial-gradient(ellipse at center, rgba(200,241,53,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

        {/* Nav */}
        <nav className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(20px,3vh,28px) clamp(20px,4vw,48px)', position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'white', textDecoration: 'none', letterSpacing: '-0.02em' }}>
            omeru<span style={{ color: 'var(--lime)' }}>.</span>
          </Link>
          <Link href="/stores" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontWeight: 500 }}>All stores →</Link>
        </nav>

        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 'clamp(32px,5vh,56px)' }}>
          <div style={{ display: 'flex', gap: 'clamp(24px,4vw,48px)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Avatar */}
            {heroImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImage}
                alt={merchant.trading_name}
                style={{ width: 'clamp(80px,12vw,120px)', height: 'clamp(80px,12vw,120px)', borderRadius: 24, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', flexShrink: 0 }}
              />
            )}

            <div style={{ flex: 1, minWidth: 260 }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {merchant.store_category && (
                  <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(200,241,53,0.12)', color: 'var(--lime)', border: '1px solid rgba(200,241,53,0.2)' }}>
                    {merchant.store_category}
                  </span>
                )}
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  @{merchant.handle}
                </span>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: isOpen ? 'rgba(90,122,0,0.25)' : 'rgba(255,255,255,0.06)', color: isOpen ? '#a8d420' : 'rgba(255,255,255,0.3)', border: `1px solid ${isOpen ? 'rgba(168,212,32,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                  {isOpen ? '● Open' : '○ Closed'}
                </span>
              </div>

              <h1 className="display-md" style={{ color: 'white', marginBottom: 12 }}>{merchant.trading_name}</h1>

              {merchant.description && (
                <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', fontWeight: 300, maxWidth: 560, marginBottom: 28 }}>
                  {merchant.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href={chatLink} rel="nofollow" className="btn-lime">
                  Shop on WhatsApp →
                </a>
                {hasServices && (
                  <a href={waServicesListLink(merchant.id)} rel="nofollow" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 100, border: '1.5px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'border-color 0.2s, color 0.2s' }}>
                    Book a service
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div className="container" style={{ paddingTop: 56, paddingBottom: 120 }}>
        <div className="store-layout">

          {/* Sidebar */}
          <aside style={{ position: 'sticky', top: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: 16 }}>In this store</p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <a href="#about" className="toc-link">01 · About</a>
              {(hasProducts || hasServices) && <a href="#products" className="toc-link">02 · Catalogue</a>}
              <a href="#info" className="toc-link">{hasProducts || hasServices ? '03' : '02'} · Store info</a>
            </nav>

            <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '28px 0' }} />

            {/* WhatsApp CTA card */}
            <div style={{ background: 'var(--black)', borderRadius: 16, padding: '18px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Ready to order?</p>
              <a
                href={chatLink}
                rel="nofollow"
                style={{ display: 'block', textAlign: 'center', background: 'var(--lime)', color: 'var(--black)', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
              >
                Open WhatsApp →
              </a>
            </div>

            {/* Product / service count */}
            {(hasProducts || hasServices) && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {hasProducts && (
                  <div style={{ fontSize: 12, color: 'var(--mid-gray)', fontWeight: 300 }}>
                    <strong style={{ color: 'var(--black)', fontWeight: 700 }}>{merchant.products.length}</strong> products
                  </div>
                )}
                {hasServices && (
                  <div style={{ fontSize: 12, color: 'var(--mid-gray)', fontWeight: 300 }}>
                    <strong style={{ color: 'var(--black)', fontWeight: 700 }}>{merchant.services.length}</strong> services
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* Main content */}
          <main>

            {/* ── 01 About ── */}
            <div id="about" style={{ scrollMarginTop: 32 }}>
              <SectionHead n="01" title="About" />
              <p style={{ fontSize: 15, color: 'var(--dark-gray)', lineHeight: 1.8, fontWeight: 300, marginBottom: 20 }}>
                {merchant.description || `${merchant.trading_name} is a South African store selling on WhatsApp via Omeru. Browse their catalogue and order directly in a chat — no app download needed.`}
              </p>

              {/* Info summary card */}
              <div className="card" style={{ padding: '4px 20px', marginBottom: 28 }}>
                <InfoRow label="Handle" value={`@${merchant.handle}`} />
                {merchant.store_category && <InfoRow label="Category" value={merchant.store_category} />}
                <InfoRow label="Status" value={isOpen ? '● Open now' : '○ Closed'} valueColor={isOpen ? '#5a7a00' : 'var(--mid-gray)'} />
                <InfoRow label="Payment" value="Instant EFT via Stitch — no card needed" />
                {merchant.location_visible && merchant.address && (
                  <InfoRow label="Location" value={merchant.address} last />
                )}
                {!(merchant.location_visible && merchant.address) && (
                  <InfoRow label="Orders via" value="WhatsApp only" last />
                )}
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '36px 0' }} />

            {/* ── 02 Catalogue (accordion) ── */}
            {(hasProducts || hasServices) && (
              <div id="products" style={{ scrollMarginTop: 32, marginBottom: 8 }}>
                <SectionHead n="02" title="Catalogue" />
                <StoreAccordion
                  products={merchant.products.map(p => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    price: p.price,
                    image_url: displayableImage(p.image_url),
                    is_in_stock: p.is_in_stock,
                    variants: p.variants,
                  }))}
                  services={merchant.services.map(s => ({
                    id: s.id,
                    name: s.name,
                    description: s.description,
                    price: s.price,
                    duration_min: s.duration_min,
                    image_url: displayableImage(s.image_url),
                  }))}
                  storeName={merchant.trading_name}
                  storeHandle={merchant.handle}
                />
                <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '40px 0' }} />
              </div>
            )}

            {!hasProducts && !hasServices && (
              <div style={{ padding: '40px 0 8px', textAlign: 'center' }}>
                <p style={{ fontSize: 16, color: 'var(--mid-gray)', fontWeight: 300 }}>
                  {merchant.trading_name} is setting up their catalogue. Chat with them on WhatsApp in the meantime!
                </p>
                <a href={chatLink} rel="nofollow" className="btn-lime" style={{ marginTop: 20, display: 'inline-flex' }}>
                  Start a chat →
                </a>
              </div>
            )}

            {/* ── 03 Store info ── */}
            <div id="info" style={{ scrollMarginTop: 32 }}>
              <SectionHead n={hasProducts || hasServices ? '03' : '02'} title="Store info" />

              {/* Hours table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                      <th style={{ padding: '10px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--black)', fontSize: 11, textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Day</th>
                      <th style={{ padding: '10px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--black)', fontSize: 11, textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hoursRows.map(([day, hours], i) => (
                      <tr key={day} style={{ borderBottom: i < hoursRows.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 500, color: 'var(--black)' }}>{day}</td>
                        <td style={{ padding: '10px 16px', fontWeight: 300, color: hours === 'Closed' ? 'var(--mid-gray)' : 'var(--dark-gray)' }}>{hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card" style={{ padding: '4px 20px' }}>
                <InfoRow label="Payment" value="Instant EFT via Stitch Money" />
                <InfoRow label="Ordering" value="WhatsApp only — no app download required" />
                <InfoRow label="Powered by" value="Omeru" last />
              </div>

              {/* Final CTA */}
              <div style={{ marginTop: 40, padding: '28px 28px', borderRadius: 20, background: 'var(--black)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', opacity: 0.07, borderRadius: 20 }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', marginBottom: 6, letterSpacing: '-0.02em' }}>
                    Ready to shop?
                  </p>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 300, marginBottom: 20 }}>
                    Open WhatsApp and start a chat with {merchant.trading_name} right now.
                  </p>
                  <a href={chatLink} rel="nofollow" className="btn-lime" style={{ fontSize: 14 }}>
                    Shop on WhatsApp →
                  </a>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* ── Sticky bottom bar ── */}
      <div style={{ position: 'sticky', bottom: 0, zIndex: 10, paddingBottom: 20, background: 'linear-gradient(transparent, var(--off-white) 45%)', pointerEvents: 'none' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', pointerEvents: 'auto' }}>
          <a href={chatLink} rel="nofollow" className="btn-lime" style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.18)', fontSize: 14 }}>
            💬 Chat with {merchant.trading_name}
          </a>
        </div>
      </div>

      <footer className="container" style={{ padding: '8px clamp(20px,4vw,48px) 56px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--mid-gray)', fontWeight: 300 }}>
          Powered by <Link href="/" style={{ color: 'var(--black)', fontWeight: 600, textDecoration: 'none' }}>Omeru</Link> — zero-friction commerce on WhatsApp.
          {' '}<Link href="/stores" style={{ color: 'var(--mid-gray)', textDecorationColor: 'transparent' }}>Discover more stores →</Link>
        </p>
      </footer>

      <style>{`
        html { scroll-behavior: smooth; }
        .store-layout {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 56px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .store-layout { grid-template-columns: 1fr; }
          aside { display: none; }
        }
        .toc-link {
          display: block;
          font-size: 12px;
          color: var(--mid-gray);
          text-decoration: none;
          padding: 5px 0;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          transition: color 0.15s;
          font-weight: 300;
        }
        .toc-link:hover { color: var(--black); }
      `}</style>
    </div>
  );
}

/* ── Sub-components ── */

function SectionHead({ n, title }: { n: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--lime-dark)', letterSpacing: '0.04em', flexShrink: 0 }}>{n}</span>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2vw,22px)', fontWeight: 700, color: 'var(--black)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>{title}</h2>
    </div>
  );
}

function InfoRow({ label, value, last, valueColor }: { label: string; value: string; last?: boolean; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: last ? 'none' : '1px solid rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--mid-gray)', letterSpacing: '0.06em', textTransform: 'uppercase', minWidth: 100, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: valueColor || 'var(--dark-gray)', fontWeight: 300, flex: 1 }}>{value}</span>
    </div>
  );
}
