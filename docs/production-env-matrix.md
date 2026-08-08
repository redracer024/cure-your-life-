# Production Environment Matrix — BodySignal

> **Product:** BodySignal
> **Tagline:** Explore the whole pattern.
> **Last updated:** 2026-08-07
> **Scope:** Web deployment to a production domain. Web-only — no Android / Google Play.

---

## Deployment Architecture Summary

| Property | Value |
|---|---|
| Hosting type | Must support a **persistent Node.js server** (not static-only Vite hosting) |
| Build command | `npm run build` → `vite build` (frontend, inlines `VITE_*` build args) + `esbuild server.ts` (backend → `dist/server.cjs`) |
| Start command | `node dist/server.cjs` |
| PORT behavior | `process.env.PORT` (defaults to `3000` if unset). Server binds `0.0.0.0`. |
| Startup behavior | In production mode (`NODE_ENV !== "development"`), serves static assets from `dist/` and falls back all non-API routes to `dist/index.html`. Dev middleware (Vite HMR) is **only** active when `NODE_ENV=development`. |
| APP_URL injection | Must be injected at **runtime** as a server-side env var — it is read in `server.ts` at module load and used for Stripe redirect URLs. Server **fails closed** (throws on startup) if `APP_URL` is missing in production mode. |
| Hosting provider | Render Web Service (Docker runtime, Node 22 Alpine); Dockerfile at repo root declares `ARG VITE_*` build args for frontend env injection |

---

## Environment Variable Matrix

| Variable | Browser/Server | Required Production? | Current Status | Where Configured | Notes |
|---|---|---|---|---|---|
| `NODE_ENV` | Server | Required | READY | Deployment platform env | Must be `production`. Absent or non-`development` → static serving mode. Never `development` in prod. |
| `APP_URL` | Server | Required | LIVE ORIGIN SET | `.env` (local), deployment platform env | **CURRENT LIVE RENDER ORIGIN:** `https://bodysignal-xa18.onrender.com`. `.env.example` shows `https://example.com` (non-production placeholder). Local `.env` has `http://localhost:3000`. Server **throws on startup** if missing in production. Render must be configured with the live origin. A future custom domain would replace this value. |
| `DEV_PREMIUM` | Server | Prohibited | PLACEHOLDER | `.env` (local), `.env.example` | `.env` has `false`. `.env.local` has `true` (local only — must be `false`/unset in production). Bypass only engages when `NODE_ENV=development` **and** `DEV_PREMIUM=true` (exact literal). |
| `PORT` | Server | Optional | READY | Deployment platform env | Defaults to `3000` if unset. Server binds `0.0.0.0`. |
| `VITE_SUPABASE_URL` | Browser | Required | LIVE ORIGIN SET | `.env` | **CURRENT LIVE RENDER ORIGIN:** `https://psurstxfufkqqtpuaxel.supabase.co` (Supabase project `psurstxfufkqqtpuaxel`). `.env.example` shows `https://your-project.supabase.co` (placeholder). Must point to production Supabase project. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser | **Required (canonical)** | PLACEHOLDER | `.env` | **CANONICAL** production frontend key. Modern format: `sb_publishable_...`. Inlined at build time into the Vite bundle. `supabaseClient.ts` checks this BEFORE `VITE_SUPABASE_ANON_KEY`. |
| `VITE_SUPABASE_ANON_KEY` | Browser | Optional (backward-compat) | PLACEHOLDER — **MUST BE ROTATED** | `.env` | DEPRECATED alias. Ignored if `VITE_SUPABASE_PUBLISHABLE_KEY` is set. |
| `SUPABASE_URL` | Server | Required | LIVE ORIGIN SET | `.env` | **CURRENT LIVE SUPABASE ORIGIN:** `https://psurstxfufkqqtpuaxel.supabase.co` (same project). Used by server-side admin client only. A future custom domain would replace this value. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Required | **ROTATION REQUIRED** | `.env`, deployment platform secret store | **COMPROMISED** — was exposed in a development chat. Local `.env` still contains the old key. A new key must be generated in the Supabase Dashboard, stored server-side only, and the old key revoked. Until done, treat as compromised. |
| `STRIPE_SECRET_KEY` | Server | Required | **VERIFY LIVE/TEST MODE** | `.env`, deployment platform secret store | Local `.env` contains both `sk_live_...` and `sk_test_...` (duplicate key — last value wins: `sk_test_...`). Production must use a **live** server key. |
| `STRIPE_WEBHOOK_SECRET` | Server | Required | **VERIFY LIVE/TEST MODE** | `.env`, deployment platform secret store | Local `.env` has `whsec_c6fb9d90...` — verify this matches the **production** webhook endpoint registered in Stripe Dashboard. |
| `STRIPE_PRICE_ID_MONTHLY` | Server | Conditional* | MISSING | `.env.example` | Not set in local `.env`. Must be set to a **live** price ID for monthly plan. Required if monthly checkout is used. |
| `STRIPE_PRICE_ID_ANNUAL` | Server | Conditional* | MISSING | `.env.example` | Not set in local `.env`. Must be set to a **live** price ID for annual plan. Required if annual checkout is used. |
| `STRIPE_PRICE_ID` | Server | Optional | MISSING | `.env.example` | Legacy/fallback price key. `.env` has `price_1TpkoB...` (test price). |
| `GEMINI_API_KEY` | Server | Required | PLACEHOLDER | `.env`, deployment platform secret store | `.env` has `your_gemini_key` (placeholder). Must be a real Google Cloud API key. Never exposed to browser. |

\* `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_ANNUAL` are conditionally required: the checkout endpoint (`server.ts:964`) returns 501 if no prices are resolvable. At least `STRIPE_PRICE_ID_MONTHLY` is needed for the monthly checkout flow.

---

## Status Legend

| Status | Meaning |
|---|---|
| READY | Configured correctly and matches production expectations |
| PLACEHOLDER | Variable exists in `.env.example` but contains a placeholder value; requires a real production value |
| MISSING | Variable is not present in the local `.env` file; will cause a feature to be non-functional |
| ROTATION REQUIRED | Credential was exposed/leaked and must be rotated before production use |
| VERIFY LIVE/TEST MODE | Credential exists but its mode (live vs. test) must be verified against the production Stripe Dashboard |
| DEFERRED | Not needed for initial deployment or intentionally left unset |

---

## Secret Boundary Verification

| Secret | Server-only? | Browser bundle exposure? |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Yes — used only in `server.ts:159-160, 174-181` | No — not referenced in any `.tsx` source file |
| `STRIPE_SECRET_KEY` | Yes — used only in `server.ts:145, 168` | No — not referenced in any `.tsx` source file |
| `STRIPE_WEBHOOK_SECRET` | Yes — used only in `server.ts:149, 56` | No — not referenced in any `.tsx` source file |
| `GEMINI_API_KEY` | Yes — used only in `server.ts:187-206` | No — not referenced in any `.tsx` source file |
| `VITE_SUPABASE_URL` | N/A — browser-safe | Yes — consumed by `src/lib/supabaseClient.ts:8` via `import.meta.env` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | N/A — browser-safe | Yes — consumed by `src/lib/supabaseClient.ts:11-14` via `import.meta.env` (canonical) |
| `VITE_SUPABASE_ANON_KEY` | N/A — browser-safe | Yes — consumed by `src/lib/supabaseClient.ts:11-14` via `import.meta.env` (backward-compat fallback) |

**Frontend source scan result:** Zero `.tsx` files reference `process.env.SUPABASE_SERVICE_ROLE_KEY`, `process.env.STRIPE_SECRET_KEY`, `process.env.STRIPE_WEBHOOK_SECRET`, or `process.env.GEMINI_API_KEY`. The only frontend reference to `SUPABASE_SERVICE_ROLE_KEY` is a string literal in `AppErrorBoundary.tsx:39` used as a **redaction regex pattern** (not env access). No `VITE_STRIPE*` variables are consumed by frontend source.

---

## Supabase Auth Configuration

| Setting | Required Value | Current Status |
|---|---|---|
| Site URL | `https://bodysignal-xa18.onrender.com` (CURRENT LIVE RENDER ORIGIN) | **NOT CONFIGURED** — requires setting in Supabase Dashboard. A future custom domain would replace this value. |
| Auth redirect: password recovery | `https://bodysignal-xa18.onrender.com/?auth=recovery` | Documented in code (`useAuthState.ts:35`); not configured in dashboard |
| Auth redirect: email confirmation | `https://bodysignal-xa18.onrender.com/?auth=confirm` | Documented in code (`useAuthState.ts:80-84`); not configured in dashboard |
| Frontend Supabase key (canonical) | `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` / Render env — checked first in `supabaseClient.ts`; `VITE_SUPABASE_ANON_KEY` is backward-compat fallback |
| Email confirmation / autoconfirm | Should be `false` once SMTP is live | Currently `true` (autoconfirm enabled) — do NOT flip until SMTP + templates verified |
| OAuth providers | Disabled (not used) | Not applicable |

---

## Stripe Configuration

| Setting | Required Value | Current Status |
|---|---|---|
| `STRIPE_SECRET_KEY` | Live server key (`sk_live_...`) | Local `.env` has `sk_live_...` but also duplicate `sk_test_...` — must verify production uses live key |
| Webhook endpoint | `POST https://<production-domain>/api/billing/webhook` | Not registered — requires domain + dashboard action |
| `STRIPE_WEBHOOK_SECRET` | Secret matching production webhook endpoint | Local value exists — must verify it matches the production endpoint |
| `STRIPE_PRICE_ID_MONTHLY` | Live approved monthly price | MISSING in `.env` |
| `STRIPE_PRICE_ID_ANNUAL` | Live approved annual price | MISSING in `.env` |
| Webhook event types | 6 events (see below) | — |

### Required Stripe Webhook Event Types (verified in `server.ts:664-687`)

| Event Type | Handled? |
|---|---|
| `checkout.session.completed` | Yes — `syncStripeCheckoutSession` |
| `customer.subscription.created` | Yes — `syncStripeSubscription` |
| `customer.subscription.updated` | Yes — `syncStripeSubscription` |
| `customer.subscription.deleted` | Yes — `syncStripeSubscription` |
| `invoice.paid` | Yes — `syncStripeInvoice` |
| `invoice.payment_failed` | Yes — `syncStripeInvoice` |

---

## Email Delivery

| Setting | Current Value | Status |
|---|---|---|
| `mailer_autoconfirm` | `true` | STATUS — do NOT disable until SMTP + confirmation UX verified |
| SMTP configured | No | BLOCKED — password reset and confirmation emails will not send |
| Production email delivery | Unconfigured | BLOCKED |

---

## Supabase Schema / RLS

Unchanged in this batch. No schema migrations, no RLS policy modifications.

---

## Stripe Billing Logic

Unchanged in this batch. No changes to checkout, webhook, subscription, or reconciliation logic.
