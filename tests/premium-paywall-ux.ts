import { readFileSync } from 'fs';
import { join } from 'path';

function assert(condition: unknown, message: string) {
  if (condition) {
    console.log('  ok  -', message);
  } else {
    throw new Error(message);
  }
}

const source = readFileSync(join(process.cwd(), 'src/components/PremiumPaywall.tsx'), 'utf8');

console.log('--- PremiumPaywall Checkout UX & Copy Tests ---\n');

// 1. In-flight checkout state exists
console.log('In-flight guard state:');
assert(source.includes('useState(false)'), 'checkout uses a local loading state initialized to false');
assert(source.includes('isCheckoutLoading'), 'component declares isCheckoutLoading state');
assert(source.includes('setIsCheckoutLoading'), 'component declares the loading state setter');

// 2. Duplicate-click prevention: an early return guards the handler
console.log('\nDuplicate-click prevention:');
assert(
  source.includes('if (isCheckoutLoading) return'),
  'checkout handler early-returns while a request is in flight',
);
assert(source.includes("disabled={isCheckoutLoading}"), 'checkout button is disabled while loading (semantic disabled)');

// 3. Loading state is always reset, even on error (finally block)
console.log('\nLoading state reset on error:');
assert(
  source.includes('finally {') &&
    source.includes('setIsCheckoutLoading(false)'),
  'loading state is reset in a finally block so the button re-enables on failure',
);
assert(
  source
    .split('finally {')[1]
    .split('}')[0]
    .includes('setIsCheckoutLoading(false)'),
  'setIsCheckoutLoading(false) lives inside the finally block',
);

// 4. Clear loading text is shown while preparing checkout
console.log('\nLoading UX text:');
assert(source.includes('Opening Secure Checkout…'), 'button shows "Opening Secure Checkout…" while loading');
assert(source.includes('animate-spin'), 'loading uses a decorative spinner (Tailwind animate-spin)');

// 5. Misleading cryptographic / developer copy is removed
console.log('\nMisleading copy removed:');
assert(!/AES-256/.test(source), '"AES-256" crypto claim removed');
assert(!/SHA-256/.test(source), '"SHA-256" crypto claim removed');
assert(
  !/Secured by AES-256 and SHA-256 protocols/.test(source),
  'previous "Secured by AES-256 and SHA-256 protocols. Cancel anytime instantly." copy removed',
);
assert(!/LIVE BILLING INTEGRATION SPECIFICATIONS/.test(source), '"LIVE BILLING INTEGRATION SPECIFICATIONS" dev-facing label removed');
assert(
  !/Monetization & billing Integration/.test(source),
  '"Monetization & billing Integration" dev-facing label removed',
);
assert(!/com\.android\.billingclient/.test(source), 'Android billingclient code reference removed');
assert(!/stripe\.webhooks\.constructEvent/.test(source), 'server-side webhook code reference removed');

// 6. Accurate user-facing trust / billing copy present
console.log('\nUser-facing copy present:');
assert(
  source.includes('Payments are handled securely by Stripe Checkout. Cancel anytime from your account.'),
  'bottom trust line states Stripe Checkout handles payments and cancel-anytime',
);
assert(
  /processed securely through Stripe Checkout/.test(source),
  'secure-payment box states payments are processed through Stripe Checkout',
);
assert(
  /never stored on our servers/.test(source),
  'secure-payment box clarifies card details are never stored on our servers',
);
assert(source.includes('Manage your subscription'), 'billing toggle panel uses user-facing subscription language');
assert(source.includes('Billing Info'), 'billing toggle button uses user-facing "Billing Info" label');
assert(source.includes("'Hide Billing Info'"), 'billing toggle hide label is user-facing');

// 7. Stripe checkout behavior preserved (navigation on success)
console.log('\nCheckout behavior preserved:');
assert(
  source.includes("window.location.href = data.checkoutUrl"),
  'checkout still navigates to Stripe on success',
);
assert(
  source.includes("premium.setBillingMessage(error.message || 'Checkout request failed.')"),
  'checkout error handling preserved',
);

console.log('\nALL PASSED');
