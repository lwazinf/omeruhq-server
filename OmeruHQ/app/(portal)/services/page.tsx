import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import ServicesSection from './ServicesSection';
import { confirmBookingAction, declineBookingAction, completeBookingAction } from './actions';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f5c842',
  CONFIRMED: 'var(--lime)',
  REJECTED: '#ef4444',
  CANCELLED: 'var(--mid-gray)',
  COMPLETED: 'rgba(255,255,255,0.3)',
};

const STATUS_BG: Record<string, string> = {
  PENDING: 'rgba(245,200,66,0.12)',
  CONFIRMED: 'rgba(200,241,53,0.1)',
  REJECTED: 'rgba(239,68,68,0.1)',
  CANCELLED: 'rgba(255,255,255,0.05)',
  COMPLETED: 'rgba(255,255,255,0.04)',
};

export default async function ServicesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [services, bookings] = await Promise.all([
    db.service.findMany({
      where: { merchant_id: session.merchant_id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { bookings: true } } },
    }),
    db.booking.findMany({
      where: {
        merchant_id: session.merchant_id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        start_at: { gte: new Date() },
      },
      include: { service: true },
      orderBy: { start_at: 'asc' },
      take: 20,
    }),
  ]);

  return (
    <div className="portal-page" style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 36px)', maxWidth: 1100 }}>
      {/* ── Services section (interactive) ── */}
      <ServicesSection services={services} />

      {/* ── Upcoming bookings section ── */}
      <div style={{ marginTop: 48 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Upcoming bookings
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400, color: 'var(--mid-gray)', marginLeft: 8 }}>
              {bookings.length} active
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginTop: 2 }}>
            Pending and confirmed bookings from today onwards
          </div>
        </div>

        {bookings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            background: 'rgba(255,255,255,0.02)', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
              No upcoming bookings
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)' }}>
              Bookings from customers will appear here once received.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bookings.map((b) => {
              const dateStr = new Date(b.start_at).toLocaleString('en-ZA', {
                dateStyle: 'medium',
                timeStyle: 'short',
              });
              const color = STATUS_COLORS[b.status] ?? 'rgba(255,255,255,0.4)';
              const bg = STATUS_BG[b.status] ?? 'transparent';

              return (
                <div
                  key={b.id}
                  className="card"
                  style={{
                    padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 14,
                  }}
                >
                  {/* Left: customer + service info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                      color: 'rgba(255,255,255,0.5)',
                    }}>
                      {(b.customer_name ?? b.customer_wa_id).charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 2 }}>
                        {b.customer_name ?? b.customer_wa_id}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)' }}>
                        {b.service.name} · {dateStr}
                      </div>
                      {b.customer_name && (
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                          {b.customer_wa_id}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: status badge + action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                    {/* Status badge */}
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                      padding: '4px 10px', borderRadius: 100,
                      color, background: bg, border: `1px solid ${color}30`,
                    }}>
                      {b.status}
                    </span>

                    {/* Action buttons */}
                    {b.status === 'PENDING' && (
                      <>
                        <form action={confirmBookingAction} style={{ display: 'inline' }}>
                          <input type="hidden" name="id" value={b.id} />
                          <button type="submit" className="btn-lime" style={{ padding: '6px 14px', fontSize: 12 }}>
                            Confirm
                          </button>
                        </form>
                        <form action={declineBookingAction} style={{ display: 'inline' }}>
                          <input type="hidden" name="id" value={b.id} />
                          <button type="submit" className="btn-ghost" style={{ padding: '6px 14px', fontSize: 12, color: 'rgba(239,68,68,0.7)' }}>
                            Decline
                          </button>
                        </form>
                      </>
                    )}
                    {b.status === 'CONFIRMED' && (
                      <form action={completeBookingAction} style={{ display: 'inline' }}>
                        <input type="hidden" name="id" value={b.id} />
                        <button type="submit" className="btn-outline" style={{ padding: '6px 14px', fontSize: 12 }}>
                          Complete
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
