export const EXPRESSION_SCREENING_CONFIG = {
  configVersion: "1.0.0",

  screening: {
    itemsPerExpression: 2,
    minimumAnsweredItems: 2,
    minimumRawDirectScore: 6,
    minimumNormalizedDirectScore: 3,
    retrySkippedItemsOnce: true,
    useAnsweredItemsOnly: true,
    reverseScoringAllowed: false,
  },

  selection: {
    maximumCandidatesPerGroup: 2,
    maximumCandidatesTotal: 4,
    additionalExpressionCloseBandPoints: 0.5,
    reserveLeaderPerGroup: true,
  },
} as const;
