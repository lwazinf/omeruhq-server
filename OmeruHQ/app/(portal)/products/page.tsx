import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { toggleProductAction } from './actions';
import { getTranslations } from 'next-intl/server';

export default async function ProductsPage() {
  const t = await getTranslations('Products');
  const session = await getSession();
  if (!session) redirect('/login');

  const products = await db.product.findMany({
    where: { merchant_id: session.merchant_id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, description: true, price: true,
      is_in_stock: true, image_url: true,
    },
  });

  return (
    <div className="portal-page" style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 36px)', maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em' }}>{t('heading')}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginTop: 2 }}>
            {products.length} {products.length !== 1 ? t('heading').toLowerCase() : t('heading').toLowerCase().replace(/s$/, '')}
          </div>
        </div>
        <Link href="/products/new" className="btn-lime" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', fontSize: 13, textDecoration: 'none' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          {t('addProduct')}
        </Link>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('noProducts').split('.')[0]}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginBottom: 24 }}>{t('noProducts').split('. ')[1] || ''}</div>
          <Link href="/products/new" className="btn-lime" style={{ display: 'inline-flex', padding: '10px 24px', fontSize: 13, textDecoration: 'none' }}>
            {t('addProduct')}
          </Link>
        </div>
      ) : (
        <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {products.map(p => (
            <div key={p.id} className="card" style={{ overflow: 'hidden' }}>
              {p.image_url ? (
                <div style={{ height: 140, overflow: 'hidden', borderRadius: '12px 12px 0 0', background: 'var(--warm-gray)' }}>
                  <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ height: 80, background: 'var(--warm-gray)', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M3 14C3 8.201 7.701 3.5 13.5 3.5S24 8.201 24 14s-4.701 10.5-10.5 10.5S3 19.799 3 14z" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5"/><path d="M10.5 14h7M14 10.5v7" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              )}
              <div style={{ padding: '16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.01em' }}>{p.name}</div>
                {p.description && (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.description}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800 }}>
                    R {p.price.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                  </div>
                  <form action={toggleProductAction}>
                    <input type="hidden" name="product_id" value={p.id} />
                    <input type="hidden" name="current_state" value={p.is_in_stock ? 'available' : 'unavailable'} />
                    <button type="submit" title={p.is_in_stock ? t('inStock') : t('outOfStock')} style={{
                      width: 40, height: 22, borderRadius: 100, border: 'none', cursor: 'pointer',
                      background: p.is_in_stock ? 'var(--lime)' : 'var(--warm-gray)',
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    }}>
                      <div style={{
                        position: 'absolute', top: 3, left: p.is_in_stock ? 21 : 3,
                        width: 16, height: 16, borderRadius: '50%', background: 'white',
                        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      }} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
