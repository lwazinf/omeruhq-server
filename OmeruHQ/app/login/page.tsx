'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const t = useTranslations('Login');
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const wa_id = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim()}`;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wa_id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t('networkError')); return; }
      if (data.dev_bypass) { window.location.href = '/dashboard'; return; }
      setStep('otp');
    } catch {
      setError(t('networkError'));
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
      setError(t('networkError'));
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M3 9C3 5.686 5.686 3 9 3s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" fill="var(--lime)"/>
              <path d="M9 6v6M6 9h6" stroke="rgba(0,0,0,0.5)" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'white', letterSpacing: '-0.01em' }}>{t('brand')}</span>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 100, border: '1px solid rgba(200,241,53,0.25)', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--lime)', marginBottom: 24 }}>
            {t('portalBadge')}
          </div>
          <div className="display-lg" style={{ color: 'white', marginBottom: 20 }}>
            {t('brandHeading')}<br /><span style={{ color: 'var(--lime)' }}>{t('brandHeadingAccent')}</span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 360 }}>
            {t('brandSub')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 36 }}>
            {[t('bullet1'), t('bullet2'), t('bullet3')].map(f => (
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

        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          {t('copyright')}
        </p>
      </div>

      {/* ── Right: form panel ── */}
      <div className="login-form-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(32px, 6vw, 52px) clamp(20px, 6vw, 52px)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 24, right: 28 }}>
          <LanguageSwitcher />
        </div>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.div key="phone" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <div style={{ marginBottom: 36 }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 8 }}>{t('loginHeading')}</h1>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--mid-gray)', lineHeight: 1.5 }}>{t('loginSub')}</p>
                </div>
                <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: 8 }}>{t('phoneLabel')}</label>
                    <input
                      className="input"
                      type="tel"
                      placeholder={t('phonePlaceholder')}
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#c0392b' }}>{error}</p>}
                  <button type="submit" className="btn-lime" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
                    {loading ? t('sending') : t('sendOtp')}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <div style={{ marginBottom: 36 }}>
                  <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="btn-ghost" style={{ marginBottom: 20, padding: '6px 0' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {t('back')}
                  </button>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 8 }}>{t('otpHeading')}</h1>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--mid-gray)', lineHeight: 1.5 }}>
                    {t('otpSub', { phone })}
                  </p>
                </div>
                <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: 8 }}>{t('codeLabel')}</label>
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
                    {loading ? t('verifying') : t('verify')}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-left { display: none !important; }
          .login-form-panel { padding: 32px 24px !important; align-items: flex-start !important; padding-top: 60px !important; }
        }
      `}</style>
    </div>
  );
}
