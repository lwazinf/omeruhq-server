import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signSession, setSessionCookie } from '@/lib/auth';

// Shared with send-otp — same module in same Next.js process
declare global { var __otpStore: Map<string, { code: string; expires: number; attempts: number }> | undefined }
const otpStore: Map<string, { code: string; expires: number; attempts: number }> =
  global.__otpStore ?? (global.__otpStore = new Map());

export async function POST(req: NextRequest) {
  try {
    const { wa_id: wa_id_raw, code } = await req.json() as { wa_id: string; code: string };

    if (!wa_id_raw || !code) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Normalise to digits-only to match DB storage and send-otp key
    const wa_id = wa_id_raw.replace(/^\+/, '');

    const entry = otpStore.get(wa_id);
    if (!entry || entry.expires < Date.now()) {
      return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 401 });
    }
    entry.attempts = (entry.attempts ?? 0) + 1;
    if (entry.attempts > 5) {
      otpStore.delete(wa_id);
      return NextResponse.json({ error: 'Too many attempts. Request a new code.' }, { status: 429 });
    }
    if (entry.code !== code) {
      return NextResponse.json({ error: 'Incorrect code. Try again.' }, { status: 401 });
    }

    otpStore.delete(wa_id);

    // Load merchant + role
    const owner = await db.merchantOwner.findFirst({
      where: { wa_id, is_active: true },
      include: { merchant: { select: { id: true, trading_name: true, status: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // Fall back: merchant.wa_id (original owner who hasn't gone through invite flow)
    const merchant = owner?.merchant ?? await db.merchant.findFirst({
      where: { wa_id, status: { not: 'SUSPENDED' } },
      select: { id: true, trading_name: true, status: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const token = await signSession({
      wa_id,
      merchant_id: merchant.id,
      merchant_name: merchant.trading_name,
      role: owner?.role ?? 'OWNER',
    });

    await setSessionCookie(token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[verify-otp]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
