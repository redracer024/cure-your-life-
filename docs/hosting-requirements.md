# Production Hosting Requirements — BodySignal

> **Product:** BodySignal
> **Tagline:** Explore the whole pattern.
> **Scope:** Web deployment to a production domain. Web-only — no Google Play / Android.
> **Last updated:** 2026-08-07

---

## 1. Runtime Requirements

| Requirement | Detail |
|---|---|
| Runtime | **Node.js** (LTS, v20+) — required for `express` + `@supabase/supabase-js` + `stripe` server bundles |
| Process model | A **persistent HTTP process** — not static-only hosting |
| Custom domain | Yes — must support attaching a custom production domain |
| TLS | Yes — platform terminates HTTPS (or provides TLS termination) |
| Environment injection | Platform must inject runtime **environment variables / secrets** |
| PORT | Platform injects `PORT`; the server reads `process.env.PORT` (defaults to `3000`) and binds `0.0.0.0` |
| Outbound HTTPS | Required — the server makes outbound HTTPS calls to **Supabase**, **Stripe**, and **Google Gemini** |
| Webhook ingress | Required — Stripe will POST to `POST /api/billing/webhook` |
| Health check | Not formally implemented — server startup logged to stdout |

### Why not static-only hosting?

Static-only hosts (Vercel, Netlify, etc. in "static site" mode, GitHub Pages, S3) cannot
run the Express server that handles `/api/**` routes. BodySignal's server provides:

- `/api/billing/webhook` — Stripe webhook receiver (must be server-side to verify signatures)
- `/api/me/premium` — server-side premium entitlement check (fail-closed)
- `/api/me/account` — account deletion with Stripe cancellation
- `/api/billing/create-checkout-session` — server-side Stripe checkout
- `/api/billing/create-portal-session` — server-side Stripe customer portal
- `/api/me/subscription/reconcile` — subscription reconciliation
- `/api/analyze-symptom` — server-side Gemini proxy (keeps `GEMINI_API_KEY` server-only)

Static-only hosting is **not sufficient**. A Node-capable Application Service is required.

---

## 2. Build & Start

```bash
npm ci          # reproducible install from package-lock.json
npm run build   # → vite build (frontend → dist/) + esbuild (server.ts → dist/server.cjs)
npm start       # → node dist/server.cjs
```

**Build command (exact):** `npm run build`
**Start command (exact):** `npm start` (which runs `node dist/server.cjs`)

The `build` script produces:
- `dist/index.html` — SPA entry point
- `dist/assets/**` — bundled JS/CSS
- `dist/server.cjs` — standalone CommonJS Express server

---

## 3. Listening Behavior

- **PORT**: `process.env.PORT` (defaults to `3000` if unset)
- **Bind address**: `0.0.0.0` (all interfaces — suitable for container/platform ingress)
- **Graceful shutdown**: `SIGTERM` / `SIGINT` trigger `server.close()` allowing in-flight
  requests to finish (10s hard timeout fallback)

---

## 4. Static File Serving & SPA Fallback

In production mode (`NODE_ENV !== "development"`):

- `dist/index.html`, `dist/assets/**` are served via `express.static(distPath)`
- A catch-all `app.get("*")` serves `dist/index.html` for any non-API route (SPA fallback)
- **All `/api/**` routes are registered BEFORE the SPA fallback** — they are never intercepted
- In development mode (`NODE_ENV=development`), Vite dev middleware is mounted instead

---

## 5. Required Persistence & State

| Resource | Persistence model |
|---|---|
| Application database | **None** — server is stateless; data lives in **Supabase** (external) |
| Uploaded user files | **None** — no local file uploads stored on the server |
| Browser state | Client-side `localStorage` only (untrusted for auth) |
| Rate limiting | In-process memory (single-instance; resets on restart) |
| Sessions | Managed by Supabase; server holds no session state |

---

## 6. Provider Selection Table

No single provider is committed to in this repository. The following categories are
suitable based on the requirements above:

| Provider category | Example platforms | Notes |
|---|---|---|
| Render-style Node web service | Render, Fly.io (Node app), Railway | Direct PORT injection; built-in HTTPS/custom domain; simple `npm start` |
| Container host | AWS ECS, Google Cloud Run, Azure Container Apps, Fly.io (Docker) | Push image; platform injects PORT; supports the included `Dockerfile` |
| VPS / self-managed container | DigitalOcean App Platform, Hetzner, Linode with Docker | Full control; operator manages HTTPS/proxy |
| Full-stack platforms | Render, Railway, Fly.io | Good defaults for Node apps; env secret management built-in |

### Evaluation criteria (do NOT claim exact current prices)

- Supports a **persistent Node.js process** (not static-only)
- Supports a **custom domain** with **TLS**
- Supports **runtime environment variable / secret injection**
- Supports **predictable PORT** binding
- Supports **outbound HTTPS** (for Supabase, Stripe, Gemini)
- Supports **webhook ingress** (Stripe → `POST /api/billing/webhook`)
- Reasonable cost for low-traffic initial deployment

---

## 7. Domain Decision Contract

Once a domain is chosen, **ONE canonical origin** drives all of the following.

| Setting | Format |
|---|---|
| `APP_URL` (server env) | `https://<domain>` |
| Supabase Site URL | `https://<domain>` |
| Supabase auth redirect: password recovery | `https://<domain>/?auth=recovery` |
| Supabase auth redirect: email confirmation | `https://<domain>/?auth=confirm` |
| Stripe success URL | `https://<domain>/?billing=success` |
| Stripe cancel URL | `https://<domain>/?billing=cancelled` |
| Stripe portal return URL | `https://<domain>/?billing=portal-return` |
| Stripe webhook URL | `https://<domain>/api/billing/webhook` |
| Password-reset redirect | `https://<domain>/?auth=recovery` |
| Confirmation redirect | `https://<domain>/?auth=confirm` |

### Current live Render origin (in use)

The application is currently deployed and live at:

```
https://bodysignal-xa18.onrender.com
```

This is the **CURRENT LIVE RENDER ORIGIN**. All production-configurable redirects
should use this exact origin until a future custom domain is attached.

**Important:** Render assigns an `onrender.com` URL to every Web Service before
a custom domain is attached. Do NOT configure Supabase Site URL, auth redirects,
Stripe URLs, or webhook endpoints against a *different* temporary hostname —
use the canonical origin consistently. See `docs/render-deployment.md` §5
(Preview URL Warning) for details.

### Future custom domain (not yet in use)

When a custom domain is attached to the Render service, Render replaces the
`onrender.com` hostname. At that time, ALL of the following must be updated
to the new canonical domain:

- `APP_URL` (server env)
- Supabase Site URL
- Supabase auth redirect URLs
- Stripe return URLs (success, cancel, portal-return)
- Stripe webhook endpoint URL + signing secret

Do not register redirects against the temporary Render hostname when a custom
domain is planned — they will break silently and require manual re-entry.

### Placeholder examples only

The domain must be chosen by the operator. These are placeholders, not production values:

```
https://<domain>
https://<domain>/?auth=recovery
https://<domain>/?auth=confirm
https://<domain>/api/billing/webhook
```

`https://example.com` in `.env.example` is a **non-production placeholder** and is
not suitable for live deployment.

---

## 8. Ordered External Setup Sequence

This is the precise sequence an operator must follow. The repository code is ready;
these are external dashboard/runtime actions.

1. Choose hosting provider and production domain
2. Deploy initial app with production secrets **except** email confirmation changes:
   - `NODE_ENV=production`
   - `APP_URL=https://<domain>`
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (canonical frontend key)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
   - `STRIPE_SECRET_KEY` (live), `GEMINI_API_KEY`
   - **Build-time:** ensure `VITE_*` vars are available during Docker build (see
     `docs/supabase-production-setup.md` §6 or `docs/render-deployment.md` §3b)
3. **Rotate Supabase service-role credential** (the old key was exposed in a dev chat)
4. Store the new `SUPABASE_SERVICE_ROLE_KEY` in the host (server-side only)
5. Configure Supabase **Site URL** → `https://<domain>`
6. Configure exact Supabase **redirect URLs** →
   `https://<domain>/?auth=recovery`, `https://<domain>/?auth=confirm` (no wildcards)
7. Configure email provider / SMTP in Supabase
8. Test password-reset email delivery
9. Test email confirmation callback (`/?auth=confirm`)
10. Only then consider disabling `mailer_autoconfirm`
11. Configure **Stripe LIVE** secret key
12. Configure **Stripe LIVE** monthly/annual price IDs
    (`STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_ANNUAL`)
13. Create production Stripe webhook endpoint → `https://<domain>/api/billing/webhook`
14. Configure required webhook events (see below)
15. Store production webhook signing secret → `STRIPE_WEBHOOK_SECRET`
16. Restart the app so new env vars take effect
17. Run checkout test (monthly)
18. Verify premium entitlement via `/api/me/premium`
19. Verify Stripe customer portal
20. Verify account deletion cancels billing
21. Run production browser smoke (auth, checkout, webhook, headers)
22. Run final secret scan: `git log -p --all | grep -iE 'service_role|sk_live|whsec_'`

### Required Stripe webhook event types

Handled in `server.ts` `processStripeWebhookEvent`:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

---

## 9. Docker (Optional)

A `Dockerfile` and `.dockerignore` are included for provider portability. The image:

- Uses Node.js LTS (v20) Alpine base
- Runs `npm ci --omit=dev` for production deps
- Runs `npm run build` in a builder stage
- Serves `node dist/server.cjs` as the `CMD`
- Does **not** copy any `.env` file into the image
- Does **not** bake any secrets (all injected at runtime)
- Runs as a non-root `node` user
- Exposes `PORT` via `ENV PORT=3000` (overridable at runtime)

Dockerfile is optional — direct `npm ci && npm run build && npm start` works on any
Node-capable host without Docker.

---

## 10. What This Does NOT Do

- Does not select or purchase a hosting plan
- Does not purchase or register a domain
- Does not create fake production domains
- Does not rotate credentials (documented as external step)
- Does not modify live Supabase settings
- Does not modify live Stripe settings
- Does not configure SMTP
- Does not add Google Play / Android
- Does not add new product features
- Does not claim deployment is complete
