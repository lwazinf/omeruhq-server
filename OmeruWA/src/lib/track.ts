import { db } from './db';

export type PlatformEventType =
  | 'product_view'
  | 'store_visit'
  | 'cart_add'
  | 'cart_remove'
  | 'checkout_start'
  | 'menu_browse'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'order_placed'
  | 'search';

interface TrackOpts {
  session_wa_id?:   string;
  merchant_handle?: string;
  product_id?:      string;
  search_query?:    string;
  metadata?:        Record<string, unknown>;
}

// Fire-and-forget — never blocks the caller, never throws
export function track(event_type: PlatformEventType, opts: TrackOpts = {}): void {
  db.platformEvent.create({
    data: {
      event_type,
      session_wa_id:   opts.session_wa_id,
      merchant_handle: opts.merchant_handle,
      product_id:      opts.product_id,
      search_query:    opts.search_query,
      metadata:        opts.metadata as any,
    },
  }).catch(err => console.error('[track]', event_type, err.message));
}
