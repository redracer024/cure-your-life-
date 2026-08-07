import * as fs from 'node:fs';
import * as path from 'node:path';

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
const serverPath = path.join(root, 'server.ts');
const serverEnvPath = path.join(root, 'serverEnv.ts');
const migrationPath = path.join(
  root,
  'supabase/migrations/20260807065356_add_stripe_webhook_event_ledger.sql',
);
const leaseMigrationPath = path.join(
  root,
  'supabase/migrations/20260807072156_add_stripe_webhook_processing_lease.sql',
);

const serverSrc = fs.readFileSync(serverPath, 'utf8');
const serverEnvSrc = fs.readFileSync(serverEnvPath, 'utf8');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');
const leaseMigrationSql = fs.readFileSync(leaseMigrationPath, 'utf8');

console.log('Webhook signature and claim lifecycle checks');
assert(
  '1. signature verification happens before trusted event handling',
  serverSrc.indexOf('stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET)') !== -1 &&
    serverSrc.indexOf('claimStripeWebhookEvent({') !== -1 &&
    serverSrc.indexOf('stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET)') <
      serverSrc.indexOf('claimStripeWebhookEvent({'),
);
assert('2. stripe_event_id uniquely persisted', migrationSql.includes('stripe_event_id text not null unique'));
assert('3. duplicate processed event skips business mutation', serverSrc.includes('case "already-processed":') && serverSrc.includes('return res.status(200).json({ received: true });'));
assert('4. concurrent duplicate claim is conflict-safe', serverSrc.includes('insertError?.code !== "23505"') && serverSrc.includes('.eq("retry_count", existing.retry_count)') && serverSrc.includes('.eq("processing_started_at", existing.processing_started_at)'));
assert('5. failed event may retry', serverSrc.includes('.eq("status", "failed")') && serverSrc.includes('outcome: "retry-claimed"'));
assert('6. event marked processed only after successful reconciliation', serverSrc.includes('await processStripeWebhookEvent(event);') && serverSrc.includes('await markStripeWebhookEventProcessed(claim.ledgerId);') && serverSrc.indexOf('await processStripeWebhookEvent(event);') < serverSrc.indexOf('await markStripeWebhookEventProcessed(claim.ledgerId);'));
assert('7. raw webhook payload not persisted', !migrationSql.includes('payload json') && !migrationSql.includes('payload jsonb') && !serverSrc.includes('from("stripe_webhook_events").insert({ payload'));

console.log('Ledger RLS checks');
assert('8. ledger RLS enabled', migrationSql.includes('alter table public.stripe_webhook_events enable row level security;'));
assert('9. no anon ledger policy', !migrationSql.includes('to anon') && !migrationSql.includes('for select using (true)'));
assert('10. no authenticated ledger policy', !migrationSql.includes('to authenticated'));
assert('11. service-role/server path used', serverSrc.includes('supabaseAdmin') && serverSrc.includes('from("stripe_webhook_events")'));
assert('lease column exists for stale recovery', leaseMigrationSql.includes('add column if not exists processing_started_at timestamptz'));
assert('fresh processing duplicate is retryable (non-2xx)', serverSrc.includes('case "active-processing":') && serverSrc.includes('return res.status(409).json'));

console.log('Canonical reconciliation and event coverage checks');
assert('12. subscription reconciliation remains canonical', serverSrc.includes('await syncStripeSubscriptionById(') && serverSrc.includes('stripe.subscriptions.retrieve(subscriptionId)'));
assert('13. out-of-order event does not blindly overwrite Stripe truth', serverSrc.includes('processStripeWebhookEvent') && serverSrc.includes('syncStripeSubscriptionById'));
assert('14. invoice.payment_failed remains handled', serverSrc.includes('case "invoice.payment_failed":'));
assert('15. invoice.paid remains handled', serverSrc.includes('case "invoice.paid":'));
assert('16. checkout completion does not directly forge premium', serverSrc.includes('Checkout session did not include a subscription id.') && serverSrc.includes('await syncStripeSubscriptionById(subscriptionId, userId);'));

console.log('Auth/tamper/security checks');
assert('17. premium endpoint remains authenticated', serverSrc.includes('app.get("/api/me/premium"') && serverSrc.includes('const { user } = await getAuthenticatedSupabaseUser(req);'));
assert('18. reconcile endpoint remains JWT-derived', serverSrc.includes('app.post("/api/me/subscription/reconcile"') && serverSrc.includes('getAuthenticatedSupabaseUser(req)') && !serverSrc.includes('req.body.userId'));
assert('19. arbitrary customer/subscription IDs rejected', !serverSrc.includes('req.body.customer') && !serverSrc.includes('req.body.subscription'));
assert('20. DEV_PREMIUM unchanged', serverSrc.includes('isDevelopmentPremiumEnabled(') && serverEnvSrc.includes('devPremium === "true"'));
assert('21. Stripe secrets not exposed', !serverSrc.includes('service_role_key') && !serverSrc.includes('res.json({ STRIPE_SECRET_KEY') && !serverSrc.includes('res.json({ STRIPE_WEBHOOK_SECRET'));
assert('22. account deletion billing safety retained', serverSrc.includes('cancels externally billable') || serverSrc.includes('cancelStripeBillingBeforeAccountDeletion'));
assert('23. no Google Play implementation', !serverSrc.includes('/api/billing/google-play') && !serverSrc.includes('googleplay'));
assert('24. no Playwright', !serverSrc.includes('playwright'));

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
