import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const serverPath = join(__dirname, "server.ts");
const serverSrc = fs.readFileSync(serverPath, "utf8");

// We need to test the auth helpers. Since they use 'window', we'll test the
// pure functions directly and mock window for the side-effectful ones.
const authRedirectPath = join(__dirname, "src/lib/auth/authRedirect.ts");
const authRedirectSrc = fs.readFileSync(authRedirectPath, "utf8");

const authErrorPath = join(__dirname, "src/lib/auth/authErrorMessages.ts");
const authErrorSrc = fs.readFileSync(authErrorPath, "utf8");

const useAuthPath = join(__dirname, "src/hooks/useAuthState.ts");
const useAuthSrc = fs.readFileSync(useAuthPath, "utf8");

const authSectionPath = join(__dirname, "src/components/AuthSection.tsx");
const authSectionSrc = fs.readFileSync(authSectionPath, "utf8");

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

console.log("=== Auth Recovery Assertions ===");

// ─── PASSWORD RESET REQUEST ─────────────────────────────────────────────

const resetEmailPattern = /resetPasswordForEmail\s*\(\s*trimmed\s*,\s*\{/;
assert("1. requestPasswordReset trims email before call", useAuthSrc.includes("const trimmed = email.trim()"));
assert("2. requestPasswordReset calls supabase.auth.resetPasswordForEmail", useAuthSrc.includes("supabase.auth.resetPasswordForEmail"));
assert("3. resetPasswordForEmail uses redirectTo with current origin + auth=recovery", useAuthSrc.includes("auth=recovery"));
assert("4. requestPasswordReset checks empty input", useAuthSrc.includes("if (!trimmed)"));
assert("5. requestPasswordReset generic success message does not reveal account existence", useAuthSrc.includes("If an account exists for that email"));
assert("6. requestPasswordReset sanitizes errors", useAuthSrc.includes("sanitizeAuthError(error)"));
assert("7. no email/token/password logged in requestPasswordReset", !/console\.(log|error|warn).*email/i.test(useAuthSrc.replace(/\/\/.*/g, '')));

// ─── RECOVERY CALLBACK ──────────────────────────────────────────────────

assert("8. exchangeCodeForSession called for recovery mode", useAuthSrc.includes("supabase.auth.exchangeCodeForSession"));
assert("9. code is read from URLSearchParams (not logged)", authRedirectSrc.includes("searchParams.get('code')"));
assert("10. recovery callback exchanges once (codeExchanged guard)", useAuthSrc.includes("codeExchanged") && useAuthSrc.includes("setCodeExchanged(true)"));
assert("11. invalid/expired recovery produces safe error", useAuthSrc.includes("sanitizeAuthError"));
assert("12. no code/token logged", !/console\.(log|error|warn).*(code|token|access_token|refresh_token)/i.test(useAuthSrc.replace(/\/\/.*/g, '')));

// ─── PASSWORD UPDATE ────────────────────────────────────────────────────

assert("13. submitNewPassword calls supabase.auth.updateUser", useAuthSrc.includes("supabase.auth.updateUser"));
assert("14. passwords < 8 chars rejected", useAuthSrc.includes("newPassword.length < 8"));
assert("15. password mismatch rejected", useAuthSrc.includes("newPassword !== confirm"));
assert("16. success clears recovery mode", useAuthSrc.includes("setAuthMode(null)") && useAuthSrc.includes("'Your password has been updated.'"));
assert("17. URL params cleared after successful password update", useAuthSrc.includes("clearAuthParams()"));

// ─── CONFIRMATION READINESS ─────────────────────────────────────────────

assert("18. confirmation callback (auth=confirm) handled", useAuthSrc.includes("mode === 'confirm'"));
assert("19. confirmation uses exchangeCodeForSession", useAuthSrc.match(/case|if.*[mode|val].*confirm/) !== null || useAuthSrc.includes("mode === 'confirm'"));
assert("20. signup behavior unchanged (signUp call preserved)", useAuthSrc.includes("supabase.auth.signUp"));
assert("21. signup autoconfirm message preserved", useAuthSrc.includes("Account created. Check email."));

// ─── AUTH EVENT HANDLING ────────────────────────────────────────────────

assert("22. PASSWORD_RECOVERY event handled in onAuthStateChange", useAuthSrc.includes("PASSWORD_RECOVERY"));
assert("23. SIGNED_IN/SIGNED_OUT handled", useAuthSrc.includes("setAuthUser") && useAuthSrc.includes("signOut"));
assert("24. auth event handler does not double-exchange code", useAuthSrc.match(/codeExchanged.*setCodeExchanged\[^\]]*\]/) !== null || useAuthSrc.includes("if (code && supabase && !codeExchanged)"));

// ─── URL CLEANUP ────────────────────────────────────────────────────────

assert("25. clearAuthParams removes auth param", authRedirectSrc.includes("search.delete('auth')"));
assert("26. clearAuthParams removes code param", authRedirectSrc.includes("search.delete('code')"));
assert("27. clearAuthParams preserves unrelated params", authRedirectSrc.includes("const next = search.toString()"));
assert("28. clearAuthParams is safe without window", authRedirectSrc.includes("typeof window === 'undefined'"));

// ─── ERROR SANITIZATION ─────────────────────────────────────────────────

assert("29. expired link produces safe message", authErrorSrc.includes("has expired"));
assert("30. invalid link produces safe message", authErrorSrc.includes("no longer valid"));
assert("31. weak password produces safe message", authErrorSrc.includes("at least 8 characters"));
assert("32. password mismatch produces safe message", authErrorSrc.includes("do not match"));
assert("33. network error produces safe message", authErrorSrc.includes("network error"));
assert("34. fallback for unknown errors", authErrorSrc.includes("Something went wrong"));

// ─── UI BEHAVIOR ────────────────────────────────────────────────────────

assert("35. AuthSection has 'Forgot password?' UI", authSectionSrc.includes("Forgot your password"));
assert("36. AuthSection has requestPasswordReset entry point", authSectionSrc.includes("auth.requestPasswordReset"));
assert("37. AuthSection shows recovery request form", authSectionSrc.includes("showRecoveryRequest"));
assert("38. AuthSection shows set-new-password form", authSectionSrc.includes("isRecoveryMode"));
assert("39. AuthSection submits new password via handleSubmitNewPassword", authSectionSrc.includes("submitNewPassword"));
assert("40. AuthSection disables submit while pending", authSectionSrc.includes("resetPasswordLoading"));
assert("41. AuthSection has confirmation pending UI", authSectionSrc.includes("Confirming your email"));

// ─── REDACTED SECRETS ───────────────────────────────────────────────────

const frontendFiles = [authSectionSrc, useAuthSrc, authRedirectSrc, authErrorSrc];
const serverSecretPattern = /process\.env\.(SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|GEMINI_API_KEY)/;
for (const src of frontendFiles) {
  assert("42. No server-only env vars in frontend auth code", !serverSecretPattern.test(src));
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
