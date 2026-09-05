// Owner-scoped persistence for the generic Ailment Reflection worksheet.
//
// One structured record per ailment contains a map of stable prompt ids to
// answers, so a 40-question symptom is a single reflection set rather than 40
// separate journal rows. Mirrors the owner-scoped storage contract used by the
// somatic journal and daily reflections (no email/name leak, per-owner keys).
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

const BASE_KEY = 'bodysignal-ailment-reflections';
const NAMESPACE_VERSION = 'v1';
const CAPACITY = 200;

export const AILMENT_REFLECTION_STORAGE_CONFIG: OwnerListConfig = {
  baseKey: BASE_KEY,
  version: NAMESPACE_VERSION,
  capacity: CAPACITY,
};

export function getAilmentReflectionOwnerKey(owner: StorageOwner): string {
  return ownerListKey(owner, AILMENT_REFLECTION_STORAGE_CONFIG);
}

export function loadAilmentReflections(
  owner: StorageOwner,
  storage?: StorageLike,
): OwnerListLoadResult {
  return loadOwnerList(owner, AILMENT_REFLECTION_STORAGE_CONFIG, storage);
}

export function saveAilmentReflections(
  items: StorageItem[],
  owner: StorageOwner,
  storage?: StorageLike,
): OwnerListSaveStatus {
  return saveOwnerList(items, owner, AILMENT_REFLECTION_STORAGE_CONFIG, storage);
}

export function clearAilmentReflections(
  owner: StorageOwner,
  storage?: StorageLike,
): OwnerListClearStatus {
  return clearOwnerList(owner, AILMENT_REFLECTION_STORAGE_CONFIG, storage);
}
