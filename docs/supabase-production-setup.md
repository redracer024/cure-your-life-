# Supabase Production Setup — BodySignal

> **Product:** BodySignal
> **Tagline:** Explore the whole pattern.
> **Branch:** `experiment/3d-medical-ui`
> **Current HEAD:** `dc0e3f0165976e079e6e957522a69f2917c50cd8`
> **Supabase project:** `psurstxfufkqqtpuaxel`
> **Current live Render origin:** `https://bodysignal-xa18.onrender.com`
> **Last updated:** 2026-08-07
> **Scope:** Production Supabase configuration for the live Render deployment.

---

This document is the authoritative checklist for configuring Supabase
**production** settings. It is part of **Batch 38**.

**Do NOT:**
- expose or print secret values
- commit secrets
- invent credentials
- change Stripe
- add new app features
- disable autoconfirm before email is proven
- run broad Playwright
- modify live Supabase settings automatically

---

## 1. Live Application Origin

| Field | Value |
|---|---|
| **CURRENT LIVE RENDER ORIGIN** | `https://bodysignal-xa18.onrender.com` |
| FUTURE CUSTOM DOMAIN | *(not yet chosen — placeholder: `https://<custom-domain>`)* |
| Supabase project ref | `psurstxfufkqqtpuaxel` |
| Supabase URL | `https://psurstxfufkqqtpuaxel.supabase.co` |
| Docker runtime | Node 22 (`node:22-alpine`) |
| Deployment | Render Web Service (Docker runtime) |

**Origin contract:** The Render origin is the canonical production origin.
A future custom domain would replace this value everywhere (APP_URL, Supabase
Site URL, redirect URLs, Stripe URLs). Do not configure dashboard URLs against
a different temporary hostname.

---

## 2. Render Environment Variables

### Browser-safe (VITE_ prefix — OK for browser bundle)

| Variable | Role | Status |
|---|---|---|
| `VITE_SUPABASE_URL` | Browser client origin | MUST BE SET — `https://psurstxfufkqqtpuaxel.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Browser publishable key | MUST BE SET — rotate if previously exposed |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Alternative browser key | Conditional — used if `VITE_SUPABASE_ANON_KEY` is absent |

### Server-only (never in browser bundle)

| Variable | Role | Status |
|---|---|---|
| `APP_URL` | Production origin | MUST BE SET — `https://bodysignal-xa18.onrender.com` |
| `NODE_ENV` | Runtime mode | MUST be `production` |
| `DEV_PREMIUM` | Dev bypass | MUST be `false` or unset |
| `SUPABASE_URL` | Server admin client origin | MUST BE SET — same as `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server admin credential | **ROTATION REQUIRED** — old key was exposed |
| `STRIPE_SECRET_KEY` | Stripe secret | MUST BE SET (live mode) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing | MUST BE SET |
| `STRIPE_PRICE_ID_MONTHLY` | Monthly price | MUST BE SET (live) |
| `STRIPE_PRICE_ID_ANNUAL` | Annual price | MUST BE SET (live) |
| `GEMINI_API_KEY` | Gemini API key | MUST BE SET |

### Verification

- `.gitignore` — `.env` and `.env.local` are ignored (`.env*` pattern, except
  `.env.example`). Confirmed.
- `.env.example` — contains placeholders only (no real secret values). Confirmed.
- `render.yaml` — declares all env var names by name only with `sync: wait_for_input`;
  no secret values committed. Confirmed.

---

## 3. Credential Rotation

**Status:** The `SUPABASE_SERVICE_ROLE_KEY` was exposed in a development chat.
The old key is present in the local `.env` and `.env.local` files (both
gitignored, not tracked). It must be rotated before production use.

**Live Supabase project:** `psurstxfufkqqtpuaxel`

### Manual rotation steps

1. Open the Supabase Dashboard → project **`psurstxfufkqqtpuaxel`** →
   **Settings** → **API**.
2. Locate the **service_role** key section.
3. Click **Rotate** (or **Regenerate**) to generate a new key.
4. Copy the **NEW** service-role credential immediately (it is only shown once).
5. Store the NEW value only in the Render secret env:
   - Render Dashboard → **Environment** → **Environment Variables**
   - Set `SUPABASE_SERVICE_ROLE_KEY` to the new value (type: Secret).
6. Update your local `.env` and `.env.local` with the NEW value if still needed
   for local testing.
7. On the Supabase Dashboard, **revoke/disable** the old service-role key.
8. Click **Redeploy** (or restart) the Render service so it picks up the new key.
9. Verify authenticated server routes still work:
   - `POST /api/billing/create-checkout-session`
   - `POST /api/billing/create-portal-session`
   - `DELETE /api/me/account`
   - `POST /api/billing/webhook` (Stripe webhook)
   - `GET /api/me/premium`
10. If practical, verify the old credential is no longer accepted (attempt a
    Supabase admin call with it — it should fail).
11. **Never** paste the new secret into logs, docs, commits, prompts, or
    frontend env.

**Do NOT perform rotation automatically.** This is a documented manual process.
No live Supabase mutation is performed by this batch.

---

## 4. Site URL

```
https://bodysignal-xa18.onrender.com
```

This is the **CURRENT LIVE RENDER ORIGIN**. Set this value in the Supabase
Dashboard under **Authentication** → **Settings** → **Site URL**.

When a future custom domain is attached, update this to the new domain.

---

## 5. Redirect Allowlist

Exact redirect URLs to register in the Supabase Dashboard under
**Authentication** → **Settings** → **Redirect URLs**:

| URL | Purpose |
|---|---|
| `https://bodysignal-xa18.onrender.com/?auth=recovery` | Password reset link redirect target |
| `https://bodysignal-xa18.onrender.com/?auth=confirm` | Email confirmation link redirect target |

**Code evidence:**

- `src/hooks/useAuthState.ts:35` — `resetPasswordForEmail` calls with
  `redirectTo: getRedirectTo()` where `getRedirectTo()` returns
  ``${window.location.origin}/?auth=recovery``.
- `src/hooks/useAuthState.ts:66-78` — recovery callback reads `code` from
  URLSearchParams and calls `supabase.auth.exchangeCodeForSession(code)`.
- `src/hooks/useAuthState.ts:80-90` — confirmation callback (`mode === 'confirm'`)
  also calls `supabase.auth.exchangeCodeForSession(code)`.
- `src/lib/auth/authRedirect.ts` — `getAuthMode()` parses the `auth` query param;
  `getRecoveryCode()` reads the `code` param; `clearAuthParams()` removes both
  after use.

**No localhost hardcoding:** The redirect target is derived from
`window.location.origin` at runtime — it is never hardcoded to `localhost` or
`127.0.0.1`. Confirmed via repository scan (no `localhost` or `example.com`
references in `src/**/*.ts*`).

**Do NOT add broad wildcard redirects** unless technically required. None are
required.

---

## 6. SMTP

| Setting | Current Value | Status |
|---|---|---|
| `mailer_autoconfirm` | `true` | **STATUS — do NOT disable until SMTP is verified** |
| SMTP configured | No | BLOCKED |
| Production email delivery | Unconfigured | BLOCKED |

### Safe rollout sequence

1. **Choose** an SMTP/email provider (e.g., SendGrid, Resend, Mailgun).
2. **Configure** a verified sender (SPF/DKIM/DMARC records in DNS).
3. **Configure** SMTP in the Supabase Dashboard → **Settings** → **Email** →
   **SMTP Settings**.
4. **Send** a password-reset test (trigger `resetPasswordForEmail` for a test
   account).
5. **Verify** email delivery (check the inbox).
6. **Click** the recovery link.
7. **Verify** the app reaches the `?auth=recovery` flow and exchanges the code
   for a session (`exchangeCodeForSession`).
8. **Update** the password via `supabase.auth.updateUser({ password })`.
9. **Confirm** callback cleanup works (`clearAuthParams` removes URL params).
10. **Test** the confirmation-email flow using a controlled account (sign up a
    new test user, verify the confirmation email arrives, click the link, verify
    the `?auth=confirm` callback works).
11. **Only AFTER** successful email tests, consider setting
    `mailer_autoconfirm = false` in the Supabase Dashboard.

**DO NOT disable `mailer_autoconfirm` before SMTP works.** If disabled without
SMTP configured, signups will be broken (users cannot confirm their email and
will be permanently locked out).

---

## 7. Password Recovery Verification

### Code flow

1. User enters email → `requestPasswordReset(email)` in
   `src/hooks/useAuthState.ts:161-185`.
2. Calls `supabase.auth.resetPasswordForEmail(trimmed, { redirectTo: getRedirectTo() })`.
3. `getRedirectTo()` returns `https://<origin>/?auth=recovery` (derived from
   `window.location.origin` — no localhost hardcoding).
4. Supabase sends an email with a recovery link containing `?code=...&auth=recovery`.
5. On click, the app loads `/?auth=recovery&code=...`.
6. `useAuthState.ts:66-78` detects `mode === 'recovery'`, reads `code`, and calls
   `supabase.auth.exchangeCodeForSession(code)`.
7. On `PASSWORD_RECOVERY` event (line 127), sets `authStatus = 'recovery'`.
8. User enters new password → `submitNewPassword(newPassword, confirm)` calls
   `supabase.auth.updateUser({ password: newPassword })`.
9. On success, clears auth params and shows confirmation message.

### Production callback behavior

- The recovery redirect uses `window.location.origin`, so it works correctly
  under the Render origin `https://bodysignal-xa18.onrender.com`.
- The `code` is read from URL params client-side only and is never logged or
  sent to the server.
- No localhost-only assumptions remain in the auth recovery code.

### Note

Do NOT send real email yet if SMTP is still unconfigured. Password reset emails
will not send until SMTP is configured in the Supabase Dashboard.

---

## 8. Signup Confirmation Verification

Current state:

- `mailer_autoconfirm = true` — signups are auto-confirmed (users can sign in
  immediately without clicking a confirmation link).
- The confirmation callback code is ready: `src/hooks/useAuthState.ts:80-90`
  handles `mode === 'confirm'` by calling `exchangeCodeForSession(code)`.
- `src/lib/auth/authRedirect.ts` — `getAuthMode()` recognizes `confirm` mode.

When `mailer_autoconfirm` is eventually set to `false`:

1. Sign up a controlled test account.
2. Verify a confirmation email is sent.
3. Click the confirmation link.
4. Verify the app reaches `/?auth=confirm&code=...`.
5. Verify `exchangeCodeForSession` exchanges the code and the user is signed in.
6. Verify URL params are cleaned up (`clearAuthParams`).

**Do not disable autoconfirm until SMTP is configured and verified.**

---

## 9. RLS / Security Verification

### Schema

Defined in `supabase/schema.sql` (144 lines). Verified expectations:

#### profiles

| Action | Policy | Status |
|---|---|---|
| SELECT | `profiles_select_own` — `auth.uid() = id` | OK |
| UPDATE | `profiles_update_own` — `auth.uid() = id` (USING + WITH CHECK) | OK |

#### subscriptions

| Action | Policy | Status |
|---|---|---|
| SELECT | `subscriptions_select_own` — `auth.uid() = user_id` | OK |
| INSERT | *(none — writes are server-side only via service_role)* | OK |
| UPDATE | *(none — managed server-side)* | OK |
| DELETE | *(none — managed server-side)* | OK |

#### decoder_reports

| Action | Policy | Status |
|---|---|---|
| SELECT | `decoder_reports_select_own` — `auth.uid() = user_id` | OK |
| INSERT | `decoder_reports_insert_own` — `auth.uid() = user_id` (WITH CHECK) | OK |
| DELETE | `decoder_reports_delete_own` — `auth.uid() = user_id` | OK |

#### journal_entries

| Action | Policy | Status |
|---|---|---|
| SELECT | `journal_entries_select_own` — `auth.uid() = user_id` | OK |
| INSERT | `journal_entries_insert_own` — `auth.uid() = user_id` (WITH CHECK) | OK |
| UPDATE | `journal_entries_update_own` — `auth.uid() = user_id` (USING + WITH CHECK) | OK |
| DELETE | `journal_entries_delete_own` — `auth.uid() = user_id` | OK |

### handle_new_user

Defined in `supabase/schema.sql:124-127`:

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$ ...
```

- `SECURITY DEFINER` — confirmed (line 127)
- `search_path = public` — confirmed (line 127)
- Execute revoked from `public`, `anon`, `authenticated` — confirmed in
  `supabase/migrations/20260807025144_restrict_handle_new_user_execute.sql:7-9`

### RLS enablement

All four tables have RLS enabled (`supabase/schema.sql:52-55`).

### Result

**RLS verification: PASS.** No discrepancies found. No RLS changes made in this
batch.

---

## 10. Production Validation Checklist

| # | Check | Status | Evidence / Notes |
|---|---|---|---|
| 1 | Render live origin documented | DONE | `https://bodysignal-xa18.onrender.com` |
| 2 | `APP_URL` set to live origin | PENDING (operator) | Set `APP_URL` in Render env |
| 3 | `SUPABASE_SERVICE_ROLE_KEY` rotated | PENDING (operator) | See §3 — old key was exposed |
| 4 | `VITE_SUPABASE_URL` set to production project | PENDING (operator) | `https://psurstxfufkqqtpuaxel.supabase.co` |
| 5 | `VITE_SUPABASE_ANON_KEY` set (rotated if needed) | PENDING (operator) | Browser-safe |
| 6 | `SUPABASE_SERVICE_ROLE_KEY` server-only | VERIFIED | Only in `server.ts`; not in `.tsx` files |
| 7 | Service-role key not VITE-prefixed | VERIFIED | `SUPABASE_SERVICE_ROLE_KEY` (no `VITE_` prefix) |
| 8 | `.env` ignored by git | VERIFIED | `.gitignore` — `.env*` pattern (except `.env.example`) |
| 9 | `.env.example` contains placeholders only | VERIFIED | All values are placeholder strings |
| 10 | Site URL set to live origin | PENDING (operator) | `https://bodysignal-xa18.onrender.com` |
| 11 | Recovery redirect registered | PENDING (operator) | `https://bodysignal-xa18.onrender.com/?auth=recovery` |
| 12 | Confirm redirect registered | PENDING (operator) | `https://bodysignal-xa18.onrender.com/?auth=confirm` |
| 13 | Auth recovery code has no localhost hardcoding | VERIFIED | Uses `window.location.origin` |
| 14 | SMTP configured | PENDING (operator) | Not yet configured |
| 15 | `mailer_autoconfirm` remains `true` until SMTP verified | DOCUMENTED | Do NOT disable before SMTP works |
| 16 | RLS policies enforce own-only access | VERIFIED | See §9 |
| 17 | No secret values committed | VERIFIED | See Step 10 of batch (secret scan) |
| 18 | Validator passes | PENDING | `npx tsx tmp-validate-supabase-production.ts` |
| 19 | `npm run lint` passes | PENDING | tsc --noEmit |
| 20 | `npm run build` passes | PENDING | vite build + esbuild |

### Items marked PENDING (operator) cannot be completed from within the repository.
### No live Supabase or Stripe mutations are performed by this batch.

---

## 11. Supabase Project Reference

| Property | Value |
|---|---|
| Supabase project ref | `psurstxfufkqqtpuaxel` |
| Supabase URL | `https://psurstxfufkqqtpuaxel.supabase.co` |
| Service-role key | **COMPROMISED** — was exposed in a development chat. Must be rotated. |
| Anon key | **MAY BE COMPROMISED** — should be rotated if exposed alongside service-role key |
| Site URL | `https://bodysignal-xa18.onrender.com` (CURRENT LIVE RENDER ORIGIN) — NOT YET SET in dashboard |
| Redirect URLs | `https://bodysignal-xa18.onrender.com/?auth=recovery` — NOT YET SET |
| | `https://bodysignal-xa18.onrender.com/?auth=confirm` — NOT YET SET |
| `mailer_autoconfirm` | `true` — do NOT disable until SMTP verified |

---

## 12. Related Documents

- `docs/production-env-matrix.md` — Full environment variable matrix
- `docs/render-deployment.md` — Render deployment guide (includes rotation checklist)
- `docs/production-deployment-checklist.md` — Full deployment checklist
- `docs/hosting-requirements.md` — Hosting provider requirements
- `docs/release-readiness-2026-08.md` — Release readiness report (Batch 35)
- `SECURITY.md` — Security policy and vulnerability reporting
