// Account-scoped persistence for the Somatic Journal.
//
// Legacy single-key data (`somatic_journal_logs`, unknown owner) is migrated
// conservatively to the anonymous namespace. Signed-in users never inherit
// legacy data, matching the assessment storage owner model.
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

const JOURNAL_BASE_KEY = 'somatic_journal_logs';
const JOURNAL_NAMESPACE_VERSION = 'v2';

export const JOURNAL_STORAGE_KEY = JOURNAL_BASE_KEY;

export const JOURNAL_STORAGE_CONFIG: OwnerListConfig = {
  baseKey: JOURNAL_BASE_KEY,
  version: JOURNAL_NAMESPACE_VERSION,
};

export function getJournalOwnerKey(owner: StorageOwner): string {
  return ownerListKey(owner, JOURNAL_STORAGE_CONFIG);
}

export function loadJournalEntries(
  owner: StorageOwner,
  storage?: StorageLike,
): OwnerListLoadResult {
  return loadOwnerList(owner, JOURNAL_STORAGE_CONFIG, storage);
}

export function saveJournalEntries(
  items: StorageItem[],
  owner: StorageOwner,
  storage?: StorageLike,
): OwnerListSaveStatus {
  return saveOwnerList(items, owner, JOURNAL_STORAGE_CONFIG, storage);
}

export function clearJournalEntries(
  owner: StorageOwner,
  storage?: StorageLike,
): OwnerListClearStatus {
  return clearOwnerList(owner, JOURNAL_STORAGE_CONFIG, storage);
}