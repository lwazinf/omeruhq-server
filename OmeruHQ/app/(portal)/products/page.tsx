import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { toggleProductAction } from './actions';

function FoodIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 2v20" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M21 15V2a5 5 0 00-5 5v6h3.5a1.5 1.5 0 001.5 1.5V22" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default async function ProductsPage() {
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

  const activeCount = products.filter(p => p.is_in_stock).length;

  return (
    <div style={{ padding: '32px 36px', animation: 'slideUp 0.22s ease' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', color: 'white', lineHeight: 1, margin: 0 }}>
            Your products
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
            {products.length} product{products.length !== 1 ? 's' : ''} · {activeCount} active
          </p>
        </div>
        <Link
          href="/products/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '10px 20px', borderRadius: 100,
            background: 'var(--lime)', color: 'var(--black)',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
            textDecoration: 'none', whiteSpace: 'nowrap',
            transition: 'background 0.15s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s',
          }}
          className="btn-lime"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Add product
        </Link>
      </div>

      {/* ── Empty state ── */}
      {products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <FoodIcon />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 6 }}>No products yet</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Add your first product to start selling on WhatsApp.</div>
          <Link href="/products/new" className="btn-lime" style={{ display: 'inline-flex', padding: '10px 24px', fontSize: 13, textDecoration: 'none' }}>
            Add product
          </Link>
        </div>
      )}

      {/* ── Grid ── */}
      {products.length > 0 && (
        <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {products.map(p => (
            <div
              key={p.id}
              className="card card-lift"
              style={{ overflow: 'hidden', opacity: p.is_in_stock ? 1 : 0.65 }}
            >
              {/* ── Image / placeholder ── */}
              <div className="product-thumb" style={{ height: 130, background: p.image_url ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', borderRadius: '14px 14px 0 0', overflow: 'hidden' }}>
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FoodIcon />
                  </div>
                )}

                {/* Hover overlay — Edit */}
                <div className="product-thumb-overlay">
                  <Link
                    href={`/products/${p.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 16px', borderRadius: 100,
                      background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                      color: 'white', textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M8.5 1.5L10.5 3.5L4 10H2v-2L8.5 1.5z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Edit
                  </Link>
                </div>

                {/* Out of stock badge */}
                {!p.is_in_stock && (
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    padding: '3px 8px', borderRadius: 100,
                    background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.3)',
                    fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f87171',
                  }}>
                    Off
                  </div>
                )}
              </div>

              {/* ── Card body ── */}
              <div style={{ padding: '14px 16px 16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'white', letterSpacing: '-0.01em', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </div>
                {p.description ? (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.55, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.description}
                  </div>
                ) : (
                  <div style={{ marginBottom: 14, height: 18 }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--lime)' }}>
                    R {p.price.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                  </span>
                  <form action={toggleProductAction}>
                    <input type="hidden" name="product_id" value={p.id} />
                    <input type="hidden" name="current_state" value={p.is_in_stock ? 'available' : 'unavailable'} />
                    <button
                      type="submit"
                      title={p.is_in_stock ? 'Mark as unavailable' : 'Mark as available'}
                      style={{
                        width: 38, height: 21, borderRadius: 100, border: 'none', cursor: 'pointer',
                        background: p.is_in_stock ? 'var(--lime)' : 'rgba(255,255,255,0.15)',
                        position: 'relative', flexShrink: 0,
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 3,
                        left: p.is_in_stock ? 19 : 3,
                        width: 15, height: 15, borderRadius: '50%', background: 'white',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        transition: 'left 0.22s cubic-bezier(0.34,1.56,0.64,1)',
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
