'use server';

import { revalidatePath } from 'next/cache';
import { OrderStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendWhatsAppText } from '@/lib/whatsapp';

async function getMerchant() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  const merchant = await db.merchant.findUnique({ where: { id: session.merchant_id }, select: { id: true, trading_name: true, address: true } });
  if (!merchant) throw new Error('Merchant not found');
  return merchant;
}

export async function advanceOrderAction(formData: FormData) {
  const order_id = formData.get('order_id') as string;
  const next_status = formData.get('next_status') as string;
  const merchant = await getMerchant();

  const order = await db.order.findUnique({ where: { id: order_id } });
  if (!order || order.merchant_id !== merchant.id) return;

  await db.order.update({ where: { id: order_id }, data: { status: next_status as OrderStatus } });

  // Notify customer
  if (next_status === 'READY_FOR_PICKUP') {
    await sendWhatsAppText(
      order.customer_id,
      `🛎️ *Order Ready!*\n\nYour order from *${merchant.trading_name}* is ready for pickup!\n\n📦 Order #${order.id.slice(-6)}\n📍 ${merchant.address ?? 'See store location'}`
    );
  } else if (next_status === 'COMPLETED') {
    await sendWhatsAppText(
      order.customer_id,
      `🎉 *Order Complete!*\n\nThank you for ordering from *${merchant.trading_name}*! We hope you enjoy it.`
    );
  }

  revalidatePath('/orders');
}

export async function cancelOrderAction(formData: FormData) {
  const order_id = formData.get('order_id') as string;
  const merchant = await getMerchant();

  const order = await db.order.findUnique({ where: { id: order_id } });
  if (!order || order.merchant_id !== merchant.id) return;
  if (['CANCELLED', 'COMPLETED'].includes(order.status)) return;

  await db.order.update({ where: { id: order_id }, data: { status: 'CANCELLED' } });

  await sendWhatsAppText(
    order.customer_id,
    `❌ *Order Cancelled*\n\nYour order from *${merchant.trading_name}* has been cancelled. Contact the store if this is an error.`
  );

  revalidatePath('/orders');
}
