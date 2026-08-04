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
  getAssessmentSessionStorageKey,
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
  public failSetAll = false;
  public failRemoveOnceKeys = new Set<string>();

  getItem(key: string): string | null {
    if (this.failGetKeys.has(key)) throw new Error(`forced get failure:${key}`);
    return this.entries.has(key) ? this.entries.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    if (this.failSetAll || this.failSetKeys.has(key)) throw new Error(`forced set failure:${key}`);
    this.entries.set(key, value);
  }

  removeItem(key: string): void {
    if (this.failRemoveOnceKeys.has(key)) {
      this.failRemoveOnceKeys.delete(key);
      throw new Error(`forced remove-once failure:${key}`);
    }
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
const USER_A_AGAIN: AssessmentStorageOwner = { kind: 'user', userId: 'auth-user-a-001' };

const ANON_KEY = getAssessmentSessionStorageKey(ANON);
const USER_A_KEY = getAssessmentSessionStorageKey(USER_A);
const USER_B_KEY = getAssessmentSessionStorageKey(USER_B);

const FREE = startAssessmentSession('free');
const PRO = startAssessmentSession('pro');

/* 1/2/3/4: Namespace key determinism and identity safety */
assert('1: anonymous and User A keys differ', ANON_KEY !== USER_A_KEY);
assert('2: User A and User B keys differ', USER_A_KEY !== USER_B_KEY);
assert('3: same User A resolves to same key', USER_A_KEY === getAssessmentSessionStorageKey(USER_A_AGAIN));
{
  const emailLikeOwner: AssessmentStorageOwner = { kind: 'user', userId: 'person@example.com' };
  const displayLike = 'Visible Name';
  const emailLikeKey = getAssessmentSessionStorageKey(emailLikeOwner);
  assert('4: key omits raw email address', !emailLikeKey.includes('person@example.com'));
  assert('4: key omits email local/domain fragments', !emailLikeKey.includes('person') && !emailLikeKey.includes('example.com'));
  assert('4: key omits display-name text', !emailLikeKey.includes(displayLike));
}

assert('namespace version is explicit v2', ASSESSMENT_SESSION_STORAGE_NAMESPACE_VERSION === 'v2');
assert('legacy key remains exact', ASSESSMENT_SESSION_STORAGE_KEY === 'cure-life-assessment-session');

/* 5: anonymous legacy migrates once */
{
  const storage = new MemoryStorage();
  const raw = serializeAssessmentSession(FREE);
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, raw);
  const first = loadAssessmentSession(ANON, storage);
  assert('5: anonymous load returns loaded after migration', first.status === 'loaded' && first.session !== null, first.status);
  assert('5: anonymous migration writes namespaced key', storage.read(ANON_KEY) === raw);
  assert('5: anonymous migration removes legacy key on success', storage.read(ASSESSMENT_SESSION_STORAGE_KEY) === null);
  const second = loadAssessmentSession(ANON, storage);
  assert('5: anonymous second load reads namespaced copy', second.status === 'loaded');
}

/* 6: signed-in launch preserves legacy as anonymous only */
{
  const storage = new MemoryStorage();
  const raw = serializeAssessmentSession(FREE);
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, raw);
  const userLoad = loadAssessmentSession(USER_A, storage);
  assert('6: signed-in owner does not load legacy as user session', userLoad.status === 'missing', userLoad.status);
  assert('6: signed-in launch migrates legacy into anonymous namespace', storage.read(ANON_KEY) === raw);
  assert('6: User A namespace remains empty', storage.read(USER_A_KEY) === null);
}

/* 7/8: namespaced data wins; migration never overwrites newer namespaced */
{
  const storage = new MemoryStorage();
  const anonRaw = serializeAssessmentSession(PRO);
  const legacyRaw = serializeAssessmentSession(FREE);
  storage.setItem(ANON_KEY, anonRaw);
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, legacyRaw);
  const loaded = loadAssessmentSession(ANON, storage);
  assert('7: existing namespaced anonymous data wins over legacy', loaded.status === 'loaded' && loaded.session?.mode === 'pro', loaded.status);
  assert('7: legacy remains untouched when namespaced exists', storage.read(ASSESSMENT_SESSION_STORAGE_KEY) === legacyRaw);
  assert('8: migration does not overwrite newer namespaced data', storage.read(ANON_KEY) === anonRaw);
}

/* 9: failed destination write preserves legacy source */
{
  const storage = new MemoryStorage();
  const legacyRaw = serializeAssessmentSession(FREE);
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, legacyRaw);
  storage.failSetKeys.add(ANON_KEY);
  const loaded = loadAssessmentSession(ANON, storage);
  assert('9: anonymous can still load legacy when destination write fails', loaded.status === 'loaded');
  assert('9: failed destination write keeps legacy source', storage.read(ASSESSMENT_SESSION_STORAGE_KEY) === legacyRaw);
  assert('9: failed destination write does not create namespaced key', storage.read(ANON_KEY) === null);
}

/* 10: failed legacy removal does not repeatedly overwrite newer anonymous */
{
  const storage = new MemoryStorage();
  const legacyRaw = serializeAssessmentSession(FREE);
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, legacyRaw);
  storage.failRemoveOnceKeys.add(ASSESSMENT_SESSION_STORAGE_KEY);
  const first = loadAssessmentSession(ANON, storage);
  assert('10: first load succeeds even if legacy remove fails', first.status === 'loaded');
  const newer = serializeAssessmentSession(PRO);
  storage.setItem(ANON_KEY, newer);
  const second = loadAssessmentSession(ANON, storage);
  assert('10: later load keeps newer anonymous data', second.status === 'loaded' && second.session?.mode === 'pro', second.status);
  assert('10: legacy still present after remove failure', storage.read(ASSESSMENT_SESSION_STORAGE_KEY) === legacyRaw);
  assert('10: stale legacy did not overwrite newer anonymous data', storage.read(ANON_KEY) === newer);
}

/* 11/12: invalid legacy and version mismatch cleanup */
{
  const storage = new MemoryStorage();
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, 'not-json');
  const loaded = loadAssessmentSession(ANON, storage);
  assert('11: invalid legacy is not migrated', loaded.status === 'invalid-session', loaded.status);
  assert('11: invalid legacy is cleaned up', storage.read(ASSESSMENT_SESSION_STORAGE_KEY) === null);
  assert('11: no anonymous session created from invalid legacy', storage.read(ANON_KEY) === null);
}
{
  const storage = new MemoryStorage();
  const payload = JSON.parse(serializeAssessmentSession(FREE)) as Record<string, unknown>;
  payload.sessionVersion = 'strategy-9.9.9|groups-9.9.9';
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, JSON.stringify(payload));
  const loaded = loadAssessmentSession(ANON, storage);
  assert('12: version mismatch maps to invalid-session', loaded.status === 'invalid-session', loaded.status);
  assert('12: version mismatch is cleaned up', storage.read(ASSESSMENT_SESSION_STORAGE_KEY) === null);
}

/* 13/14: clear isolation by owner */
{
  const storage = new MemoryStorage();
  saveAssessmentSession(FREE, ANON, storage);
  saveAssessmentSession(PRO, USER_A, storage);
  const cleared = clearAssessmentSession(ANON, storage);
  assert('13: clear anonymous succeeds', cleared.status === 'cleared', cleared.status);
  assert('13: clear anonymous removes only anonymous namespace', storage.read(ANON_KEY) === null && storage.read(USER_A_KEY) !== null);
}
{
  const storage = new MemoryStorage();
  saveAssessmentSession(FREE, ANON, storage);
  saveAssessmentSession(PRO, USER_A, storage);
  saveAssessmentSession(FREE, USER_B, storage);
  const cleared = clearAssessmentSession(USER_A, storage);
  assert('14: clear User A succeeds', cleared.status === 'cleared', cleared.status);
  assert('14: clear User A does not clear anonymous', storage.read(ANON_KEY) !== null);
  assert('14: clear User A does not clear User B', storage.read(USER_B_KEY) !== null);
}

/* 15: unavailable remains non-throwing */
{
  const safe = (() => {
    try {
      const a = saveAssessmentSession(FREE, ANON);
      const b = loadAssessmentSession(ANON);
      const c = clearAssessmentSession(ANON);
      const d = hasSavedAssessmentSession(ANON);
      return a.status === 'unavailable' && b.status === 'unavailable' && c.status === 'unavailable' && d === false;
    } catch {
      return false;
    }
  })();
  assert('15: storage unavailable path is non-throwing', safe);
}

/* 16: serialization contract stays byte-identical */
{
  const storage = new MemoryStorage();
  const expected = serializeAssessmentSession(FREE);
  const save = saveAssessmentSession(FREE, ANON, storage);
  assert('16: save succeeds for valid session', save.status === 'saved', save.status);
  assert('16: stored payload equals serializeAssessmentSession output byte-for-byte', storage.read(ANON_KEY) === expected);
}

/* 17: status mappings remain valid */
{
  const unavailableSave = saveAssessmentSession(FREE, ANON);
  assert('17: save unavailable status preserved', unavailableSave.status === 'unavailable');

  const writeFailStorage = new MemoryStorage();
  writeFailStorage.failSetAll = true;
  assert('17: save write-failed status preserved', saveAssessmentSession(FREE, ANON, writeFailStorage).status === 'write-failed');

  const circular: { self?: unknown } = {};
  circular.self = circular;
  const invalid = {
    ...FREE,
    responses: {
      ...FREE.responses,
      'q-core-test-01': circular,
    },
  } as unknown as AssessmentSession;
  assert('17: save serialization-failed status preserved', saveAssessmentSession(invalid, ANON, new MemoryStorage()).status === 'serialization-failed');
  assert('17: save invalid-session status preserved', saveAssessmentSession({} as AssessmentSession, ANON, new MemoryStorage()).status === 'invalid-session');

  const readFailStorage = new MemoryStorage();
  readFailStorage.failGetKeys.add(ANON_KEY);
  assert('17: load read-failed status preserved', loadAssessmentSession(ANON, readFailStorage).status === 'read-failed');

  const removeFailStorage = new MemoryStorage();
  removeFailStorage.failRemoveKeys.add(ANON_KEY);
  assert('17: clear remove-failed status preserved', clearAssessmentSession(ANON, removeFailStorage).status === 'remove-failed');

  const successStorage = new MemoryStorage();
  assert('17: save saved status preserved', saveAssessmentSession(FREE, ANON, successStorage).status === 'saved');
}

/* 18: no key or owner identifier exposure */
{
  const hostSource = fs.readFileSync(
    path.join(import.meta.dirname, 'src/components/quiz/AssessmentQuizHost.tsx'),
    'utf8',
  );
  assert('18: host source does not expose legacy key literal', !hostSource.includes(ASSESSMENT_SESSION_STORAGE_KEY));
  assert('18: host source does not log storage owner identifiers', !hostSource.includes('authUser.id') && !hostSource.includes('console.'));
}

console.log('==========================================');
console.log('Runtime Assessment Session Storage Validation');
console.log('------------------------------------------');
console.log(`legacy key: ${ASSESSMENT_SESSION_STORAGE_KEY}`);
console.log(`namespace version: ${ASSESSMENT_SESSION_STORAGE_NAMESPACE_VERSION}`);
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
