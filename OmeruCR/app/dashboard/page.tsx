import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { PERMISSIONS, has } from '@/lib/permissions';
import { db } from '@/lib/db';
import { abandonedCheckouts } from '@/lib/fraud';
import CrShell from '@/components/CrShell';
import { platformMode } from '@/lib/mode';

export const dynamic = 'force-dynamic';

const zar = (n: number) =>
  'R' + n.toLocaleString('en-ZA', { maximumFractionDigits: 0 });

async function stats() {
  const now = Date.now();
  const d7 = new Date(now - 7 * 86400e3);
  const d30 = new Date(now - 30 * 86400e3);
  const PAID: ('PAID' | 'READY_FOR_PICKUP' | 'COMPLETED')[] = ['PAID', 'READY_FOR_PICKUP', 'COMPLETED'];

  const [merchants, openStores, customers, orders30, orders7, pending, recentMerchants, allOrders30, abandoned] =
    await Promise.all([
      db.merchant.count({ where: { status: 'ACTIVE' } }),
      db.merchant.count({ where: { status: 'ACTIVE', manual_closed: false } }),
      db.merchantCustomer.count({ where: { opt_out: false } }),
      db.order.findMany({ where: { createdAt: { gte: d30 }, status: { in: PAID } }, select: { total: true } }),
      db.order.findMany({ where: { createdAt: { gte: d7 }, status: { in: PAID } }, select: { total: true } }),
      db.order.count({ where: { status: 'PENDING' } }),
      db.merchant.findMany({
        orderBy: { createdAt: 'desc' }, take: 6,
        select: { handle: true, trading_name: true, store_category: true, province: true, createdAt: true },
      }),
      db.order.count({ where: { createdAt: { gte: d30 } } }),
      abandonedCheckouts(7, 24),
    ]);

  const rev30 = orders30.reduce((s, o) => s + o.total, 0);
  const rev7 = orders7.reduce((s, o) => s + o.total, 0);
  const conversion30 = allOrders30 > 0 ? Math.round((orders30.length / allOrders30) * 100) : null;
  const aov30 = orders30.length > 0 ? rev30 / orders30.length : 0;
  return { merchants, openStores, customers, rev30, rev7, orders30: orders30.length, orders7: orders7.length, pending, recentMerchants, conversion30, aov30, abandoned };
}

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!has(session, PERMISSIONS.VIEW_ANALYTICS)) {
    return (
      <CrShell name={session.name} isRoot={session.is_root} mode={platformMode()}>
        <p className="cr-help">Your account does not have the analytics permission. Ask a Control Room admin.</p>
      </CrShell>
    );
  }

  const s = await stats();
  const kpis = [
    { label: 'Active merchants', value: String(s.merchants), sub: `${s.openStores} currently open` },
    { label: 'Opted-in customers', value: String(s.customers), sub: 'reachable by broadcast' },
    { label: 'Revenue · 30d', value: zar(s.rev30), sub: `${s.orders30} paid orders` },
    { label: 'Revenue · 7d', value: zar(s.rev7), sub: `${s.orders7} paid orders` },
    { label: 'Pending orders', value: String(s.pending), sub: 'awaiting payment/action' },
    { label: 'Abandoned checkouts · 7d', value: String(s.abandoned.count), sub: `${zar(s.abandoned.valueZar)} left at payment` },
    { label: 'Checkout conversion · 30d', value: s.conversion30 != null ? s.conversion30 + '%' : '—', sub: 'paid ÷ all orders' },
    { label: 'Average order · 30d', value: zar(s.aov30), sub: 'per paid order' },
  ];

  return (
    <CrShell name={session.name} isRoot={session.is_root} mode={platformMode()}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
        Ecosystem health
      </h1>
      <p className="cr-help" style={{ marginBottom: 20 }}>
        All commerce figures are anonymised aggregates — no customer identities are shown here.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 28 }}>
        {kpis.map((k) => (
          <div key={k.label} className="cr-card">
            <div className="cr-label">{k.label}</div>
            <div className="cr-kpi-number">{k.value}</div>
            <div className="cr-help" style={{ marginTop: 6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="cr-card">
        <div className="cr-label" style={{ marginBottom: 12 }}>Newest merchants</div>
        <table className="cr-table">
          <thead>
            <tr><th>Store</th><th>Handle</th><th>Category</th><th>Province</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {s.recentMerchants.map((m) => (
              <tr key={m.handle}>
                <td>{m.trading_name}</td>
                <td style={{ color: 'var(--text-2)' }}>@{m.handle}</td>
                <td>{m.store_category ?? '—'}</td>
                <td>{m.province ?? '—'}</td>
                <td style={{ color: 'var(--text-2)' }}>{new Date(m.createdAt).toLocaleDateString('en-ZA')}</td>
              </tr>
            ))}
            {s.recentMerchants.length === 0 && (
              <tr><td colSpan={5} className="cr-help">No merchants yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </CrShell>
  );
}
