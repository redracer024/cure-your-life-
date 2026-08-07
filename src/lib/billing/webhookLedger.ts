export const WEBHOOK_PROCESSING_LEASE_MS = 10 * 60 * 1000;

export type WebhookLedgerStatus = 'processing' | 'processed' | 'failed';

export interface WebhookLedgerRowState {
  status: WebhookLedgerStatus;
  processing_started_at: string | null;
}

export type WebhookLedgerClaimDecision =
  | 'already-processed'
  | 'active-processing'
  | 'reclaim-stale-processing'
  | 'reclaim-failed';

export function isWebhookLeaseStale(
  processingStartedAt: string | null,
  nowMs: number,
  leaseMs: number = WEBHOOK_PROCESSING_LEASE_MS,
): boolean {
  if (!processingStartedAt) return true;
  const startedAtMs = Date.parse(processingStartedAt);
  if (!Number.isFinite(startedAtMs)) return true;
  return nowMs - startedAtMs >= leaseMs;
}

export function getWebhookLedgerClaimDecision(
  row: WebhookLedgerRowState,
  nowMs: number,
  leaseMs: number = WEBHOOK_PROCESSING_LEASE_MS,
): WebhookLedgerClaimDecision {
  if (row.status === 'processed') {
    return 'already-processed';
  }

  if (row.status === 'failed') {
    return 'reclaim-failed';
  }

  if (isWebhookLeaseStale(row.processing_started_at, nowMs, leaseMs)) {
    return 'reclaim-stale-processing';
  }

  return 'active-processing';
}
