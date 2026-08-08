# Production Deployment Checklist — BodySignal

> **Product:** BodySignal
> **Tagline:** Explore the whole pattern.
>
> Last updated: 2026-08-07
> Applies to: web deployment to a production domain.
> Does NOT apply to: Google Play / Android. This app is web-only.
>
> Final production domain, SMTP sender name, email templates, and app-store identity
> should all use **BodySignal** after domain selection.

---

## PRE-DEPLOY

### Build
- `npm run lint` (tsc --noEmit) — must be green
- `npm run build` — must succeed, no warnings about missing env vars
- `npx tsx tmp-validate-auth-recovery.ts` — all assertions pass
- `npx tsx tmp-validate-production-config.ts` — all assertions pass
- `npx tsx tmp-validate-billing-lifecycle.ts` — 89/89 assertions pass
- `npx tsx tmp-validate-http-integration.ts` — all assertions pass
- `npx tsx tmp-validate-http-security.ts` — all assertions pass

### Environment Variables
- `NODE_ENV=production`
- `DEV_PREMIUM` is **false or unset** (dev bypass must never fire in production)
- `APP_URL=https://bodysignal-xa18.onrender.com` (CURRENT LIVE RENDER ORIGIN)
- `VITE_SUPABASE_URL=https://psurstxfufkqqtpuaxel.supabase.co` (production Supabase project — build-time, public)
- `VITE_SUPABASE_PUBLISHABLE_KEY` is set (canonical frontend key — modern `sb_publishable_` format; build-time, public)
- `VITE_SUPABASE_ANON_KEY` optional — ignored if `VITE_SUPABASE_PUBLISHABLE_KEY` is set (backward-compat only)
- `SUPABASE_URL=https://psurstxfufkqqtpuaxel.supabase.co` (server-side only)
- `SUPABASE_SERVICE_ROLE_KEY` is set server-side only — **ROTATED** (old key was exposed in a dev chat; see Step 3)
- `STRIPE_SECRET_KEY` is set (live mode, server-side only)
- `STRIPE_WEBHOOK_SECRET` is set
- `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_ANNUAL` are set to live price IDs
- `GEMINI_API_KEY` is set (server-side only)
- No server-only env var is referenced in frontend/source code that gets bundled to the browser
- `VITE_*` vars are available during Docker build (Dockerfile declares `ARG VITE_*`; Render auto-passes matching envVars as build args). A restart-only deploy is insufficient for frontend env changes — trigger a fresh Deploy. See `docs/supabase-production-setup.md` §6.

### Supabase Auth Configuration

#### Production origin

The current live Render origin is:

```
https://bodysignal-xa18.onrender.com
```

This is the **CURRENT LIVE RENDER ORIGIN**. When a custom domain is attached in
the future, update all URLs below. A future custom domain would replace this
origin.

#### Site URL
- Set to `https://bodysignal-xa18.onrender.com` (CURRENT LIVE RENDER ORIGIN)

#### Redirect URLs — STORAGE (Stripe billing returns)
These are separate from Supabase auth redirects. Do not mix.

| URL | Purpose |
|-----|---------|
| `https://bodysignal-xa18.onrender.com/?billing=success` | Stripe Checkout success |
| `https://bodysignal-xa18.onrender.com/?billing=cancelled` | Stripe Checkout cancel |
| `https://bodysignal-xa18.onrender.com/?billing=portal-return` | Stripe portal return |

#### Redirect URLs — SUPABASE AUTH (password recovery + email confirmation)

| URL | Purpose |
|-----|---------|
| `https://bodysignal-xa18.onrender.com/?auth=recovery` | Password reset link redirect target |
| `https://bodysignal-xa18.onrender.com/?auth=confirm` | Email confirmation link redirect target (future, when autoconffirm is disabled) |

- Do NOT use wildcards (e.g., `https://*.example.com/*`) unless technically unavoidable
- OAuth providers — leave **disabled** (app does not use OAuth)

#### Email Confirmation / Autoconfirm
- `mailer_autoconfirm` is currently `true` — do NOT disable until SMTP and confirmation UX are ready
- The app has confirmation callback handling ready (`?auth=confirm` with `exchangeCodeForSession`)
- But SMTP must be configured before disabling autoconfirm, or signups will be broken
- If disabling autofirm: configure SMTP, verify email templates, then test the `/?auth=confirm` flow

#### Password Reset
- Implemented client-side via `supabase.auth.resetPasswordForEmail`
- Redirect target is `APP_URL/?auth=recovery`
- Requires Supabase email delivery to be configured in the Supabase dashboard ("Enable email" / "Secure email change")
- If email delivery is not configured, password reset links will not send — document as blocker

### Stripe Configuration
- Webhook endpoint in Stripe Dashboard — set to `https://bodysignal-xa18.onrender.com/api/billing/webhook` (CURRENT LIVE RENDER ORIGIN)
- Webhook endpoint is configured with the correct `STRIPE_WEBHOOK_SECRET`
- Price IDs in `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_ANNUAL` match live prices in Stripe Dashboard
- No test-mode prices are used in production `APP_URL`

### Credential Rotation
- The Supabase `service_role` key previously exposed in a development chat **must be rotated** before deployment
- Supabase project: **`psurstxfufkqqtpuaxel`**
- After rotation, remove the old key from all local `.env` / `.env.local` files
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

- Homepage loads at `https://bodysignal-xa18.onrender.com` (CURRENT LIVE RENDER ORIGIN)
- Auth: signup + signin works with a real email/password
- Auth: password reset ("Forgot password?") sends email and the recovery callback (?auth=recovery + code) exchanges for a session
- Auth: new password form sets password via `supabase.auth.updateUser` and clears URL params
- Auth: account deletion flow cancels Stripe subscription before deleting Supabase user
- Premium endpoint (`/api/me/premium`) requires a valid bearer token
- Checkout (`/api/billing/create-checkout-session`) uses server-side price allowlist only
- Webhook delivers successfully to `https://bodysignal-xa18.onrender.com/api/billing/webhook`
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
2. **Email delivery** — Supabase must have email delivery configured (SMTP or built-in) for password reset and confirmation links to work. Currently `mailer_autoconfirm=true` with no SMTP.
3. **Live domain** — `APP_URL` must be set to the real production domain before deployment; no domain is hardcoded. The server now fails closed if `APP_URL` is missing in production mode.
