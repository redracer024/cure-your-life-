import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  isDevelopmentEnvironment,
  isDevelopmentPremiumEnabled,
  isProductionServingMode,
} from "./serverEnv";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import dotenv from "dotenv";
import { isPremiumEntitled } from "./src/lib/billing/entitlement";
import {
  getWebhookLedgerClaimDecision,
  type WebhookLedgerStatus,
} from "./src/lib/billing/webhookLedger";
import {
  isExternallyBillableStripeStatus,
  isTerminalStripeSubscriptionStatus,
  normalizeStripeSubscriptionStatus,
} from "./src/lib/billing/stripeBillingState";
import { InMemoryRateLimiter } from "./src/lib/server/inMemoryRateLimit";
import { getRateLimitActorKey } from "./src/lib/server/rateLimitKey";
import { buildContentSecurityPolicy } from "./src/lib/server/securityHeaders";

dotenv.config();

const app = express();
export { app };
const PORT = Number(process.env.PORT || 3000);
app.set("trust proxy", false);

const GENERAL_JSON_BODY_LIMIT = "128kb";
const FORM_URLENCODED_BODY_LIMIT = "32kb";
const STRIPE_WEBHOOK_BODY_LIMIT = "1mb";

// Stripe webhooks need raw body. This must be registered before express.json().
app.post("/api/billing/webhook", express.raw({ type: "application/json", limit: STRIPE_WEBHOOK_BODY_LIMIT }), async (req: express.Request, res: express.Response) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET || !supabaseAdmin) {
    return res.status(501).json({
      error: "Stripe webhook is not configured.",
      requiredEnv: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    });
  }

  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).json({ error: "Missing Stripe signature." });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error: any) {
    console.error("Stripe webhook signature verification failed:", error.message);
    return res.status(400).json({ error: "Webhook signature verification failed." });
  }

  try {
    const claim = await claimStripeWebhookEvent({
      eventId: event.id,
      eventType: event.type,
      stripeCreatedAtUnix: event.created,
    });

    switch (claim.outcome) {
      case "already-processed":
        return res.status(200).json({ received: true });
      case "active-processing":
        return res.status(409).json({
          error: "Webhook event is already being processed."
        });
      case "claim-failed":
        return res.status(500).json({
          error: "Webhook processing failed."
        });
      case "claimed":
      case "retry-claimed":
        await processStripeWebhookEvent(event);
        await markStripeWebhookEventProcessed(claim.ledgerId);
        return res.json({ received: true });
      default:
        return res.status(500).json({
          error: "Webhook processing failed."
        });
    }
  } catch (error: unknown) {
    await markStripeWebhookEventFailed(event.id, error);
    console.error("Stripe webhook processing failed:", error);
    return res.status(500).json({
      error: "Webhook processing failed."
    });
  }
});


app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const isDevelopment = isDevelopmentEnvironment(process.env.NODE_ENV);
  const csp = buildContentSecurityPolicy({
    isDevelopment,
    supabaseUrl: process.env.VITE_SUPABASE_URL,
  });

  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

  if (!isDevelopment && req.secure) {
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }

  next();
});

app.use(express.json({ limit: GENERAL_JSON_BODY_LIMIT, type: ["application/json", "application/*+json"] }));
app.use(express.urlencoded({ extended: false, limit: FORM_URLENCODED_BODY_LIMIT }));

type PremiumSource = "dev" | "token" | "supabase" | "none";

type PremiumStatus = {
  isPremium: boolean;
  source: PremiumSource;
  userId: string | null;
  email?: string | null;
  devMode: boolean;
  subscription?: any;
  message?: string;
};

// Fail-closed premium authorization.
//
// Dev premium bypass requires BOTH NODE_ENV=development AND DEV_PREMIUM=true
// (exact lowercase literal). Any unset or unexpected value never grants Pro.
const DEV_PREMIUM = isDevelopmentPremiumEnabled(
  process.env.NODE_ENV,
  process.env.DEV_PREMIUM
);

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || "";
const STRIPE_PRICE_ID_MONTHLY = process.env.STRIPE_PRICE_ID_MONTHLY || "";
const STRIPE_PRICE_ID_ANNUAL = process.env.STRIPE_PRICE_ID_ANNUAL || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

const _isProd = isProductionServingMode(process.env.NODE_ENV);
const APP_URL: string = (() => {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (_isProd) {
    throw new Error("APP_URL is required in production. Set APP_URL to your production origin (e.g. https://your-app.com).");
  }
  return `http://localhost:${PORT}`;
})();
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const CHECKOUT_RATE_LIMIT_MAX = 10;
const PORTAL_RATE_LIMIT_MAX = 10;
const RECONCILE_RATE_LIMIT_MAX = 20;
const ACCOUNT_DELETE_RATE_LIMIT_MAX = 5;
const SECURITY_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

let stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

export function setStripeClient(client: Stripe | null) {
  stripe = client;
}

let supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export function setSupabaseAdminClient(client: ReturnType<typeof createClient> | null) {
  supabaseAdmin = client;
}

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini API client initialized successfully on server.");
} else {
  console.warn("Warning: GEMINI_API_KEY is not defined. The custom AI features will return a key setup prompt.");
}

export function setGeminiClient(client: GoogleGenAI | null) {
  ai = client;
}

type StripeWebhookLedgerRow = {
  id: string;
  stripe_event_id: string;
  event_type: string;
  status: WebhookLedgerStatus;
  created_at: string;
  processed_at: string | null;
  last_error: string | null;
  retry_count: number;
  stripe_created_at: string | null;
  processing_started_at: string | null;
};

const getBearerToken = (req: express.Request) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token || "" : "";
};

const checkoutRateLimiter = new InMemoryRateLimiter({
  max: CHECKOUT_RATE_LIMIT_MAX,
  windowMs: SECURITY_RATE_LIMIT_WINDOW_MS,
});

const portalRateLimiter = new InMemoryRateLimiter({
  max: PORTAL_RATE_LIMIT_MAX,
  windowMs: SECURITY_RATE_LIMIT_WINDOW_MS,
});

const reconcileRateLimiter = new InMemoryRateLimiter({
  max: RECONCILE_RATE_LIMIT_MAX,
  windowMs: SECURITY_RATE_LIMIT_WINDOW_MS,
});

const accountDeleteRateLimiter = new InMemoryRateLimiter({
  max: ACCOUNT_DELETE_RATE_LIMIT_MAX,
  windowMs: SECURITY_RATE_LIMIT_WINDOW_MS,
});

const setNoStore = (res: express.Response) => {
  res.setHeader("Cache-Control", "no-store");
};

const getRequestIp = (req: express.Request) => req.ip || req.socket.remoteAddress || "unknown";

const getRateLimitKey = (req: express.Request, userId: string | null) =>
  getRateLimitActorKey(userId, getRequestIp(req));

const enforceRateLimit = (
  req: express.Request,
  res: express.Response,
  limiter: InMemoryRateLimiter,
  userId: string | null,
  message: string,
) => {
  const result = limiter.consume(getRateLimitKey(req, userId));
  if (result.allowed) return true;

  res.setHeader("Retry-After", String(result.retryAfterSec));
  return res.status(429).json({
    error: message,
  });
};

const requireJsonContentType = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.method !== "POST" && req.method !== "PUT" && req.method !== "PATCH") {
    return next();
  }

  if (req.is("application/json") || req.is("application/*+json")) {
    return next();
  }

  return res.status(415).json({
    error: "Content-Type must be application/json.",
  });
};

const BILLING_PLAN_PRICE_MAP: Record<string, string> = {
  ...(STRIPE_PRICE_ID_MONTHLY ? { monthly: STRIPE_PRICE_ID_MONTHLY } : {}),
  ...(STRIPE_PRICE_ID_ANNUAL ? { annual: STRIPE_PRICE_ID_ANNUAL } : {}),
  ...(STRIPE_PRICE_ID ? { default: STRIPE_PRICE_ID } : {}),
};

const resolveCheckoutPrice = (planInput: unknown): { planKey: string; priceId: string } | null => {
  const normalizedPlan = typeof planInput === "string" ? planInput.trim().toLowerCase() : "";
  if (normalizedPlan && BILLING_PLAN_PRICE_MAP[normalizedPlan]) {
    return {
      planKey: normalizedPlan,
      priceId: BILLING_PLAN_PRICE_MAP[normalizedPlan],
    };
  }

  if (!normalizedPlan && BILLING_PLAN_PRICE_MAP.monthly) {
    return {
      planKey: "monthly",
      priceId: BILLING_PLAN_PRICE_MAP.monthly,
    };
  }

  if (!normalizedPlan && BILLING_PLAN_PRICE_MAP.default) {
    return {
      planKey: "default",
      priceId: BILLING_PLAN_PRICE_MAP.default,
    };
  }

  return null;
};

const getRequestUserId = (_req: express.Request) => {
  // Fallback id for non-authenticated dev/demo paths. Never derived from a
  // client-supplied header; the only trustworthy source is a verified
  // Supabase token (see getSupabaseUserFromRequest).
  return "demo-user";
};

const getSupabaseUserFromRequest = async (req: express.Request) => {
  const token = getBearerToken(req);
  if (!token || !supabaseAdmin) {
    return { user: null, error: null };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return { user: data.user ?? null, error };
};

const getAuthenticatedSupabaseUser = async (req: express.Request) => {
  const token = getBearerToken(req);
  if (!token || !supabaseAdmin) {
    return { user: null, error: "missing-auth" as const };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, error: "invalid-auth" as const };
  }

  return { user: data.user, error: null };
};

const stripeWebhookErrorSummary = (error: unknown): string => {
  if (!error) return "Unknown processing error.";
  if (error instanceof Error) return `${error.name}: ${error.message}`.slice(0, 500);
  return String(error).slice(0, 500);
};

const getStripeWebhookLedgerRow = async (eventId: string): Promise<StripeWebhookLedgerRow | null> => {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from("stripe_webhook_events")
    .select("id,stripe_event_id,event_type,status,created_at,processed_at,last_error,retry_count,stripe_created_at,processing_started_at")
    .eq("stripe_event_id", eventId)
    .limit(1)
    .maybeSingle<StripeWebhookLedgerRow>();

  if (error) {
    console.error("Stripe webhook ledger read failed.");
    return null;
  }

  return data ?? null;
};

const claimStripeWebhookEvent = async (params: {
  eventId: string;
  eventType: string;
  stripeCreatedAtUnix: number;
}): Promise<
  | { outcome: "claimed" | "retry-claimed"; ledgerId: string }
  | { outcome: "already-processed" | "active-processing" | "claim-failed" }
> => {
  if (!supabaseAdmin) {
    return { outcome: "claim-failed" };
  }

  const nowIso = new Date().toISOString();
  const nowMs = Date.parse(nowIso);
  const stripeCreatedAtIso = new Date(params.stripeCreatedAtUnix * 1000).toISOString();

  const { data: insertData, error: insertError } = await supabaseAdmin
    .from("stripe_webhook_events")
    .insert({
      stripe_event_id: params.eventId,
      event_type: params.eventType,
      status: "processing",
      stripe_created_at: stripeCreatedAtIso,
      processing_started_at: nowIso,
    })
    .select("id")
    .single<{ id: string }>();

  if (!insertError && insertData?.id) {
    return {
      outcome: "claimed",
      ledgerId: insertData.id,
    };
  }

  if (insertError?.code !== "23505") {
    console.error("Stripe webhook ledger insert failed.");
    return { outcome: "claim-failed" };
  }

  const existing = await getStripeWebhookLedgerRow(params.eventId);
  if (!existing) {
    return { outcome: "claim-failed" };
  }

  const decision = getWebhookLedgerClaimDecision(existing, nowMs);

  if (decision === "already-processed") {
    return { outcome: "already-processed" };
  }

  if (decision === "active-processing") {
    return { outcome: "active-processing" };
  }

  const retryPayload = {
    status: "processing",
    last_error: null,
    processed_at: null,
    retry_count: existing.retry_count + 1,
    event_type: params.eventType,
    stripe_created_at: stripeCreatedAtIso,
    processing_started_at: nowIso,
  };

  let retryData: { id: string } | null = null;
  let retryError: any = null;

  if (decision === "reclaim-failed") {
    const result = await supabaseAdmin
      .from("stripe_webhook_events")
      .update(retryPayload)
      .eq("stripe_event_id", params.eventId)
      .eq("status", "failed")
      .select("id")
      .single<{ id: string }>();
    retryData = result.data;
    retryError = result.error;
  } else {
    let query = supabaseAdmin
      .from("stripe_webhook_events")
      .update(retryPayload)
      .eq("stripe_event_id", params.eventId)
      .eq("status", "processing")
      .eq("retry_count", existing.retry_count);

    query = existing.processing_started_at === null
      ? query.is("processing_started_at", null)
      : query.eq("processing_started_at", existing.processing_started_at);

    const result = await query
      .select("id")
      .single<{ id: string }>();
    retryData = result.data;
    retryError = result.error;
  }

  if (!retryError && retryData?.id) {
    return {
      outcome: "retry-claimed",
      ledgerId: retryData.id,
    };
  }

  const refreshed = await getStripeWebhookLedgerRow(params.eventId);
  if (!refreshed) {
    return { outcome: "claim-failed" };
  }

  if (refreshed.status === "processed") {
    return { outcome: "already-processed" };
  }

  if (refreshed.status === "processing") {
    return { outcome: "active-processing" };
  }

  return { outcome: "claim-failed" };
};

const markStripeWebhookEventProcessed = async (ledgerId: string) => {
  if (!supabaseAdmin) return;

  const { error } = await supabaseAdmin
    .from("stripe_webhook_events")
    .update({
      status: "processed",
      processed_at: new Date().toISOString(),
      last_error: null,
      processing_started_at: null,
    })
    .eq("id", ledgerId);

  if (error) {
    console.error("Stripe webhook ledger mark-processed failed.");
  }
};

const markStripeWebhookEventFailed = async (eventId: string, error: unknown) => {
  if (!supabaseAdmin) return;

  const { error: updateError } = await supabaseAdmin
    .from("stripe_webhook_events")
    .update({
      status: "failed",
      last_error: stripeWebhookErrorSummary(error),
      processed_at: null,
      processing_started_at: null,
    })
    .eq("stripe_event_id", eventId)
    .eq("status", "processing");

  if (updateError) {
    console.error("Stripe webhook ledger mark-failed failed.");
  }
};


const getSubscriptionPeriodEnd = (subscription: Stripe.Subscription) => {
  const periodEnd = (subscription as any).current_period_end;
  return typeof periodEnd === "number"
    ? new Date(periodEnd * 1000).toISOString()
    : null;
};

const upsertStripeSubscription = async (params: {
  userId: string;
  status: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
}) => {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        user_id: params.userId,
        status: params.status,
        source: "stripe",
        stripe_customer_id: params.stripeCustomerId || null,
        stripe_subscription_id: params.stripeSubscriptionId || null,
        current_period_end: params.currentPeriodEnd || null,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "user_id"
      }
    );

  if (error) {
    throw new Error(`Failed to upsert Stripe subscription: ${error.message}`);
  }
};

const getUserIdForStripeSubscription = async (stripeSubscriptionId: string) => {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Failed to map Stripe subscription to user.");
    return null;
  }

  return data?.user_id || null;
};

const syncStripeSubscriptionById = async (subscriptionId: string, fallbackUserId?: string | null) => {
  if (!stripe) {
    throw new Error("Stripe client is not configured.");
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const mappedUserId =
    subscription.metadata?.supabase_user_id ||
    fallbackUserId ||
    (await getUserIdForStripeSubscription(subscription.id)) ||
    "";

  if (!mappedUserId) {
    console.warn("Stripe subscription sync skipped because no user mapping was found.");
    return;
  }

  await upsertStripeSubscription({
    userId: mappedUserId,
    status: subscription.status,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id || null,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: getSubscriptionPeriodEnd(subscription)
  });
};

const syncStripeCheckoutSession = async (session: Stripe.Checkout.Session) => {
  const userId =
    session.metadata?.supabase_user_id ||
    session.client_reference_id ||
    "";

  if (!userId) {
    throw new Error("Checkout session is missing supabase_user_id.");
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!subscriptionId) {
    throw new Error("Checkout session did not include a subscription id.");
  }

  await syncStripeSubscriptionById(subscriptionId, userId);
};

const syncStripeSubscription = async (subscription: Stripe.Subscription) => {
  const userId = subscription.metadata?.supabase_user_id || "";

  if (!userId) {
    console.warn("Stripe subscription missing supabase_user_id metadata:", subscription.id);
    return;
  }

  await syncStripeSubscriptionById(subscription.id, userId);
};

const syncStripeInvoice = async (invoice: Stripe.Invoice) => {
  const rawInvoice = invoice as any;
  const subscriptionId = typeof rawInvoice.subscription === "string"
    ? rawInvoice.subscription
    : rawInvoice.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  await syncStripeSubscriptionById(subscriptionId, null);
};

const processStripeWebhookEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await syncStripeCheckoutSession(session);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncStripeSubscription(subscription);
      return;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await syncStripeInvoice(invoice);
      return;
    }
    default:
      return;
  }
};


const getLatestSubscriptionForUser = async (userId: string) => {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id,user_id,status,source,stripe_customer_id,stripe_subscription_id,current_period_end,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Supabase subscription lookup failed:", error.message);
    return null;
  }

  return data;
};

const reconcileStripeSubscriptionForUser = async (userId: string) => {
  const subscription = await getLatestSubscriptionForUser(userId);
  const stripeSubscriptionId = subscription?.stripe_subscription_id || null;

  if (subscription?.source === "stripe" && stripeSubscriptionId) {
    await syncStripeSubscriptionById(stripeSubscriptionId, userId);
  }

  return getLatestSubscriptionForUser(userId);
};

const markSubscriptionMappingAsCanceled = async (
  rowId: string,
  stripeCustomerId: string | null,
) => {
  if (!supabaseAdmin) return;
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      stripe_subscription_id: null,
      stripe_customer_id: stripeCustomerId,
      current_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", rowId);
};

const safelyRetrieveStripeSubscription = async (subscriptionId: string) => {
  if (!stripe) {
    throw new Error("Stripe client is not configured.");
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return {
      state: "found" as const,
      subscription,
    };
  } catch (error: any) {
    if (error?.code === "resource_missing" || error?.statusCode === 404) {
      return {
        state: "missing" as const,
      };
    }

    return {
      state: "error" as const,
    };
  }
};

const cancelStripeBillingBeforeAccountDeletion = async (userId: string) => {
  const subscriptionRow = await getLatestSubscriptionForUser(userId);
  if (!subscriptionRow || subscriptionRow.source !== "stripe" || !subscriptionRow.stripe_subscription_id) {
    return { status: "not-applicable" as const };
  }

  const canonical = await safelyRetrieveStripeSubscription(subscriptionRow.stripe_subscription_id);

  if (canonical.state === "missing") {
    await markSubscriptionMappingAsCanceled(subscriptionRow.id, subscriptionRow.stripe_customer_id);
    return {
      status: "stale-mapping-cleared" as const,
    };
  }

  if (canonical.state === "error") {
    return {
      status: "cancel-failed" as const,
    };
  }

  const stripeStatus = normalizeStripeSubscriptionStatus(canonical.subscription.status);

  if (isTerminalStripeSubscriptionStatus(stripeStatus)) {
    await upsertStripeSubscription({
      userId,
      status: stripeStatus,
      stripeCustomerId:
        typeof canonical.subscription.customer === "string"
          ? canonical.subscription.customer
          : canonical.subscription.customer?.id || null,
      stripeSubscriptionId: canonical.subscription.id,
      currentPeriodEnd: getSubscriptionPeriodEnd(canonical.subscription),
    });
    return {
      status: "already-terminal" as const,
    };
  }

  if (!isExternallyBillableStripeStatus(stripeStatus)) {
    return {
      status: "unknown-billing-risk" as const,
    };
  }

  if (!stripe) {
    return {
      status: "cancel-failed" as const,
    };
  }

  try {
    const canceled = await stripe.subscriptions.cancel(canonical.subscription.id);
    await upsertStripeSubscription({
      userId,
      status: canceled.status,
      stripeCustomerId:
        typeof canceled.customer === "string"
          ? canceled.customer
          : canceled.customer?.id || null,
      stripeSubscriptionId: canceled.id,
      currentPeriodEnd: getSubscriptionPeriodEnd(canceled),
    });
    return {
      status: "canceled-now" as const,
    };
  } catch (error: any) {
    if (error?.code === "resource_missing" || error?.statusCode === 404) {
      await markSubscriptionMappingAsCanceled(subscriptionRow.id, subscriptionRow.stripe_customer_id);
      return {
        status: "stale-mapping-cleared" as const,
      };
    }

    return {
      status: "cancel-failed" as const,
    };
  }
};

const getPremiumStatus = async (req: express.Request): Promise<PremiumStatus> => {
  const { user, error } = await getSupabaseUserFromRequest(req);

  if (error) {
    console.warn("Supabase user lookup failed:", error.message);
  }

  if (user) {
    const subscription = await getLatestSubscriptionForUser(user.id);
    const active = isPremiumEntitled(subscription);

    return {
      isPremium: active || DEV_PREMIUM,
      source: active ? "supabase" : DEV_PREMIUM ? "dev" : "none",
      userId: user.id,
      email: user.email,
      devMode: DEV_PREMIUM,
      subscription,
      message: active
        ? "Premium access granted from Supabase subscription record."
        : DEV_PREMIUM
          ? "No active subscription found, but DEV_PREMIUM is enabled for local testing."
          : "No active subscription found for this Supabase user."
    };
  }

  if (DEV_PREMIUM) {
    return {
      isPremium: true,
      source: "dev",
      userId: getRequestUserId(req),
      devMode: true,
      message: "DEV_PREMIUM is enabled. Local/dev builds are unlocked without trusting localStorage."
    };
  }

  return {
    isPremium: false,
    source: "none",
    userId: null,
    devMode: false,
    message: supabaseAdmin
      ? "Sign in with Supabase or activate a subscription to unlock premium access."
      : "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server."
  };
};

// Server-side premium status. The frontend should use this as source of truth.
// localStorage can remember UI hints, but it must never be trusted for premium access.
app.get("/api/me/premium", async (req: express.Request, res: express.Response) => {
  setNoStore(res);
  const { user } = await getAuthenticatedSupabaseUser(req);
  if (!user) {
    return res.status(401).json({
      error: "Authentication is required."
    });
  }

  return res.json(await getPremiumStatus(req));
});

// Deletes the currently authenticated Supabase account.
// For Stripe-backed subscriptions, this endpoint cancels externally billable
// subscriptions first, then deletes the auth user and relies on DB-level ON
// DELETE CASCADE for app-owned rows. No automatic refund behavior is applied.
app.delete("/api/me/account", async (req: express.Request, res: express.Response) => {
  setNoStore(res);
  if (!supabaseAdmin) {
    return res.status(503).json({
      error: "Account deletion is not available right now."
    });
  }

  const { user } = await getAuthenticatedSupabaseUser(req);

  const accountDeleteUserId = user?.id ?? null;
  const accountDeleteRateDecision = enforceRateLimit(
    req,
    res,
    accountDeleteRateLimiter,
    accountDeleteUserId,
    "Too many account deletion requests. Please try again later.",
  );
  if (accountDeleteRateDecision !== true) {
    return accountDeleteRateDecision;
  }

  if (!user) {
    return res.status(401).json({
      error: "Authentication is required."
    });
  }

  const verifiedUserId = user.id;

  const billingResult = await cancelStripeBillingBeforeAccountDeletion(verifiedUserId);
  if (billingResult.status === "cancel-failed") {
    return res.status(502).json({
      error: "Account deletion could not be completed right now. Please try again."
    });
  }

  if (billingResult.status === "unknown-billing-risk") {
    return res.status(409).json({
      error: "Account deletion requires billing review before it can continue."
    });
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(verifiedUserId);

  if (deleteError) {
    console.error("Account deletion failed.");
    return res.status(500).json({
      error: "Account deletion failed. Please try again."
    });
  }

  return res.status(200).json({ deleted: true });
});

// Placeholder checkout endpoint. This intentionally does not create a live Stripe session yet.
// Next Stripe step: install stripe, create a real checkout session here using STRIPE_SECRET_KEY
// and STRIPE_PRICE_ID, then return session.url.
app.post("/api/billing/create-checkout-session", requireJsonContentType, async (req: express.Request, res: express.Response) => {
  const { user } = await getAuthenticatedSupabaseUser(req);

  const checkoutUserId = user?.id ?? null;
  const checkoutRateDecision = enforceRateLimit(
    req,
    res,
    checkoutRateLimiter,
    checkoutUserId,
    "Too many checkout requests. Please try again later.",
  );
  if (checkoutRateDecision !== true) {
    return checkoutRateDecision;
  }

  if (!user) {
    return res.status(401).json({
      error: "Authentication is required."
    });
  }

  const premium = await getPremiumStatus(req);

  if (!premium.userId || premium.userId === "demo-user") {
    return res.status(401).json({
      error: "Sign in with Supabase before starting checkout.",
      requiresAuth: true,
      premium
    });
  }

  const resolvedPlan = resolveCheckoutPrice(req.body?.plan);

  if (!stripe || !resolvedPlan) {
    return res.status(501).json({
      error: "Stripe checkout is not configured yet.",
      requiredEnv: ["STRIPE_SECRET_KEY", "STRIPE_PRICE_ID_MONTHLY or STRIPE_PRICE_ID", "APP_URL"],
      message: "Billing plans are not configured on the server."
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: premium.email || undefined,
      client_reference_id: premium.userId,
      line_items: [
        {
          price: resolvedPlan.priceId,
          quantity: 1
        }
      ],
      metadata: {
        supabase_user_id: premium.userId,
        plan_key: resolvedPlan.planKey,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: premium.userId,
          plan_key: resolvedPlan.planKey,
        }
      },
      success_url: `${APP_URL}/?billing=success`,
      cancel_url: `${APP_URL}/?billing=cancelled`
    });

    return res.json({
      checkoutUrl: session.url
    });
  } catch (error: any) {
    console.error("Stripe checkout creation failed:", error);
    return res.status(500).json({
      error: "Stripe checkout creation failed."
    });
  }
});

// Placeholder customer portal endpoint. Later this should create a Stripe billing portal session
// for the authenticated customer id saved in your database.
app.post("/api/billing/create-portal-session", async (req: express.Request, res: express.Response) => {
  const { user } = await getAuthenticatedSupabaseUser(req);

  const portalUserId = user?.id ?? null;
  const portalRateDecision = enforceRateLimit(
    req,
    res,
    portalRateLimiter,
    portalUserId,
    "Too many billing portal requests. Please try again later.",
  );
  if (portalRateDecision !== true) {
    return portalRateDecision;
  }

  if (!user) {
    return res.status(401).json({
      error: "Authentication is required."
    });
  }

  const premium = await getPremiumStatus(req);

  if (!premium.userId || premium.userId === "demo-user") {
    return res.status(401).json({
      error: "Sign in before opening the billing portal.",
      requiresAuth: true,
      premium
    });
  }

  if (!stripe) {
    return res.status(501).json({
      error: "Stripe is not configured.",
      requiredEnv: ["STRIPE_SECRET_KEY", "APP_URL"]
    });
  }

  const stripeCustomerId = premium.subscription?.stripe_customer_id;

  if (!stripeCustomerId) {
    return res.status(404).json({
      error: "No Stripe customer found for this account.",
      message: "This user does not have a Stripe subscription row yet. The billing portal needs a customer id, because apparently it refuses to manage imaginary wallets.",
      premium
    });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${APP_URL}/?billing=portal-return`
    });

    return res.json({
      portalUrl: session.url
    });
  } catch (error: any) {
    console.error("Stripe billing portal creation failed:", error);
    return res.status(500).json({
      error: "Stripe billing portal creation failed."
    });
  }
});

app.post("/api/me/subscription/reconcile", async (req: express.Request, res: express.Response) => {
  setNoStore(res);
  const { user } = await getAuthenticatedSupabaseUser(req);

  const reconcileUserId = user?.id ?? null;
  const reconcileRateDecision = enforceRateLimit(
    req,
    res,
    reconcileRateLimiter,
    reconcileUserId,
    "Too many reconciliation requests. Please try again later.",
  );
  if (reconcileRateDecision !== true) {
    return reconcileRateDecision;
  }

  if (!user) {
    return res.status(401).json({
      error: "Authentication is required."
    });
  }

  try {
    await reconcileStripeSubscriptionForUser(user.id);

    return res.json(await getPremiumStatus(req));
  } catch (error) {
    console.error("Subscription reconciliation failed.");
    return res.status(500).json({
      error: "Subscription reconciliation failed."
    });
  }
});


// Rate limiting for the Gemini-backed analyzer. In-memory token bucket,
// keyed per verified user id (or IP fallback for dev/demo paths). A fixed
// per-process window is adequate for this app's single-instance deployment.
const ANALYSIS_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const ANALYSIS_RATE_LIMIT_MAX = 30;

const analysisRateLimiter = new InMemoryRateLimiter({
  max: ANALYSIS_RATE_LIMIT_MAX,
  windowMs: ANALYSIS_RATE_LIMIT_WINDOW_MS,
});

// Custom symptom analysis API endpoint. This is now server-gated for premium access.
app.post("/api/analyze-symptom", requireJsonContentType, async (req: express.Request, res: express.Response) => {
  try {
    const premium = await getPremiumStatus(req);
    if (!premium.isPremium) {
      return res.status(402).json({
        error: "AI Somatic Decoder is a premium feature.",
        requiresPremium: true,
        premium
      });
    }

    const analysisRateDecision = enforceRateLimit(
      req,
      res,
      analysisRateLimiter,
      premium.userId,
      "Too many decoding requests. Please try again in about an hour.",
    );
    if (analysisRateDecision !== true) {
      return analysisRateDecision;
    }

    const { symptom, habits } = req.body;

    if (!symptom) {
      return res.status(400).json({ error: "Symptom description is required." });
    }

    if (!ai) {
      return res.status(400).json({
        error: "Gemini API key is not configured.",
        isMissingKey: true
      });
    }

    const systemInstruction = `You are a world-class psychosomatic medicine specialist with a hilarious, highly sarcastic, and dryly mocking persona (similar to House M.D. or a witty cynical doctor). 
Your task is to analyze the user's physical symptom or physical ailment, optionally taking into consideration their bad habits (like poor posture, dehydration, stress, endless doomscrolling, caffeine dependency, or lack of sleep).

You must return a strictly formatted JSON object that maps:
1. The emotional/metaphorical root of the physical ailment.
2. The actual scientific, technical, and physiological mechanism happening in the body (the nervous system, muscle contractions, chemical releases, blood flow restriction, etc.). This should be completely medically accurate and real.
3. A biting, sarcastic review that mocks the user's bad habits, lifestyle choices, or refusal to take care of themselves, while retaining medical accuracy in the joke.
4. 2-3 deep mindfulness reflection/journal prompts for self-exploration.
5. 2-3 practical somatic or physical therapy exercises to help release the somatic charge.

Your tone should be dry, sharp, and satirical, but the underlying insights MUST be incredibly accurate, educational, and helpful. Do not be overly mean, but do mock their typical modern habits (e.g., sitting like a boiled shrimp, excessive screen time, ignoring thirst, emotional suppression).

You must respond with raw JSON matching the following schema structure:
{
  "emotionalRoot": "string explaining the emotional/metaphorical root causes",
  "physiologicalDescription": "highly accurate, scientific description of the body's actual physiological/somatic reaction, nerve pathways, muscle contractions, etc.",
  "sarcasticReview": "the sarcastic, mocking review of their lifestyle/habits and coping mechanisms",
  "mindfulnessPrompts": ["prompt 1", "prompt 2"],
  "practicalTips": ["practical physical exercise or habit tip 1", "practical physical exercise or habit tip 2"]
}

Make sure to not include markdown code blocks inside the JSON fields. Just clean string values. Return only the JSON object.`;

    const promptText = `Analyze this physical symptom: "${symptom}". 
User's self-reported lifestyle habits/context: "${habits || 'Not provided'}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotionalRoot: {
              type: Type.STRING,
              description: "Emotional and metaphysical root causes of this ailment."
            },
            physiologicalDescription: {
              type: Type.STRING,
              description: "Scientifically accurate, professional medical details of what is physically happening in the nervous system, muscles, or organs."
            },
            sarcasticReview: {
              type: Type.STRING,
              description: "Hilarious, mocking, sarcastic commentary on their bad habits and denial of physical needs."
            },
            mindfulnessPrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Deep, probing journal prompts for mental reflection."
            },
            practicalTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Practical physical exercises, somatic releases, or posture corrections."
            }
          },
          required: ["emotionalRoot", "physiologicalDescription", "sarcasticReview", "mindfulnessPrompts", "practicalTips"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI model.");
    }

    const parsed = JSON.parse(text);
    return res.json(parsed);

  } catch (error: any) {
    console.error("Error analyzing symptom:", error);
    return res.status(500).json({ 
      error: error.message || "An error occurred during symptom analysis."
    });
  }
});

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Request payload is too large.",
    });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      error: "Invalid JSON payload.",
    });
  }

  console.error("Unhandled server error:", error);
  return res.status(500).json({
    error: "Internal server error.",
  });
});

export function resetRateLimiters(): void {
  checkoutRateLimiter.reset();
  portalRateLimiter.reset();
  reconcileRateLimiter.reset();
  accountDeleteRateLimiter.reset();
  analysisRateLimiter.reset();
}

// Serve static assets in production; Vite dev middleware ONLY for an explicit
// development environment. Absent NODE_ENV must never trigger dev middleware.
async function startServer() {
  if (isDevelopmentEnvironment(process.env.NODE_ENV)) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server mounted as Express middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    // API 404: any unmatched /api/** route must return JSON 404, NOT the SPA
    // HTML shell. This must be registered BEFORE the SPA fallback below.
    app.use("/api", (req: express.Request, res: express.Response) => {
      res.status(404).json({ error: "Not found" });
    });

    // SPA fallback: all non-API routes serve the app shell.
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from dist/.");
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Premium dev mode: ${DEV_PREMIUM ? "ON" : "OFF"}`);
    console.log(`Supabase server auth: ${supabaseAdmin ? "configured" : "not configured"}`);
  });

  // Graceful shutdown: allow in-flight requests to finish on SIGTERM/SIGINT
  // (useful for container/platform deploys). Do not hang if force-quit.
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Shutting down...`);
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

const currentFile = typeof __filename !== "undefined" ? __filename : new URL(import.meta.url).pathname;
if (process.argv[1] === currentFile) {
  startServer();
}
