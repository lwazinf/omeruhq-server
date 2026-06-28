'use client';

import { useEffect } from 'react';
import { openInviteModal } from '@/components/InviteModal';

export default function StartPage() {
  useEffect(() => {
    const t = setTimeout(openInviteModal, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--black)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.15)', letterSpacing: '-0.02em', marginBottom: 12 }}>omeru</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', fontWeight: 300 }}>Opening application…</p>
      </div>
    </div>
  );
}
