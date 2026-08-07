// Account-scoped persistence for Reflections / Daily Prompts.
//
// Legacy single-key data (`cure-life-reflection-logs`, unknown owner) is
// migrated conservatively to the anonymous namespace and capped at 25 entries,
// mirroring the pre-Batch-13 trim-on-write behaviour.
import {
  loadOwnerList,
  saveOwnerList,
  clearOwnerList,
  ownerListKey,
  type OwnerListConfig,
  type StorageLike,
  type StorageItem,
  type StorageOwner,
  type OwnerListLoadResult,
  type OwnerListSaveStatus,
  type OwnerListClearStatus,
} from './ownerScopedStorage';

const REFLECTION_BASE_KEY = 'cure-life-reflection-logs';
const REFLECTION_NAMESPACE_VERSION = 'v2';
const REFLECTION_CAPACITY = 25;

export const REFLECTION_STORAGE_KEY = REFLECTION_BASE_KEY;

export const REFLECTION_STORAGE_CONFIG: OwnerListConfig = {
  baseKey: REFLECTION_BASE_KEY,
  version: REFLECTION_NAMESPACE_VERSION,
  capacity: REFLECTION_CAPACITY,
};

export function getReflectionOwnerKey(owner: StorageOwner): string {
  return ownerListKey(owner, REFLECTION_STORAGE_CONFIG);
}

export function loadReflectionLogs(
  owner: StorageOwner,
  storage?: StorageLike,
): OwnerListLoadResult {
  return loadOwnerList(owner, REFLECTION_STORAGE_CONFIG, storage);
}

export function saveReflectionLogs(
  items: StorageItem[],
  owner: StorageOwner,
  storage?: StorageLike,
): OwnerListSaveStatus {
  return saveOwnerList(items, owner, REFLECTION_STORAGE_CONFIG, storage);
}

export function clearReflectionLogs(
  owner: StorageOwner,
  storage?: StorageLike,
): OwnerListClearStatus {
  return clearOwnerList(owner, REFLECTION_STORAGE_CONFIG, storage);
}