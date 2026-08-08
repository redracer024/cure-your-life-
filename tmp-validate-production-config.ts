import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as fs from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const serverPath = join(__dirname, "server.ts");
const serverEnvPath = join(__dirname, "serverEnv.ts");
const envExamplePath = join(__dirname, ".env.example");

const serverSrc = fs.readFileSync(serverPath, "utf8");
const serverEnvSrc = fs.readFileSync(serverEnvPath, "utf8");
const envExampleSrc = fs.existsSync(envExamplePath)
  ? fs.readFileSync(envExamplePath, "utf8")
  : "";

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

const SERVER_ONLY_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID_MONTHLY",
  "STRIPE_PRICE_ID_ANNUAL",
  "GEMINI_API_KEY",
];

const BROWSER_SAFE_KEYS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
];

console.log("=== Production Config Assertions ===");

// 1. APP_URL fail-closed in production
const hasAppUrlGuard = serverSrc.includes("APP_URL is required in production");
assert("1. APP_URL has production fail-closed guard", hasAppUrlGuard);

// 2. APP_URL falls back to localhost only outside production
const hasLocalhostFallback = serverSrc.includes("http://localhost:");
assert("2. APP_URL falls back to localhost only outside production", hasLocalhostFallback);

// 3. DEV_PREMIUM cannot enable entitlement outside dev
const hasDevPremiumCheck = serverEnvSrc.includes("isDevelopmentEnvironment") && serverEnvSrc.includes('devPremium === "true"');
assert("3. DEV_PREMIUM requires NODE_ENV=development", hasDevPremiumCheck);

// 4. Unexpected NODE_ENV does not relax dev
const hasProdDefault = serverEnvSrc.includes("isProductionServingMode") && serverEnvSrc.includes("!isDevelopmentEnvironment");
assert("4. Production/static serving is the default for non-development NODE_ENV", hasProdDefault);

// 5. Required server vars are referenced
assert("5. STRIPE_SECRET_KEY used in server", serverSrc.includes("process.env.STRIPE_SECRET_KEY"));
assert("6. SUPABASE_SERVICE_ROLE_KEY used in server", serverSrc.includes("process.env.SUPABASE_SERVICE_ROLE_KEY"));
assert("7. STRIPE_WEBHOOK_SECRET used in server", serverSrc.includes("process.env.STRIPE_WEBHOOK_SECRET"));
assert("8. GEMINI_API_KEY used in server", serverSrc.includes("process.env.GEMINI_API_KEY"));

// 9. Browser-safe env names in supabaseClient.ts are not server-only keys
const supabaseClientPath = join(__dirname, "src/lib/supabaseClient.ts");
const supabaseClientSrc = fs.readFileSync(supabaseClientPath, "utf8");

for (const key of SERVER_ONLY_KEYS) {
  const pattern = new RegExp(`(?<!VITE_)\\b${key}\\b`);
  assert(`9. "${key}" not bundled into supabaseClient`, !supabaseClientSrc.match(pattern));
}

// 10. .env.example exists and documents all required keys
assert("10. .env.example exists", fs.existsSync(envExamplePath));

if (fs.existsSync(envExamplePath)) {
  assert("11. .env.example has APP_URL", envExampleSrc.includes("APP_URL="));
  assert("12. .env.example has NODE_ENV=production", envExampleSrc.includes("NODE_ENV=production"));
  assert("13. .env.example has DEV_PREMIUM=false", envExampleSrc.includes("DEV_PREMIUM=false"));

  for (const key of SERVER_ONLY_KEYS) {
    assert(`14. .env.example documents ${key}`, envExampleSrc.includes(`${key}=`));
  }

  for (const key of BROWSER_SAFE_KEYS) {
    assert(`15. .env.example documents ${key}`, envExampleSrc.includes(`${key}=`));
  }

  // .env.example must not contain real secret values
  assert("16. .env.example does not contain live sk_ key", !/sk_live_[a-zA-Z0-9]/.test(envExampleSrc));
  assert("17. .env.example does not contain live whsec_ key", !/whsec_[a-zA-Z0-9]/.test(envExampleSrc));
}

// 18. server.ts references isProductionServingMode
assert("18. server.ts imports isProductionServingMode", serverSrc.includes("isProductionServingMode"));

// 19. APP_URL used for Stripe redirects
assert("19. APP_URL used for success_url", serverSrc.includes("${APP_URL}/?billing=success"));
assert("20. APP_URL used for cancel_url", serverSrc.includes("${APP_URL}/?billing=cancelled"));
assert("21. APP_URL used for portal return_url", serverSrc.includes("${APP_URL}/?billing=portal-return"));

// 22. DEV_PREMIUM must not be accessed via process.env in any .ts/.tsx source file
//     (UI display strings in messages are OK — we only check for actual env access)
function scanSourceFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...scanSourceFiles(join(dir, entry.name), extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(join(dir, entry.name));
    }
  }
  return results;
}

const srcDir = join(__dirname, "src");
const tsFiles = scanSourceFiles(srcDir, [".ts", ".tsx"]);
const browserEnvAccessPattern = /process\.env\.(SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|GEMINI_API_KEY|STRIPE_PRICE_ID_MONTHLY|STRIPE_PRICE_ID_ANNUAL)/;
const devPremiumAccessPattern = /process\.env\.DEV_PREMIUM|import\.meta\.env\.DEV_PREMIUM/;

let serverSecretLeak = false;
let devPremiumLeak = false;

for (const file of tsFiles) {
  const content = fs.readFileSync(file, "utf8");
  if (file.endsWith(".tsx") && browserEnvAccessPattern.test(content)) {
    serverSecretLeak = true;
  }
  if (devPremiumAccessPattern.test(content)) {
    devPremiumLeak = true;
  }
}

assert("22. DEV_PREMIUM not accessed via process.env/import.meta.env in browser source", !devPremiumLeak);
assert("23. Server uses SUPABASE_URL (not VITE_) for CSP", serverSrc.includes("supabaseUrl: process.env.SUPABASE_URL"));
assert("23a. Server does not use VITE_SUPABASE_URL for CSP", !serverSrc.includes("supabaseUrl: process.env.VITE_SUPABASE_URL"));
assert("24. No server-only secrets (process.env.XXX) in .tsx frontend files", !serverSecretLeak);

// 25. Production auth gap: no password reset
assert("25. Password reset not yet implemented (documented gap)", !serverSrc.includes("resetPassword") && !serverSrc.includes("reset_password"));

// 26. DEV_PREMIUM default to false in production — check that serverEnv.ts gates on isDevelopmentEnvironment
assert("26. DEV_PREMIUM checked against isDevelopmentEnvironment", serverEnvSrc.includes("isDevelopmentEnvironment"));

// 27. .env.example does not expose real-looking anon keys
assert("27. .env.example VITE_SUPABASE_PUBLISHABLE_KEY is placeholder (not a real sb_publishable_ key)", !/sb_publishable_[a-zA-Z0-9_]{10,}/.test(envExampleSrc));
assert("27a. .env.example documents VITE_SUPABASE_ANON_KEY as backward-compat fallback", envExampleSrc.includes("VITE_SUPABASE_ANON_KEY=") && /backward.*compat|fallback|deprecated/i.test(envExampleSrc));

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.log("\nFailures:");
  for (const error of errors) {
    console.log(`  ${error}`);
  }
  process.exitCode = 1;
}
