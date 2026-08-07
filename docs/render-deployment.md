# Render Deployment Guide — BodySignal

> **Product:** BodySignal
> **Tagline:** Explore the whole pattern.
> **Scope:** Render Web Service deployment configuration.
> **Last updated:** 2026-08-07
> **Actual deployment attempted:** NO — this document prepares the exact configuration so deployment is mechanical once a domain and credentials are chosen.

---

## 1. Render Compatibility Result

| Check | Result | Evidence |
|---|---|---|
| Dockerfile exists | OK | `Dockerfile` at repo root |
| Docker build suitable for Render Web Service | OK | Multi-stage build, Node 20 Alpine, non-root `node` user, `node dist/server.cjs` CMD |
| Server listens on `process.env.PORT` | OK | `server.ts:31` — `Number(process.env.PORT \|\| 3000)` |
| Server binds `0.0.0.0` | OK | `server.ts:1323` — `app.listen(PORT, "0.0.0.0", ...)` |
| `npm start` runs `dist/server.cjs` | OK | `package.json` — `"start": "node dist/server.cjs"` |
| No persistent disk required | OK | Stateless server; data lives in Supabase |
| No local database required | OK | No embedded DB; Supabase is external |
| Webhook ingress via same web service | OK | `POST /api/billing/webhook` served by the same Express app |
| Graceful shutdown | OK | `server.ts:1330-1341` — SIGTERM/SIGINT handlers |
| `/api` fallback fixed | OK | `/api` 404 registered before SPA catch-all (`server.ts:1312`) |
| Production `APP_URL` fails closed | OK | `server.ts:152-158` — throws if missing in production |
| `NODE_ENV` gates dev/prod | OK | `serverEnv.ts` — Vite middleware only when `NODE_ENV=development` |

**Conclusion:** The repository is fully compatible with a Render Web Service using the Docker runtime. No Render incompatibilities found.

---

## 2. Render Service Configuration

| Setting | Value |
|---|---|
| Service type | Web Service |
| Runtime | Docker |
| Region | Default (or choose closest to users) |
| Plan | Starter or higher (single instance is fine for initial traffic) |
| Branch | `experiment/3d-medical-ui` (see Section 7 — branch strategy decision) |
| Build | Dockerfile-based (`Dockerfile` at repo root) |
| Start | `node dist/server.cjs` (via Dockerfile `CMD`, no explicit start command needed) |
| Port | Render provides `PORT` env var; application reads `process.env.PORT` and binds `0.0.0.0` |
| Auto-deploy | Recommended `true` for the experiment branch, or `false` for stricter production control |
| Persistent disk | Not required |
| Health check path | `/healthz` (see Section 6) |

### Dashboard configuration summary

If you prefer to configure manually instead of using `render.yaml`:

1. **New** → **Web Service**
2. Connect your GitHub/GitLab repo
3. Select branch: `experiment/3d-medical-ui`
4. Environment: **Docker**
5. Build & Deploy: leave defaults (Render auto-detects `Dockerfile`)
6. Health Check: set to `GET /healthz`
7. Add all environment variables from Section 5 (below) as **Environment** entries
8. Mark all secrets as **encrypted** (Render does this automatically for env vars)

---

## 3. Environment Variables

> **Never commit actual values.** All secrets are injected through the Render Dashboard.

| Variable | Classification | Required? |
|---|---|---|
| `NODE_ENV` | Server Config | Required |
| `APP_URL` | Server Config | Required (production) |
| `DEV_PREMIUM` | Server Config | Required (must be `false`) |
| `VITE_SUPABASE_URL` | Public Config | Required |
| `VITE_SUPABASE_ANON_KEY` | Public Config | Required |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public Config | Conditional |
| `SUPABASE_URL` | Server Config | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Secret | Required (must be rotated — see Section 8) |
| `STRIPE_SECRET_KEY` | Server Secret | Required (live mode) |
| `STRIPE_WEBHOOK_SECRET` | Server Secret | Required |
| `STRIPE_PRICE_ID_MONTHLY` | Server Config | Required |
| `STRIPE_PRICE_ID_ANNUAL` | Server Config | Required |
| `STRIPE_PRICE_ID` | Server Config | Optional (fallback) |
| `GEMINI_API_KEY` | Server Secret | Required |

### Classification legend

- **Public Config:** Safe to expose to the browser bundle (`VITE_` prefixed). Injected into frontend via Vite `import.meta.env`.
- **Server Secret:** Never exposed to the browser. Used only in `server.ts`.
- **Server Config:** Server-side only but not secret (e.g. `NODE_ENV`, `APP_URL`).

### Render env var setup

In the Render Dashboard, **Environment** → **Environment Variables**:

| Key | Type | Value |
|---|---|---|
| `NODE_ENV` | Plain | `production` |
| `APP_URL` | Plain | `https://<your-production-domain>` — **MUST be set before first deploy** |
| `DEV_PREMIUM` | Plain | `false` |
| `VITE_SUPABASE_URL` | Plain | Your production Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Plain | Your production Supabase anon key |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Plain | Your production Supabase publishable key (if used) |
| `SUPABASE_URL` | Plain | Same origin as `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | **NEW** rotated service-role key |
| `STRIPE_SECRET_KEY` | Secret | Live mode `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Secret | Webhook signing secret from Stripe Dashboard |
| `STRIPE_PRICE_ID_MONTHLY` | Plain | Live monthly price ID |
| `STRIPE_PRICE_ID_ANNUAL` | Plain | Live annual price ID |
| `STRIPE_PRICE_ID` | Plain | Legacy/fallback price ID (optional) |
| `GEMINI_API_KEY` | Secret | Google Cloud API key |

---

## 4. Health Check Decision

**Decision:** A `/healthz` endpoint has been added to `server.ts` (Step 12 of the plan).

Implementation (`server.ts`, after `/api/me/premium`):

```
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
```

- Returns `200` with `{ "ok": true }`
- Reveals no configuration
- Calls no external service
- Not authenticated
- Registered before the SPA catch-all so it is never shadowed

Use `GET /healthz` as the Render health check path.

---

## 5. Preview URL Warning

Render assigns an `onrender.com` URL to every Web Service before a custom domain is attached.

**Do NOT configure the following around a temporary Render hostname:**

- Supabase Site URL
- Supabase auth redirects (password recovery, email confirmation)
- Stripe return URLs (success, cancel, portal-return)
- Stripe webhook endpoint
- Email confirmation URLs

**Reason:** When the custom domain is attached, Render replaces the `onrender.com` hostname. Any URLs configured against the temporary hostname will break silently or require manual re-entry.

**If temporary preview testing is needed:**

1. Test the application via the `onrender.com` URL for UI/build verification only.
2. Do NOT configure Supabase Site URL, auth redirects, or Stripe URLs against the temporary hostname.
3. After attaching the custom domain, configure all production URLs using the canonical domain (see Section 7).
4. Then test auth flows and checkout end-to-end.

The canonical production origin must be selected first wherever practical.

---

## 6. Domain Requirements

**The user must decide on one canonical production domain.** Do NOT register or choose one automatically.

Suggested naming patterns (choose one):

- `bodysignal.<TLD>`
- `getbodysignal.<TLD>`
- `usebodysignal.<TLD>`

Once chosen, the **same origin** must populate:

| Setting | Value |
|---|---|
| `APP_URL` (server env) | `https://<domain>` |
| Supabase Site URL | `https://<domain>` |
| Supabase auth redirect: password recovery | `https://<domain>/?auth=recovery` |
| Supabase auth redirect: email confirmation | `https://<domain>/?auth=confirm` |
| Stripe success URL | `https://<domain>/?billing=success` |
| Stripe cancel URL | `https://<domain>/?billing=cancelled` |
| Stripe portal return URL | `https://<domain>/?billing=portal-return` |
| Stripe webhook URL | `https://<domain>/api/billing/webhook` |

---

## 7. Supabase Service-Role Rotation Checklist

The `SUPABASE_SERVICE_ROLE_KEY` was previously exposed in a development chat. It must be rotated before production deployment.

**Do NOT perform rotation automatically.** Follow this manual sequence:

1. Open the Supabase Dashboard → your project → **Settings** → **API**.
2. Locate the service-role key in the **service_role** section.
3. Click **Rotate** (or **Regenerate**) to generate a new key.
4. Copy the **NEW** service-role credential immediately (it is only shown once).
5. Store the NEW value only in the Render secret env (`SUPABASE_SERVICE_ROLE_KEY`).
6. Update your local `.env` with the NEW value if needed for local testing.
7. On the Supabase Dashboard, **revoke** the old service-role key.
8. Click **Redeploy** (or restart) the Render service so it picks up the new key.
9. Verify server-side routes that use the admin client work:
   - `POST /api/billing/create-checkout-session`
   - `POST /api/billing/create-portal-session`
   - `DELETE /api/me/account`
   - `POST /api/billing/webhook` (Stripe webhook)
10. If practical, verify the old credential no longer works (attempt a Supabase admin call with it).

---

## 8. SMTP / Email Configuration Checklist

Email delivery is not yet configured. Password reset and confirmation emails will not send until SMTP is set up.

1. **Choose an email provider** (e.g., SendGrid, Resend, Mailgun) and obtain SMTP credentials.
2. In the Supabase Dashboard → **Settings** → **Email** → **SMTP Settings**, configure the SMTP provider.
3. **Verify the sender domain/email** (SPF/DKIM/DMARC records) with your DNS provider.
4. Keep `mailer_autoconfirm = true` initially so existing users can still sign up while you test.
5. Test the **password reset email**: trigger a reset, confirm the email is delivered.
6. Verify the `?auth=recovery` callback redirects and exchanges the code for a session.
7. Test the **confirmation email** in a controlled environment (e.g., a non-production auth user).
8. Verify the `?auth=confirm` callback works end-to-end.
9. Only after email delivery and callback flows are verified, consider disabling `mailer_autoconfirm`.

Do not change live Supabase auth config in this batch.

---

## 9. Stripe Live Checklist

Stripe must be switched to Live mode and configured with production products/prices. **Do NOT create Stripe products/prices in this batch.**

1. In the Stripe Dashboard, switch to **Live mode** (toggle in the left sidebar).
2. Identify the correct monthly price (use an existing live price — do **not** create new ones here).
3. Identify the correct annual price.
4. Set the live `STRIPE_SECRET_KEY` in the Render env (`sk_live_...`).
5. Set `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_ANNUAL` to the live price IDs in Render.
6. Deploy (restart) the Render service so env vars take effect.
7. In the Stripe Dashboard → **Developers** → **Webhooks**, create a webhook endpoint:
   ```
   https://<domain>/api/billing/webhook
   ```
8. Subscribe the webhook to these events (already handled in `server.ts`):
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
9. Copy the webhook **signing secret** into `STRIPE_WEBHOOK_SECRET` in Render.
10. Restart/redeploy the Render service.
11. Test checkout flow with Stripe's live-approved test procedure (use real card test numbers from Stripe Docs).

Do not create Stripe products/prices in this batch — those are user actions in the Stripe Dashboard.

---

## 10. Branch Strategy Decision

The production candidate currently lives on `experiment/3d-medical-ui`.

As of this batch:

- **Commit distance from main to experiment branch:** 49 commits ahead
- **Current HEAD:** `2232e3c96ef9aa3755df7ea5a523dc6278fcd0ae` on `experiment/3d-medical-ui`
- **main HEAD:** `3d6f64e Wire Stripe checkout and webhook premium sync`

**Recommendation:** This is a USER DECISION. Consider:

- **Deploy directly from `experiment/3d-medical-ui`:** Faster to get to production, but the experiment branch may contain incomplete or experimental work not yet stable for production.
- **Merge into `main` first:** Safer. The `experiment/3d-medical-ui` branch is 49 commits ahead and includes significant UI refactoring. Merging into `main` after review ensures the production branch has a clean, reviewed history and allows `main` to be the exclusive production deployment branch.

Do NOT merge automatically. Choose based on your release risk tolerance.

---

## 11. Secret Scan Result

A repository-wide secret scan was performed to verify no real secrets are committed:

- `.gitignore` excludes `.env*` (except `.env.example`) — confirmed
- `.gitignore` excludes `tmp-validate/` — confirmed
- `.dockerignore` excludes `.env*` — confirmed
- No `sk_live_`, `sk_test_`, `whsec_`, or `service_role` values found in tracked files
- The local `.env` file (with placeholder/old values) is NOT tracked by git

**No actual deployment attempted.** No real domain invented. No live external services called. No live Supabase or Stripe modifications made.
