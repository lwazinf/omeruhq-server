'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);

  useEffect(() => {
    // If no operator exists yet, point the first person at /register.
    fetch('/api/auth/register')
      .then((r) => r.json())
      .then((d) => setRegistrationOpen(Boolean(d.open)))
      .catch(() => {});
  }, []);

  async function submit() {
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
      return;
    }
    const d = await res.json().catch(() => ({}));
    setError(d.error ?? 'Sign-in failed');
    setBusy(false);
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="cr-card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <div style={{ marginBottom: 26, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22 }}>
            OMERU<span style={{ color: 'var(--lime)' }}> CR</span>
          </div>
          <div className="cr-help" style={{ marginTop: 6 }}>Control Room · authorised operators only</div>
        </div>

        <label className="cr-label" htmlFor="email">Email</label>
        <input id="email" className="cr-input" type="email" autoComplete="username"
          value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 16 }} />

        <label className="cr-label" htmlFor="password">Password</label>
        <input id="password" className="cr-input" type="password" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginBottom: 20 }}
          onKeyDown={(e) => e.key === 'Enter' && !busy && submit()} />

        {error && <p className="cr-error" style={{ marginBottom: 14 }} role="alert">{error}</p>}

        <button className="cr-btn" style={{ width: '100%' }} onClick={submit} disabled={busy || !email || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        {registrationOpen && (
          <p className="cr-help" style={{ marginTop: 18, textAlign: 'center' }}>
            No operators exist yet.{' '}
            <Link href="/register" style={{ color: 'var(--lime)' }}>Register the root operator</Link>
          </p>
        )}
      </div>
    </div>
  );
}
