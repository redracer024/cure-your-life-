export const EXPRESSION_GROUP_SCREENING_CONFIG = {
  configVersion: "1.0.0",

  parentSelection: {
    maximumCoreBranches: 1,
    maximumStrategyBranches: 1,
    maximumTotalBranches: 2,

    minimumCoreDirectScore: 3.5,
    minimumStrategyDirectScore: 3.5,

    minimumCoreAnsweredItems: 5,
    minimumStrategyAnsweredItems: 5,
  },

  screening: {
    itemsPerGroup: 2,
    minimumAnsweredItems: 2,
    minimumRawDirectScore: 6,
    minimumNormalizedDirectScore: 3,
    retrySkippedItemsOnce: true,
    useAnsweredItemsOnly: true,
    reverseScoringAllowed: false,
  },

  selection: {
    maximumGroupsPerParent: 2,
    maximumGroupsTotal: 3,
    additionalGroupCloseBandPoints: 0.5,
    reserveLeaderPerSelectedParent: true,
  },
} as const;
