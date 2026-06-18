/**
 * Storefront helpers shared by the public merchant pages.
 */

/** The platform WhatsApp number customers chat with (digits only). */
export const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER || '27750656348';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://omeru.io';

/**
 * Deep link that opens the Omeru WhatsApp bot with the merchant's @handle
 * pre-filled as the first message — one tap and the customer is inside the
 * merchant's WhatsApp store. This is the storefront's single call to action.
 */
export const waStoreLink = (handle: string): string =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`@${handle}`)}`;

/**
 * Only fully-qualified https URLs render on the web. Legacy rows may still
 * hold expired WhatsApp media IDs — those get the branded placeholder instead
 * of a broken image.
 */
export const displayableImage = (url: string | null | undefined): string | null =>
  url && url.startsWith('https://') ? url : null;

export const formatZAR = (amount: number): string =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);

export const formatDuration = (min: number): string =>
  min < 60 ? `${min} min` : min % 60 === 0 ? `${min / 60} hr` : `${Math.floor(min / 60)} hr ${min % 60} min`;
