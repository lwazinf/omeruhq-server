import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

function formatZAR(n: number) {
  return `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const mid = session.merchant_id;
  const now = new Date();
  const d7  = new Date(now.getTime() - 7  * 86_400_000);
  const d30 = new Date(now.getTime() - 30 * 86_400_000);
  const d14 = new Date(now.getTime() - 14 * 86_400_000);
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const PAID = ['PAID', 'READY_FOR_PICKUP', 'COMPLETED'] as const;

  const [
    rev30Agg, rev7Agg, revTodayAgg,
    orderTotal, orderCompleted, orderCancelled,
    recentOrders,
    topItems,
    customerTotal, newCustomers7d,
  ] = await Promise.all([
    db.order.aggregate({ where: { merchant_id: mid, createdAt: { gte: d30 }, status: { in: [...PAID] } }, _sum: { total: true } }),
    db.order.aggregate({ where: { merchant_id: mid, createdAt: { gte: d7  }, status: { in: [...PAID] } }, _sum: { total: true } }),
    db.order.aggregate({ where: { merchant_id: mid, createdAt: { gte: todayStart }, status: { in: [...PAID] } }, _sum: { total: true } }),
    db.order.count({ where: { merchant_id: mid, createdAt: { gte: d30 } } }),
    db.order.count({ where: { merchant_id: mid, createdAt: { gte: d30 }, status: 'COMPLETED' } }),
    db.order.count({ where: { merchant_id: mid, createdAt: { gte: d30 }, status: 'CANCELLED' } }),
    db.order.findMany({
      where: { merchant_id: mid, createdAt: { gte: d14 }, status: { in: [...PAID] } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.orderItem.groupBy({
      by: ['product_id'],
      where: { order: { merchant_id: mid, createdAt: { gte: d30 }, status: { in: [...PAID] } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 6,
    }),
    db.merchantCustomer.count({ where: { merchant_id: mid } }),
    db.merchantCustomer.count({ where: { merchant_id: mid, createdAt: { gte: d7 } } }),
  ]);

  const productIds = topItems.map(t => t.product_id);
  const products = productIds.length
    ? await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(products.map(p => [p.id, p.name]));

  const rev30 = rev30Agg._sum.total ?? 0;
  const rev7  = rev7Agg._sum.total ?? 0;
  const revToday = revTodayAgg._sum.total ?? 0;

  // Build last-14-day daily revenue buckets
  const buckets: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const o of recentOrders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (key in buckets) buckets[key] += o.total;
  }
  const dailyData = Object.entries(buckets).map(([date, rev]) => ({ date, rev }));
  const maxRev = Math.max(...dailyData.map(d => d.rev), 1);

  const completionRate = orderTotal > 0 ? Math.round((orderCompleted / orderTotal) * 100) : 0;
  const cancellationRate = orderTotal > 0 ? Math.round((orderCancelled / orderTotal) * 100) : 0;

  const kpiStyle: React.CSSProperties = { padding: '22px 24px' };
  const kpiNum: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 4 };
  const kpiLabel: React.CSSProperties = { fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)', fontWeight: 400 };

  return (
    <div className="portal-page" style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 36px)', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em' }}>Analytics</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginTop: 2 }}>
          Revenue, orders, and customer insights
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: "Today's revenue", value: formatZAR(revToday), accent: true },
          { label: '7-day revenue',   value: formatZAR(rev7) },
          { label: '30-day revenue',  value: formatZAR(rev30) },
          { label: 'Orders (30d)',    value: orderTotal.toString() },
          { label: 'Completion rate', value: `${completionRate}%` },
          { label: 'Customers',       value: customerTotal.toString() },
        ].map(({ label, value, accent }) => (
          <div key={label} className="card" style={kpiStyle}>
            <div style={{ ...kpiNum, color: accent ? 'var(--lime)' : 'rgba(255,255,255,0.92)' }}>{value}</div>
            <div style={kpiLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Revenue chart — last 14 days */}
        <div className="card" style={{ padding: '24px 24px 20px', gridColumn: 'span 2' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.01em' }}>
            Revenue — last 14 days
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {dailyData.map(({ date, rev }) => {
              const pct = (rev / maxRev) * 100;
              const label = new Date(date + 'T12:00:00').toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
              return (
                <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <div
                    title={`${label}: ${formatZAR(rev)}`}
                    style={{
                      width: '100%', borderRadius: '4px 4px 0 0',
                      height: `${Math.max(pct, rev > 0 ? 4 : 1)}%`,
                      background: rev > 0 ? 'var(--lime)' : 'rgba(255,255,255,0.07)',
                      transition: 'height 0.3s ease',
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--mid-gray)' }}>
              {new Date(dailyData[0].date + 'T12:00:00').toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--mid-gray)' }}>Today</span>
          </div>
        </div>

        {/* Top products */}
        <div className="card" style={{ padding: '24px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 18, letterSpacing: '-0.01em' }}>
            Top products
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 400, color: 'var(--mid-gray)', marginLeft: 8 }}>last 30 days</span>
          </div>
          {topItems.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', padding: '20px 0', textAlign: 'center' }}>No sales data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topItems.map((item, i) => {
                const qty = item._sum.quantity ?? 0;
                const maxQty = topItems[0]._sum.quantity ?? 1;
                const pct = Math.round((qty / maxQty) * 100);
                return (
                  <div key={item.product_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 12 }}>
                        {nameById.get(item.product_id) ?? '—'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>{qty} sold</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: i === 0 ? 'var(--lime)' : 'rgba(200,241,53,0.4)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order health */}
        <div className="card" style={{ padding: '24px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 18, letterSpacing: '-0.01em' }}>
            Order health
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 400, color: 'var(--mid-gray)', marginLeft: 8 }}>last 30 days</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Total orders',   value: orderTotal,    color: 'rgba(255,255,255,0.6)' },
              { label: 'Completed',      value: orderCompleted, color: 'var(--lime)' },
              { label: 'Cancelled',      value: orderCancelled, color: '#ef4444' },
              { label: 'Completion rate', value: `${completionRate}%`, color: 'var(--lime)', isText: true },
              { label: 'New customers (7d)', value: `+${newCustomers7d}`, color: 'rgba(255,255,255,0.6)', isText: true },
            ].map(({ label, value, color, isText }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: isText ? 15 : 20, fontWeight: 700, color, letterSpacing: '-0.01em' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {cancellationRate > 20 && (
        <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontFamily: 'var(--font-body)', fontSize: 13, color: '#ef4444', display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4.5v3M7 9.5v.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          Your cancellation rate is {cancellationRate}% this month — consider reviewing your order fulfilment flow.
        </div>
      )}
    </div>
  );
}
