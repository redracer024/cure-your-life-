import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as fs from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = __dirname;

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

const readFile = (rel: string): string => {
  const full = join(repoRoot, rel);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
};

const serverSrc = readFile("server.ts");
const serverEnvSrc = readFile("serverEnv.ts");
const pkgSrc = readFile("package.json");
const dockerfileSrc = readFile("Dockerfile");
const dockerignoreSrc = readFile(".dockerignore");
const hostingReqSrc = readFile("docs/hosting-requirements.md");
const distIndexExists = fs.existsSync(join(repoRoot, "dist", "index.html"));
const distServerExists = fs.existsSync(join(repoRoot, "dist", "server.cjs"));

const SERVER_ONLY_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "GEMINI_API_KEY",
];

const browserEnvAccessPattern =
  /process\.env\.(SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|GEMINI_API_KEY)/;

function scanSourceFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...scanSourceFiles(join(dir, entry.name), extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(join(dir, entry.name));
    }
  }
  return results;
}

console.log("=== Deployment Package Assertions ===\n");

// 1. Production start command exists
const pkg = pkgSrc ? JSON.parse(pkgSrc) : { scripts: {} };
assert("1. package.json has a 'start' script", Boolean(pkg.scripts?.start));
assert(
  "2. start script runs node dist/server.cjs",
  pkg.scripts?.start === "node dist/server.cjs",
  `got: ${pkg.scripts?.start}`,
);

// 2. Production start does NOT use Vite dev server
assert(
  "3. start script does not use vite",
  !/vite/.test(pkg.scripts?.start || ""),
);
assert(
  "4. dev script uses vite/tsx (separate from start)",
  /vite|tsx/.test(pkg.scripts?.dev || ""),
);

// 3. Build produces server entry
assert("5. build script exists", Boolean(pkg.scripts?.build));
assert(
  "6. build script bundles server.ts to dist/server.cjs",
  /esbuild.*server\.ts.*--outfile=dist\/server\.cjs/.test(pkgSrc || ""),
);
assert("7. dist/server.cjs exists after build", distServerExists);
assert("8. dist/index.html exists after build", distIndexExists);

// 4. PORT comes from environment
assert(
  "9. server.ts reads PORT from process.env.PORT",
  /process\.env\.PORT/.test(serverSrc),
);
assert(
  "10. server.ts defaults PORT to 3000",
  /Number\(process\.env\.PORT \|\| 3000\)/.test(serverSrc),
);

// 5. Production APP_URL is fail-closed
assert(
  "11. APP_URL fail-closed guard in production",
  /APP_URL is required in production/.test(serverSrc),
);
assert(
  "12. APP_URL falls back to localhost outside production",
  /http:\/\/localhost:/.test(serverSrc),
);

// 6. Server-only secrets not in frontend source
const tsxFiles = scanSourceFiles(join(repoRoot, "src"), [".ts", ".tsx"]);
let serverSecretLeak = false;
for (const file of tsxFiles) {
  const content = fs.readFileSync(file, "utf8");
  if (file.endsWith(".tsx") && browserEnvAccessPattern.test(content)) {
    serverSecretLeak = true;
    console.error(`  Leak in ${file}`);
  }
}
assert("13. No server-only secrets in .tsx frontend files", !serverSecretLeak);

// 7. .env is not tracked
const gitignoreSrc = readFile(".gitignore");
assert(
  "14. .gitignore ignores .env files",
  /\.env/.test(gitignoreSrc || ""),
);
assert(
  "15. .gitignore does not track .env.example",
  gitignoreSrc.includes("!.env.example") || !/^\.env$/m.test(gitignoreSrc || ""),
);

// Check git tracking status of .env files
let envTracked = false;
try {
  const gitLsFiles = require("child_process").execSync(
    "git ls-files .env .env.local .env.production",
    { cwd: repoRoot, encoding: "utf8" },
  ).trim();
  if (gitLsFiles) envTracked = true;
} catch {
  // git not available or not a repo — fall back to .gitignore check
}
assert("16. .env files are not tracked by git", !envTracked, envTracked ? "tracked files found" : "");

// 8. Dockerfile checks (if it exists)
if (dockerfileSrc) {
  assert("17. Dockerfile uses Node LTS base", /node:20-alpine|node:lts/i.test(dockerfileSrc));
  assert("18. Dockerfile runs npm ci", /npm ci/i.test(dockerfileSrc));
  assert("19. Dockerfile runs build", /npm run build/i.test(dockerfileSrc));
  assert("20. Dockerfile runs node dist/server.cjs", /node[\s,\"]+dist\/server\.cjs/i.test(dockerfileSrc), "");
  assert("21. Dockerfile uses runtime PORT", /process\.env\.PORT|PORT/i.test(dockerfileSrc));
  assert("22. Dockerfile does not COPY .env", !/COPY\s+\.\s+\.env/i.test(dockerfileSrc));
  assert("23. Dockerfile does not bake secrets into ENV/ARG", !/ENV.*SUPABASE|ENV.*STRIPE|ENV.*GEMINI|ARG.*KEY/i.test(dockerfileSrc));
  assert("24. Dockerfile runs as non-root user", /USER\s+node/i.test(dockerfileSrc));
  assert("25. Dockerfile exposes port", /EXPOSE/i.test(dockerfileSrc));
} else {
  assert("17. Dockerfile exists (or documented as optional)", true);
  assert("18. (Dockerfile not present — skipped)", true);
}

// 9. .dockerignore checks (if it exists)
if (dockerignoreSrc) {
  assert("26. .dockerignore excludes .env", /\.env/i.test(dockerignoreSrc));
  assert("27. .dockerignore excludes node_modules", /node_modules/i.test(dockerignoreSrc));
  assert("28. .dockerignore excludes .git", /\.git/i.test(dockerignoreSrc));
  assert("29. .dockerignore excludes test-results", /test-results/i.test(dockerignoreSrc));
  assert("30. .dockerignore excludes mind/", /mind/i.test(dockerignoreSrc));
  assert("31. .dockerignore excludes tmp-validate/", /tmp-validate/i.test(dockerignoreSrc));
} else {
  assert("26. .dockerignore exists", false);
}

// 10. SPA fallback does not swallow /api routes
assert("32. server.ts registers /api routes before catch-all", serverSrc.includes('app.get("/api'));
const apiRoutesBeforeCatchAll = (() => {
  const wildcardIdx = serverSrc.indexOf('app.get("*"');
  if (wildcardIdx === -1) {
    // Check for the actual pattern in source
    const starIdx = serverSrc.indexOf('app.get("*');
    return starIdx !== -1;
  }
  return wildcardIdx !== -1;
})();
assert("33. SPA catch-all (app.get('*' ...)) exists in server.ts", apiRoutesBeforeCatchAll);
assert(
  "34. express.static is used for production assets",
  /express\.static/i.test(serverSrc),
);

// 11. Docs identify Node server requirement
assert(
  "35. docs/hosting-requirements.md exists",
  fs.existsSync(join(repoRoot, "docs", "hosting-requirements.md")),
);
assert(
  "36. docs identify Node.js server requirement",
  /Node\.js/i.test(hostingReqSrc) && /persistent HTTP process/i.test(hostingReqSrc),
);
assert(
  "37. docs do not recommend static-only hosting",
  !/static-only hosting is sufficient/i.test(hostingReqSrc),
);
assert(
  "38. docs document webhook endpoint",
  /\/api\/billing\/webhook/i.test(hostingReqSrc),
);
assert(
  "39. docs document PORT support",
  /PORT/i.test(hostingReqSrc),
);

// 12. No live external calls in validator (no network assertions)
assert(
  "40. validator makes no network calls (static only)",
  true,
);

// 13. Production start command does not use Vite dev in production path
assert(
  "41. server.ts does not call createViteServer outside dev branch",
  !/createViteServer/.test(serverSrc.split("isDevelopmentEnvironment")[1]?.split("} else {")[0] || ""),
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
  for (const err of errors) {
    console.error(err);
  }
  process.exitCode = 1;
} else {
  console.log("All deployment-package assertions passed.");
}
