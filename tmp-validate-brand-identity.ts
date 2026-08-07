import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, "src");

function readSrcFile(rel: string): string {
  return fs.readFileSync(join(__dirname, rel), "utf8");
}

function scanSourceFiles(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...scanSourceFiles(join(dir, entry.name), exts));
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      results.push(join(dir, entry.name));
    }
  }
  return results;
}

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

// Read key files
const brandPath = join(srcDir, "lib/brand.ts");
const brandSrc = fs.existsSync(brandPath) ? readSrcFile("src/lib/brand.ts") : "";

const indexHtmlPath = join(__dirname, "index.html");
const indexHtmlSrc = fs.existsSync(indexHtmlPath) ? fs.readFileSync(indexHtmlPath, "utf8") : "";

const metadataPath = join(__dirname, "metadata.json");
const metadataSrc = fs.existsSync(metadataPath) ? fs.readFileSync(metadataPath, "utf8") : "";

const appHeaderSrc = readSrcFile("src/components/AppHeader.tsx");
const navigationSrc = readSrcFile("src/components/Navigation.tsx");
const appFooterSrc = readSrcFile("src/components/AppFooter.tsx");
const authSectionSrc = readSrcFile("src/components/AuthSection.tsx");
const paywallSrc = readSrcFile("src/components/PremiumPaywall.tsx");
const legalDocsPath = join(srcDir, "lib/legal/legalDocs.ts");
const legalDocsSrc = fs.existsSync(legalDocsPath) ? fs.readFileSync(legalDocsPath, "utf8") : "";

const deploymentDocsPath = join(__dirname, "docs/production-deployment-checklist.md");
const deploymentDocsSrc = fs.existsSync(deploymentDocsPath) ? fs.readFileSync(deploymentDocsPath, "utf8") : "";

const schemaPath = join(__dirname, "supabase/schema.sql");
const schemaSrc = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, "utf8") : "";

const serverPath = join(__dirname, "server.ts");
const serverSrc = fs.readFileSync(serverPath, "utf8");
const serverEnvPath = join(__dirname, "serverEnv.ts");
const serverEnvSrc = fs.readFileSync(serverEnvPath, "utf8");

const allTsxFiles = scanSourceFiles(srcDir, [".ts", ".tsx"]);

console.log("=== Brand Identity Assertions ===");

// Canonical brand constant
assert("1. PRODUCT_NAME = BodySignal", brandSrc.includes('export const PRODUCT_NAME = "BodySignal"'));
assert("2. PRODUCT_TAGLINE = Explore the whole pattern.", brandSrc.includes('export const PRODUCT_TAGLINE = "Explore the whole pattern."'));
assert("3. PRODUCT_DESCRIPTION exists and mentions body signals", brandSrc.includes("body signals") && brandSrc.includes("emotions, thoughts, relationships"));

// Browser/HTML metadata
assert("4. index.html title is BodySignal", indexHtmlSrc.includes("<title>BodySignal</title>"));
assert("5. index.html has non-diagnostic description", indexHtmlSrc.includes("Explore patterns across body signals"));
assert("6. metadata.json name is BodySignal", JSON.parse(metadataSrc).name === "BodySignal");
assert("7. metadata.json description is non-diagnostic", !JSON.parse(metadataSrc).description.includes("psychosomatic dictionary connecting emotional origins"));

// Header/branding
assert("8. AppHeader uses PRODUCT_NAME (not hardcoded 'CURE YOUR LIFE')", appHeaderSrc.includes("PRODUCT_NAME") && !appHeaderSrc.includes("CURE YOUR LIFE"));
assert("9. AppHeader uses PRODUCT_TAGLINE", appHeaderSrc.includes("PRODUCT_TAGLINE"));
assert("10. Navigation uses PRODUCT_NAME", navigationSrc.includes("PRODUCT_NAME") && !navigationSrc.includes(">Cure Your Life<"));
assert("11. AppFooter uses PRODUCT_NAME", appFooterSrc.includes("PRODUCT_NAME") && !appFooterSrc.includes("Cure Your Life+"));
assert("12. No 'Cure Your Life' in user-facing component text", !appHeaderSrc.match(/>Cure Your Life|CURE YOUR LIFE|Cure Your Life\+/) && !navigationSrc.match(/>Cure Your Life/) && !appFooterSrc.match(/Cure Your Life\+/) && !authSectionSrc.match(/Cure Your Life/) && !paywallSrc.match(/Cure Your Life/));

// Legal docs
assert("13. Legal docs reference BodySignal (not Cure Your Life+)", legalDocsSrc.includes("BodySignal") && legalDocsSrc.includes("Cure Your Life+") === false);
assert("14. Legal docs preserve medical safety language (does not cure)", legalDocsSrc.includes("does not diagnose, treat, cure"));
assert("15. Legal docs do not claim medical accuracy", !legalDocsSrc.includes("medically accurate"));

// Auth UX branding
assert("16. AuthSection does not display Cure Your Life", !authSectionSrc.includes("Cure Your Life"));
assert("17. AuthSection has forgot-password UI", authSectionSrc.includes("Forgot your password"));
assert("18. AuthSection has recovery callback handling", authSectionSrc.includes("auth.recoveryEmail") || authSectionSrc.includes("requestPasswordReset"));

// Safety copy audit
let safetyViolation = false;
for (const file of allTsxFiles) {
  const content = fs.readFileSync(file, "utf8");

  // Check for "diagnostic verdict"
  if (content.includes("diagnostic verdict")) {
    safetyViolation = true;
  }

  // Check for "diagnose your" (as a verb applied to the user, not "not a diagnosis")
  if (/diagnose your/i.test(content) && !content.includes("does not diagnose")) {
    safetyViolation = true;
  }

  // Check for "medically accurate" when NOT preceded by "not" (negative context is safe)
  const medAccuratelyPattern = /\bmedically accurate\b/gi;
  let match;
  while ((match = medAccuratelyPattern.exec(content)) !== null) {
    const before = content.substring(Math.max(0, match.index - 10), match.index).toLowerCase();
    if (!before.includes("not ")) {
      safetyViolation = true;
    }
  }
}
assert("19. No user-facing diagnostic claims ('diagnose your', 'diagnostic verdict', 'medically accurate')", !safetyViolation);

// Internal compatibility identifiers preserved
assert("20. schema.sql retains legacy comment (internal compatibility)", schemaSrc.includes("Cure Your Life+"));
assert("21. CYL-SCANNER version label preserved (internal)", scanSourceFiles(srcDir, [".tsx"]).some(f => fs.readFileSync(f, "utf8").includes("CYL-SCANNER")));
assert("22. CYL calibration prefix preserved (internal)", allTsxFiles.some(f => fs.readFileSync(f, "utf8").includes("CYL-")));

// Pricing/billing unchanged
assert("23. STRIPE_PRICE_ID unchanged in server.ts", serverSrc.includes("STRIPE_PRICE_ID_MONTHLY") && serverSrc.includes("STRIPE_PRICE_ID_ANNUAL"));
assert("24. DEV_PREMIUM logic unchanged in serverEnv.ts", serverEnvSrc.includes("isDevelopmentPremiumEnabled"));
assert("25. APP_URL fail-closed guard present", serverSrc.includes("APP_URL is required in production"));

// Deployment docs use BodySignal
assert("26. Deployment checklist uses BodySignal", deploymentDocsSrc.includes("BodySignal"));
assert("27. Deployment checklist mentions auth=recovery redirect", deploymentDocsSrc.includes("auth=recovery"));
assert("28. Deployment checklist mentions auth=confirm redirect", deploymentDocsSrc.includes("auth=confirm"));
assert("29. Deployment checklist separates Stripe vs Supabase redirects", deploymentDocsSrc.includes("Stripe billing") && deploymentDocsSrc.includes("SUPABASE AUTH"));

// No live domain in any source
let liveDomainLeak = false;
const publicDomainPattern = /https:\/\/[a-z0-9-]+\.[a-z]{2,}(?=\.com|\.org|\.io|\.ai|\.co)/;
for (const file of allTsxFiles) {
  const content = fs.readFileSync(file, "utf8");
  if (publicDomainPattern.test(content)) {
    liveDomainLeak = true;
  }
}
assert("30. No live domain hardcoded in source", !liveDomainLeak);

// Auth helper modules exist
assert("31. src/lib/auth/authRedirect.ts exists", fs.existsSync(join(srcDir, "lib/auth/authRedirect.ts")));
assert("32. src/lib/auth/authErrorMessages.ts exists", fs.existsSync(join(srcDir, "lib/auth/authErrorMessages.ts")));

// Brand constant is imported where needed
assert("33. AppHeader imports PRODUCT_NAME", appHeaderSrc.includes("import { PRODUCT_NAME"));
assert("34. Navigation imports PRODUCT_NAME", navigationSrc.includes("import { PRODUCT_NAME"));
assert("35. AppFooter imports PRODUCT_NAME", appFooterSrc.includes("import { PRODUCT_NAME"));
assert("36. PremiumPaywall imports PRODUCT_NAME", paywallSrc.includes("import { PRODUCT_NAME"));

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.log("\nFailures:");
  for (const error of errors) {
    console.log(`  ${error}`);
  }
  process.exitCode = 1;
}
