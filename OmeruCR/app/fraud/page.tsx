import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { PERMISSIONS, has } from '@/lib/permissions';
import { detectFraudSignals, abandonedCheckouts } from '@/lib/fraud';

export const dynamic = 'force-dynamic';

const zar = (n: number) => 'R' + n.toLocaleString('en-ZA', { maximumFractionDigits: 0 });

// Fraud & anomaly reports. Subjects are anonymised (masked numbers / store
// handles) — enough to investigate, nothing more.
export default async function FraudPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!has(session, PERMISSIONS.FRAUD_REPORTS)) {
    return <p className="cr-help">Your account does not have the fraud-reports permission. Ask a Control Room admin.</p>;
  }

  const [signals, abandoned] = await Promise.all([
    detectFraudSignals(),
    abandonedCheckouts(7, 24),
  ]);

  const sev = (s: string) =>
    s === 'HIGH' ? 'cr-chip cr-chip-danger' : s === 'MEDIUM' ? 'cr-chip' : 'cr-chip cr-chip-muted';

  const high = signals.filter((s) => s.severity === 'HIGH').length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>
          Fraud &amp; anomalies
        </h1>
        <a href="/api/fraud/report" className="cr-btn cr-btn-ghost" style={{ padding: '9px 18px', fontSize: 13, textDecoration: 'none' }}>
          ⬇ Download CSV report
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="cr-card">
          <div className="cr-label">Open signals</div>
          <div className="cr-kpi-number">{signals.length}</div>
          <div className="cr-help" style={{ marginTop: 6 }}>{high} high severity</div>
        </div>
        <div className="cr-card">
          <div className="cr-label">Abandoned checkouts · 7d</div>
          <div className="cr-kpi-number">{abandoned.count}</div>
          <div className="cr-help" style={{ marginTop: 6 }}>{zar(abandoned.valueZar)} left at payment</div>
        </div>
      </div>

      <div className="cr-card" style={{ overflowX: 'auto' }}>
        <div className="cr-label" style={{ marginBottom: 12 }}>Signals (last 24h activity + 30d patterns, anonymised)</div>
        <table className="cr-table">
          <thead>
            <tr><th>Severity</th><th>Signal</th><th>Subject</th><th>Detail</th><th>Value</th><th>Observed</th></tr>
          </thead>
          <tbody>
            {signals.map((s) => (
              <tr key={s.id}>
                <td><span className={sev(s.severity)}>{s.severity.toLowerCase()}</span></td>
                <td style={{ fontWeight: 700 }}>{s.kind}</td>
                <td>{s.subject}</td>
                <td style={{ color: 'var(--text-2)', maxWidth: 380 }}>{s.detail}</td>
                <td>{s.valueZar != null ? zar(s.valueZar) : '—'}</td>
                <td style={{ whiteSpace: 'nowrap', color: 'var(--text-2)' }}>{new Date(s.observedAt).toLocaleString('en-ZA')}</td>
              </tr>
            ))}
            {signals.length === 0 && (
              <tr><td colSpan={6} className="cr-help">No anomalies detected. Signals cover order velocity, cross-store fan-out, serial cancellations, and ticket spikes.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
