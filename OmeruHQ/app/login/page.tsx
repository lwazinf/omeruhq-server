'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const t = useTranslations('Login');
  const [step, setStep] = useState<Step>('phone');
  const [localPhone, setLocalPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isBypass = /^[a-zA-Z]/.test(localPhone);
  const fullPhone = isBypass ? localPhone : `+27${localPhone.replace(/^0/, '')}`;

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wa_id: fullPhone }),
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
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wa_id: fullPhone, code: otp }),
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

      {/* ── Left branding panel ── */}
      <div className="login-left" style={{
        width: '50%', background: 'var(--dark-gray)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '40px 52px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--lime)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="5" fill="rgba(0,0,0,0.7)"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'white', letterSpacing: '-0.01em' }}>
            {t('brand')}
          </span>
        </div>

        {/* Headline + bullets */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 100,
            border: '1px solid rgba(200,241,53,0.25)',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase' as const, color: 'var(--lime)',
            marginBottom: 24,
          }}>
            + {t('portalBadge')}
          </div>

          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(32px, 3.5vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.025em', color: 'white', marginBottom: 2 }}>
            {t('brandHeading')}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(32px, 3.5vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.025em', color: 'var(--lime)', marginBottom: 24 }}>
            {t('brandHeadingAccent')}
          </div>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, maxWidth: 360, marginBottom: 36 }}>
            {t('brandSub')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[t('bullet1'), t('bullet2'), t('bullet3')].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: 'rgba(200,241,53,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="var(--lime)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial + copyright */}
        <div>
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '20px 22px', marginBottom: 28, maxWidth: 360,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--lime)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--black)',
                flexShrink: 0,
              }}>N</div>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, marginBottom: 12 }}>
              "From WhatsApp chaos to one clean dashboard. Omeru HQ runs my whole kitchen now."
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
              Naledi · Mama's Kitchen, Durban
            </p>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
            {t('copyright')}
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <main className="login-form-panel" style={{
        flex: 1, background: '#f0ece4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(32px, 6vw, 52px) clamp(32px, 6vw, 80px)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 20, right: 24 }}>
          <LanguageSwitcher />
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>
          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.div key="phone" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <div style={{ marginBottom: 36 }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--black)', marginBottom: 10, lineHeight: 1.15 }}>
                    {t('loginHeading')}
                  </h1>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#7a7670', lineHeight: 1.6 }}>
                    {t('loginSub')}
                  </p>
                </div>

                <form onSubmit={sendOtp}>
                  <label style={{
                    display: 'block', fontFamily: 'var(--font-display)',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.09em',
                    textTransform: 'uppercase' as const, color: '#9b9890', marginBottom: 8,
                  }}>
                    {t('phoneLabel')}
                  </label>

                  {/* Split phone input */}
                  <div className="phone-wrap" style={{
                    display: 'flex', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 12,
                    overflow: 'hidden', background: 'white', marginBottom: 14,
                  }}>
                    {!isBypass && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '13px 14px',
                        background: 'rgba(0,0,0,0.04)',
                        borderRight: '1.5px solid rgba(0,0,0,0.08)',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 17, lineHeight: 1 }}>🇿🇦</span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--black)', fontWeight: 500 }}>+27</span>
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder={t('phonePlaceholder')}
                      value={localPhone}
                      onChange={e => setLocalPhone(e.target.value)}
                      required
                      style={{
                        flex: 1, border: 'none', outline: 'none',
                        fontFamily: 'var(--font-body)', fontSize: 14,
                        color: 'var(--black)', background: 'transparent',
                        padding: '13px 14px',
                      }}
                    />
                  </div>

                  {error && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#c0392b', marginBottom: 10 }}>{error}</p>}

                  <button type="submit" className="btn-lime" style={{ width: '100%', justifyContent: 'center', gap: 8, marginBottom: 14 }} disabled={loading}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                      <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345z"/>
                      <path d="M20.52 3.449C12.831-3.984.106 1.407.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652C8.074 23.271 10.022 23.775 12 23.775c11.377 0 18.415-12.24 12.52-20.326z" fillRule="nonzero"/>
                    </svg>
                    {loading ? t('sending') : t('sendOtp')}
                  </button>

                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 12, color: '#a09c96',
                    textAlign: 'center' as const, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 5, marginBottom: 28,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Secure one-time code · standard rates may apply
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#b0aca4' }}>NEW HERE?</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
                  </div>

                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7a7670', textAlign: 'center' as const }}>
                    Don&apos;t have access yet?{' '}
                    <a href="/?invite=1" style={{ color: 'var(--black)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                      Apply for an invite
                    </a>
                  </p>
                </form>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <div style={{ marginBottom: 36 }}>
                  <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="btn-ghost" style={{ marginBottom: 20, padding: '6px 0', color: '#7a7670' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {t('back')}
                  </button>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--black)', marginBottom: 10, lineHeight: 1.15 }}>
                    {t('otpHeading')}
                  </h1>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#7a7670', lineHeight: 1.6 }}>
                    {t('otpSub', { phone: fullPhone })}
                  </p>
                </div>
                <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' as const, color: '#9b9890', marginBottom: 8 }}>
                      {t('codeLabel')}
                    </label>
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
                      style={{ letterSpacing: '0.3em', fontSize: 22, textAlign: 'center' as const }}
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
      </main>

      <style>{`
        .phone-wrap:focus-within { border-color: var(--black) !important; }
        @media (max-width: 768px) {
          .login-left { display: none !important; }
          .login-form-panel { background: #f0ece4 !important; padding: 32px 24px !important; align-items: flex-start !important; padding-top: 60px !important; }
        }
      `}</style>
    </div>
  );
}
