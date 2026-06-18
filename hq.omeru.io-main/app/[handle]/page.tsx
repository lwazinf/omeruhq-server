import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { db } from '@/lib/db';
import { waStoreLink, displayableImage, formatZAR, formatDuration, SITE_URL } from '@/lib/storefront';

/**
 * Public merchant storefront — omeru.io/@handle
 *
 * Created automatically the moment a merchant's WhatsApp store goes ACTIVE,
 * because both surfaces read the same database. Every edit the merchant makes
 * in the WhatsApp bot (products, services, hours, images) appears here within
 * the ISR window. Every call to action deep-links into the WhatsApp bot with
 * the @handle pre-filled, so the web page is a discovery layer and WhatsApp
 * stays the transaction layer.
 *
 * SEO: server-rendered, ISR every 5 minutes, per-store metadata + OpenGraph,
 * LocalBusiness/Product/Service JSON-LD, and inclusion in sitemap.xml.
 */

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
      title,
      description,
      url: `${SITE_URL}/@${merchant.handle}`,
      type: 'website',
      siteName: 'Omeru',
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description },
  };
}

export default async function StorefrontPage({ params }: Props) {
  const { handle: raw } = await params;
  const decoded = decodeURIComponent(raw);

  // Canonical form is /@handle — redirect bare /handle permanently
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

  // ── Structured data: LocalBusiness + offer catalogue ──────────────────────
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
        price: p.price,
        priceCurrency: 'ZAR',
        availability: p.is_in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      })),
      ...merchant.services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, ...(s.description ? { description: s.description } : {}) },
        price: s.price,
        priceCurrency: 'ZAR',
      })),
    ],
  };

  return (
    <div style={{ background: 'var(--off-white)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Nav ── */}
      <nav className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--black)', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          omeru<span style={{ color: 'var(--lime-dark)' }}>.</span>
        </Link>
        <Link href="/stores" className="nav-link">All stores</Link>
      </nav>

      {/* ── Store hero ── */}
      <header className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center' }}>
          {heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt={`${merchant.trading_name} storefront`}
              style={{ width: 160, height: 160, borderRadius: 32, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.10)' }}
            />
          )}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <span className="pill">@{merchant.handle}</span>
              {merchant.store_category && <span className="pill">{merchant.store_category}</span>}
              <span className="pill" style={isOpen ? { borderColor: 'var(--lime-dark)', color: '#5a7a00' } : {}}>
                {isOpen ? '● Open' : '○ Closed'}
              </span>
            </div>
            <h1 className="display-lg" style={{ marginBottom: 12 }}>{merchant.trading_name}</h1>
            {merchant.description && (
              <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--mid-gray)', maxWidth: 560, marginBottom: 20 }}>
                {merchant.description}
              </p>
            )}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <a href={chatLink} className="btn-lime" rel="nofollow">
                💬 Shop on WhatsApp
              </a>
              {hasServices && (
                <a href={chatLink} className="btn-outline" rel="nofollow">📅 Book a service</a>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--mid-gray)', marginTop: 14 }}>
              Mon–Fri {merchant.open_time}–{merchant.close_time} · Sat {merchant.sat_open_time}–{merchant.sat_close_time}
              {merchant.sun_open ? ' · Sun open' : ''}
              {merchant.location_visible && merchant.address ? ` · 📍 ${merchant.address}` : ''}
            </p>
          </div>
        </div>
      </header>

      {/* ── Services ── */}
      {hasServices && (
        <section className="container" style={{ paddingBottom: 56 }}>
          <h2 className="display-md" style={{ marginBottom: 24 }}>Services</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {merchant.services.map((s) => {
              const img = displayableImage(s.image_url);
              return (
                <a key={s.id} href={chatLink} rel="nofollow" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={s.name} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: 120, background: 'var(--warm-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>💼</div>
                  )}
                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{s.name}</h3>
                    <p style={{ fontSize: 14, color: 'var(--mid-gray)', marginBottom: 12 }}>
                      {formatDuration(s.duration_min)}{s.description ? ` · ${s.description.substring(0, 60)}` : ''}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>{formatZAR(s.price)}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#5a7a00' }}>Book →</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Products ── */}
      {hasProducts && (
        <section className="container" style={{ paddingBottom: 72 }}>
          <h2 className="display-md" style={{ marginBottom: 24 }}>Products</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {merchant.products.map((p) => {
              const img = displayableImage(p.image_url);
              const fromPrice = p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : p.price;
              return (
                <a key={p.id} href={chatLink} rel="nofollow" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block', opacity: p.is_in_stock ? 1 : 0.55 }}>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={p.name} style={{ width: '100%', height: 220, objectFit: 'cover' }} loading="lazy" />
                  ) : (
                    <div style={{ width: '100%', height: 160, background: 'var(--warm-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🛍️</div>
                  )}
                  <div style={{ padding: 18 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{p.name}</h3>
                    {p.description && <p style={{ fontSize: 13, color: 'var(--mid-gray)', marginBottom: 10 }}>{p.description.substring(0, 70)}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>
                        {p.variants.length > 0 && <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--mid-gray)' }}>from </span>}
                        {formatZAR(fromPrice)}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: p.is_in_stock ? '#5a7a00' : 'var(--mid-gray)' }}>
                        {p.is_in_stock ? 'Buy →' : 'Out of stock'}
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {!hasProducts && !hasServices && (
        <section className="container" style={{ paddingBottom: 72, textAlign: 'center' }}>
          <p style={{ fontSize: 17, color: 'var(--mid-gray)' }}>
            {merchant.trading_name} is setting up their catalogue. Chat with them on WhatsApp in the meantime!
          </p>
        </section>
      )}

      {/* ── Sticky CTA + footer ── */}
      <div style={{ position: 'sticky', bottom: 0, padding: '16px 0', background: 'linear-gradient(transparent, var(--off-white) 40%)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
          <a href={chatLink} className="btn-lime" rel="nofollow" style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}>
            💬 Chat with {merchant.trading_name} on WhatsApp
          </a>
        </div>
      </div>

      <footer className="container" style={{ padding: '40px 48px 56px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--mid-gray)' }}>
          Powered by <Link href="/" style={{ color: 'var(--black)', fontWeight: 600, textDecoration: 'none' }}>Omeru</Link> — zero-friction commerce on WhatsApp.
          {' '}<Link href="/stores" style={{ color: 'var(--mid-gray)' }}>Discover more stores</Link>
        </p>
      </footer>
    </div>
  );
}
