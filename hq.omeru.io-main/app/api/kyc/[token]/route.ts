import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';

const BUCKET = process.env.SUPABASE_BUCKET || 'omeru-media';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

async function getMerchant(token: string) {
  return db.merchant.findUnique({
    where: { kyc_token: token },
    select: {
      id: true,
      trading_name: true,
      handle: true,
      kyc_online_completed: true,
      kyc_token_expires_at: true,
      kyc_draft_json: true,
      id_number: true,
      kyc_id_doc_url: true,
      kyc_bank_proof_url: true,
      bank_name: true,
      bank_acc_no: true,
      bank_type: true,
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const merchant = await getMerchant(token);
  if (!merchant) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const expired =
    merchant.kyc_token_expires_at && new Date(merchant.kyc_token_expires_at) < new Date();
  if (expired) return NextResponse.json({ error: 'expired' }, { status: 410 });

  return NextResponse.json({
    merchantName: merchant.trading_name,
    handle: merchant.handle,
    completed: merchant.kyc_online_completed,
    draft: merchant.kyc_draft_json ?? {},
  });
}

// Save a section to the draft — explicit user-initiated save only
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const merchant = await getMerchant(token);
  if (!merchant) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (merchant.kyc_online_completed)
    return NextResponse.json({ error: 'already_submitted' }, { status: 409 });

  const body = await req.json();
  const currentDraft = (merchant.kyc_draft_json as Record<string, unknown>) ?? {};
  const merged = { ...currentDraft, ...body };

  await db.merchant.update({
    where: { id: merchant.id },
    data: { kyc_draft_json: merged },
  });

  return NextResponse.json({ ok: true, draft: merged });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const merchant = await getMerchant(token);
  if (!merchant) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (merchant.kyc_online_completed)
    return NextResponse.json({ error: 'already_submitted' }, { status: 409 });

  const contentType = req.headers.get('content-type') ?? '';

  // ── File upload ────────────────────────────────────────────────────────────
  if (contentType.includes('multipart/form-data')) {
    const supabase = getSupabase();
    if (!supabase)
      return NextResponse.json({ error: 'storage_not_configured' }, { status: 503 });

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const field = form.get('field') as string | null; // 'id_doc' | 'bank_proof'

    if (!file || !field)
      return NextResponse.json({ error: 'missing_file_or_field' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `kyc/${merchant.id}/${field}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '31536000',
        upsert: true,
      });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  }

  // ── Final submission ───────────────────────────────────────────────────────
  const body = await req.json();
  if (!body.submit) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const draft = (merchant.kyc_draft_json as Record<string, string>) ?? {};
  const id_number = draft.id_number;
  const id_doc_url = draft.id_doc_url;
  const bank_proof_url = draft.bank_proof_url;
  const bank_name = draft.bank_name;
  const bank_acc_no = draft.bank_acc_no;
  const bank_type = draft.bank_type;

  const missing: string[] = [];
  if (!id_number) missing.push('ID number');
  if (!id_doc_url) missing.push('ID document');
  if (!bank_proof_url) missing.push('Bank proof');
  if (!bank_name) missing.push('Bank name');
  if (!bank_acc_no) missing.push('Account number');
  if (!bank_type) missing.push('Account type');

  if (missing.length > 0)
    return NextResponse.json({ error: 'incomplete', missing }, { status: 422 });

  await db.merchant.update({
    where: { id: merchant.id },
    data: {
      id_number,
      kyc_id_doc_url: id_doc_url,
      kyc_bank_proof_url: bank_proof_url,
      bank_name,
      bank_acc_no,
      bank_type,
      kyc_submitted_at: new Date(),
      kyc_online_completed: true,
    },
  });

  return NextResponse.json({ ok: true });
}
