import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS, ALL_PERMISSIONS } from '@/lib/permissions';
import { audit, clientIp } from '@/lib/audit';

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.MANAGE_OPERATORS);
  } catch (r) { return r as Response; }

  const ops = await db.crOperator.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, email: true, name: true, is_root: true,
      permissions: true, disabled: true, last_login_at: true, createdAt: true,
    },
  });
  return NextResponse.json({ operators: ops });
}

export async function POST(req: Request) {
  let session;
  try {
    session = await requirePermission(PERMISSIONS.MANAGE_OPERATORS);
  } catch (r) { return r as Response; }

  const { email, name, password, permissions } = await req.json().catch(() => ({}));
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
  const perms: string[] = Array.isArray(permissions)
    ? permissions.filter((p: string) => (ALL_PERMISSIONS as string[]).includes(p))
    : [];

  const exists = await db.crOperator.findUnique({ where: { email: cleanEmail } });
  if (exists) return NextResponse.json({ error: 'An operator with that email already exists' }, { status: 409 });

  const password_hash = await bcrypt.hash(password, 12);
  const op = await db.crOperator.create({
    data: { email: cleanEmail, name: name.trim(), password_hash, permissions: perms, created_by: session.operator_id },
    select: { id: true, email: true, name: true, permissions: true },
  });

  await audit({
    operator_id: session.operator_id, action: 'OPERATOR_CREATED',
    detail: { new_operator: op.id, email: cleanEmail, permissions: perms }, ip: clientIp(req),
  });
  return NextResponse.json({ operator: op });
}
