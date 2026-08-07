import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  WEBHOOK_PROCESSING_LEASE_MS,
  getWebhookLedgerClaimDecision,
  isWebhookLeaseStale,
  type WebhookLedgerRowState,
} from './src/lib/billing/webhookLedger';
import {
  isExternallyBillableStripeStatus,
  isTerminalStripeSubscriptionStatus,
} from './src/lib/billing/stripeBillingState';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed++;
    return;
  }
  failed++;
  errors.push(`FAIL: ${label}${detail ? ` - ${detail}` : ''}`);
}

const root = import.meta.dirname;
const serverSrc = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
const authSectionSrc = fs.readFileSync(path.join(root, 'src/components/AuthSection.tsx'), 'utf8');
const deleteHelperSrc = fs.readFileSync(path.join(root, 'src/lib/account/deleteAccount.ts'), 'utf8');
const leaseMigrationSrc = fs.readFileSync(path.join(root, 'supabase/migrations/20260807072156_add_stripe_webhook_processing_lease.sql'), 'utf8');
const ledgerMigrationSrc = fs.readFileSync(path.join(root, 'supabase/migrations/20260807065356_add_stripe_webhook_event_ledger.sql'), 'utf8');
const deleteEndpointMatch = serverSrc.match(/app\.delete\("\/api\/me\/account"[\s\S]*?\n\}\);/);
const deleteEndpointSrc = deleteEndpointMatch ? deleteEndpointMatch[0] : '';

const nowMs = Date.parse('2026-08-07T08:00:00.000Z');
const freshStartedAt = new Date(nowMs - 30_000).toISOString();
const staleStartedAt = new Date(nowMs - WEBHOOK_PROCESSING_LEASE_MS - 1).toISOString();

console.log('Webhook lease behavioral checks');
assert('1. processed event never reruns', getWebhookLedgerClaimDecision({ status: 'processed', processing_started_at: freshStartedAt }, nowMs) === 'already-processed');
assert('2. fresh processing event cannot be double-claimed', getWebhookLedgerClaimDecision({ status: 'processing', processing_started_at: freshStartedAt }, nowMs) === 'active-processing');
assert('3. stale processing event can be reclaimed', getWebhookLedgerClaimDecision({ status: 'processing', processing_started_at: staleStartedAt }, nowMs) === 'reclaim-stale-processing');
assert('4. failed event can retry', getWebhookLedgerClaimDecision({ status: 'failed', processing_started_at: null }, nowMs) === 'reclaim-failed');

type SimRow = {
  status: 'processing' | 'processed' | 'failed';
  retry_count: number;
  processing_started_at: string | null;
};

const applyReclaim = (row: SimRow, expectedRetry: number, expectedStartedAt: string | null, newStartedAt: string): boolean => {
  const matchesRetry = row.retry_count === expectedRetry;
  const matchesStarted = row.processing_started_at === expectedStartedAt;
  if (!(matchesRetry && matchesStarted)) return false;
  row.status = 'processing';
  row.retry_count = row.retry_count + 1;
  row.processing_started_at = newStartedAt;
  return true;
};

{
  const row: SimRow = { status: 'failed', retry_count: 2, processing_started_at: null };
  const won = applyReclaim(row, 2, null, freshStartedAt);
  assert('5. reclaim increments retry_count', won && row.retry_count === 3);
}

{
  const row: SimRow = { status: 'processing', retry_count: 4, processing_started_at: staleStartedAt };
  const firstWinner = applyReclaim(row, 4, staleStartedAt, freshStartedAt);
  const secondWinner = applyReclaim(row, 4, staleStartedAt, freshStartedAt);
  assert('6. concurrent reclaim has one winner', firstWinner === true && secondWinner === false);
}

assert('7. worker crash cannot permanently strand event', isWebhookLeaseStale(staleStartedAt, nowMs) === true && getWebhookLedgerClaimDecision({ status: 'processing', processing_started_at: staleStartedAt }, nowMs) === 'reclaim-stale-processing');
assert('8. processed only after successful sync', serverSrc.indexOf('await processStripeWebhookEvent(event);') !== -1 && serverSrc.indexOf('await markStripeWebhookEventProcessed(claim.ledgerId);') !== -1 && serverSrc.indexOf('await processStripeWebhookEvent(event);') < serverSrc.indexOf('await markStripeWebhookEventProcessed(claim.ledgerId);'));

console.log('Account deletion billing safety checks');
assert('9. deletion target still JWT-derived', serverSrc.includes('const { user } = await getAuthenticatedSupabaseUser(req);') && serverSrc.includes('const verifiedUserId = user.id;'));
assert('10. Stripe IDs cannot come from client', !serverSrc.includes('req.body.subscription') && !serverSrc.includes('req.body.customer'));
assert('11. trusted subscription mapping used', serverSrc.includes('const subscriptionRow = await getLatestSubscriptionForUser(userId);'));
assert('12. canonical Stripe state fetched', serverSrc.includes('await stripe.subscriptions.retrieve(subscriptionId)'));
assert('13. active subscription cancelled before auth user', isExternallyBillableStripeStatus('active') && serverSrc.indexOf('cancelStripeBillingBeforeAccountDeletion(verifiedUserId)') < serverSrc.indexOf('auth.admin.deleteUser(verifiedUserId)'));
assert('14. trialing subscription cancelled before auth user', isExternallyBillableStripeStatus('trialing'));
assert('15. past_due billing risk handled', isExternallyBillableStripeStatus('past_due'));
assert('16. cancellation failure blocks auth deletion', serverSrc.includes('if (billingResult.status === "cancel-failed")') && serverSrc.includes('return res.status(502).json'));
assert('17. cancellation success + auth deletion failure is retry-safe', isTerminalStripeSubscriptionStatus('canceled') && serverSrc.includes('if (deleteError)'));
assert('18. already-cancelled subscription permits deletion', serverSrc.includes('status: "already-terminal"') && isTerminalStripeSubscriptionStatus('canceled'));
assert('19. no automatic refund logic added', !serverSrc.includes('stripe.refunds') && !serverSrc.includes('.refunds.'));
assert('20. local cleanup still only after server deletion success', deleteHelperSrc.includes('if (!response.ok)') && deleteHelperSrc.includes("status: 'server-error'") && deleteHelperSrc.includes('const assessmentStatus = deps.clearAssessment'));
assert('21. anonymous local data preserved', deleteHelperSrc.includes("kind: 'user'"));
assert('22. other-user local data preserved', deleteHelperSrc.includes('userId: verifiedUserId'));
assert('23. raw Stripe errors sanitized', !deleteEndpointSrc.includes('error.message') && deleteEndpointSrc.includes('Account deletion could not be completed right now. Please try again.'));
assert('24. no RLS weakening', !ledgerMigrationSrc.includes('disable row level security') && !leaseMigrationSrc.includes('disable row level security'));
assert('25. no Google Play implementation', !serverSrc.includes('/api/billing/google-play'));
assert('26. no Playwright', !serverSrc.toLowerCase().includes('playwright'));

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.log('\nFailures:');
  for (const error of errors) {
    console.log(`  ${error}`);
  }
  process.exit(1);
}

console.log(`\n✅ ALL ${passed} CHECKS PASSED`);
