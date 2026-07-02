import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { PERMISSIONS, has } from '@/lib/permissions';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Server-rendered read-only view of the last 200 audit events and broadcasts.
export default async function AuditPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!has(session, PERMISSIONS.VIEW_AUDIT)) {
    return <p className="cr-help">Your account does not have the audit permission. Ask a Control Room admin.</p>;
  }

  const [events, broadcasts] = await Promise.all([
    db.crAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { operator: { select: { email: true, name: true } } },
    }),
    db.crBroadcast.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { operator: { select: { email: true } } },
    }),
  ]);

  const chip = (action: string) => {
    if (action.includes('FAILED') || action.includes('BLOCKED') || action.includes('DISABLED')) return 'cr-chip cr-chip-danger';
    if (action.includes('BROADCAST')) return 'cr-chip';
    return 'cr-chip cr-chip-muted';
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 20 }}>
        Audit trail
      </h1>

      <div className="cr-card" style={{ marginBottom: 20, overflowX: 'auto' }}>
        <div className="cr-label" style={{ marginBottom: 12 }}>Broadcast history</div>
        <table className="cr-table">
          <thead>
            <tr><th>When</th><th>Operator</th><th>Audience</th><th>Message</th><th>Delivery</th></tr>
          </thead>
          <tbody>
            {broadcasts.map((b) => (
              <tr key={b.id}>
                <td style={{ whiteSpace: 'nowrap', color: 'var(--text-2)' }}>
                  {new Date(b.createdAt).toLocaleString('en-ZA')}
                </td>
                <td>{b.operator.email}</td>
                <td><span className="cr-chip cr-chip-muted">{b.audience}</span></td>
                <td style={{ maxWidth: 360 }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.message}
                  </span>
                </td>
                <td>
                  <span className={b.status === 'SENT' ? 'cr-chip cr-chip-ok' : b.status === 'PARTIAL' ? 'cr-chip' : 'cr-chip cr-chip-danger'}>
                    {b.sent_count}/{b.recipient_count} {b.status.toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
            {broadcasts.length === 0 && <tr><td colSpan={5} className="cr-help">No broadcasts yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="cr-card" style={{ overflowX: 'auto' }}>
        <div className="cr-label" style={{ marginBottom: 12 }}>Security events (latest 200)</div>
        <table className="cr-table">
          <thead>
            <tr><th>When</th><th>Operator</th><th>Action</th><th>Detail</th><th>IP</th></tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td style={{ whiteSpace: 'nowrap', color: 'var(--text-2)' }}>
                  {new Date(e.createdAt).toLocaleString('en-ZA')}
                </td>
                <td>{e.operator?.email ?? '—'}</td>
                <td><span className={chip(e.action)}>{e.action}</span></td>
                <td style={{ maxWidth: 340, color: 'var(--text-2)', fontSize: 12 }}>
                  {e.detail ? JSON.stringify(e.detail) : '—'}
                </td>
                <td style={{ color: 'var(--text-2)' }}>{e.ip ?? '—'}</td>
              </tr>
            ))}
            {events.length === 0 && <tr><td colSpan={5} className="cr-help">No events yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
