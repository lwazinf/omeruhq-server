import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function ReviewsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [completedOrders, completedBookings, totalCustomers] = await Promise.all([
    db.order.count({ where: { merchant_id: session.merchant_id, status: 'COMPLETED' } }),
    db.booking.count({ where: { merchant_id: session.merchant_id, status: 'COMPLETED' } }),
    db.merchantCustomer.count({ where: { merchant_id: session.merchant_id } }),
  ]);

  const satisfactionProxy = completedOrders + completedBookings;

  return (
    <div className="portal-page" style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 36px)', maxWidth: 760 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em' }}>Reviews</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginTop: 2 }}>
          Customer feedback and store reputation
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Orders fulfilled', value: completedOrders },
          { label: 'Bookings completed', value: completedBookings },
          { label: 'Total customers', value: totalCustomers },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: '18px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Coming soon card */}
      <div className="card" style={{ padding: '40px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 60% 40%, rgba(200,241,53,0.06) 0%, transparent 65%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l2.4 4.8 5.6.8-4 3.9.9 5.5L12 14.4l-4.9 2.6.9-5.5L4 7.6l5.6-.8L12 2z" stroke="var(--lime)" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 10 }}>
            Customer reviews coming soon
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--mid-gray)', lineHeight: 1.75, maxWidth: 440, margin: '0 auto 28px' }}>
            We&apos;re building a system that automatically asks customers for feedback after completed orders and bookings — right in WhatsApp. You&apos;ll be able to view, respond to, and share reviews directly from here.
          </div>

          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 10, textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 24px', minWidth: 280 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>What&apos;s coming</div>
            {[
              'Automated post-order WhatsApp review requests',
              'Star ratings + written feedback from customers',
              'Public review display on your store page',
              'Reply to reviews from this dashboard',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(200,241,53,0.12)', border: '1px solid rgba(200,241,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4l2 2L6.5 2" stroke="var(--lime)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>

          {satisfactionProxy > 0 && (
            <div style={{ marginTop: 24, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)' }}>
              You&apos;ve already fulfilled{' '}
              <strong style={{ color: 'var(--lime)', fontFamily: 'var(--font-display)' }}>{satisfactionProxy}</strong>{' '}
              order{satisfactionProxy !== 1 ? 's' : ''} — that&apos;s {satisfactionProxy} potential reviews when this launches.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
