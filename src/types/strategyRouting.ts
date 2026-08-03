import type { StrategyPatternId, ApprovedQuizItem, QuizAccess } from './quiz';

export type StrategyRoutingMode = 'free' | 'pro';

export type StrategyRoutingStage = 'universal' | 'initial-selection' | 'follow-up' | 'final';

export type StrategyRoutingOutcome =
  | 'primary'
  | 'primary-with-secondary'
  | 'close-candidates'
  | 'no-clear-strategy'
  | 'insufficient-evidence';

export type StrategyEligibilityStatus = 'eligible' | 'incomplete' | 'below-floor';

export interface StrategyEligibility {
  patternId: StrategyPatternId;
  status: StrategyEligibilityStatus;
  rawUniversalScore: number;
  normalizedUniversalScore: number;
  answeredUniversalCount: number;
  reason: string;
}

export interface StrategyDirectScore {
  patternId: StrategyPatternId;
  answeredCount: number;
  rawDirectScore: number;
  normalizedDirectScore: number;
}

export interface StrategyCandidateScore extends StrategyDirectScore {
  compatibleCorePatternId: StrategyPatternId | null;
  compatibleCoreNormalizedScore: number;
  combinedScore: number;
}

export interface StrategyRoutingConfig {
  universalScreen: {
    itemsPerStrategy: number;
    minimumAnsweredForEligibility: number;
    minimumRawDirectScore: number;
    minimumNormalizedDirectScore: number;
    retrySkippedScreenersOnce: boolean;
  };
  free: {
    maximumCandidates: number;
    followUpItemNumbers: number[];
    minimumFinalAnsweredItemsPerCandidate: number;
    minimumFinalNormalizedDirectScore: number;
  };
  pro: {
    maximumInitialCandidates: number;
    firstBatchItemNumbers: number[];
    secondBatchItemNumbers: number[];
    minimumFinalAnsweredItemsPerCandidate: number;
    minimumFinalNormalizedDirectScore: number;
    earlyStopMinimumAnsweredItems: number;
    earlyStopLeadPoints: number;
  };
  scoring: {
    directEvidenceWeight: number;
    compatibleCoreWeight: number;
    minimumScaleValue: number;
    maximumScaleValue: number;
  };
  closeBand: {
    initialRoutingPoints: number;
    finalSecondaryPoints: number;
    maximumFreeCandidates: number;
    maximumProCandidates: number;
    maximumSecondaries: number;
  };
  skips: {
    normalizeUsingAnsweredItemsOnly: boolean;
    treatSkippedAsNeutral: boolean;
    retryUniversalSkipsOnce: boolean;
  };
}

export interface StrategyCandidateSelection {
  patternId: StrategyPatternId;
  combinedScore: number;
  normalizedDirectScore: number;
  rawDirectScore: number;
  answeredCount: number;
}

export interface StrategyCandidateQualification {
  patternId: StrategyPatternId;
  eligible: boolean;
  reason: string;
  answeredItemCount: number;
  normalizedDirectScore: number;
}

export interface StrategyFollowUpAssignment {
  patternId: StrategyPatternId;
  batchLabel: string;
  itemIds: string[];
}

export interface StrategyRoutingTraceEntry {
  stage: StrategyRoutingStage;
  label: string;
  details: Record<string, unknown>;
}

export interface StrategyRoutingTrace {
  configVersion: string;
  mode: StrategyRoutingMode;
  answeredItemIds: string[];
  skippedItemIds: string[];
  retryableUniversalScreenerIds: string[];
  directScores: StrategyDirectScore[];
  compatibleCoreScores: { patternId: StrategyPatternId; normalizedScore: number }[];
  combinedScores: { patternId: StrategyPatternId; combinedScore: number }[];
  eligibilityResults: StrategyEligibility[];
  rankingsAfterEachStage: { stage: string; rankedIds: string[] }[];
  selectedCandidates: StrategyCandidateSelection[];
  closeBandComparisons: { primary: string; candidate: string; difference: number; withinBand: boolean }[];
  followUpItemAssignments: StrategyFollowUpAssignment[];
  duplicatePreventionDecisions: string[];
  stopDecision: { stopped: boolean; stopReason: string; stage: string };
  finalQualifications: StrategyCandidateQualification[];
  finalOutcomeReason: string;
}

export interface StrategyRoutingResult {
  outcome: StrategyRoutingOutcome;
  primary: StrategyPatternId | null;
  primaryRawScore: number;
  primaryNormalizedScore: number;
  secondaries: { patternId: StrategyPatternId; rawScore: number; normalizedScore: number; combinedScore: number }[];
  followUpItemIds: string[];
  trace: StrategyRoutingTrace;
}
