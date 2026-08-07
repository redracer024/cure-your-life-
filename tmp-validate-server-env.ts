// Deterministic environment/premium validator for Batch 12 fail-closed hardening.
// Run with: npx tsx tmp-validate-server-env.ts
import {
  isDevelopmentEnvironment,
  isDevelopmentPremiumEnabled,
  isProductionServingMode,
} from "./serverEnv";

let passed = 0;
let failed = 0;
const errors: string[] = [];

function check(condition: boolean, message: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(message);
  }
}

console.log("1..10. isDevelopmentPremiumEnabled truth table");
const premiumCases: Array<[string | undefined, string | undefined, boolean, string]> = [
  ["production", "true", false, "1. production + DEV_PREMIUM=true => bypass false"],
  ["production", "false", false, "2. production + DEV_PREMIUM=false => false"],
  ["production", undefined, false, "3. production + unset => false"],
  ["development", "true", true, "4. development + true => TRUE"],
  ["development", "false", false, "5. development + false => false"],
  ["development", undefined, false, "6. development + unset => false"],
  [undefined, "true", false, "7. NODE_ENV unset + true => false"],
  [undefined, undefined, false, "8. both unset => false"],
  ["staging", "true", false, "9. unexpected NODE_ENV + true => false"],
  ["development", "1", false, "10. unexpected DEV_PREMIUM value ('1') => false"],
  ["development", "TRUE", false, "10b. unexpected DEV_PREMIUM value ('TRUE') => false"],
  ["development", "yes", false, "10c. unexpected DEV_PREMIUM value ('yes') => false"],
  ["development", "on", false, "10d. unexpected DEV_PREMIUM value ('on') => false"],
];
for (const [nodeEnv, devPremium, expected, label] of premiumCases) {
  const actual = isDevelopmentPremiumEnabled(nodeEnv, devPremium);
  check(actual === expected, `${label} — expected ${expected}, got ${actual}`);
  if (actual !== expected) {
    console.log(`  ❌ ${label}: got ${actual}`);
  }
}

console.log("11] Vite dev middleware only in explicit development");
const devCases: Array<[string | undefined, boolean]> = [
  ["development", true],
  [undefined, false],
  ["production", false],
  ["staging", false],
  ["", false],
];
for (const [nodeEnv, expected] of devCases) {
  const actual = isDevelopmentEnvironment(nodeEnv);
  check(actual === expected, `isDevelopmentEnvironment(${JSON.stringify(nodeEnv)}) — expected ${expected}, got ${actual}`);
  if (actual !== expected) {
    console.log(`  ❌ NODE_ENV=${JSON.stringify(nodeEnv)} devMiddleware: got ${actual}`);
  }
}

console.log("12] static/production serving selected when NODE_ENV absent");
assertTrue(isProductionServingMode(undefined), "absent NODE_ENV must serve production/static");
assertTrue(isProductionServingMode("production"), "production serves production/static");
assertFalse(isProductionServingMode("development"), "development must NOT serve production/static");

function assert(condition: boolean, message: string) {
  check(condition, message);
  if (!condition) console.log(`  ❌ ${message}`);
}
function assertTrue(condition: boolean, message: string) { assert(condition, message); }
function assertFalse(condition: boolean, message: string) { assert(!condition, message); }

// 12] entitlement authoritative outside explicit dev bypass:
// When bypass is false the getPremiumStatus logic ONLY grants premium from a
// server-authoritative source (supabase subscription / bearer token). Here we
// assert the bypass flag never turns on outside the exact dev pair.
console.log("12] entitlement authoritative outside explicit dev bypass");
const nonBypassCombos = [
  ["production", "true"],
  ["production", "false"],
  ["production", undefined],
  [undefined, "true"],
  [undefined, undefined],
  ["staging", "true"],
];
for (const [nodeEnv, devPremium] of nonBypassCombos) {
  check(
    isDevelopmentPremiumEnabled(nodeEnv, devPremium) === false,
    `bypass must be off for ${JSON.stringify(nodeEnv)}+${JSON.stringify(devPremium)}`
  );
}
// Only the exact dev+true pair may enable bypass.
check(
  isDevelopmentPremiumEnabled("development", "true") === true,
  "bypass enabled only for development+true"
);

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) {
  console.log(`\nFailures:`);
  errors.forEach((e) => console.log(`  ❌ ${e}`));
  process.exit(1);
} else {
  console.log(`\n✅ ALL ${passed} CHECKS PASSED`);
  process.exit(0);
}