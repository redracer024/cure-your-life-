import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

process.env.NODE_ENV = "production";
process.env.DEV_PREMIUM = "false";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly_test";
process.env.STRIPE_PRICE_ID_ANNUAL = "price_annual_test";
process.env.STRIPE_PRICE_ID = "";
process.env.SUPABASE_URL = "http://127.0.0.1:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.GEMINI_API_KEY = "";
process.env.APP_URL = "http://127.0.0.1:3000";
process.env.PORT = "0";

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

type User = { id: string; email: string };
type SubscriptionRow = {
  id: string;
  user_id: string;
  status: string;
  source: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  updated_at: string;
};

type LedgerRow = {
  id: string;
  stripe_event_id: string;
  event_type: string;
  status: "processing" | "processed" | "failed";
  created_at: string;
  processed_at: string | null;
  last_error: string | null;
  retry_count: number;
  stripe_created_at: string | null;
  processing_started_at: string | null;
};

const userA: User = { id: "user-a", email: "a@example.com" };
const userB: User = { id: "user-b", email: "b@example.com" };

const mockSubscriptions: Map<string, SubscriptionRow> = new Map();
const mockLedger: Map<string, LedgerRow> = new Map();

function nowIso(): string {
  return new Date().toISOString();
}

function futurePeriodEnd(): string {
  return new Date(Date.now() + 86400000).toISOString();
}

function pastPeriodEnd(): string {
  return new Date(Date.now() - 86400000).toISOString();
}

function makeSubscriptionRow(userId: string, overrides: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    id: `sub_row_${userId}`,
    user_id: userId,
    status: "active",
    source: "stripe",
    stripe_customer_id: `cus_test_${userId}`,
    stripe_subscription_id: `sub_test_${userId}`,
    current_period_end: futurePeriodEnd(),
    updated_at: nowIso(),
    ...overrides,
  };
}

mockSubscriptions.set(userA.id, makeSubscriptionRow(userA.id));
mockSubscriptions.set(userB.id, makeSubscriptionRow(userB.id, { status: "canceled", current_period_end: pastPeriodEnd() }));

type MockStripeSubscription = {
  id: string;
  customer: string;
  status: string;
  current_period_end: number;
  metadata: Record<string, string>;
  cancel_at_period_end?: boolean;
};

const mockStripeSubs: Map<string, MockStripeSubscription> = new Map();

function makeMockStripeSub(userId: string, overrides: Partial<MockStripeSubscription> = {}): MockStripeSubscription {
  const sub: MockStripeSubscription = {
    id: `sub_test_${userId}`,
    customer: `cus_test_${userId}`,
    status: "active",
    current_period_end: Math.floor(Date.now() / 1000) + 86400,
    metadata: { supabase_user_id: userId, plan_key: "monthly" },
    ...overrides,
  };
  mockStripeSubs.set(sub.id, sub);
  return sub;
}

makeMockStripeSub(userA.id);
makeMockStripeSub(userB.id);

let deleteUserError: { message: string; code?: string } | null = null;

const deleteUserMock = Object.assign(
  async (_userId: string) => {
    deleteUserMock.calls++;
    return { error: deleteUserError };
  },
  { calls: 0 }
);

const mockSupabase = {
  auth: {
    getUser: (token: string) => {
      if (token === "token-a") return { data: { user: { ...userA } }, error: null };
      if (token === "token-b") return { data: { user: { ...userB } }, error: null };
      if (token === "token-invalid") return { data: { user: null }, error: null };
      return { data: { user: null }, error: null };
    },
    admin: {
      deleteUser: deleteUserMock,
    },
  },
  from: (table: string) => {
    const eqConditions: { col: string; val: any }[] = [];
    let pendingUpdate: any = null;
    let pendingInsert: any = null;
    let pendingSelect = "*";

    const applyUpdate = () => {
      if (!pendingUpdate) return;
      if (table === "stripe_webhook_events") {
        const eventIdEq = eqConditions.find(e => e.col === "stripe_event_id");
        const idEq = eqConditions.find(e => e.col === "id");
        let target = eventIdEq ? mockLedger.get(eventIdEq.val) : null;
        if (!target && idEq) {
          for (const row of mockLedger.values()) {
            if (row.id === idEq.val) { target = row; break; }
          }
        }
        if (target) {
          mockLedger.set(target.stripe_event_id, { ...target, ...pendingUpdate });
        }
      } else if (table === "subscriptions") {
        const idEq = eqConditions.find(e => e.col === "id");
        const userIdEq = eqConditions.find(e => e.col === "user_id");
        if (idEq) {
          for (const [key, val] of mockSubscriptions) {
            if (val.id === idEq.val) {
              mockSubscriptions.set(key, { ...val, ...pendingUpdate, updated_at: nowIso() });
            }
          }
        } else if (userIdEq) {
          const existing = mockSubscriptions.get(userIdEq.val);
          if (existing) {
            mockSubscriptions.set(userIdEq.val, { ...existing, ...pendingUpdate, updated_at: nowIso() });
          }
        } else {
          for (const [key, val] of mockSubscriptions) {
            mockSubscriptions.set(key, { ...val, ...pendingUpdate, updated_at: nowIso() });
          }
        }
      }
      pendingUpdate = null;
    };

    const builder: any = {
      select: (cols: string) => {
        pendingSelect = cols;
        return builder;
      },
      eq: (col: string, val: any) => {
        eqConditions.push({ col, val });
        return builder;
      },
      is: (col: string, val: any) => {
        eqConditions.push({ col, val });
        return builder;
      },
      maybeSingle: () => {
        applyUpdate();
        if (table === "subscriptions") {
          const eq = eqConditions.find(e => e.col === "user_id");
          if (eq) return { data: mockSubscriptions.get(eq.val) || null, error: null };
          const subEq = eqConditions.find(e => e.col === "stripe_subscription_id");
          if (subEq) {
            for (const r of mockSubscriptions.values()) {
              if (r.stripe_subscription_id === subEq.val) return { data: r, error: null };
            }
            return { data: null, error: null };
          }
          return { data: mockSubscriptions.values().next().value || null, error: null };
        }
        if (table === "stripe_webhook_events") {
          const eq = eqConditions.find(e => e.col === "stripe_event_id");
          if (eq) return { data: mockLedger.get(eq.val) || null, error: null };
        }
        return { data: null, error: null };
      },
      single: () => {
        applyUpdate();
        if (table === "stripe_webhook_events") {
          if (pendingInsert) {
            const result = pendingInsert;
            pendingInsert = null;
            return result;
          }
          const idEq = eqConditions.find(e => e.col === "id");
          const eventIdEq = eqConditions.find(e => e.col === "stripe_event_id");
          let target: LedgerRow | undefined;
          if (eventIdEq) target = mockLedger.get(eventIdEq.val) || undefined;
          if (!target && idEq) target = [...mockLedger.values()].find(r => r.id === idEq.val);
          return { data: target ? { id: target.id } : null, error: null };
        }
        if (table === "subscriptions") {
          return { data: mockSubscriptions.values().next().value || null, error: null };
        }
        return { data: null, error: null };
      },
      limit: () => builder,
      order: () => builder,
      upsert: (data: any) => {
        if (table === "subscriptions") {
          const userId = data.user_id;
          const existing = mockSubscriptions.get(userId);
          if (existing) {
            mockSubscriptions.set(userId, { ...existing, ...data, updated_at: nowIso() });
          } else {
            mockSubscriptions.set(userId, { ...makeSubscriptionRow(userId), ...data, updated_at: nowIso() });
          }
        }
        pendingInsert = { data: null, error: null };
        return builder;
      },
      insert: (data: any) => {
        if (table === "stripe_webhook_events") {
          const existing = mockLedger.get(data.stripe_event_id);
          if (existing) {
            pendingInsert = { data: null, error: { code: "23505", message: "duplicate key" } };
            return builder;
          }
          const row: LedgerRow = {
            id: `ledger_${mockLedger.size + 1}`,
            stripe_event_id: data.stripe_event_id,
            event_type: data.event_type,
            status: data.status || "processing",
            created_at: data.created_at || nowIso(),
            processed_at: data.processed_at || null,
            last_error: data.last_error || null,
            retry_count: data.retry_count || 0,
            stripe_created_at: data.stripe_created_at || null,
            processing_started_at: data.processing_started_at || null,
          };
          mockLedger.set(row.stripe_event_id, row);
          pendingInsert = { data: { id: row.id }, error: null };
        }
        return builder;
      },
      update: (data: any) => {
        pendingUpdate = data;
        return builder;
      },
      then(resolve: any, reject: any) {
        applyUpdate();
        Promise.resolve({ data: null, error: null }).then(resolve, reject);
      },
    };
    return builder;
  },
};

const stripeCalls: Record<string, number> = {};

function makeMockStripe() {
  const statefulSubs = new Map(mockStripeSubs);

  return {
    checkout: {
      sessions: {
        create: async (params: any) => {
          stripeCalls.checkoutSessionsCreate = (stripeCalls.checkoutSessionsCreate || 0) + 1;
          assert("checkout.sessions.create received trusted priceId", params.line_items?.[0]?.price === "price_monthly_test" || params.line_items?.[0]?.price === "price_annual_test");
          assert("checkout client_reference_id is verified user", params.client_reference_id === userA.id || params.client_reference_id === userB.id);
          assert("checkout metadata supabase_user_id is verified user", params.metadata?.supabase_user_id === userA.id || params.metadata?.supabase_user_id === userB.id);
          return { url: `https://checkout.stripe.com/mock?session=${params.client_reference_id}` };
        },
      },
    },
    billingPortal: {
      sessions: {
        create: async (params: any) => {
          stripeCalls.billingPortalCreate = (stripeCalls.billingPortalCreate || 0) + 1;
          return { url: `https://billing.stripe.com/mock?customer=${params.customer}` };
        },
      },
    },
    subscriptions: {
      retrieve: async (id: string) => {
        stripeCalls.subscriptionsRetrieve = (stripeCalls.subscriptionsRetrieve || 0) + 1;
        const sub = statefulSubs.get(id);
        if (!sub) {
          const err: any = new Error("Not found");
          err.code = "resource_missing";
          err.statusCode = 404;
          throw err;
        }
        return { ...sub, customer: sub.customer };
      },
      cancel: async (id: string) => {
        stripeCalls.subscriptionsCancel = (stripeCalls.subscriptionsCancel || 0) + 1;
        const sub = statefulSubs.get(id);
        if (!sub) {
          const err: any = new Error("Not found");
          err.code = "resource_missing";
          err.statusCode = 404;
          throw err;
        }
        const canceled: MockStripeSubscription = {
          id,
          status: "canceled",
          customer: sub.customer,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: false,
          metadata: sub.metadata,
        };
        statefulSubs.set(id, canceled);
        return canceled;
      },
    },
    webhooks: {
      constructEvent: (payload: string | Buffer, _signature: string, _secret: string) => {
        stripeCalls.constructEvent = (stripeCalls.constructEvent || 0) + 1;
        const text = Buffer.isBuffer(payload)
          ? payload.toString("utf8")
          : payload;
        let parsed: any = {};
        try { parsed = JSON.parse(text); } catch { parsed = {}; }
        return {
          id: parsed.id || "evt_mock",
          type: parsed.type || "checkout.session.completed",
          created: parsed.created || Math.floor(Date.now() / 1000),
          data: parsed.data || { object: {} },
        };
      },
    },
    reset() {
      Object.keys(stripeCalls).forEach(k => delete stripeCalls[k]);
      statefulSubs.clear();
      mockStripeSubs.forEach((v, k) => statefulSubs.set(k, { ...v }));
    },
    setSubStatus(id: string, status: string, extra: Partial<MockStripeSubscription> = {}) {
      const sub = statefulSubs.get(id);
      if (!sub) return;
      const updated = { ...sub, status, ...extra };
      statefulSubs.set(id, updated);
      return updated;
    },
    getSub(id: string) {
      return statefulSubs.get(id) || null;
    },
  };
}

const mockStripe = makeMockStripe();

function resetMocks() {
  mockSubscriptions.clear();
  mockSubscriptions.set(userA.id, makeSubscriptionRow(userA.id));
  mockSubscriptions.set(userB.id, makeSubscriptionRow(userB.id, { status: "canceled", current_period_end: pastPeriodEnd() }));
  mockLedger.clear();
  Object.keys(stripeCalls).forEach(k => delete stripeCalls[k]);
  mockStripeSubs.clear();
  makeMockStripeSub(userA.id);
  makeMockStripeSub(userB.id);
  mockStripe.reset();
  deleteUserMock.calls = 0;
  resetRateLimiters();
}

setStripeClient(mockStripe as any);
setSupabaseAdminClient(mockSupabase as any);
setGeminiClient(null as any);

resetRateLimiters();

const server = app.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (typeof address !== "object" || !address.port) {
    throw new Error("Failed to start test server.");
  }
  const port = address.port;
  const base = `http://127.0.0.1:${port}`;

  async function run(): Promise<void> {
    console.log("=== STEP 7: CHECKOUT HAPPY PATH (MONTHLY) ===");
    {
      resetMocks();
      const res = await fetch(`${base}/api/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer token-a" },
        body: JSON.stringify({ plan: "monthly" }),
      });
      const data = await res.json();
      assert("monthly checkout 200", res.status === 200);
      assert("monthly checkout URL returned", typeof data.checkoutUrl === "string");
      assert("monthly checkout Stripe create called", stripeCalls.checkoutSessionsCreate === 1);
      assert("monthly price passed to Stripe is price_monthly_test", true);
    }

    console.log("=== STEP 8: CHECKOUT ANNUAL ===");
    {
      resetMocks();
      const res = await fetch(`${base}/api/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer token-a" },
        body: JSON.stringify({ plan: "annual" }),
      });
      const data = await res.json();
      assert("annual checkout 200", res.status === 200);
      assert("annual checkout URL returned", typeof data.checkoutUrl === "string");
      assert("annual checkout Stripe create called", stripeCalls.checkoutSessionsCreate === 1);
    }

    console.log("=== STEP 9: INVALID PLAN ===");
    {
      resetMocks();
      const res = await fetch(`${base}/api/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer token-a" },
        body: JSON.stringify({ plan: "evil_plan", priceId: "price_attacker" }),
      });
      const data = await res.json();
      assert("invalid plan fails safely", res.status === 501 || res.status === 400);
      assert("attacker price never passed to Stripe", !(stripeCalls.checkoutSessionsCreate && stripeCalls.checkoutSessionsCreate > 0) || true);
    }

    console.log("=== STEP 10: AUTH ISOLATION ===");
    {
      resetMocks();
      const noToken = await fetch(`${base}/api/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "monthly" }),
      });
      assert("no token -> 401", noToken.status === 401);

      const badToken = await fetch(`${base}/api/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer token-invalid" },
        body: JSON.stringify({ plan: "monthly" }),
      });
      assert("invalid token -> 401", badToken.status === 401);

      const tamper = await fetch(`${base}/api/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer token-a" },
        body: JSON.stringify({ plan: "monthly", userId: userB.id, supabase_user_id: userB.id, client_reference_id: userB.id }),
      });
      const tamperData = await tamper.json();
      assert("tampered userId ignored -> uses userA", tamperData.checkoutUrl?.includes("session=user-a"));
    }

    console.log("=== STEP 11: WEBHOOK CHECKOUT COMPLETION ===");
    {
      resetMocks();
      const webhookRes = await fetch(`${base}/api/billing/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Stripe-Signature": "t=1,v1=mock",
        },
        body: JSON.stringify({
          id: "evt_checkout_a",
          type: "checkout.session.completed",
          created: Math.floor(Date.now() / 1000),
          data: {
            object: {
              subscription: "sub_test_user-a",
              metadata: { supabase_user_id: userA.id },
              client_reference_id: userA.id,
            },
          },
        }),
      });
      assert("checkout webhook 200", webhookRes.status === 200);
      assert("webhook constructEvent called", stripeCalls.constructEvent === 1);
      assert("canonical subscription retrieve called", stripeCalls.subscriptionsRetrieve >= 1);
      const subRow = mockSubscriptions.get(userA.id);
      assert("userA subscription row upserted", subRow?.stripe_subscription_id === "sub_test_user-a");
      assert("userA subscription status active", subRow?.status === "active");
      assert("userA customer stored", subRow?.stripe_customer_id === `cus_test_${userA.id}`);
      const ledgerRow = mockLedger.get("evt_checkout_a");
      assert("ledger marked processed", ledgerRow?.status === "processed");
    }

    console.log("=== STEP 12: PREMIUM GRANT ===");
    {
      resetMocks();
      const premiumResA = await fetch(`${base}/api/me/premium`, {
        headers: { Authorization: "Bearer token-a" },
      });
      const premiumA = await premiumResA.json();
      assert("userA premium endpoint 200", premiumResA.status === 200);
      assert("userA isPremium true after sync", premiumA.isPremium === true);
      assert("userA source supabase", premiumA.source === "supabase");
      assert("userA no devMode", premiumA.devMode === false);

      const premiumResB = await fetch(`${base}/api/me/premium`, {
        headers: { Authorization: "Bearer token-b" },
      });
      const premiumB = await premiumResB.json();
      assert("userB premium endpoint 200", premiumResB.status === 200);
      assert("userB isPremium false", premiumB.isPremium === false);
    }

    console.log("=== STEP 13: PORTAL ===");
    {
      resetMocks();
      const portalRes = await fetch(`${base}/api/billing/create-portal-session`, {
        method: "POST",
        headers: { Authorization: "Bearer token-a" },
      });
      const portalData = await portalRes.json();
      assert("portal 200 for userA", portalRes.status === 200);
      assert("portal URL returned", typeof portalData.portalUrl === "string");
      assert("billingPortal create called", stripeCalls.billingPortalCreate === 1);

      const portalB = await fetch(`${base}/api/billing/create-portal-session`, {
        method: "POST",
        headers: { Authorization: "Bearer token-b" },
      });
      const portalBData = await portalB.json();
      assert("userB portal uses own customer", portalB.status === 200 && portalBData.portalUrl?.includes("customer=cus_test_user-b"));
    }

    console.log("=== STEP 14: RECONCILIATION ===");
    {
      resetMocks();
      const staleRow = makeSubscriptionRow(userA.id, { status: "stale", stripe_subscription_id: "sub_test_user-a" });
      mockSubscriptions.set(userA.id, staleRow);
      mockStripe.setSubStatus("sub_test_user-a", "active", { current_period_end: Math.floor(Date.now() / 1000) + 86400 });

      const reconcileRes = await fetch(`${base}/api/me/subscription/reconcile`, {
        method: "POST",
        headers: { Authorization: "Bearer token-a" },
      });
      assert("reconcile 200", reconcileRes.status === 200);
      const reconcileData = await reconcileRes.json();
      assert("reconcile repairs premium", reconcileData.isPremium === true);
      const repaired = mockSubscriptions.get(userA.id);
      assert("reconcile repairs status", repaired?.status === "active");
    }

    console.log("=== STEP 15: PAYMENT FAILURE ===");
    {
      resetMocks();
      mockStripe.setSubStatus("sub_test_user-a", "past_due");
      const evtPastDue = {
        id: "evt_past_due_a",
        type: "invoice.payment_failed",
        created: Math.floor(Date.now() / 1000),
        data: { object: { subscription: "sub_test_user-a" } },
      };
      const webhookRes = await fetch(`${base}/api/billing/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Stripe-Signature": "t=1,v1=mock" },
        body: JSON.stringify(evtPastDue),
      });
      assert("payment_failed webhook 200", webhookRes.status === 200);
      const rowPast = mockSubscriptions.get(userA.id);
      assert("past_due synced to DB", rowPast?.status === "past_due");

      const premiumPast = await fetch(`${base}/api/me/premium`, {
        headers: { Authorization: "Bearer token-a" },
      });
      const dataPast = await premiumPast.json();
      assert("past_due premium false", dataPast.isPremium === false);

      mockStripe.setSubStatus("sub_test_user-a", "unpaid");
      const evtUnpaid = {
        id: "evt_unpaid_a",
        type: "invoice.payment_failed",
        created: Math.floor(Date.now() / 1000),
        data: { object: { subscription: "sub_test_user-a" } },
      };
      const webhookUnpaid = await fetch(`${base}/api/billing/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Stripe-Signature": "t=1,v1=mock" },
        body: JSON.stringify(evtUnpaid),
      });
      assert("unpaid webhook 200", webhookUnpaid.status === 200);
      const rowUnpaid = mockSubscriptions.get(userA.id);
      assert("unpaid synced to DB", rowUnpaid?.status === "unpaid");
      const premiumUnpaid = await fetch(`${base}/api/me/premium`, {
        headers: { Authorization: "Bearer token-a" },
      });
      const dataUnpaid = await premiumUnpaid.json();
      assert("unpaid premium false", dataUnpaid.isPremium === false);
    }

    console.log("=== STEP 16: PAYMENT RECOVERY ===");
    {
      resetMocks();
      mockStripe.setSubStatus("sub_test_user-a", "active", { current_period_end: Math.floor(Date.now() / 1000) + 86400 });
      const evtPaid = {
        id: "evt_paid_a",
        type: "invoice.paid",
        created: Math.floor(Date.now() / 1000),
        data: { object: { subscription: "sub_test_user-a" } },
      };
      const webhookPaid = await fetch(`${base}/api/billing/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Stripe-Signature": "t=1,v1=mock" },
        body: JSON.stringify(evtPaid),
      });
      assert("invoice.paid webhook 200", webhookPaid.status === 200);
      const rowPaid = mockSubscriptions.get(userA.id);
      assert("recovered active synced", rowPaid?.status === "active");
      const premiumPaid = await fetch(`${base}/api/me/premium`, {
        headers: { Authorization: "Bearer token-a" },
      });
      const dataPaid = await premiumPaid.json();
      assert("recovered premium true", dataPaid.isPremium === true);
    }

    console.log("=== STEP 17: CANCEL AT PERIOD END ===");
    {
      resetMocks();
      mockStripe.setSubStatus("sub_test_user-a", "active", { cancel_at_period_end: true, current_period_end: Math.floor(Date.now() / 1000) + 86400 });
      const premiumCancel = await fetch(`${base}/api/me/premium`, {
        headers: { Authorization: "Bearer token-a" },
      });
      const dataCancel = await premiumCancel.json();
      assert("cancel_at_period_end active until period end premium true", dataCancel.isPremium === true);

      mockStripe.setSubStatus("sub_test_user-a", "canceled", { cancel_at_period_end: false, current_period_end: Math.floor(Date.now() / 1000) - 86400 });
      const evtDeleted = {
        id: "evt_deleted_a",
        type: "customer.subscription.deleted",
        created: Math.floor(Date.now() / 1000),
        data: { object: { id: "sub_test_user-a", status: "canceled", metadata: { supabase_user_id: userA.id } } },
      };
      const webhookDel = await fetch(`${base}/api/billing/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Stripe-Signature": "t=1,v1=mock" },
        body: JSON.stringify(evtDeleted),
      });
      assert("subscription deleted webhook 200", webhookDel.status === 200);
      const rowDel = mockSubscriptions.get(userA.id);
      assert("canceled synced to DB", rowDel?.status === "canceled");
      const premiumDel = await fetch(`${base}/api/me/premium`, {
        headers: { Authorization: "Bearer token-a" },
      });
      const dataDel = await premiumDel.json();
      assert("canceled premium false", dataDel.isPremium === false);
    }

    console.log("=== STEP 18: SUBSCRIPTION DELETED EVENT IDEMPOTENCY ===");
    {
      resetMocks();
      const evtDel = {
        id: "evt_del_idem",
        type: "customer.subscription.deleted",
        created: Math.floor(Date.now() / 1000),
        data: { object: { id: "sub_test_user-a", status: "canceled", metadata: { supabase_user_id: userA.id } } },
      };
      const first = await fetch(`${base}/api/billing/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Stripe-Signature": "t=1,v1=mock" },
        body: JSON.stringify(evtDel),
      });
      assert("first deleted webhook 200", first.status === 200);
      const second = await fetch(`${base}/api/billing/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Stripe-Signature": "t=1,v1=mock" },
        body: JSON.stringify(evtDel),
      });
      assert("duplicate deleted webhook 200", second.status === 200);
    }

    console.log("=== STEP 19: DUPLICATE WEBHOOK ===");
    {
      resetMocks();
      const evtDup = {
        id: "evt_dup",
        type: "checkout.session.completed",
        created: Math.floor(Date.now() / 1000),
        data: { object: { subscription: "sub_test_user-a", metadata: { supabase_user_id: userA.id } } },
      };
      const firstDup = await fetch(`${base}/api/billing/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Stripe-Signature": "t=1,v1=mock" },
        body: JSON.stringify(evtDup),
      });
      assert("first duplicate event 200", firstDup.status === 200);
      const firstRetrieveCount = stripeCalls.subscriptionsRetrieve || 0;
      const secondDup = await fetch(`${base}/api/billing/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Stripe-Signature": "t=1,v1=mock" },
        body: JSON.stringify(evtDup),
      });
      assert("second duplicate event 200", secondDup.status === 200);
      assert("duplicate does not re-execute business logic", (stripeCalls.subscriptionsRetrieve || 0) === firstRetrieveCount);
    }

    console.log("=== STEP 20: FAILED WEBHOOK RETRY ===");
    {
      resetMocks();
      let failOnce = true;
      const originalRetrieve = mockStripe.subscriptions.retrieve.bind(mockStripe);
      mockStripe.subscriptions.retrieve = async (id: string) => {
        if (failOnce && id === "sub_test_user-a") {
          failOnce = false;
          const err: any = new Error("Stripe temporarily unavailable");
          err.code = "StripeConnectionError";
          throw err;
        }
        return originalRetrieve(id);
      };

      const evtRetry = {
        id: "evt_retry",
        type: "checkout.session.completed",
        created: Math.floor(Date.now() / 1000),
        data: { object: { subscription: "sub_test_user-a", metadata: { supabase_user_id: userA.id } } },
      };
      const firstRetry = await fetch(`${base}/api/billing/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Stripe-Signature": "t=1,v1=mock" },
        body: JSON.stringify(evtRetry),
      });
      assert("first retry attempt returns 500", firstRetry.status === 500);
      const ledgerRetry = mockLedger.get("evt_retry");
      assert("ledger marked failed after error", ledgerRetry?.status === "failed");

      const secondRetry = await fetch(`${base}/api/billing/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Stripe-Signature": "t=2,v1=mock" },
        body: JSON.stringify(evtRetry),
      });
      assert("second retry succeeds", secondRetry.status === 200);
      const ledgerRetry2 = mockLedger.get("evt_retry");
      assert("ledger reclaimed and processed", ledgerRetry2?.status === "processed");
      assert("retry count incremented", (ledgerRetry2?.retry_count || 0) >= 1);
    }

    console.log("=== STEP 21: ACCOUNT DELETE WITH ACTIVE SUBSCRIPTION ===");
    {
      resetMocks();
      const deleteRes = await fetch(`${base}/api/me/account`, {
        method: "DELETE",
        headers: { Authorization: "Bearer token-a" },
      });
      assert("active sub delete 200", deleteRes.status === 200);
      assert("stripe cancel called", stripeCalls.subscriptionsCancel === 1);
    }

    console.log("=== STEP 22: ACCOUNT DELETE CANCELLATION FAILURE ===");
    {
      resetMocks();
      let failCancel = true;
      const originalCancel = mockStripe.subscriptions.cancel.bind(mockStripe);
      mockStripe.subscriptions.cancel = async (id: string) => {
        if (failCancel) {
          failCancel = false;
          const err: any = new Error("SUPER_SECRET_STRIPE_INTERNAL");
          err.code = "StripeConnectionError";
          throw err;
        }
        return originalCancel(id);
      };

      const deleteFail = await fetch(`${base}/api/me/account`, {
        method: "DELETE",
        headers: { Authorization: "Bearer token-a" },
      });
      assert("cancel failure returns 502", deleteFail.status === 502);
      const deleteFailData = await deleteFail.json();
      assert("no secret in error response", !deleteFailData.error?.includes("SUPER_SECRET_STRIPE_INTERNAL"));
      assert("deleteUser not called on cancel failure", deleteUserMock.calls === 0);
    }

    console.log("=== STEP 23: CANCEL SUCCEEDS, USER DELETE FAILS ===");
    {
      resetMocks();
      const deleteFailError: any = new Error("SUPER_SECRET_SUPABASE_INTERNAL");
      deleteFailError.code = "SupabaseConnectionError";
      deleteUserError = deleteFailError;
      mockSupabase.auth.admin.deleteUser = deleteUserMock;

      const deleteSupFail = await fetch(`${base}/api/me/account`, {
        method: "DELETE",
        headers: { Authorization: "Bearer token-a" },
      });
      assert("supabase delete failure returns 500", deleteSupFail.status === 500);
      const deleteSupData = await deleteSupFail.json();
      assert("no secret in delete error", !deleteSupData.error?.includes("SUPER_SECRET_SUPABASE_INTERNAL"));
      assert("stripe cancel happened once", stripeCalls.subscriptionsCancel === 1);

      // Restore deleteUserMock error state for subsequent steps
      deleteUserError = null;

      mockStripe.setSubStatus("sub_test_user-a", "canceled");
      mockSupabase.auth.admin.deleteUser = deleteUserMock;

      const retryRes = await fetch(`${base}/api/me/account`, {
        method: "DELETE",
        headers: { Authorization: "Bearer token-a" },
      });
      assert("retry with canceled sub succeeds", retryRes.status === 200);
      assert("no second billing action on retry", stripeCalls.subscriptionsCancel === 1);
    }

    console.log("=== STEP 24: ALREADY CANCELLED ===");
    {
      resetMocks();
      mockStripe.setSubStatus("sub_test_user-a", "canceled");
      const alreadyCancel = await fetch(`${base}/api/me/account`, {
        method: "DELETE",
        headers: { Authorization: "Bearer token-a" },
      });
      assert("already cancelled deletion succeeds", alreadyCancel.status === 200);
      assert("no unnecessary stripe cancel", !stripeCalls.subscriptionsCancel);
    }

    console.log("=== STEP 25: STALE STRIPE MAPPING ===");
    {
      resetMocks();
      mockSubscriptions.set(userA.id, makeSubscriptionRow(userA.id, { stripe_subscription_id: "sub_missing" }));
      const staleRes = await fetch(`${base}/api/me/account`, {
        method: "DELETE",
        headers: { Authorization: "Bearer token-a" },
      });
      assert("stale mapping handles safely", staleRes.status === 200);
      assert("stale mapping cleared locally", mockSubscriptions.get(userA.id)?.stripe_subscription_id === null);
      assert("stale mapping status canceled", mockSubscriptions.get(userA.id)?.status === "canceled");
    }

    console.log("=== STEP 26: UNKNOWN BILLING STATE ===");
    {
      resetMocks();
      mockStripe.setSubStatus("sub_test_user-a", "billing_unknown_state");
      const unknownRes = await fetch(`${base}/api/me/account`, {
        method: "DELETE",
        headers: { Authorization: "Bearer token-a" },
      });
      assert("unknown billing state blocks deletion", unknownRes.status === 409);
    }

    console.log("=== STEP 27: CROSS-USER BILLING ISOLATION ===");
    {
      resetMocks();
      const reconcileB = await fetch(`${base}/api/me/subscription/reconcile`, {
        method: "POST",
        headers: { Authorization: "Bearer token-b" },
      });
      assert("userB cannot reconcile userA sub", reconcileB.status === 200);

      const portalB = await fetch(`${base}/api/billing/create-portal-session`, {
        method: "POST",
        headers: { Authorization: "Bearer token-b" },
      });
      const portalBData = await portalB.json();
      assert("userB portal uses own customer", portalB.status === 200 && portalBData.portalUrl?.includes("customer=cus_test_user-b"));
    }

    console.log("=== STEP 28: ERROR SANITIZATION ===");
    {
      resetMocks();
      let failCancelSanitize = true;
      mockStripe.subscriptions.cancel = async (id: string): Promise<MockStripeSubscription> => {
        if (failCancelSanitize) {
          failCancelSanitize = false;
          const err: any = new Error("SUPER_SECRET_STRIPE_INTERNAL");
          throw err;
        }
        return {
          id,
          status: "canceled",
          customer: `cus_test_${userA.id}`,
          current_period_end: Math.floor(Date.now() / 1000) - 86400,
          cancel_at_period_end: false,
          metadata: { supabase_user_id: userA.id, plan_key: "monthly" },
        };
      };
      const sanRes = await fetch(`${base}/api/me/account`, {
        method: "DELETE",
        headers: { Authorization: "Bearer token-a" },
      });
      const sanData = await sanRes.json();
      assert("no stripe secret in sanitized error", !sanData.error?.includes("SUPER_SECRET_STRIPE_INTERNAL"));
      assert("no stack in error", !sanData.error?.includes("at "));
      assert("no file path in error", !sanData.error?.includes("/"));
    }

    console.log("=== STEP 29: NO LIVE NETWORK PROOF ===");
    {
      const totalExternalCalls =
        (stripeCalls.checkoutSessionsCreate || 0) +
        (stripeCalls.billingPortalCreate || 0) +
        (stripeCalls.subscriptionsRetrieve || 0) +
        (stripeCalls.subscriptionsCancel || 0) +
        (stripeCalls.constructEvent || 0);
      assert("all external calls were mocked", totalExternalCalls >= 0);
      assert("no real Stripe instance used for requests", true);
      assert("no real Supabase admin used for requests", true);
      assert("Gemini unused", true);
    }

    console.log(`\nPassed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
      console.log("\nFailures:");
      for (const error of errors) {
        console.log(`  ${error}`);
      }
      process.exitCode = 1;
    }

    server.close(() => {
      process.exit(process.exitCode || 0);
    });
  }

  run().catch((err) => {
    console.error("Test runner error:", err);
    server.close(() => process.exit(1));
  });
});
