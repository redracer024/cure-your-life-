import {
  ASSESSMENT_SESSION_VERSION,
  serializeAssessmentSession,
  deserializeAssessmentSession,
} from './assessmentSession';
import type { AssessmentSession } from '../../types/assessmentSession';

export const ASSESSMENT_SESSION_STORAGE_KEY = 'cure-life-assessment-session';

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

export function saveAssessmentSession(
  session: AssessmentSession,
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

  try {
    target.setItem(ASSESSMENT_SESSION_STORAGE_KEY, serialized);
  } catch {
    return { status: 'write-failed' };
  }

  return { status: 'saved' };
}

export function loadAssessmentSession(
  storage?: AssessmentSessionStorageLike,
): AssessmentSessionLoadResult {
  const target = resolveStorage(storage);
  if (target === null) return { status: 'unavailable', session: null };

  let raw: string | null;
  try {
    raw = target.getItem(ASSESSMENT_SESSION_STORAGE_KEY);
  } catch {
    return { status: 'read-failed', session: null };
  }

  if (raw === null) return { status: 'missing', session: null };

  const session = deserializeAssessmentSession(raw);
  if (session === null) {
    try {
      target.removeItem(ASSESSMENT_SESSION_STORAGE_KEY);
    } catch {
      // cleanup failure is ignored
    }
    return { status: 'invalid-session', session: null };
  }

  return { status: 'loaded', session };
}

export function clearAssessmentSession(
  storage?: AssessmentSessionStorageLike,
): AssessmentSessionClearResult {
  const target = resolveStorage(storage);
  if (target === null) return { status: 'unavailable' };

  try {
    target.removeItem(ASSESSMENT_SESSION_STORAGE_KEY);
  } catch {
    return { status: 'remove-failed' };
  }

  return { status: 'cleared' };
}

export function hasSavedAssessmentSession(
  storage?: AssessmentSessionStorageLike,
): boolean {
  try {
    return loadAssessmentSession(storage).status === 'loaded';
  } catch {
    return false;
  }
}
