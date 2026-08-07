# Release Readiness Report — 2026-08-07

> **Product:** BodySignal
> **Tagline:** Explore the whole pattern.
> **Branch:** `experiment/3d-medical-ui`
> **Commit:** `53b5f104d159da82304836a1259803c513e8274b`
> **Report date:** 2026-08-07
> **Scope:** Batch 31 — Release Housekeeping + Repository Security Readiness

---

## 1. PRODUCT

| Field | Value |
|-------|-------|
| Name | BodySignal |
| Tagline | Explore the whole pattern. |
| Branch | `experiment/3d-medical-ui` |
| HEAD commit | `53b5f104d159da82304836a1259803c513e8274b` |
| Deployment target | Web (single-page React app behind Express server) |
| Google Play / Android | Not implemented — web-only |

---

## 2. GREEN ENGINEERING AREAS

All areas verified green as of this report.

| Area | Status | Validator |
|------|--------|-----------|
| Build | PASS | `npm run build` |
| Lint / typecheck | PASS | `npm run lint` |
| Auth recovery | PASS | `tmp-validate-auth-recovery.ts` |
| Runtime resilience | PASS | `tmp-validate-runtime-resilience.ts` (103/103 assertions) |
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
| Questions | PASS | `tmp-validate-questions.ts` |
| Branding | PASS | `tmp-validate-brand-identity.ts` |
| Production config | PASS | `tmp-validate-production-config.ts` |
| Server env | PASS | `tmp-validate-server-env.ts` |
| Batch 23 (regression) | PASS | `tmp-validate-batch23.ts` |

### Full validation results

```
npm run lint                                    PASS
npm run build                                   PASS
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
npx tsx tmp-validate-questions.ts               PASS
```

> **Playwright is intentionally not run in this batch.**
> See §5 for the pre-existing browser-dependent failure.

---

## 3. KNOWN DEFERRED ITEMS

| Item | Notes |
|------|-------|
| Playwright browser validation | Not run in this batch — see §5 |
| `tmp-validate-assessment-ui.ts` | Browser-dependent; cannot be run in this headless CLI environment. Pre-existing, unrelated to BodySignal auth/billing/security. |
| SMTP / email delivery | Supabase `mailer_autoconfirm=true`, no SMTP configured. Password reset and confirmation emails will not send until configured. |
| Production domain | `APP_URL` is set to `https://example.com` placeholder in `.env.example`. Must be set to the real domain before deployment. Server fails closed if missing. |
| Service-role rotation | The Supabase `service_role` key was previously referenced in a development chat and must be rotated before production deployment. |
| Google Play / Android | Not implemented. Web-only deployment. |
| Separate dev / prod Supabase projects | May still share a single Supabase project between environments. |
| Leaked-password protection | Unavailable on the current Supabase plan tier. |

---

## 4. EXTERNAL ACTIONS BEFORE PRODUCTION

These are external to the repository and must be completed by an operator before going live. They are **not** claimed as complete in this report.

1. **Rotate the Supabase `service_role` credential** — the previous key was exposed in a development chat.
2. **Configure `APP_URL`** — set to the exact production origin (https://...).
3. **Configure Supabase Site URL** — set to `https://<production-domain>`.
4. **Configure exact auth redirect URLs** — `https://<production-domain>/?auth=recovery` and `https://<production-domain>/?auth=confirm`. No wildcards unless unavoidable.
5. **Configure email delivery** — Supabase SMTP or built-in email for password reset and confirmation links.
6. **Configure Stripe webhook production endpoint** — `https://<production-domain>/api/billing/webhook` with the matching `STRIPE_WEBHOOK_SECRET`.
7. **Verify live Stripe price IDs** — `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_ANNUAL` must point to live prices, not test prices.
8. **Run final browser smoke test** — verify auth, premium checkout, webhook delivery, and security headers in a live browser.
9. **Run secret scan** — `git log -p --all | grep -iE 'service_role|sk_live|whsec_'` to confirm no leaked credentials remain.

---

## 5. PLAYWRIGHT

Playwright is intentionally **not run** in this batch. The pre-existing browser-dependent failure is in `tmp-validate-assessment-ui.ts`, which requires a live browser environment unavailable in this CLI context. This is unrelated to BodySignal's auth, billing, security, or runtime-resilience guarantees.

---

## 6. SUPABASE / STRIPE

| Component | Status |
|-----------|--------|
| Supabase schema | Unchanged in this batch |
| Supabase RLS | Unchanged in this batch |
| Stripe logic | Unchanged in this batch |
| Supabase migrations | 4 new migrations exist in `supabase/migrations/` (auth initplan optimization, handle_new_user restriction, webhook event ledger, webhook processing lease) — these are tracked and unchanged in this batch |

---

## 7. GOOGLE PLAY / ANDROID

Unchanged. No Android or Google Play implementation exists or is planned in this batch.

---

## 8. REPOSITORY STATE

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
| `.env` | No | Yes | N/A (not present) |
| `.env.local` | No | Yes | N/A (not present) |
| `.env.production` | No | Yes (`.env*` pattern) | N/A |
| `.env.example` | Yes | No | No — placeholders only |

`.env.example` contains only placeholder values (`env-anon-key-from-supabase-dashboard`, `set-from-stripe-dashboard-webhook`, `set-from-deployment-secret-store`, etc.). No real secrets.

---

## 9. COMMIT

Commit hash and file list will be provided after validation passes.
