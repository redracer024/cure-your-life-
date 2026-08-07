# Production Deployment Checklist

> Last updated: 2026-08-07
> Applies to: web deployment to a production domain.
> Does NOT apply to: Google Play / Android. This app is web-only.

---

## PRE-DEPLOY

### Build
- `npm run lint` (tsc --noEmit) — must be green
- `npm run build` — must succeed, no warnings about missing env vars
- `npx tsx tmp-validate-billing-lifecycle.ts` — 89/89 assertions pass
- `npx tsx tmp-validate-http-integration.ts` — all assertions pass
- `npx tsx tmp-validate-http-security.ts` — all assertions pass
- `npx tsx tmp-validate-production-config.ts` — all assertions pass

### Environment Variables
- `NODE_ENV=production`
- `DEV_PREMIUM` is **false or unset** (dev bypass must never fire in production)
- `APP_URL` is set to the production origin (https://your-app.com). Missing APP_URL must fail server startup.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`) are set for the browser bundle
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set server-side only
- `STRIPE_SECRET_KEY` is set (live or test, server-side only)
- `STRIPE_WEBHOOK_SECRET` is set
- `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_ANNUAL` are set to live price IDs
- `GEMINI_API_KEY` is set (server-side only)
- No server-only env var is referenced in frontend/source code that gets bundled to the browser (see Step 11 scan)

### Supabase Auth Configuration
- **Site URL** in Supabase Dashboard — set to `https://<production-domain>`
- **Redirect URLs** — add only the exact URLs the app uses:
  - `https://<production-domain>/?`
  - `https://<production-domain>/?billing=success`
  - `https://<production-domain>/?billing=cancelled`
  - `https://<production-domain>/?billing=portal-return`
- Do NOT use wildcards (e.g., `https://*.example.com/*`) unless technically unavoidable
- OAuth providers — leave **disabled** (app does not use OAuth)
- Email confirmation / autoconfirm:
  - `mailer_autoconfirm` is currently `true` — do NOT disable until SMTP and confirmation UX are ready
  - If disabling autofirm: configure SMTP, add a confirmation callback page, and handle "unconfirmed" state in `useAuthState.ts` before flipping this toggle

### Stripe Configuration
- Webhook endpoint in Stripe Dashboard — set to `https://<production-domain>/api/billing/webhook`
- Webhook endpoint is configured with the correct `STRIPE_WEBHOOK_SECRET`
- Price IDs in `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_ANNUAL` match live prices in Stripe Dashboard
- No test-mode prices are used in production `APP_URL`

### Credential Rotation
- The Supabase `service_role` key previously exposed in a development chat **must be rotated** before deployment
- After rotation, remove the old key from all local `.env` files
- Verify the server boots with the new key (Stripe and Supabase admin calls succeed)
- Verify the browser receives only the anon/publishable key (inspect Network tab)
- Run git history secret scan: `git log -p --all | grep -iE 'service_role|sk_live|whsec_'`

### Security
- Production CSP has no `unsafe-eval` (dev mode allows it for HMR)
- No wildcard CORS headers (`access-control-allow-origin: *`)
- HSTS header present for HTTPS responses (server.ts enforces this in production)
- `X-Content-Type-Options: nosniff` present
- `X-Frame-Options: DENY` present
- `Referrer-Policy: strict-origin-when-cross-origin` present

---

## POST-DEPLOY

- Homepage loads at `https://<production-domain>`
- Auth: signup + signin works with a real email/password
- Auth: account deletion flow cancels Stripe subscription before deleting Supabase user
- Premium endpoint (`/api/me/premium`) requires a valid bearer token
- Checkout (`/api/billing/create-checkout-session`) uses server-side price allowlist only
- Webhook delivers successfully to `https://<production-domain>/api/billing/webhook`
- Premium reconciliation (`/api/me/subscription/reconcile`) repairs stale subscription state
- CSP/security headers present on all responses
- No secrets visible in browser DevTools Network tab or Sources
- No `unsafe-eval` in production CSP

---

## ROLLBACK

If deployment is broken and must be reverted:

1. Restore the previous release artifact: `node dist/server.cjs` (the server is a standalone CommonJS bundle)
2. Revert environment variables to the previous known-good `.env` values
3. The Supabase database is managed externally — a server rollback does **not** delete DB state
4. To roll back a Stripe price ID change: update `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_ANNUAL` back to the old values in the deployment env, then restart
5. To roll back a credential rotation: restore the old keys in the deployment secret manager, then restart (the old keys must still be valid in Supabase/Stripe dashboards)

---

## REMAINING PRODUCTION BLOCKERS

1. **Credential rotation** — the service-role key was exposed in a dev chat and must be manually rotated
2. **Email confirmation** — `mailer_autoconfirm` is still `true`; disabling it requires SMTP config + confirmation UX (not yet implemented)
3. **Password reset** — no password-reset flow exists; users cannot recover a forgotten password
4. **Live domain** — `APP_URL` must be set to the real production domain before deployment; no domain is hardcoded
