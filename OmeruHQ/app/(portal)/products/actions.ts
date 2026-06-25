'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function toggleProductAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const product_id = formData.get('product_id') as string;
  const current = formData.get('current_state') as string;

  const product = await db.product.findUnique({ where: { id: product_id }, select: { merchant_id: true } });
  if (!product || product.merchant_id !== session.merchant_id) return;

  await db.product.update({ where: { id: product_id }, data: { is_in_stock: current === 'unavailable' } });
  revalidatePath('/products');
}

export async function createProductAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const name = (formData.get('name') as string).trim();
  const description = (formData.get('description') as string | null)?.trim() || null;
  const price = parseFloat(formData.get('price') as string);
  const image_url = (formData.get('image_url') as string | null)?.trim() || null;

  if (!name || isNaN(price) || price < 0) return;

  await db.product.create({
    data: {
      merchant_id: session.merchant_id,
      name, description, price, image_url,
      is_in_stock: true,
    },
  });

  redirect('/products');
}
