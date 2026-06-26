'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function toggleReviewVisibilityAction(fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const id = fd.get('id') as string;
  const current = fd.get('is_visible') === 'true';

  const review = await db.review.findFirst({
    where: { id, merchant_id: session.merchant_id },
  });
  if (!review) throw new Error('Review not found');

  await db.review.update({ where: { id }, data: { is_visible: !current } });
  revalidatePath('/reviews');
}
