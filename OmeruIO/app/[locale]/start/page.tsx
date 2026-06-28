'use client';

import { useEffect } from 'react';
import { openInviteModal } from '@/components/InviteModal';

export default function StartPage() {
  useEffect(() => {
    // Defer to next macrotask — by then all sibling useEffects in the root layout
    // (including InviteModal's event listener registration) have completed.
    const t = setTimeout(openInviteModal, 0);
    return () => clearTimeout(t);
  }, []);

  // Dark background matches the modal backdrop — no visible flash
  return <div style={{ minHeight: '100vh', background: 'var(--black)' }} />;
}
