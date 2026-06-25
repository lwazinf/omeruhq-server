'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function updateStoreProfileAction(fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const trading_name = (fd.get('trading_name') as string).trim();
  const description = (fd.get('description') as string).trim() || null;
  const support_number = (fd.get('support_number') as string).trim() || null;
  const welcome_message = (fd.get('welcome_message') as string).trim() || null;

  if (!trading_name) throw new Error('Trading name is required');

  await db.merchant.update({
    where: { id: session.merchant_id },
    data: { trading_name, description, support_number, welcome_message },
  });

  revalidatePath('/settings');
}

export async function updateTradingHoursAction(fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const open_time = fd.get('open_time') as string;
  const close_time = fd.get('close_time') as string;
  const sat_open_time = fd.get('sat_open_time') as string;
  const sat_close_time = fd.get('sat_close_time') as string;
  const sun_open = fd.get('sun_open') === 'on';

  await db.merchant.update({
    where: { id: session.merchant_id },
    data: { open_time, close_time, sat_open_time, sat_close_time, sun_open },
  });

  revalidatePath('/settings');
}

export async function toggleStoreOpenAction(_fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const merchant = await db.merchant.findUnique({
    where: { id: session.merchant_id },
    select: { manual_closed: true },
  });

  if (!merchant) throw new Error('Merchant not found');

  await db.merchant.update({
    where: { id: session.merchant_id },
    data: { manual_closed: !merchant.manual_closed },
  });

  revalidatePath('/settings');
}
