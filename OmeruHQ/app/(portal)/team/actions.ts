'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendWhatsAppText } from '@/lib/whatsapp';

export async function inviteTeamMemberAction(fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  if (session.role !== 'OWNER') throw new Error('Only owners can invite team members.');

  const invited_wa_id = (fd.get('invited_wa_id') as string).trim();
  const role = fd.get('role') as 'ADMIN' | 'STAFF';

  if (!invited_wa_id.startsWith('+')) throw new Error('Phone number must be in E.164 format (e.g. +27821234567)');
  if (!['ADMIN', 'STAFF'].includes(role)) throw new Error('Invalid role');

  const merchant = await db.merchant.findUnique({
    where: { id: session.merchant_id },
    select: { trading_name: true },
  });

  await db.merchantInvite.create({
    data: {
      merchant_id: session.merchant_id,
      invited_wa_id,
      invited_by_wa_id: session.wa_id,
      role,
    },
  });

  await sendWhatsAppText(
    invited_wa_id,
    `You've been invited to manage ${merchant?.trading_name ?? 'a store'} on Omeru HQ. You'll be able to log in once your invite is processed.`
  );

  revalidatePath('/team');
}

export async function removeTeamMemberAction(fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const id = fd.get('id') as string;

  const owner = await db.merchantOwner.findUnique({ where: { id } });
  if (!owner || owner.merchant_id !== session.merchant_id) throw new Error('Not found');
  if (owner.wa_id === session.wa_id) throw new Error('You cannot remove yourself from the team.');

  await db.merchantOwner.update({
    where: { id },
    data: { is_active: false },
  });

  revalidatePath('/team');
}

export async function revokeInviteAction(fd: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const id = fd.get('id') as string;

  const invite = await db.merchantInvite.findUnique({ where: { id } });
  if (!invite || invite.merchant_id !== session.merchant_id) throw new Error('Not found');

  await db.merchantInvite.update({
    where: { id },
    data: { status: 'REVOKED', revoked_at: new Date() },
  });

  revalidatePath('/team');
}
