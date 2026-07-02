'use client';

import { useState, useRef } from 'react';

interface Props {
  currentUrl?: string | null;
  name?: string;
}

export default function ProductImageUpload({ currentUrl, name = 'image_url' }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [finalUrl, setFinalUrl] = useState<string>(currentUrl ?? '');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });
      const blob = await res.json();
      setFinalUrl(blob.url);
      setPreview(blob.url);
      setShowUrlInput(false);
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreview(null);
    setFinalUrl('REMOVE');
    setUrlDraft('');
    setShowUrlInput(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function applyUrl() {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    setFinalUrl(trimmed);
    setPreview(trimmed);
    setShowUrlInput(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 6,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  };

  return (
    <div>
      <label style={labelStyle}>Image</label>

      <input type="hidden" name={name} value={finalUrl} />

      {preview ? (
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', width: '100%', aspectRatio: '16/9', background: 'rgba(255,255,255,0.04)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.18s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
          >
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <button type="button" onClick={() => inputRef.current?.click()} style={overlayBtn}>
                Replace
              </button>
              <button type="button" onClick={() => { setShowUrlInput(true); setUrlDraft(''); }} style={overlayBtn}>
                URL
              </button>
              <button type="button" onClick={handleRemove} style={{ ...overlayBtn, color: '#f87171', background: 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.35)' }}>
                Remove
              </button>
            </div>
          </div>
          {uploading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Uploading…</div>
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !showUrlInput && inputRef.current?.click()}
          style={{
            border: '1.5px dashed rgba(255,255,255,0.12)',
            borderRadius: 12,
            padding: '36px 20px',
            textAlign: 'center',
            cursor: showUrlInput ? 'default' : 'pointer',
            transition: 'border-color 0.18s, background 0.18s',
            background: 'rgba(255,255,255,0.02)',
          }}
          onMouseEnter={e => { if (!showUrlInput) { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(200,241,53,0.35)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(200,241,53,0.03)'; } }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; }}
        >
          {uploading ? (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Uploading…</div>
          ) : showUrlInput ? (
            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                autoFocus
                type="url"
                placeholder="https://…"
                value={urlDraft}
                onChange={e => setUrlDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyUrl(); } if (e.key === 'Escape') setShowUrlInput(false); }}
                className="input"
                style={{ flex: 1, fontSize: 13 }}
              />
              <button type="button" onClick={applyUrl} className="btn-lime" style={{ padding: '8px 14px', fontSize: 12, flexShrink: 0 }}>
                Apply
              </button>
              <button type="button" onClick={() => setShowUrlInput(false)} className="btn-ghost" style={{ padding: '8px 10px', fontSize: 12, flexShrink: 0 }}>
                ✕
              </button>
            </div>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 10, opacity: 0.3 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="1.5"/>
                <path d="M3 15l5-5 4 4 4-5 5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                Click or drag to upload
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>
                JPG, PNG, WebP · max 4 MB
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setShowUrlInput(true); }}
                style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '4px 12px', cursor: 'pointer' }}
              >
                Or paste a URL
              </button>
            </>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleChange} style={{ display: 'none' }} />
    </div>
  );
}

const overlayBtn: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 100,
  background: 'rgba(255,255,255,0.12)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.25)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'white',
  cursor: 'pointer',
};
