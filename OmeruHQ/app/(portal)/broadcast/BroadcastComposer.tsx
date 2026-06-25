'use client';

import { useActionState, useState } from 'react';
import { sendBroadcastAction, type BroadcastState } from './actions';

interface Props {
  customerCount: number;
}

const MAX = 500;
const MIN = 10;

export default function BroadcastComposer({ customerCount }: Props) {
  const [state, formAction, isPending] = useActionState<BroadcastState, FormData>(
    sendBroadcastAction,
    null
  );
  const [charCount, setCharCount] = useState(0);

  const hasResult = state && (state.sent !== undefined || state.error);
  const isSuccess = hasResult && state?.sent !== undefined && !state?.error;

  return (
    <div className="card" style={{ padding: '24px 28px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.01em' }}>
        Send broadcast
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginBottom: 20 }}>
        Your message will be sent to all {customerCount} opted-in customer{customerCount !== 1 ? 's' : ''} via WhatsApp.
      </div>

      {isSuccess ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '20px 24px', borderRadius: 12,
          background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.2)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(200,241,53,0.15)', border: '1px solid rgba(200,241,53,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l4 4 6-7" stroke="var(--lime)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--lime)' }}>
              Sent to {state!.sent} customer{state!.sent !== 1 ? 's' : ''}
            </div>
            {(state!.failed ?? 0) > 0 && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {state!.failed} message{state!.failed !== 1 ? 's' : ''} failed to deliver
              </div>
            )}
          </div>
        </div>
      ) : (
        <form action={formAction}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <textarea
              name="message"
              required
              maxLength={MAX}
              rows={5}
              className="input"
              placeholder="Type your broadcast message here…"
              onChange={(e) => setCharCount(e.target.value.length)}
              style={{ width: '100%', resize: 'vertical', minHeight: 120, paddingBottom: 28 }}
            />
            <div style={{
              position: 'absolute', bottom: 10, right: 12,
              fontFamily: 'var(--font-body)', fontSize: 11,
              color: charCount > MAX - 50 ? (charCount >= MAX ? '#ef4444' : '#f5c842') : 'rgba(255,255,255,0.3)',
              pointerEvents: 'none',
            }}>
              {charCount}/{MAX}
            </div>
          </div>

          {state?.error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, marginBottom: 14,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              fontFamily: 'var(--font-body)', fontSize: 13, color: '#ef4444',
            }}>
              {state.error}
            </div>
          )}

          {charCount > 0 && charCount < MIN && (
            <div style={{
              padding: '8px 12px', borderRadius: 8, marginBottom: 12,
              fontFamily: 'var(--font-body)', fontSize: 12, color: '#f5c842',
            }}>
              Message must be at least {MIN} characters
            </div>
          )}

          <button
            type="submit"
            className="btn-lime"
            disabled={isPending || customerCount === 0}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', fontSize: 13,
              opacity: customerCount === 0 ? 0.5 : 1,
            }}
          >
            {isPending ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5"/>
                  <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Sending…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M13 3L3 7H2a1 1 0 000 2h1l10 4V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                </svg>
                Send to {customerCount} customer{customerCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
