import { db } from './db';

// ── Fraud & anomaly heuristics ──────────────────────────────────────────────
// Signals are computed on demand from the shared order data. Everything here
// is anonymised at the display layer: customers appear as masked numbers,
// and no names are required to act on a signal.

export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface FraudSignal {
  id: string;
  kind: string;
  severity: Severity;
  subject: string;      // masked customer or merchant handle
  detail: string;
  valueZar?: number;
  observedAt: Date;
}

export const maskWaId = (waId: string): string =>
  waId.length <= 5 ? '•••' : `${waId.slice(0, 4)}•••${waId.slice(-2)}`;

const PAID = ['PAID', 'READY_FOR_PICKUP', 'COMPLETED'];

export async function detectFraudSignals(): Promise<FraudSignal[]> {
  const now = Date.now();
  const d1 = new Date(now - 24 * 3600e3);
  const d30 = new Date(now - 30 * 86400e3);
  const signals: FraudSignal[] = [];

  const [recent, cancelled30, paid30] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: d1 } },
      select: { id: true, customer_id: true, merchant_id: true, total: true, status: true, createdAt: true,
                merchant: { select: { handle: true } } },
    }),
    db.order.findMany({
      where: { createdAt: { gte: d30 }, status: 'CANCELLED' },
      select: { customer_id: true },
    }),
    db.order.findMany({
      where: { createdAt: { gte: d30 }, status: { in: PAID } },
      select: { merchant_id: true, total: true },
    }),
  ]);

  // 1 · Order velocity: same customer, many orders in 24h
  const byCustomer = new Map<string, typeof recent>();
  for (const o of recent) {
    const arr = byCustomer.get(o.customer_id) ?? [];
    arr.push(o);
    byCustomer.set(o.customer_id, arr);
  }
  for (const [cust, orders] of byCustomer) {
    if (orders.length >= 5) {
      signals.push({
        id: `velocity:${cust}`,
        kind: 'Order velocity',
        severity: orders.length >= 10 ? 'HIGH' : 'MEDIUM',
        subject: `Customer ${maskWaId(cust)}`,
        detail: `${orders.length} orders in 24h across ${new Set(orders.map(o => o.merchant_id)).size} store(s)`,
        valueZar: orders.reduce((s, o) => s + o.total, 0),
        observedAt: orders[orders.length - 1].createdAt,
      });
    }
  }

  // 2 · Cross-store fan-out: one customer hitting many merchants in a day
  for (const [cust, orders] of byCustomer) {
    const stores = new Set(orders.map(o => o.merchant_id));
    if (stores.size >= 4) {
      signals.push({
        id: `fanout:${cust}`,
        kind: 'Cross-store fan-out',
        severity: stores.size >= 7 ? 'HIGH' : 'MEDIUM',
        subject: `Customer ${maskWaId(cust)}`,
        detail: `Ordered from ${stores.size} different stores in 24h — possible card/EFT testing`,
        observedAt: orders[orders.length - 1].createdAt,
      });
    }
  }

  // 3 · Serial cancellations over 30 days
  const cancelCounts = new Map<string, number>();
  for (const o of cancelled30) cancelCounts.set(o.customer_id, (cancelCounts.get(o.customer_id) ?? 0) + 1);
  for (const [cust, n] of cancelCounts) {
    if (n >= 4) {
      signals.push({
        id: `cancels:${cust}`,
        kind: 'Serial cancellations',
        severity: n >= 8 ? 'HIGH' : 'LOW',
        subject: `Customer ${maskWaId(cust)}`,
        detail: `${n} cancelled orders in 30 days`,
        observedAt: new Date(),
      });
    }
  }

  // 4 · Merchant revenue spike: today's paid order far above the store's 30d average ticket
  const merchantTotals = new Map<string, { sum: number; n: number }>();
  for (const o of paid30) {
    const m = merchantTotals.get(o.merchant_id) ?? { sum: 0, n: 0 };
    m.sum += o.total; m.n += 1;
    merchantTotals.set(o.merchant_id, m);
  }
  for (const o of recent) {
    const m = merchantTotals.get(o.merchant_id);
    if (!m || m.n < 5) continue;
    const avg = m.sum / m.n;
    if (o.total >= Math.max(avg * 6, 2000)) {
      signals.push({
        id: `spike:${o.id}`,
        kind: 'Ticket spike',
        severity: o.total >= avg * 12 ? 'HIGH' : 'MEDIUM',
        subject: `@${o.merchant.handle}`,
        detail: `Single order R${Math.round(o.total)} vs 30d average ticket R${Math.round(avg)} (${o.status})`,
        valueZar: o.total,
        observedAt: o.createdAt,
      });
    }
  }

  const rank: Record<Severity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return signals.sort((a, b) => rank[a.severity] - rank[b.severity] || +b.observedAt - +a.observedAt);
}

// ── Abandoned checkouts ─────────────────────────────────────────────────────
// A PENDING order that never became paid within the cutoff is an abandoned
// checkout — the WhatsApp cart made it to "place order" but payment stalled.
export async function abandonedCheckouts(days = 7, staleHours = 24) {
  const windowStart = new Date(Date.now() - days * 86400e3);
  const staleBefore = new Date(Date.now() - staleHours * 3600e3);
  const rows = await db.order.findMany({
    where: { status: 'PENDING', createdAt: { gte: windowStart, lte: staleBefore } },
    select: { total: true },
  });
  return { count: rows.length, valueZar: rows.reduce((s, r) => s + r.total, 0) };
}
