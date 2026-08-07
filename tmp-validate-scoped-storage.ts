// Deterministic validator for Batch 13 account-scoped journal/reflection
// storage. Run with: npx tsx tmp/validate-scoped-storage.ts
import {
  getOwnerKey,
  buildUserToken,
  loadOwnerList,
  saveOwnerList,
  clearOwnerList,
  resolveListOwner,
  type StorageLike,
  type StorageOwner,
} from './src/lib/storage/ownerScopedStorage';
import {
  getJournalOwnerKey,
  loadJournalEntries,
  saveJournalEntries,
  clearJournalEntries,
  JOURNAL_STORAGE_KEY,
} from './src/lib/storage/journalStorage';
import {
  getReflectionOwnerKey,
  loadReflectionLogs,
  saveReflectionLogs,
  clearReflectionLogs,
  REFLECTION_STORAGE_KEY,
} from './src/lib/storage/reflectionStorage';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) passed++;
  else { failed++; errors.push(`FAIL: ${label}${detail ? ` — ${detail}` : ''}`); }
}

const USER_A: StorageOwner = { kind: 'user', userId: 'user-a-id-123' };
const USER_B: StorageOwner = { kind: 'user', userId: 'user-b-id-456' };
const ANON: StorageOwner = { kind: 'anonymous' };

function makeStorage(): StorageLike & { backing: Map<string, string> } {
  const backing = new Map<string, string>();
  return {
    backing,
    getItem: (k) => backing.has(k) ? backing.get(k)! : null,
    setItem: (k, v) => { backing.set(k, v); },
    removeItem: (k) => { backing.delete(k); },
  };
}

console.log('Journal: key isolation');
const keyA = getJournalOwnerKey(ANON);
const keyUA = getJournalOwnerKey(USER_A);
const keyUB = getJournalOwnerKey(USER_B);
assert('1. anonymous vs User A use different keys', keyA !== keyUA);
assert('1b. anonymous vs User B use different keys', keyA !== keyUB);
assert('2. User A vs User B use different keys', keyUA !== keyUB);
assert('3. same User A resolves same key', getJournalOwnerKey(USER_A) === keyUA);
assert('3b. deterministic across calls', getOwnerKey(JOURNAL_STORAGE_KEY, 'v2', USER_A) === keyUA);
assert('4. anonymous key exact', keyA === 'somatic_journal_logs:v2:anonymous');
assert('4b. user key namespace has no raw id/email', keyUA.startsWith('somatic_journal_logs:v2:user:') && !keyUA.includes('user-a-id-123'));

console.log('Journal: token helper');
assert('token deterministic', buildUserToken('x') === buildUserToken('x'));
assert('token differs for different ids', buildUserToken('a') !== buildUserToken('b'));
assert('token excludes raw id', !buildUserToken('user-a-id-123').includes('user-a-id-123'));
assert('token excludes email', !buildUserToken('a@example.com').includes('a@example.com'));

console.log('Journal: anonymous legacy migrates once');
{
  const s = makeStorage();
  const legacy = JSON.stringify([{ id: 'legacy-1' }]);
  s.setItem(JOURNAL_STORAGE_KEY, legacy);
  const r1 = loadJournalEntries(ANON, s);
  assert('5. legacy migrates to anonymous', r1.status === 'loaded' && r1.items.length === 1 && (r1.status === 'loaded' ? r1.migratedFromLegacy === true : false));
  assert('5. legacy key removed after successful migration', s.getItem(JOURNAL_STORAGE_KEY) === null);
  assert('5. anonymous key now holds migrated data', s.getItem(keyA) === JSON.stringify([{ id: 'legacy-1' }]));
  const r2 = loadJournalEntries(ANON, s);
  assert('5. second load no duplication', r2.status === 'loaded' && r2.items.length === 1);
}

console.log('Journal: signed-in launch preserves legacy as anonymous');
{
  const s = makeStorage();
  s.setItem(JOURNAL_STORAGE_KEY, JSON.stringify([{ id: 'legacy-user' }]));
  const r = loadJournalEntries(USER_A, s);
  assert('6. signed-in owner does NOT get legacy data', r.status === 'missing');
  assert('6. legacy key untouched on signed-in load', s.getItem(JOURNAL_STORAGE_KEY) !== null);
  const rAnon = loadJournalEntries(ANON, s);
  assert('6. legacy preserved for anonymous', rAnon.status === 'loaded' && rAnon.items[0].id === 'legacy-user');
}

console.log('Journal: existing namespaced data wins');
{
  const s = makeStorage();
  s.setItem(keyA, JSON.stringify([{ id: 'newer-anon' }]));
  s.setItem(JOURNAL_STORAGE_KEY, JSON.stringify([{ id: 'older-legacy' }]));
  const r = loadJournalEntries(ANON, s);
  assert('7. namespaced wins over legacy', r.status === 'loaded' && r.items[0].id === 'newer-anon');
  assert('7. no migration triggered', r.status === 'loaded' ? r.migratedFromLegacy === false : false);
  assert('7. anonymous key unchanged', JSON.parse(s.getItem(keyA)!).length === 1);
}

console.log('Journal: failed destination write preserves legacy');
{
  const s = makeStorage();
  s.setItem(JOURNAL_STORAGE_KEY, JSON.stringify([{ id: 'keep-me' }]));
  const originalSet = s.setItem.bind(s);
  s.setItem = (k, v) => { if (k === keyA) throw new Error('quota full'); originalSet(k, v); };
  const r = loadJournalEntries(ANON, s);
  assert('8. failed write preserves legacy source', s.getItem(JOURNAL_STORAGE_KEY) !== null);
  assert('8. read fails safely, no leak', r.status === 'missing');
}

console.log('Journal: failed legacy removal does not overwrite newer data');
{
  const s = makeStorage();
  s.setItem(keyA, JSON.stringify([{ id: 'newer-anon' }]));
  const originalRm = s.removeItem.bind(s);
  s.removeItem = (k) => { if (k === JOURNAL_STORAGE_KEY) throw new Error('rm fail'); originalRm(k); };
  const r = loadJournalEntries(ANON, s);
  assert('9. newer anonymous data preserved despite rm failure', r.status === 'loaded' && r.items[0].id === 'newer-anon');
}

console.log('Journal: invalid legacy data not migrated');
{
  const s = makeStorage();
  s.setItem(JOURNAL_STORAGE_KEY, 'not-json{');
  const r = loadJournalEntries(ANON, s);
  assert('10. invalid legacy not migrated', r.status !== 'loaded');
  assert('10. invalid legacy cleaned', s.getItem(JOURNAL_STORAGE_KEY) === null);
}

console.log('Journal: clear isolation');
{
  const s = makeStorage();
  s.setItem(keyA, JSON.stringify([{ id: 'anon' }]));
  s.setItem(keyUA, JSON.stringify([{ id: 'ua' }]));
  s.setItem(keyUB, JSON.stringify([{ id: 'ub' }]));
  clearJournalEntries(ANON, s);
  assert('11. clear anonymous leaves User A intact', s.getItem(keyUA) !== null);
  assert('11. clear anonymous leaves User B intact', s.getItem(keyUB) !== null);
  clearJournalEntries(USER_A, s);
  assert('12. clear User A leaves User B intact', s.getItem(keyUB) !== null);
  assert('12. clear User A removed User A', s.getItem(keyUA) === null);

  // separate instance: clearing User A must not touch anonymous
  const s2 = makeStorage();
  s2.setItem(keyA, JSON.stringify([{ id: 'anon2' }]));
  s2.setItem(keyUA, JSON.stringify([{ id: 'ua2' }]));
  clearJournalEntries(USER_A, s2);
  assert('12. clear User A left anonymous intact', s2.getItem(keyA) !== null);
}

console.log('Journal: storage unavailable non-throwing');
{
  const broken: StorageLike = {
    getItem: () => { throw new Error('no access'); },
    setItem: () => { throw new Error('no access'); },
    removeItem: () => { throw new Error('no access'); },
  };
  const r = loadJournalEntries(ANON, broken);
  assert('13. read non-throwing', r.status !== 'loaded');
  assert('13b. broken read never fakes loaded data', r.items.length === 0);
  const rs = saveJournalEntries([{ id: 'x' }], USER_A, broken);
  assert('13. save non-throwing', typeof rs === 'string');
  const rc = clearJournalEntries(USER_A, broken);
  assert('13. clear non-throwing', typeof rc === 'string');
}

console.log('Journal: payload JSON shape unchanged');
{
  const s = makeStorage();
  const sample = [{ id: 'e1', date: 'x', physicalSymptom: 'p', emotionalState: 'e', descriptionOfDay: 'd', intensity: 5 }];
  saveJournalEntries(sample, USER_A, s);
  assert('14. stored payload identical', s.getItem(keyUA) === JSON.stringify(sample));
  const loaded = loadJournalEntries(USER_A, s);
  assert('14. round-trip preserves fields', loaded.status === 'loaded' && JSON.stringify(loaded.items) === JSON.stringify(sample));
}

console.log('Reflection: storage keys');
const rKeyA = getReflectionOwnerKey(ANON);
const rKeyUA = getReflectionOwnerKey(USER_A);
assert('1R. anonymous vs User A distinct', rKeyA !== rKeyUA);
assert('2R. User A vs User B distinct', getReflectionOwnerKey(USER_B) !== rKeyUA);
assert('3R. deterministic', getReflectionOwnerKey(USER_A) === rKeyUA);
assert('4R. key namespace exact', rKeyA === 'cure-life-reflection-logs:v2:anonymous');

console.log('Reflection: legacy migration');
{
  const s = makeStorage();
  s.setItem(REFLECTION_STORAGE_KEY, JSON.stringify([{ id: 'r-legacy' }]));
  const r = loadReflectionLogs(ANON, s);
  assert('5R. migrates once to anonymous', r.status === 'loaded' && r.items.length === 1);
  assert('5R. legacy removed after', s.getItem(REFLECTION_STORAGE_KEY) === null);
}

console.log('Reflection: signed-in launch preserves legacy as anonymous');
{
  const s = makeStorage();
  s.setItem(REFLECTION_STORAGE_KEY, JSON.stringify([{ id: 'r-legacy' }]));
  const r = loadReflectionLogs(USER_A, s);
  assert('6R. signed-in not given legacy', r.status === 'missing');
  assert('6R. legacy intact for later anonymous', s.getItem(REFLECTION_STORAGE_KEY) !== null);
}

console.log('Reflection: namespaced wins + clear + payload');
{
  const s = makeStorage();
  const newer = [{ id: 'new' }];
  const older = [{ id: 'old' }];
  s.setItem(rKeyA, JSON.stringify(newer));
  s.setItem(REFLECTION_STORAGE_KEY, JSON.stringify(older));
  const r = loadReflectionLogs(ANON, s);
  assert('7R. namespaced wins', r.status === 'loaded' && r.items[0].id === 'new');

  s.setItem(rKeyUA, JSON.stringify([{ id: 'ua' }]));
  clearReflectionLogs(ANON, s);
  assert('11R. clear anon leaves user', s.getItem(rKeyUA) !== null);

  const round = makeStorage();
  saveReflectionLogs(newer, USER_A, round);
  assert('14R. payload preserved', round.getItem(rKeyUA) === JSON.stringify(newer));
  const loadedR = loadReflectionLogs(USER_A, round);
  assert('14R. round-trip preserves fields', loadedR.status === 'loaded' && loadedR.items[0].id === 'new');
}

console.log('Reflection: capacity cap = 25');
{
  const s = makeStorage();
  const many = Array.from({ length: 40 }, (_, i) => ({ id: `r${i}` }));
  saveReflectionLogs(many, USER_A, s);
  const raw = s.getItem(rKeyUA)!;
  assert('capacity caps stored list', JSON.parse(raw).length === 25);
}

console.log('Owner resolution');
assert('owner null while unresolved', resolveListOwner(false, null) === null);
assert('owner null while unresolved with stale user', resolveListOwner(false, { id: 'x' }) === null);
assert('owner anonymous after resolved no user', resolveListOwner(true, null)?.kind === 'anonymous');
assert('owner user after resolved with id', resolveListOwner(true, { id: 'abc' })?.kind === 'user');
assert('owner user keeps id', resolveListOwner(true, { id: 'abc' })?.kind === 'user');

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) {
  console.log('\nFailures:');
  errors.forEach(e => console.log(`  ❌ ${e}`));
  process.exit(1);
} else {
  console.log(`\n✅ ALL ${passed} CHECKS PASSED`);
  process.exit(0);
}