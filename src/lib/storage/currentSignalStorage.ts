import {
  buildUserToken,
  type StorageOwner,
  type StorageLike,
} from './ownerScopedStorage';
import type { CurrentSignal, CreateCurrentSignalInput, CurrentSignalPatch } from '../../types/currentSignal';

const CURRENT_SIGNAL_BASE_KEY = 'bodysignal_current_signal';
const CURRENT_SIGNAL_STORAGE_VERSION = 'v1';

interface CurrentSignalStoragePayload {
  version: string;
  signal: CurrentSignal | null;
}

export function getCurrentSignalOwnerKey(owner: StorageOwner): string {
  const normalized = owner.kind === 'user' && owner.userId.trim().length > 0
    ? { kind: 'user' as const, userId: owner.userId.trim() }
    : { kind: 'anonymous' as const };
  if (normalized.kind === 'anonymous') {
    return `${CURRENT_SIGNAL_BASE_KEY}:${CURRENT_SIGNAL_STORAGE_VERSION}:anonymous`;
  }
  return `${CURRENT_SIGNAL_BASE_KEY}:${CURRENT_SIGNAL_STORAGE_VERSION}:user:${buildUserToken(normalized.userId)}`;
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

export function loadCurrentSignal(
  owner: StorageOwner | null,
  storage?: StorageLike,
): { status: 'loaded' | 'missing' | 'unavailable' | 'invalid-data'; signal: CurrentSignal | null } {
  if (!owner) {
    return { status: 'missing', signal: null };
  }
  const target = resolveStorage(storage);
  if (target === null) {
    return { status: 'unavailable', signal: null };
  }
  const key = getCurrentSignalOwnerKey(owner);
  let raw: string | null;
  try {
    raw = target.getItem(key);
  } catch {
    return { status: 'unavailable', signal: null };
  }
  if (raw === null) {
    return { status: 'missing', signal: null };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'invalid-data', signal: null };
  }
  if (!isValidPayload(parsed)) {
    return { status: 'invalid-data', signal: null };
  }
  return { status: 'loaded', signal: parsed.signal };
}

export function saveCurrentSignal(
  signal: CurrentSignal | null,
  owner: StorageOwner | null,
  storage?: StorageLike,
): 'saved' | 'unavailable' | 'invalid-owner' | 'write-failed' {
  if (!owner) {
    return 'invalid-owner';
  }
  const target = resolveStorage(storage);
  if (target === null) {
    return 'unavailable';
  }
  const key = getCurrentSignalOwnerKey(owner);
  const payload: CurrentSignalStoragePayload = {
    version: CURRENT_SIGNAL_STORAGE_VERSION,
    signal,
  };
  try {
    target.setItem(key, JSON.stringify(payload));
  } catch {
    return 'write-failed';
  }
  return 'saved';
}

export function clearCurrentSignal(
  owner: StorageOwner | null,
  storage?: StorageLike,
): 'cleared' | 'unavailable' | 'invalid-owner' | 'remove-failed' {
  if (!owner) {
    return 'invalid-owner';
  }
  const target = resolveStorage(storage);
  if (target === null) {
    return 'unavailable';
  }
  const key = getCurrentSignalOwnerKey(owner);
  try {
    target.removeItem(key);
  } catch {
    return 'remove-failed';
  }
  return 'cleared';
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isValidOptionalString(value: unknown): boolean {
  return value === undefined || isString(value);
}

function isValidOptionalNumber(value: unknown): boolean {
  return value === undefined || isNumber(value);
}

function isValidOptionalStringArray(value: unknown): boolean {
  return value === undefined || isStringArray(value);
}

function isValidSignal(value: unknown): value is CurrentSignal {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== 'string') return false;
  if (!['draft', 'active', 'saved'].includes(obj.status as string)) return false;
  if (typeof obj.createdAt !== 'string') return false;
  if (typeof obj.updatedAt !== 'string') return false;
  if (typeof obj.symptomText !== 'string') return false;
  if (!isValidOptionalString(obj.ailmentId)) return false;
  if (!isValidOptionalString(obj.ailmentTitle)) return false;
  if (!isValidOptionalString(obj.bodyRegion)) return false;
  if (!isValidOptionalString(obj.bodySide)) return false;
  if (!isValidOptionalString(obj.bodyLocationDetail)) return false;
  if (!isValidOptionalNumber(obj.intensity)) return false;
  const intensity = obj.intensity as number | undefined;
  if (intensity !== undefined && (intensity < 1 || intensity > 10)) return false;
  if (!isValidOptionalString(obj.duration)) return false;
  if (!isValidOptionalString(obj.onset)) return false;
  if (!isValidOptionalString(obj.userNotes)) return false;
  if (obj.medicalSafetyStatus !== undefined && !['none', 'monitor', 'urgent'].includes(obj.medicalSafetyStatus as string)) return false;
  if (!isValidOptionalStringArray(obj.redFlags)) return false;
  if (!isValidOptionalString(obj.uncertaintyNote)) return false;
  if (!isValidOptionalStringArray(obj.selectedLenses)) return false;
  if (!isValidOptionalString(obj.reflectionReference)) return false;
  if (!isValidOptionalString(obj.aiAnalysisReference)) return false;
  if (!isValidOptionalString(obj.journalSaveReference)) return false;
  return true;
}

function isValidPayload(value: unknown): value is CurrentSignalStoragePayload {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  if (obj.version !== CURRENT_SIGNAL_STORAGE_VERSION) return false;
  if (obj.signal !== null && !isValidSignal(obj.signal)) return false;
  return true;
}

export function createDefaultSignal(input: CreateCurrentSignalInput = {}): CurrentSignal {
  const now = new Date().toISOString();
  return {
    id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    symptomText: input.symptomText ?? '',
    ailmentId: input.ailmentId,
    ailmentTitle: input.ailmentTitle,
    bodyRegion: input.bodyRegion,
    bodySide: input.bodySide,
    bodyLocationDetail: input.bodyLocationDetail,
    intensity: input.intensity,
    duration: input.duration,
    onset: input.onset,
    userNotes: input.userNotes,
    medicalSafetyStatus: input.medicalSafetyStatus,
    redFlags: input.redFlags,
    uncertaintyNote: input.uncertaintyNote,
    selectedLenses: input.selectedLenses,
    reflectionReference: input.reflectionReference,
    aiAnalysisReference: input.aiAnalysisReference,
    journalSaveReference: input.journalSaveReference,
  };
}

export function patchCurrentSignal(signal: CurrentSignal, patch: CurrentSignalPatch): CurrentSignal {
  return {
    ...signal,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}
