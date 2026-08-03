import type { ExpressionId } from './quiz';

export type ExpressionScreeningMode = 'free' | 'pro';

export interface ExpressionScreeningItemDefinition {
  id: string;
  expressionId: ExpressionId;
  groupId: string;
  itemNumber: 1 | 2;
  prompt: string;
  access: 'pro';
  reverseScored: false;
}

export interface ExpressionScreeningResponse {
  itemId: string;
  selectedValue: number;
}

export interface ExpressionDirectScreeningScore {
  expressionId: ExpressionId;
  groupId: string;
  rawDirectScore: number;
  answeredCount: number;
  normalizedDirectScore: number | null;
  complete: boolean;
  qualifies: boolean;
  missingItemIds: readonly string[];
  incompleteReason: string | null;
}

export interface ExpressionScreeningGroupSelection {
  expressionId: ExpressionId;
  groupId: string;
  normalizedDirectScore: number;
  rawDirectScore: number;
  answeredCount: number;
  groupOrder: number;
  expressionOrder: number;
  isLeader: boolean;
}

export type ExpressionScreeningCategory =
  | 'expression-candidates-selected'
  | 'one-expression-candidate'
  | 'no-clear-expression'
  | 'insufficient-expression-evidence'
  | 'no-advancing-expression-group'
  | 'expression-not-assessed';

export interface ExpressionScreeningResult {
  category: ExpressionScreeningCategory;
  selectedCandidates: readonly ExpressionScreeningGroupSelection[];
  trace: ExpressionScreeningTrace;
}

export interface ExpressionScreeningReadiness {
  itemsDefined: boolean;
  allExpressionsHaveTwoItems: boolean;
  totalItemCount: number;
  allItemsPro: boolean;
  noReverseScored: boolean;
  everyItemMapsToValidExpression: boolean;
  everyItemMapsToValidGroup: boolean;
  itemNumbersCorrect: boolean;
  allPromptsNonEmpty: boolean;
  scoringFunctionsExist: boolean;
  selectionFunctionsExist: boolean;
  retryHandlingExists: boolean;
  serializableTraceExists: boolean;
  validationSuitePasses: boolean;
  ready: boolean;
  missingRequirements: readonly string[];
}

export interface PerGroupRankingEntry {
  groupId: string;
  rankedExpressionIds: readonly string[];
  leaderExpressionId: string | null;
  secondaryExpressionId: string | null;
  closeBandDecision: string;
}

export interface ExpressionScreeningTrace {
  configVersion: string;
  mode: ExpressionScreeningMode;
  advancingGroupIds: readonly string[];
  invalidAdvancingGroupIds: readonly string[];
  eligibleExpressionIdsByGroup: Readonly<Record<string, readonly string[]>>;
  duplicateExpressionIdsPrevented: readonly string[];
  screeningItemIdsByExpression: Readonly<Record<string, readonly string[]>>;
  duplicateItemIdsPrevented: readonly string[];
  missingItemMappings: readonly string[];
  responses: readonly { itemId: string; selectedValue: number }[];
  initiallySkippedItemIds: readonly string[];
  retryableSkippedItemIds: readonly string[];
  retriedItemIds: readonly string[];
  answeredAfterRetryItemIds: readonly string[];
  stillSkippedAfterRetryItemIds: readonly string[];
  rawDirectScores: Readonly<Record<string, number>>;
  normalizedDirectScores: Readonly<Record<string, number | null>>;
  answeredCounts: Readonly<Record<string, number>>;
  incompleteExpressions: readonly string[];
  incompleteExpressionReasons: readonly string[];
  qualifyingExpressions: readonly string[];
  rejectedExpressions: readonly string[];
  rejectedExpressionReasons: readonly string[];
  perGroupRankings: readonly PerGroupRankingEntry[];
  reservedLeaders: readonly { groupId: string; expressionId: string }[];
  eligibleSecondaryCandidates: readonly { groupId: string; expressionId: string }[];
  rankedSecondaryCandidates: readonly { groupId: string; expressionId: string }[];
  totalCapDecisions: readonly string[];
  duplicatePreventionDecisions: readonly string[];
  capacityDecisions: readonly string[];
  finalCandidateIds: readonly string[];
  finalCategory: ExpressionScreeningCategory;
  finalReason: string;
  deterministicDecisionMessages: readonly string[];
}
