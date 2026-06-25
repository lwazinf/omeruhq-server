'use client';

import { useRef, useTransition } from 'react';
import { addServiceAction, updateServiceAction } from './actions';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_min: number;
}

interface Props {
  service?: Service | null;
  onClose: () => void;
}

export default function ServiceForm({ service, onClose }: Props) {
  const isEdit = !!service;
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      if (isEdit) {
        await updateServiceAction(fd);
      } else {
        await addServiceAction(fd);
      }
      onClose();
    });
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 5,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '24px 24px 20px',
      marginBottom: 24,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
          {isEdit ? 'Edit service' : 'Add new service'}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', fontSize: 20, lineHeight: 1, padding: 4,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <form ref={formRef} onSubmit={handleSubmit}>
        {isEdit && <input type="hidden" name="id" value={service.id} />}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Service name *</label>
            <input
              className="input"
              name="name"
              required
              defaultValue={service?.name ?? ''}
              placeholder="e.g. Haircut"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Price (ZAR)</label>
            <input
              className="input"
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={service?.price ?? ''}
              placeholder="0.00"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Duration (min)</label>
            <input
              className="input"
              name="duration_min"
              type="number"
              min="5"
              step="5"
              defaultValue={service?.duration_min ?? 60}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              className="input"
              name="description"
              defaultValue={service?.description ?? ''}
              rows={2}
              placeholder="Brief description of this service..."
              style={{ width: '100%', resize: 'vertical', minHeight: 64 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="submit"
            className="btn-lime"
            disabled={isPending}
            style={{ padding: '9px 22px', fontSize: 13 }}
          >
            {isPending ? 'Saving…' : isEdit ? 'Update service' : 'Add service'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            style={{ padding: '9px 16px', fontSize: 13 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
