import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import ServicesSection from './ServicesSection';
import { confirmBookingAction, declineBookingAction, completeBookingAction } from './actions';

function formatBookingDate(d: Date): string {
  const weekday = d.toLocaleDateString('en-ZA', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('en-ZA', { month: 'short' });
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${weekday} ${day} ${month} · ${hh}:${mm}`;
}

const AVATAR_COLORS = [
  { bg: 'rgba(200,241,53,0.15)',   color: '#C8F135' },
  { bg: 'rgba(251,191,36,0.15)',   color: '#fbbf24' },
  { bg: 'rgba(96,165,250,0.15)',   color: '#60a5fa' },
  { bg: 'rgba(167,139,250,0.15)',  color: '#a78bfa' },
  { bg: 'rgba(52,211,153,0.15)',   color: '#34d399' },
  { bg: 'rgba(251,113,133,0.15)',  color: '#fb7185' },
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

const STATUS_BADGE: Record<string, { color: string; bg: string; border: string }> = {
  PENDING:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.25)' },
  CONFIRMED: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)' },
  REJECTED:  { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)' },
  CANCELLED: { color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
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
      include: { service: { select: { name: true } } },
      orderBy: { start_at: 'asc' },
      take: 20,
    }),
  ]);

  return (
    <div className="portal-page" style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 36px)', maxWidth: 1100 }}>

      {/* ── Services (header lives inside client component for Add button state) ── */}
      <ServicesSection services={services} />

      {/* ── Upcoming bookings ── */}
      <div style={{ marginTop: 52 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
            letterSpacing: '-0.02em', color: 'white', margin: '0 0 4px',
          }}>
            Upcoming bookings
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            Pending and confirmed bookings from today onwards
          </p>
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
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              Bookings from customers will appear here once received.
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {bookings.map((b, i) => {
              const name = b.customer_name ?? 'Customer';
              const initial = name.charAt(0).toUpperCase();
              const av = avatarColor(name);
              const badge = STATUS_BADGE[b.status] ?? STATUS_BADGE.CONFIRMED;
              const dateStr = formatBookingDate(new Date(b.start_at));

              return (
                <div
                  key={b.id}
                  style={{
                    padding: '14px 20px',
                    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                    borderBottom: i < bookings.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: av.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800,
                    color: av.color,
                  }}>
                    {initial}
                  </div>

                  {/* Name + service */}
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 2 }}>
                      {name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                      {b.service.name}
                    </div>
                  </div>

                  {/* Date · status · actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                      {dateStr}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      padding: '3px 10px', borderRadius: 100,
                      color: badge.color, background: badge.bg,
                      border: `1px solid ${badge.border}`,
                    }}>
                      {b.status.charAt(0) + b.status.slice(1).toLowerCase()}
                    </span>

                    {b.status === 'PENDING' && (
                      <>
                        <form action={confirmBookingAction} style={{ display: 'inline' }}>
                          <input type="hidden" name="id" value={b.id} />
                          <button type="submit" className="btn-lime" style={{ padding: '5px 13px', fontSize: 12 }}>
                            Confirm
                          </button>
                        </form>
                        <form action={declineBookingAction} style={{ display: 'inline' }}>
                          <input type="hidden" name="id" value={b.id} />
                          <button type="submit" className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12, color: 'rgba(239,68,68,0.65)' }}>
                            Decline
                          </button>
                        </form>
                      </>
                    )}
                    {b.status === 'CONFIRMED' && (
                      <form action={completeBookingAction} style={{ display: 'inline' }}>
                        <input type="hidden" name="id" value={b.id} />
                        <button type="submit" className="btn-outline" style={{ padding: '5px 13px', fontSize: 12 }}>
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
