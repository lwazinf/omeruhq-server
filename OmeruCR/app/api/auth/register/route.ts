import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signSession, setSessionCookie } from '@/lib/auth';
import { audit, clientIp } from '@/lib/audit';
import { rateLimit } from '@/lib/rateLimit';

// Registration is only open while ZERO operators exist. The first account
// becomes the immutable root operator; every later account must be created
// from inside the Control Room by someone holding MANAGE_OPERATORS.
export async function POST(req: Request) {
  const ip = clientIp(req) ?? 'unknown';
  if (!rateLimit(`register:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const { email, name, password } = await req.json().catch(() => ({}));
  if (typeof email !== 'string' || typeof name !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || name.trim().length < 2) {
    return NextResponse.json({ error: 'Valid email and name required' }, { status: 400 });
  }
  if (password.length < 12) {
    return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 });
  }

  const existing = await db.crOperator.count();
  if (existing > 0) {
    await audit({ action: 'REGISTER_BLOCKED', detail: { email: cleanEmail }, ip });
    return NextResponse.json(
      { error: 'Registration is closed. Ask a Control Room admin to create your account.' },
      { status: 403 },
    );
  }

  const password_hash = await bcrypt.hash(password, 12);
  const root = await db.crOperator.create({
    data: { email: cleanEmail, name: name.trim(), password_hash, is_root: true, permissions: [] },
  });

  await audit({ operator_id: root.id, action: 'REGISTER_ROOT', detail: { email: cleanEmail }, ip });

  const token = await signSession({
    operator_id: root.id, email: root.email, name: root.name, is_root: true, permissions: [],
  });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}

// Lets the register page decide whether to show the form at all.
export async function GET() {
  const count = await db.crOperator.count();
  return NextResponse.json({ open: count === 0 });
}
