import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  ASSESSMENT_SESSION_VERSION,
  startAssessmentSession,
  serializeAssessmentSession,
} from './src/lib/quiz/assessmentSession';
import {
  ASSESSMENT_SESSION_STORAGE_KEY,
  ASSESSMENT_SESSION_STORAGE_NAMESPACE_VERSION,
  ASSESSMENT_IN_PROGRESS_EXPIRY_MS,
  getAssessmentSessionStorageKey,
  getAssessmentSessionExpiryState,
  saveAssessmentSession,
  loadAssessmentSession,
  clearAssessmentSession,
  hasSavedAssessmentSession,
  type AssessmentStorageOwner,
  type AssessmentSessionStorageLike,
} from './src/lib/quiz/assessmentSessionStorage';
import type { AssessmentSession } from './src/types/assessmentSession';

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

class MemoryStorage implements AssessmentSessionStorageLike {
  private entries = new Map<string, string>();
  public failGetKeys = new Set<string>();
  public failSetKeys = new Set<string>();
  public failRemoveKeys = new Set<string>();

  getItem(key: string): string | null {
    if (this.failGetKeys.has(key)) throw new Error(`forced get failure:${key}`);
    return this.entries.has(key) ? this.entries.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    if (this.failSetKeys.has(key)) throw new Error(`forced set failure:${key}`);
    this.entries.set(key, value);
  }

  removeItem(key: string): void {
    if (this.failRemoveKeys.has(key)) throw new Error(`forced remove failure:${key}`);
    this.entries.delete(key);
  }

  read(key: string): string | null {
    return this.entries.has(key) ? this.entries.get(key)! : null;
  }
}

const ANON: AssessmentStorageOwner = { kind: 'anonymous' };
const USER_A: AssessmentStorageOwner = { kind: 'user', userId: 'auth-user-a-001' };
const USER_B: AssessmentStorageOwner = { kind: 'user', userId: 'auth-user-b-002' };

const ANON_KEY = getAssessmentSessionStorageKey(ANON);
const USER_A_KEY = getAssessmentSessionStorageKey(USER_A);
const USER_B_KEY = getAssessmentSessionStorageKey(USER_B);

const NOW_MS = Date.parse('2026-08-04T00:00:00.000Z');

function withUpdatedAt(session: AssessmentSession, updatedAt: string): AssessmentSession {
  return { ...session, updatedAt };
}

function inProgressSession(daysAgo: number, extraMs: number = 0, mode: 'free' | 'pro' = 'free'): AssessmentSession {
  const base = startAssessmentSession(mode);
  const updatedAt = new Date(NOW_MS - daysAgo * 24 * 60 * 60 * 1000 - extraMs).toISOString();
  return withUpdatedAt(base, updatedAt);
}

function completedSession(daysAgo: number, mode: 'free' | 'pro' = 'free'): AssessmentSession {
  const base = startAssessmentSession(mode);
  const updatedAt = new Date(NOW_MS - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    ...base,
    stage: 'results',
    completionState: 'complete',
    updatedAt,
    navigationTarget: { patternId: 'martyr' },
  };
}

/* Key and namespace invariants */
assert('namespace version stays v2', ASSESSMENT_SESSION_STORAGE_NAMESPACE_VERSION === 'v2');
assert('legacy key remains exact', ASSESSMENT_SESSION_STORAGE_KEY === 'cure-life-assessment-session');
assert('anonymous and User A keys differ', ANON_KEY !== USER_A_KEY);
assert('User A and User B keys differ', USER_A_KEY !== USER_B_KEY);
assert('same User A key is deterministic', USER_A_KEY === getAssessmentSessionStorageKey({ kind: 'user', userId: 'auth-user-a-001' }));

{
  const byEmailKey = getAssessmentSessionStorageKey({ kind: 'user', userId: 'person@example.com' });
  assert('raw email is not embedded in key', !byEmailKey.includes('person@example.com'));
  assert('display name is not embedded in key', !byEmailKey.includes('Visible Name'));
}

/* Expiry helper boundary behavior */
{
  const s29 = inProgressSession(29);
  assert('1: in-progress 29 days old is valid', getAssessmentSessionExpiryState(s29, NOW_MS) === 'valid');

  const s30 = inProgressSession(30);
  assert('2: in-progress exactly 30 days old is valid', getAssessmentSessionExpiryState(s30, NOW_MS) === 'valid');

  const s30plus = inProgressSession(30, 1);
  assert('3: in-progress 30 days + 1ms is expired', getAssessmentSessionExpiryState(s30plus, NOW_MS) === 'expired');

  const s60 = inProgressSession(60);
  assert('4: in-progress 60 days old is expired', getAssessmentSessionExpiryState(s60, NOW_MS) === 'expired');

  const c60 = completedSession(60);
  assert('5: completed session 60 days old remains completed', getAssessmentSessionExpiryState(c60, NOW_MS) === 'completed');

  const c365 = completedSession(365);
  assert('6: completed session 365 days old remains completed', getAssessmentSessionExpiryState(c365, NOW_MS) === 'completed');

  const blockedPro = inProgressSession(60, 0, 'pro');
  assert('7: blocked Pro in-progress expires after 30 days', getAssessmentSessionExpiryState(blockedPro, NOW_MS) === 'expired');

  const completedPro = completedSession(365, 'pro');
  assert('8: completed Pro does not expire', getAssessmentSessionExpiryState(completedPro, NOW_MS) === 'completed');

  const invalidTs = withUpdatedAt(startAssessmentSession('free'), 'not-a-timestamp');
  assert('9: invalid updatedAt is invalid-timestamp', getAssessmentSessionExpiryState(invalidTs, NOW_MS) === 'invalid-timestamp');

  const missingTs = {
    ...(startAssessmentSession('free') as unknown as Record<string, unknown>),
  };
  delete missingTs.updatedAt;
  assert(
    '10: missing updatedAt is invalid-timestamp after deserialize',
    loadAssessmentSession(
      ANON,
      (() => {
        const storage = new MemoryStorage();
        storage.setItem(ANON_KEY, JSON.stringify(missingTs));
        return storage;
      })(),
      NOW_MS,
    ).status === 'invalid-session',
  );
}

/* Owner-specific expiry removal and isolation */
{
  const storage = new MemoryStorage();
  const expiredAnon = inProgressSession(60);
  const validUserA = inProgressSession(5);
  saveAssessmentSession(expiredAnon, ANON, storage);
  saveAssessmentSession(validUserA, USER_A, storage);

  const loadAnon = loadAssessmentSession(ANON, storage, NOW_MS);
  assert('11: expired session removed from active owner only', loadAnon.status === 'missing' && loadAnon.session === null);
  assert('11: expired owner key removed', storage.read(ANON_KEY) === null);
  assert('12: anonymous expiry does not affect User A', storage.read(USER_A_KEY) !== null);
}

{
  const storage = new MemoryStorage();
  const expiredA = inProgressSession(60);
  const validAnon = inProgressSession(2);
  const validB = inProgressSession(3);
  saveAssessmentSession(expiredA, USER_A, storage);
  saveAssessmentSession(validAnon, ANON, storage);
  saveAssessmentSession(validB, USER_B, storage);

  const loadA = loadAssessmentSession(USER_A, storage, NOW_MS);
  assert('13: User A expiry does not affect Anonymous or User B', loadA.status === 'missing' && storage.read(ANON_KEY) !== null && storage.read(USER_B_KEY) !== null);
}

/* Removal failure on expired data */
{
  const storage = new MemoryStorage();
  const expired = inProgressSession(60);
  saveAssessmentSession(expired, USER_A, storage);
  storage.failRemoveKeys.add(USER_A_KEY);

  const loaded = loadAssessmentSession(USER_A, storage, NOW_MS);
  assert('14: failed remove never resumes expired session', loaded.status === 'missing' && loaded.session === null, loaded.status);
  const failedExpiryStatus = loaded.status === 'missing' ? loaded.expiry : undefined;
  assert('15: failed remove returns internal expiry status', failedExpiryStatus === 'expired-remove-failed', `${failedExpiryStatus}`);
  assert('15: failed remove leaves key untouched', storage.read(USER_A_KEY) !== null);
}

{
  const storage = new MemoryStorage();
  saveAssessmentSession(inProgressSession(60), USER_A, storage);
  const loaded = loadAssessmentSession(USER_A, storage, NOW_MS);
  const successExpiryStatus = loaded.status === 'missing' ? loaded.expiry : undefined;
  assert('16: successful expired cleanup returns missing state', loaded.status === 'missing' && successExpiryStatus === 'expired-removed');
  assert('16: successful expired cleanup removes key', storage.read(USER_A_KEY) === null);
}

/* Legacy migration + expiry determinism and namespaced precedence */
{
  const storage = new MemoryStorage();
  const legacyExpired = inProgressSession(60);
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, serializeAssessmentSession(legacyExpired));

  const first = loadAssessmentSession(ANON, storage, NOW_MS);
  const second = loadAssessmentSession(ANON, storage, NOW_MS);
  assert('17: legacy migration then expiry is deterministic', first.status === 'missing' && second.status === 'missing');
}

{
  const storage = new MemoryStorage();
  const namespacedValid = inProgressSession(2);
  const legacyExpired = inProgressSession(60);
  storage.setItem(ANON_KEY, serializeAssessmentSession(namespacedValid));
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, serializeAssessmentSession(legacyExpired));

  const loaded = loadAssessmentSession(ANON, storage, NOW_MS);
  assert('18: existing namespaced session still wins over legacy', loaded.status === 'loaded' && loaded.session?.updatedAt === namespacedValid.updatedAt);
}

/* Payload/version invariants */
{
  const storage = new MemoryStorage();
  const session = inProgressSession(1);
  const expectedRaw = serializeAssessmentSession(session);
  saveAssessmentSession(session, ANON, storage);
  assert('19: serialization output remains byte-identical', storage.read(ANON_KEY) === expectedRaw);
  assert('20: session version remains unchanged', session.sessionVersion === ASSESSMENT_SESSION_VERSION, session.sessionVersion);
}

/* User-visible safety and deterministic clock behavior */
{
  const hostSource = fs.readFileSync(
    path.join(import.meta.dirname, 'src/components/quiz/AssessmentQuizHost.tsx'),
    'utf8',
  );
  assert('21: no raw key appears in user-visible copy', !hostSource.includes(ASSESSMENT_SESSION_STORAGE_KEY));
  assert('21: no owner id literal appears in user-visible copy', !hostSource.includes('auth-user-a-001') && !hostSource.includes('auth-user-b-002'));
}

{
  const safe = (() => {
    try {
      const a = saveAssessmentSession(startAssessmentSession('free'), ANON);
      const b = loadAssessmentSession(ANON, undefined, NOW_MS);
      const c = clearAssessmentSession(ANON);
      const d = hasSavedAssessmentSession(ANON);
      return a.status === 'unavailable' && b.status === 'unavailable' && c.status === 'unavailable' && d === false;
    } catch {
      return false;
    }
  })();
  assert('22: storage unavailable remains non-throwing', safe);
}

{
  const storage = new MemoryStorage();
  const session = inProgressSession(30, 1);
  saveAssessmentSession(session, USER_A, storage);
  const a = loadAssessmentSession(USER_A, storage, NOW_MS);
  storage.setItem(USER_A_KEY, serializeAssessmentSession(session));
  const b = loadAssessmentSession(USER_A, storage, NOW_MS);
  const aExpiry = a.status === 'missing' ? a.expiry : undefined;
  const bExpiry = b.status === 'missing' ? b.expiry : undefined;
  assert('23: same supplied nowMs produces same result', a.status === b.status && aExpiry === bExpiry);
}

assert('expiry constant is exactly 30 days', ASSESSMENT_IN_PROGRESS_EXPIRY_MS === 30 * 24 * 60 * 60 * 1000);

console.log('==========================================');
console.log('Runtime Assessment Session Storage Validation');
console.log('------------------------------------------');
console.log(`legacy key: ${ASSESSMENT_SESSION_STORAGE_KEY}`);
console.log(`namespace version: ${ASSESSMENT_SESSION_STORAGE_NAMESPACE_VERSION}`);
console.log(`expiry ms: ${ASSESSMENT_IN_PROGRESS_EXPIRY_MS}`);
console.log(`anonymous key: ${ANON_KEY}`);
console.log(`session version: ${ASSESSMENT_SESSION_VERSION}`);
console.log('------------------------------------------');
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
if (errors.length > 0) {
  console.log('Errors:');
  for (const err of errors) {
    console.log(`  ${err}`);
  }
  process.exit(1);
}
console.log('ALL ASSERTIONS PASSED');
