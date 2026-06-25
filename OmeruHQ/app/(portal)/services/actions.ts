'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendWhatsAppText } from '@/lib/whatsapp';

export async function addServiceAction(fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const name = (fd.get('name') as string).trim();
  const description = (fd.get('description') as string).trim() || null;
  const price = parseFloat(fd.get('price') as string);
  const duration_min = parseInt(fd.get('duration_min') as string, 10) || 60;

  if (!name) throw new Error('Service name is required');
  if (isNaN(price) || price < 0) throw new Error('Invalid price');

  await db.service.create({
    data: {
      merchant_id: session.merchant_id,
      name,
      description,
      price,
      duration_min,
    },
  });

  revalidatePath('/services');
}

export async function updateServiceAction(fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const id = fd.get('id') as string;
  const name = (fd.get('name') as string).trim();
  const description = (fd.get('description') as string).trim() || null;
  const price = parseFloat(fd.get('price') as string);
  const duration_min = parseInt(fd.get('duration_min') as string, 10) || 60;

  if (!name) throw new Error('Service name is required');
  if (isNaN(price) || price < 0) throw new Error('Invalid price');

  const service = await db.service.findUnique({ where: { id } });
  if (!service || service.merchant_id !== session.merchant_id) throw new Error('Not found');

  await db.service.update({
    where: { id },
    data: { name, description, price, duration_min },
  });

  revalidatePath('/services');
}

export async function toggleServiceAction(fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const id = fd.get('id') as string;
  const service = await db.service.findUnique({ where: { id } });
  if (!service || service.merchant_id !== session.merchant_id) throw new Error('Not found');

  await db.service.update({
    where: { id },
    data: { is_active: !service.is_active },
  });

  revalidatePath('/services');
}

export async function deleteServiceAction(fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const id = fd.get('id') as string;
  const service = await db.service.findUnique({ where: { id } });
  if (!service || service.merchant_id !== session.merchant_id) throw new Error('Not found');

  const activeBookings = await db.booking.count({
    where: { service_id: id, status: { in: ['PENDING', 'CONFIRMED'] } },
  });

  if (activeBookings > 0) throw new Error('Cannot delete a service with active bookings');

  await db.service.delete({ where: { id } });

  revalidatePath('/services');
}

export async function confirmBookingAction(fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const id = fd.get('id') as string;
  const booking = await db.booking.findUnique({
    where: { id },
    include: { service: true },
  });
  if (!booking || booking.merchant_id !== session.merchant_id) throw new Error('Not found');
  if (booking.status !== 'PENDING') throw new Error('Booking is not pending');

  await db.booking.update({ where: { id }, data: { status: 'CONFIRMED' } });

  const dateStr = new Date(booking.start_at).toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  await sendWhatsAppText(
    booking.customer_wa_id,
    `Your booking for ${booking.service.name} on ${dateStr} has been confirmed.`
  );

  revalidatePath('/services');
}

export async function declineBookingAction(fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const id = fd.get('id') as string;
  const booking = await db.booking.findUnique({
    where: { id },
    include: { service: true },
  });
  if (!booking || booking.merchant_id !== session.merchant_id) throw new Error('Not found');

  await db.booking.update({ where: { id }, data: { status: 'REJECTED' } });

  const dateStr = new Date(booking.start_at).toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  await sendWhatsAppText(
    booking.customer_wa_id,
    `We're unable to take your booking for ${booking.service.name} on ${dateStr}. Sorry for the inconvenience.`
  );

  revalidatePath('/services');
}

export async function completeBookingAction(fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const id = fd.get('id') as string;
  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking || booking.merchant_id !== session.merchant_id) throw new Error('Not found');
  if (booking.status !== 'CONFIRMED') throw new Error('Booking is not confirmed');

  await db.booking.update({ where: { id }, data: { status: 'COMPLETED' } });

  revalidatePath('/services');
}
