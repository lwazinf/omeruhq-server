'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Only reachable while ZERO operators exist. The account created here becomes
// the immutable root operator; the API enforces the lock even if this page is
// reached after the fact.
export default function RegisterPage() {
  const router = useRouter();
  const [open, setOpen] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/auth/register')
      .then((r) => r.json())
      .then((d) => setOpen(Boolean(d.open)))
      .catch(() => setOpen(false));
  }, []);

  async function submit() {
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 12) { setError('Password must be at least 12 characters'); return; }
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
      return;
    }
    const d = await res.json().catch(() => ({}));
    setError(d.error ?? 'Registration failed');
    setBusy(false);
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="cr-card" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22 }}>
            OMERU<span style={{ color: 'var(--lime)' }}> CR</span>
          </div>
          <div className="cr-help" style={{ marginTop: 6 }}>Root operator registration</div>
        </div>

        {open === null && <p className="cr-help">Checking registration status…</p>}

        {open === false && (
          <div>
            <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
              Registration is closed — a root operator already exists. New operators are
              created inside the Control Room by an admin with the right permission.
            </p>
            <Link href="/login" className="cr-btn" style={{ width: '100%', textDecoration: 'none' }}>
              Go to sign in
            </Link>
          </div>
        )}

        {open === true && (
          <>
            <p className="cr-help" style={{ marginBottom: 20 }}>
              You are creating the <b>first and only self-registered account</b>. It becomes the
              root operator with every permission, and this page locks permanently afterwards.
            </p>

            <label className="cr-label" htmlFor="name">Full name</label>
            <input id="name" className="cr-input" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 14 }} />

            <label className="cr-label" htmlFor="email">Email</label>
            <input id="email" className="cr-input" type="email" autoComplete="username"
              value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 14 }} />

            <label className="cr-label" htmlFor="password">Password (min 12 characters)</label>
            <input id="password" className="cr-input" type="password" autoComplete="new-password"
              value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginBottom: 14 }} />

            <label className="cr-label" htmlFor="confirm">Confirm password</label>
            <input id="confirm" className="cr-input" type="password" autoComplete="new-password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)} style={{ marginBottom: 20 }} />

            {error && <p className="cr-error" style={{ marginBottom: 14 }} role="alert">{error}</p>}

            <button className="cr-btn" style={{ width: '100%' }} onClick={submit}
              disabled={busy || !name || !email || !password || !confirm}>
              {busy ? 'Creating root operator…' : 'Create root operator'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
