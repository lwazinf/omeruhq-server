import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import BroadcastComposer from './BroadcastComposer';

export default async function BroadcastPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [totalCustomers, optedInCount, recentBroadcasts] = await Promise.all([
    db.merchantCustomer.count({ where: { merchant_id: session.merchant_id } }),
    db.merchantCustomer.count({ where: { merchant_id: session.merchant_id, opt_out: false } }),
    db.auditLog.findMany({
      where: { actor_wa_id: session.wa_id, entity_type: 'BROADCAST' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return (
    <div className="portal-page" style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 36px)', maxWidth: 760 }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em' }}>
          Broadcast
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginTop: 2 }}>
          Send a WhatsApp message to all your opted-in customers at once
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        <div className="card" style={{ padding: '18px 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {totalCustomers}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)', marginTop: 3 }}>
            Total customers
          </div>
        </div>
        <div className="card" style={{ padding: '18px 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--lime)' }}>
            {optedInCount}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)', marginTop: 3 }}>
            Opted in
          </div>
        </div>
        <div className="card" style={{ padding: '18px 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {recentBroadcasts.length}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)', marginTop: 3 }}>
            Recent sends
          </div>
        </div>
      </div>

      {/* Composer */}
      <BroadcastComposer customerCount={optedInCount} />

      {/* Recent broadcasts */}
      {recentBroadcasts.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 14 }}>
            Recent broadcasts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentBroadcasts.map((log) => {
              const meta = log.metadata_json as { message?: string; recipient_count?: number; sent_at?: string } | null;
              const dateStr = new Date(log.createdAt).toLocaleString('en-ZA', {
                dateStyle: 'medium',
                timeStyle: 'short',
              });
              return (
                <div
                  key={log.id}
                  className="card"
                  style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.75)',
                      lineHeight: 1.5, marginBottom: 6,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {meta?.message ?? '—'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)' }}>
                      {dateStr}
                    </div>
                  </div>
                  {meta?.recipient_count != null && (
                    <div style={{
                      flexShrink: 0, padding: '4px 10px', borderRadius: 100,
                      background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.2)',
                      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--lime)',
                    }}>
                      {meta.recipient_count} sent
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
