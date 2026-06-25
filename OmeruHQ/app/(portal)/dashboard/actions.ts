'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function toggleShopAction(formData: FormData) {
  const merchant_id = formData.get('merchant_id') as string;
  const current = formData.get('current_state') as string;
  await db.merchant.update({
    where: { id: merchant_id },
    data: { manual_closed: current === 'open' },
  });
  revalidatePath('/dashboard');
}
