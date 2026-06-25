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

  function openAdd() {
    setEditingService(null);
    setShowForm(true);
  }

  function openEdit(service: Service) {
    setEditingService(service);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingService(null);
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
          Services
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400, color: 'var(--mid-gray)', marginLeft: 8 }}>
            {services.length} total
          </span>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="btn-lime"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', fontSize: 13 }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Add service
          </button>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <ServiceForm service={editingService} onClose={closeForm} />
      )}

      {/* Services grid */}
      {services.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
            No services yet
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginBottom: 20 }}>
            Add your first service to start accepting bookings.
          </div>
          <button onClick={openAdd} className="btn-lime" style={{ padding: '10px 24px', fontSize: 13 }}>
            Add service
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {services.map((s) => (
            <div
              key={s.id}
              className="card"
              style={{ padding: '18px 20px', opacity: s.is_active ? 1 : 0.55, transition: 'opacity 0.2s' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', flex: 1 }}>
                  {s.name}
                </div>
                {/* Active toggle */}
                <form action={toggleServiceAction} style={{ flexShrink: 0 }}>
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    title={s.is_active ? 'Deactivate' : 'Activate'}
                    style={{
                      width: 36, height: 20, borderRadius: 100, border: 'none', cursor: 'pointer',
                      background: s.is_active ? 'var(--lime)' : 'var(--warm-gray)',
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 2, left: s.is_active ? 18 : 2,
                      width: 16, height: 16, borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </form>
              </div>

              {s.description && (
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)',
                  marginBottom: 12, lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {s.description}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800 }}>
                  R {s.price.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                </span>
                <span className="pill" style={{ fontSize: 11, padding: '3px 8px' }}>
                  {s.duration_min} min
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)' }}>
                  {s._count.bookings} booking{s._count.bookings !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
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
                    style={{ fontSize: 12, padding: '6px 14px', color: 'rgba(239,68,68,0.7)' }}
                    onClick={(e) => {
                      if (!confirm('Delete this service? This cannot be undone.')) e.preventDefault();
                    }}
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
