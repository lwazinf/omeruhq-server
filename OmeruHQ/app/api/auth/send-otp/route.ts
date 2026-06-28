import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signSession, setSessionCookie } from '@/lib/auth';
import { sendWhatsAppText } from '@/lib/whatsapp';

declare const global: {
  __otpStore?: Map<string, { code: string; expires: number; attempts: number }>;
  __otpRateLimit?: Map<string, { count: number; resetAt: number }>;
};
if (!global.__otpStore) global.__otpStore = new Map();
if (!global.__otpRateLimit) global.__otpRateLimit = new Map();
const otpStore = global.__otpStore;
const otpRateLimit = global.__otpRateLimit;

// Max 3 OTP requests per number per 10 minutes
function isOtpRateLimited(wa_id: string): boolean {
  const now = Date.now();
  const entry = otpRateLimit.get(wa_id);
  if (!entry || entry.resetAt <= now) {
    otpRateLimit.set(wa_id, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 3) return true;
  entry.count++;
  return false;
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { wa_id } = await req.json() as { wa_id: string };

    if (!wa_id || !/^\+?[1-9]\d{7,14}$/.test(wa_id)) {
      return NextResponse.json({ error: 'Enter a valid WhatsApp number (e.g. +27820000000)' }, { status: 400 });
    }

    // Normalise to digits-only (no leading +) to match DB storage format
    const wa_id_norm = wa_id.replace(/^\+/, '');

    if (isOtpRateLimited(wa_id_norm)) {
      return NextResponse.json({ error: 'Too many requests. Please wait before requesting another code.' }, { status: 429 });
    }

    // Verify this is an active merchant
    const merchant = await db.merchant.findFirst({
      where: { wa_id: wa_id_norm, status: { not: 'SUSPENDED' } },
      select: { id: true, trading_name: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'No active merchant account found for this number.' }, { status: 404 });
    }

    const code = generateOtp();
    otpStore.set(wa_id_norm, { code, expires: Date.now() + 10 * 60 * 1000, attempts: 0 });

    const sent = await sendWhatsAppText(
      wa_id_norm,
      `*Omeru Merchant Portal*\n\nYour login code is: *${code}*\n\nThis code expires in 10 minutes. Do not share it with anyone.`
    );

    if (!sent) {
      return NextResponse.json({ error: 'Could not send WhatsApp message. Try again.' }, { status: 503 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('[send-otp]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
