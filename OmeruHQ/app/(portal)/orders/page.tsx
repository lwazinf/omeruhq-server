import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import OrderKanban from './OrderKanban';

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const orders = await db.order.findMany({
    where: { merchant_id: session.merchant_id, status: { not: 'CANCELLED' } },
    include: { order_items: { include: { product: { select: { name: true } } } } },
    orderBy: { createdAt: 'asc' },
    take: 60,
  });

  const waIds = [...new Set(
    orders.map(o => o.customer_id).filter((id): id is string => id != null)
  )];
  const customers = waIds.length
    ? await db.merchantCustomer.findMany({
        where: { merchant_id: session.merchant_id, wa_id: { in: waIds } },
        select: { wa_id: true, display_name: true },
      })
    : [];
  const nameByWaId = Object.fromEntries(customers.map(c => [c.wa_id, c.display_name ?? 'Customer']));

  const activeCount = orders.filter(o => o.status !== 'COMPLETED').length;

  const serialized = orders.map(o => ({
    id: o.id,
    total: o.total,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    customerName: shortName(nameByWaId[o.customer_id ?? ''] ?? 'Customer'),
    items:
      o.items_summary ??
      (o.order_items.map(i =>
        i.quantity > 1
          ? `${i.product?.name ?? 'Item'} ×${i.quantity}`
          : (i.product?.name ?? 'Item')
      ).join(', ') || '—'),
  }));

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', color: 'white', lineHeight: 1, margin: 0 }}>
          Orders
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
          {activeCount} active order{activeCount !== 1 ? 's' : ''} across all stages
        </p>
      </div>
      <OrderKanban orders={serialized} />
    </div>
  );
}
