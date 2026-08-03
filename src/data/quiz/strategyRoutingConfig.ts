export const STRATEGY_ROUTING_CONFIG = {
  universalScreen: {
    itemsPerStrategy: 2,
    minimumAnsweredForEligibility: 2,
    minimumRawDirectScore: 6,
    minimumNormalizedDirectScore: 3,
    retrySkippedScreenersOnce: true,
  },
  free: {
    maximumCandidates: 2,
    followUpItemNumbers: [3, 4, 5],
    minimumFinalAnsweredItemsPerCandidate: 4,
    minimumFinalNormalizedDirectScore: 3,
  },
  pro: {
    maximumInitialCandidates: 3,
    firstBatchItemNumbers: [3, 4, 5],
    secondBatchItemNumbers: [6, 7, 8],
    minimumFinalAnsweredItemsPerCandidate: 5,
    minimumFinalNormalizedDirectScore: 3,
    earlyStopMinimumAnsweredItems: 5,
    earlyStopLeadPoints: 0.6,
  },
  scoring: {
    directEvidenceWeight: 0.8,
    compatibleCoreWeight: 0.2,
    minimumScaleValue: 1,
    maximumScaleValue: 5,
  },
  closeBand: {
    initialRoutingPoints: 0.4,
    finalSecondaryPoints: 0.35,
    maximumFreeCandidates: 2,
    maximumProCandidates: 3,
    maximumSecondaries: 2,
  },
  skips: {
    normalizeUsingAnsweredItemsOnly: true,
    treatSkippedAsNeutral: false,
    retryUniversalSkipsOnce: true,
  },
} as const;
