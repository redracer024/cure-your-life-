// Owner-scoped browser storage for user-authored wellness lists (journal,
// reflections). Isolates data per browser user so a shared device cannot leak
// one account's entries to another (or to anonymous).
//
// Ownership is encoded in the storage key namespace only — never inside the
// stored payload and never keyed by email/display name/client data. Uses the
// stable authenticated Supabase user id, hashed to a deterministic token.

export interface StorageItem {
  id: string;
}

export type StorageOwner =
  | { kind: 'anonymous' }
  | { kind: 'user'; userId: string };

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type OwnerListLoadStatus =
  | 'loaded'
  | 'missing'
  | 'unavailable'
  | 'invalid-data';

export type OwnerListLoadResult =
  | { status: 'loaded'; items: StorageItem[]; migratedFromLegacy: boolean }
  | { status: 'missing' | 'unavailable' | 'invalid-data'; items: [] };

export type OwnerListSaveStatus = 'saved' | 'unavailable' | 'invalid-owner' | 'write-failed';
export type OwnerListClearStatus = 'cleared' | 'unavailable' | 'invalid-owner' | 'remove-failed';

/** Owner id supplied by the auth layer (stable Supabase user id). */
export interface AuthIdentity {
  id: string;
}

// Resolve the explicit storage owner from auth state. Returns null while auth
// is unresolved (never an anonymous assumption) or if a signed-in id is absent.
export function resolveListOwner(
  authResolved: boolean,
  authUser: AuthIdentity | null,
): StorageOwner | null {
  if (!authResolved) return null;
  if (authUser && authUser.id) {
    return { kind: 'user', userId: authUser.id };
  }
  return { kind: 'anonymous' };
}

export interface OwnerListConfig {
  /** Original legacy key (unscoped); also the base of every v2 key. */
  baseKey: string;
  /** Namespace version, e.g. "v2". */
  version: string;
  /** Max items persisted for this owner (mirrors legacy trim). 0 = no cap. */
  capacity?: number;
}

function resolveBrowserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function resolveStorage(storage?: StorageLike): StorageLike | null {
  return storage ?? resolveBrowserStorage();
}

function resolveOwner(owner: StorageOwner): StorageOwner | null {
  if (owner.kind === 'anonymous') return { kind: 'anonymous' };
  const userId = owner.userId.trim();
  if (userId.length === 0) return null;
  return { kind: 'user', userId };
}

function toUtf8Bytes(value: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value);
  }
  const bytes: number[] = [];
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x7f) {
      bytes.push(code);
    } else if (code <= 0x7ff) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
    } else {
      bytes.push(0xe0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    }
  }
  return Uint8Array.from(bytes);
}

function fnv1a32(input: Uint8Array, seed: number): number {
  let hash = seed >>> 0;
  for (const value of input) {
    hash ^= value;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function buildUserToken(userId: string): string {
  const normalized = userId.normalize('NFKC');
  const bytes = toUtf8Bytes(normalized);
  const h1 = fnv1a32(bytes, 0x811c9dc5);
  const h2 = fnv1a32(bytes, 0x9e3779b1);
  const len = normalized.length.toString(16).padStart(4, '0');
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}${len}`;
}

export function getOwnerKey(baseKey: string, version: string, owner: StorageOwner): string {
  const normalized = resolveOwner(owner);
  if (normalized === null || normalized.kind === 'anonymous') {
    return `${baseKey}:${version}:anonymous`;
  }
  return `${baseKey}:${version}:user:${buildUserToken(normalized.userId)}`;
}

function isListItem(value: unknown): value is StorageItem {
  if (typeof value !== 'object' || value === null) return false;
  return typeof (value as StorageItem).id === 'string';
}

type Parsed =
  | { status: 'ok'; items: StorageItem[] }
  | { status: 'invalid' | 'read-failed' | 'missing' };

function readItems(target: StorageLike, key: string): Parsed {
  let raw: string | null;
  try {
    raw = target.getItem(key);
  } catch {
    return { status: 'read-failed' };
  }
  if (raw === null) return { status: 'missing' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'invalid' };
  }
  if (!Array.isArray(parsed) || !parsed.every(isListItem)) {
    return { status: 'invalid' };
  }
  return { status: 'ok', items: parsed as StorageItem[] };
}

function trim(items: StorageItem[], capacity: number | undefined): StorageItem[] {
  if (!capacity || capacity <= 0) return items;
  return items.slice(0, capacity);
}

function removeTolerant(target: StorageLike, key: string): void {
  try {
    target.removeItem(key);
  } catch {
    // tolerated
  }
}

function migrateLegacyToAnonymous(
  target: StorageLike,
  config: OwnerListConfig,
): OwnerListLoadResult {
  const legacy = readItems(target, config.baseKey);
  if (legacy.status === 'missing') {
    return { status: 'missing', items: [] };
  }
  if (legacy.status !== 'ok') {
    // invalid legacy data is not migrated; clear only the stale legacy source
    removeTolerant(target, config.baseKey);
    return { status: 'missing', items: [] };
  }

  const anonymousKey = getOwnerKey(config.baseKey, config.version, { kind: 'anonymous' });
  const existing = readItems(target, anonymousKey);
  if (existing.status === 'ok') {
    // existing namespaced data wins; never overwrite it with legacy data
    return { status: 'missing', items: [] };
  }

  const items = trim(legacy.items, config.capacity);
  try {
    target.setItem(anonymousKey, JSON.stringify(items));
  } catch {
    // destination write failed: preserve legacy source untouched
    return { status: 'missing', items: [] };
  }

  // safe to remove legacy only after destination write succeeded
  removeTolerant(target, config.baseKey);
  return { status: 'loaded', items, migratedFromLegacy: true };
}

function loadForOwner(
  target: StorageLike,
  config: OwnerListConfig,
  owner: StorageOwner,
): OwnerListLoadResult {
  const ownerKey = getOwnerKey(config.baseKey, config.version, owner);
  const present = readItems(target, ownerKey);
  if (present.status === 'ok') {
    return { status: 'loaded', items: trim(present.items, config.capacity), migratedFromLegacy: false };
  }
  if (present.status === 'invalid') {
    removeTolerant(target, ownerKey);
    return { status: 'invalid-data', items: [] };
  }

  if (owner.kind !== 'anonymous') {
    // signed-in owner never inherits legacy data; legacy always belongs to anonymous
    return { status: 'missing', items: [] };
  }

  const migrated = migrateLegacyToAnonymous(target, config);
  if (migrated.status === 'loaded') return migrated;

  // migration may have written anonymous data (or refused); re-read the owner key
  const reread = readItems(target, ownerKey);
  if (reread.status === 'ok') {
    return { status: 'loaded', items: trim(reread.items, config.capacity), migratedFromLegacy: true };
  }
  if (reread.status === 'invalid') {
    removeTolerant(target, ownerKey);
    return { status: 'invalid-data', items: [] };
  }
  return { status: 'missing', items: [] };
}

export function loadOwnerList(
  owner: StorageOwner,
  config: OwnerListConfig,
  storage?: StorageLike,
): OwnerListLoadResult {
  const target = resolveStorage(storage);
  if (target === null) return { status: 'unavailable', items: [] };
  const normalized = resolveOwner(owner);
  if (normalized === null) return { status: 'unavailable', items: [] };
  return loadForOwner(target, config, normalized);
}

export function saveOwnerList(
  items: StorageItem[],
  owner: StorageOwner,
  config: OwnerListConfig,
  storage?: StorageLike,
): OwnerListSaveStatus {
  const target = resolveStorage(storage);
  if (target === null) return 'unavailable';
  const normalized = resolveOwner(owner);
  if (normalized === null) return 'invalid-owner';
  const key = getOwnerKey(config.baseKey, config.version, normalized);
  try {
    target.setItem(key, JSON.stringify(trim(items, config.capacity)));
  } catch {
    return 'write-failed';
  }
  return 'saved';
}

export function clearOwnerList(
  owner: StorageOwner,
  config: OwnerListConfig,
  storage?: StorageLike,
): OwnerListClearStatus {
  const target = resolveStorage(storage);
  if (target === null) return 'unavailable';
  const normalized = resolveOwner(owner);
  if (normalized === null) return 'invalid-owner';
  const key = getOwnerKey(config.baseKey, config.version, normalized);
  try {
    target.removeItem(key);
  } catch {
    return 'remove-failed';
  }
  return 'cleared';
}

export function ownerListKey(
  owner: StorageOwner,
  config: OwnerListConfig,
): string {
  return getOwnerKey(config.baseKey, config.version, owner);
}