import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { detectFraudSignals, abandonedCheckouts } from '@/lib/fraud';
import { audit } from '@/lib/audit';

// CSV export of the current fraud/anomaly report. Anonymised subjects only.
export async function GET() {
  let session;
  try {
    session = await requirePermission(PERMISSIONS.FRAUD_REPORTS);
  } catch (r) { return r as Response; }

  const [signals, abandoned] = await Promise.all([detectFraudSignals(), abandonedCheckouts(7, 24)]);

  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    ['severity', 'signal', 'subject', 'detail', 'value_zar', 'observed_at'].join(','),
    ...signals.map((s) =>
      [s.severity, s.kind, s.subject, s.detail, s.valueZar ?? '', s.observedAt.toISOString()].map(esc).join(','),
    ),
    '',
    ['abandoned_checkouts_7d', abandoned.count, 'value_zar', Math.round(abandoned.valueZar)].map(esc).join(','),
  ];

  await audit({ operator_id: session.operator_id, action: 'FRAUD_REPORT_EXPORTED', detail: { signals: signals.length } });

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="omeru-fraud-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
