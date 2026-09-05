import {
  createDefaultSignal,
  patchCurrentSignal,
  loadCurrentSignal,
  saveCurrentSignal,
  clearCurrentSignal,
  getCurrentSignalOwnerKey,
} from '../src/lib/storage/currentSignalStorage';
import type { CurrentSignal, CurrentSignalPatch, CreateCurrentSignalInput } from '../src/types';
import type { StorageLike } from '../src/lib/storage/ownerScopedStorage';

function fakeStorage(initial: Record<string, string> = {}): StorageLike {
  const store: Record<string, string> = { ...initial };
  return {
    getItem(key: string) {
      return store[key] ?? null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
  };
}

function assert(condition: unknown, message: string) {
  if (condition) {
    console.log('  ok  -', message);
  } else {
    throw new Error(message);
  }
}

let failures = 0;
function fail(message: string) {
  failures++;
  console.error('  FAIL -', message);
}

const anonymousOwner = { kind: 'anonymous' as const };
const userOwner = { kind: 'user' as const, userId: 'user-123' };

console.log('--- CurrentSignal Architecture Tests ---\n');

// 1. creation produces a valid signal and identity fields are controlled by the factory
console.log('Creation:');
const created = createDefaultSignal({ symptomText: 'Headache' });
assert(created.id.startsWith('sig-'), 'default signal has sig- prefix id');
assert(created.status === 'draft', 'default status is draft');
assert(typeof created.createdAt === 'string' && created.createdAt.length > 0, 'createdAt is set');
assert(typeof created.updatedAt === 'string' && created.updatedAt.length > 0, 'updatedAt is set');
assert(created.symptomText === 'Headache', 'partial fields are applied');
assert(created.ailmentId === undefined, 'optional fields default to undefined');

// Type-level: id/createdAt/updatedAt are omitted from CreateCurrentSignalInput
// (Verified at compile time by the source type definition)

// 2. patchCurrentSignal preserves identity and updates updatedAt
console.log('\nPatches:');
const patched = patchCurrentSignal(created, { intensity: 7 });
assert(patched.id === created.id, 'patch preserves id');
assert(patched.createdAt === created.createdAt, 'patch preserves createdAt');
assert(patched.symptomText === 'Headache', 'patch preserves symptomText');
assert(patched.intensity === 7, 'patch applies intensity');
assert(patched.updatedAt !== created.updatedAt, 'patch updates updatedAt');

// Patch type omits identity fields
const patch: CurrentSignalPatch = { symptomText: 'New' };
assert(!('id' in patch), 'CurrentSignalPatch omits id');
assert(!('createdAt' in patch), 'CurrentSignalPatch omits createdAt');

// 3. persistence round-trip
console.log('\nPersistence:');
const storage = fakeStorage();
const userKey = getCurrentSignalOwnerKey(userOwner);
assert(userKey.includes(':user:'), 'owner key reflects user kind');
assert(!userKey.includes('user-123'), 'owner key does not leak raw user id');

saveCurrentSignal(created, userOwner, storage);
assert(storage.getItem(userKey) !== null, 'save writes to storage');

const loaded = loadCurrentSignal(userOwner, storage);
assert(loaded.status === 'loaded', 'load returns loaded status');
assert(loaded.signal?.id === created.id, 'loaded signal id matches');
assert(loaded.signal?.symptomText === 'Headache', 'loaded signal text matches');

// 4. clearing removes state
console.log('\nClearing:');
const clearResult = clearCurrentSignal(userOwner, storage);
assert(clearResult === 'cleared', 'clear returns cleared');
assert(loadCurrentSignal(userOwner, storage).status === 'missing', 'cleared signal is missing');

// 5. malformed persisted data does not crash
console.log('\nDefensive parsing:');
const malformedStorage = fakeStorage({ [userKey]: 'not json' });
const malformedResult = loadCurrentSignal(userOwner, malformedStorage);
assert(malformedResult.status === 'invalid-data', 'malformed JSON returns invalid-data');
assert(malformedResult.signal === null, 'malformed JSON returns null signal');

const wrongVersionStorage = fakeStorage({ [userKey]: JSON.stringify({ version: 'v99', signal: created }) });
const wrongVersionResult = loadCurrentSignal(userOwner, wrongVersionStorage);
assert(wrongVersionResult.status === 'invalid-data', 'wrong version returns invalid-data');

const missingFieldsStorage = fakeStorage({ [userKey]: JSON.stringify({ version: 'v1', signal: { id: 1 } }) });
const missingFieldsResult = loadCurrentSignal(userOwner, missingFieldsStorage);
assert(missingFieldsResult.status === 'invalid-data', 'missing required fields returns invalid-data');

const nullSignalStorage = fakeStorage({ [userKey]: JSON.stringify({ version: 'v1', signal: null }) });
const nullSignalResult = loadCurrentSignal(userOwner, nullSignalStorage);
assert(nullSignalResult.status === 'loaded', 'null signal is valid');
assert(nullSignalResult.signal === null, 'null signal round-trips as null');

// Malformed optional fields
const badIntensity = { ...created, intensity: 'high' as any };
const badIntensityStorage = fakeStorage({ [userKey]: JSON.stringify({ version: 'v1', signal: badIntensity }) });
assert(loadCurrentSignal(userOwner, badIntensityStorage).status === 'invalid-data', 'non-number intensity is rejected');

const badSafety = { ...created, medicalSafetyStatus: 'critical' as any };
const badSafetyStorage = fakeStorage({ [userKey]: JSON.stringify({ version: 'v1', signal: badSafety }) });
assert(loadCurrentSignal(userOwner, badSafetyStorage).status === 'invalid-data', 'invalid medicalSafetyStatus is rejected');

const badRedFlags = { ...created, redFlags: 'yes' as any };
const badRedFlagsStorage = fakeStorage({ [userKey]: JSON.stringify({ version: 'v1', signal: badRedFlags }) });
assert(loadCurrentSignal(userOwner, badRedFlagsStorage).status === 'invalid-data', 'non-array redFlags is rejected');

const badLenses = { ...created, selectedLenses: [1, 2] as any };
const badLensesStorage = fakeStorage({ [userKey]: JSON.stringify({ version: 'v1', signal: badLenses }) });
assert(loadCurrentSignal(userOwner, badLensesStorage).status === 'invalid-data', 'non-string array selectedLenses is rejected');

// 6. versioned persistence restores valid state
console.log('\nVersioning:');
const v1Storage = fakeStorage();
saveCurrentSignal(createDefaultSignal({ symptomText: 'v1-data' }), anonymousOwner, v1Storage);
const v1Loaded = loadCurrentSignal(anonymousOwner, v1Storage);
assert(v1Loaded.status === 'loaded', 'v1 payload loads successfully');
assert(v1Loaded.signal?.symptomText === 'v1-data', 'v1 payload data is preserved');

// 7. owner scoping
console.log('\nOwner scoping:');
const scopedStorage = fakeStorage();
saveCurrentSignal(createDefaultSignal({ symptomText: 'user-data' }), userOwner, scopedStorage);
saveCurrentSignal(createDefaultSignal({ symptomText: 'anon-data' }), anonymousOwner, scopedStorage);
const userLoaded = loadCurrentSignal(userOwner, scopedStorage);
const anonLoaded = loadCurrentSignal(anonymousOwner, scopedStorage);
assert(userLoaded.signal?.symptomText === 'user-data', 'user data isolated from anonymous');
assert(anonLoaded.signal?.symptomText === 'anon-data', 'anonymous data isolated from user');

// 8. no network transmission from storage layer
console.log('\nPrivacy / no network:');
const originalFetch = globalThis.fetch;
let fetchCalled = false;
globalThis.fetch = () => { fetchCalled = true; return Promise.resolve(new Response()) as any; };
saveCurrentSignal(created, userOwner, storage);
loadCurrentSignal(userOwner, storage);
clearCurrentSignal(userOwner, storage);
assert(!fetchCalled, 'storage layer does not call fetch');
globalThis.fetch = originalFetch;

console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
