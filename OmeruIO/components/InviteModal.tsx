'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Types ────────────────────────────────────────────── */

type FormData = {
  business_name: string;
  registration_number: string;
  sells_type: string;
  category: string;
  category_other: string;
  employees: string;
  province: string;
  social_platforms: string[];
  social_following: string;
  monthly_orders: string;
  heard_from: string;
  heard_from_other: string;
  name: string;
  email: string;
  whatsapp: string;
  notes: string;
};

const EMPTY: FormData = {
  business_name: '',
  registration_number: '',
  sells_type: '',
  category: '',
  category_other: '',
  employees: '',
  province: '',
  social_platforms: [],
  social_following: '',
  monthly_orders: '',
  heard_from: '',
  heard_from_other: '',
  name: '',
  email: '',
  whatsapp: '',
  notes: '',
};

const SA_PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Limpopo', 'Mpumalanga', 'Free State', 'North West', 'Northern Cape',
];

/* ─── Sub-components ───────────────────────────────────── */

function PillSelect({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const active = opt === value;
        return (
          <button key={opt} type="button" onClick={() => onChange(opt)} style={{
            padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500,
            border: active ? '1.5px solid transparent' : '1.5px solid rgba(0,0,0,0.12)',
            background: active ? 'var(--black)' : 'white',
            color: active ? 'white' : 'var(--dark-gray)',
            cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit',
          }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function PillMulti({ options, value, onChange }: {
  options: string[]; value: string[]; onChange: (v: string[]) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const active = value.includes(opt);
        return (
          <button key={opt} type="button"
            onClick={() => onChange(active ? value.filter(x => x !== opt) : [...value, opt])}
            style={{
              padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500,
              border: active ? '1.5px solid transparent' : '1.5px solid rgba(0,0,0,0.12)',
              background: active ? 'var(--black)' : 'white',
              color: active ? 'white' : 'var(--dark-gray)',
              cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
            {active && (
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--lime)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4l2 2L6.5 2" stroke="var(--black)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* Animated "Other" text box — slides in when Other is selected */
function OtherField({ show, value, onChange, placeholder }: {
  show: boolean; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <input
            style={inp}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--lime-dark)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; }}
            autoFocus
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: 10 }}>
      {children}{required && <span style={{ color: 'var(--lime-dark)', marginLeft: 3 }}>*</span>}
    </p>
  );
}

function Field({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ marginBottom: 22, ...style }}>{children}</div>;
}

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 12,
  border: '1.5px solid rgba(0,0,0,0.12)', fontSize: 14,
  fontFamily: 'inherit', outline: 'none', background: 'white',
  color: 'var(--black)', boxSizing: 'border-box', transition: 'border-color 0.2s',
};

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inp, ...props.style }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--lime-dark)'; props.onFocus?.(e); }}
      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; props.onBlur?.(e); }}
    />
  );
}

/* ─── Steps ────────────────────────────────────────────── */

function Step1({ data, set }: { data: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <>
      {/* Business name + Reg number side by side */}
      <div className="step1-name-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
        <div>
          <Label required>Business / brand name</Label>
          <Input placeholder="e.g. Kasi Eats" value={data.business_name} onChange={e => set('business_name', e.target.value)} />
        </div>
        <div>
          <Label>Reg. number</Label>
          <Input placeholder="2024/123456/07" value={data.registration_number} onChange={e => set('registration_number', e.target.value)} />
        </div>
      </div>

      <Field>
        <Label required>What do you sell?</Label>
        <PillSelect options={['Products', 'Services', 'Both']} value={data.sells_type} onChange={v => set('sells_type', v)} />
      </Field>

      <Field>
        <Label required>Store category</Label>
        <PillSelect
          options={['Food & Drink', 'Fashion', 'Beauty & Wellness', 'Home & Living', 'Tech', 'Professional Services', 'Other']}
          value={data.category} onChange={v => set('category', v)}
        />
        <OtherField
          show={data.category === 'Other'}
          value={data.category_other}
          onChange={v => set('category_other', v)}
          placeholder="Describe your category…"
        />
      </Field>

      <Field>
        <Label required>Team size</Label>
        <PillSelect options={['Just me', '2 – 5', '6 – 20', '20+']} value={data.employees} onChange={v => set('employees', v)} />
      </Field>

      <Field>
        <Label required>Province</Label>
        <PillSelect options={SA_PROVINCES} value={data.province} onChange={v => set('province', v)} />
      </Field>
    </>
  );
}

function Step2({ data, set, setArr }: {
  data: FormData;
  set: (k: keyof FormData, v: string) => void;
  setArr: (k: keyof FormData, v: string[]) => void;
}) {
  return (
    <>
      <Field>
        <Label>Active social platforms</Label>
        <PillMulti
          options={['Instagram', 'TikTok', 'Facebook', 'X / Twitter', 'YouTube', 'LinkedIn']}
          value={data.social_platforms} onChange={v => setArr('social_platforms', v)}
        />
      </Field>

      <Field>
        <Label required>Combined following across all platforms</Label>
        <PillSelect
          options={['Just starting', '1K – 10K', '10K – 50K', '50K – 200K', '200K+']}
          value={data.social_following} onChange={v => set('social_following', v)}
        />
      </Field>

      <Field>
        <Label required>Monthly orders or bookings</Label>
        <PillSelect
          options={['Just starting', '10 – 50', '50 – 200', '200+']}
          value={data.monthly_orders} onChange={v => set('monthly_orders', v)}
        />
      </Field>

      <Field>
        <Label required>How did you hear about Omeru?</Label>
        <PillSelect
          options={['Instagram', 'TikTok', 'A friend', 'Google', 'WhatsApp', 'An event', 'Other']}
          value={data.heard_from} onChange={v => set('heard_from', v)}
        />
        <OtherField
          show={data.heard_from === 'Other'}
          value={data.heard_from_other}
          onChange={v => set('heard_from_other', v)}
          placeholder="Where did you come across us?"
        />
      </Field>
    </>
  );
}

function Step3({ data, set }: { data: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <>
      <Field>
        <Label required>Your full name</Label>
        <Input placeholder="Full name" value={data.name} onChange={e => set('name', e.target.value)} />
      </Field>
      <Field>
        <Label required>Email address</Label>
        <Input type="email" placeholder="you@example.com" value={data.email} onChange={e => set('email', e.target.value)} />
      </Field>
      <Field>
        <Label required>WhatsApp number</Label>
        <Input type="tel" placeholder="+27 82 000 0000" value={data.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
        <p style={{ fontSize: 11, color: 'var(--mid-gray)', marginTop: 6, fontWeight: 300 }}>
          We use WhatsApp to reach you quickly — it&apos;s how we work.
        </p>
      </Field>
      <Field>
        <Label>Anything else? (optional)</Label>
        <textarea
          style={{ ...inp, minHeight: 80, resize: 'vertical', lineHeight: 1.6 }}
          placeholder="Tell us what makes your store special…"
          value={data.notes}
          onChange={e => set('notes', e.target.value)}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--lime-dark)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; }}
        />
      </Field>
    </>
  );
}

/* ─── Step metadata ────────────────────────────────────── */

const STEPS = [
  { title: 'Your store', subtitle: 'Tell us what you sell and who you are.' },
  { title: 'Your reach', subtitle: 'Community is everything. Show us yours.' },
  { title: 'Almost there', subtitle: "We'll reach out on WhatsApp within a few days." },
];

/* ─── Lenis helper ─────────────────────────────────────── */

type LenisInstance = { stop(): void; start(): void };
function getLenis(): LenisInstance | undefined {
  return (window as unknown as { __lenis?: LenisInstance }).__lenis;
}

/* ─── Modal ────────────────────────────────────────────── */

export default function InviteModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const close = useCallback(() => {
    setOpen(false);
    setTimeout(() => { setStep(0); setDir(1); setData(EMPTY); setDone(false); setError(''); }, 400);
  }, []);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth <= 768) {
        router.push('/apply');
      } else {
        setOpen(true);
      }
    };
    window.addEventListener('omeru:invite', handler);

    if (new URLSearchParams(window.location.search).get('invite') === '1') {
      setOpen(true);
      history.replaceState(null, '', window.location.pathname);
    }

    return () => window.removeEventListener('omeru:invite', handler);
  }, [router]);

  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      getLenis()?.stop();
    } else {
      const top = Math.abs(parseInt(document.body.style.top || '0', 10));
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (top) window.scrollTo(0, top);
      getLenis()?.start();
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      getLenis()?.start();
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  function set(k: keyof FormData, v: string) {
    setData(prev => ({ ...prev, [k]: v }));
  }

  function setArr(k: keyof FormData, v: string[]) {
    setData(prev => ({ ...prev, [k]: v }));
  }

  function canAdvance() {
    if (step === 0) {
      const categoryOk = data.category && (data.category !== 'Other' || data.category_other.trim());
      return data.business_name.trim() && data.sells_type && categoryOk && data.employees && data.province;
    }
    if (step === 1) {
      const heardOk = data.heard_from && (data.heard_from !== 'Other' || data.heard_from_other.trim());
      return data.social_following && data.monthly_orders && heardOk;
    }
    if (step === 2) return data.name.trim() && data.email.trim() && data.whatsapp.trim();
    return true;
  }

  function next() {
    if (!canAdvance()) { setError('Please complete the required fields to continue.'); return; }
    setError('');
    setDir(1);
    setStep(s => s + 1);
  }

  function back() {
    setError('');
    setDir(-1);
    setStep(s => s - 1);
  }

  async function submit() {
    if (!canAdvance()) { setError('Please fill in your name, email, and WhatsApp number.'); return; }
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...data,
        social_platforms: data.social_platforms.join(', '),
        // resolve "Other" values before sending
        category: data.category === 'Other' ? data.category_other : data.category,
        heard_from: data.heard_from === 'Other' ? data.heard_from_other : data.heard_from,
      };
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed');
      setDone(true);
    } catch {
      setError('Something went wrong. Email merchants@omeru.io if this persists.');
    } finally {
      setLoading(false);
    }
  }

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={close}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 1000 }}
          />

          {/* Centering shell — on mobile: bottom sheet anchor; pointer-events overridden to auto via CSS so touch scroll works */}
          <div className="modal-shell" onClick={close} style={{
            position: 'fixed', inset: 0, zIndex: 1001,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(48px, 6vw, 60px) clamp(16px, 4vw, 40px) clamp(16px, 4vw, 40px)',
            pointerEvents: 'none',
          }}>
            {/* Relative wrapper — stopPropagation prevents shell's close-on-click firing inside the card */}
            <div className="modal-wrapper" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 540, pointerEvents: 'auto' }}>

              {/* ── Close button — floats above the card ── */}
              <button
                onClick={close}
                className="modal-close-float"
                style={{
                  position: 'absolute', top: -44, right: 0,
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 2,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>

            <motion.div
              key="modal"
              className="modal-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%', maxHeight: '90vh',
                background: 'var(--off-white)', borderRadius: 28, overflow: 'hidden',
                boxShadow: '0 40px 100px rgba(0,0,0,0.28)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {done ? (
                /* ── Success ── */
                <div style={{ padding: '56px 40px', textAlign: 'center' }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                    style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="var(--black)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--black)', letterSpacing: '-0.02em', marginBottom: 10 }}>
                    Application received
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--mid-gray)', fontWeight: 300, lineHeight: 1.75, maxWidth: 340, margin: '0 auto 32px' }}>
                    We review applications weekly. If you&apos;re a great fit we&apos;ll ping you on WhatsApp — keep an eye out.
                  </p>
                  <button onClick={close} className="btn-lime" style={{ padding: '12px 32px', fontSize: 14 }}>
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* ── Header ── */}
                  <div style={{ background: 'var(--black)', padding: '24px 28px 22px', position: 'relative', flexShrink: 0 }}>
                    {/* Mobile-only close button inside header */}
                    <button onClick={close} className="modal-header-close" style={{ display: 'none', position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.6" strokeLinecap="round"/></svg>
                    </button>
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', opacity: 0.06 }} />

                    {/* Progress bars */}
                    <div style={{ display: 'flex', gap: 5, marginBottom: 18, position: 'relative', zIndex: 1 }}>
                      {STEPS.map((_, i) => (
                        <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, overflow: 'hidden', background: 'rgba(255,255,255,0.12)' }}>
                          <motion.div
                            animate={{ width: i <= step ? '100%' : '0%' }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            style={{ height: '100%', background: 'var(--lime)', borderRadius: 2 }}
                          />
                        </div>
                      ))}
                    </div>

                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 5, position: 'relative', zIndex: 1 }}>
                      Step {step + 1} of {STEPS.length}
                    </p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2.2vw,24px)', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15, position: 'relative', zIndex: 1 }}>
                      {STEPS[step].title}
                    </p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', fontWeight: 300, marginTop: 4, position: 'relative', zIndex: 1 }}>
                      {STEPS[step].subtitle}
                    </p>
                  </div>

                  {/* ── Scrollable body ── */}
                  <div className="modal-scroll-body" style={{ overflowY: 'auto', flex: 1, padding: '24px 28px 4px', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
                    <AnimatePresence mode="wait" custom={dir} initial={false}>
                      <motion.div
                        key={step}
                        custom={dir}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {step === 0 && <Step1 data={data} set={set} />}
                        {step === 1 && <Step2 data={data} set={set} setArr={setArr} />}
                        {step === 2 && <Step3 data={data} set={set} />}
                      </motion.div>
                    </AnimatePresence>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: 12, color: '#c0392b', marginBottom: 12, fontWeight: 500, padding: '8px 12px', background: 'rgba(192,57,43,0.08)', borderRadius: 8 }}
                      >
                        {error}
                      </motion.p>
                    )}
                  </div>

                  {/* ── Footer ── */}
                  <div className="modal-footer-bar" style={{ padding: '16px 28px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    {step > 0 ? (
                      <button onClick={back} style={{ fontSize: 13, color: 'var(--mid-gray)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, padding: '8px 0' }}>
                        ← Back
                      </button>
                    ) : (
                      <p style={{ fontSize: 11, color: 'var(--mid-gray)', fontWeight: 300 }}>Takes about 2 minutes</p>
                    )}

                    {step < STEPS.length - 1 ? (
                      <button onClick={next} className="btn-lime" style={{ padding: '11px 28px', fontSize: 14 }}>
                        Continue →
                      </button>
                    ) : (
                      <button onClick={submit} disabled={loading} className="btn-lime" style={{ padding: '11px 28px', fontSize: 14, opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Submitting…' : 'Apply for invite'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
            </div>{/* end relative wrapper */}
          </div>{/* end centering shell */}

          <style>{`
            @media (max-width: 600px) {
              /*
               * Bottom-sheet pattern on mobile.
               * pointer-events: auto (overrides inline none) so touch events reach the shell
               * and tap-outside-sheet fires the shell's onClick(close).
               * The card's overflow-y: auto scroll works because its flex parent
               * (modal-wrapper) has pointer-events and the card has a constrained max-height.
               */
              .modal-shell {
                align-items: flex-end !important;
                justify-content: flex-start !important;
                padding: 0 !important;
                overflow: hidden !important;
                pointer-events: auto !important;
              }
              .modal-wrapper {
                max-width: 100% !important;
                width: 100% !important;
              }
              .modal-card {
                border-radius: 20px 20px 0 0 !important;
                max-height: 92svh !important;
                max-height: 92vh !important;
                min-height: 0 !important;
              }
              /* card handles scroll — flex child needs min-height:0 to shrink */
              .modal-scroll-body {
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
                flex: 1 !important;
                min-height: 0 !important;
                padding: 20px 20px 8px !important;
              }
              .modal-close-float { display: none !important; }
              .modal-header-close { display: flex !important; }
              .step1-name-grid { grid-template-columns: 1fr !important; }
              /* prevent iOS auto-zoom on focus */
              .modal-card input,
              .modal-card textarea { font-size: 16px !important; }
              .modal-card button[type="button"] { min-height: 44px; font-size: 14px !important; }
              .modal-footer-bar {
                position: sticky !important;
                bottom: 0 !important;
                background: var(--off-white) !important;
                border-top: 1px solid rgba(0,0,0,0.06) !important;
                padding: 14px 20px env(safe-area-inset-bottom, 16px) !important;
              }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}

export function openInviteModal() {
  window.dispatchEvent(new CustomEvent('omeru:invite'));
}
