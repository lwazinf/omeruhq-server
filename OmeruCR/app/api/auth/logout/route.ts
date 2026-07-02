import { NextResponse } from 'next/server';
import { clearSessionCookie, getSession } from '@/lib/auth';
import { audit } from '@/lib/audit';

export async function POST() {
  const session = await getSession();
  if (session) await audit({ operator_id: session.operator_id, action: 'LOGOUT' });
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
