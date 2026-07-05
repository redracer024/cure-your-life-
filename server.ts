import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

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
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

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

const getLatestSubscriptionForUser = async (userId: string) => {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id,user_id,status,source,current_period_end,created_at,updated_at")
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

  if (!premium.userId && !DEV_PREMIUM) {
    return res.status(401).json({
      error: "Sign in before starting checkout.",
      requiresAuth: true,
      premium
    });
  }

  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
    return res.status(501).json({
      error: "Stripe checkout is not configured yet.",
      mode: "placeholder",
      userId: premium.userId,
      requiredEnv: ["STRIPE_SECRET_KEY", "STRIPE_PRICE_ID", "APP_URL"],
      checkoutUrl: `${APP_URL}/?billing=checkout-placeholder`,
      message: "Backend route exists and knows the user. Add Stripe SDK/session creation here when ready. Humanity demands tribute before premium features, apparently."
    });
  }

  return res.status(501).json({
    error: "Stripe SDK is not wired yet.",
    mode: "stripe-env-present-but-sdk-not-installed",
    userId: premium.userId,
    checkoutUrl: `${APP_URL}/?billing=checkout-placeholder`,
    message: "Environment variables are present, but live Stripe creation has intentionally not been enabled in this groundwork pass."
  });
});

// Placeholder customer portal endpoint. Later this should create a Stripe billing portal session
// for the authenticated customer id saved in your database.
app.post("/api/billing/create-portal-session", async (req: express.Request, res: express.Response) => {
  const premium = await getPremiumStatus(req);

  if (!premium.isPremium) {
    return res.status(402).json({
      error: "Premium is required before opening a billing portal.",
      requiresPremium: true,
      premium
    });
  }

  return res.status(501).json({
    error: "Stripe billing portal is not configured yet.",
    mode: "placeholder",
    requiredEnv: ["STRIPE_SECRET_KEY", "APP_URL"],
    portalUrl: `${APP_URL}/?billing=portal-placeholder`,
    message: "Backend route exists and premium is verified. Add Stripe customer lookup and billing portal session creation here later."
  });
});

// Future webhook placeholder. Do not accept live Stripe webhooks here until raw-body
// verification with stripe.webhooks.constructEvent is added. Normal express.json()
// parsing is not enough for secure Stripe signature verification.
app.post("/api/billing/webhook", (_req: express.Request, res: express.Response) => {
  return res.status(501).json({
    error: "Stripe webhook verification is not implemented yet.",
    nextStep: "Use express.raw({ type: 'application/json' }) on this route before express.json(), then verify Stripe-Signature with stripe.webhooks.constructEvent."
  });
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
