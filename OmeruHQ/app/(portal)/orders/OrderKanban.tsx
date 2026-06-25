'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { advanceOrderAction, cancelOrderAction } from './actions';

type OrderItem = { product: { name: string } | null; quantity: number; price: number };
type Order = { id: string; total: number; status: string; createdAt: Date; order_items: OrderItem[] };

function elapsed(d: Date) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
function formatZAR(n: number) { return `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`; }

export default function OrderKanban({ orders }: { orders: Order[] }) {
  const t = useTranslations('Orders');
  const [, startTransition] = useTransition();

  const COLS = [
    { key: 'PENDING',          label: t('pending'),    next: undefined,           nextLabel: undefined },
    { key: 'PAID',             label: t('toPrepare'),  next: 'READY_FOR_PICKUP', nextLabel: t('advance') },
    { key: 'READY_FOR_PICKUP', label: t('ready'),      next: 'COMPLETED',         nextLabel: t('done') },
    { key: 'COMPLETED',        label: t('done'),       next: undefined,           nextLabel: undefined },
  ];

  function advance(orderId: string, next: string) {
    const fd = new FormData(); fd.set('order_id', orderId); fd.set('next_status', next);
    startTransition(() => advanceOrderAction(fd));
  }
  function cancel(orderId: string) {
    if (!window.confirm(t('cancelConfirm'))) return;
    const fd = new FormData(); fd.set('order_id', orderId);
    startTransition(() => cancelOrderAction(fd));
  }

  return (
    <div className="kanban-outer">
      <div className="kanban-inner" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignItems: 'start' }}>
      {COLS.map(col => {
        const colOrders = orders.filter(o => o.status === col.key);
        return (
          <div key={col.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ height: 3, width: 18, borderRadius: 2, background: col.key === 'PAID' ? 'var(--lime)' : col.key === 'COMPLETED' ? 'var(--lime-muted)' : 'var(--warm-gray)' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mid-gray)' }}>
                {col.label}
              </span>
              {colOrders.length > 0 && (
                <span style={{ background: col.key === 'PAID' ? 'var(--lime)' : 'var(--warm-gray)', color: col.key === 'PAID' ? 'var(--black)' : 'var(--mid-gray)', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100 }}>
                  {colOrders.length}
                </span>
              )}
            </div>

            {colOrders.length === 0 ? (
              <div style={{ background: 'rgba(0,0,0,0.025)', borderRadius: 14, padding: '18px 16px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(0,0,0,0.2)' }}>
                {t('noOrders')}
              </div>
            ) : (
              colOrders.map(o => (
                <div key={o.id} className="card" style={{ padding: '14px 16px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)', letterSpacing: '0.04em' }}>#{o.id.slice(-6)}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(0,0,0,0.35)' }}>{elapsed(o.createdAt)}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 8 }}>{formatZAR(o.total)}</div>
                  <div style={{ marginBottom: 12 }}>
                    {o.order_items.slice(0, 3).map((item, i) => (
                      <div key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#555', lineHeight: 1.4 }}>
                        {item.quantity}× {item.product?.name ?? 'Item'}
                      </div>
                    ))}
                    {o.order_items.length > 3 && (
                      <div style={{ fontSize: 11, color: 'var(--mid-gray)' }}>+{o.order_items.length - 3} more</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {col.next && (
                      <button
                        onClick={() => advance(o.id, col.next!)}
                        className="btn-lime"
                        style={{ fontSize: 11, padding: '6px 12px', flex: 1, justifyContent: 'center' }}
                      >
                        {col.nextLabel}
                      </button>
                    )}
                    {col.key !== 'COMPLETED' && (
                      <button
                        onClick={() => cancel(o.id)}
                        className="btn-ghost"
                        style={{ fontSize: 11, padding: '6px 10px', color: '#c0392b' }}
                        title={t('cancel')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        );
      })}
      </div>
      <style>{`
        .kanban-outer { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .kanban-inner { min-width: 600px; }
        @media (max-width: 768px) {
          .kanban-inner { grid-template-columns: repeat(2, 1fr) !important; min-width: 0; }
        }
        @media (max-width: 480px) {
          .kanban-inner { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
