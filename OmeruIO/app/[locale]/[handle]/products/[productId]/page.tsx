import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { waStoreLink, waProductLink, displayableImage, SITE_URL } from '@/lib/storefront';
import TrackEvent from '@/components/TrackEvent';

export const revalidate = 300;

type Props = { params: Promise<{ handle: string; productId: string }> };

const getData = async (rawHandle: string, productId: string) => {
  const handle = decodeURIComponent(rawHandle).replace(/^@/, '').toLowerCase().trim();
  if (!handle || !/^[a-z0-9_]{2,40}$/.test(handle)) return null;
  if (!productId || productId.length > 60) return null;

  const merchant = await db.merchant.findFirst({
    where: { handle, status: 'ACTIVE' },
    select: { id: true, trading_name: true, handle: true },
  });
  if (!merchant) return null;

  const product = await db.product.findFirst({
    where: { id: productId, merchant_id: merchant.id, status: 'ACTIVE' },
    include: { variants: { orderBy: { price: 'asc' } } },
  });
  if (!product) return null;

  return { merchant, product };
};

const formatZAR = (n: number) =>
  n === 0
    ? 'Free'
    : new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n);

const variantLabel = (v: { size?: string | null; color?: string | null; sku?: string | null }) =>
  [v.size, v.color].filter(Boolean).join(' / ') || v.sku || 'Option';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle: raw, productId } = await params;
  const data = await getData(raw, productId);
  if (!data) return { title: 'Product not found — Omeru' };

  const { merchant, product } = data;
  const image = displayableImage(product.image_url);
  const canonical = `${SITE_URL}/@${merchant.handle}/products/${product.id}`;
  const title = `${product.name} — ${merchant.trading_name} on WhatsApp | Omeru`;
  const description =
    product.description?.substring(0, 155) ||
    `Order ${product.name} from ${merchant.trading_name} on WhatsApp. No app needed — pay instantly with EFT. Powered by Omeru.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title, description, url: canonical, type: 'website', siteName: 'Omeru',
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description },
  };
}

export default async function ProductPage({ params }: Props) {
  const { handle: raw, productId } = await params;
  const data = await getData(raw, productId);
  if (!data) notFound();

  const { merchant, product } = data;
  const chatLink = waStoreLink(merchant.handle);
  const image = displayableImage(product.image_url);

  const fromPrice = product.variants.length
    ? Math.min(...product.variants.map((v) => v.price))
    : product.price;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    ...(image ? { image } : {}),
    offers: {
      '@type': 'Offer',
      price: fromPrice,
      priceCurrency: 'ZAR',
      availability: product.is_in_stock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: chatLink,
      seller: { '@type': 'Organization', name: merchant.trading_name },
    },
  };

  return (
    <div style={{ background: 'var(--off-white)', minHeight: '100vh' }}>
      <div className="noise" />
      {/* nosemgrep: react-dangerouslysetinnerhtml — <, >, & are unicode-escaped */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026') }} />
      <TrackEvent event="view_item" params={{ item_id: product.id, item_name: product.name, currency: 'ZAR', value: fromPrice, item_brand: merchant.trading_name }} />

      {/* ── Dark hero ── */}
      <div style={{ background: 'var(--black)', paddingBottom: 64, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', opacity: 0.08 }} />
        <div style={{ position: 'absolute', bottom: '-60%', right: '5%', width: '50%', height: '130%', background: 'radial-gradient(ellipse at center, rgba(200,241,53,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

        {/* Nav */}
        <nav className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(20px,3vh,28px) clamp(20px,4vw,48px)', position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'white', textDecoration: 'none', letterSpacing: '-0.02em' }}>
            omeru<span style={{ color: 'var(--lime)' }}>.</span>
          </Link>
          <Link href={`/@${merchant.handle}`} style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontWeight: 500 }}>
            ← {merchant.trading_name}
          </Link>
        </nav>

        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 'clamp(32px,5vh,56px)' }}>
          <div style={{ display: 'flex', gap: 'clamp(24px,4vw,48px)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Product image */}
            {image && (
              <Image
                src={image}
                alt={product.name}
                width={160}
                height={160}
                style={{ borderRadius: 20, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', flexShrink: 0, width: 'clamp(100px,16vw,160px)', height: 'clamp(100px,16vw,160px)' }}
                priority
              />
            )}

            <div style={{ flex: 1, minWidth: 260 }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(200,241,53,0.12)', color: 'var(--lime)', border: '1px solid rgba(200,241,53,0.2)' }}>
                  Product
                </span>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: product.is_in_stock ? 'rgba(90,122,0,0.25)' : 'rgba(255,255,255,0.06)', color: product.is_in_stock ? '#a8d420' : 'rgba(255,255,255,0.3)', border: `1px solid ${product.is_in_stock ? 'rgba(168,212,32,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                  {product.is_in_stock ? '● In stock' : '○ Out of stock'}
                </span>
              </div>

              <h1 className="display-md" style={{ color: 'white', marginBottom: 12 }}>{product.name}</h1>

              <p style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--lime)', letterSpacing: '-0.03em', marginBottom: product.description ? 16 : 28 }}>
                {product.variants.length > 0 ? `From ${formatZAR(fromPrice)}` : formatZAR(fromPrice)}
              </p>

              {product.description && (
                <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', fontWeight: 300, maxWidth: 560, marginBottom: 28 }}>
                  {product.description}
                </p>
              )}

              {product.is_in_stock && (
                <a href={waProductLink(product.id)} rel="nofollow" className="btn-lime">
                  Order on WhatsApp →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container" style={{ paddingTop: 56, paddingBottom: 120 }}>

        {/* Variants */}
        {product.variants.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: 16 }}>Options</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {product.variants.map((v) => (
                <div key={v.id} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', display: 'flex', gap: 12, alignItems: 'center', opacity: v.is_in_stock ? 1 : 0.5 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--black)' }}>{variantLabel(v)}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--black)' }}>{formatZAR(v.price)}</span>
                  {!v.is_in_stock && <span style={{ fontSize: 11, color: 'var(--mid-gray)', fontWeight: 500 }}>Out of stock</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order CTA card */}
        <div style={{ background: 'var(--black)', borderRadius: 20, padding: '28px 28px', position: 'relative', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', opacity: 0.07, borderRadius: 20 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', marginBottom: 6, letterSpacing: '-0.02em' }}>
              Ready to order?
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 300, marginBottom: 20 }}>
              Chat with {merchant.trading_name} on WhatsApp — no app download, pay instantly with EFT.
            </p>
            <a href={waProductLink(product.id)} rel="nofollow" className="btn-lime" style={{ fontSize: 14 }}>
              💬 Order on WhatsApp →
            </a>
          </div>
        </div>

        {/* Back to store */}
        <Link href={`/@${merchant.handle}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--mid-gray)', textDecoration: 'none', fontWeight: 500 }}>
          ← Back to {merchant.trading_name}
        </Link>
      </div>

      <footer className="container" style={{ padding: '8px clamp(20px,4vw,48px) 56px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--mid-gray)', fontWeight: 300 }}>
          Powered by <Link href="/" style={{ color: 'var(--black)', fontWeight: 600, textDecoration: 'none' }}>Omeru</Link> — zero-friction commerce on WhatsApp.
        </p>
      </footer>
    </div>
  );
}
