import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

process.env.NODE_ENV = "production";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.SUPABASE_URL = "https://mock.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role";
process.env.GEMINI_API_KEY = "mock-gemini-key";
process.env.DEV_PREMIUM = "false";
process.env.PORT = "0";
process.env.APP_URL = "http://127.0.0.1:3000";

const { app, setStripeClient, setSupabaseAdminClient, setGeminiClient, resetRateLimiters } = await import("./server.ts");

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed++;
    return;
  }
  failed++;
  errors.push(`FAIL: ${label}${detail ? ` - ${detail}` : ""}`);
}

const mockStripe = {
  checkout: {
    sessions: {
      create: async (_params: any) => ({ url: "https://checkout.stripe.com/mock" }),
    },
  },
  billingPortal: {
    sessions: {
      create: async (_params: any) => ({ url: "https://billing.stripe.com/mock" }),
    },
  },
  webhooks: {
    constructEvent: (_body: any, _signature: string, _secret: string) => ({
      id: "evt_mock",
      type: "checkout.session.completed",
      created: Math.floor(Date.now() / 1000),
      data: { object: {} },
    }),
  },
  subscriptions: {
    retrieve: (_id: string) => ({
      id: "sub_mock",
      status: "active",
      metadata: { supabase_user_id: "user-123" },
      customer: "cus_mock",
      current_period_end: Math.floor(Date.now() / 1000) + 86400,
    }),
    cancel: (_id: string) => ({
      id: "sub_mock",
      status: "canceled",
      customer: "cus_mock",
    }),
  },
};

let mockSubscription: any = {
  id: "sub_123",
  user_id: "user-123",
  status: "active",
  source: "stripe",
  stripe_customer_id: "cus_mock",
  stripe_subscription_id: "sub_mock",
  current_period_end: new Date(Date.now() + 86400000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockSupabase = {
  auth: {
    getUser: (_token: string) => {
      if (_token === "valid-token") {
        return { data: { user: { id: "user-123", email: "test@example.com" } }, error: null };
      }
      return { data: { user: null }, error: null };
    },
    admin: {
      deleteUser: (_id: string) => ({ error: null }),
    },
  },
  from: (_table: string) => {
    const builder: any = {
      select: (_cols: string) => builder,
      eq: (_col: string, _val: any) => builder,
      maybeSingle: () => ({ data: _table === "subscriptions" ? mockSubscription : null, error: null }),
      single: () => ({ data: _table === "subscriptions" ? mockSubscription : null, error: null }),
      limit: () => builder,
      order: () => builder,
      upsert: (data: any) => {
        if (_table === "subscriptions") {
          mockSubscription = { ...mockSubscription, ...data };
        }
        return { error: null };
      },
      insert: (_data: any) => builder,
      update: (data: any) => {
        if (_table === "subscriptions") {
          mockSubscription = { ...mockSubscription, ...data };
        }
        return builder;
      },
      is: (_col: string, _val: any) => builder,
    };
    return builder;
  },
};

let geminiShouldThrow = false;

const mockGemini = {
  models: {
    generateContent: async (_params: any) => {
      if (geminiShouldThrow) {
        geminiShouldThrow = false;
        throw new Error("Upstream AI service temporarily unavailable");
      }
      return {
        text: JSON.stringify({
          emotionalRoot: "Mock emotional root",
          physiologicalDescription: "Mock physiological description",
          sarcasticReview: "Mock sarcastic review",
          mindfulnessPrompts: ["Prompt 1", "Prompt 2"],
          practicalTips: ["Tip 1", "Tip 2"],
        }),
      };
    },
  },
};

setStripeClient(mockStripe as any);
setSupabaseAdminClient(mockSupabase as any);
setGeminiClient(mockGemini as any);

resetRateLimiters();

function resetMockState(): void {
  mockSubscription = {
    id: "sub_123",
    user_id: "user-123",
    status: "active",
    source: "stripe",
    stripe_customer_id: "cus_mock",
    stripe_subscription_id: "sub_mock",
    current_period_end: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  geminiShouldThrow = false;
}

const server = app.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (typeof address !== "object" || !address.port) {
    throw new Error("Failed to start test server.");
  }
  const port = address.port;
  const base = `http://127.0.0.1:${port}`;

  console.log("Production security headers");
  (async () => {
    const res = await fetch(`${base}/api/me/premium`, {
      headers: { Authorization: "Bearer valid-token" },
    });
    assert("1. production CSP exists", res.headers.get("content-security-policy")?.includes("default-src 'self'"));
    assert("2. production CSP no wildcard default-src", !res.headers.get("content-security-policy")?.includes("default-src *"));
    assert("3. production CSP no wildcard script-src", !res.headers.get("content-security-policy")?.includes("script-src *"));
    assert("4. production CSP no unsafe-eval", !res.headers.get("content-security-policy")?.includes("'unsafe-eval'"));
    assert("5. frame protection header exists", res.headers.get("x-frame-options") === "DENY");
    assert("6. nosniff exists", res.headers.get("x-content-type-options") === "nosniff");
    assert("7. referrer policy exists", res.headers.get("referrer-policy") === "strict-origin-when-cross-origin");
    assert("8. permissions policy exists", res.headers.has("permissions-policy"));
    assert("9. COOP same-origin exists", res.headers.get("cross-origin-opener-policy") === "same-origin");

    console.log("Dev CSP differences");
    const { buildContentSecurityPolicy } = await import("./src/lib/server/securityHeaders.ts");
    const devCsp = buildContentSecurityPolicy({ isDevelopment: true, supabaseUrl: "https://abc.supabase.co" });
    const prodCspDirect = buildContentSecurityPolicy({ isDevelopment: false, supabaseUrl: "https://abc.supabase.co" });
    assert("10. dev CSP allows unsafe-eval", devCsp.includes("'unsafe-eval'"));
    assert("11. dev CSP includes ws/wss", devCsp.includes("ws:") && devCsp.includes("wss:"));
    assert("12. prod CSP excludes unsafe-eval", !prodCspDirect.includes("'unsafe-eval'"));
    assert("13. prod CSP excludes ws/wss", !prodCspDirect.includes("ws:") && !prodCspDirect.includes("wss:"));

    console.log("HSTS production-only");
    const insecureRes = await fetch(`${base}/api/me/premium`, {
      headers: { Authorization: "Bearer valid-token" },
    });
    assert("14. HSTS absent on insecure request", insecureRes.headers.get("strict-transport-security") == null);

    console.log("Body/parser results");
    const oversized = JSON.stringify({ data: "x".repeat(200 * 1024) });
    const bodyLimitRes = await fetch(`${base}/api/billing/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer valid-token" },
      body: oversized,
    });
    assert("15. JSON 128kb limit returns 413", bodyLimitRes.status === 413);

    const malformedRes = await fetch(`${base}/api/billing/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer valid-token" },
      body: "{invalid json",
    });
    assert("16. malformed JSON returns 400", malformedRes.status === 400);

    const contentTypeRes = await fetch(`${base}/api/billing/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "text/plain", Authorization: "Bearer valid-token" },
      body: "{}",
    });
    assert("17. non-JSON content type returns 415", contentTypeRes.status === 415);

    const veryLargeWebhook = JSON.stringify({ data: "x".repeat(2 * 1024 * 1024) });
    const webhookLimitRes = await fetch(`${base}/api/billing/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Stripe-Signature": "t=1,v1=signature" },
      body: veryLargeWebhook,
    });
    assert("18. Stripe raw-body 1mb limit returns 413", webhookLimitRes.status === 413);

    console.log("Rate-limit results");
    resetRateLimiters();

    for (let i = 0; i < 10; i++) {
      const r = await fetch(`${base}/api/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer valid-token" },
        body: JSON.stringify({ plan: "monthly" }),
      });
      if (i < 10) {
        assert(`checkout allowed ${i + 1}`, r.status !== 429, `status=${r.status}`);
      }
    }
    const checkoutBlocked = await fetch(`${base}/api/billing/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer valid-token" },
      body: JSON.stringify({ plan: "monthly" }),
    });
    assert("19. checkout 10/hour blocks 11th", checkoutBlocked.status === 429);

    resetRateLimiters();
    for (let i = 0; i < 10; i++) {
      const r = await fetch(`${base}/api/billing/create-portal-session`, {
        method: "POST",
        headers: { Authorization: "Bearer valid-token" },
      });
      if (i < 10) {
        assert(`portal allowed ${i + 1}`, r.status !== 429, `status=${r.status}`);
      }
    }
    const portalBlocked = await fetch(`${base}/api/billing/create-portal-session`, {
      method: "POST",
      headers: { Authorization: "Bearer valid-token" },
    });
    assert("20. portal 10/hour blocks 11th", portalBlocked.status === 429);

    resetRateLimiters();
    for (let i = 0; i < 20; i++) {
      const r = await fetch(`${base}/api/me/subscription/reconcile`, {
        method: "POST",
        headers: { Authorization: "Bearer valid-token" },
      });
      if (i < 20) {
        assert(`reconcile allowed ${i + 1}`, r.status !== 429, `status=${r.status}`);
      }
    }
    const reconcileBlocked = await fetch(`${base}/api/me/subscription/reconcile`, {
      method: "POST",
      headers: { Authorization: "Bearer valid-token" },
    });
    assert("21. reconcile 20/hour blocks 21st", reconcileBlocked.status === 429);

    resetRateLimiters();
    for (let i = 0; i < 5; i++) {
      const r = await fetch(`${base}/api/me/account`, {
        method: "DELETE",
        headers: { Authorization: "Bearer valid-token" },
      });
      if (i < 5) {
        assert(`account delete allowed ${i + 1}`, r.status !== 429, `status=${r.status}`);
      }
    }
    const deleteBlocked = await fetch(`${base}/api/me/account`, {
      method: "DELETE",
      headers: { Authorization: "Bearer valid-token" },
    });
    assert("22. account delete 5/hour blocks 6th", deleteBlocked.status === 429);

    resetMockState();
    const analyzerPremiumRes = await fetch(`${base}/api/me/premium`, {
      headers: { Authorization: "Bearer valid-token" },
    });
    const analyzerPremiumJson = await analyzerPremiumRes.json();
    assert("23a. user is premium for analyzer test", analyzerPremiumJson.isPremium === true);

    for (let i = 0; i < 30; i++) {
      const r = await fetch(`${base}/api/analyze-symptom`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer valid-token" },
        body: JSON.stringify({ symptom: "headache" }),
      });
      if (i < 30) {
        assert(`analyzer allowed ${i + 1}`, r.status !== 429, `status=${r.status}`);
      }
    }
    const analyzerBlocked = await fetch(`${base}/api/analyze-symptom`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer valid-token" },
      body: JSON.stringify({ symptom: "headache" }),
    });
    assert("23. analyzer 30/hour blocks 31st", analyzerBlocked.status === 429);

    console.log("Spoofing/isolation results");
    resetRateLimiters();
    resetMockState();
    await fetch(`${base}/api/billing/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer valid-token" },
      body: JSON.stringify({ plan: "monthly" }),
    });
    for (let i = 0; i < 9; i++) {
      await fetch(`${base}/api/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer valid-token", "X-User-Id": "spoofed-user" },
        body: JSON.stringify({ plan: "monthly" }),
      });
    }
    const userAAfterSpoof = await fetch(`${base}/api/billing/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer valid-token", "X-User-Id": "spoofed-user" },
      body: JSON.stringify({ plan: "monthly" }),
    });
    assert("24. x-user-id spoof shares verified-user rate limit (not isolated)", userAAfterSpoof.status === 429);

    resetRateLimiters();
    resetMockState();
    for (let i = 0; i < 11; i++) {
      const r = await fetch(`${base}/api/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer valid-token", "X-Forwarded-For": "1.2.3.4" },
        body: JSON.stringify({ plan: "monthly" }),
      });
      if (i < 10) {
        assert(`XFF allowed ${i + 1}`, r.status !== 429, `status=${r.status}`);
      }
    }
    const xffSpoofed = await fetch(`${base}/api/billing/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer valid-token", "X-Forwarded-For": "1.2.3.4" },
      body: JSON.stringify({ plan: "monthly" }),
    });
    assert("25. X-Forwarded-For spoof uses real IP with trust proxy=false", xffSpoofed.status === 429);

    console.log("Webhook exclusion");
    resetRateLimiters();
    resetMockState();
    for (let i = 0; i < 15; i++) {
      const r = await fetch(`${base}/api/billing/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Stripe-Signature": "t=1,v1=signature" },
        body: JSON.stringify({ id: `evt_${i}` }),
      });
      assert(`webhook excluded from limiter ${i + 1}`, r.status !== 429, `status=${r.status}`);
    }

    console.log("Method enforcement");
    const wrongMethodRes = await fetch(`${base}/api/billing/create-checkout-session`, {
      method: "GET",
    });
    assert("26. wrong HTTP method returns 404", wrongMethodRes.status === 404);

    console.log("Sanitized error results");
    geminiShouldThrow = true;
    const errorRes = await fetch(`${base}/api/analyze-symptom`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer valid-token" },
      body: JSON.stringify({ symptom: "headache" }),
    });
    const errorText = await errorRes.text();
    assert("27. service errors sanitized", errorRes.status === 500 && !errorText.includes("at ") && !errorText.includes("file://") && !errorText.endsWith(".ts"));

    console.log("CORS results");
    assert("28. no wildcard CORS", !errorRes.headers.get("access-control-allow-origin")?.includes("*"));

    console.log("Fail-closed NODE_ENV");
    const absentEnvRes = await fetch(`${base}/api/me/premium`);
    assert("29. absent NODE_ENV serves static not dev middleware", absentEnvRes.status === 401 || absentEnvRes.status === 404);

    server.close();
    console.log(`\nPassed: ${passed}`);
    console.log(`Failed: ${failed}`);
    if (failed > 0) {
      console.log(errors.join("\n"));
      process.exit(1);
    }
  })();
});
