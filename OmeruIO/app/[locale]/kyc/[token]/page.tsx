import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import KycForm from './KycForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function KycPage({ params }: Props) {
  const { token } = await params;

  const merchant = await (db as any).merchant.findUnique({
    where: { kyc_token: token },
    select: {
      id: true,
      trading_name: true,
      handle: true,
      kyc_online_completed: true,
      kyc_token_expires_at: true,
      kyc_draft_json: true,
    },
  });

  if (!merchant) notFound();

  const expired =
    merchant.kyc_token_expires_at &&
    new Date(merchant.kyc_token_expires_at) < new Date();

  return (
    <main style={{ minHeight: '100vh', background: 'var(--off-white)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            textDecoration: 'none', marginBottom: 24,
          }}>
            <div style={{
              width: 36, height: 36, background: 'var(--black)',
              borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9C3 5.686 5.686 3 9 3s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" fill="#c8f345"/>
                <path d="M9 6v6M6 9h6" stroke="var(--black)" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--black)' }}>
              Omeru
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--black)', margin: 0 }}>
            Merchant Verification
          </h1>
          <p style={{ color: '#666', marginTop: 8, fontSize: 15 }}>
            {merchant.trading_name}
          </p>
        </div>

        {expired ? (
          <div style={{ background: '#fff', border: '1.5px solid #f0c0c0', borderRadius: 16, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏰</div>
            <h2 style={{ fontWeight: 700, marginBottom: 8 }}>This link has expired</h2>
            <p style={{ color: '#666', fontSize: 15 }}>
              Return to WhatsApp and type <strong>menu</strong> to generate a new link.
            </p>
          </div>
        ) : merchant.kyc_online_completed ? (
          <div style={{ background: '#fff', border: '1.5px solid #b8f0c0', borderRadius: 16, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Verification submitted</h2>
            <p style={{ color: '#666', fontSize: 15 }}>
              Your documents have been submitted. Return to WhatsApp and tap <strong>Done, I&apos;ve submitted</strong> to continue your store setup.
            </p>
          </div>
        ) : (
          <KycForm
            token={token}
            merchantId={merchant.id}
            merchantName={merchant.trading_name}
            initialDraft={(merchant.kyc_draft_json as Record<string, string>) ?? {}}
          />
        )}

        <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 32 }}>
          This page is secured and private. Only you have access via this link.
        </p>
      </div>
    </main>
  );
}
