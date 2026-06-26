import { writeFile, mkdir } from 'fs/promises';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const VAULT_ROOT = resolve(__dirname, '../../omeru-vault');

export function fmt(n: number) {
  return `R ${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
export function pct(n: number, d: number) {
  return d > 0 ? `${Math.round((n / d) * 100)}%` : '—';
}
export function ts() {
  return new Date().toISOString();
}
export function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function writeNote(relativePath: string, content: string) {
  const fullPath = join(VAULT_ROOT, relativePath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, 'utf-8');
  return fullPath;
}

export function readNote(relativePath: string): string | null {
  const fullPath = join(VAULT_ROOT, relativePath);
  if (!existsSync(fullPath)) return null;
  return readFileSync(fullPath, 'utf-8');
}

// ── Note builders ──────────────────────────────────────────────────────────

export function buildPlatformOverview(data: {
  merchants: Array<{ status: string; count: number }>;
  orders: { total: number; completed: number; cancelled: number; gmv_all_time: number; gmv_30d: number; gmv_7d: number };
  customers: { total: number };
  payouts: { requested: number; pending: number; completed: number; total_paid_out: number; pending_net: number };
  applications: Array<{ status: string; count: number }>;
}) {
  const { merchants, orders, customers, payouts, applications } = data;
  const activeMerchants = merchants.find(m => m.status === 'ACTIVE')?.count ?? 0;
  const onboarding = merchants.find(m => m.status === 'ONBOARDING')?.count ?? 0;
  const suspended = merchants.find(m => m.status === 'SUSPENDED')?.count ?? 0;
  const completionRate = pct(orders.completed, orders.total);
  const cancellationRate = pct(orders.cancelled, orders.total);
  const pendingApps = applications.find(a => a.status === 'pending')?.count ?? 0;

  return `---
type: platform-overview
updated: ${ts()}
sync: auto
---

# Platform Overview

> Last synced: ${new Date().toLocaleString('en-ZA')}

## Merchants
| Status | Count |
|--------|-------|
| Active | **${activeMerchants}** |
| Onboarding | ${onboarding} |
| Suspended | ${suspended} |
| **Total** | **${activeMerchants + onboarding + suspended}** |

## Revenue
| Period | GMV |
|--------|-----|
| 7 days | **${fmt(orders.gmv_7d)}** |
| 30 days | **${fmt(orders.gmv_30d)}** |
| All time | ${fmt(orders.gmv_all_time)} |

## Orders
| Metric | Value |
|--------|-------|
| Total orders | ${orders.total} |
| Completion rate | ${completionRate} |
| Cancellation rate | ${cancellationRate} |

## Customers
- **${customers.total.toLocaleString()}** unique customers across all stores

## Payouts
| Status | Value |
|--------|-------|
| Pending net | **${fmt(payouts.pending_net)}** |
| Open requests | ${payouts.requested} |
| Total paid out | ${fmt(payouts.total_paid_out)} |

## Applications
${applications.map(a => `- ${a.status}: **${a.count}**`).join('\n') || '- None'}
${pendingApps > 0 ? `\n> ⚠️ ${pendingApps} application${pendingApps > 1 ? 's' : ''} awaiting review → [[OmeruIO/Applications]]` : ''}

## Links
- [[Merchants/_Index|All Merchants]]
- [[Payouts/_Index|Payout Status]]
- [[OmeruIO/Overview|OmeruIO]]
- [[OmeruHQ/Overview|OmeruHQ]]
- [[OmeruWA/Overview|OmeruWA]]
- [[Insights/Recommendations|Recommendations]]
- [[Insights/Risk Flags|Risk Flags]]
`;
}

export function buildMerchantNote(data: {
  merchant: { handle: string; trading_name: string; status: string; store_category: string | null; services_enabled: boolean; created_at: Date };
  orders: { total: number; completed: number; cancelled: number; revenue_all: number; revenue_30d: number; revenue_7d: number; avg_order: number };
  customers: { total: number; opted_in: number; new_30d: number };
  products: { total: number; in_stock: number };
  services: { total: number };
  bookings: { completed: number };
  payout: { pending_gross: number; pending_count: number; last_payout_at: Date | null; last_payout_net: number };
  broadcastCount: number;
}) {
  const { merchant, orders, customers, products, services, bookings, payout } = data;
  const completionRate = pct(orders.completed, orders.total);
  const optInRate = pct(customers.opted_in, customers.total);
  const feePct = 5;
  const pendingNet = payout.pending_gross * (1 - feePct / 100);

  const healthFactors = [
    orders.total > 0 ? (orders.completed / orders.total) : 0,
    customers.total > 0 ? (customers.opted_in / customers.total) : 0,
    products.total > 0 ? 1 : 0,
  ];
  const healthScore = Math.round(healthFactors.reduce((a, b) => a + b, 0) / healthFactors.length * 100);

  return `---
type: merchant-profile
handle: ${merchant.handle}
status: ${merchant.status}
category: ${merchant.store_category ?? 'uncategorized'}
health-score: ${healthScore}
updated: ${ts()}
sync: auto
---

# ${merchant.trading_name} (@${merchant.handle})

**Status:** ${merchant.status} | **Health score:** ${healthScore}/100 | **Category:** ${merchant.store_category ?? '—'}
**On platform since:** ${new Date(merchant.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}

## Revenue
| Period | Amount |
|--------|--------|
| 7 days | **${fmt(orders.revenue_7d)}** |
| 30 days | **${fmt(orders.revenue_30d)}** |
| All time | ${fmt(orders.revenue_all)} |
| Avg order value | ${fmt(orders.avg_order)} |

## Orders
| Metric | Value |
|--------|-------|
| Total | ${orders.total} |
| Completed | ${orders.completed} (${completionRate}) |
| Cancelled | ${orders.cancelled} |

## Customers
| Metric | Value |
|--------|-------|
| Total | ${customers.total} |
| Opted in | ${customers.opted_in} (${optInRate}) |
| New (30d) | +${customers.new_30d} |
| Broadcasts sent | ${data.broadcastCount} |

## Catalogue
- Products: **${products.total}** active (${products.in_stock} in stock)
- Services: **${services.total}** active
- Bookings completed: ${bookings.completed}

## Feature usage
- [${products.total > 0 ? 'x' : ' '}] Products
- [${orders.total > 0 ? 'x' : ' '}] Orders
- [${services.total > 0 ? 'x' : ' '}] Services / bookings
- [${data.broadcastCount > 0 ? 'x' : ' '}] Broadcasts
- [${merchant.services_enabled ? 'x' : ' '}] Services enabled

## Payout
- **Pending (${payout.pending_count} orders):** ${fmt(payout.pending_gross)} gross → **${fmt(pendingNet)} net**
- Last payout: ${payout.last_payout_at ? new Date(payout.last_payout_at).toLocaleDateString('en-ZA') + ` (${fmt(payout.last_payout_net)})` : 'None yet'}

## Links
- [[Platform/Overview|Platform Overview]]
- [[Payouts/_Index|Payouts]]
- [[Merchants/_Index|All Merchants]]
`;
}

export function buildMerchantIndex(merchants: Array<{ handle: string; trading_name: string; status: string; store_category: string | null }>) {
  const active = merchants.filter(m => m.status === 'ACTIVE');
  const rows = merchants.map(m =>
    `| [[Merchants/${m.handle}\\|${m.trading_name}]] | \`${m.handle}\` | ${m.status} | ${m.store_category ?? '—'} |`
  ).join('\n');

  return `---
type: merchant-index
updated: ${ts()}
sync: auto
---

# Merchants (${merchants.length} total · ${active.length} active)

| Name | Handle | Status | Category |
|------|--------|--------|----------|
${rows}

## Links
- [[Platform/Overview|Platform Overview]]
- [[Payouts/_Index|Payouts]]
`;
}

export function buildPayoutIndex(rows: Array<{
  handle: string; trading_name: string; pending_gross: number; pending_orders: number;
  last_payout_at: Date | null; total_paid_out: number; open_requests: number;
}>) {
  const totalPending = rows.reduce((s, r) => s + Number(r.pending_gross), 0);
  const feePct = 5;
  const totalNet = totalPending * (1 - feePct / 100);

  const tableRows = rows.map(r =>
    `| [[Merchants/${r.handle}\\|${r.trading_name}]] | ${fmt(r.pending_gross)} | **${fmt(Number(r.pending_gross) * (1 - feePct / 100))}** | ${r.pending_orders} | ${r.last_payout_at ? new Date(r.last_payout_at).toLocaleDateString('en-ZA') : 'Never'} | ${r.open_requests > 0 ? '🟡 Requested' : '⏳ Pending'} |`
  ).join('\n');

  return `---
type: payout-index
updated: ${ts()}
sync: auto
---

# Payouts

> Total pending net payout: **${fmt(totalNet)}** across ${rows.length} merchant${rows.length !== 1 ? 's' : ''}

| Merchant | Gross | Net | Orders | Last Payout | Status |
|----------|-------|-----|--------|-------------|--------|
${tableRows || '| — | — | — | — | — | — |'}

## Links
- [[Platform/Overview|Platform Overview]]
- [[Merchants/_Index|All Merchants]]
`;
}

export function buildDailySnapshot(data: {
  revenue14d: Array<{ day: string; revenue: number; orders: number }>;
  topProducts: Array<{ name: string; units_sold: number }>;
  newCustomers7d: number;
}) {
  const todayStr = today();
  const todayData = data.revenue14d.find(d => d.day === todayStr);
  const yesterday = data.revenue14d.find(d => d.day === new Date(Date.now() - 86400000).toISOString().slice(0, 10));
  const week = data.revenue14d.slice(-7).reduce((s, d) => s + Number(d.revenue), 0);

  return `---
type: daily-snapshot
date: ${todayStr}
updated: ${ts()}
---

# Daily Snapshot — ${todayStr}

## Today
- Revenue: **${fmt(todayData?.revenue ?? 0)}**
- Orders: ${todayData?.orders ?? 0}
- vs Yesterday: ${fmt(yesterday?.revenue ?? 0)}

## This week (7d)
- Revenue: **${fmt(week)}**
- New customers: +${data.newCustomers7d}

## Top products today
${data.topProducts.map((p, i) => `${i + 1}. **${p.name}** — ${p.units_sold} units`).join('\n') || '— No data yet'}

## 14-day revenue
| Date | Revenue | Orders |
|------|---------|--------|
${data.revenue14d.map(d => `| ${d.day} | ${fmt(d.revenue)} | ${d.orders} |`).join('\n')}

## Links
- [[Platform/Overview|Platform Overview]]
`;
}

export function buildApplicationsNote(apps: Array<{ status: string; count: number; latest: Date }>) {
  const pending = apps.find(a => a.status === 'pending')?.count ?? 0;
  const approved = apps.find(a => a.status === 'approved')?.count ?? 0;
  const total = apps.reduce((s, a) => s + a.count, 0);

  return `---
type: applications
updated: ${ts()}
sync: auto
---

# Invite Applications

> Total: **${total}** · Pending review: **${pending}** · Approved: **${approved}**

| Status | Count | Latest |
|--------|-------|--------|
${apps.map(a => `| ${a.status} | **${a.count}** | ${new Date(a.latest).toLocaleDateString('en-ZA')} |`).join('\n')}

${pending > 0 ? `\n> ⚠️ **${pending} application${pending > 1 ? 's' : ''} awaiting review** — check the portal to action them.` : '> ✅ All applications actioned.'}

## Links
- [[OmeruIO/Overview|OmeruIO]]
- [[Platform/Overview|Platform Overview]]
- [[Merchants/_Index|All Merchants]]
`;
}
