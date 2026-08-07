export interface SubscriptionEntitlementState {
  status?: string | null;
  current_period_end?: string | null;
}

const ENTITLED_STATUSES = new Set(['active', 'trialing']);

function toPeriodEndMs(periodEnd: string | null | undefined): number | null {
  if (!periodEnd) return null;
  const ms = Date.parse(periodEnd);
  return Number.isFinite(ms) ? ms : null;
}

export function isPremiumEntitled(
  subscription: SubscriptionEntitlementState | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!subscription) return false;

  const status = String(subscription.status || '').toLowerCase();
  if (!ENTITLED_STATUSES.has(status)) return false;

  const periodEndMs = toPeriodEndMs(subscription.current_period_end);
  if (periodEndMs === null) return false;

  return periodEndMs > nowMs;
}
