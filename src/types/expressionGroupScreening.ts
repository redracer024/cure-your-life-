import type { CorePatternId, StrategyPatternId } from './quiz';

export type ExpressionGroupScreeningMode = 'free' | 'pro';

export interface ExpressionGroupItemResponse {
  itemId: string;
  selectedValue: number;
}

export interface ExpressionParentBranch {
  parentId: CorePatternId | StrategyPatternId;
  parentType: 'core' | 'strategy';
  normalizedDirectScore: number;
  answeredItemCount: number;
}

export interface ExpressionGroupItemDefinition {
  id: string;
  groupId: string;
  itemNumber: 1 | 2;
  prompt: string;
  access: 'pro';
  reverseScored: false;
}

export interface ExpressionGroupDirectScore {
  groupId: string;
  rawDirectScore: number;
  answeredCount: number;
  normalizedDirectScore: number | null;
}

export interface ExpressionGroupEligibilityResult {
  parentId: string;
  eligible: boolean;
  reason: string;
  normalizedDirectScore: number;
  answeredItemCount: number;
}

export interface ExpressionGroupSelection {
  groupId: string;
  parentId: string;
  parentType: 'core' | 'strategy';
  normalizedDirectScore: number;
  rawDirectScore: number;
  answeredCount: number;
  groupOrder: number;
  isLeader: boolean;
}

export type ExpressionGroupRoutingCategory =
  | 'groups-selected'
  | 'one-group-selected'
  | 'no-clear-group'
  | 'insufficient-group-evidence'
  | 'no-eligible-expression-parent'
  | 'expression-not-assessed';

export interface ExpressionGroupRoutingResult {
  category: ExpressionGroupRoutingCategory;
  selectedGroups: readonly ExpressionGroupSelection[];
  screeningItemIds: readonly string[];
  trace: ExpressionGroupRoutingTrace;
}

export interface ExpressionGroupScreeningReadiness {
  itemsDefined: boolean;
  allGroupsHaveTwoItems: boolean;
  totalItemCount: number;
  allItemsPro: boolean;
  noReverseScored: boolean;
  everyItemMapsToValidGroup: boolean;
  itemNumbersCorrect: boolean;
  scoringFunctionsExist: boolean;
  selectionFunctionsExist: boolean;
  retryHandlingExists: boolean;
  serializableTraceExists: boolean;
  allValidationScenariosPass: boolean;
  ready: boolean;
  missingRequirements: readonly string[];
}

export interface ExpressionGroupRoutingTrace {
  configVersion: string;
  mode: ExpressionGroupScreeningMode;
  receivedCoreResultSummary: {
    hasPrimary: boolean;
    primaryId: string | null;
    normalizedScore: number;
    rawScore: number;
  };
  receivedStrategyResultSummary: {
    hasPrimary: boolean;
    primaryId: string | null;
    normalizedScore: number;
    rawScore: number;
  };
  selectedCoreParent: string | null;
  selectedStrategyParent: string | null;
  rejectedParentReasons: readonly string[];
  selectedParentBranches: readonly {
    parentId: string;
    parentType: string;
    normalizedDirectScore: number;
    answeredItemCount: number;
  }[];
  availableGroupsByParent: Record<string, readonly string[]>;
  expectedScreeningItemIds: readonly string[];
  answeredItemIds: readonly string[];
  skippedItemIds: readonly string[];
  retryableSkippedItemIds: readonly string[];
  retriedItemIds: readonly string[];
  rawScoresByGroup: Record<string, number>;
  normalizedScoresByGroup: Record<string, number>;
  answeredCountsByGroup: Record<string, number>;
  incompleteGroups: readonly string[];
  incompleteGroupReasons: readonly string[];
  qualifyingGroups: readonly string[];
  perParentRankings: readonly {
    parentId: string;
    rankedGroupIds: readonly string[];
  }[];
  perParentLeaders: readonly {
    parentId: string;
    leaderGroupId: string | null;
  }[];
  eligibleAdditionalGroups: readonly string[];
  reservedLeaders: readonly string[];
  totalCapDecisions: readonly string[];
  duplicatePreventionDecisions: readonly string[];
  finalSelectedGroups: readonly string[];
  finalCategory: ExpressionGroupRoutingCategory;
  finalReason: string;
}
