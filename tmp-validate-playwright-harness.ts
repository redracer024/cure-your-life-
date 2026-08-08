import * as fs from 'node:fs';
import * as path from 'node:path';

const repoRoot = import.meta.dirname;
const readFile = (rel: string) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(`FAIL: ${label}${detail ? ` - ${detail}` : ''}`);
  }
}

console.log('=== Playwright Harness Assertions ===\n');

const playwrightConfig = readFile('playwright.config.ts');
const runtimeConfig = readFile('playwright.runtime.config.ts');
const mobileConfig = readFile('playwright.mobile.config.ts');
const packageJson = JSON.parse(readFile('package.json'));
const serverSrc = readFile('server.ts');

console.log('--- Runtime config ---');
assert('R1. runtime config has webServer command', runtimeConfig.includes('webServer:'));
assert('R2. runtime command uses deterministic local port', runtimeConfig.includes('PORT=3002') || runtimeConfig.includes('PORT=${TEST_PORT}'));
assert('R3. runtime command uses node dist/server.cjs', runtimeConfig.includes('node dist/server.cjs'));
assert('R4. runtime baseURL matches port', runtimeConfig.includes('baseURL:') && runtimeConfig.includes('localhost'));

console.log('\n--- Mobile config ---');
assert('M1. mobile config has webServer command', mobileConfig.includes('webServer:'));
assert('M2. mobile command uses deterministic local port', mobileConfig.includes('PORT=3003') || mobileConfig.includes('PORT=${MOBILE_TEST_PORT}'));
assert('M3. mobile command uses npm run dev', mobileConfig.includes('npm run dev'));
assert('M4. mobile baseURL matches port', mobileConfig.includes('baseURL:') && mobileConfig.includes('localhost'));
assert('M5. mobile projects use 375x812 viewport', mobileConfig.includes('viewport: { width: 375, height: 812 }'));
assert('M6. mobile projects use 390x844 viewport', mobileConfig.includes('viewport: { width: 390, height: 844 }'));
assert('M7. mobile uses Chromium only', mobileConfig.includes('name: \'Mobile Chrome\'') && !mobileConfig.includes('name: \'Mobile Firefox\'') && !mobileConfig.includes('name: \'Mobile Safari\''));

console.log('\n--- Server startup ---');
assert('S1. production npm start uses node dist/server.cjs', packageJson.scripts?.start === 'node dist/server.cjs');
assert('S2. dev script uses tsx server.ts', packageJson.scripts?.dev === 'tsx server.ts');
assert('S3. server.ts direct-execution guard is ESM/CJS safe', serverSrc.includes('typeof __filename') && serverSrc.includes('import.meta.url'));
assert('S4. server.ts normalizes paths before comparison', serverSrc.includes('path.resolve('));
assert('S5. server.ts decodes URL-encoded paths', serverSrc.includes('decodeURI'));

console.log('\n--- No production mutations ---');
assert('P1. Playwright configs do not target live production', !runtimeConfig.includes('bodysignal') && !mobileConfig.includes('bodysignal'));
assert('P2. Playwright configs do not use production URLs', !playwrightConfig.includes('https://bodysignal'));
assert('P3. test config does not call Stripe directly', !mobileConfig.includes('stripe') && !runtimeConfig.includes('stripe'));

console.log('\n--- Results ---');
console.log(`Total: ${passed} passed, ${failed} failed out of ${passed + failed} assertions\n`);

if (failed > 0) {
  for (const err of errors) {
    console.error(err);
  }
  process.exit(1);
}

console.log('All Playwright harness assertions passed.');
process.exit(0);
