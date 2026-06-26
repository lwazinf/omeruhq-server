'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function toggleOptOutAction(fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthenticated');

  const id = fd.get('id') as string;
  const customer = await db.merchantCustomer.findFirst({
    where: { id, merchant_id: session.merchant_id },
  });
  if (!customer) throw new Error('Not found');

  await db.merchantCustomer.update({
    where: { id },
    data: { opt_out: !customer.opt_out },
  });
  revalidatePath('/customers');
}

export async function toggleBookmarkAction(fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthenticated');

  const id = fd.get('id') as string;
  const customer = await db.merchantCustomer.findFirst({
    where: { id, merchant_id: session.merchant_id },
  });
  if (!customer) throw new Error('Not found');

  await db.merchantCustomer.update({
    where: { id },
    data: { is_bookmarked: !customer.is_bookmarked },
  });
  revalidatePath('/customers');
}
