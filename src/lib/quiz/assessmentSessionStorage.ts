import {
  ASSESSMENT_SESSION_VERSION,
  serializeAssessmentSession,
  deserializeAssessmentSession,
} from './assessmentSession';
import type { AssessmentSession } from '../../types/assessmentSession';
import {
  ASSESSMENT_SESSION_STORAGE_KEY,
  ASSESSMENT_SESSION_STORAGE_NAMESPACE_VERSION,
  type AssessmentStorageOwner,
  type AssessmentSessionStorageLike,
  type AssessmentSessionClearStatus,
  type AssessmentSessionClearResult,
  getAssessmentSessionStorageKey,
  clearAssessmentOwnerData,
  hasAssessmentOwnerData,
} from './assessmentOwnerCleanup';

export {
  ASSESSMENT_SESSION_STORAGE_KEY,
  ASSESSMENT_SESSION_STORAGE_NAMESPACE_VERSION,
  getAssessmentSessionStorageKey,
};
export type {
  AssessmentStorageOwner,
  AssessmentSessionStorageLike,
  AssessmentSessionClearStatus,
  AssessmentSessionClearResult,
};

export const ASSESSMENT_IN_PROGRESS_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

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
      expiry?: 'expired-removed' | 'expired-remove-failed';
    };

type KeyedLoadStatus = 'loaded' | 'missing' | 'invalid-session' | 'read-failed';

type KeyedLoadResult =
  | { status: 'loaded'; session: AssessmentSession; raw: string }
  | { status: 'missing' | 'invalid-session' | 'read-failed'; session: null; raw: null };

type LegacyMigrationStatus = 'none' | 'loaded' | 'invalid-session' | 'read-failed';

interface LegacyMigrationResult {
  status: LegacyMigrationStatus;
  session: AssessmentSession | null;
}

export type AssessmentSessionExpiryState =
  | 'valid'
  | 'expired'
  | 'completed'
  | 'invalid-timestamp';

export function getAssessmentSessionExpiryState(
  session: AssessmentSession,
  nowMs: number,
): AssessmentSessionExpiryState {
  if (session.completionState === 'complete') {
    return 'completed';
  }

  const updatedAtMs = Date.parse(session.updatedAt);
  if (!Number.isFinite(updatedAtMs)) {
    return 'invalid-timestamp';
  }

  if (nowMs - updatedAtMs > ASSESSMENT_IN_PROGRESS_EXPIRY_MS) {
    return 'expired';
  }

  return 'valid';
}

function handleLoadedSessionExpiry(
  target: AssessmentSessionStorageLike,
  ownerKey: string,
  session: AssessmentSession,
  nowMs: number,
): AssessmentSessionLoadResult {
  const expiryState = getAssessmentSessionExpiryState(session, nowMs);

  if (expiryState === 'valid' || expiryState === 'completed') {
    return { status: 'loaded', session };
  }

  try {
    target.removeItem(ownerKey);
  } catch {
    if (expiryState === 'expired') {
      return { status: 'missing', session: null, expiry: 'expired-remove-failed' };
    }
    return { status: 'invalid-session', session: null };
  }

  if (expiryState === 'expired') {
    return { status: 'missing', session: null, expiry: 'expired-removed' };
  }

  return { status: 'invalid-session', session: null };
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
  }

  return { status: 'loaded', session: legacyResult.session };
}

function resolveStorage(storage?: AssessmentSessionStorageLike): AssessmentSessionStorageLike | null {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function resolveOwner(owner: AssessmentStorageOwner): AssessmentStorageOwner | null {
  if (owner.kind === 'anonymous') return owner;
  const userId = owner.userId.trim();
  if (userId.length === 0) return null;
  return { kind: 'user', userId };
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
  nowMs: number = Date.now(),
): AssessmentSessionLoadResult {
  const target = resolveStorage(storage);
  if (target === null) return { status: 'unavailable', session: null };

  const normalizedOwner = resolveOwner(owner);
  if (normalizedOwner === null) return { status: 'unavailable', session: null };

  const ownerKey = getAssessmentSessionStorageKey(normalizedOwner);
  const ownerLoad = readKeyedSession(target, ownerKey, true);
  if (ownerLoad.status === 'loaded') {
    return handleLoadedSessionExpiry(target, ownerKey, ownerLoad.session, nowMs);
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
    return handleLoadedSessionExpiry(target, ownerKey, migration.session, nowMs);
  }

  if (normalizedOwner.kind === 'anonymous') {
    const migratedLoad = readKeyedSession(target, ownerKey, true);
    if (migratedLoad.status === 'loaded') {
      return handleLoadedSessionExpiry(target, ownerKey, migratedLoad.session, nowMs);
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
  return clearAssessmentOwnerData(owner, storage);
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
