'use client';

import { useCallback, useEffect, useState } from 'react';

// ── Broadcast composer ────────────────────────────────────────────────────
// Pick an audience → preview the exact recipient count → confirm → send.
// Permissions and large-send confirmation are enforced server-side; the UI
// mirrors them for clarity.

type Audience = 'ALL_CUSTOMERS' | 'ALL_MERCHANTS' | 'EVERYONE' | 'INDIVIDUAL' | 'SEGMENT';
type SegmentKind = 'MERCHANT_REVENUE_BAND' | 'MERCHANT_CATEGORY' | 'MERCHANT_CHURN_RISK' | 'CUSTOMER_TOP_SPENDERS';

const AUDIENCES: { id: Audience; label: string; hint: string }[] = [
  { id: 'ALL_MERCHANTS', label: 'All merchants', hint: 'Every active merchant' },
  { id: 'ALL_CUSTOMERS', label: 'All customers', hint: 'Every opted-in customer' },
  { id: 'EVERYONE', label: 'Everyone', hint: 'Merchants + customers, de-duplicated' },
  { id: 'INDIVIDUAL', label: 'Individual', hint: 'One WhatsApp number' },
  { id: 'SEGMENT', label: 'Segment', hint: 'Analytical group' },
];

const SEGMENTS: { id: SegmentKind; label: string; hint: string }[] = [
  { id: 'MERCHANT_REVENUE_BAND', label: 'Merchants · revenue band', hint: 'Revenue between min and max over a window' },
  { id: 'MERCHANT_CATEGORY', label: 'Merchants · category', hint: 'By store category (e.g. Food & Home Cooking)' },
  { id: 'MERCHANT_CHURN_RISK', label: 'Merchants · churn risk', hint: 'High sellers who have gone quiet' },
  { id: 'CUSTOMER_TOP_SPENDERS', label: 'Customers · top spenders', hint: 'Lifetime spend above a threshold' },
];

export default function BroadcastPage() {
  const [audience, setAudience] = useState<Audience>('ALL_MERCHANTS');
  const [segmentKind, setSegmentKind] = useState<SegmentKind>('MERCHANT_REVENUE_BAND');
  const [waId, setWaId] = useState('');
  const [minRevenue, setMinRevenue] = useState('1000');
  const [maxRevenue, setMaxRevenue] = useState('');
  const [windowDays, setWindowDays] = useState('30');
  const [category, setCategory] = useState('');
  const [quietDays, setQuietDays] = useState('14');
  const [minSpend, setMinSpend] = useState('1000');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<{ count: number; description: string } | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const buildRequest = useCallback(() => {
    const req: Record<string, unknown> = { audience };
    if (audience === 'INDIVIDUAL') req.waId = waId;
    if (audience === 'SEGMENT') {
      const seg: Record<string, unknown> = { kind: segmentKind };
      if (segmentKind === 'MERCHANT_REVENUE_BAND') {
        seg.minRevenue = Number(minRevenue) || 0;
        if (maxRevenue) seg.maxRevenue = Number(maxRevenue);
        seg.windowDays = Number(windowDays) || 30;
      }
      if (segmentKind === 'MERCHANT_CATEGORY') seg.category = category;
      if (segmentKind === 'MERCHANT_CHURN_RISK') {
        seg.minRevenue = Number(minRevenue) || 1000;
        seg.windowDays = Number(windowDays) || 90;
        seg.quietDays = Number(quietDays) || 14;
      }
      if (segmentKind === 'CUSTOMER_TOP_SPENDERS') seg.minSpend = Number(minSpend) || 1000;
      req.segment = seg;
    }
    return req;
  }, [audience, segmentKind, waId, minRevenue, maxRevenue, windowDays, category, quietDays, minSpend]);

  // Live recipient preview whenever the audience definition changes.
  useEffect(() => {
    setPreview(null);
    setError('');
    setConfirming(false);
    if (audience === 'INDIVIDUAL' && waId.replace(/\D/g, '').length < 9) return;
    if (audience === 'SEGMENT' && segmentKind === 'MERCHANT_CATEGORY' && !category) return;
    const t = setTimeout(async () => {
      const res = await fetch('/api/broadcast/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequest()),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setPreview(d);
      else setError(d.error ?? 'Preview failed');
    }, 400);
    return () => clearTimeout(t);
  }, [buildRequest, audience, segmentKind, waId, category]);

  async function send(confirm: boolean) {
    setBusy(true);
    setError('');
    setStatus('');
    const res = await fetch('/api/broadcast/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...buildRequest(), message, confirm }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.status === 412) { setConfirming(true); return; }
    if (!res.ok) { setError(d.error ?? 'Send failed'); return; }
    setConfirming(false);
    setStatus(`Delivered ${d.sent}/${d.recipients}${d.failed ? ` · ${d.failed} failed` : ''}`);
    setMessage('');
  }

  const numInput = (label: string, val: string, set: (v: string) => void, suffix?: string) => (
    <div>
      <label className="cr-label">{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input className="cr-input" inputMode="numeric" value={val} onChange={(e) => set(e.target.value.replace(/[^\d]/g, ''))} />
        {suffix && <span className="cr-help" style={{ whiteSpace: 'nowrap' }}>{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 20 }}>
        Broadcast
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        {/* Audience */}
        <div className="cr-card">
          <div className="cr-label" style={{ marginBottom: 12 }}>1 · Audience</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {AUDIENCES.map((a) => (
              <button
                key={a.id}
                onClick={() => setAudience(a.id)}
                className="cr-btn cr-btn-ghost"
                style={{
                  justifyContent: 'space-between', borderRadius: 12, padding: '12px 14px',
                  borderColor: audience === a.id ? 'var(--lime)' : 'var(--line)',
                  background: audience === a.id ? 'rgba(200,241,53,0.08)' : 'transparent',
                }}
                aria-pressed={audience === a.id}
              >
                <span style={{ fontWeight: 700 }}>{a.label}</span>
                <span className="cr-help">{a.hint}</span>
              </button>
            ))}
          </div>

          {audience === 'INDIVIDUAL' && (
            <div style={{ marginTop: 16 }}>
              <label className="cr-label">WhatsApp number (e.g. 27821234567)</label>
              <input className="cr-input" inputMode="tel" value={waId} onChange={(e) => setWaId(e.target.value)} />
            </div>
          )}

          {audience === 'SEGMENT' && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="cr-label">Segment type</label>
                <select className="cr-select" value={segmentKind} onChange={(e) => setSegmentKind(e.target.value as SegmentKind)}>
                  {SEGMENTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <p className="cr-help" style={{ marginTop: 6 }}>{SEGMENTS.find((s) => s.id === segmentKind)?.hint}</p>
              </div>

              {segmentKind === 'MERCHANT_REVENUE_BAND' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {numInput('Min R', minRevenue, setMinRevenue)}
                  {numInput('Max R (blank = ∞)', maxRevenue, setMaxRevenue)}
                  {numInput('Window', windowDays, setWindowDays, 'days')}
                </div>
              )}
              {segmentKind === 'MERCHANT_CATEGORY' && (
                <div>
                  <label className="cr-label">Store category (exact)</label>
                  <input className="cr-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Food & Home Cooking" />
                </div>
              )}
              {segmentKind === 'MERCHANT_CHURN_RISK' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {numInput('Min revenue R', minRevenue, setMinRevenue)}
                  {numInput('Over', windowDays, setWindowDays, 'days')}
                  {numInput('Quiet for', quietDays, setQuietDays, 'days')}
                </div>
              )}
              {segmentKind === 'CUSTOMER_TOP_SPENDERS' && numInput('Min lifetime spend R', minSpend, setMinSpend)}
            </div>
          )}
        </div>

        {/* Message + send */}
        <div className="cr-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="cr-label" style={{ marginBottom: 12 }}>2 · Message</div>
          <textarea
            className="cr-textarea"
            maxLength={1024}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write the WhatsApp message…"
            style={{ flex: 1 }}
          />
          <div className="cr-help" style={{ textAlign: 'right', marginTop: 6 }}>{message.length}/1024</div>

          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
            <div className="cr-label" style={{ marginBottom: 4 }}>Recipients</div>
            {preview ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span className="cr-kpi-number" style={{ fontSize: 26 }}>{preview.count}</span>
                <span className="cr-help">{preview.description}</span>
              </div>
            ) : (
              <span className="cr-help">Define the audience to see a live count.</span>
            )}
          </div>

          {error && <p className="cr-error" style={{ marginTop: 12 }} role="alert">{error}</p>}
          {status && <p style={{ marginTop: 12, color: 'var(--ok)', fontSize: 13 }} role="status">{status}</p>}

          {!confirming ? (
            <button
              className="cr-btn"
              style={{ marginTop: 16 }}
              disabled={busy || !message.trim() || !preview || preview.count === 0}
              onClick={() => send(false)}
            >
              {busy ? 'Sending…' : 'Send broadcast'}
            </button>
          ) : (
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="cr-btn cr-btn-danger" disabled={busy} onClick={() => send(true)}>
                {busy ? 'Sending…' : `Yes — message ${preview?.count ?? ''} people`}
              </button>
              <button className="cr-btn cr-btn-ghost" disabled={busy} onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
