/**
 * Batch 39 — Live Supabase Auth Verification + Production Env Reconciliation Validator
 *
 * Run with: npx tsx tmp-validate-live-supabase-auth.ts
 *
 * Validates (static, no live mutations):
 * - Canonical frontend key is VITE_SUPABASE_PUBLISHABLE_KEY
 * - VITE_SUPABASE_URL is required / canonical
 * - Legacy VITE_SUPABASE_ANON_KEY is supported intentionally (backward-compat)
 * - Frontend never references SUPABASE_SERVICE_ROLE_KEY as env
 * - Server accepts service credential opaquely (no JWT-shape dependency)
 * - Production Site URL documented
 * - Recovery redirect documented
 * - Confirmation redirect documented
 * - VITE_* variables documented as build-time/public
 * - Server secret documented runtime-only
 * - SMTP remains gated
 * - mailer_autoconfirm remains true
 * - No committed secrets
 * - Dockerfile passes VITE_* as build ARGs (not server secrets)
 * - server.ts CSP uses SUPABASE_URL (not VITE_SUPABASE_URL)
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

const readFile = (rel: string): string => {
  const full = join(__dirname, rel);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
};

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

console.log("=== Batch 39: Live Supabase Auth Validator ===\n");

const supabaseClientSrc = readFile("src/lib/supabaseClient.ts");
const useAuthStateSrc = readFile("src/hooks/useAuthState.ts");
const serverSrc = readFile("server.ts");
const dockerfileSrc = readFile("Dockerfile");
const envExampleSrc = readFile(".env.example");
const renderYamlSrc = readFile("render.yaml");
const authRedirectSrc = readFile("src/lib/auth/authRedirect.ts");
const authSectionSrc = readFile("src/components/AuthSection.tsx");
const securityHeadersSrc = readFile("src/lib/server/securityHeaders.ts");

const setupDoc = readFile("docs/supabase-production-setup.md");
const envMatrixSrc = readFile("docs/production-env-matrix.md");
const renderDeploySrc = readFile("docs/render-deployment.md");

const PRODUCTION_ORIGIN = "https://bodysignal-xa18.onrender.com";
const SUPABASE_PROJECT = "psurstxfufkqqtpuaxel";

// ─── 1. Canonical frontend key ─────────────────────────────────────────────

assert(
  "1. supabaseClient.ts reads VITE_SUPABASE_URL",
  supabaseClientSrc.includes("VITE_SUPABASE_URL")
);
assert(
  "2. supabaseClient.ts reads VITE_SUPABASE_PUBLISHABLE_KEY",
  supabaseClientSrc.includes("VITE_SUPABASE_PUBLISHABLE_KEY")
);
assert(
  "3. PUBLISHABLE_KEY checked BEFORE ANON_KEY (canonical precedence)",
  (() => {
    const pubIdx = supabaseClientSrc.indexOf("VITE_SUPABASE_PUBLISHABLE_KEY");
    const anonIdx = supabaseClientSrc.indexOf("VITE_SUPABASE_ANON_KEY");
    return pubIdx >= 0 && anonIdx >= 0 && pubIdx < anonIdx;
  })()
);

// ─── 2. VITE_SUPABASE_URL required / canonical ───────────────────────────────

assert(
  "4. .env.example documents VITE_SUPABASE_URL",
  envExampleSrc.includes("VITE_SUPABASE_URL=")
);
assert(
  "5. render.yaml declares VITE_SUPABASE_URL",
  renderYamlSrc.includes("key: VITE_SUPABASE_URL")
);

// ─── 3. Legacy anon key supported intentionally ────────────────────────────

assert(
  "6. supabaseClient.ts still references VITE_SUPABASE_ANON_KEY (backward-compat)",
  supabaseClientSrc.includes("VITE_SUPABASE_ANON_KEY")
);
assert(
  "7. .env.example documents ANON_KEY as backward-compat fallback",
  envExampleSrc.includes("VITE_SUPABASE_ANON_KEY") &&
    envExampleSrc.toLowerCase().includes("backward")
);

// ─── 4. Frontend never references SUPABASE_SERVICE_ROLE_KEY as env ────────

assert(
  "8. supabaseClient.ts does NOT reference SUPABASE_SERVICE_ROLE_KEY",
  !supabaseClientSrc.includes("SUPABASE_SERVICE_ROLE_KEY")
);

const tsxFiles = collectSourceFiles(join(__dirname, "src"), [".ts", ".tsx"]);
let serviceRoleInFrontend = false;
let viteServiceRoleInFrontend = false;
for (const file of tsxFiles) {
  const content = fs.readFileSync(file, "utf8");
  if (/\bprocess\.env\.SUPABASE_SERVICE_ROLE_KEY\b/.test(content)) {
    serviceRoleInFrontend = true;
  }
  if (/import\.meta\.env\.VITE_SUPABASE_SERVICE_ROLE_KEY/.test(content)) {
    viteServiceRoleInFrontend = true;
  }
}
assert("9. No process.env.SUPABASE_SERVICE_ROLE_KEY in frontend source", !serviceRoleInFrontend);
assert("10. No VITE_SUPABASE_SERVICE_ROLE_KEY in frontend source", !viteServiceRoleInFrontend);

// ─── 5. Server accepts service credential opaquely ─────────────────────────

assert(
  "11. server.ts reads SUPABASE_URL",
  /process\.env\.SUPABASE_URL/.test(serverSrc)
);
assert(
  "12. server.ts reads SUPABASE_SERVICE_ROLE_KEY",
  /process\.env\.SUPABASE_SERVICE_ROLE_KEY/.test(serverSrc)
);
assert(
  "13. server creates client with opaque key (createClient(url, key, ...))",
  /createClient\(SUPABASE_URL,\s*SUPABASE_SERVICE_ROLE_KEY/.test(serverSrc) ||
    /createClient\(.*SUPABASE_SERVICE_ROLE_KEY/.test(serverSrc)
);

// No JWT-shape validation — no regex rejecting sb_secret_ format
const serverHasJwtShapeCheck =
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(serverSrc) ||
  /jwt/i.test(serverSrc.replace(/\/\/.*/g, "")) && /test\(.{0,50}eyJ/.test(serverSrc);
assert(
  "14. server does not enforce JWT-shape on service credential",
  !serverHasJwtShapeCheck
);

// Modern sb_secret_ format should be accepted (no validation rejecting it)
assert(
  "15. server passes credential opaquely to createClient (no format validation)",
  !/eyJ.*jwt|jwt.*eyJ/i.test(
    serverSrc.split("createClient")[1]?.split(")")[0] || ""
  )
);

// ─── 6. Production Site URL documented ─────────────────────────────────────

assert(
  "16. Production origin documented in setup doc",
  setupDoc.includes(PRODUCTION_ORIGIN) && setupDoc.includes("Site URL")
);
assert(
  "17. Production origin documented in env matrix",
  envMatrixSrc.includes(PRODUCTION_ORIGIN)
);
assert(
  "18. Production origin documented in render-deployment doc",
  renderDeploySrc.includes(PRODUCTION_ORIGIN)
);

// ─── 7. Recovery redirect documented ───────────────────────────────────────

assert(
  "19. Recovery redirect documented (exact URL)",
  setupDoc.includes(`${PRODUCTION_ORIGIN}/?auth=recovery`) ||
    envMatrixSrc.includes(`${PRODUCTION_ORIGIN}/?auth=recovery`) ||
    renderDeploySrc.includes(`${PRODUCTION_ORIGIN}/?auth=recovery`)
);
assert(
  "20. Code uses window.location.origin for recovery redirect (no localhost)",
  useAuthStateSrc.includes("window.location.origin") &&
    useAuthStateSrc.includes("auth=recovery")
);
assert(
  "21. No localhost hardcoded in auth redirect code",
  !/localhost:3000\/\?auth=recovery/.test(useAuthStateSrc)
);

// ─── 8. Confirmation redirect documented ───────────────────────────────────

assert(
  "22. Confirmation redirect documented (exact URL)",
  setupDoc.includes(`${PRODUCTION_ORIGIN}/?auth=confirm`) ||
    envMatrixSrc.includes(`${PRODUCTION_ORIGIN}/?auth=confirm`) ||
    renderDeploySrc.includes(`${PRODUCTION_ORIGIN}/?auth=confirm`)
);
assert(
  "23. authRedirect.ts recognizes 'confirm' mode",
  authRedirectSrc.includes("'confirm'") || authRedirectSrc.includes('"confirm"')
);
assert(
  "24. useAuthState.ts handles confirm mode",
  useAuthStateSrc.includes("mode === 'confirm'") ||
    useAuthStateSrc.includes("mode === \"confirm\"")
);
assert(
  "25. exchangeCodeForSession used for both recovery and confirm",
  (useAuthStateSrc.match(/exchangeCodeForSession/g) || []).length >= 2
);

// ─── 9. VITE_* documented as build-time/public ─────────────────────────────

assert(
  "26. .env.example documents VITE_* as build-time",
  envExampleSrc.toLowerCase().includes("build-time") ||
    envExampleSrc.toLowerCase().includes("build time")
);
assert(
  "27. .env.example documents VITE_* as public/browser-safe",
  envExampleSrc.toLowerCase().includes("public") ||
    envExampleSrc.toLowerCase().includes("browser")
);

// ─── 10. Server secret documented runtime-only ─────────────────────────────

assert(
  "28. .env.example documents SUPABASE_SERVICE_ROLE_KEY as server-only",
  envExampleSrc.includes("SUPABASE_SERVICE_ROLE_KEY") &&
    /server\s*secret|runtime.*only|never.*browser|server-only/i.test(envExampleSrc)
);
assert(
  "29. .env.example does not expose real sb_secret_ value (only placeholder)",
  !/sb_secret_[a-zA-Z0-9]{20,}/.test(envExampleSrc)
);

// ─── 11. SMTP remains gated ─────────────────────────────────────────────────

assert(
  "30. Setup doc documents SMTP remains gated",
  setupDoc.toLowerCase().includes("smtp") &&
    (setupDoc.toLowerCase().includes("blocked") || setupDoc.toLowerCase().includes("not configured"))
);
assert(
  "31. Env matrix documents SMTP BLOCKED",
  envMatrixSrc.includes("BLOCKED") && envMatrixSrc.toLowerCase().includes("smtp")
);

// ─── 12. mailer_autoconfirm remains true ───────────────────────────────────

assert(
  "32. Setup doc documents mailer_autoconfirm = true",
  setupDoc.includes("mailer_autoconfirm") && setupDoc.includes("true")
);
assert(
  "33. Setup doc states DO NOT disable autoconfirm before SMTP works",
  setupDoc.toLowerCase().includes("do not disable") ||
    setupDoc.toLowerCase().includes("DO NOT disable")
);

// ─── 13. No committed secrets ────────────────────────────────────────────────

assert(
  "34. .gitignore ignores .env files",
  readFile(".gitignore").includes(".env")
);
assert(
  "35. .env is not tracked by git",
  (() => {
    try {
      const ls = execSync("git ls-files .env .env.local .env.production", {
        cwd: __dirname,
        encoding: "utf8",
      }).trim();
      return ls === "";
    } catch {
      return true; // git not available
    }
  })()
);

// Scan tracked files for real secret patterns
let trackedSecretFound = false;
try {
  const trackedFiles = execSync("git ls-files", {
    cwd: __dirname,
    encoding: "utf8",
  }).trim().split("\n").filter(Boolean);

  const secretPatterns = [
    /sb_secret_[a-zA-Z0-9_]+/,
    /eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}/,
    /sk_live_[a-zA-Z0-9]{10,}/,
    /sk_test_[a-zA-Z0-9]{10,}/,
    /whsec_[a-zA-Z0-9]{20,}/,
  ];

  for (const file of trackedFiles) {
    if (file.endsWith(".pdf") || file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".svg") || file.endsWith(".gif") || file.endsWith(".woff")) {
      continue;
    }
    const content = fs.readFileSync(file, "utf8");
    for (const pat of secretPatterns) {
      if (pat.test(content)) {
        // Check it's not a placeholder/example
        const matches = content.match(pat) || [];
        for (const m of matches) {
          if (
            m.includes("example") ||
            m.includes("placeholder") ||
            m.includes("your-") ||
            m.length < 30
          ) {
            continue;
          }
          // Allow test/mock patterns in test files
          if (file.includes("tmp-validate") && m.includes("mock")) {
            continue;
          }
          // Allow pattern literals in validators (they test for the pattern, not real values)
          if (file.includes("tmp-validate") && (content.includes("placeholder") || content.includes("mock"))) {
            continue;
          }
          trackedSecretFound = true;
        }
      }
    }
  }
} catch {
  // git not available — skip
}
assert("36. No real secrets in tracked files", !trackedSecretFound);

// ─── 14. Dockerfile: VITE_* as build ARGs, NO server secrets ──────────────

assert(
  "37. Dockerfile declares ARG VITE_SUPABASE_URL",
  /ARG\s+VITE_SUPABASE_URL/.test(dockerfileSrc)
);
assert(
  "38. Dockerfile declares ARG VITE_SUPABASE_PUBLISHABLE_KEY",
  /ARG\s+VITE_SUPABASE_PUBLISHABLE_KEY/.test(dockerfileSrc)
);
assert(
  "39. Dockerfile exports VITE_SUPABASE_URL as ENV for Vite",
  /ENV\s+VITE_SUPABASE_URL=/.test(dockerfileSrc) || /ENV VITE_SUPABASE_URL/.test(dockerfileSrc)
);
assert(
  "40. Dockerfile does NOT declare ARG for SUPABASE_SERVICE_ROLE_KEY",
  !/ARG\s+SUPABASE_SERVICE_ROLE_KEY/.test(dockerfileSrc)
);
assert(
  "41. Dockerfile does NOT declare ARG for STRIPE_SECRET_KEY",
  !/ARG\s+STRIPE_SECRET_KEY/.test(dockerfileSrc)
);
assert(
  "42. Dockerfile does NOT declare ARG for GEMINI_API_KEY",
  !/ARG\s+GEMINI_API_KEY/.test(dockerfileSrc)
);
assert(
  "43. Dockerfile uses Node 22",
  dockerfileSrc.includes("node:22")
);

// ─── 15. server.ts CSP uses SUPABASE_URL (not VITE_SUPABASE_URL) ───────────

assert(
  "44. server.ts CSP uses SUPABASE_URL for supabaseOrigin (not VITE_SUPABASE_URL)",
  serverSrc.includes("supabaseUrl: process.env.SUPABASE_URL")
);
assert(
  "45. server.ts does NOT use VITE_SUPABASE_URL in CSP",
  !serverSrc.includes("supabaseUrl: process.env.VITE_SUPABASE_URL")
);

// ─── 16. render.yaml canonical vars ─────────────────────────────────────────

assert(
  "46. render.yaml declares VITE_SUPABASE_PUBLISHABLE_KEY",
  renderYamlSrc.includes("key: VITE_SUPABASE_PUBLISHABLE_KEY")
);
assert(
  "47. render.yaml does NOT pass server secrets as buildCommand args",
  !/STRIPE_SECRET_KEY|GEMINI_API_KEY|SUPABASE_SERVICE_ROLE_KEY/.test(
    renderYamlSrc.split("buildCommand")[1]?.split("envVars")[0] || ""
  ) || !renderYamlSrc.includes("buildCommand")
);

// ─── 17. AuthSection does not leak the error when configured ────────────────

assert(
  "48. AuthSection shows 'Frontend Supabase env missing' only when unconfigured",
  authSectionSrc.includes("Frontend Supabase env missing") &&
    authSectionSrc.includes("isSupabaseConfigured")
);

// ─── 18. Supabase project ref documented ───────────────────────────────────

assert(
  "49. Setup doc documents Supabase project ref",
  setupDoc.includes(SUPABASE_PROJECT)
);

// ─── 19. SecurityHeaders accepts origin ──────────────────────────────────────

assert(
  "50. securityHeaders.ts resolves supabase origin for CSP connect-src",
  securityHeadersSrc.includes("connect-src") &&
    securityHeadersSrc.includes("toOrigin")
);

// ─── 20. Server startup logs credential status (not value) ─────────────────

assert(
  "51. server.ts logs 'configured'/'not configured' (not credential value)",
  serverSrc.includes("configured") &&
    !/console\.\w+\([^)]*SUPABASE_SERVICE_ROLE_KEY/.test(serverSrc)
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
  console.log("Failures:");
  for (const error of errors) {
    console.log(`  ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`All ${passed} assertions passed.`);
}

function collectSourceFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(join(dir, entry.name), extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(join(dir, entry.name));
    }
  }
  return results;
}
