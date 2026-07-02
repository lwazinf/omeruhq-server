/**
 * Storefront helpers shared by the public merchant pages.
 */

/** The platform WhatsApp number customers chat with (digits only). */
export const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER || '27705736794';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://omeru.io';

/** Opens the bot at the merchant's store homepage. */
export const waStoreLink = (handle: string): string =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`@${handle}`)}`;

/** Opens the bot directly on a specific product — skips store browsing. */
export const waProductLink = (productId: string): string =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`prod_${productId}`)}`;

/** Opens the bot on a specific service booking flow — skips the services list. */
export const waServiceLink = (serviceId: string): string =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`cbk_svc_${serviceId}`)}`;

/** Opens the bot on the merchant's full services list. */
export const waServicesListLink = (merchantId: string): string =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`c_book_${merchantId}`)}`;

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
