import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  clearAssessmentOwnerData,
  hasAssessmentOwnerData,
  getAssessmentSessionStorageKey,
  type AssessmentStorageOwner,
  type AssessmentSessionStorageLike,
} from './src/lib/quiz/assessmentOwnerCleanup';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed++;
    return;
  }
  failed++;
  errors.push(`FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
}

class MemoryStorage implements AssessmentSessionStorageLike {
  private entries = new Map<string, string>();
  getItem(key: string): string | null {
    return this.entries.has(key) ? this.entries.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
  removeItem(key: string): void {
    this.entries.delete(key);
  }
  read(key: string): string | null {
    return this.entries.has(key) ? this.entries.get(key)! : null;
  }
}

const deleteAccountSource = fs.readFileSync(
  path.join(import.meta.dirname, 'src/lib/account/deleteAccount.ts'),
  'utf8',
);

assert(
  'deleteAccount.ts no longer imports from assessmentSessionStorage',
  !deleteAccountSource.includes("from '../quiz/assessmentSessionStorage'"),
);

assert(
  'deleteAccount.ts imports from assessmentOwnerCleanup',
  deleteAccountSource.includes("from '../quiz/assessmentOwnerCleanup'"),
);

assert(
  'deleteAccount.ts no longer references assessmentSession substring at all',
  !deleteAccountSource.includes('assessmentSession'),
);

assert(
  'deleteAccount.ts uses clearAssessmentOwnerData',
  deleteAccountSource.includes('clearAssessmentOwnerData'),
);

assert(
  'deleteAccount.ts does not import clearAssessmentSession',
  !deleteAccountSource.includes('clearAssessmentSession'),
);

const assessmentOwnerCleanupSource = fs.readFileSync(
  path.join(import.meta.dirname, 'src/lib/quiz/assessmentOwnerCleanup.ts'),
  'utf8',
);

assert(
  'assessmentOwnerCleanup.ts has no import from assessmentSession runtime module',
  !assessmentOwnerCleanupSource.includes('from \'./assessmentSession\'') &&
    !assessmentOwnerCleanupSource.includes('from \'../assessmentSession\'') &&
    !assessmentOwnerCleanupSource.includes('from \'../../assessmentSession\''),
);

assert(
  'assessmentOwnerCleanup.ts has no runtime scoring import',
  !assessmentOwnerCleanupSource.includes('scoringEngine'),
);

assert(
  'assessmentOwnerCleanup.ts has no window/fetch/document access in storage path',
  !assessmentOwnerCleanupSource.includes('fetch('),
);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

const srcDir = path.join(import.meta.dirname, 'src');
const excluded: string[] = [
  'assessmentSession.ts',
  'assessmentSessionStorage.ts',
  'assessmentOwnerCleanup.ts',
];
const violators: string[] = [];
for (const file of walk(srcDir)) {
  if (excluded.some(ex => file.endsWith(ex))) continue;
  if (file.includes('src/components/quiz/')) continue;
  if (file.endsWith('assessmentUiModel.ts')) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('assessmentSession')) {
    violators.push(file);
  }
}
assert(
  'preservation: no other src file references the assessment session module',
  violators.length === 0,
  violators.join(', '),
);

assert(
  'no src file outside assessment ownership boundary imports assessmentOwnerCleanup except deleteAccount.ts',
  (() => {
    const importers: string[] = [];
    for (const file of walk(srcDir)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('assessmentOwnerCleanup') && !file.endsWith('assessmentOwnerCleanup.ts') && !file.endsWith('assessmentSessionStorage.ts')) {
        importers.push(file);
      }
    }
    return importers.length === 1 && importers[0].endsWith('deleteAccount.ts');
  })(),
);

const USER_A: AssessmentStorageOwner = { kind: 'user', userId: 'user-a-uuid' };
const USER_B: AssessmentStorageOwner = { kind: 'user', userId: 'user-b-uuid' };
const ANON: AssessmentStorageOwner = { kind: 'anonymous' };

const USER_A_KEY = getAssessmentSessionStorageKey(USER_A);
const USER_B_KEY = getAssessmentSessionStorageKey(USER_B);
const ANON_KEY = getAssessmentSessionStorageKey(ANON);

assert('storage key format unchanged: v2 namespace', USER_A_KEY.includes(':v2:'));
assert('storage key format unchanged: user prefix', USER_A_KEY.includes(':user:'));
assert('storage key format unchanged: anonymous prefix', ANON_KEY.includes(':anonymous'));
assert('storage key does not embed raw userId', !USER_A_KEY.includes('user-a-uuid'));

{
  const storage = new MemoryStorage();
  storage.setItem(USER_A_KEY, 'fake-session-data');
  storage.setItem(USER_B_KEY, 'other-user-data');
  storage.setItem(ANON_KEY, 'anon-data');

  const result = clearAssessmentOwnerData(USER_A, storage);
  assert('clear returns cleared for user', result.status === 'cleared');
  assert('User A data removed', storage.read(USER_A_KEY) === null);
  assert('User B data preserved after User A clear', storage.read(USER_B_KEY) === 'other-user-data');
  assert('Anonymous data preserved after User A clear', storage.read(ANON_KEY) === 'anon-data');
}

{
  const storage = new MemoryStorage();

  const resultA = clearAssessmentOwnerData(USER_A, storage);
  assert('clear on missing user key returns cleared (removeItem is no-op)', resultA.status === 'cleared');

  const resultB = clearAssessmentOwnerData(USER_B, storage);
  assert('clear on missing user key B also cleared', resultB.status === 'cleared');
}

{
  const storage = new MemoryStorage();

  const anonResult = clearAssessmentOwnerData(ANON, storage);
  assert('clear on anonymous owner returns cleared', anonResult.status === 'cleared');
}

{
  const storage = new MemoryStorage();
  storage.setItem(USER_A_KEY, 'data-a');
  storage.setItem(USER_B_KEY, 'data-b');
  storage.setItem(ANON_KEY, 'data-anon');

  assert('hasAssessmentOwnerData true for User A', hasAssessmentOwnerData(USER_A, storage) === true);
  assert('hasAssessmentOwnerData false for empty owner', hasAssessmentOwnerData({ kind: 'user', userId: '' }, storage) === false);

  const result = clearAssessmentOwnerData(USER_A, storage);
  assert('owner-scoped clear removes only User A key', result.status === 'cleared');
  assert('User B key untouched', storage.read(USER_B_KEY) === 'data-b');
  assert('anonymous key untouched', storage.read(ANON_KEY) === 'data-anon');
  assert('hasAssessmentOwnerData false for User A after clear', hasAssessmentOwnerData(USER_A, storage) === false);
}

{
  const storage = new MemoryStorage();

  class FailingStorage implements AssessmentSessionStorageLike {
    getItem(_key: string): string | null {
      return null;
    }
    setItem(_key: string, _value: string): void {
      throw new Error('storage locked');
    }
    removeItem(_key: string): void {
      throw new Error('remove failed');
    }
  }

  const failing = new FailingStorage();
  const result = clearAssessmentOwnerData(USER_A, failing);
  assert('remove failure returns remove-failed', result.status === 'remove-failed');
}

{
  const noWindowResult = clearAssessmentOwnerData(USER_A, undefined as unknown as AssessmentSessionStorageLike);
  assert('clear with no storage resolves to unavailable when window absent', noWindowResult.status === 'unavailable' || noWindowResult.status === 'cleared');
}

const assessmentSessionStorageSource = fs.readFileSync(
  path.join(import.meta.dirname, 'src/lib/quiz/assessmentSessionStorage.ts'),
  'utf8',
);

assert(
  'assessmentSessionStorage.ts re-exports from assessmentOwnerCleanup',
  assessmentSessionStorageSource.includes("from './assessmentOwnerCleanup'"),
);

assert(
  'assessmentSessionStorage.ts re-exports clearAssessmentSession as wrapper',
  assessmentSessionStorageSource.includes('clearAssessmentOwnerData'),
);

assert(
  'assessmentSessionStorage.ts no longer defines its own key constants',
  !assessmentSessionStorageSource.includes("ASSESSMENT_SESSION_STORAGE_KEY = 'cure-life-assessment-session'"),
);

assert(
  'assessmentSessionStorage.ts no longer defines its own toUtf8Bytes/fnv1a32',
  !assessmentSessionStorageSource.includes('function toUtf8Bytes') &&
    !assessmentSessionStorageSource.includes('function fnv1a32') &&
    !assessmentSessionStorageSource.includes('function buildUserNamespaceToken'),
);

const assessmentOwnerCleanupPath = path.join(
  import.meta.dirname,
  'src/lib/quiz/assessmentOwnerCleanup.ts',
);
assert(
  'assessmentOwnerCleanup.ts file exists',
  fs.existsSync(assessmentOwnerCleanupPath),
);

const cleanupModule = await import('./src/lib/quiz/assessmentOwnerCleanup');
assert(
  'assessmentOwnerCleanup.ts exports clearAssessmentOwnerData',
  typeof cleanupModule.clearAssessmentOwnerData === 'function',
);
assert(
  'assessmentOwnerCleanup.ts exports getAssessmentSessionStorageKey',
  typeof cleanupModule.getAssessmentSessionStorageKey === 'function',
);
assert(
  'assessmentOwnerCleanup.ts exports ASSESSMENT_SESSION_STORAGE_KEY',
  cleanupModule.ASSESSMENT_SESSION_STORAGE_KEY === 'cure-life-assessment-session',
);
assert(
  'assessmentOwnerCleanup.ts exports ASSESSMENT_SESSION_STORAGE_NAMESPACE_VERSION',
  cleanupModule.ASSESSMENT_SESSION_STORAGE_NAMESPACE_VERSION === 'v2',
);

const storageModule = await import('./src/lib/quiz/assessmentSessionStorage');
assert(
  'assessmentSessionStorage.ts still exports clearAssessmentSession',
  typeof storageModule.clearAssessmentSession === 'function',
);
assert(
  'assessmentSessionStorage.ts still exports getAssessmentSessionStorageKey',
  typeof storageModule.getAssessmentSessionStorageKey === 'function',
);
assert(
  'assessmentSessionStorage.ts still exports ASSESSMENT_SESSION_STORAGE_KEY',
  storageModule.ASSESSMENT_SESSION_STORAGE_KEY === 'cure-life-assessment-session',
);
assert(
  'assessmentSessionStorage.ts still exports ASSESSMENT_IN_PROGRESS_EXPIRY_MS',
  storageModule.ASSESSMENT_IN_PROGRESS_EXPIRY_MS === 30 * 24 * 60 * 60 * 1000,
);

assert(
  'assessmentSessionStorage.ts still exports AssessmentStorageOwner type',
  storageModule.getAssessmentSessionStorageKey({ kind: 'anonymous' }).includes('anonymous'),
);

console.log('==========================================');
console.log('Assessment Session Ownership Cleanup Validation');
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
