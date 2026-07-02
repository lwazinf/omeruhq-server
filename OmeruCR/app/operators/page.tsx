'use client';

import { useCallback, useEffect, useState } from 'react';

// ── Operator management ───────────────────────────────────────────────────
// Only visible/usable with MANAGE_OPERATORS (the API enforces it). The root
// operator can never be edited or disabled from here.

const PERMS = [
  { id: 'VIEW_ANALYTICS', label: 'View analytics' },
  { id: 'BROADCAST_CUSTOMERS', label: 'Broadcast to customers' },
  { id: 'BROADCAST_MERCHANTS', label: 'Broadcast to merchants' },
  { id: 'MANAGE_OPERATORS', label: 'Manage operators' },
  { id: 'VIEW_AUDIT', label: 'View audit trail' },
  { id: 'FRAUD_REPORTS', label: 'Fraud & anomaly reports' },
];

interface Operator {
  id: string; email: string; name: string; is_root: boolean;
  permissions: string[]; disabled: boolean;
  last_login_at: string | null; createdAt: string;
}

export default function OperatorsPage() {
  const [ops, setOps] = useState<Operator[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Create form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [perms, setPerms] = useState<string[]>(['VIEW_ANALYTICS']);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/operators');
    const d = await res.json().catch(() => ({}));
    if (res.ok) { setOps(d.operators); setError(''); }
    else setError(d.error ?? 'Could not load operators');
  }, []);

  useEffect(() => { load(); }, [load]);

  function togglePerm(list: string[], p: string): string[] {
    return list.includes(p) ? list.filter((x) => x !== p) : [...list, p];
  }

  async function create() {
    setBusy(true);
    setError('');
    setNotice('');
    const res = await fetch('/api/operators', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, permissions: perms }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(d.error ?? 'Create failed'); return; }
    setNotice(`Operator ${d.operator.email} created`);
    setName(''); setEmail(''); setPassword(''); setPerms(['VIEW_ANALYTICS']);
    load();
  }

  async function patch(id: string, body: { permissions?: string[]; disabled?: boolean }) {
    setError('');
    const res = await fetch(`/api/operators/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? 'Update failed');
    }
    load();
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 20 }}>
        Operators
      </h1>

      {error && <p className="cr-error" style={{ marginBottom: 14 }} role="alert">{error}</p>}
      {notice && <p style={{ marginBottom: 14, color: 'var(--ok)', fontSize: 13 }} role="status">{notice}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18 }}>
        {/* Existing operators */}
        <div className="cr-card" style={{ overflowX: 'auto' }}>
          <div className="cr-label" style={{ marginBottom: 12 }}>Current operators</div>
          <table className="cr-table">
            <thead>
              <tr><th>Operator</th><th>Permissions</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {(ops ?? []).map((o) => (
                <tr key={o.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{o.name}</div>
                    <div className="cr-help">{o.email}</div>
                  </td>
                  <td>
                    {o.is_root ? (
                      <span className="cr-chip">root · all permissions</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {PERMS.map((p) => (
                          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={o.permissions.includes(p.id)}
                              onChange={() => patch(o.id, { permissions: togglePerm(o.permissions, p.id) })}
                              style={{ accentColor: 'var(--lime)' }}
                            />
                            {p.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    {o.disabled
                      ? <span className="cr-chip cr-chip-danger">disabled</span>
                      : <span className="cr-chip cr-chip-ok">active</span>}
                  </td>
                  <td>
                    {!o.is_root && (
                      <button
                        className={`cr-btn ${o.disabled ? '' : 'cr-btn-danger'}`}
                        style={{ padding: '7px 14px', fontSize: 12 }}
                        onClick={() => patch(o.id, { disabled: !o.disabled })}
                      >
                        {o.disabled ? 'Re-enable' : 'Disable'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {ops?.length === 0 && <tr><td colSpan={4} className="cr-help">No operators.</td></tr>}
              {ops === null && !error && <tr><td colSpan={4} className="cr-help">Loading…</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Create operator */}
        <div className="cr-card">
          <div className="cr-label" style={{ marginBottom: 12 }}>Add operator</div>

          <label className="cr-label" htmlFor="op-name">Full name</label>
          <input id="op-name" className="cr-input" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 12 }} />

          <label className="cr-label" htmlFor="op-email">Email</label>
          <input id="op-email" className="cr-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 12 }} />

          <label className="cr-label" htmlFor="op-pass">Temporary password (min 12 chars)</label>
          <input id="op-pass" className="cr-input" type="text" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginBottom: 14 }} />

          <div className="cr-label">Permissions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
            {PERMS.map((p) => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={perms.includes(p.id)}
                  onChange={() => setPerms(togglePerm(perms, p.id))}
                  style={{ accentColor: 'var(--lime)' }}
                />
                {p.label}
              </label>
            ))}
          </div>

          <button className="cr-btn" style={{ width: '100%' }} onClick={create}
            disabled={busy || !name || !email || password.length < 12}>
            {busy ? 'Creating…' : 'Create operator'}
          </button>
          <p className="cr-help" style={{ marginTop: 10 }}>
            Share the temporary password over a secure channel and ask them to change it. Every change here is written to the audit trail.
          </p>
        </div>
      </div>
    </div>
  );
}
