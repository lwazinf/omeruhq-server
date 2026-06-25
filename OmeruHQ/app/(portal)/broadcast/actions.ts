'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendWhatsAppText } from '@/lib/whatsapp';

export type BroadcastState = {
  sent?: number;
  failed?: number;
  error?: string;
} | null;

export async function sendBroadcastAction(
  _prevState: BroadcastState,
  fd: FormData
): Promise<BroadcastState> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  const message = (fd.get('message') as string ?? '').trim();

  if (message.length < 10) return { error: 'Message must be at least 10 characters.' };
  if (message.length > 500) return { error: 'Message must be 500 characters or fewer.' };

  const customers = await db.merchantCustomer.findMany({
    where: { merchant_id: session.merchant_id, opt_out: false },
    select: { wa_id: true },
  });

  if (customers.length === 0) return { error: 'No opted-in customers to send to.' };

  const results = await Promise.allSettled(
    customers.map((c) => sendWhatsAppText(c.wa_id, message))
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  await db.auditLog.create({
    data: {
      actor_wa_id: session.wa_id,
      action: 'BROADCAST_SENT',
      entity_type: 'BROADCAST',
      metadata_json: { message, recipient_count: customers.length, sent_at: new Date() },
    },
  });

  revalidatePath('/broadcast');

  return { sent, failed };
}
