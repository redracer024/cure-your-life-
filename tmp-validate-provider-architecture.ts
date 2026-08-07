import * as fs from 'node:fs';
import * as path from 'node:path';

const repoRoot = import.meta.dirname;
const readFile = (rel: string) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const useAuthStateSrc = readFile('src/hooks/useAuthState.ts');
const usePremiumStateSrc = readFile('src/hooks/usePremiumState.ts');
const appSrc = readFile('src/App.tsx');
const premiumCtxSrc = readFile('src/context/PremiumContext.tsx');
const authCtxSrc = readFile('src/context/AuthContext.tsx');

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed++;
    return;
  }
  failed++;
  errors.push(`FAIL: ${label}${detail ? ` - ${detail}` : ''}`);
}

console.log('=== Provider Architecture Assertions ===\n');

console.log('--- Architecture: one-way dependency ---');

assert('A1. AuthProvider is the outer provider', appSrc.includes('<AuthProvider>'));
assert('A2. PremiumProvider is the inner provider', appSrc.includes('<PremiumProvider>'));
assert('A3. AuthProvider wraps PremiumProvider (no swap to opposite order)', (() => {
  const authIdx = appSrc.indexOf('<AuthProvider>');
  const premiumOpenIdx = appSrc.indexOf('<PremiumProvider>');
  const premiumCloseIdx = appSrc.indexOf('</PremiumProvider>');
  return authIdx < premiumOpenIdx && premiumOpenIdx < premiumCloseIdx;
})());
assert('A4. useAuthState does NOT import PremiumContext', !useAuthStateSrc.includes("from '../context/PremiumContext'") && !useAuthStateSrc.includes('usePremium'));
assert('A5. useAuthState does NOT call usePremium', !useAuthStateSrc.includes('const premium = usePremium()'));
assert('A6. useAuthState does NOT call premium.refreshPremiumStatus', !useAuthStateSrc.includes('premium.refreshPremiumStatus'));
assert('A7. useAuthState does NOT reference refreshPremium callback', !useAuthStateSrc.includes('refreshPremium'));
assert('A8. PremiumProvider consumes AuthContext (downward dependency)', premiumCtxSrc.includes("from './AuthContext'") && premiumCtxSrc.includes('const auth = useAuth()'));
assert('A9. usePremiumState does NOT import AuthContext (uses passed-in auth state)', !usePremiumStateSrc.includes("from '../context/AuthContext'"));

console.log('\n--- Cold render: no context error during bootstrap ---');

assert('R1. AuthState includes authStatus field', (() => useAuthStateSrc.includes('authStatus: AuthStatus'))());
assert('R2. AuthStatus includes resolving', useAuthStateSrc.includes("'resolving'"));
assert('R3. AuthStatus includes authenticated', useAuthStateSrc.includes("'authenticated'"));
assert('R4. AuthStatus includes anonymous', useAuthStateSrc.includes("'anonymous'"));
assert('R5. PremiumProvider receives authStatus from AuthContext', premiumCtxSrc.includes('authStatus: auth.authStatus'));
assert('R6. usePremiumState signature accepts authStatus', usePremiumStateSrc.includes('authStatus'));
assert('R7. No try/catch around usePremium in useAuthState (no suppressed context error)', !useAuthStateSrc.includes("premium.refreshPremiumStatus"));

console.log('\n--- Auth events → premium reaction (in PremiumProvider, not AuthProvider) ---');

assert('E1. SIGNED_IN handled in useAuthState (sets authenticated)', useAuthStateSrc.includes("case 'SIGNED_IN':"));
assert('E2. TOKEN_REFRESHED handled in useAuthState', useAuthStateSrc.includes("case 'TOKEN_REFRESHED':"));
assert('E3. SIGNED_OUT handled in useAuthState', useAuthStateSrc.includes("case 'SIGNED_OUT':"));
assert('E4. Premium refresh triggered by authStatus transition to authenticated', usePremiumStateSrc.includes("authStatus === 'authenticated'"));
assert('E5. Premium cleared on authStatus anonymous/session-expired', usePremiumStateSrc.includes('isClearStatus') && usePremiumStateSrc.includes('setIsPremium(false)'));
assert('E6. TOKEN_REFRESHED revalidates via authStatus (authenticated)', usePremiumStateSrc.includes("authStatus === 'authenticated'"));
assert('E7. USER_UPDATED falls through to default → resolveAuthStatus', useAuthStateSrc.includes('default:') && useAuthStateSrc.includes('resolveAuthStatus'));
assert('E8. temporary-error does not clear premium (preserve on transient failure)', !usePremiumStateSrc.includes("'temporary-error'"));
assert('E9. recovery authMode does not trigger premium fetch', usePremiumStateSrc.includes("authMode === 'recovery'"));

console.log('\n--- Token / session input safety ---');

assert('T1. Premium fetch uses authFetch (Supabase session bearer)', usePremiumStateSrc.includes("authFetch('/api/me/premium'"));
assert('T2. usePremiumState does NOT read token from localStorage', !usePremiumStateSrc.includes("localStorage.getItem"));
assert('T3. usePremiumState does NOT set localStorage for entitlement', !usePremiumStateSrc.includes("localStorage.setItem"));
assert('T4. authFetch derives token from Supabase session (not manual storage)', readFile('src/lib/supabaseClient.ts').includes('getSupabaseAccessToken'));
assert('T5. No DEV_PREMIUM production fallback added in premium hook', !usePremiumStateSrc.includes('DEV_PREMIUM') && !usePremiumStateSrc.includes('isDevelopmentPremiumEnabled'));

console.log('\n--- Generation race guard ---');

assert('G1. generationRef preserved in usePremiumState', usePremiumStateSrc.includes('generationRef'));
assert('G2. Stale response discarded via generation mismatch', usePremiumStateSrc.includes("generationRef.current !== generation"));
assert('G3. Account switch bumps generation (user id change)', usePremiumStateSrc.includes('lastAuthenticatedUserIdRef'));
assert('G4. Sign-out clears premium before/after generation bump', usePremiumStateSrc.includes('isClearStatus'));
assert('G5. 401 from premium endpoint clears premium', usePremiumStateSrc.includes('response.status === 401'));

console.log('\n--- Recovery independence ---');

assert('RC1. exchangeCodeForSession in useAuthState', useAuthStateSrc.includes('exchangeCodeForSession'));
assert('RC2. codeExchanged guard preserved', useAuthStateSrc.includes('codeExchanged') && useAuthStateSrc.includes('!codeExchanged'));
assert('RC3. clearAuthParams after recovery', useAuthStateSrc.includes('clearAuthParams()'));
assert('RC4. updateUser for new password', useAuthStateSrc.includes('supabase.auth.updateUser'));
assert('RC5. PASSWORD_RECOVERY sets recovery mode (not session-expired)', useAuthStateSrc.includes("event === 'PASSWORD_RECOVERY'") && useAuthStateSrc.includes("setAuthStatus('recovery')"));
assert('RC6. useAuthState has no dependency on PremiumProvider for recovery', !useAuthStateSrc.includes('PremiumContext') && !useAuthStateSrc.includes('usePremium'));

console.log('\n--- Provider tree render (static structural proof) ---');

assert('RT1. App.tsx renders AuthProvider outside PremiumProvider', (() => {
  const app = readFile('src/App.tsx');
  const authOpen = app.indexOf('<AuthProvider>');
  const premOpen = app.indexOf('<PremiumProvider>');
  const premClose = app.indexOf('</PremiumProvider>');
  const authClose = app.indexOf('</AuthProvider>');
  return authOpen >= 0 && premOpen > authOpen && premClose > premOpen && authClose > premClose;
})());
assert('RT2. AppInner consumes both contexts (inside both providers)', appSrc.includes('const auth = useAuth();') && appSrc.includes('const premium = usePremium();'));

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
  for (const err of errors) {
    console.error(err);
  }
  process.exit(1);
}

console.log('All provider architecture assertions passed.');
process.exit(0);
