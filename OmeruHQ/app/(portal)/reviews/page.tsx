import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { toggleReviewVisibilityAction } from './actions';

export const dynamic = 'force-dynamic';

function StarRow({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l2.4 4.8 5.6.8-4 3.9.9 5.5L12 14.4l-4.9 2.6.9-5.5L4 7.6l5.6-.8L12 2z"
            fill={n <= rating ? 'var(--lime)' : 'transparent'}
            stroke={n <= rating ? 'var(--lime)' : 'rgba(255,255,255,0.2)'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

export default async function ReviewsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [reviews, completedOrders, completedBookings] = await Promise.all([
    db.review.findMany({
      where: { merchant_id: session.merchant_id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.order.count({ where: { merchant_id: session.merchant_id, status: 'COMPLETED' } }),
    db.booking.count({ where: { merchant_id: session.merchant_id, status: 'COMPLETED' } }),
  ]);

  const avgRating = reviews.length
    ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length
    : null;

  const visibleCount = reviews.filter((r: { is_visible: boolean }) => r.is_visible).length;
  const satisfactionProxy = completedOrders + completedBookings;

  return (
    <div className="portal-page" style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 36px)', maxWidth: 800 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em' }}>Reviews</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginTop: 2 }}>
          Customer feedback and store reputation
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total reviews', value: reviews.length },
          { label: 'Avg rating', value: avgRating ? avgRating.toFixed(1) + ' ★' : '—' },
          { label: 'Visible', value: visibleCount },
          { label: 'Potential', value: satisfactionProxy },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: typeof value === 'string' && value.includes('★') ? 'var(--lime)' : undefined }}>
              {value}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {reviews.length === 0 ? (
        /* Empty state */
        <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l2.4 4.8 5.6.8-4 3.9.9 5.5L12 14.4l-4.9 2.6.9-5.5L4 7.6l5.6-.8L12 2z" stroke="var(--lime)" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No reviews yet</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', lineHeight: 1.7, maxWidth: 380, margin: '0 auto' }}>
            Reviews come in automatically after customers complete orders via WhatsApp.
            {satisfactionProxy > 0 && ` You already have ${satisfactionProxy} fulfilled order${satisfactionProxy !== 1 ? 's' : ''} — reviews are on the way.`}
          </div>
        </div>
      ) : (
        /* Review list */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map((review) => (
            <div key={review.id} className="card" style={{ padding: '20px 24px', opacity: review.is_visible ? 1 : 0.55 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <StarRow rating={review.rating} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)' }}>
                      {review.createdAt.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {!review.is_visible && (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, color: 'rgba(239,68,68,0.8)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Hidden
                      </span>
                    )}
                  </div>
                  {review.comment && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, margin: 0 }}>
                      {review.comment}
                    </p>
                  )}
                </div>
                <form action={toggleReviewVisibilityAction}>
                  <input type="hidden" name="id" value={review.id} />
                  <input type="hidden" name="is_visible" value={review.is_visible ? 'true' : 'false'} />
                  <button
                    type="submit"
                    style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 100, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}
                  >
                    {review.is_visible ? 'Hide' : 'Show'}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
