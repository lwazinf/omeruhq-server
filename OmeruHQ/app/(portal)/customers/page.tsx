import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { toggleOptOutAction, toggleBookmarkAction } from './actions';

export default async function CustomersPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [customers, orderStats, totalCount, optedInCount, bookmarkedCount] = await Promise.all([
    db.merchantCustomer.findMany({
      where: { merchant_id: session.merchant_id },
      orderBy: [{ is_bookmarked: 'desc' }, { last_interaction_at: 'desc' }],
      take: 100,
    }),
    db.order.groupBy({
      by: ['customer_id'],
      where: { merchant_id: session.merchant_id, status: { not: 'CANCELLED' } },
      _count: { _all: true },
      _sum: { total: true },
    }),
    db.merchantCustomer.count({ where: { merchant_id: session.merchant_id } }),
    db.merchantCustomer.count({ where: { merchant_id: session.merchant_id, opt_out: false } }),
    db.merchantCustomer.count({ where: { merchant_id: session.merchant_id, is_bookmarked: true } }),
  ]);

  const statsByWaId = new Map(orderStats.map(s => [s.customer_id, { orders: s._count._all, spend: s._sum.total ?? 0 }]));

  function timeAgo(date: Date) {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="portal-page" style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 36px)', maxWidth: 1000 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em' }}>Customers</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginTop: 2 }}>
          Everyone who&apos;s interacted with your store on WhatsApp
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total customers', value: totalCount },
          { label: 'Opted in',        value: optedInCount,   accent: true },
          { label: 'Bookmarked',       value: bookmarkedCount },
        ].map(({ label, value, accent }) => (
          <div key={label} className="card" style={{ padding: '18px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: accent ? 'var(--lime)' : 'rgba(255,255,255,0.92)' }}>
              {value}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {customers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>No customers yet</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)' }}>
            Customers appear here once they interact with your store on WhatsApp.
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 120px 100px 96px', gap: 0, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
            {['Customer', 'Orders', 'Spend', 'Last seen', 'Actions'].map(h => (
              <div key={h} style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>

          {customers.map((c, i) => {
            const stats = statsByWaId.get(c.wa_id) ?? { orders: 0, spend: 0 };
            const name = c.display_name ?? 'Customer';
            return (
              <div
                key={c.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 70px 120px 100px 96px', gap: 0,
                  padding: '14px 20px', alignItems: 'center',
                  borderBottom: i < customers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: c.is_bookmarked ? 'rgba(200,241,53,0.03)' : 'transparent',
                }}
              >
                {/* Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {name}
                      </span>
                      {c.is_bookmarked && (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="var(--lime)" style={{ flexShrink: 0 }}>
                          <path d="M6 1l1.4 2.9L11 4.4l-2.5 2.4.6 3.4L6 8.7l-3.1 1.5.6-3.4L1 4.4l3.6-.5L6 1z"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                      {c.opt_out ? 'Opted out' : 'Opted in'}
                    </div>
                  </div>
                </div>

                {/* Orders */}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
                  {stats.orders}
                </div>

                {/* Spend */}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--lime)' }}>
                  {stats.spend > 0 ? `R ${stats.spend.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}` : '—'}
                </div>

                {/* Last seen */}
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)' }}>
                  {timeAgo(c.last_interaction_at)}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {/* Bookmark toggle */}
                  <form action={toggleBookmarkAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      title={c.is_bookmarked ? 'Remove bookmark' : 'Bookmark customer'}
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill={c.is_bookmarked ? 'var(--lime)' : 'none'} stroke={c.is_bookmarked ? 'var(--lime)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.2">
                        <path d="M6 1l1.4 2.9L11 4.4l-2.5 2.4.6 3.4L6 8.7l-3.1 1.5.6-3.4L1 4.4l3.6-.5L6 1z"/>
                      </svg>
                    </button>
                  </form>

                  {/* Opt-out toggle */}
                  <form action={toggleOptOutAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      title={c.opt_out ? 'Re-enable broadcast' : 'Mark as opted out'}
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {c.opt_out ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3" strokeLinecap="round">
                          <path d="M2 6h8M6 2v8"/>
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="rgba(239,68,68,0.5)" strokeWidth="1.3" strokeLinecap="round">
                          <path d="M2 6h8"/>
                        </svg>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {customers.length > 0 && (
        <div style={{ marginTop: 12, fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)', textAlign: 'right' }}>
          Showing {customers.length} of {totalCount} customers
        </div>
      )}
    </div>
  );
}
