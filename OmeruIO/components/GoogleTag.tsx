'use client';

import Script from 'next/script';
import { GA_ID, GADS_ID } from '@/lib/gtag';

export default function GoogleTag() {
  const primaryId = GA_ID || GADS_ID;
  if (!primaryId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${primaryId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());

        gtag('consent', 'default', {
          ad_storage:           'denied',
          ad_user_data:         'denied',
          ad_personalization:   'denied',
          analytics_storage:    'denied',
          wait_for_update:      500,
        });

        ${GA_ID   ? `gtag('config', '${GA_ID}',   { send_page_view: true });` : ''}
        ${GADS_ID ? `gtag('config', '${GADS_ID}');` : ''}
      `}</Script>
    </>
  );
}
