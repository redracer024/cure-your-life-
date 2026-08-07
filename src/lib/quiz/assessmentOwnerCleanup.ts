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

export function clearAssessmentOwnerData(
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

export function hasAssessmentOwnerData(
  owner: AssessmentStorageOwner,
  storage?: AssessmentSessionStorageLike,
): boolean {
  const target = resolveStorage(storage);
  if (target === null) return false;

  const normalizedOwner = resolveOwner(owner);
  if (normalizedOwner === null) return false;

  const ownerKey = getAssessmentSessionStorageKey(normalizedOwner);

  try {
    return target.getItem(ownerKey) !== null;
  } catch {
    return false;
  }
}
