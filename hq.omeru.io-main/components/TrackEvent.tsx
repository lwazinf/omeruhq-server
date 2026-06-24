'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/gtag';

type Props = {
  event: string;
  params?: Record<string, unknown>;
};

/** Drop into any RSC to fire a GA4 event on first mount. Zero visible output. */
export default function TrackEvent({ event, params }: Props) {
  useEffect(() => {
    trackEvent(event, params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
