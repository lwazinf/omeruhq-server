import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { toggleShopAction } from './actions';

function formatZAR(n: number) {
  return `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING:          { label: 'New',       color: 'var(--lime)' },
  PAID:             { label: 'Preparing', color: '#f5c842' },
  READY_FOR_PICKUP: { label: 'Ready',     color: 'rgba(255,255,255,0.55)' },
  COMPLETED:        { label: 'Done',      color: 'rgba(255,255,255,0.3)' },
  CANCELLED:        { label: 'Cancelled', color: '#f87171' },
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const d7  = new Date(Date.now() - 7  * 86_400_000);
  const d30 = new Date(Date.now() - 30 * 86_400_000);
  const PAID_STATES = ['PAID', 'READY_FOR_PICKUP', 'COMPLETED'] as const;
  const mid = session.merchant_id;

  const [
    merchant, todayRevAgg, todayOrders, pendingCount,
    rev7dAgg, rev30dAgg, upcomingBookings, recentOrders,
    topItems, customerCount,
  ] = await Promise.all([
    db.merchant.findUnique({ where: { id: mid }, select: { trading_name: true, manual_closed: true } }),
    db.order.aggregate({ where: { merchant_id: mid, createdAt: { gte: todayStart }, status: { in: [...PAID_STATES] } }, _sum: { total: true } }),
    db.order.count({ where: { merchant_id: mid, createdAt: { gte: todayStart } } }),
    db.order.count({ where: { merchant_id: mid, status: { in: ['PENDING', 'PAID'] } } }),
    db.order.aggregate({ where: { merchant_id: mid, createdAt: { gte: d7  }, status: { in: [...PAID_STATES] } }, _sum: { total: true } }),
    db.order.aggregate({ where: { merchant_id: mid, createdAt: { gte: d30 }, status: { in: [...PAID_STATES] } }, _sum: { total: true } }),
    db.booking.count({ where: { merchant_id: mid, status: 'CONFIRMED', start_at: { gte: new Date() } } }),
    db.order.findMany({
      where: { merchant_id: mid },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, total: true, status: true, customer_id: true, items_summary: true },
    }),
    db.orderItem.groupBy({
      by: ['product_id'],
      where: { order: { merchant_id: mid, status: { in: [...PAID_STATES] }, createdAt: { gte: d30 } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    db.merchantCustomer.count({ where: { merchant_id: mid } }),
  ]);

  const productNames = topItems.length
    ? await db.product.findMany({ where: { id: { in: topItems.map(t => t.product_id) } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(productNames.map(p => [p.id, p.name]));

  const waIds = [...new Set(recentOrders.map(o => o.customer_id).filter(Boolean))];
  const customerRecs = waIds.length
    ? await db.merchantCustomer.findMany({ where: { merchant_id: mid, wa_id: { in: waIds } }, select: { wa_id: true, display_name: true } })
    : [];
  const nameByWaId = new Map(customerRecs.map(c => [c.wa_id, c.display_name ?? 'Customer']));

  const todayRev = todayRevAgg._sum.total ?? 0;
  const rev7d    = rev7dAgg._sum.total  ?? 0;
  const rev30d   = rev30dAgg._sum.total ?? 0;
  const isOpen   = !merchant?.manual_closed;

  const dayStr = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', color: 'white', lineHeight: 1, margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
            {dayStr} · here&apos;s how <span style={{ color: 'var(--lime)' }}>{merchant?.trading_name}</span> is doing
          </p>
        </div>
        <form action={toggleShopAction}>
          <input type="hidden" name="merchant_id" value={mid} />
          <input type="hidden" name="current_state" value={isOpen ? 'open' : 'closed'} />
          <button type="submit" style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isOpen ? 'var(--lime)' : '#ef4444', boxShadow: isOpen ? '0 0 6px var(--lime)' : '0 0 6px #ef4444', display: 'inline-block', flexShrink: 0 }} />
            Store {isOpen ? 'Open' : 'Closed'} — tap to {isOpen ? 'close' : 'open'}
          </button>
        </form>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Today Revenue',      value: formatZAR(todayRev), lime: true },
          { label: 'Today Orders',       value: String(todayOrders), lime: false },
          { label: 'Pending Now',        value: String(pendingCount), lime: pendingCount > 0 },
          { label: 'Upcoming Bookings',  value: String(upcomingBookings), lime: false },
        ].map(({ label, value, lime }) => (
          <div key={label} className="card" style={{ padding: '22px 24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', color: lime ? 'var(--lime)' : 'white', lineHeight: 1, marginBottom: 8 }}>
              {value}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue + Top Products ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>

        {/* Revenue */}
        <div className="card" style={{ padding: '22px 26px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 18 }}>Revenue</div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[
              { val: rev7d,  label: 'Last 7 days',  lime: true },
              { val: rev30d, label: 'Last 30 days', lime: true },
              { val: customerCount, label: 'Customers', lime: false, raw: true },
            ].map(({ val, label, lime, raw }) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', color: lime ? 'var(--lime)' : 'white', lineHeight: 1 }}>
                  {raw ? val.toLocaleString() : formatZAR(val as number)}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="card" style={{ padding: '22px 26px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 18 }}>
            Top Products (30d)
          </div>
          {topItems.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>No orders yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {topItems.map((t, i) => {
                const qty    = t._sum.quantity ?? 0;
                const maxQty = topItems[0]._sum.quantity ?? 1;
                return (
                  <div key={t.product_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'rgba(255,255,255,0.2)', width: 12, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.65)', flex: '0 0 120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {nameById.get(t.product_id) ?? 'Product'}
                    </span>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(qty / maxQty) * 100}%`, background: 'var(--lime)', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0, textAlign: 'right', width: 48 }}>{qty} sold</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 14px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>Recent Orders</span>
          <a href="/orders" style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--lime)', textDecoration: 'none' }}>View all →</a>
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
        {recentOrders.length === 0 ? (
          <p style={{ padding: '24px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>No orders yet</p>
        ) : recentOrders.map((o, i) => {
          const st   = STATUS[o.status] ?? { label: o.status, color: 'rgba(255,255,255,0.4)' };
          const name = shortName(nameByWaId.get(o.customer_id) ?? 'Customer');
          return (
            <div key={o.id} style={{
              display: 'grid', gridTemplateColumns: '52px 110px 1fr 100px 72px',
              padding: '13px 24px', alignItems: 'center',
              borderBottom: i < recentOrders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.02em' }}>
                #{o.id.slice(-4).toUpperCase()}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                {name}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 16 }}>
                {o.items_summary ?? '—'}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: st.color }}>
                {st.label}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--lime)', textAlign: 'right' }}>
                {formatZAR(o.total)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
