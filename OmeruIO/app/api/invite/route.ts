import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// In-memory IP rate limiter: max 3 submissions per IP per hour
const ipStore = new Map<string, { count: number; resetAt: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of ipStore.entries()) if (v.resetAt <= now) ipStore.delete(k);
}, 10 * 60 * 1000);

function isIpLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipStore.get(ip);
  if (!entry || entry.resetAt <= now) {
    ipStore.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 3) return true;
  entry.count++;
  return false;
}

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v: string) => /^[+\d][\d\s\-().]{6,19}$/.test(v.trim());
const cap = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export async function POST(req: NextRequest) {
  // IP-based rate limiting — 3 applications per IP per hour
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = (forwarded ? forwarded.split(',')[0] : '').trim() || 'unknown';
  if (isIpLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests — please try again later.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const {
      business_name, registration_number,
      sells_type, category, employees, province,
      social_platforms, social_following, monthly_orders, heard_from,
      name, email, whatsapp, notes,
    } = body;

    // Required field presence
    if (!business_name || !sells_type || !category || !name || !email || !whatsapp) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Format validation
    if (!isValidEmail(cap(email, 254))) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    if (!isValidPhone(cap(whatsapp, 30))) {
      return NextResponse.json({ error: 'Invalid WhatsApp number.' }, { status: 400 });
    }

    // Length-cap every field before it touches the DB
    await db.$executeRawUnsafe(
      `INSERT INTO invite_applications
        (business_name, registration_number, sells_type, category, employees, province,
         social_platforms, social_following, monthly_orders, heard_from,
         name, email, whatsapp, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      cap(business_name,        200),
      cap(registration_number,   50),
      cap(sells_type,           100),
      cap(category,             100),
      cap(employees,             50),
      cap(province,             100),
      cap(social_platforms,     200),
      cap(social_following,      50),
      cap(monthly_orders,        50),
      cap(heard_from,           200),
      cap(name,                 150),
      cap(email,                254),
      cap(whatsapp,              30),
      cap(notes,               2000),
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[invite]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
