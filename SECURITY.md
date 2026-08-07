# Security Policy

## Supported Versions

BodySignal is a single-user personal health application. Only the **latest deployed version** is considered supported for security purposes.

| Version | Status   |
|---------|----------|
| latest  | Supported |
| < latest | Unsupported |

There is no separate LTS or patch-release branch. Vulnerabilities should be reported against the current `HEAD` of the active development branch.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

To report a security vulnerability, use the private reporting mechanism available through the repository platform (GitHub's "Report a vulnerability" advisory feature in the **Security** tab), or any other private channel provided by the hosting platform. If no dedicated private channel is available, coordinate with the project maintainer through a private message rather than posting credentials, exploits, or detailed technical write-ups in public forums.

## What to Include

When reporting, please include as much of the following as is practical:

- **Affected area** — which component, endpoint, page, or data flow is impacted (e.g. `/api/webhook`, `StripeWebhookLedger`, `PremiumContext`)
- **Reproduction steps** — a clear, step-by-step description (or proof-of-concept snippet that does **not** invoke live secrets)
- **Impact assessment** — what damage an attacker could achieve, or what data could be exposed
- **Environment / browser / device** — relevant runtime details (Node.js version, Express/Supabase/Stripe environment, OS, browser)
- **Screenshots / logs** — only after verifying they contain **no secrets, tokens, PII, or payment data**

## What NOT to Send

Please **do not** include any of the following in your report or evidence:

- Passwords (any user or admin password)
- Access tokens or session tokens
- Refresh tokens
- API keys (Supabase, Stripe, Gemini, or any third-party service)
- Payment card data or Stripe customer charge details
- Full Supabase `service_role` key material

If you need to demonstrate an exploit that requires referencing a secret internally for context, describe the credential type and its role, but do not paste the literal value.

## Responsible Disclosure

The maintainers ask that you:

- Give us a reasonable time to investigate and remediate before any public disclosure
- Not exploit the vulnerability beyond what is necessary to demonstrate it
- Not share the issue with third parties until a fix has been released
- Coordinate the public disclosure timeline with the maintainers

We will acknowledge receipt within a reasonable timeframe, investigate promptly, and work to resolve confirmed issues. Once a fix is released, we may issue a security advisory referencing the reported issue (without disclosing exploit details that would aid attackers).

## Known Limitations

- **Supabase `service_role` key rotation** is tracked as a required pre-production action (see `docs/production-deployment-checklist.md`). The key was previously referenced in a development chat and must be rotated before production use.
- **Email delivery** is not yet configured for production. Auth recovery flows rely on configured SMTP/SendGrid in the deployed environment.
- **Leaked-password protection** is unavailable on the current Supabase plan tier.
