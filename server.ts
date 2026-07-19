import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Stripe webhooks need raw body. This must be registered before express.json().
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), async (req: express.Request, res: express.Response) => {
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
    return res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await syncStripeCheckoutSession(session);
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      await syncStripeSubscription(subscription);
    }

    return res.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook processing failed:", error);
    return res.status(500).json({
      error: "Webhook processing failed.",
      message: error.message || "Unknown webhook error"
    });
  }
});


app.use(express.json());

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

const parseBooleanEnv = (value: string | undefined, fallback = false) => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
};

// Development stays usable by default. Production requires a real premium source.
// Set DEV_PREMIUM=false locally if you want to test the locked/free state.
const DEV_PREMIUM = parseBooleanEnv(
  process.env.DEV_PREMIUM,
  process.env.NODE_ENV !== "production"
);

const PREMIUM_ACCESS_TOKEN = process.env.PREMIUM_ACCESS_TOKEN || "";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

const getBearerToken = (req: express.Request) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token || "" : "";
};

const getRequestUserId = (req: express.Request) => {
  // Fallback only for non-authenticated dev/demo testing.
  return String(req.headers["x-cyl-user-id"] || "demo-user");
};

const getSupabaseUserFromRequest = async (req: express.Request) => {
  const token = getBearerToken(req);
  if (!token || !supabaseAdmin) {
    return { user: null, error: null };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return { user: data.user ?? null, error };
};

const isSubscriptionActive = (subscription: any) => {
  if (!subscription) return false;
  const status = String(subscription.status || "").toLowerCase();
  if (["active", "trialing", "manual"].includes(status)) return true;

  if (subscription.current_period_end) {
    const periodEnd = new Date(subscription.current_period_end).getTime();
    return Number.isFinite(periodEnd) && periodEnd > Date.now();
  }

  return false;
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

  let status = "active";
  let currentPeriodEnd: string | null = null;

  if (subscriptionId && stripe) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    status = subscription.status;
    currentPeriodEnd = getSubscriptionPeriodEnd(subscription);
  }

  await upsertStripeSubscription({
    userId,
    status,
    stripeCustomerId:
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id || null,
    stripeSubscriptionId: subscriptionId || null,
    currentPeriodEnd
  });
};

const syncStripeSubscription = async (subscription: Stripe.Subscription) => {
  const userId = subscription.metadata?.supabase_user_id || "";

  if (!userId) {
    console.warn("Stripe subscription missing supabase_user_id metadata:", subscription.id);
    return;
  }

  await upsertStripeSubscription({
    userId,
    status: subscription.status,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id || null,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: getSubscriptionPeriodEnd(subscription)
  });
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

const getPremiumStatus = async (req: express.Request): Promise<PremiumStatus> => {
  const { user, error } = await getSupabaseUserFromRequest(req);

  if (error) {
    console.warn("Supabase user lookup failed:", error.message);
  }

  if (user) {
    const subscription = await getLatestSubscriptionForUser(user.id);
    const active = isSubscriptionActive(subscription);

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

  const bearerToken = getBearerToken(req);
  if (PREMIUM_ACCESS_TOKEN && bearerToken === PREMIUM_ACCESS_TOKEN) {
    return {
      isPremium: true,
      source: "token",
      userId: getRequestUserId(req),
      devMode: false,
      message: "Premium access granted by server-side token placeholder."
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
  return res.json(await getPremiumStatus(req));
});

// Placeholder checkout endpoint. This intentionally does not create a live Stripe session yet.
// Next Stripe step: install stripe, create a real checkout session here using STRIPE_SECRET_KEY
// and STRIPE_PRICE_ID, then return session.url.
app.post("/api/billing/create-checkout-session", async (req: express.Request, res: express.Response) => {
  const premium = await getPremiumStatus(req);

  if (!premium.userId || premium.userId === "demo-user") {
    return res.status(401).json({
      error: "Sign in with Supabase before starting checkout.",
      requiresAuth: true,
      premium
    });
  }

  if (!stripe || !STRIPE_PRICE_ID) {
    return res.status(501).json({
      error: "Stripe checkout is not configured yet.",
      requiredEnv: ["STRIPE_SECRET_KEY", "STRIPE_PRICE_ID", "APP_URL"],
      message: "Add Stripe secret key and price ID on the server. The checkout button exists, but the cash register is still a cardboard box."
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: premium.email || undefined,
      client_reference_id: premium.userId,
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      metadata: {
        supabase_user_id: premium.userId
      },
      subscription_data: {
        metadata: {
          supabase_user_id: premium.userId
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
      error: "Stripe checkout creation failed.",
      message: error.message || "Unknown Stripe error"
    });
  }
});

// Placeholder customer portal endpoint. Later this should create a Stripe billing portal session
// for the authenticated customer id saved in your database.
app.post("/api/billing/create-portal-session", async (req: express.Request, res: express.Response) => {
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
      error: "Stripe billing portal creation failed.",
      message: error.message || "Unknown Stripe error"
    });
  }
});


// Initialize Gemini Client
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

// Custom symptom analysis API endpoint. This is now server-gated for premium access.
app.post("/api/analyze-symptom", async (req: express.Request, res: express.Response) => {
  try {
    const premium = await getPremiumStatus(req);
    if (!premium.isPremium) {
      return res.status(402).json({
        error: "AI Somatic Decoder is a premium feature.",
        requiresPremium: true,
        premium
      });
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

// Serve static assets in development or production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server mounted as Express middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Premium dev mode: ${DEV_PREMIUM ? "ON" : "OFF"}`);
    console.log(`Supabase server auth: ${supabaseAdmin ? "configured" : "not configured"}`);
  });
}

startServer();
