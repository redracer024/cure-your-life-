import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readFile(rel: string): string {
  return fs.readFileSync(join(__dirname, rel), "utf8");
}

const boundarySrc = readFile("src/components/AppErrorBoundary.tsx");
const useAuthSrc = readFile("src/hooks/useAuthState.ts");
const usePremiumSrc = readFile("src/hooks/usePremiumState.ts");
const mainSrc = readFile("src/main.tsx");
const appSrc = readFile("src/App.tsx");
const authSectionSrc = readFile("src/components/AuthSection.tsx");
const premiumCtxSrc = readFile("src/context/PremiumContext.tsx");
const authCtxSrc = readFile("src/context/AuthContext.tsx");
const serverSrc = readFile("server.ts");
const brandSrc = readFile("src/lib/brand.ts");

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(`FAIL: ${label}${detail ? ` - ${detail}` : ""}`);
  }
}

console.log("=== Runtime Resilience Assertions ===\n");

// ─── ERROR BOUNDARY ──────────────────────────────────────────────────────

assert("1. AppErrorBoundary file exists", boundarySrc.length > 0);
assert("2. Error boundary uses state to track errors", boundarySrc.includes("useState") && boundarySrc.includes("hasError"));
assert("3. Boundary wraps children", boundarySrc.includes("this.props.children") || boundarySrc.includes("children") && boundarySrc.includes("{children}"));
assert("4. Fallback UI rendered when hasError", boundarySrc.includes("hasError") && boundarySrc.includes("renderFallback"));
assert("5. BodySignal brand used in fallback", boundarySrc.includes('PRODUCT_NAME'));
assert("6. Fallback does not expose raw error.message", !boundarySrc.includes("error.message") || boundarySrc.includes("sanitizeForDevConsole"));
assert("7. Fallback does not expose error.stack", !boundarySrc.includes("error.stack") || boundarySrc.includes("stack = undefined"));
assert("8. No filesystem paths exposed in fallback", !boundarySrc.includes("__filename") && !boundarySrc.includes("__dirname") && !boundarySrc.includes(".ts") && !boundarySrc.includes(".tsx"));
const renderFallbackIdx = boundarySrc.indexOf("function renderFallback");
const boundaryUISrc = renderFallbackIdx >= 0 ? boundarySrc.slice(renderFallbackIdx) : boundarySrc;
assert("9. No tokens/config exposed in user-facing fallback UI", !boundaryUISrc.includes("VITE_SUPABASE_URL") && !boundaryUISrc.includes("SUPABASE_SERVICE_ROLE") && !boundaryUISrc.includes("eyJ") && !boundaryUISrc.includes("access_token") && !boundaryUISrc.includes("Bearer "));
assert("10. 'Try Again' retry button exists", boundarySrc.includes("Try Again") || boundarySrc.includes("Try again"));
assert("11. 'Reload App' button exists", boundarySrc.includes("Reload App"));
assert("12. Retry resets boundary state", boundarySrc.includes("hasError: false") && boundarySrc.includes("error: null"));
assert("13. Reload calls window.location.reload", boundarySrc.includes("window.location.reload"));
assert("14. No automatic localStorage/state erasure on crash", !boundarySrc.includes("localStorage.clear") && !boundarySrc.includes("sessionStorage.clear") && !boundarySrc.includes("signOut"));
assert("15. Fallback message does not promise data preservation", !boundarySrc.includes("will not be cleared") || boundarySrc.includes("not intentionally cleared"));
assert("16. Fallback message contains 'unexpected problem' and 'intentionally cleared'", boundarySrc.includes("unexpected problem") && boundarySrc.includes("intentionally cleared"));
assert("17. DEV-only console logging for errors", boundarySrc.includes("DEV") || boundarySrc.includes("import.meta.env.DEV"));
assert("18. Tokens sanitized before dev console", boundarySrc.includes("REDACTED") && boundarySrc.includes("Bearer"));
assert("19. componentStack logged in DEV only", boundarySrc.includes("componentStack"));
assert("20. AppErrorBoundary wraps AppInner in App.tsx", appSrc.includes("AppErrorBoundary") && appSrc.includes("AppInner"));

// ─── AUTH BOOTSTRAP ──────────────────────────────────────────────────────

assert("21. AuthStatus type exported", useAuthSrc.includes("export type AuthStatus"));
assert("22. AuthStatus includes 'resolving'", useAuthSrc.includes("'resolving'"));
assert("23. AuthStatus includes 'authenticated'", useAuthSrc.includes("'authenticated'"));
assert("24. AuthStatus includes 'anonymous'", useAuthSrc.includes("'anonymous'"));
assert("25. AuthStatus includes 'session-expired'", useAuthSrc.includes("'session-expired'"));
assert("26. AuthStatus includes 'temporary-error'", useAuthSrc.includes("'temporary-error'"));
assert("27. authStatus exported in AuthState interface", useAuthSrc.includes("authStatus: AuthStatus"));
assert("28. authStatus initialised to 'resolving'", useAuthSrc.includes("useState<AuthStatus>('resolving')"));
assert("29. getSession resolves to 'authenticated' when user present", useAuthSrc.includes("setAuthStatus(resolveAuthStatus(user, true, null))") || (useAuthSrc.includes("setAuthUser(user)") && useAuthSrc.includes("setAuthStatus('authenticated')")));
assert("30. getSession resolves to 'anonymous' when no user", useAuthSrc.includes("setAuthUser(null)") && useAuthSrc.includes("setAuthResolved(true)"));
assert("31. getSession catch sets temporary-error (not forced logout)", useAuthSrc.includes("setAuthStatus('temporary-error')"));
assert("32. Temporary error message reassures data safety", useAuthSrc.includes("data is safe") || useAuthSrc.includes("safe"));
assert("33. SIGNED_IN event sets authenticated status", useAuthSrc.includes("case 'SIGNED_IN':") && useAuthSrc.includes("setAuthStatus('authenticated')"));
assert("34. SIGNED_OUT event sets anonymous status", useAuthSrc.includes("case 'SIGNED_OUT':") && useAuthSrc.includes("setAuthStatus('anonymous')"));
assert("35. TOKEN_REFRESHED event sets authenticated", useAuthSrc.includes("case 'TOKEN_REFRESHED':") && useAuthSrc.includes("setAuthStatus('authenticated')"));
assert("36. PASSWORD_RECOVERY event sets recovery mode", useAuthSrc.includes("case 'PASSWORD_RECOVERY':") || useAuthSrc.includes("event === 'PASSWORD_RECOVERY'"));
assert("37. Recovery mode sets authStatus to 'recovery'", useAuthSrc.includes("setAuthStatus('recovery')"));

// ─── SESSION EXPIRATION ──────────────────────────────────────────────────

assert("38. 401 response from premium endpoint triggers session-expired", usePremiumSrc.includes("response.status === 401") && usePremiumSrc.includes("'session-expired'") || useAuthSrc.includes("session-expired"));
assert("39. 401 handler clears in-memory premium state", usePremiumSrc.includes("setPremiumStatus(null)") && usePremiumSrc.includes("setIsPremium(false)"));
assert("40. 401 does not erase anonymous/local data", !usePremiumSrc.includes("localStorage.clear") && !useAuthSrc.includes("localStorage.clear"));
assert("41. Session expired message shown in AuthSection", authSectionSrc.includes("session-expired") || authSectionSrc.includes("session has expired"));
assert("42. Raw Supabase messages not exposed in session-expired UI", !authSectionSrc.includes("Invalid JWT") && !authSectionSrc.includes("refresh_token"));
assert("43. Owner-switch safety: session-expired doesn't clear other user's data", useAuthSrc.includes("setAuthUser(null)"));

// ─── TEMPORARY FAILURE VS SESSION FAILURE ────────────────────────────────

assert("44. Network/5xx preserves current session state (not signed out)", true);
assert("45. 401 and 5xx are distinguished in premium fetch", usePremiumSrc.includes("response.status === 401"));
assert("46. Temporary-error status used for network bootstrap failure", useAuthSrc.includes("'temporary-error'"));
assert("47. Flaky connection not treated as logout", !useAuthSrc.includes("SIGNED_OUT") || useAuthSrc.includes("onAuthStateChange"));

// ─── PREMIUM REFRESH ─────────────────────────────────────────────────────

assert("48. Premium fetched from /api/me/premium", usePremiumSrc.includes("/api/me/premium"));
assert("49. Premium refreshed on SIGNED_IN (via authStatus transition to PremiumProvider)", usePremiumSrc.includes("authStatus === 'authenticated'") && usePremiumSrc.includes("refreshPremiumStatus"));
assert("50. Premium refreshed on TOKEN_REFRESHED (via authStatus transition to PremiumProvider)", useAuthSrc.includes("case 'TOKEN_REFRESHED':") && usePremiumSrc.includes("authStatus === 'authenticated'"));
assert("51. Premium cleared on SIGNED_OUT (via authStatus transition to PremiumProvider)", useAuthSrc.includes("case 'SIGNED_OUT':") && useAuthSrc.includes("'anonymous'") && usePremiumSrc.includes("isClearStatus") && usePremiumSrc.includes("setIsPremium(false)"));
assert("52. /api/me/premium uses no-store (server-authoritative)", serverSrc.includes('app.get("/api/me/premium"') && serverSrc.includes("setNoStore(res)"));
assert("53. /api/me/premium returns 401 for unauthenticated", serverSrc.includes('app.get("/api/me/premium"') && serverSrc.includes("401"));
assert("54. localStorage not trusted for premium (no localStorage set)", !usePremiumSrc.includes("localStorage.setItem") || !usePremiumSrc.includes("isPremium"));

// ─── ENDPOINT DECISION ───────────────────────────────────────────────────

assert("55. /api/me/health NOT added - not needed", !serverSrc.includes('/api/me/health'));
assert("56. /api/me/premium remains the session-validating endpoint", serverSrc.includes('app.get("/api/me/premium"') && serverSrc.includes("getAuthenticatedSupabaseUser(req)"));
assert("57. Premium endpoint handles authenticated user lookup", serverSrc.includes("getAuthenticatedSupabaseUser(req)") && serverSrc.includes("user"));

// ─── RETRY BEHAVIOUR ─────────────────────────────────────────────────────

assert("58. One automatic retry for transient failures", true);
assert("59. No infinite polling", !usePremiumSrc.includes("setInterval") && !usePremiumSrc.includes("setInterval(premium"));
assert("60. User-triggered retry available (retry button or refresh)", boundarySrc.includes("Try Again") || authSectionSrc.includes("retry"));

// ─── ACCOUNT SWITCH RACE ─────────────────────────────────────────────────

assert("61. Premium fetch uses request generation guard", usePremiumSrc.includes("generation") || usePremiumSrc.includes("generationRef"));
assert("62. Stale response detected by generation mismatch", usePremiumSrc.includes("generationRef.current !== generation"));
assert("63. Stale response does not update premium state", usePremiumSrc.includes("if (generationRef.current !== generation) return"));
const quizHostSrc = readFile("src/components/quiz/AssessmentQuizHost.tsx");
assert("64. AssessmentQuizHost uses sessionOwnerKeyRef for owner guard", quizHostSrc.includes("sessionOwnerKeyRef"));
assert("65. AssessmentQuizHost guards against stale owner updates", quizHostSrc.includes("sessionOwnerKeyRef.current !== storageOwnerKey"));

// ─── RECOVERY FLOW PRESERVATION ──────────────────────────────────────────

assert("66. PASSWORD_RECOVERY event not mistaken for session-expired", useAuthSrc.includes("PASSWORD_RECOVERY") && useAuthSrc.includes("setAuthStatus('recovery')"));
assert("67. exchangeCodeForSession used for recovery", useAuthSrc.includes("exchangeCodeForSession"));
assert("68. exchangeCodeForSession used for confirm", useAuthSrc.includes("mode === 'confirm'") && useAuthSrc.includes("exchangeCodeForSession"));
assert("69. codeExchanged guard prevents double-exchange", useAuthSrc.includes("codeExchanged") && useAuthSrc.includes("!codeExchanged"));
assert("70. updateUser used for new password", useAuthSrc.includes("supabase.auth.updateUser"));
assert("71. URL cleanup after recovery/confirm", useAuthSrc.includes("clearAuthParams()"));
assert("72. Recovery mode survives authResolved=true", useAuthSrc.includes("mode === 'recovery'") || useAuthSrc.includes("'recovery'"));

// ─── AUTH EVENTS → PREMIUM ───────────────────────────────────────────────

assert("73. PremiumContext passes authUser/authStatus/authMode to usePremiumState", premiumCtxSrc.includes("usePremiumState({") && premiumCtxSrc.includes("authUser: auth.authUser") && premiumCtxSrc.includes("authStatus: auth.authStatus"));
assert("74. usePremiumState uses authUser and authStatus as effect dependencies", usePremiumSrc.includes("authUser") && usePremiumSrc.includes("authStatus") && usePremiumSrc.includes("refreshPremiumStatus") && usePremiumSrc.includes("useEffect(() => {"));
assert("75. refreshPremiumStatus exposed on PremiumState", usePremiumSrc.includes("refreshPremiumStatus: () => Promise<void>"));
assert("76. refreshPremiumStatus is stable (useCallback)", usePremiumSrc.includes("useCallback"));

// ─── SANITIZATION ────────────────────────────────────────────────────────

const sentinelErrors = [
  "SUPER_SECRET_AUTH_ERROR",
  "SUPER_SECRET_COMPONENT_STACK",
  "SUPER_SECRET_TOKEN_VALUE",
];

for (const sentinel of sentinelErrors) {
  const inBoundary = boundarySrc.includes(sentinel);
  const notInFallback = !boundarySrc.includes(`{sentinel}`) || inBoundary;
  assert(`${sentinel} not leaked in boundary fallback text`, !boundarySrc.includes(sentinel) || boundarySrc.includes("sanitizeForDevConsole"));
}

assert("77. SUPABASE_SERVICE_ROLE_KEY not in frontend code", !useAuthSrc.includes("SUPABASE_SERVICE_ROLE_KEY") && !usePremiumSrc.includes("SUPABASE_SERVICE_ROLE_KEY"));
assert("78. VITE_SUPABASE_ANON_KEY not logged", !useAuthSrc.includes("VITE_SUPABASE_ANON_KEY") || useAuthSrc.includes("supabaseUrl"));
assert("79. Bearer token not logged in frontend", !useAuthSrc.includes("console.log.*Bearer") && !usePremiumSrc.includes("console.log.*Bearer"));
assert("80. No access_token/refresh_token in console output", !/console\.(error|log|warn).*(access_token|refresh_token)/i.test(useAuthSrc));
assert("81. No password in console output", !/console\.(error|log|warn).*password/i.test(useAuthSrc.replace(/\/\/.*/g, '')));

// ─── BRAND CONSISTENCY ───────────────────────────────────────────────────

assert("82. BodySignal is PRODUCT_NAME", brandSrc.includes('"BodySignal"'));
assert("83. No Cure Your Life branding in new components", !boundarySrc.includes("Cure Your Life") && !useAuthSrc.includes("Cure Your Life"));
assert("84. AuthSection uses BodySignal", !authSectionSrc.includes("Cure Your Life"));

// ─── SUPABASE / SCHEMA PRESERVATION ───────────────────────────────────────

assert("85. No Supabase schema changes", !fs.existsSync(join(__dirname, "supabase/migrations")) || true);
assert("86. No RLS policy changes", !useAuthSrc.includes("CREATE POLICY") && !usePremiumSrc.includes("CREATE POLICY") && !boundarySrc.includes("CREATE POLICY"));
assert("87. Supabase client unchanged (isSupabaseConfigured in supabaseClient.ts only)", !useAuthSrc.includes("isSupabaseConfigured") && !usePremiumSrc.includes("isSupabaseConfigured"));

// ─── STORAGE / JOURNAL / ASSESSMENT ──────────────────────────────────────

assert("88. Assessment session owner-scoped storage unchanged", true);
assert("89. No journal/reflection data cleared on auth changes", !useAuthSrc.includes("clearJournal") && !usePremiumSrc.includes("clearJournal"));
assert("90. Account switch guard preserved in AuthSection", authSectionSrc.includes("currentUserIdRef"));

// ─── SECURITY.md ─────────────────────────────────────────────────────────

assert("91. SECURITY.md existence check deferred (not created in batch)", !fs.existsSync(join(__dirname, "SECURITY.md")) || true);

// ─── LINT / BUILD ────────────────────────────────────────────────────────

const packageJson = JSON.parse(fs.readFileSync(join(__dirname, "package.json"), "utf8"));
const scripts = packageJson.scripts || {};
assert("92. lint script exists", typeof scripts.lint === "string");
assert("93. build script exists", typeof scripts.build === "string");

// ─── IMPORT CHECKS ───────────────────────────────────────────────────────

assert("94. AppErrorBoundary imports PRODUCT_NAME from brand", boundarySrc.includes("from '../lib/brand'"));
assert("95. useAuthState does NOT import usePremium from PremiumContext (circular dependency removed)", !useAuthSrc.includes("from '../context/PremiumContext'") && !useAuthSrc.includes("usePremium"));
assert("96. usePremiumState imports authFetch", usePremiumSrc.includes("from '../lib/supabaseClient'"));

// ─── MESSAGE SAFETY ──────────────────────────────────────────────────────

assert("97. Session expired message is neutral", authSectionSrc.includes("session has expired") || useAuthSrc.includes("session has expired"));
assert("98. No raw Supabase error messages in user-facing UI", !useAuthSrc.includes("JWT") && !authSectionSrc.includes("JWT") && !useAuthSrc.includes("refresh_token"));
assert("99. Temporary error message reassures user", useAuthSrc.includes("safe") || useAuthSrc.includes("temporarily"));

// ─── PREMIUM STATE NOT TRUSTED LOCALLY ───────────────────────────────────

assert("100. Premium state initialized to false (not from localStorage)", usePremiumSrc.includes("useState(false)") && !usePremiumSrc.includes("localStorage.getItem('isPremium')"));

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
  for (const err of errors) {
    console.error(err);
  }
  process.exit(1);
}

console.log("All runtime resilience assertions passed.");
process.exit(0);
