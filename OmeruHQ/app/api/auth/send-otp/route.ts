import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signSession, setSessionCookie } from '@/lib/auth';
import { sendWhatsAppText } from '@/lib/whatsapp';

declare const global: { __otpStore?: Map<string, { code: string; expires: number }> };
if (!global.__otpStore) global.__otpStore = new Map();
const otpStore = global.__otpStore;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const DEV_KEYWORD = 'stitchmoney';

export async function POST(req: NextRequest) {
  try {
    const { wa_id } = await req.json() as { wa_id: string };

    // Dev bypass: type "stitchmoney" to skip OTP and log in as the StitchMoney merchant
    if (wa_id?.toLowerCase().replace(/^\+/, '') === DEV_KEYWORD) {
      const merchant = await db.merchant.findFirst({
        where: { OR: [{ handle: { contains: 'stitch', mode: 'insensitive' } }, { trading_name: { contains: 'stitch', mode: 'insensitive' } }] },
        select: { id: true, trading_name: true, wa_id: true },
      });
      if (!merchant) return NextResponse.json({ error: 'StitchMoney merchant not found in DB' }, { status: 404 });
      const token = await signSession({ wa_id: merchant.wa_id, merchant_id: merchant.id, merchant_name: merchant.trading_name, role: 'OWNER' });
      await setSessionCookie(token);
      return NextResponse.json({ dev_bypass: true });
    }

    if (!wa_id || !/^\+[1-9]\d{7,14}$/.test(wa_id)) {
      return NextResponse.json({ error: 'Enter a valid WhatsApp number (e.g. +27820000000)' }, { status: 400 });
    }

    // Verify this is an active merchant
    const merchant = await db.merchant.findFirst({
      where: { wa_id, status: { not: 'SUSPENDED' } },
      select: { id: true, trading_name: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'No active merchant account found for this number.' }, { status: 404 });
    }

    const code = generateOtp();
    otpStore.set(wa_id, { code, expires: Date.now() + 10 * 60 * 1000 });

    const sent = await sendWhatsAppText(
      wa_id,
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
