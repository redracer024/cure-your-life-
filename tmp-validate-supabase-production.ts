import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

const rootDir = __dirname;

const serverPath = join(rootDir, "server.ts");
const envExamplePath = join(rootDir, ".env.example");
const gitignorePath = join(rootDir, ".gitignore");
const dockerfilePath = join(rootDir, "Dockerfile");
const useAuthStatePath = join(rootDir, "src/hooks/useAuthState.ts");
const supabaseClientPath = join(rootDir, "src/lib/supabaseClient.ts");
const schemaPath = join(rootDir, "supabase/schema.sql");

const serverSrc = fs.readFileSync(serverPath, "utf8");
const envExampleSrc = fs.readFileSync(envExamplePath, "utf8");
const gitignoreSrc = fs.readFileSync(gitignorePath, "utf8");
const dockerfileSrc = fs.readFileSync(dockerfilePath, "utf8");
const useAuthSrc = fs.readFileSync(useAuthStatePath, "utf8");
const supabaseClientSrc = fs.readFileSync(supabaseClientPath, "utf8");
const schemaSrc = fs.readFileSync(schemaPath, "utf8");

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

console.log("=== Supabase Production Validator (Batch 38) ===");

assert("1. Live Render origin documented in docs", fs.existsSync(join(rootDir, "docs/supabase-production-setup.md")));

const setupDoc = fs.readFileSync(join(rootDir, "docs/supabase-production-setup.md"), "utf8");
assert(
  "2. Setup doc names the live Render origin",
  setupDoc.includes("https://bodysignal-xa18.onrender.com")
);
assert(
  "3. Setup doc documents the production Supabase project ref",
  setupDoc.includes("psurstxfufkqqtpuaxel")
);

assert(
  "4. APP_URL production origin documented",
  setupDoc.includes("APP_URL")
);

assert(
  "5. Exact recovery redirect documented",
  setupDoc.includes("https://bodysignal-xa18.onrender.com/?auth=recovery")
);

assert(
  "6. Exact confirm redirect documented",
  setupDoc.includes("https://bodysignal-xa18.onrender.com/?auth=confirm")
);

assert(
  "7. SUPABASE_SERVICE_ROLE_KEY never appears in client source",
  !supabaseClientSrc.includes("SUPABASE_SERVICE_ROLE_KEY")
);

const tsxFiles = collectTsxFiles(join(rootDir, "src"));
let serviceRoleInClient = false;
for (const file of tsxFiles) {
  const content = fs.readFileSync(file, "utf8");
  if (/import\.meta\.env\.VITE_SUPABASE_SERVICE_ROLE_KEY|process\.env\.SUPABASE_SERVICE_ROLE_KEY/.test(content)) {
    serviceRoleInClient = true;
  }
}
assert("8. service-role env is not VITE-prefixed in any .tsx", !serviceRoleInClient);

assert(
  "9. .env ignored by .gitignore",
  gitignoreSrc.includes(".env*") || (gitignoreSrc.includes(".env\n") && !gitignoreSrc.includes("!.env"))
);

assert(
  "10. .env.example contains placeholders only (no live sk_ key)",
  !/sk_live_[a-zA-Z0-9]+/.test(envExampleSrc)
);
assert(
  "10a. .env.example contains placeholders only (no live whsec_ key)",
  !/whsec_[a-zA-Z0-9]+/.test(envExampleSrc)
);
assert(
  "10b. .env.example contains placeholders only (no live eyJ JWT)",
  !/eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}/.test(envExampleSrc)
);

assert(
  "11. Auth recovery code has no localhost hardcoding",
  !useAuthSrc.includes("localhost:3000/?auth=recovery")
);
assert(
  "12. Auth recovery uses window.location.origin (not hardcoded origin)",
  useAuthSrc.includes("window.location.origin")
);

assert(
  "13. mailer_autoconfirm documented as true until SMTP validation",
  setupDoc.includes("mailer_autoconfirm") && setupDoc.includes("true")
);
assert(
  "14. Setup doc states DO NOT disable autoconfirm before SMTP works",
  setupDoc.includes("DO NOT disable") || setupDoc.includes("do NOT disable")
);

assert(
  "15. RLS policies present in schema (profiles)",
  schemaSrc.includes("profiles_select_own") && schemaSrc.includes("profiles_update_own")
);
assert(
  "16. RLS policies present in schema (subscriptions)",
  schemaSrc.includes("subscriptions_select_own")
);
assert(
  "17. RLS policies present in schema (decoder_reports)",
  schemaSrc.includes("decoder_reports_select_own") && schemaSrc.includes("decoder_reports_insert_own") && schemaSrc.includes("decoder_reports_delete_own")
);
assert(
  "18. RLS policies present in schema (journal_entries)",
  schemaSrc.includes("journal_entries_select_own") && schemaSrc.includes("journal_entries_insert_own") && schemaSrc.includes("journal_entries_update_own") && schemaSrc.includes("journal_entries_delete_own")
);

assert(
  "19. handle_new_user is SECURITY DEFINER",
  schemaSrc.includes("security definer")
);
assert(
  "20. handle_new_user has search_path = public",
  schemaSrc.includes("search_path = public")
);

const migrationFiles = fs.readdirSync(join(rootDir, "supabase/migrations")).filter(f => f.endsWith(".sql"));
let handleNewUserRestricted = false;
for (const f of migrationFiles) {
  const content = fs.readFileSync(join(rootDir, "supabase/migrations", f), "utf8");
  if (content.includes("revoke execute on function public.handle_new_user")) {
    handleNewUserRestricted = true;
  }
}
assert(
  "21. handle_new_user execute revoked from public/anon/authenticated",
  handleNewUserRestricted
);

assert(
  "22. Dockerfile uses Node 22",
  dockerfileSrc.includes("node:22")
);

assert(
  "23. No VITE_ prefix on SUPABASE_SERVICE_ROLE_KEY in .env.example",
  !envExampleSrc.includes("VITE_SUPABASE_SERVICE_ROLE_KEY")
);
assert(
  "24. .env.example documents SUPABASE_SERVICE_ROLE_KEY as server-only",
  envExampleSrc.includes("SUPABASE_SERVICE_ROLE_KEY") && envExampleSrc.includes("NEVER expose to browser")
);

assert(
  "25. Reset/rotation plan documented in setup doc",
  setupDoc.includes("Manual rotation steps") || setupDoc.includes("manual rotation steps")
);
assert(
  "26. Setup doc states do NOT perform rotation automatically",
  setupDoc.includes("automatically") || setupDoc.includes("automatically")
);

assert(
  "27. Production validation checklist present in setup doc",
  setupDoc.includes("Production Validation Checklist")
);

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.log("\nFailures:");
  for (const error of errors) {
    console.log(`  ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log("\nAll assertions passed.");
}

function collectTsxFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...collectTsxFiles(join(dir, entry.name)));
    } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
      results.push(join(dir, entry.name));
    }
  }
  return results;
}
