import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signSession, setSessionCookie } from '@/lib/auth';
import { audit, clientIp } from '@/lib/audit';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: Request) {
  const ip = clientIp(req) ?? 'unknown';
  if (!rateLimit(`login:${ip}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const { email, password } = await req.json().catch(() => ({}));
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const op = await db.crOperator.findUnique({ where: { email: email.trim().toLowerCase() } });
  // Constant-shape failure path: same message whether the account exists or not.
  const fail = async () => {
    await audit({ operator_id: op?.id ?? null, action: 'LOGIN_FAILED', detail: { email }, ip });
    return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 });
  };

  if (!op || op.disabled) return fail();
  const ok = await bcrypt.compare(password, op.password_hash);
  if (!ok) return fail();

  await db.crOperator.update({ where: { id: op.id }, data: { last_login_at: new Date() } });
  await audit({ operator_id: op.id, action: 'LOGIN', ip });

  const token = await signSession({
    operator_id: op.id, email: op.email, name: op.name,
    is_root: op.is_root, permissions: op.permissions,
  });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
