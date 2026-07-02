import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { PERMISSIONS, has } from '@/lib/permissions';
import { resolveRecipients, BroadcastRequest } from '@/lib/segments';
import { sendText } from '@/lib/wa';
import { audit, clientIp } from '@/lib/audit';
import { rateLimit } from '@/lib/rateLimit';

const MAX_MESSAGE_LENGTH = 1024;
const CONFIRM_THRESHOLD = 25; // sends above this require confirm: true from the UI

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  if (!rateLimit(`broadcast:${session.operator_id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Broadcast rate limit reached (10/hour)' }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as
    | (BroadcastRequest & { message?: string; confirm?: boolean })
    | null;
  if (!body?.audience || typeof body.message !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const message = body.message.trim();
  if (message.length === 0 || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Message must be 1–${MAX_MESSAGE_LENGTH} characters` }, { status: 400 });
  }

  // Permission gates by audience composition
  const needsMerchants = ['ALL_MERCHANTS', 'EVERYONE'].includes(body.audience) ||
    (body.audience === 'SEGMENT' && body.segment?.kind?.startsWith('MERCHANT'));
  const needsCustomers = ['ALL_CUSTOMERS', 'EVERYONE', 'INDIVIDUAL'].includes(body.audience) ||
    (body.audience === 'SEGMENT' && body.segment?.kind?.startsWith('CUSTOMER'));
  if (needsMerchants && !has(session, PERMISSIONS.BROADCAST_MERCHANTS)) {
    return NextResponse.json({ error: 'Missing permission: broadcast to merchants' }, { status: 403 });
  }
  if (needsCustomers && !has(session, PERMISSIONS.BROADCAST_CUSTOMERS)) {
    return NextResponse.json({ error: 'Missing permission: broadcast to customers' }, { status: 403 });
  }

  let waIds: string[];
  let description: string;
  try {
    ({ waIds, description } = await resolveRecipients(body));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not resolve audience' }, { status: 400 });
  }
  if (waIds.length === 0) return NextResponse.json({ error: 'Audience resolved to zero recipients' }, { status: 400 });
  if (waIds.length > CONFIRM_THRESHOLD && body.confirm !== true) {
    return NextResponse.json(
      { error: `This will message ${waIds.length} people. Re-send with confirmation.`, requiresConfirm: true, count: waIds.length },
      { status: 412 },
    );
  }

  // Send sequentially — lib/wa.ts paces messages to respect Cloud API limits.
  let sent = 0;
  let failed = 0;
  for (const waId of waIds) {
    (await sendText(waId, message)) ? sent++ : failed++;
  }

  const status = failed === 0 ? 'SENT' : sent === 0 ? 'FAILED' : 'PARTIAL';
  const record = await db.crBroadcast.create({
    data: {
      operator_id: session.operator_id,
      audience: body.audience,
      segment: body.segment ? JSON.parse(JSON.stringify(body.segment)) : undefined,
      message,
      recipient_count: waIds.length,
      sent_count: sent,
      failed_count: failed,
      status,
    },
  });

  await audit({
    operator_id: session.operator_id,
    action: 'BROADCAST_SENT',
    detail: { broadcast_id: record.id, audience: body.audience, description, recipients: waIds.length, sent, failed },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, broadcastId: record.id, recipients: waIds.length, sent, failed, status });
}
