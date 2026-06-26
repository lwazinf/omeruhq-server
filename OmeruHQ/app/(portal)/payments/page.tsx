import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { requestPayoutAction } from './actions';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function fmt(n: number) {
  return `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function relDate(d: Date) {
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function PaymentsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const mid = session.merchant_id;

  const [
    unpaidOrders,
    payouts,
    platform,
    merchant,
    allTimeGross,
    allTimeNet,
  ] = await Promise.all([
    db.order.findMany({
      where: { merchant_id: mid, status: 'COMPLETED', payout_id: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, total: true, createdAt: true, customer_id: true, items_summary: true },
    }),
    db.payout.findMany({
      where: { merchant_id: mid },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    db.platformBranding.findFirst({ select: { platform_fee: true, payout_day: true } }),
    db.merchant.findUnique({
      where: { id: mid },
      select: { bank_name: true, bank_acc_no: true, bank_type: true, trading_name: true },
    }),
    db.payout.aggregate({ where: { merchant_id: mid, status: 'COMPLETED' }, _sum: { gross_amount: true } }),
    db.payout.aggregate({ where: { merchant_id: mid, status: 'COMPLETED' }, _sum: { net_amount: true } }),
  ]);

  const feePct = platform?.platform_fee ?? 5;
  const pendingGross = unpaidOrders.reduce((s, o) => s + o.total, 0);
  const pendingNet = pendingGross * (1 - feePct / 100);
  const pendingFee = pendingGross * (feePct / 100);

  const nextPayoutDay = platform?.payout_day
    ? (() => {
        const targetDow = DAYS.findIndex(d => d.toLowerCase() === platform.payout_day!.toLowerCase());
        if (targetDow === -1) return null;
        const today = new Date(); const dow = today.getDay();
        const diff = (targetDow - dow + 7) % 7 || 7;
        const next = new Date(today.getTime() + diff * 86_400_000);
        return next.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'short' });
      })()
    : null;

  const statusMeta: Record<string, { label: string; bg: string; color: string; border: string }> = {
    PENDING:    { label: 'Pending',    bg: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.08)' },
    REQUESTED:  { label: 'Requested', bg: 'rgba(245,200,66,0.1)',   color: '#f5c842',               border: 'rgba(245,200,66,0.25)' },
    PROCESSING: { label: 'Processing',bg: 'rgba(99,102,241,0.1)',   color: '#818cf8',               border: 'rgba(99,102,241,0.25)' },
    COMPLETED:  { label: 'Paid',      bg: 'rgba(200,241,53,0.1)',   color: 'var(--lime)',            border: 'rgba(200,241,53,0.2)' },
    FAILED:     { label: 'Failed',    bg: 'rgba(239,68,68,0.1)',    color: '#ef4444',               border: 'rgba(239,68,68,0.2)' },
  };

  return (
    <div className="portal-page" style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 36px)', maxWidth: 900 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em' }}>Payments</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginTop: 2 }}>
          Payouts, platform fees, and your payout schedule
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Pending payout',      value: fmt(pendingNet),                          accent: pendingNet > 0, sub: `${unpaidOrders.length} completed orders` },
          { label: 'Platform fees owed',  value: fmt(pendingFee),                          warn: pendingFee > 0,   sub: `${feePct}% of gross` },
          { label: 'Total paid out',      value: fmt(allTimeNet._sum.net_amount ?? 0),                            sub: 'All time' },
          { label: 'Next payout',         value: nextPayoutDay ?? '—',                     isText: true,          sub: platform?.payout_day ?? 'Not scheduled' },
        ].map(({ label, value, accent, warn, isText, sub }) => (
          <div key={label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{
              fontFamily: isText ? 'var(--font-body)' : 'var(--font-display)',
              fontSize: isText ? 14 : 22, fontWeight: isText ? 600 : 800, letterSpacing: '-0.015em',
              color: accent ? 'var(--lime)' : warn ? '#f5c842' : 'rgba(255,255,255,0.85)',
              marginBottom: 4,
            }}>{value}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)', fontWeight: 500 }}>{label}</div>
            {sub && <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Bank account on file */}
      {merchant?.bank_acc_no && (
        <div className="card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="var(--lime)" strokeWidth="1.3"/>
                <path d="M1 6h14" stroke="var(--lime)" strokeWidth="1.3"/>
                <path d="M4 10h3" stroke="var(--lime)" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                {merchant.bank_name} · {merchant.bank_type} · ••••{merchant.bank_acc_no.slice(-4)}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)', marginTop: 1 }}>Payout bank account</div>
            </div>
          </div>
          <a href="/settings" style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)', textDecoration: 'none' }}>Edit in Settings →</a>
        </div>
      )}

      {/* Pending payout section */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>
              Unpaid completed orders
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)', marginTop: 2 }}>
              {unpaidOrders.length === 0 ? 'Nothing pending' : `${unpaidOrders.length} orders · gross ${fmt(pendingGross)} · your cut ${fmt(pendingNet)}`}
            </div>
          </div>
          {unpaidOrders.length > 0 && (
            <form action={requestPayoutAction}>
              <button type="submit" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 18px', borderRadius: 10,
                background: 'var(--lime)', color: '#111', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
              }}>
                Request payout · {fmt(pendingNet)}
              </button>
            </form>
          )}
        </div>

        {unpaidOrders.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)' }}>
            All completed orders have been included in a payout.
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px', gap: 0, padding: '8px 20px', background: 'rgba(255,255,255,0.02)' }}>
              {['Order', 'Date', 'Gross', 'Your cut'].map(h => (
                <div key={h} style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {unpaidOrders.map((o) => (
              <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px', gap: 0, padding: '12px 20px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  #{o.id.slice(-6).toUpperCase()}
                  {o.items_summary && <span style={{ color: 'rgba(255,255,255,0.25)', marginLeft: 8, fontSize: 11 }}>{o.items_summary}</span>}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)' }}>{relDate(o.createdAt)}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{fmt(o.total)}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--lime)' }}>{fmt(o.total * (1 - feePct / 100))}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Payout history */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Payout history</div>
        </div>

        {payouts.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)' }}>
            No payouts yet. Once you request a payout or the scheduled cycle runs, it will appear here.
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px 110px 90px', gap: 0, padding: '8px 20px', background: 'rgba(255,255,255,0.02)' }}>
              {['Period', 'Orders', 'Gross', 'You receive', 'Status'].map(h => (
                <div key={h} style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {payouts.map(p => {
              const meta = statusMeta[p.status] ?? statusMeta.PENDING;
              return (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px 110px 90px', gap: 0, padding: '14px 20px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                      {relDate(p.period_start)} – {relDate(p.period_end)}
                    </div>
                    {p.reference && (
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>ref: {p.reference}</div>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)' }}>{p.order_count}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{fmt(p.gross_amount)}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--lime)' }}>{fmt(p.net_amount)}</div>
                  <div>
                    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 100, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Fee explainer */}
      <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
        Omeru charges a <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{feePct}% platform fee</strong> on completed orders. Your net payout = gross order total × {(100 - feePct) / 100}. Disputes or refunds are deducted before payout is processed.
      </div>
    </div>
  );
}
