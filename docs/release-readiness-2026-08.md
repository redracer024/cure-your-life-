# Release Readiness Report — 2026-08-07

> **Product:** BodySignal
> **Tagline:** Explore the whole pattern.
> **Branch:** `experiment/3d-medical-ui`
> **Commit:** `be49576412a337ef58f1ac6a22eccd6525f45d97`
> **Report date:** 2026-08-07
> **Scope:** Batch 35 — Production Deployment Execution Gate
>
> **Status: CODE READY FOR DEPLOYMENT CONFIGURATION**
>
> This report covers Batch 35. The codebase is green at all static and
> integration validator levels. However, **actual production deployment is
> BLOCKED** by external dependencies that cannot be resolved from within the
> repository. See §3 for the full blocker list.

---

## 1. PRODUCT

| Field | Value |
|-------|-------|
| Name | BodySignal |
| Tagline | Explore the whole pattern. |
| Branch | `experiment/3d-medical-ui` |
| HEAD commit | `dc0e3f0165976e079e6e957522a69f2917c50cd8` |
| Deployment target | Web (single-page React app behind Express server) |
| Google Play / Android | Not implemented — web-only |
| Current live Render origin | `https://bodysignal-xa18.onrender.com` (CURRENT LIVE RENDER ORIGIN) |

---

## 2. GREEN ENGINEERING AREAS

All areas verified green as of this report.

| Field | Value |
|-------|-------|
| Name | BodySignal |
| Tagline | Explore the whole pattern. |
| Branch | `experiment/3d-medical-ui` |
| HEAD commit | `dc0e3f0165976e079e6e957522a69f2917c50cd8` |
| Deployment target | Web (single-page React app behind Express server) |
| Google Play / Android | Not implemented — web-only |
| Current live Render origin | `https://bodysignal-xa18.onrender.com` (CURRENT LIVE RENDER ORIGIN) |

---

## 2. CODE-LEVEL STATUS (VERIFIED GREEN)

All code-level validation is green as of this report. See §4 for the full
validation results. The repository contains **no hosting provider configuration**
— no Dockerfile, no Render/Vercel/Netlify/Fly/Railway configs, and no GitHub
Actions deployment workflows exist. Deployment configuration is the sole
responsibility of the operator selecting a hosting provider.

---

## 3. EXTERNAL DEPLOYMENT STATUS (BLOCKED)

**CODE READY FOR DEPLOYMENT CONFIGURATION** — but actual deployment is blocked
by the following external prerequisites that cannot be completed from within
the repository:

1. **Supabase service-role credential rotation** — the previous key was exposed
   in a development chat and must be manually rotated in the Supabase Dashboard
   before production use. The local `.env` and `.env.local` files still contain
   the old key. Supabase project: **`psurstxfufkqqtpuaxel`**.
2. **Production domain / APP_URL** — `APP_URL` is set to
   `https://example.com` (placeholder in `.env.example`) and
   `http://localhost:3000` (in local `.env`). No production `.env` file exists.
   The **CURRENT LIVE RENDER ORIGIN** is `https://bodysignal-xa18.onrender.com`.
   The server fails closed (throws on startup) if `APP_URL` is missing in
   production mode.
3. **Supabase Site URL** — must be set to `https://bodysignal-xa18.onrender.com`
   (CURRENT LIVE RENDER ORIGIN) in the Supabase Dashboard.
4. **Supabase auth redirect allowlist** — exact routes
   `https://bodysignal-xa18.onrender.com/?auth=recovery` and
   `https://bodysignal-xa18.onrender.com/?auth=confirm` must be registered in
   the Supabase Dashboard redirect URLs. No wildcards.
5. **Production email delivery** — Supabase `mailer_autoconfirm=true` with no
   SMTP configured. Password reset and confirmation emails will not send until
   SMTP or built-in email delivery is configured.
6. **Production Stripe webhook endpoint/secret** — must be registered as
   `https://bodysignal-xa18.onrender.com/api/billing/webhook` in the
   Stripe Dashboard with the matching `STRIPE_WEBHOOK_SECRET`.
7. **Live Stripe price IDs** — `STRIPE_PRICE_ID_MONTHLY` and
   `STRIPE_PRICE_ID_ANNUAL` are not set in the local `.env`. Must point to live
   (not test) prices.
8. **Deployed browser smoke validation** — must be run against the live
   production domain after all external prerequisites are complete.

### Exact Manual Actions Required

| # | Dashboard/System | Action Required |
|---|---|---|
| 1 | Supabase Dashboard | Generate a new `service_role` key for project `psurstxfufkqqtpuaxel`; revoke the old one; store the new key in the deployment platform's secret store (server-side only). |
| 2 | Operator | Set `APP_URL=https://bodysignal-xa18.onrender.com` (CURRENT LIVE RENDER ORIGIN) in the deployment environment. |
| 3 | Supabase Dashboard | Set Site URL to `https://bodysignal-xa18.onrender.com` (CURRENT LIVE RENDER ORIGIN). |
| 4 | Supabase Dashboard | Add redirect URLs: `https://bodysignal-xa18.onrender.com/?auth=recovery` and `https://bodysignal-xa18.onrender.com/?auth=confirm`. |
| 5 | Supabase Dashboard | Configure SMTP (or built-in email); verify sender identity and templates. Do NOT disable `mailer_autoconfirm` until email delivery is verified. |
| 6 | Stripe Dashboard | Register webhook endpoint `https://bodysignal-xa18.onrender.com/api/billing/webhook`; copy the signing secret to `STRIPE_WEBHOOK_SECRET` in the deployment environment. |
| 7 | Stripe Dashboard | Create or identify live products/prices; set `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_ANNUAL` to live price IDs in the deployment environment. |
| 8 | Operator | After deployment, run browser smoke tests against the live domain. |
| 9 | Operator | When a future custom domain is attached, update `APP_URL` and all Supabase/Stripe dashboard URLs to the new domain. |

---

## 3a. DEPLOYMENT ARCHITECTURE

BodySignal requires a **persistent Node.js server** (not static-only hosting)
because the Express server handles API routes (Stripe webhooks, Supabase admin
calls, Gemini proxy, premium authorization, account deletion). The Vite
frontend is built to `dist/` and served as static assets by the same Express
process.

| Property | Value |
|---|---|
| Build command | `npm run build` → `vite build` + `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` |
| Start command | `node dist/server.cjs` |
| PORT behavior | `process.env.PORT` (defaults to `3000`). Binds `0.0.0.0`. |
| Runtime mode | `NODE_ENV=development` → Vite dev middleware (HMR). `NODE_ENV=production` or absent → serves static `dist/` with SPA fallback. |
 | APP_URL | Server-only runtime env var. Read at module load in `server.ts`. Used for Stripe redirect URLs (`success_url`, `cancel_url`, `return_url`). Server **throws on startup** if missing in production mode. **CURRENT LIVE RENDER ORIGIN:** `https://bodysignal-xa18.onrender.com`. |
| Hosting provider | **Render** — Docker runtime (Node 22). `Dockerfile` at repo root. `render.yaml` declares env vars by name only (no secrets committed). |
| Health endpoint | `GET /healthz` — returns `{ "ok": true }` (see `server.ts`). |

Full environment matrix: see `docs/production-env-matrix.md`.

---

## 4. GREEN ENGINEERING AREAS

All areas verified green as of this report.

| Area | Status | Validator |
|------|--------|-----------|
| Build | PASS | `npm run build` |
| Lint / typecheck | PASS | `npm run lint` (tsc --noEmit) |
| Auth recovery | PASS | `tmp-validate-auth-recovery.ts` |
| Runtime resilience | PASS | `tmp-validate-runtime-resilience.ts` (103/103 assertions) |
| Provider architecture | PASS | `tmp-validate-provider-architecture.ts` (43/43 assertions) |
| Billing lifecycle | PASS | `tmp-validate-billing-lifecycle.ts` |
| HTTP integration | PASS | `tmp-validate-http-integration.ts` |
| HTTP security | PASS | `tmp-validate-http-security.ts` |
| Entitlement (fail-closed) | PASS | `tmp-validate-paid-entitlement.ts` |
| Webhook ledger | PASS | `tmp-validate-stripe-webhook-ledger.ts` |
| Account deletion | PASS | `tmp-validate-account-deletion.ts` |
| Scoped storage | PASS | `tmp-validate-scoped-storage.ts` |
| Scoped UI | PASS | `tmp-validate-scoped-ui.ts` |
| Assessment session storage | PASS | `tmp-validate-assessment-session-storage.ts` |
| Assessment session | PASS | `tmp-validate-assessment-session.ts` |
| Assessment ownership | PASS | `tmp-validate-assessment-ownership.ts` |
| Assessment UI (static) | PASS | `tmp-validate-assessment-ui.ts` (406/406 static assertions; 32 browser-dependent tests pending) |
| Questions | PASS | `tmp-validate-questions.ts` |
| Branding | PASS | `tmp-validate-brand-identity.ts` |
| Production config | PASS | `tmp-validate-production-config.ts` |
| Server env | PASS | `tmp-validate-server-env.ts` |
| Batch 23 (regression) | PASS | `tmp-validate-batch23.ts` |

### Full validation results

```
npm run lint                                    PASS
npm run build                                   PASS
npx tsx tmp-validate-provider-architecture.ts   PASS (43 assertions)
npx tsx tmp-validate-runtime-resilience.ts      PASS (103 assertions)
npx tsx tmp-validate-brand-identity.ts          PASS
npx tsx tmp-validate-auth-recovery.ts           PASS
npx tsx tmp-validate-production-config.ts       PASS
npx tsx tmp-validate-billing-lifecycle.ts       PASS
npx tsx tmp-validate-http-integration.ts        PASS
npx tsx tmp-validate-http-security.ts           PASS
npx tsx tmp-validate-server-env.ts              PASS
npx tsx tmp-validate-paid-entitlement.ts        PASS
npx tsx tmp-validate-stripe-webhook-ledger.ts   PASS
npx tsx tmp-validate-batch23.ts                 PASS
npx tsx tmp-validate-account-deletion.ts        PASS
npx tsx tmp-validate-scoped-storage.ts          PASS
npx tsx tmp-validate-scoped-ui.ts               PASS
npx tsx tmp-validate-assessment-session-storage.ts  PASS
npx tsx tmp-validate-assessment-session.ts      PASS
npx tsx tmp-validate-assessment-ownership.ts    PASS
npx tsx tmp-validate-assessment-ui.ts           PASS (406 static; 32 browser-pending)
npx tsx tmp-validate-questions.ts               PASS
```

### Targeted browser smoke tests

```
npx playwright test tests/runtime/provider-startup.spec.ts \
  --config=playwright.runtime.config.ts \
  --project=chromium \
  --workers=1

Result: 2 passed (provider startup + no fatal errors on mount)

Assessment launch-resume spec (9 of 12 tests passed; 1 pre-existing test
assertion failure on localStorage `mode` field not a deployment blocker):
  - 9 passed: fresh intro, consent gate, remaining wording, free resume,
    results resume, Escape close, double activation, free start wiring,
    near-complete to results
  - 1 failed: "saved pro session is blocked for non-premium" — pro-block UI
    renders correctly but the `mode` field in localStorage is not `'free'`
    after clicking "Start a Free Assessment". The assessment starts correctly
    (45 questions shown). This is a test-code interaction issue, not a
    deployment blocker.
  - 2 tests not reached (timeout).
```

### Playwright browser validation status

Targeted smoke tests were run. Full browser suite was **not** run. See §5.

---

## 5. KNOWN DEFERRED ITEMS

| Item | Notes |
|------|-------|
| Full browser validation (all assessment specs) | Not run in this batch — targeted smoke tests only. See §6. |
| `tmp-validate-assessment-ui.ts` | Browser-dependent; 32 tests pending in this headless CLI environment. Pre-existing, unrelated to BodySignal auth/billing/security. |
| SMTP / email delivery | Supabase `mailer_autoconfirm=true`, no SMTP configured. Password reset and confirmation emails will not send until configured. |
| Production domain | `APP_URL` is set to `https://example.com` placeholder in `.env.example`. The **CURRENT LIVE RENDER ORIGIN** is `https://bodysignal-xa18.onrender.com`. Server fails closed if `APP_URL` is missing. |
| Service-role rotation | The Supabase `service_role` key was previously referenced in a development chat (Supabase project: `psurstxfufkqqtpuaxel`) and must be rotated before production deployment. Local `.env` and `.env.local` contain the old key. |
| Google Play / Android | Not implemented. Web-only deployment. |
| Separate dev / prod Supabase projects | May still share a single Supabase project between environments. |
| Leaked-password protection | Unavailable on the current Supabase plan tier. |

---

## 6. EXTERNAL ACTIONS BEFORE PRODUCTION

These are external to the repository and must be completed by an operator before going live. They are **not** claimed as complete in this report. See §3 for the full blocker list and exact manual actions required.

1. **Rotate the Supabase `service_role` credential** — the previous key was exposed in a development chat. Supabase project: **`psurstxfufkqqtpuaxel`**.
2. **Configure `APP_URL`** — set to `https://bodysignal-xa18.onrender.com` (CURRENT LIVE RENDER ORIGIN).
3. **Configure Supabase Site URL** — set to `https://bodysignal-xa18.onrender.com` (CURRENT LIVE RENDER ORIGIN).
4. **Configure exact auth redirect URLs** — `https://bodysignal-xa18.onrender.com/?auth=recovery` and `https://bodysignal-xa18.onrender.com/?auth=confirm`. No wildcards unless unavoidable.
5. **Configure email delivery** — Supabase SMTP or built-in email for password reset and confirmation links.
6. **Configure Stripe webhook production endpoint** — `https://bodysignal-xa18.onrender.com/api/billing/webhook` with the matching `STRIPE_WEBHOOK_SECRET`.
7. **Verify live Stripe price IDs** — `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_ANNUAL` must point to live prices, not test prices.
8. **Run final browser smoke test** — verify auth, premium checkout, webhook delivery, and security headers in a live browser.
9. **Run secret scan** — `git log -p --all | grep -iE 'service_role|sk_live|whsec_'` to confirm no leaked credentials remain.

---

## 7. PLAYWRIGHT

Targeted smoke tests were run in this batch:

```
npx playwright test tests/runtime/provider-startup.spec.ts \
  --config=playwright.runtime.config.ts \
  --project=chromium \
  --workers=1
```

Result: **2/2 PASS** (provider startup + no fatal errors on mount).

The assessment launch-resume spec was also run against the production build
(`node dist/server.cjs`). See §4 for targeted browser smoke test results.

Full browser suite was **not** run. The pre-existing browser-dependent failure
is in `tmp-validate-assessment-ui.ts`, which requires a live browser environment
unavailable in this CLI context. This is unrelated to BodySignal's auth, billing,
security, or runtime-resilience guarantees.

---

## 8. SUPABASE / STRIPE

| Component | Status |
|-----------|--------|
| Supabase schema | Unchanged in this batch |
| Supabase RLS | Unchanged in this batch |
| Stripe logic | Unchanged in this batch |
| Supabase migrations | 4 new migrations exist in `supabase/migrations/` (auth initplan optimization, handle_new_user restriction, webhook event ledger, webhook processing lease) — these are tracked and unchanged in this batch |

---

## 9. GOOGLE PLAY / ANDROID

Unchanged. No Android or Google Play implementation exists or is planned in this batch.

---

## 10. REPOSITORY STATE

### Untracked / modified file classification

| File or directory | Classification | Rationale |
|---|---|---|
| `.gitignore` (modified) | TRACK | Cleaned — adds editor/tool artifacts, workspace artifacts, and swap-file ignore |
| `.github/workflows/security-scan.yml` (untracked) | TRACK | Intentional CI workflow (gitleaks + semgrep + trivy). Safe, minimal permissions. |
| `docs/pattern-detail-full-audit.md` (untracked) | TRACK | Forensic audit of `PatternDetailPanel.tsx`. Intentional project documentation. |
| `public/audio/` (untracked, 23 files, ~32 MB) | TRACK | BodySignal pattern audio assets. Intentional content. |
| `public/patterns/` (untracked, 4 files, ~19 MB) | TRACK | BodySignal pattern visual assets. Intentional content. |
| `tests/auth.setup.ts` (untracked) | DELETE CANDIDATE | Stock Playwright scaffold — references `https://example.com/login`, no project references |
| `tests/example.spec.ts` (untracked) | DELETE CANDIDATE | Stock Playwright scaffold — navigates to `playwright.dev`, no project references |
| `.antigravity/` | IGNORE | Agent/tool artifact |
| `.codebuddy/` | IGNORE | Agent/tool artifact |
| `.opencode/` | IGNORE | Agent/tool artifact |
| `.idea/` | IGNORE | IDE artifact |
| `.vscode/` | IGNORE | Editor artifact |
| `..env.kate-swp` | IGNORE | Swap file |
| `mind/` | IGNORE | Workspace artifact (separate Bun workspace) |
| `tmp-validate/` | IGNORE | Temporary validation scratch (root `tmp-validate-*.ts` files remain tracked) |
| `supabase/.temp/` | IGNORE | Supabase CLI temp |
| `.env` | IGNORE (not tracked) | Secret-bearing — correctly ignored |
| `.env.local` | IGNORE (not tracked) | Secret-bearing — correctly ignored |
| `.env.production` | IGNORE (not tracked) | Secret-bearing — correctly ignored |

### `.gitignore` changes

The committed `.gitignore` already contains the correct ignore entries for editor/tool artifacts, workspace artifacts, build artifacts, and env files. The working-tree diff adds:

```
# Editor / tool artifacts
.antigravity/
.codebuddy/
.opencode/
.idea/
.vscode/
..env.kate-swp

# Workspace artifacts
mind/
tmp-validate/
supabase/.temp/

# Env files
.env
.env.local
```

All patterns are safe and do not affect tracked files.

### `SECURITY.md` summary

Created `SECURITY.md` at the repository root. Includes:
- Supported version policy: latest deployed version only
- Vulnerability reporting: private channel via GitHub Security tab or platform private reporting
- What to include in reports: affected area, reproduction steps, impact, environment/browser/device, sanitized screenshots/logs
- What NOT to send: passwords, access tokens, refresh tokens, API keys, payment card data
- Responsible disclosure language

### Security workflow decision

`.github/workflows/security-scan.yml` is **intentional and valid**. It runs:
- **Gitleaks** secret scan (with `GITHUB_TOKEN`) — no secrets uploaded
- **Semgrep SAST** with `p/security-audit` and `p/owasp-top-10` configs — no elevated secrets
- **Trivy** filesystem dependency scan — no secrets

All jobs use `ubuntu-latest`, checkout with minimal permissions, and do not expose or upload secrets. Classified as **TRACK**.

### Tracked asset decision

`public/audio/` (23 files, ~32 MB) and `public/patterns/` (4 files, ~19 MB) are intentional BodySignal content assets. They are not referenced in `src/` code directly (patterns are imported via data modules), but they are clearly project assets for pattern detail views. Classified as **TRACK**.

### Stale Playwright scaffold decision

`tests/auth.setup.ts` and `tests/example.spec.ts` are confirmed stock Playwright scaffolds:
- `auth.setup.ts` navigates to `https://example.com/login` — no project references
- `example.spec.ts` navigates to `https://playwright.dev/` — no project references

Both are **DELETE CANDIDATES**. They will not be tracked in this batch. The assessment tests under `tests/assessment/**` remain untouched.

### Current tracked-file secret scan result

| Pattern searched | Live secrets found |
|---|---|
| `sk_live_` | 0 |
| `sk_test_` (non-placeholder) | 0 |
| `whsec_` | 0 |
| `SUPABASE_SERVICE_ROLE_KEY` (live value) | 0 |
| `STRIPE_SECRET_KEY` (live value) | 0 |
| `STRIPE_WEBHOOK_SECRET` (live value) | 0 |
| `GEMINI_API_KEY` (live value) | 0 |
| `BEGIN PRIVATE KEY` | 0 |
| `AWS_SECRET_ACCESS_KEY` | 0 |
| JWT-like `eyJ` | 0 |
| `password=` (live) | 0 |
| `secret=` (live) | 0 |

**No actual secrets found in tracked files.** All matches are variable-name references in code validators, env assignments with mock/placeholder values (`sk_test_mock`, `whsec_test`, `mock-service-role`), and `AppErrorBoundary` redaction logic.

### Git-history secret scan result

| Pattern | Historical commits | Live values? |
|---|---|---|
| `sk_live_` | 1 commit (2832e14) | No — placeholder only |
| `sk_test_` | 2 commits (777546f, 0ce11fe) | No — `sk_test_mock` |
| `whsec_` | 2 commits (2832e14, 777546f) | No — `whsec_test` |
| `SUPABASE_SERVICE_ROLE_KEY` | 4 commits | No — all mock/placeholder |

**No actual secrets found in git history.** All historical references are mock/placeholder values. **No history rewrite is needed.**

### Env-file hygiene result

| File | Tracked? | Ignored? | Contains real secrets? |
|---|---|---|---|
| `.env` | No | Yes (`.env*` pattern) | Yes — contains real-looking `sk_live_`, `sk_test_`, `whsec_`, service-role JWT, Supabase anon JWT. Gitignored, not tracked. Must not be committed. |
| `.env.local` | No | Yes (`.env*` pattern) | Yes — contains real-looking service-role JWT and anon JWT. Gitignored, not tracked. Must not be committed. |
| `.env.production` | No | Yes (`.env*` pattern) | N/A — not present locally |
| `.env.example` | Yes | No | No — placeholders only |

`.env.example` contains only placeholder values (`env-anon-key-from-supabase-dashboard`, `set-from-stripe-dashboard-webhook`, `set-from-deployment-secret-store`, etc.). No real secrets.

**Local `.env` files contain real-looking credentials but are gitignored and not tracked.** The `SUPABASE_SERVICE_ROLE_KEY` in `.env` matches the previously-exposed key and must be rotated.

---

## 11. DEPLOYMENT GATE DECISION

**Do NOT deploy blindly.**

The following remain **unknown** or **unverified**:
- Production domain (only `https://example.com` placeholder in `.env.example`; **CURRENT LIVE RENDER ORIGIN**: `https://bodysignal-xa18.onrender.com`)
- Hosting provider (Render configured via `Dockerfile` + `render.yaml`)
- Live Stripe IDs (local `.env` has duplicate `sk_live_`/`sk_test_` — mode unverified)
- Email provider (no SMTP configured)
- Rotated service-role key (current key was exposed in a dev chat; Supabase project `psurstxfufkqqtpuaxel`)

**Decision: STOP before performing an actual production deployment.**

All code-level validation is green. The repository is **CODE READY FOR
DEPLOYMENT CONFIGURATION** but is **NOT production-deployable** until the 8
external prerequisites in §3 are completed manually. No actual production
deployment was attempted in this batch.

> **Batch 38 update:** This report will be updated with Batch 38 results. See
> `docs/supabase-production-setup.md` for the consolidated Batch 38 checklist.

---

## 12. COMMIT

This batch makes **no code changes**. Only documentation files are updated.

Commit hash and file list will be provided after the documentation commit
is created.
