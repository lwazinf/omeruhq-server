'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const wa_id = phone.startsWith('+') ? phone : `+${phone}`;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wa_id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send OTP'); return; }
      setStep('otp');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const wa_id = phone.startsWith('+') ? phone : `+${phone}`;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wa_id, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Incorrect code'); return; }
      window.location.href = '/dashboard';
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Left: branding panel ── */}
      <div style={{
        width: '45%', background: 'var(--dark-gray)', position: 'relative',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 52px', overflow: 'hidden',
      }} className="login-left">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M3 9C3 5.686 5.686 3 9 3s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" fill="var(--lime)"/>
              <path d="M9 6v6M6 9h6" stroke="rgba(0,0,0,0.5)" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'white', letterSpacing: '-0.01em' }}>Omeru HQ</span>
        </div>

        {/* Headline */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 100, border: '1px solid rgba(200,241,53,0.25)', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--lime)', marginBottom: 24 }}>
            Merchant Portal
          </div>
          <div className="display-lg" style={{ color: 'white', marginBottom: 20 }}>
            Your store.<br /><span style={{ color: 'var(--lime)' }}>Your control.</span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 360 }}>
            Orders, products, bookings, analytics — everything your WhatsApp business needs, in one clean dashboard.
          </p>

          {/* Feature bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 36 }}>
            {[
              'Kanban order management',
              'Real-time revenue analytics',
              'Booking calendar for service merchants',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(200,241,53,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="var(--lime)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          © 2026 Omeru · For merchants only
        </p>
      </div>

      {/* ── Right: form panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 52px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.div key="phone" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <div style={{ marginBottom: 36 }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 8 }}>Log in to your store</h1>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--mid-gray)', lineHeight: 1.5 }}>We'll send a one-time code to your WhatsApp number.</p>
                </div>
                <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: 8 }}>WhatsApp Number</label>
                    <input
                      className="input"
                      type="tel"
                      placeholder="+27 82 000 0000"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#c0392b' }}>{error}</p>}
                  <button type="submit" className="btn-lime" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
                    {loading ? 'Sending…' : 'Send OTP via WhatsApp'}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <div style={{ marginBottom: 36 }}>
                  <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="btn-ghost" style={{ marginBottom: 20, padding: '6px 0' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Back
                  </button>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 8 }}>Enter your code</h1>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--mid-gray)', lineHeight: 1.5 }}>
                    We sent a 6-digit code to <strong style={{ color: 'var(--black)' }}>{phone}</strong> on WhatsApp.
                  </p>
                </div>
                <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: 8 }}>Verification Code</label>
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="000000"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      style={{ letterSpacing: '0.3em', fontSize: 22, textAlign: 'center' }}
                    />
                  </div>
                  {error && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#c0392b' }}>{error}</p>}
                  <button type="submit" className="btn-lime" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading || otp.length < 6}>
                    {loading ? 'Verifying…' : 'Confirm & enter HQ'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .login-left { display: none !important; } }
      `}</style>
    </div>
  );
}
