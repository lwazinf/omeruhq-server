import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { displayableImage, SITE_URL } from '@/lib/storefront';

/**
 * Store directory — omeru.io/stores
 *
 * Discovery + SEO hub: every active storefront gets an internal link from
 * here, which is what lets search engine crawlers find /@handle pages even
 * before any external links exist. Grouped by category for topical relevance.
 */

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Discover Stores — Shop South African businesses on WhatsApp | Omeru',
  description:
    'Browse independent South African stores and service providers selling on WhatsApp. Food, fashion, beauty, services and more — pay securely with instant EFT.',
  alternates: { canonical: `${SITE_URL}/stores` },
};

export default async function StoresPage() {
  const merchants = await db.merchant.findMany({
    where: { status: 'ACTIVE', show_in_browse: true },
    orderBy: { createdAt: 'desc' },
    select: {
      handle: true,
      trading_name: true,
      description: true,
      image_url: true,
      welcome_image_url: true,
      store_category: true,
      manual_closed: true,
      _count: { select: { products: { where: { status: 'ACTIVE' } }, services: { where: { is_active: true } } } },
    },
    take: 200,
  });

  // Group by category, uncategorised last
  const groups = new Map<string, typeof merchants>();
  for (const m of merchants) {
    const key = m.store_category || 'More stores';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  return (
    <div style={{ background: 'var(--off-white)', minHeight: '100vh' }}>
      <nav className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--black)', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          omeru<span style={{ color: 'var(--lime-dark)' }}>.</span>
        </Link>
        <Link href="/" className="nav-link">For merchants</Link>
      </nav>

      <header className="container" style={{ paddingTop: 40, paddingBottom: 48 }}>
        <span className="pill" style={{ marginBottom: 16 }}>Directory</span>
        <h1 className="display-lg" style={{ marginBottom: 12, marginTop: 16 }}>Shops worth a tap.</h1>
        <p style={{ fontSize: 17, color: 'var(--mid-gray)', maxWidth: 540 }}>
          Independent South African businesses selling on WhatsApp. Tap any store to browse — every purchase happens in a chat.
        </p>
      </header>

      {merchants.length === 0 && (
        <p className="container" style={{ paddingBottom: 80, color: 'var(--mid-gray)' }}>
          Stores are coming soon — check back shortly.
        </p>
      )}

      {[...groups.entries()].map(([category, stores]) => (
        <section key={category} className="container" style={{ paddingBottom: 48 }}>
          <h2 className="display-md" style={{ marginBottom: 20 }}>{category}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {stores.map((m) => {
              const img = displayableImage(m.welcome_image_url) || displayableImage(m.image_url);
              return (
                <Link key={m.handle} href={`/@${m.handle}`} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={m.trading_name} style={{ width: '100%', height: 160, objectFit: 'cover' }} loading="lazy" />
                  ) : (
                    <div style={{ width: '100%', height: 100, background: 'var(--warm-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🏪</div>
                  )}
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{m.trading_name}</h3>
                      <span style={{ fontSize: 11, color: m.manual_closed ? 'var(--mid-gray)' : '#5a7a00', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {m.manual_closed ? 'Closed' : 'Open'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--mid-gray)', marginBottom: 10 }}>
                      @{m.handle}
                      {m._count.products > 0 && ` · ${m._count.products} products`}
                      {m._count.services > 0 && ` · ${m._count.services} services`}
                    </p>
                    {m.description && <p style={{ fontSize: 14, color: 'var(--dark-gray)', lineHeight: 1.5 }}>{m.description.substring(0, 90)}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <footer className="container" style={{ padding: '40px 48px 64px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--mid-gray)' }}>
          Want your store here? <Link href="/" style={{ color: 'var(--black)', fontWeight: 600 }}>Omeru is invite-only</Link> — request an invite.
        </p>
      </footer>
    </div>
  );
}
