'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { del } from '@vercel/blob';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

function isBlobUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.includes('blob.vercel-storage.com');
}

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

  if (!name || isNaN(price) || price < 0) return;

  // image_url is set by the client after uploading to blob
  const image_url = (formData.get('image_url') as string | null)?.trim() || null;

  await db.product.create({
    data: {
      merchant_id: session.merchant_id,
      name, description, price, image_url,
      is_in_stock: true,
    },
  });

  redirect('/products');
}

export async function updateProductAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const id = formData.get('id') as string;
  const name = (formData.get('name') as string).trim();
  const description = (formData.get('description') as string | null)?.trim() || null;
  const price = parseFloat(formData.get('price') as string);

  if (!name || isNaN(price) || price < 0) return;

  const existing = await db.product.findUnique({ where: { id }, select: { merchant_id: true, image_url: true } });
  if (!existing || existing.merchant_id !== session.merchant_id) return;

  // image_url: new blob URL from client upload, "REMOVE" sentinel, or keep existing
  const rawUrl = (formData.get('image_url') as string | null)?.trim();
  let image_url: string | null;

  if (rawUrl === 'REMOVE') {
    if (isBlobUrl(existing.image_url)) await del(existing.image_url);
    image_url = null;
  } else if (rawUrl && rawUrl !== existing.image_url) {
    // new image uploaded — delete old blob if applicable
    if (isBlobUrl(existing.image_url)) await del(existing.image_url);
    image_url = rawUrl;
  } else {
    image_url = existing.image_url;
  }

  await db.product.update({ where: { id }, data: { name, description, price, image_url } });

  redirect('/products');
}

export async function deleteProductAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const id = formData.get('id') as string;

  const product = await db.product.findUnique({ where: { id }, select: { merchant_id: true, image_url: true } });
  if (!product || product.merchant_id !== session.merchant_id) return;

  if (isBlobUrl(product.image_url)) await del(product.image_url);

  await db.product.delete({ where: { id } });

  redirect('/products');
}
