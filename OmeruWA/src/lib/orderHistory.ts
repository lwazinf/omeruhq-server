import { db } from './db';

// Fire-and-forget — append a status transition row without blocking the caller
export function logOrderStatusChange(
  orderId:        string,
  fromStatus:     string | null,
  toStatus:       string,
  changedByWaId?: string,
  reason?:        string,
): void {
  db.orderStatusHistory.create({
    data: {
      order_id:         orderId,
      from_status:      fromStatus,
      to_status:        toStatus,
      changed_by_wa_id: changedByWaId,
      reason,
    },
  }).catch(err => console.error('[orderHistory]', orderId, err.message));
}
