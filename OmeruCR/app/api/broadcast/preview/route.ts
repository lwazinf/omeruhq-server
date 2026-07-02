import { NextResponse } from 'next/server';
import { requirePermission, getSession } from '@/lib/auth';
import { PERMISSIONS, has } from '@/lib/permissions';
import { resolveRecipients, BroadcastRequest } from '@/lib/segments';

// Resolve the audience WITHOUT sending — powers the recipient counter in the
// composer so the operator always confirms against a real number.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as BroadcastRequest | null;
  if (!body?.audience) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  // Preview requires the same permission the send would.
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

  try {
    const { waIds, description } = await resolveRecipients(body);
    return NextResponse.json({ count: waIds.length, description });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not resolve audience' }, { status: 400 });
  }
}
