import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildContentSecurityPolicy } from './src/lib/server/securityHeaders';
import { InMemoryRateLimiter } from './src/lib/server/inMemoryRateLimit';
import { getRateLimitActorKey } from './src/lib/server/rateLimitKey';

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
const serverEnvSrc = fs.readFileSync(path.join(root, 'serverEnv.ts'), 'utf8');

console.log('Middleware/body-parser checks');
const webhookRawPos = serverSrc.indexOf('app.post("/api/billing/webhook", express.raw(');
const jsonParserPos = serverSrc.indexOf('app.use(express.json({ limit: GENERAL_JSON_BODY_LIMIT');
assert('1. Stripe raw webhook parser occurs before incompatible JSON parsing', webhookRawPos !== -1 && jsonParserPos !== -1 && webhookRawPos < jsonParserPos);
assert('2. webhook raw body has explicit size limit', serverSrc.includes('STRIPE_WEBHOOK_BODY_LIMIT') && serverSrc.includes('express.raw({ type: "application/json", limit: STRIPE_WEBHOOK_BODY_LIMIT })'));
assert('3. general JSON body has explicit size limit', serverSrc.includes('const GENERAL_JSON_BODY_LIMIT = "128kb"') && serverSrc.includes('express.json({ limit: GENERAL_JSON_BODY_LIMIT'));
assert('4. oversized payload reaches 413 behavior', serverSrc.includes('entity.too.large') && serverSrc.includes('status(413)'));

console.log('CSP/header checks');
const devCsp = buildContentSecurityPolicy({ isDevelopment: true, supabaseUrl: 'https://abc.supabase.co' });
const prodCsp = buildContentSecurityPolicy({ isDevelopment: false, supabaseUrl: 'https://abc.supabase.co' });
assert('5. CSP exists in production', prodCsp.length > 0 && prodCsp.includes('default-src'));
assert('6. CSP does not use default-src *', !prodCsp.includes('default-src *'));
assert('7. CSP does not use script-src *', !prodCsp.includes('script-src *'));
assert('8. production CSP avoids unsafe-eval', !prodCsp.includes("'unsafe-eval'"));
assert('9. frame protection exists', prodCsp.includes("frame-ancestors 'none'") && serverSrc.includes('X-Frame-Options'));
assert('10. nosniff exists', serverSrc.includes('X-Content-Type-Options", "nosniff"'));
assert('11. referrer policy exists', serverSrc.includes('Referrer-Policy", "strict-origin-when-cross-origin"'));
assert('12. permissions policy exists', serverSrc.includes('Permissions-Policy'));
assert('13. HSTS production-only', serverSrc.includes('if (!isDevelopment && req.secure)') && serverSrc.includes('Strict-Transport-Security'));
assert('14. localhost development not forced into HSTS', !devCsp.includes('Strict-Transport-Security') && serverSrc.includes('if (!isDevelopment && req.secure)'));

assert('15. style-src allows Google Fonts stylesheet origin', prodCsp.includes("https://fonts.googleapis.com"));
assert('16. font-src allows Google Fonts font file origin', prodCsp.includes("https://fonts.gstatic.com"));
assert('17. script-src does not gain unsafe-inline', !prodCsp.includes("script-src 'unsafe-inline'") && !prodCsp.includes("script-src 'self' 'unsafe-inline'"));
assert('18. script-src does not gain unsafe-eval in production', !prodCsp.includes("'unsafe-eval'"));
assert('19. no bare https: scheme source (wildcard) or * introduced in CSP', !/https:(?!\/\/)/.test(prodCsp) && !prodCsp.includes("default-src *") && !prodCsp.includes("script-src *") && !prodCsp.includes("img-src *") && !prodCsp.includes("media-src *") && !prodCsp.includes("font-src *") && !prodCsp.includes("style-src *") && !prodCsp.includes("connect-src *"));
assert('20. media-src retains exact R2 origin', prodCsp.includes("https://pub-61a6f2a3fc254836a9d34227d4473a6c.r2.dev"));

console.log('Cache-control and limiter checks');
assert('21. authenticated sensitive responses use no-store', serverSrc.includes('app.get("/api/me/premium"') && serverSrc.includes('setNoStore(res);') && serverSrc.includes('app.post("/api/me/subscription/reconcile"') && serverSrc.includes('app.delete("/api/me/account"'));
assert('22. account deletion rate-limited', serverSrc.includes('accountDeleteRateLimiter') && serverSrc.includes('Too many account deletion requests'));
assert('23. checkout creation rate-limited', serverSrc.includes('checkoutRateLimiter') && serverSrc.includes('Too many checkout requests'));
assert('24. portal creation rate-limited', serverSrc.includes('portalRateLimiter') && serverSrc.includes('Too many billing portal requests'));
assert('25. reconcile rate-limited', serverSrc.includes('reconcileRateLimiter') && serverSrc.includes('Too many reconciliation requests'));
assert('26. Gemini existing limit preserved', serverSrc.includes('const ANALYSIS_RATE_LIMIT_MAX = 30') && serverSrc.includes('analysisRateLimiter'));
const webhookBlock = serverSrc.slice(webhookRawPos, jsonParserPos);
assert('27. Stripe webhook not IP-rate-limited like user endpoints', !webhookBlock.includes('enforceRateLimit('));

console.log('Limiter key behavior checks');
assert('28. authenticated limiter prefers verified user identity', getRateLimitActorKey('user-123', '10.0.0.1') === 'user:user-123');
assert('29. untrusted client cannot spoof limiter key via arbitrary user-id header', getRateLimitActorKey(null, '10.0.0.1') === 'ip:10.0.0.1' && !serverSrc.includes('x-user-id'));

console.log('Security posture checks');
assert('30. raw server errors sanitized', serverSrc.includes('Unhandled server error:') && serverSrc.includes('Internal server error.') && !serverSrc.includes('stack'));
assert('31. CORS not opened broadly', !serverSrc.includes('Access-Control-Allow-Origin') && !serverSrc.includes('cors('));
assert('32. DEV_PREMIUM fail-closed behavior preserved', serverSrc.includes('isDevelopmentPremiumEnabled(') && serverEnvSrc.includes('devPremium === "true"'));
assert('33. RLS/schema unchanged', !serverSrc.includes('alter table public.subscriptions') && !serverSrc.includes('create table public.subscriptions'));
assert('34. Stripe entitlement logic unchanged', serverSrc.includes('isPremiumEntitled(subscription)'));
assert('35. Google Play unchanged', !serverSrc.includes('/api/billing/google-play') && !serverSrc.includes('billingclient'));
assert('36. no Playwright', !serverSrc.toLowerCase().includes('playwright'));

console.log('In-memory limiter behavior checks');
{
  const limiter = new InMemoryRateLimiter({ max: 2, windowMs: 1000 });
  const first = limiter.consume('k', 0);
  const second = limiter.consume('k', 10);
  const third = limiter.consume('k', 20);
  const fourth = limiter.consume('k', 1200);
  assert('limiter allows up to max within window', first.allowed && second.allowed && !third.allowed);
  assert('limiter resets after window', fourth.allowed);
}

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
