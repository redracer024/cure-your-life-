# Cure Your Life+ Paywall Backend Groundwork

This pass adds backend routes for premium status and billing placeholders. It does not enable live payments yet, because wiring Stripe before auth and webhook verification is how software becomes a haunted vending machine.

## Added server routes

### GET `/api/me/premium`
Returns the server-side premium status. The frontend should treat this endpoint as the source of truth.

Response shape:

```json
{
  "isPremium": true,
  "source": "dev",
  "userId": "demo-user",
  "devMode": true,
  "message": "DEV_PREMIUM is enabled."
}
```

### POST `/api/billing/create-checkout-session`
Placeholder route for future Stripe Checkout creation. It currently returns `501` with setup instructions unless live Stripe wiring is added later.

### POST `/api/billing/create-portal-session`
Placeholder route for future Stripe Billing Portal creation. It requires premium status first.

### POST `/api/billing/webhook`
Placeholder route only. Do not use it for live Stripe yet. Real Stripe webhooks require raw request body verification before normal JSON parsing.

### POST `/api/analyze-symptom`
Now checks premium server-side before running Gemini. In local development, premium is unlocked by default unless `DEV_PREMIUM=false` is set.

## Environment variables

Use these in `.env` or `.env.local`:

```bash
GEMINI_API_KEY="your Gemini key"
APP_URL="http://localhost:3000"
DEV_PREMIUM="true"
PREMIUM_ACCESS_TOKEN="local-test-token"
STRIPE_SECRET_KEY="future Stripe secret"
STRIPE_PRICE_ID="future Stripe price id"
```

## Local testing

```bash
npm run dev
curl http://localhost:3000/api/me/premium
curl -X POST http://localhost:3000/api/billing/create-checkout-session
```

To test locked mode:

```bash
DEV_PREMIUM=false npm run dev
curl http://localhost:3000/api/me/premium
```

To test token-based temporary access with `DEV_PREMIUM=false`:

```bash
curl -H "Authorization: Bearer local-test-token" http://localhost:3000/api/me/premium
```

## Next proper step

Add real auth first, then Stripe. The clean production path is:

1. Add real user identity, such as Firebase, Supabase, Auth0, Clerk, or your own sessions.
2. Save a customer id and subscription status per user in a database.
3. Create real Stripe Checkout sessions in `/api/billing/create-checkout-session`.
4. Verify Stripe webhooks using the raw body and Stripe signature.
5. Update the database on subscription created, updated, canceled, payment failed, and payment succeeded events.
6. Make `/api/me/premium` read from the verified database row, not localStorage.

localStorage is fine for remembering cosmetic UI state. It is not security. It is a sticky note with delusions of grandeur.
