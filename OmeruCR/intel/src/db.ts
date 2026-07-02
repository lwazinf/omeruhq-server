import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(__dirname, '../../OmeruHQ/.env.local') });

if (!process.env.DIRECT_URL) {
  throw new Error('DIRECT_URL not found — check OmeruHQ/.env.local');
}

export const sql = postgres(process.env.DIRECT_URL, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

// ── Typed query helpers ──────────────────────────────────────────────────────

export interface MerchantRow {
  id: string; handle: string; trading_name: string; status: string;
  store_category: string | null; services_enabled: boolean;
  bank_acc_no: string | null; bank_name: string | null;
  created_at: Date;
}

export interface OrderStats {
  total: number; completed: number; cancelled: number;
  revenue: number; avg_order_value: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export async function getPlatformSummary() {
  const [merchants, orders, customers, payouts, applications] = await Promise.all([
    sql`SELECT status, COUNT(*)::int AS count FROM "Merchant" GROUP BY status`,
    sql`
      SELECT
        COUNT(*)::int                                                             AS total,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int                        AS completed,
        COUNT(*) FILTER (WHERE status = 'CANCELLED')::int                        AS cancelled,
        COALESCE(SUM(total) FILTER (WHERE status IN ('PAID','READY_FOR_PICKUP','COMPLETED')), 0)::float AS gmv_all_time,
        COALESCE(SUM(total) FILTER (WHERE status IN ('PAID','READY_FOR_PICKUP','COMPLETED') AND "createdAt" > NOW() - INTERVAL '30 days'), 0)::float AS gmv_30d,
        COALESCE(SUM(total) FILTER (WHERE status IN ('PAID','READY_FOR_PICKUP','COMPLETED') AND "createdAt" > NOW() - INTERVAL '7 days'), 0)::float  AS gmv_7d
      FROM "Order"
    `,
    sql`SELECT COUNT(DISTINCT wa_id)::int AS total FROM "MerchantCustomer"`,
    sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'REQUESTED')::int   AS requested,
        COUNT(*) FILTER (WHERE status = 'PENDING')::int     AS pending,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int   AS completed,
        COALESCE(SUM(net_amount) FILTER (WHERE status = 'COMPLETED'), 0)::float AS total_paid_out,
        COALESCE(SUM(net_amount) FILTER (WHERE status = 'REQUESTED'), 0)::float AS pending_net
      FROM "Payout"
    `,
    sql`SELECT status, COUNT(*)::int AS count FROM "invite_applications" GROUP BY status`,
  ]);
  return {
    merchants:    merchants as unknown as Row[],
    orders:       orders[0] as unknown as Row,
    customers:    customers[0] as unknown as Row,
    payouts:      payouts[0] as unknown as Row,
    applications: applications as unknown as Row[],
  };
}

export async function getMerchantProfile(handle: string) {
  const [merchant] = await sql<MerchantRow[]>`
    SELECT id, handle, trading_name, status, store_category, services_enabled, bank_acc_no, bank_name, "createdAt" AS created_at
    FROM "Merchant" WHERE handle = ${handle}
  `;
  if (!merchant) return null;

  const mid = merchant.id;

  const [orders, customers, products, services, bookings, payout, broadcastCount] = await Promise.all([
    sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
        COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled,
        COALESCE(SUM(total) FILTER (WHERE status IN ('PAID','READY_FOR_PICKUP','COMPLETED')), 0)::float AS revenue_all,
        COALESCE(SUM(total) FILTER (WHERE status IN ('PAID','READY_FOR_PICKUP','COMPLETED') AND "createdAt" > NOW() - INTERVAL '30 days'), 0)::float AS revenue_30d,
        COALESCE(SUM(total) FILTER (WHERE status IN ('PAID','READY_FOR_PICKUP','COMPLETED') AND "createdAt" > NOW() - INTERVAL '7 days'), 0)::float  AS revenue_7d,
        COALESCE(AVG(total) FILTER (WHERE status IN ('PAID','READY_FOR_PICKUP','COMPLETED') AND "createdAt" > NOW() - INTERVAL '30 days'), 0)::float AS avg_order
      FROM "Order" WHERE merchant_id = ${mid}
    `,
    sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE opt_out = false)::int AS opted_in,
        COUNT(*) FILTER (WHERE "createdAt" > NOW() - INTERVAL '30 days')::int AS new_30d
      FROM "MerchantCustomer" WHERE merchant_id = ${mid}
    `,
    sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_in_stock)::int AS in_stock FROM "Product" WHERE merchant_id = ${mid} AND status = 'ACTIVE'`,
    sql`SELECT COUNT(*)::int AS total FROM "Service" WHERE merchant_id = ${mid} AND is_active`,
    sql`SELECT COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed FROM "Booking" WHERE merchant_id = ${mid}`,
    sql`
      SELECT
        COALESCE(SUM(o.total) FILTER (WHERE o.payout_id IS NULL AND o.status = 'COMPLETED'), 0)::float AS pending_gross,
        COUNT(o.id) FILTER (WHERE o.payout_id IS NULL AND o.status = 'COMPLETED')::int                  AS pending_count,
        MAX(p."createdAt") AS last_payout_at,
        COALESCE(MAX(p.net_amount), 0)::float AS last_payout_net
      FROM "Order" o
      LEFT JOIN "Payout" p ON p.merchant_id = ${mid} AND p.status = 'COMPLETED'
      WHERE o.merchant_id = ${mid}
    `,
    sql`SELECT COUNT(*)::int AS total FROM "AuditLog" WHERE actor_wa_id IN (SELECT wa_id FROM "Merchant" WHERE id = ${mid}) AND entity_type = 'BROADCAST'`,
  ]);

  return {
    merchant,
    orders: orders[0],
    customers: customers[0],
    products: products[0],
    services: services[0],
    bookings: bookings[0],
    payout: payout[0],
    broadcastCount: broadcastCount[0].total,
  };
}

export async function getAllMerchants() {
  return sql<MerchantRow[]>`SELECT id, handle, trading_name, status, store_category FROM "Merchant" ORDER BY "createdAt" DESC`;
}

export async function getPayoutIndex() {
  return sql`
    SELECT
      m.handle, m.trading_name,
      COALESCE(SUM(o.total) FILTER (WHERE o.status = 'COMPLETED' AND o.payout_id IS NULL), 0)::float AS pending_gross,
      COUNT(o.id) FILTER (WHERE o.status = 'COMPLETED' AND o.payout_id IS NULL)::int                  AS pending_orders,
      MAX(p."createdAt") AS last_payout_at,
      COALESCE(SUM(p.net_amount) FILTER (WHERE p.status = 'COMPLETED'), 0)::float                    AS total_paid_out,
      COUNT(p.id) FILTER (WHERE p.status = 'REQUESTED')::int                                         AS open_requests
    FROM "Merchant" m
    LEFT JOIN "Order"  o ON o.merchant_id = m.id
    LEFT JOIN "Payout" p ON p.merchant_id = m.id
    GROUP BY m.id, m.handle, m.trading_name
    HAVING COALESCE(SUM(o.total) FILTER (WHERE o.status = 'COMPLETED' AND o.payout_id IS NULL), 0) > 0
        OR COUNT(p.id) FILTER (WHERE p.status IN ('REQUESTED','PROCESSING')) > 0
    ORDER BY pending_gross DESC
  `;
}

export async function getApplications() {
  return sql`
    SELECT status, COUNT(*)::int AS count,
      MAX(created_at) AS latest
    FROM "invite_applications"
    GROUP BY status
    ORDER BY count DESC
  `;
}

export async function getDailyMetrics() {
  const [revenue14d, topProducts, newCustomers7d] = await Promise.all([
    sql`
      SELECT
        DATE("createdAt")::text AS day,
        COALESCE(SUM(total) FILTER (WHERE status IN ('PAID','READY_FOR_PICKUP','COMPLETED')), 0)::float AS revenue,
        COUNT(*)::int AS orders
      FROM "Order"
      WHERE "createdAt" > NOW() - INTERVAL '14 days'
      GROUP BY DATE("createdAt")
      ORDER BY day
    `,
    sql`
      SELECT p.name, SUM(oi.quantity)::int AS units_sold
      FROM "OrderItem" oi
      JOIN "Product" p ON p.id = oi.product_id
      JOIN "Order"   o ON o.id = oi.order_id
      WHERE o.status IN ('PAID','READY_FOR_PICKUP','COMPLETED')
        AND o."createdAt" > NOW() - INTERVAL '7 days'
      GROUP BY p.name
      ORDER BY units_sold DESC
      LIMIT 5
    `,
    sql`SELECT COUNT(*)::int AS count FROM "MerchantCustomer" WHERE "createdAt" > NOW() - INTERVAL '7 days'`,
  ]);
  return { revenue14d, topProducts, newCustomers7d: newCustomers7d[0].count };
}
