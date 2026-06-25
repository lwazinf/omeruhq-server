import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import OrderKanban from './OrderKanban';

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const orders = await db.order.findMany({
    where: { merchant_id: session.merchant_id, status: { not: 'CANCELLED' } },
    include: { order_items: { include: { product: { select: { name: true } } } } },
    orderBy: { createdAt: 'asc' },
    take: 60,
  });

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em' }}>Orders</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginTop: 2 }}>
          {orders.length} active orders across all stages
        </div>
      </div>
      <OrderKanban orders={orders} />
    </div>
  );
}
