import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import Sidebar from '@/components/Sidebar';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const [merchant, pendingOrders] = await Promise.all([
    db.merchant.findUnique({ where: { id: session.merchant_id }, select: { manual_closed: true, handle: true, address: true } }),
    db.order.count({ where: { merchant_id: session.merchant_id, status: { in: ['PENDING', 'PAID'] } } }),
  ]);

  return (
    <div className="portal-layout">
      <Sidebar
        merchantName={session.merchant_name}
        merchantHandle={merchant?.handle ?? ''}
        merchantAddress={merchant?.address ?? undefined}
        isOpen={!merchant?.manual_closed}
        pendingOrders={pendingOrders}
      />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
