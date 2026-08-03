/*
 * Expression Confirmation Configuration
 *
 * Confirmation uses exactly one broader recurrence item per Expression.
 * A candidate is confirmed only when the confirmation response is 4 or 5.
 * The confirmation threshold is 4 — "Sometimes" (3) is insufficient.
 *
 * Confirmation may reduce but never expand the screened candidate set.
 * Screening remains capped at 2 candidates per group and 4 total; this
 * configuration mirrors those caps so the confirmation layer can never
 * widen them.
 */

export const EXPRESSION_CONFIRMATION_CONFIG = {
  configVersion: "1.0.0",

  confirmation: {
    itemsPerExpression: 1,
    minimumAnsweredItems: 1,
    minimumConfirmationScore: 4,
    retrySkippedItemsOnce: true,
    useAnsweredItemsOnly: true,
    reverseScoringAllowed: false,
  },

  selection: {
    maximumConfirmedPerGroup: 2,
    maximumConfirmedTotal: 4,
    candidateSetMayExpand: false,
  },
} as const;
