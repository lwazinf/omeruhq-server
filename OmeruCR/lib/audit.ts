import { Prisma } from '@prisma/client';
import { db } from './db';

export async function audit(opts: {
  operator_id?: string | null;
  action: string;
  detail?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await db.crAuditLog.create({
      data: {
        operator_id: opts.operator_id ?? null,
        action: opts.action,
        detail: (opts.detail as Prisma.InputJsonValue) ?? undefined,
        ip: opts.ip ?? null,
      },
    });
  } catch (e) {
    // The audit trail must never take the app down, but a write failure is
    // itself a security signal — surface it loudly in logs.
    console.error('AUDIT WRITE FAILED', opts.action, e);
  }
}

export function clientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd ? fwd.split(',')[0].trim() : null;
}
