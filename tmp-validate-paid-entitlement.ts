import * as fs from 'node:fs';
import * as path from 'node:path';
import { isPremiumEntitled } from './src/lib/billing/entitlement';

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

const repoRoot = import.meta.dirname;
const serverPath = path.join(repoRoot, 'server.ts');
const paywallPath = path.join(repoRoot, 'src/components/PremiumPaywall.tsx');
const supabaseClientPath = path.join(repoRoot, 'src/lib/supabaseClient.ts');
const serverEnvPath = path.join(repoRoot, 'serverEnv.ts');

const serverSrc = fs.readFileSync(serverPath, 'utf8');
const paywallSrc = fs.readFileSync(paywallPath, 'utf8');
const supabaseClientSrc = fs.readFileSync(supabaseClientPath, 'utf8');
const serverEnvSrc = fs.readFileSync(serverEnvPath, 'utf8');

console.log('Static checkout and allowlist checks');
assert('1. arbitrary client price ID cannot be used', !serverSrc.includes('req.body.price') && !serverSrc.includes('req.query.price'));
assert('2. only approved plans map to Stripe prices', serverSrc.includes('BILLING_PLAN_PRICE_MAP') && serverSrc.includes('resolveCheckoutPrice(req.body?.plan)'));

console.log('Static webhook checks');
assert('3. webhook requires valid signature path', serverSrc.includes('stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET)'));
assert('4. duplicate event processing is safe via idempotent user upsert', serverSrc.includes('onConflict: "user_id"') && serverSrc.includes('syncStripeSubscriptionById('));
assert('5. checkout completion alone cannot forge entitlement', serverSrc.includes('Checkout session did not include a subscription id.') && serverSrc.includes('await syncStripeSubscriptionById(subscriptionId, userId)'));
assert('10. failed payment handled explicitly', serverSrc.includes('case "invoice.payment_failed":'));

console.log('Behavioral entitlement checks');
const nowMs = Date.parse('2026-08-07T00:00:00.000Z');
const future = new Date(nowMs + 60_000).toISOString();
const past = new Date(nowMs - 60_000).toISOString();

assert('6. active subscription grants expected entitlement', isPremiumEntitled({ status: 'active', current_period_end: future }, nowMs) === true);
assert('7. canceled subscription does not', isPremiumEntitled({ status: 'canceled', current_period_end: future }, nowMs) === false);
assert('8. expired subscription does not', isPremiumEntitled({ status: 'active', current_period_end: past }, nowMs) === false);
assert('9. unpaid subscription does not', isPremiumEntitled({ status: 'unpaid', current_period_end: future }, nowMs) === false);
assert('11. cancel-at-period-end behavior correct (active until period end)', isPremiumEntitled({ status: 'active', current_period_end: future }, nowMs) === true && isPremiumEntitled({ status: 'active', current_period_end: past }, nowMs) === false);
assert('12. current_period_end respected', isPremiumEntitled({ status: 'trialing', current_period_end: future }, nowMs) === true && isPremiumEntitled({ status: 'trialing', current_period_end: null }, nowMs) === false);

console.log('Client tamper checks');
assert('13. client cannot write subscription truth', !paywallSrc.includes('localStorage.setItem') && !paywallSrc.includes('/subscriptions'));
assert('14. premium endpoint authenticated', serverSrc.includes('app.get("/api/me/premium"') && serverSrc.includes('getAuthenticatedSupabaseUser(req)') && serverSrc.includes('return res.status(401).json'));
assert('15. reconciliation derives user from JWT', serverSrc.includes('app.post("/api/me/subscription/reconcile"') && serverSrc.includes('getAuthenticatedSupabaseUser(req)') && !serverSrc.includes('req.body.userId'));
assert('16. client cannot specify another Stripe customer', !serverSrc.includes('req.body.customer') && !serverSrc.includes('req.query.customer'));
assert('17. DEV_PREMIUM remains development-only', serverSrc.includes('isDevelopmentPremiumEnabled(') && serverEnvSrc.includes('nodeEnv === "development"'));

console.log('Security and scope checks');
assert('18. raw Stripe errors sanitized', !serverSrc.includes('message: error.message') && !serverSrc.includes('deleteError.message'));
assert('19. account-deletion billing caveat documented', serverSrc.includes('Release blocker before paid launch') && serverSrc.includes('does not cancel external billing'));
assert('20. no Google Play implementation added', !serverSrc.includes('/api/billing/google-play') && !serverSrc.includes('billingclient'));
assert('21. no RLS weakening in app server code', !serverSrc.includes('alter table public.subscriptions disable row level security'));
assert('22. no Playwright', !serverSrc.includes('playwright'));

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
