import {
  ASSESSMENT_SESSION_VERSION,
  serializeAssessmentSession,
  deserializeAssessmentSession,
} from './assessmentSession';
import type { AssessmentSession } from '../../types/assessmentSession';

export const ASSESSMENT_SESSION_STORAGE_KEY = 'cure-life-assessment-session';
export const ASSESSMENT_SESSION_STORAGE_NAMESPACE_VERSION = 'v2';

export type AssessmentStorageOwner =
  | { kind: 'anonymous' }
  | { kind: 'user'; userId: string };

export interface AssessmentSessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type AssessmentSessionSaveStatus =
  | 'saved'
  | 'unavailable'
  | 'invalid-session'
  | 'serialization-failed'
  | 'write-failed';

export interface AssessmentSessionSaveResult {
  status: AssessmentSessionSaveStatus;
}

export type AssessmentSessionLoadStatus =
  | 'loaded'
  | 'missing'
  | 'unavailable'
  | 'invalid-session'
  | 'read-failed';

export type AssessmentSessionLoadResult =
  | {
      status: 'loaded';
      session: AssessmentSession;
    }
  | {
      status: 'missing' | 'unavailable' | 'invalid-session' | 'read-failed';
      session: null;
    };

export type AssessmentSessionClearStatus =
  | 'cleared'
  | 'unavailable'
  | 'remove-failed';

export interface AssessmentSessionClearResult {
  status: AssessmentSessionClearStatus;
}

type KeyedLoadStatus = 'loaded' | 'missing' | 'invalid-session' | 'read-failed';

type KeyedLoadResult =
  | { status: 'loaded'; session: AssessmentSession; raw: string }
  | { status: 'missing' | 'invalid-session' | 'read-failed'; session: null; raw: null };

type LegacyMigrationStatus = 'none' | 'loaded' | 'invalid-session' | 'read-failed';

interface LegacyMigrationResult {
  status: LegacyMigrationStatus;
  session: AssessmentSession | null;
}

function resolveBrowserStorage(): AssessmentSessionStorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function resolveStorage(
  storage?: AssessmentSessionStorageLike,
): AssessmentSessionStorageLike | null {
  return storage ?? resolveBrowserStorage();
}

function resolveOwner(owner: AssessmentStorageOwner): AssessmentStorageOwner | null {
  if (owner.kind === 'anonymous') return owner;
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
      continue;
    }
    if (code <= 0x7ff) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
      continue;
    }
    bytes.push(0xe0 | (code >> 12));
    bytes.push(0x80 | ((code >> 6) & 0x3f));
    bytes.push(0x80 | (code & 0x3f));
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

function buildUserNamespaceToken(userId: string): string {
  const normalized = userId.normalize('NFKC');
  const bytes = toUtf8Bytes(normalized);
  const h1 = fnv1a32(bytes, 0x811c9dc5);
  const h2 = fnv1a32(bytes, 0x9e3779b1);
  const len = normalized.length.toString(16).padStart(4, '0');
  return `${h1.toString(16).padStart(8, '0')}${h2
    .toString(16)
    .padStart(8, '0')}${len}`;
}

export function getAssessmentSessionStorageKey(owner: AssessmentStorageOwner): string {
  const normalizedOwner = resolveOwner(owner);
  if (normalizedOwner === null) {
    return `${ASSESSMENT_SESSION_STORAGE_KEY}:${ASSESSMENT_SESSION_STORAGE_NAMESPACE_VERSION}:anonymous`;
  }
  if (normalizedOwner.kind === 'anonymous') {
    return `${ASSESSMENT_SESSION_STORAGE_KEY}:${ASSESSMENT_SESSION_STORAGE_NAMESPACE_VERSION}:anonymous`;
  }
  return `${ASSESSMENT_SESSION_STORAGE_KEY}:${ASSESSMENT_SESSION_STORAGE_NAMESPACE_VERSION}:user:${buildUserNamespaceToken(
    normalizedOwner.userId,
  )}`;
}

function readKeyedSession(
  target: AssessmentSessionStorageLike,
  key: string,
  cleanupInvalid: boolean,
): KeyedLoadResult {
  let raw: string | null;
  try {
    raw = target.getItem(key);
  } catch {
    return { status: 'read-failed', session: null, raw: null };
  }

  if (raw === null) return { status: 'missing', session: null, raw: null };

  const session = deserializeAssessmentSession(raw);
  if (session === null) {
    if (cleanupInvalid) {
      try {
        target.removeItem(key);
      } catch {
        // cleanup failure is ignored
      }
    }
    return { status: 'invalid-session', session: null, raw: null };
  }

  return { status: 'loaded', session, raw };
}

function migrateLegacyToAnonymousIfNeeded(
  target: AssessmentSessionStorageLike,
): LegacyMigrationResult {
  const legacyResult = readKeyedSession(target, ASSESSMENT_SESSION_STORAGE_KEY, true);
  if (legacyResult.status === 'missing') {
    return { status: 'none', session: null };
  }
  if (legacyResult.status === 'read-failed') {
    return { status: 'read-failed', session: null };
  }
  if (legacyResult.status === 'invalid-session') {
    return { status: 'invalid-session', session: null };
  }

  const anonymousKey = getAssessmentSessionStorageKey({ kind: 'anonymous' });
  let existingAnonymousRaw: string | null;
  try {
    existingAnonymousRaw = target.getItem(anonymousKey);
  } catch {
    return { status: 'read-failed', session: null };
  }

  if (existingAnonymousRaw !== null) {
    return { status: 'none', session: null };
  }

  try {
    target.setItem(anonymousKey, legacyResult.raw);
  } catch {
    return { status: 'loaded', session: legacyResult.session };
  }

  try {
    target.removeItem(ASSESSMENT_SESSION_STORAGE_KEY);
  } catch {
    // Removal failure is tolerated. Existing namespaced state now wins and
    // migration will not overwrite it on later loads.
  }

  return { status: 'loaded', session: legacyResult.session };
}

export function saveAssessmentSession(
  session: AssessmentSession,
  owner: AssessmentStorageOwner,
  storage?: AssessmentSessionStorageLike,
): AssessmentSessionSaveResult {
  let serialized: string;
  try {
    serialized = serializeAssessmentSession(session);
  } catch {
    return { status: 'serialization-failed' };
  }

  const validated = deserializeAssessmentSession(serialized);
  if (validated === null || validated.sessionVersion !== ASSESSMENT_SESSION_VERSION) {
    return { status: 'invalid-session' };
  }

  const target = resolveStorage(storage);
  if (target === null) return { status: 'unavailable' };

  const normalizedOwner = resolveOwner(owner);
  if (normalizedOwner === null) return { status: 'unavailable' };

  const ownerKey = getAssessmentSessionStorageKey(normalizedOwner);

  try {
    target.setItem(ownerKey, serialized);
  } catch {
    return { status: 'write-failed' };
  }

  return { status: 'saved' };
}

export function loadAssessmentSession(
  owner: AssessmentStorageOwner,
  storage?: AssessmentSessionStorageLike,
): AssessmentSessionLoadResult {
  const target = resolveStorage(storage);
  if (target === null) return { status: 'unavailable', session: null };

  const normalizedOwner = resolveOwner(owner);
  if (normalizedOwner === null) return { status: 'unavailable', session: null };

  const ownerKey = getAssessmentSessionStorageKey(normalizedOwner);
  const ownerLoad = readKeyedSession(target, ownerKey, true);
  if (ownerLoad.status === 'loaded') {
    return { status: 'loaded', session: ownerLoad.session };
  }
  if (ownerLoad.status === 'invalid-session') {
    return { status: 'invalid-session', session: null };
  }
  if (ownerLoad.status === 'read-failed') {
    return { status: 'read-failed', session: null };
  }

  const migration = migrateLegacyToAnonymousIfNeeded(target);
  if (migration.status === 'read-failed') {
    return { status: 'read-failed', session: null };
  }
  if (migration.status === 'invalid-session') {
    if (normalizedOwner.kind === 'anonymous') {
      return { status: 'invalid-session', session: null };
    }
    return { status: 'missing', session: null };
  }

  if (normalizedOwner.kind === 'anonymous' && migration.status === 'loaded' && migration.session) {
    return { status: 'loaded', session: migration.session };
  }

  if (normalizedOwner.kind === 'anonymous') {
    const migratedLoad = readKeyedSession(target, ownerKey, true);
    if (migratedLoad.status === 'loaded') {
      return { status: 'loaded', session: migratedLoad.session };
    }
    if (migratedLoad.status === 'invalid-session') {
      return { status: 'invalid-session', session: null };
    }
    if (migratedLoad.status === 'read-failed') {
      return { status: 'read-failed', session: null };
    }
  }

  return { status: 'missing', session: null };
}

export function clearAssessmentSession(
  owner: AssessmentStorageOwner,
  storage?: AssessmentSessionStorageLike,
): AssessmentSessionClearResult {
  const target = resolveStorage(storage);
  if (target === null) return { status: 'unavailable' };

  const normalizedOwner = resolveOwner(owner);
  if (normalizedOwner === null) return { status: 'unavailable' };

  const ownerKey = getAssessmentSessionStorageKey(normalizedOwner);

  try {
    target.removeItem(ownerKey);
  } catch {
    return { status: 'remove-failed' };
  }

  return { status: 'cleared' };
}

export function hasSavedAssessmentSession(
  owner: AssessmentStorageOwner,
  storage?: AssessmentSessionStorageLike,
): boolean {
  try {
    return loadAssessmentSession(owner, storage).status === 'loaded';
  } catch {
    return false;
  }
}
