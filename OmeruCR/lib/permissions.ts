// Permission catalogue for Control Room operators.
// The root operator (first registered account) implicitly holds every
// permission and cannot be edited or disabled.

export const PERMISSIONS = {
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',       // dashboard + stats
  BROADCAST_CUSTOMERS: 'BROADCAST_CUSTOMERS',
  BROADCAST_MERCHANTS: 'BROADCAST_MERCHANTS',
  MANAGE_OPERATORS: 'MANAGE_OPERATORS',   // create/edit/disable operators
  VIEW_AUDIT: 'VIEW_AUDIT',               // read the audit trail
  FRAUD_REPORTS: 'FRAUD_REPORTS',         // fraud signals + anomaly reports
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export const PERMISSION_LABELS: Record<Permission, string> = {
  VIEW_ANALYTICS: 'View analytics',
  BROADCAST_CUSTOMERS: 'Broadcast to customers',
  BROADCAST_MERCHANTS: 'Broadcast to merchants',
  MANAGE_OPERATORS: 'Manage operators',
  VIEW_AUDIT: 'View audit trail',
  FRAUD_REPORTS: 'Fraud & anomaly reports',
};

export function has(
  session: { is_root: boolean; permissions: string[] },
  perm: Permission,
): boolean {
  return session.is_root || session.permissions.includes(perm);
}
