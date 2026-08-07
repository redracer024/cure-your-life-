const EXTERNALLY_BILLABLE_STATUSES = new Set([
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'paused',
  'incomplete',
]);

const TERMINAL_STATUSES = new Set([
  'canceled',
  'incomplete_expired',
]);

export function normalizeStripeSubscriptionStatus(status: string | null | undefined): string {
  return String(status || '').toLowerCase();
}

export function isExternallyBillableStripeStatus(status: string | null | undefined): boolean {
  return EXTERNALLY_BILLABLE_STATUSES.has(normalizeStripeSubscriptionStatus(status));
}

export function isTerminalStripeSubscriptionStatus(status: string | null | undefined): boolean {
  return TERMINAL_STATUSES.has(normalizeStripeSubscriptionStatus(status));
}
