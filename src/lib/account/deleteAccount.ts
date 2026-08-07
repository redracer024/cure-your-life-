import {
  clearAssessmentSession,
  type AssessmentStorageOwner,
  type AssessmentSessionClearResult,
} from '../quiz/assessmentSessionStorage';
import { clearJournalEntries } from '../storage/journalStorage';
import { clearReflectionLogs } from '../storage/reflectionStorage';
import type { OwnerListClearStatus, StorageOwner } from '../storage/ownerScopedStorage';

export type DeleteAccountResult =
  | {
      status: 'deleted';
      cleanupWarning: boolean;
      signedOut: boolean;
    }
  | {
      status: 'network-error' | 'server-error';
      cleanupWarning: false;
      signedOut: false;
      httpStatus?: number;
    };

export interface DeleteAccountDependencies {
  requestDelete: () => Promise<Response>;
  clearAssessment: (owner: AssessmentStorageOwner) => AssessmentSessionClearResult;
  clearJournal: (owner: StorageOwner) => OwnerListClearStatus;
  clearReflection: (owner: StorageOwner) => OwnerListClearStatus;
  signOut: () => Promise<void>;
  getCurrentUserId: () => string | null;
}

const defaultDependencies: DeleteAccountDependencies = {
  requestDelete: async () => {
    throw new Error('requestDelete dependency is required');
  },
  clearAssessment: clearAssessmentSession,
  clearJournal: clearJournalEntries,
  clearReflection: clearReflectionLogs,
  signOut: async () => {},
  getCurrentUserId: () => null,
};

export async function deleteCurrentAccount(
  userId: string,
  depsOverride: Partial<DeleteAccountDependencies> = {},
): Promise<DeleteAccountResult> {
  const verifiedUserId = userId.trim();
  if (!verifiedUserId) {
    return {
      status: 'server-error',
      cleanupWarning: false,
      signedOut: false,
    };
  }

  const deps = {
    ...defaultDependencies,
    ...depsOverride,
  };

  const deletedStorageOwner: StorageOwner = {
    kind: 'user',
    userId: verifiedUserId,
  };
  const deletedAssessmentOwner: AssessmentStorageOwner = {
    kind: 'user',
    userId: verifiedUserId,
  };

  let response: Response;
  try {
    response = await deps.requestDelete();
  } catch {
    return {
      status: 'network-error',
      cleanupWarning: false,
      signedOut: false,
    };
  }

  if (!response.ok) {
    return {
      status: 'server-error',
      cleanupWarning: false,
      signedOut: false,
      httpStatus: response.status,
    };
  }

  let cleanupWarning = false;

  try {
    const assessmentStatus = deps.clearAssessment(deletedAssessmentOwner).status;
    if (assessmentStatus !== 'cleared') {
      cleanupWarning = true;
    }
  } catch {
    cleanupWarning = true;
  }

  try {
    const journalStatus = deps.clearJournal(deletedStorageOwner);
    if (journalStatus !== 'cleared') {
      cleanupWarning = true;
    }
  } catch {
    cleanupWarning = true;
  }

  try {
    const reflectionStatus = deps.clearReflection(deletedStorageOwner);
    if (reflectionStatus !== 'cleared') {
      cleanupWarning = true;
    }
  } catch {
    cleanupWarning = true;
  }

  let signedOut = false;
  const activeUserId = deps.getCurrentUserId();
  if (!activeUserId || activeUserId === verifiedUserId) {
    try {
      await deps.signOut();
      signedOut = true;
    } catch {
      cleanupWarning = true;
    }
  }

  return {
    status: 'deleted',
    cleanupWarning,
    signedOut,
  };
}
