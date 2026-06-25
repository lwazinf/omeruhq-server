import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { toggleShopAction } from './actions';

function formatZAR(n: number) {
  return `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function statusPill(status: string) {
  const map: Record<string, string> = {
    PENDING: 'pill-yellow', PAID: 'pill-lime', READY_FOR_PICKUP: 'pill-dark',
    COMPLETED: 'pill-lime', CANCELLED: 'pill-red',
  };
  const labels: Record<string, string> = {
    PENDING: 'Pending', PAID: 'Paid', READY_FOR_PICKUP: 'Ready',
    COMPLETED: 'Done', CANCELLED: 'Cancelled',
  };
  return <span className={`pill ${map[status] ?? 'pill-warm'}`}>{labels[status] ?? status}</span>;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const d7 = new Date(Date.now() - 7 * 86_400_000);
  const d30 = new Date(Date.now() - 30 * 86_400_000);
  const PAID_STATES = ['PAID', 'READY_FOR_PICKUP', 'COMPLETED'] as const;
  const mid = session.merchant_id;

  const [merchant, todayRevAgg, todayOrders, pendingCount, rev7dAgg, rev30dAgg, upcomingBookings, recentOrders, topItems, customerCount] =
    await Promise.all([
      db.merchant.findUnique({ where: { id: mid }, select: { trading_name: true, manual_closed: true } }),
      db.order.aggregate({ where: { merchant_id: mid, createdAt: { gte: todayStart }, status: { in: [...PAID_STATES] } }, _sum: { total: true } }),
      db.order.count({ where: { merchant_id: mid, createdAt: { gte: todayStart } } }),
      db.order.count({ where: { merchant_id: mid, status: { in: ['PENDING', 'PAID'] } } }),
      db.order.aggregate({ where: { merchant_id: mid, createdAt: { gte: d7 }, status: { in: [...PAID_STATES] } }, _sum: { total: true } }),
      db.order.aggregate({ where: { merchant_id: mid, createdAt: { gte: d30 }, status: { in: [...PAID_STATES] } }, _sum: { total: true } }),
      db.booking.count({ where: { merchant_id: mid, status: 'CONFIRMED', start_at: { gte: new Date() } } }),
      db.order.findMany({ where: { merchant_id: mid }, orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, total: true, status: true, createdAt: true } }),
      db.orderItem.groupBy({ by: ['product_id'], where: { order: { merchant_id: mid, status: { in: [...PAID_STATES] }, createdAt: { gte: d30 } } }, _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 5 }),
      db.merchantCustomer.count({ where: { merchant_id: mid } }),
    ]);

  const productNames = topItems.length
    ? await db.product.findMany({ where: { id: { in: topItems.map(t => t.product_id) } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(productNames.map(p => [p.id, p.name]));

  const todayRev = todayRevAgg._sum.total ?? 0;
  const rev7d = rev7dAgg._sum.total ?? 0;
  const rev30d = rev30dAgg._sum.total ?? 0;
  const isOpen = !merchant?.manual_closed;

  return (
    <div className="portal-page" style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 36px)', maxWidth: 1100 }}>
      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em' }}>
            {merchant?.trading_name}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginTop: 2 }}>
            {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <form action={toggleShopAction}>
          <input type="hidden" name="merchant_id" value={mid} />
          <input type="hidden" name="current_state" value={isOpen ? 'open' : 'closed'} />
          <button type="submit" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
            borderRadius: 100, border: '1.5px solid rgba(0,0,0,0.12)',
            background: 'white', cursor: 'pointer', fontFamily: 'var(--font-body)',
            fontSize: 13, fontWeight: 500, transition: 'border-color 0.2s',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOpen ? 'var(--lime)' : '#ef4444', boxShadow: isOpen ? '0 0 5px var(--lime)' : '0 0 5px #ef4444' }} />
            Store {isOpen ? 'Open' : 'Closed'} — {isOpen ? 'Close' : 'Open'}
          </button>
        </form>
      </div>

      {/* ── KPI strip ── */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Today Revenue" value={formatZAR(todayRev)} />
        <KpiCard label="Today Orders" value={String(todayOrders)} />
        <KpiCard label="Pending Now" value={String(pendingCount)} featured={pendingCount > 0} />
        <KpiCard label="Upcoming Bookings" value={String(upcomingBookings)} />
      </div>

      {/* ── Revenue summary ── */}
      <div className="revenue-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: 16 }}>Revenue</div>
          <div style={{ display: 'flex', gap: 28 }}>
            {[{ label: 'Last 7 days', val: rev7d }, { label: 'Last 30 days', val: rev30d }].map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{formatZAR(val)}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{customerCount.toLocaleString()}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)', marginTop: 2 }}>Customers</div>
            </div>
          </div>
        </div>

        {/* Top products */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: 16 }}>Top Products (30d)</div>
          {topItems.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)' }}>No orders yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topItems.map((t, i) => {
                const qty = t._sum.quantity ?? 0;
                const maxQty = topItems[0]._sum.quantity ?? 1;
                return (
                  <div key={t.product_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: 12, marginBottom: 4 }}>
                      <span>{nameById.get(t.product_id) ?? 'Product'}</span>
                      <span style={{ color: 'var(--mid-gray)' }}>{qty} sold</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--warm-gray)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${(qty / maxQty) * 100}%`, background: i === 0 ? 'var(--lime)' : 'var(--lime-muted)', borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent orders ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 14px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700 }}>Recent Orders</div>
          <a href="/orders" style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)', textDecoration: 'none' }}>View all →</a>
        </div>
        <div className="divider" />
        {recentOrders.length === 0 ? (
          <p style={{ padding: '24px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)' }}>No orders yet</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th><th>Total</th><th>Status</th><th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)' }}>#{o.id.slice(-6)}</td>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{formatZAR(o.total)}</td>
                  <td>{statusPill(o.status)}</td>
                  <td style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)' }}>
                    {new Date(o.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, featured = false }: { label: string; value: string; featured?: boolean }) {
  return (
    <div className="card" style={{ padding: '20px 22px', background: featured ? 'var(--dark-gray)' : 'white' }}>
      <div className="kpi-number" style={{ color: featured ? 'var(--lime)' : 'var(--black)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: featured ? 'rgba(255,255,255,0.4)' : 'var(--mid-gray)' }}>{label}</div>
    </div>
  );
}
