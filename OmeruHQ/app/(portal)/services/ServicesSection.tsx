'use client';

import { useState } from 'react';
import ServiceForm from './ServiceForm';
import { toggleServiceAction, deleteServiceAction } from './actions';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_min: number;
  is_active: boolean;
  _count: { bookings: number };
}

interface Props {
  services: Service[];
}

export default function ServicesSection({ services }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  function openAdd() { setEditingService(null); setShowForm(true); }
  function openEdit(s: Service) { setEditingService(s); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditingService(null); }

  const activeCount = services.filter(s => s.is_active).length;

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', color: 'white', lineHeight: 1, margin: 0 }}>
            Services
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
            {activeCount} bookable service{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="btn-lime"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', fontSize: 13, whiteSpace: 'nowrap' }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Add service
          </button>
        )}
      </div>

      {/* ── Inline form ── */}
      {showForm && <ServiceForm service={editingService} onClose={closeForm} />}

      {/* ── Empty state ── */}
      {services.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '80px 0', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, marginBottom: 8 }}>No services yet</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>
            Add your first service to start accepting bookings.
          </div>
          <button onClick={openAdd} className="btn-lime" style={{ padding: '10px 24px', fontSize: 13 }}>
            Add service
          </button>
        </div>
      )}

      {/* ── Service cards ── */}
      {services.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {services.map(s => (
            <div
              key={s.id}
              className="card"
              onMouseEnter={() => setHoveredId(s.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ padding: '18px 20px 16px', opacity: s.is_active ? 1 : 0.6, transition: 'opacity 0.2s' }}
            >
              {/* Name + Active badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', flex: 1, lineHeight: 1.3 }}>
                  {s.name}
                </div>
                <form action={toggleServiceAction} style={{ flexShrink: 0, marginTop: 2 }}>
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    title={s.is_active ? 'Click to deactivate' : 'Click to activate'}
                    style={{
                      padding: '3px 10px', borderRadius: 100, cursor: 'pointer',
                      border: `1px solid ${s.is_active ? 'rgba(200,241,53,0.35)' : 'rgba(255,255,255,0.1)'}`,
                      background: s.is_active ? 'rgba(200,241,53,0.12)' : 'rgba(255,255,255,0.05)',
                      color: s.is_active ? 'var(--lime)' : 'rgba(255,255,255,0.3)',
                      fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}
                  >
                    {s.is_active ? 'Active' : 'Inactive'}
                  </button>
                </form>
              </div>

              {/* Description */}
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.38)',
                lineHeight: 1.55, marginBottom: 16, minHeight: 36,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {s.description ?? ''}
              </div>

              {/* Price + meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
                  R {s.price.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                </span>
                <span className="pill" style={{ fontSize: 11, padding: '3px 9px' }}>
                  {s.duration_min} min
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {s._count.bookings} booking{s._count.bookings !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Edit / Delete — slide in on hover */}
              <div style={{
                display: 'flex', gap: 6, marginTop: 14, paddingTop: 12,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                opacity: hoveredId === s.id ? 1 : 0,
                transform: hoveredId === s.id ? 'translateY(0)' : 'translateY(4px)',
                transition: 'opacity 0.18s, transform 0.18s',
                pointerEvents: hoveredId === s.id ? 'auto' : 'none',
              }}>
                <button
                  onClick={() => openEdit(s)}
                  className="btn-outline"
                  style={{ fontSize: 12, padding: '6px 14px', flex: 1 }}
                >
                  Edit
                </button>
                <form action={deleteServiceAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: '6px 12px', color: 'rgba(239,68,68,0.6)' }}
                    onClick={e => { if (!confirm('Delete this service? This cannot be undone.')) e.preventDefault(); }}
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
