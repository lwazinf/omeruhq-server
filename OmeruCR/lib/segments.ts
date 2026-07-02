import { db } from './db';

// ── Audience & segment resolution ───────────────────────────────────────────
// Every broadcast resolves to a de-duplicated list of WhatsApp IDs before
// anything is sent, so previews and sends always agree.

export type Audience =
  | 'ALL_CUSTOMERS'
  | 'ALL_MERCHANTS'
  | 'EVERYONE'
  | 'INDIVIDUAL'
  | 'SEGMENT';

export interface SegmentDef {
  kind:
    | 'MERCHANT_REVENUE_BAND'   // merchants whose paid-order revenue r in the window satisfies min <= r < max
    | 'MERCHANT_CATEGORY'       // merchants by store_category
    | 'MERCHANT_CHURN_RISK'     // high sellers gone quiet: top revenue, no orders in quietDays
    | 'CUSTOMER_TOP_SPENDERS';  // customers with total_spend >= minSpend
  minRevenue?: number;
  maxRevenue?: number;
  windowDays?: number;   // default 30
  category?: string;
  quietDays?: number;    // default 14
  minSpend?: number;
}

export interface BroadcastRequest {
  audience: Audience;
  waId?: string;         // INDIVIDUAL
  segment?: SegmentDef;  // SEGMENT
}

interface Resolved {
  waIds: string[];
  description: string;
}

const uniq = (xs: string[]) => Array.from(new Set(xs.filter(Boolean)));

async function allMerchantIds(): Promise<string[]> {
  const rows = await db.merchant.findMany({
    where: { status: 'ACTIVE' },
    select: { wa_id: true },
  });
  return rows.map((r) => r.wa_id);
}

async function allCustomerIds(): Promise<string[]> {
  const rows = await db.merchantCustomer.findMany({
    where: { opt_out: false },
    select: { wa_id: true },
  });
  return uniq(rows.map((r) => r.wa_id));
}

async function merchantRevenueInWindow(windowDays: number): Promise<Map<string, { wa_id: string; revenue: number }>> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const orders = await db.order.findMany({
    where: { createdAt: { gte: since }, status: { in: ['PAID', 'READY_FOR_PICKUP', 'COMPLETED'] } },
    select: { merchant_id: true, total: true },
  });
  const merchants = await db.merchant.findMany({ where: { status: 'ACTIVE' }, select: { id: true, wa_id: true } });
  const map = new Map(merchants.map((m) => [m.id, { wa_id: m.wa_id, revenue: 0 }]));
  for (const o of orders) {
    const m = map.get(o.merchant_id);
    if (m) m.revenue += o.total;
  }
  return map;
}

export async function resolveRecipients(req: BroadcastRequest): Promise<Resolved> {
  switch (req.audience) {
    case 'ALL_MERCHANTS':
      return { waIds: await allMerchantIds(), description: 'All active merchants' };

    case 'ALL_CUSTOMERS':
      return { waIds: await allCustomerIds(), description: 'All opted-in customers' };

    case 'EVERYONE': {
      const [m, c] = await Promise.all([allMerchantIds(), allCustomerIds()]);
      return { waIds: uniq([...m, ...c]), description: 'Everyone (merchants + opted-in customers)' };
    }

    case 'INDIVIDUAL': {
      const waId = (req.waId ?? '').replace(/\D/g, '');
      if (!/^\d{9,15}$/.test(waId)) throw new Error('Invalid WhatsApp number');
      return { waIds: [waId], description: `Individual ${waId}` };
    }

    case 'SEGMENT': {
      const s = req.segment;
      if (!s) throw new Error('Segment definition required');

      if (s.kind === 'MERCHANT_REVENUE_BAND') {
        const windowDays = s.windowDays ?? 30;
        const min = s.minRevenue ?? 0;
        const max = s.maxRevenue ?? Number.POSITIVE_INFINITY;
        const map = await merchantRevenueInWindow(windowDays);
        const waIds = [...map.values()].filter((m) => m.revenue >= min && m.revenue < max).map((m) => m.wa_id);
        return { waIds, description: `Merchants with R${min}–${Number.isFinite(max) ? 'R' + max : '∞'} revenue in ${windowDays}d` };
      }

      if (s.kind === 'MERCHANT_CATEGORY') {
        if (!s.category) throw new Error('category required');
        const rows = await db.merchant.findMany({
          where: { status: 'ACTIVE', store_category: s.category },
          select: { wa_id: true },
        });
        return { waIds: rows.map((r) => r.wa_id), description: `Merchants in category "${s.category}"` };
      }

      if (s.kind === 'MERCHANT_CHURN_RISK') {
        const windowDays = s.windowDays ?? 90;
        const quietDays = s.quietDays ?? 14;
        const minRevenue = s.minRevenue ?? 1000;
        const since = new Date(Date.now() - quietDays * 24 * 60 * 60 * 1000);
        const map = await merchantRevenueInWindow(windowDays);
        const recent = await db.order.findMany({
          where: { createdAt: { gte: since } },
          select: { merchant_id: true },
          distinct: ['merchant_id'],
        });
        const active = new Set(recent.map((r) => r.merchant_id));
        const waIds = [...map.entries()]
          .filter(([id, m]) => m.revenue >= minRevenue && !active.has(id))
          .map(([, m]) => m.wa_id);
        return {
          waIds,
          description: `High sellers at churn risk (≥ R${minRevenue} in ${windowDays}d, quiet ${quietDays}d)`,
        };
      }

      if (s.kind === 'CUSTOMER_TOP_SPENDERS') {
        const minSpend = s.minSpend ?? 1000;
        const rows = await db.merchantCustomer.findMany({
          where: { opt_out: false, total_spend: { gte: minSpend } },
          select: { wa_id: true },
        });
        return { waIds: uniq(rows.map((r) => r.wa_id)), description: `Customers with lifetime spend ≥ R${minSpend}` };
      }

      throw new Error('Unknown segment kind');
    }

    default:
      throw new Error('Unknown audience');
  }
}
