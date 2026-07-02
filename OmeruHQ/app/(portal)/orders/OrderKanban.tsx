'use client';

import { useTransition } from 'react';
import { advanceOrderAction } from './actions';

type Order = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  customerName: string;
  items: string;
};

type ColConfig = {
  key: string;
  label: string;
  color: string;
  next: string | undefined;
  nextLabel: string | undefined;
};

const COLS: ColConfig[] = [
  { key: 'PENDING',          label: 'PENDING',    color: 'var(--lime)',             next: 'PAID',             nextLabel: 'Accept' },
  { key: 'PAID',             label: 'TO PREPARE', color: '#f5c842',                 next: 'READY_FOR_PICKUP', nextLabel: 'Mark ready' },
  { key: 'READY_FOR_PICKUP', label: 'READY',      color: 'rgba(255,255,255,0.55)',  next: 'COMPLETED',        nextLabel: 'Complete' },
  { key: 'COMPLETED',        label: 'DONE',       color: '#4ade80',                 next: undefined,          nextLabel: undefined },
];

function elapsed(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function formatZAR(n: number) {
  return `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function DoneCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6.3" stroke="#4ade80" strokeWidth="1.2" />
      <path d="M4.2 7l2 2 3.6-3.6" stroke="#4ade80" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function OrderKanban({ orders }: { orders: Order[] }) {
  const [, startTransition] = useTransition();

  function advance(orderId: string, next: string) {
    const fd = new FormData();
    fd.set('order_id', orderId);
    fd.set('next_status', next);
    startTransition(() => { void advanceOrderAction(fd); });
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16, minWidth: 720, alignItems: 'start',
      }}>
        {COLS.map(col => {
          const colOrders = orders.filter(o => o.status === col.key);
          const done = col.key === 'COMPLETED';

          return (
            <div key={col.key}>
              {/* ── Column header ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: col.color, flexShrink: 0, display: 'inline-block',
                }} />
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: col.color,
                }}>
                  {col.label}
                </span>
                {colOrders.length > 0 && (
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                    color: col.color, opacity: 0.75,
                  }}>
                    {colOrders.length}
                  </span>
                )}
              </div>

              {/* ── Empty state ── */}
              {colOrders.length === 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 10, padding: '22px 16px', textAlign: 'center',
                  fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.15)',
                }}>
                  Empty
                </div>
              )}

              {/* ── Order cards ── */}
              {colOrders.map(o => (
                <div
                  key={o.id}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    marginBottom: 8,
                  }}
                >
                  {/* Top row: #ID · time */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.04em' }}>
                      #{o.id.slice(-4).toUpperCase()}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: done ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>
                      {done ? 'done' : elapsed(o.createdAt)}
                    </span>
                  </div>

                  {/* Customer name */}
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 3, lineHeight: 1.3 }}>
                    {o.customerName}
                  </div>

                  {/* Items */}
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.4)',
                    marginBottom: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {o.items}
                  </div>

                  {/* Bottom row: Amount · Action */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--lime)', letterSpacing: '-0.01em' }}>
                      {formatZAR(o.total)}
                    </span>

                    {done ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <DoneCheck />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#4ade80' }}>Done</span>
                      </div>
                    ) : col.next ? (
                      <button
                        onClick={() => advance(o.id, col.next!)}
                        style={{
                          fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
                          color: 'rgba(255,255,255,0.45)',
                          background: 'none',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 6, padding: '4px 10px',
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        {col.nextLabel} →
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
