'use client';

import { useState } from 'react';
import Link from 'next/link';
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

const STEPS = [
  { title: 'Your store', subtitle: 'Tell us what you sell and who you are.' },
  { title: 'Your reach', subtitle: 'Community is everything. Show us yours.' },
  { title: 'Almost there', subtitle: "We'll reach out on WhatsApp within a few days." },
];

/* ─── Style constants ──────────────────────────────────── */

const inp: React.CSSProperties = {
  width: '100%', padding: '13px 16px', borderRadius: 14,
  border: '1.5px solid rgba(0,0,0,0.12)', fontSize: 16,
  fontFamily: 'inherit', outline: 'none', background: 'white',
  color: 'var(--black)', boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--mid-gray)', marginBottom: 10,
};

/* ─── Sub-components ───────────────────────────────────── */

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p style={labelStyle}>
      {children}{required && <span style={{ color: 'var(--lime-dark)', marginLeft: 3 }}>*</span>}
    </p>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 24 }}>{children}</div>;
}

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

function PillSelect({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const active = opt === value;
        return (
          <button key={opt} type="button" onClick={() => onChange(opt)} style={{
            padding: '10px 18px', borderRadius: 100, fontSize: 14, fontWeight: 500,
            border: active ? '1.5px solid transparent' : '1.5px solid rgba(0,0,0,0.12)',
            background: active ? 'var(--black)' : 'white',
            color: active ? 'white' : 'var(--dark-gray)',
            cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit',
            minHeight: 44,
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
              padding: '10px 18px', borderRadius: 100, fontSize: 14, fontWeight: 500,
              border: active ? '1.5px solid transparent' : '1.5px solid rgba(0,0,0,0.12)',
              background: active ? 'var(--black)' : 'white',
              color: active ? 'white' : 'var(--dark-gray)',
              cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44,
            }}>
            {active && (
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--lime)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
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

function OtherField({ show, value, onChange, placeholder }: {
  show: boolean; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <Input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} autoFocus />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Form steps ───────────────────────────────────────── */

function Step1({ data, set }: { data: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }} className="apply-name-grid">
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
        <OtherField show={data.category === 'Other'} value={data.category_other} onChange={v => set('category_other', v)} placeholder="Describe your category…" />
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
        <OtherField show={data.heard_from === 'Other'} value={data.heard_from_other} onChange={v => set('heard_from_other', v)} placeholder="Where did you come across us?" />
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
        <p style={{ fontSize: 12, color: 'var(--mid-gray)', marginTop: 8, fontWeight: 300 }}>
          We use WhatsApp to reach you quickly — it&apos;s how we work.
        </p>
      </Field>
      <Field>
        <Label>Anything else? (optional)</Label>
        <textarea
          style={{ ...inp, minHeight: 96, resize: 'vertical', lineHeight: 1.6 }}
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

/* ─── Page ─────────────────────────────────────────────── */

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
};

export default function ApplyPage() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function back() {
    setError('');
    setDir(-1);
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit() {
    if (!canAdvance()) { setError('Please fill in your name, email, and WhatsApp number.'); return; }
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...data,
        social_platforms: data.social_platforms.join(', '),
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Something went wrong. Email merchants@omeru.io if this persists.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--off-white)', minHeight: '100vh' }}>
      <div className="noise" />

      {/* Nav */}
      <nav style={{
        background: 'var(--black)', padding: '0 clamp(20px, 4vw, 48px)',
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20,
          color: 'white', textDecoration: 'none', letterSpacing: '-0.02em',
        }}>
          omeru<span style={{ color: 'var(--lime)' }}>.</span>
        </Link>
        <Link href="/" style={{
          fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
          fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to site
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 'clamp(32px, 5vw, 56px) clamp(20px, 4vw, 24px) 80px' }}>

        {done ? (
          /* ── Success ── */
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: 'center', paddingTop: 40 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.12 }}
              style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="var(--black)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 700, color: 'var(--black)', letterSpacing: '-0.02em', marginBottom: 14 }}>
              Application received
            </h1>
            <p style={{ fontSize: 16, color: 'var(--mid-gray)', fontWeight: 300, lineHeight: 1.75, maxWidth: 380, margin: '0 auto 36px' }}>
              We review applications weekly. If you&apos;re a great fit we&apos;ll ping you on WhatsApp — keep an eye out.
            </p>
            <Link href="/" className="btn-lime" style={{ display: 'inline-flex', padding: '13px 32px', fontSize: 15 }}>
              Back to Omeru
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Step indicator */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                {STEPS.map((_, i) => (
                  <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, overflow: 'hidden', background: 'rgba(0,0,0,0.08)' }}>
                    <motion.div
                      animate={{ width: i <= step ? '100%' : '0%' }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      style={{ height: '100%', background: 'var(--black)', borderRadius: 2 }}
                    />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: 6 }}>
                Step {step + 1} of {STEPS.length}
              </p>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 700, color: 'var(--black)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 4 }}>
                {STEPS[step].title}
              </h1>
              <p style={{ fontSize: 15, color: 'var(--mid-gray)', fontWeight: 300 }}>
                {STEPS[step].subtitle}
              </p>
            </div>

            {/* Form card */}
            <div style={{ background: 'white', borderRadius: 24, padding: 'clamp(24px, 4vw, 36px)', boxShadow: '0 2px 24px rgba(0,0,0,0.06)', marginBottom: 24 }}>
              <AnimatePresence mode="wait" custom={dir} initial={false}>
                <motion.div
                  key={step}
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
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
                  style={{ fontSize: 13, color: '#c0392b', marginTop: 8, fontWeight: 500, padding: '10px 14px', background: 'rgba(192,57,43,0.07)', borderRadius: 10 }}
                >
                  {error}
                </motion.p>
              )}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {step > 0 ? (
                <button
                  onClick={back}
                  style={{ fontSize: 14, color: 'var(--mid-gray)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, padding: '12px 0', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back
                </button>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--mid-gray)', fontWeight: 300 }}>Takes about 2 minutes</p>
              )}

              {step < STEPS.length - 1 ? (
                <button onClick={next} className="btn-lime" style={{ padding: '13px 32px', fontSize: 15 }}>
                  Continue →
                </button>
              ) : (
                <button onClick={submit} disabled={loading} className="btn-lime" style={{ padding: '13px 32px', fontSize: 15, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Submitting…' : 'Apply for invite'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 480px) {
          .apply-name-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
