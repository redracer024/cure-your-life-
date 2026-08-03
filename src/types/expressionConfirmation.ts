/*
 * Expression Confirmation Types
 *
 * Confirmation is the third stage of the expression assessment pipeline.
 * After individual Expression screening selects candidates, each candidate
 * receives one broader recurrence item. A candidate is confirmed only when
 * its confirmation response is 4 ("Often") or 5 ("Almost always").
 *
 * Confirmation never diagnoses, never asks whether an internal label fits,
 * never establishes causes, and never expands the screened candidate set.
 */

import type { ExpressionId } from './quiz';

export type ExpressionConfirmationMode = 'free' | 'pro';

export type ExpressionConfirmationResponse = 1 | 2 | 3 | 4 | 5;

export interface ExpressionConfirmationResponseEntry {
  itemId: string;
  selectedValue: ExpressionConfirmationResponse;
}

export type ExpressionConfirmationStatus =
  | 'confirmed'
  | 'not-confirmed'
  | 'unresolved';

export type ExpressionConfirmationExclusionReason =
  | 'below-confirmation-threshold'
  | 'unresolved-after-retry'
  | 'not-screened-candidate'
  | 'excluded-by-group-cap'
  | 'excluded-by-total-cap';

export interface ExpressionConfirmationItem {
  id: string;
  expressionId: ExpressionId;
  groupId: string;
  itemNumber: 1;
  prompt: string;
  access: 'pro';
  reverseScored: false;
}

export interface ExpressionConfirmationAttempt {
  attemptNumber: 1 | 2;
  response: ExpressionConfirmationResponse | null;
  skipped: boolean;
}

export interface ExpressionConfirmationTrace {
  configVersion: string;
  mode: ExpressionConfirmationMode;
  candidateExpressionId: string;
  groupId: string;
  parentId: string;
  parentType: 'core' | 'strategy';
  canonicalRegistryOrder: number;
  screeningRawScore: number;
  screeningNormalizedScore: number;
  screeningAnsweredCount: number;
  confirmationItemId: string | null;
  attempts: readonly ExpressionConfirmationAttempt[];
  retryCount: number;
  finalResponse: ExpressionConfirmationResponse | null;
  confirmationScore: number | null;
  status: ExpressionConfirmationStatus;
  exclusionReason: ExpressionConfirmationExclusionReason | null;
  confirmationRank: number | null;
  finalRank: number | null;
  includedInResult: boolean;
  deterministicDecisionMessages: readonly string[];
}

export interface ExpressionConfirmationResultEntry {
  expressionId: ExpressionId;
  groupId: string;
  parentId: string;
  parentType: 'core' | 'strategy';
  confirmationScore: number;
  screeningRawScore: number;
  screeningNormalizedScore: number;
  canonicalRegistryOrder: number;
  rank: number;
}

export type ExpressionConfirmationCompletionState =
  | 'complete'
  | 'partial'
  | 'not-started';

export type ExpressionConfirmationResultCategory =
  | 'confirmed'
  | 'no-clear-expression'
  | 'expression-not-assessed'
  | 'insufficient-evidence';

export type ExpressionConfirmationNavigationTarget =
  | { type: 'strategy'; id: string }
  | { type: 'core'; id: string }
  | null;

export interface ExpressionConfirmationResult {
  confirmedExpressions: readonly ExpressionConfirmationResultEntry[];
  rejectedExpressionIds: readonly string[];
  unresolvedExpressionIds: readonly string[];
  traces: readonly ExpressionConfirmationTrace[];
  totalCandidates: number;
  totalConfirmed: number;
  totalRejected: number;
  totalUnresolved: number;
  completionState: ExpressionConfirmationCompletionState;
  resultCategory: ExpressionConfirmationResultCategory;
  navigationTarget: ExpressionConfirmationNavigationTarget;
}

export interface ExpressionConfirmationReadiness {
  itemsDefined: boolean;
  allExpressionsHaveOneItem: boolean;
  totalItemCount: number;
  allItemsPro: boolean;
  noReverseScored: boolean;
  everyItemMapsToValidExpression: boolean;
  everyItemMapsToValidGroup: boolean;
  everyExpressionToGroupMappingValid: boolean;
  itemNumbersCorrect: boolean;
  itemIdsUnique: boolean;
  allPromptsNonEmpty: boolean;
  allItemIdsUseCanonicalPrefix: boolean;
  scoringFunctionsExist: boolean;
  selectionFunctionsExist: boolean;
  retryHandlingExists: boolean;
  serializableTraceExists: boolean;
  validationSuitePasses: boolean;
  ready: boolean;
  missingRequirements: readonly string[];
}
