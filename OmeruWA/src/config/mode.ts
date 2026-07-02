// ── Platform mode flags ──────────────────────────────────────────────────────
// DEMO_MODE: when "true", the platform runs as a sales demo — customers can
// only discover the demo Stitch store (DEMO_STORE_HANDLE), SwitchOmeru offers
// it to everyone, and it behaves exactly like a live store (Stitch test
// credentials recommended). When "false" (live), the demo store is hidden
// from browse/discovery entirely.
//
// MERCHANT_ACTIONS_VIA_HQ: when "true", WhatsApp is notifications-only for
// merchants — dashboards and management actions redirect to Omeru HQ.
// Onboarding still completes on WhatsApp so new merchants aren't stranded.

export const isDemoMode = (): boolean =>
    (process.env.DEMO_MODE || 'false').toLowerCase() === 'true';

export const demoStoreHandle = (): string =>
    (process.env.DEMO_STORE_HANDLE || 'stitch').toLowerCase();

export const merchantActionsViaHQ = (): boolean =>
    (process.env.MERCHANT_ACTIONS_VIA_HQ || 'true').toLowerCase() === 'true';

export const hqUrl = (): string =>
    process.env.HQ_URL || 'https://hq.omeru.io';

/**
 * Prisma where-fragment applied to every customer-facing store discovery
 * query. Demo mode → only the demo store exists; live mode → the demo store
 * never leaks into browse.
 */
export const storeVisibilityFilter = (): Record<string, unknown> =>
    isDemoMode() ? { handle: demoStoreHandle() } : { handle: { not: demoStoreHandle() } };
