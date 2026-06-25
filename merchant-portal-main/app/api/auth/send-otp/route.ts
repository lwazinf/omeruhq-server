import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendWhatsAppText } from '@/lib/whatsapp';

declare const global: { __otpStore?: Map<string, { code: string; expires: number }> };
if (!global.__otpStore) global.__otpStore = new Map();
const otpStore = global.__otpStore;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { wa_id } = await req.json() as { wa_id: string };

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
