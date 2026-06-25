import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { displayableImage, SITE_URL } from '@/lib/storefront';
import StoresAccordion from '@/components/StoresAccordion';
import InviteTrigger from '@/components/InviteTrigger';
import { getTranslations } from 'next-intl/server';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Discover Stores — Shop South African businesses on WhatsApp | Omeru',
  description:
    'Browse independent South African stores and service providers selling on WhatsApp. Food, fashion, beauty, services and more — pay securely with instant EFT.',
  alternates: { canonical: `${SITE_URL}/stores` },
};

export default async function StoresPage() {
  const t = await getTranslations('Stores');

  const raw = await db.merchant.findMany({
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
  }).catch(() => []);

  const merchants = raw.map(m => ({
    handle: m.handle,
    trading_name: m.trading_name,
    description: m.description,
    image_url: displayableImage(m.welcome_image_url) || displayableImage(m.image_url),
    manual_closed: m.manual_closed,
    store_category: m.store_category,
    product_count: m._count.products,
    service_count: m._count.services,
  }));

  const categories = Array.from(new Set(raw.map(m => m.store_category || 'More stores')));

  return (
    <div style={{ background: 'var(--off-white)', minHeight: '100vh' }}>
      <div className="noise" />

      <div style={{ background: 'var(--black)', paddingBottom: 64, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', opacity: 0.08 }} />
        <div style={{ position: 'absolute', bottom: '-40%', right: '10%', width: '50%', height: '110%', background: 'radial-gradient(ellipse at center, rgba(200,241,53,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <nav className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(20px,3vh,28px) clamp(20px,4vw,48px)', position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'white', textDecoration: 'none', letterSpacing: '-0.02em' }}>
            omeru<span style={{ color: 'var(--lime)' }}>.</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontWeight: 500 }}>{t('applyMerchant')}</Link>
        </nav>

        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 'clamp(32px,5vh,56px)' }}>
          <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(200,241,53,0.12)', color: 'var(--lime)', border: '1px solid rgba(200,241,53,0.2)', marginBottom: 20 }}>
            Directory
          </span>
          <h1 className="display-md" style={{ color: 'white', marginBottom: 12, marginTop: 16 }}>
            {t('heroHeading')}<br />
            <span style={{ color: 'var(--lime)' }}>{t('heroHeadingAccent')}</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', fontWeight: 300, maxWidth: 480, lineHeight: 1.7, marginBottom: 32 }}>
            {t('heroSub')}
          </p>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>{merchants.length}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>{t('browseAll').toLowerCase()}</span>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>{categories.length}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>categories</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 56, paddingBottom: 120 }}>
        {merchants.length === 0 ? (
          <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: 17, color: 'var(--mid-gray)', fontWeight: 300 }}>{t('noStores')}</p>
            <Link href="/" className="btn-lime" style={{ marginTop: 24, display: 'inline-flex' }}>{t('backHome')}</Link>
          </div>
        ) : (
          <div className="container">
            <StoresAccordion stores={merchants} />
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', paddingBottom: 64 }}>
        <p style={{ fontSize: 13, color: 'var(--mid-gray)', fontWeight: 300 }}>
          Want your store here?{' '}
          <InviteTrigger style={{ color: 'var(--black)', fontWeight: 600, fontSize: 13, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            {t('applyMerchant')}
          </InviteTrigger>
          {' '}— we review weekly.
        </p>
      </div>
    </div>
  );
}
