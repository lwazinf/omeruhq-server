export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID;

type GtagFn = (...args: unknown[]) => void;

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { gtag?: GtagFn; dataLayer?: unknown[] };
  if (typeof w.gtag === 'function') w.gtag(...args);
}

export function trackPageView(url: string) {
  if (GA_ID) gtag('event', 'page_view', { page_path: url, send_to: GA_ID });
}

export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  gtag('event', eventName, params);
}

export function trackConversion(label?: string) {
  if (!GADS_ID) return;
  gtag('event', 'conversion', {
    send_to: label ? `${GADS_ID}/${label}` : GADS_ID,
  });
}
