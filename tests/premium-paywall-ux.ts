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

console.log('--- PremiumPaywall Checkout & Portal UX Tests ---\n');

// 1. In-flight loading states exist (separate flags for two independent requests)
console.log('In-flight guard state:');
assert(source.includes('useState(false)'), 'component uses local loading states initialized to false');
assert(source.includes('const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);'), 'component declares a checkout loading state');
assert(source.includes('const [isPortalLoading, setIsPortalLoading] = useState(false);'), 'component declares a separate portal loading state');

// 2. Checkout duplicate-click prevention
console.log('\nCheckout duplicate-click prevention:');
assert(source.includes('if (isCheckoutLoading || isPortalLoading) return;'), 'checkout handler early-returns while a request is in flight');
assert(source.includes('disabled={isCheckoutLoading || isPortalLoading}'), 'checkout button is disabled while loading (semantic disabled)');

// 3. Portal duplicate-click prevention
console.log('\nPortal duplicate-click prevention:');
assert(source.includes('if (isPortalLoading || isCheckoutLoading) return;'), 'portal handler early-returns while a request is in flight');
assert(source.includes('disabled={isPortalLoading || isCheckoutLoading}'), 'portal button is disabled while loading (semantic disabled)');

// 4. Loading state is always reset, even on error (finally block)
console.log('\nLoading state reset on error:');
const checkoutFinally = source.split('finally {')[1].split('}')[0];
const portalFinally = source.split('finally {')[2].split('}')[0];
assert(
  source.includes('finally {') && source.includes('setIsCheckoutLoading(false)'),
  'checkout loading state is reset in a finally block so the button re-enables on failure',
);
assert(checkoutFinally.includes('setIsCheckoutLoading(false)'), 'setIsCheckoutLoading(false) lives inside the checkout finally block');
assert(
  source.includes('setIsPortalLoading(false)'),
  'portal loading state is reset so the button re-enables on failure',
);
assert(portalFinally.includes('setIsPortalLoading(false)'), 'setIsPortalLoading(false) lives inside the portal finally block');

// 5. Clear loading text + accessible spinner
console.log('\nLoading UX text:');
assert(source.includes('Opening Secure Checkout…'), 'checkout button shows "Opening Secure Checkout…" while loading');
assert(source.includes('Opening Billing Portal…'), 'portal button shows "Opening Billing Portal…" while loading');
const spinCount = source.split('animate-spin').length - 1;
assert(spinCount === 2, `two decorative spinners (checkout + portal) via Tailwind animate-spin (found ${spinCount})`);
assert(source.includes('aria-hidden="true"'), 'spinner is marked aria-hidden (decorative, paired with visible text)');

// 6. Checkout and portal are mutually disabled (no confusing concurrent billing actions)
console.log('\nMutual disable:');
assert(
  source.includes('disabled={isCheckoutLoading || isPortalLoading}') &&
    source.includes('disabled={isPortalLoading || isCheckoutLoading}'),
  'each button is disabled while the other billing request is active',
);

// 7. Misleading cryptographic / developer copy removed
console.log('\nMisleading copy removed:');
assert(!/AES-256/.test(source), '"AES-256" crypto claim removed');
assert(!/SHA-256/.test(source), '"SHA-256" crypto claim removed');
assert(
  !/Secured by AES-256 and SHA-256 protocols/.test(source),
  'previous "Secured by AES-256 and SHA-256 protocols. Cancel anytime instantly." copy removed',
);
assert(!/LIVE BILLING INTEGRATION SPECIFICATIONS/.test(source), '"LIVE BILLING INTEGRATION SPECIFICATIONS" dev-facing label removed');
assert(!/Monetization & billing Integration/.test(source), '"Monetization & billing Integration" dev-facing label removed');
assert(!/com\.android\.billingclient/.test(source), 'Android billingclient code reference removed');
assert(!/stripe\.webhooks\.constructEvent/.test(source), 'server-side webhook code reference removed');

// 8. Accurate user-facing trust / billing copy present
console.log('\nUser-facing copy present:');
assert(
  source.includes('Payments are handled securely by Stripe Checkout. Cancel anytime from your account.'),
  'bottom trust line states Stripe Checkout handles payments and cancel-anytime',
);
assert(/processed securely through Stripe Checkout/.test(source), 'secure-payment box states payments are processed through Stripe Checkout');
assert(/never stored on our servers/.test(source), 'secure-payment box clarifies card details are never stored on our servers');
assert(source.includes('Manage your subscription'), 'billing toggle panel uses user-facing subscription language');
assert(source.includes("'Billing Info'"), 'billing toggle button uses user-facing "Billing Info" label');
assert(source.includes("'Hide Billing Info'"), 'billing toggle hide label is user-facing');

// 9. Checkout behavior preserved (Stripe navigation on success)
console.log('\nCheckout behavior preserved:');
assert(source.includes("window.location.href = data.checkoutUrl"), 'checkout still navigates to Stripe on success');
assert(source.includes("premium.setBillingMessage(error.message || 'Checkout request failed.')"), 'checkout error handling preserved');

// 10. Portal behavior: navigate to returned portalUrl on valid success; errors surfaced via existing mechanism
console.log('\nPortal behavior preserved:');
assert(
  source.includes("authFetch('/api/billing/create-portal-session'"),
  'portal still POSTs to the create-portal-session endpoint',
);
assert(source.includes('data.portalUrl'), 'portal handler references the backend-returned portalUrl field');
assert(
  source.includes('window.location.href = data.portalUrl'),
  'portal navigates the browser to the returned Stripe portal URL on valid success',
);
assert(
  source.includes('if (!response.ok)') &&
    source.includes("throw new Error(data.message || data.error || 'Billing portal request failed.')"),
  'non-ok portal response is treated as an error via the existing billing-message mechanism',
);
assert(
  source.includes('if (!data.portalUrl)') &&
    source.includes("throw new Error(data.message || 'Billing portal endpoint did not return a URL.')"),
  'successful response missing a portal URL is treated as an error',
);
assert(
  source.includes("premium.setBillingMessage(error.message || 'Billing portal request failed.')"),
  'portal error handling preserved (errors surfaced via billing message)',
);

console.log('\nALL PASSED');
