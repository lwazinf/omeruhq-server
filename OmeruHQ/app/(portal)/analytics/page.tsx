import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

function fmt(n: number) {
  return `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const mid = session.merchant_id;
  const now = new Date();
  const d7   = new Date(now.getTime() - 7  * 86_400_000);
  const d14  = new Date(now.getTime() - 14 * 86_400_000);
  const d30  = new Date(now.getTime() - 30 * 86_400_000);
  const d60  = new Date(now.getTime() - 60 * 86_400_000);
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const PAID = ['PAID', 'READY_FOR_PICKUP', 'COMPLETED'] as const;

  const [
    rev30Agg, rev7Agg, revTodayAgg, revPrev30Agg,
    orderTotal30, orderCompleted30, orderCancelled30,
    recentOrders14,
    topItems,
    customerTotal, newCustomers7d, newCustomers30d,
    topCustomersRaw,
    allOrders30forPatterns,
    bookingCompleted,
  ] = await Promise.all([
    db.order.aggregate({ where: { merchant_id: mid, createdAt: { gte: d30 }, status: { in: [...PAID] } }, _sum: { total: true } }),
    db.order.aggregate({ where: { merchant_id: mid, createdAt: { gte: d7  }, status: { in: [...PAID] } }, _sum: { total: true } }),
    db.order.aggregate({ where: { merchant_id: mid, createdAt: { gte: todayStart }, status: { in: [...PAID] } }, _sum: { total: true } }),
    db.order.aggregate({ where: { merchant_id: mid, createdAt: { gte: d60, lt: d30 }, status: { in: [...PAID] } }, _sum: { total: true } }),
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
    db.merchantCustomer.count({ where: { merchant_id: mid, createdAt: { gte: d30 } } }),
    db.order.groupBy({
      by: ['customer_id'],
      where: { merchant_id: mid, createdAt: { gte: d30 }, status: { in: [...PAID] } },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 6,
    }),
    db.order.findMany({
      where: { merchant_id: mid, createdAt: { gte: d30 } },
      select: { createdAt: true, total: true, status: true },
    }),
    db.booking.count({ where: { merchant_id: mid, createdAt: { gte: d30 }, status: 'COMPLETED' } }),
  ]);

  // ── Resolve top customer wa_ids to display names ──
  const customerIds = topCustomersRaw.map(c => c.customer_id);
  const customerRecords = customerIds.length
    ? await db.merchantCustomer.findMany({
        where: { merchant_id: mid, wa_id: { in: customerIds } },
        select: { wa_id: true, display_name: true },
      })
    : [];
  const nameByWaId = new Map(customerRecords.map(c => [c.wa_id, c.display_name ?? c.wa_id]));

  // ── Resolve top product names ──
  const productIds = topItems.map(t => t.product_id);
  const products = productIds.length
    ? await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(products.map(p => [p.id, p.name]));

  const rev30 = rev30Agg._sum.total ?? 0;
  const rev7  = rev7Agg._sum.total ?? 0;
  const revToday = revTodayAgg._sum.total ?? 0;
  const revPrev30 = revPrev30Agg._sum.total ?? 0;

  const revGrowthPct = revPrev30 > 0 ? Math.round(((rev30 - revPrev30) / revPrev30) * 100) : null;
  const completionRate = orderTotal30 > 0 ? Math.round((orderCompleted30 / orderTotal30) * 100) : 0;
  const cancellationRate = orderTotal30 > 0 ? Math.round((orderCancelled30 / orderTotal30) * 100) : 0;

  // ── 14-day daily revenue buckets ──
  const buckets: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const o of recentOrders14) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (key in buckets) buckets[key] += o.total;
  }
  const dailyData = Object.entries(buckets).map(([date, rev]) => ({ date, rev }));
  const maxRev = Math.max(...dailyData.map(d => d.rev), 1);

  // ── 30-day projection (7-day moving average × 30) ──
  const lastSevenRevs = dailyData.slice(-7).map(d => d.rev);
  const sevenDayAvg = lastSevenRevs.reduce((a, b) => a + b, 0) / 7;
  const projectedRev30 = sevenDayAvg * 30;

  // ── Buying pattern: orders by day of week ──
  const dowCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun–Sat
  for (const o of allOrders30forPatterns) {
    dowCounts[o.createdAt.getDay()]++;
  }
  const dowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxDow = Math.max(...dowCounts, 1);


  // ── Customer health ──
  const returningCustomers30 = customerTotal - newCustomers30d;
  const avgOrderValue = orderTotal30 > 0 ? rev30 / orderTotal30 : 0;
  const topCustomerSpend = topCustomersRaw[0]?._sum.total ?? 0;

  const kpiNum: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 4 };
  const kpiLabel: React.CSSProperties = { fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)' };
  const kpiSub: React.CSSProperties = { fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 };

  return (
    <div className="portal-page" style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 36px)', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em' }}>Analytics</div>
          {revGrowthPct !== null && (
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, padding: '2px 9px', borderRadius: 100,
              background: revGrowthPct >= 0 ? 'rgba(200,241,53,0.1)' : 'rgba(239,68,68,0.1)',
              color: revGrowthPct >= 0 ? 'var(--lime)' : '#ef4444',
              border: `1px solid ${revGrowthPct >= 0 ? 'rgba(200,241,53,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
              {revGrowthPct >= 0 ? '+' : ''}{revGrowthPct}% vs prev 30d
            </span>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginTop: 2 }}>
          Revenue, customer behaviour, and buying patterns
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: "Today's revenue", value: fmt(revToday), accent: true, sub: null },
          { label: '7-day revenue',   value: fmt(rev7),     sub: null },
          { label: '30-day revenue',  value: fmt(rev30),    sub: revGrowthPct !== null ? `${revGrowthPct >= 0 ? '+' : ''}${revGrowthPct}% vs prev` : null },
          { label: 'Avg order value', value: fmt(avgOrderValue), sub: `${orderTotal30} orders` },
          { label: 'Completion rate', value: `${completionRate}%`, sub: `${orderCompleted30} completed` },
          { label: 'Projected (30d)', value: fmt(projectedRev30), isProjection: true, sub: '7-day avg trend' },
        ].map(({ label, value, accent, sub, isProjection }) => (
          <div key={label} className="card" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            {isProjection && (
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 30%, rgba(200,241,53,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
            )}
            <div style={{ ...kpiNum, color: accent ? 'var(--lime)' : isProjection ? 'rgba(200,241,53,0.6)' : 'rgba(255,255,255,0.92)' }}>
              {value}
            </div>
            <div style={kpiLabel}>{label}</div>
            {sub && <div style={kpiSub}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Revenue chart + projection */}
      <div className="card" style={{ padding: '24px 24px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Daily revenue — last 14 days
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--lime)' }} /> Revenue
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(200,241,53,0.3)', border: '1px dashed rgba(200,241,53,0.5)' }} /> 7d avg
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
          {dailyData.map(({ date, rev }) => {
            const pct = (rev / maxRev) * 100;
            const avgPct = (sevenDayAvg / maxRev) * 100;
            const label = new Date(date + 'T12:00:00').toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
            return (
              <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                {/* 7d avg line marker */}
                <div style={{ position: 'absolute', bottom: `${avgPct}%`, left: 0, right: 0, height: 1, background: 'rgba(200,241,53,0.2)', borderTop: '1px dashed rgba(200,241,53,0.3)' }} />
                <div
                  title={`${label}: ${fmt(rev)}`}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Buying patterns — day of week */}
        <div className="card" style={{ padding: '24px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>
            Buying patterns
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)', marginBottom: 18 }}>Orders by day of week — last 30 days</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginBottom: 8 }}>
            {dowCounts.map((count, i) => {
              const pct = (count / maxDow) * 100;
              const isToday = i === new Date().getDay();
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', borderRadius: '3px 3px 0 0', height: `${Math.max(pct, count > 0 ? 6 : 2)}%`, background: isToday ? 'var(--lime)' : 'rgba(200,241,53,0.4)' }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {dowLabels.map((l, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 9, color: i === new Date().getDay() ? 'var(--lime)' : 'rgba(255,255,255,0.25)', fontWeight: i === new Date().getDay() ? 700 : 400 }}>{l}</div>
            ))}
          </div>
        </div>

        {/* Order health */}
        <div className="card" style={{ padding: '24px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>
            Order health
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)', marginBottom: 18 }}>Last 30 days</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Total orders',       value: orderTotal30,       color: 'rgba(255,255,255,0.6)', isNum: true },
              { label: 'Completed',          value: orderCompleted30,   color: 'var(--lime)',            isNum: true },
              { label: 'Cancelled',          value: orderCancelled30,   color: '#ef4444',               isNum: true },
              { label: 'Completion rate',    value: `${completionRate}%`, color: 'var(--lime)' },
              { label: 'Bookings completed', value: bookingCompleted,   color: 'rgba(255,255,255,0.5)', isNum: true },
            ].map(({ label, value, color, isNum }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: isNum ? 18 : 15, fontWeight: 700, color, letterSpacing: '-0.01em' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="card" style={{ padding: '24px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>
            Top products
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)', marginBottom: 18 }}>Units sold — last 30 days</div>
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
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>{qty}</span>
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

        {/* Top customers by spend */}
        <div className="card" style={{ padding: '24px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>
            Top customers
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)', marginBottom: 18 }}>By spend — last 30 days</div>
          {topCustomersRaw.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', padding: '20px 0', textAlign: 'center' }}>No orders yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topCustomersRaw.map((c, i) => {
                const spend = c._sum.total ?? 0;
                const pct = Math.round((spend / topCustomerSpend) * 100);
                return (
                  <div key={c.customer_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 12 }}>
                        {nameByWaId.get(c.customer_id) ?? c.customer_id}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>{fmt(spend)}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: i === 0 ? 'var(--lime)' : 'rgba(200,241,53,0.4)' }} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 3 }}>{c._count.id} order{c._count.id !== 1 ? 's' : ''}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Customer growth */}
      <div className="card" style={{ padding: '24px 24px', marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 18, letterSpacing: '-0.01em' }}>
          Customer overview
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
          {[
            { label: 'Total customers',    value: customerTotal,          color: 'rgba(255,255,255,0.85)' },
            { label: 'New (last 30d)',     value: `+${newCustomers30d}`,  color: 'var(--lime)' },
            { label: 'New (last 7d)',      value: `+${newCustomers7d}`,   color: 'var(--lime)' },
            { label: 'Returning',          value: returningCustomers30,   color: 'rgba(255,255,255,0.6)' },
            { label: 'Avg order value',    value: fmt(avgOrderValue),     color: 'rgba(255,255,255,0.85)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.02em', marginBottom: 4 }}>{value}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {cancellationRate > 20 && (
        <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontFamily: 'var(--font-body)', fontSize: 13, color: '#ef4444', display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4.5v3M7 9.5v.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          Cancellation rate is {cancellationRate}% this month — review your fulfilment process.
        </div>
      )}
    </div>
  );
}
