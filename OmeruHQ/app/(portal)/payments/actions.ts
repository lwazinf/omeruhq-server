'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function requestPayoutAction() {
  const session = await getSession();
  if (!session) throw new Error('Unauthenticated');

  const mid = session.merchant_id;

  const [unpaidOrders, platform] = await Promise.all([
    db.order.findMany({
      where: { merchant_id: mid, status: 'COMPLETED', payout_id: null },
      select: { id: true, total: true, createdAt: true },
    }),
    db.platformBranding.findFirst({ select: { platform_fee: true } }),
  ]);

  if (unpaidOrders.length === 0) throw new Error('No completed orders to pay out');

  const feePct = platform?.platform_fee ?? 5;
  const grossAmount = unpaidOrders.reduce((s, o) => s + o.total, 0);
  const platformFee = grossAmount * (feePct / 100);
  const netAmount = grossAmount - platformFee;

  const dates = unpaidOrders.map(o => o.createdAt.getTime());
  const periodStart = new Date(Math.min(...dates));
  const periodEnd = new Date(Math.max(...dates));

  const payout = await db.payout.create({
    data: {
      merchant_id: mid,
      gross_amount: grossAmount,
      platform_fee: platformFee,
      net_amount: netAmount,
      fee_pct: feePct,
      status: 'REQUESTED',
      period_start: periodStart,
      period_end: periodEnd,
      order_count: unpaidOrders.length,
      requested_at: new Date(),
    },
  });

  await db.order.updateMany({
    where: { id: { in: unpaidOrders.map(o => o.id) } },
    data: { payout_id: payout.id },
  });

  revalidatePath('/payments');
}
