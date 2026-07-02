import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS, ALL_PERMISSIONS } from '@/lib/permissions';
import { audit, clientIp } from '@/lib/audit';

// Update an operator's permissions or disabled state.
// The root operator can never be edited, disabled, or stripped of access.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requirePermission(PERMISSIONS.MANAGE_OPERATORS);
  } catch (r) { return r as Response; }

  const { id } = await params;
  const target = await db.crOperator.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
  if (target.is_root) return NextResponse.json({ error: 'The root operator cannot be modified' }, { status: 403 });
  if (target.id === session.operator_id) {
    return NextResponse.json({ error: 'You cannot modify your own account here' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const data: { permissions?: string[]; disabled?: boolean } = {};
  if (Array.isArray(body.permissions)) {
    data.permissions = body.permissions.filter((p: string) => (ALL_PERMISSIONS as string[]).includes(p));
  }
  if (typeof body.disabled === 'boolean') data.disabled = body.disabled;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const updated = await db.crOperator.update({
    where: { id },
    data,
    select: { id: true, email: true, permissions: true, disabled: true },
  });

  await audit({
    operator_id: session.operator_id,
    action: data.disabled === true ? 'OPERATOR_DISABLED' : 'OPERATOR_UPDATED',
    detail: { target: id, ...data }, ip: clientIp(req),
  });
  return NextResponse.json({ operator: updated });
}
