'use client';

import { useState, useRef } from 'react';

interface Props {
  token: string;
  merchantId: string;
  merchantName: string;
  initialDraft: Record<string, string>;
}

type SectionKey = 'identity' | 'idDoc' | 'bankProof' | 'banking';

const SA_BANKS = [
  'Capitec', 'FNB', 'Standard Bank', 'ABSA', 'Nedbank', 'TymeBank',
  'African Bank', 'Discovery Bank', 'Investec', 'Old Mutual', 'Other',
];

const ACCOUNT_TYPES = ['Cheque', 'Savings', 'Business'];

const sectionLabel: Record<SectionKey, string> = {
  identity: '1. Identity',
  idDoc: '2. ID Document',
  bankProof: '3. Bank Proof',
  banking: '4. Banking Details',
};

function isSectionSaved(key: SectionKey, draft: Record<string, string>): boolean {
  switch (key) {
    case 'identity':  return !!draft.id_number;
    case 'idDoc':     return !!draft.id_doc_url;
    case 'bankProof': return !!draft.bank_proof_url;
    case 'banking':   return !!(draft.bank_name && draft.bank_acc_no && draft.bank_type);
  }
}

export default function KycForm({ token, merchantName, initialDraft }: Props) {
  const [draft, setDraft]         = useState<Record<string, string>>(initialDraft);
  const [saving, setSaving]       = useState<SectionKey | null>(null);
  const [uploading, setUploading] = useState<'idDoc' | 'bankProof' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Local unsaved field state
  const [idNumber, setIdNumber]   = useState(initialDraft.id_number ?? '');
  const [bankName, setBankName]   = useState(initialDraft.bank_name ?? '');
  const [bankAcc, setBankAcc]     = useState(initialDraft.bank_acc_no ?? '');
  const [bankType, setBankType]   = useState(initialDraft.bank_type ?? '');

  const idDocRef    = useRef<HTMLInputElement>(null);
  const bankProofRef = useRef<HTMLInputElement>(null);

  const allSaved =
    isSectionSaved('identity', draft) &&
    isSectionSaved('idDoc', draft) &&
    isSectionSaved('bankProof', draft) &&
    isSectionSaved('banking', draft);

  async function saveSection(key: SectionKey, data: Record<string, string>) {
    setSaving(key);
    setError(null);
    try {
      const res = await fetch(`/api/kyc/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Save failed');
      const { draft: newDraft } = await res.json();
      setDraft(newDraft);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(null);
    }
  }

  async function uploadFile(field: 'id_doc' | 'bank_proof', section: 'idDoc' | 'bankProof', file: File) {
    setUploading(section);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('field', field);
      const res = await fetch(`/api/kyc/${token}`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      const key = field === 'id_doc' ? 'id_doc_url' : 'bank_proof_url';
      await saveSection(section, { [key]: url });
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/kyc/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submit: true }),
      });
      if (!res.ok) {
        const body = await res.json();
        if (body.missing) {
          setError(`Incomplete: ${body.missing.join(', ')}`);
        } else {
          setError('Submission failed. Please try again.');
        }
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Submission failed. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={card}>
        <div style={{ fontSize: 48, marginBottom: 16, textAlign: 'center' }}>✅</div>
        <h2 style={{ ...heading, textAlign: 'center' }}>Verification submitted!</h2>
        <p style={subtext}>
          Return to WhatsApp and tap <strong>Done, I&apos;ve submitted</strong> to continue setting up <strong>{merchantName}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {(['identity', 'idDoc', 'bankProof', 'banking'] as SectionKey[]).map((k) => (
          <div key={k} style={{
            flex: 1, height: 4, borderRadius: 4,
            background: isSectionSaved(k, draft) ? '#c8f345' : '#e0e0e0',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/* Section 1 — Identity */}
      <Section
        title={sectionLabel.identity}
        saved={isSectionSaved('identity', draft)}
        saving={saving === 'identity'}
        onSave={() => saveSection('identity', { id_number: idNumber })}
        disabled={!idNumber.trim()}
      >
        <label style={labelStyle}>SA ID number or CIPC registration number</label>
        <input
          style={inputStyle}
          placeholder="e.g. 9001015800087"
          value={idNumber}
          onChange={e => setIdNumber(e.target.value)}
          maxLength={20}
        />
        {draft.id_number && (
          <p style={savedHint}>Saved: {draft.id_number}</p>
        )}
      </Section>

      {/* Section 2 — ID Document */}
      <Section
        title={sectionLabel.idDoc}
        saved={isSectionSaved('idDoc', draft)}
        saving={uploading === 'idDoc'}
        onSave={() => idDocRef.current?.click()}
        saveLabel="Upload photo"
        disabled={false}
      >
        <p style={subtext}>
          Upload a clear photo of your SA ID book/card or CIPC certificate. All text must be readable.
        </p>
        <input
          ref={idDocRef}
          type="file"
          accept="image/*,application/pdf"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) uploadFile('id_doc', 'idDoc', f);
            e.target.value = '';
          }}
        />
        {draft.id_doc_url && (
          <a href={draft.id_doc_url} target="_blank" rel="noopener noreferrer" style={savedHint}>
            ✅ Document uploaded — tap to view
          </a>
        )}
      </Section>

      {/* Section 3 — Bank Proof */}
      <Section
        title={sectionLabel.bankProof}
        saved={isSectionSaved('bankProof', draft)}
        saving={uploading === 'bankProof'}
        onSave={() => bankProofRef.current?.click()}
        saveLabel="Upload document"
        disabled={false}
      >
        <p style={subtext}>
          Upload a bank confirmation letter or bank statement (last 3 months). Must show your name and account number.
        </p>
        <input
          ref={bankProofRef}
          type="file"
          accept="image/*,application/pdf"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) uploadFile('bank_proof', 'bankProof', f);
            e.target.value = '';
          }}
        />
        {draft.bank_proof_url && (
          <a href={draft.bank_proof_url} target="_blank" rel="noopener noreferrer" style={savedHint}>
            ✅ Document uploaded — tap to view
          </a>
        )}
      </Section>

      {/* Section 4 — Banking Details */}
      <Section
        title={sectionLabel.banking}
        saved={isSectionSaved('banking', draft)}
        saving={saving === 'banking'}
        onSave={() => saveSection('banking', { bank_name: bankName, bank_acc_no: bankAcc, bank_type: bankType })}
        disabled={!bankName || !bankAcc.trim() || !bankType}
      >
        <label style={labelStyle}>Bank</label>
        <select style={inputStyle} value={bankName} onChange={e => setBankName(e.target.value)}>
          <option value="">Select your bank</option>
          {SA_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <label style={{ ...labelStyle, marginTop: 12 }}>Account number</label>
        <input
          style={inputStyle}
          placeholder="e.g. 62845678901"
          value={bankAcc}
          onChange={e => setBankAcc(e.target.value)}
          maxLength={20}
        />

        <label style={{ ...labelStyle, marginTop: 12 }}>Account type</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ACCOUNT_TYPES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setBankType(t.toLowerCase())}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
                border: '1.5px solid',
                borderColor: bankType === t.toLowerCase() ? 'var(--black)' : '#e0e0e0',
                background: bankType === t.toLowerCase() ? 'var(--black)' : '#fff',
                color: bankType === t.toLowerCase() ? '#c8f345' : 'var(--black)',
                fontWeight: bankType === t.toLowerCase() ? 600 : 400,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {draft.bank_name && (
          <p style={savedHint}>
            Saved: {draft.bank_name} · {draft.bank_acc_no} · {draft.bank_type}
          </p>
        )}
      </Section>

      {/* Error */}
      {error && (
        <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 12, padding: 14, color: '#c00', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!allSaved || submitting}
        style={{
          marginTop: 8, padding: '16px 24px', borderRadius: 12, border: 'none',
          background: allSaved ? 'var(--black)' : '#ccc',
          color: allSaved ? '#c8f345' : '#999',
          fontWeight: 700, fontSize: 16, cursor: allSaved ? 'pointer' : 'not-allowed',
          letterSpacing: '-0.01em', transition: 'all 0.2s',
        }}
      >
        {submitting ? 'Submitting…' : allSaved ? '🔒 Submit KYC' : `Complete all sections to submit`}
      </button>

      <p style={{ ...subtext, textAlign: 'center', fontSize: 12 }}>
        By submitting, you confirm these details are accurate. Omeru keeps all documents strictly confidential.
      </p>
    </div>
  );
}

function Section({
  title, saved, saving, onSave, saveLabel = 'Save', disabled, children,
}: {
  title: string;
  saved: boolean;
  saving: boolean;
  onSave: () => void;
  saveLabel?: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ ...card, borderColor: saved ? '#c8f345' : '#e8e8e8' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ ...heading, fontSize: 16, margin: 0 }}>{title}</h3>
        <span style={{ fontSize: 13, color: saved ? '#4a9c00' : '#aaa', fontWeight: 600 }}>
          {saved ? '✅ Saved' : '○ Not saved'}
        </span>
      </div>
      {children}
      <button
        type="button"
        onClick={onSave}
        disabled={disabled || saving}
        style={{
          marginTop: 16, padding: '10px 20px', borderRadius: 8, border: 'none',
          background: disabled || saving ? '#eee' : '#c8f345',
          color: disabled || saving ? '#aaa' : 'var(--black)',
          fontWeight: 600, fontSize: 14, cursor: disabled || saving ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {saving ? 'Saving…' : saveLabel}
      </button>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#fff',
  border: '1.5px solid #e8e8e8',
  borderRadius: 16,
  padding: 'clamp(20px, 4vw, 28px)',
  transition: 'border-color 0.3s',
};

const heading: React.CSSProperties = {
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: 'var(--black)',
  margin: '0 0 8px',
};

const subtext: React.CSSProperties = {
  color: '#666',
  fontSize: 14,
  lineHeight: 1.5,
  margin: '0 0 12px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  fontSize: 13,
  color: 'var(--black)',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1.5px solid #e0e0e0',
  fontSize: 15,
  color: 'var(--black)',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
};

const savedHint: React.CSSProperties = {
  fontSize: 13,
  color: '#4a9c00',
  marginTop: 8,
  fontWeight: 500,
};
