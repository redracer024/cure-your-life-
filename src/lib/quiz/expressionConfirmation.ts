/*
 * Expression Confirmation Logic
 *
 * Pure, deterministic functions implementing the confirmation stage of the
 * expression assessment pipeline. Confirmation never expands the screened
 * candidate set, never diagnoses, and never establishes causes.
 *
 * Confirmation scoring:
 * - response 1-3: not-confirmed (below-confirmation-threshold)
 * - response 4-5: confirmed (threshold is 4, equality at 4 confirms)
 * - first skip: retry required (one immediate retry allowed)
 * - second skip: unresolved (unresolved-after-retry)
 *
 * The confirmation response is the ONLY confirmation score. Screening and
 * group scores gate candidacy and ordering but never inflate confirmation.
 */

import {
  EXPRESSION_CONFIRMATION_CONFIG,
} from '../../data/quiz/expressionConfirmationConfig';
import {
  EXPRESSION_CONFIRMATION_ITEMS,
} from '../../data/quiz/expressionConfirmationItems';
import {
  EXPRESSION_SCREENING_GROUPS,
} from '../../data/quiz/expressionScreeningGroups';
import {
  EXPRESSION_REGISTRY,
  CORE_PATTERN_IDS,
} from '../../data/quiz/patternTaxonomy';
import type {
  ExpressionScreeningGroupSelection,
} from '../../types/expressionScreening';
import type {
  ExpressionConfirmationMode,
  ExpressionConfirmationResponseEntry,
  ExpressionConfirmationItem,
  ExpressionConfirmationAttempt,
  ExpressionConfirmationTrace,
  ExpressionConfirmationResultEntry,
  ExpressionConfirmationResult,
  ExpressionConfirmationCompletionState,
  ExpressionConfirmationResultCategory,
  ExpressionConfirmationNavigationTarget,
  ExpressionConfirmationStatus,
  ExpressionConfirmationExclusionReason,
  ExpressionConfirmationReadiness,
} from '../../types/expressionConfirmation';
import type { ExpressionId } from '../../types/quiz';

type Config = typeof EXPRESSION_CONFIRMATION_CONFIG;

const CONFIRMATION_ITEM_ID_PREFIX = 'expression-confirm-';

/* ==================================================================
 *  1. Registry Helpers
 * ================================================================*/

function findGroupForExpression(expressionId: string): { groupId: string } | null {
  for (const group of EXPRESSION_SCREENING_GROUPS) {
    if (group.expressionIds.includes(expressionId)) {
      return { groupId: group.id };
    }
  }
  return null;
}

function getParentInfo(expressionId: string): {
  parentId: string;
  parentType: 'core' | 'strategy';
} {
  const entry = EXPRESSION_REGISTRY.find(e => e.id === expressionId);
  const parentId = entry?.parentPatternId ?? '';
  const parentType: 'core' | 'strategy' =
    CORE_PATTERN_IDS.includes(parentId as never) ? 'core' : 'strategy';
  return { parentId, parentType };
}

function getCanonicalRegistryOrder(expressionId: string): number {
  const index = EXPRESSION_REGISTRY.findIndex(e => e.id === expressionId);
  return index >= 0 ? index + 1 : 999;
}

/* ==================================================================
 *  2. Item Retrieval
 * ================================================================*/

export function getConfirmationItemForExpression(
  expressionId: string,
  items: readonly ExpressionConfirmationItem[] = EXPRESSION_CONFIRMATION_ITEMS,
): ExpressionConfirmationItem | null {
  return items.find(i => i.expressionId === expressionId) ?? null;
}

export function getConfirmationItemsForCandidates(
  candidateExpressionIds: readonly string[],
  items: readonly ExpressionConfirmationItem[] = EXPRESSION_CONFIRMATION_ITEMS,
): ExpressionConfirmationItem[] {
  const idSet = new Set(candidateExpressionIds);
  return items.filter(i => idSet.has(i.expressionId));
}

/* ==================================================================
 *  3. Confirmation Scoring
 * ================================================================*/

export interface ExpressionConfirmationScore {
  attempts: readonly ExpressionConfirmationAttempt[];
  retryCount: number;
  finalResponse: ExpressionConfirmationResponseEntry['selectedValue'] | null;
  confirmationScore: number | null;
  status: ExpressionConfirmationStatus;
  exclusionReason: ExpressionConfirmationExclusionReason | null;
  deterministicDecisionMessages: readonly string[];
}

export function scoreExpressionConfirmation(
  candidate: ExpressionScreeningGroupSelection,
  responses: readonly ExpressionConfirmationResponseEntry[],
  retryResponses?: readonly ExpressionConfirmationResponseEntry[],
  config?: Config,
  items: readonly ExpressionConfirmationItem[] = EXPRESSION_CONFIRMATION_ITEMS,
): ExpressionConfirmationScore {
  const cfg = config ?? EXPRESSION_CONFIRMATION_CONFIG;
  const decisionMessages: string[] = [];

  const item = getConfirmationItemForExpression(candidate.expressionId, items);
  if (!item) {
    decisionMessages.push(`no confirmation item defined for candidate ${candidate.expressionId}`);
    return {
      attempts: [],
      retryCount: 0,
      finalResponse: null,
      confirmationScore: null,
      status: 'unresolved',
      exclusionReason: 'unresolved-after-retry',
      deterministicDecisionMessages: decisionMessages,
    };
  }

  const firstResponse = responses.find(r => r.itemId === item.id);
  const retryResponse = retryResponses?.find(r => r.itemId === item.id);

  if (firstResponse) {
    const attempts: ExpressionConfirmationAttempt[] = [{
      attemptNumber: 1,
      response: firstResponse.selectedValue,
      skipped: false,
    }];
    if (retryResponse) {
      decisionMessages.push(`duplicate retry ignored for answered item ${item.id}`);
    }
    const confirmed = firstResponse.selectedValue >= cfg.confirmation.minimumConfirmationScore;
    return {
      attempts,
      retryCount: 0,
      finalResponse: firstResponse.selectedValue,
      confirmationScore: firstResponse.selectedValue,
      status: confirmed ? 'confirmed' : 'not-confirmed',
      exclusionReason: confirmed ? null : 'below-confirmation-threshold',
      deterministicDecisionMessages: decisionMessages,
    };
  }

  const attempts: ExpressionConfirmationAttempt[] = [{
    attemptNumber: 1,
    response: null,
    skipped: true,
  }];
  decisionMessages.push(`first skip for ${item.id}, one retry offered`);

  if (retryResponse) {
    attempts.push({
      attemptNumber: 2,
      response: retryResponse.selectedValue,
      skipped: false,
    });
    decisionMessages.push(`retry answered for ${item.id}`);
    const confirmed = retryResponse.selectedValue >= cfg.confirmation.minimumConfirmationScore;
    return {
      attempts,
      retryCount: 1,
      finalResponse: retryResponse.selectedValue,
      confirmationScore: retryResponse.selectedValue,
      status: confirmed ? 'confirmed' : 'not-confirmed',
      exclusionReason: confirmed ? null : 'below-confirmation-threshold',
      deterministicDecisionMessages: decisionMessages,
    };
  }

  attempts.push({
    attemptNumber: 2,
    response: null,
    skipped: true,
  });
  decisionMessages.push(`second skip for ${item.id}, unresolved`);

  return {
    attempts,
    retryCount: 1,
    finalResponse: null,
    confirmationScore: null,
    status: 'unresolved',
    exclusionReason: 'unresolved-after-retry',
    deterministicDecisionMessages: decisionMessages,
  };
}

/* ==================================================================
 *  4. Ordering
 * ================================================================*/

export function sortConfirmedExpressions(
  entries: readonly ExpressionConfirmationResultEntry[],
): ExpressionConfirmationResultEntry[] {
  return [...entries].sort((a, b) => {
    if (b.confirmationScore !== a.confirmationScore) {
      return b.confirmationScore - a.confirmationScore;
    }
    if (b.screeningNormalizedScore !== a.screeningNormalizedScore) {
      return b.screeningNormalizedScore - a.screeningNormalizedScore;
    }
    if (b.screeningRawScore !== a.screeningRawScore) {
      return b.screeningRawScore - a.screeningRawScore;
    }
    if (a.canonicalRegistryOrder !== b.canonicalRegistryOrder) {
      return a.canonicalRegistryOrder - b.canonicalRegistryOrder;
    }
    if (a.expressionId < b.expressionId) return -1;
    if (a.expressionId > b.expressionId) return 1;
    return 0;
  });
}

function rankAllCandidates(
  candidates: readonly ExpressionScreeningGroupSelection[],
  scoresByExpression: Readonly<Record<string, ExpressionConfirmationScore>>,
): string[] {
  return [...candidates].sort((a, b) => {
    const scoreA = scoresByExpression[a.expressionId];
    const scoreB = scoresByExpression[b.expressionId];
    const confA = scoreA?.confirmationScore ?? -1;
    const confB = scoreB?.confirmationScore ?? -1;
    if (confB !== confA) return confB - confA;
    if (b.normalizedDirectScore !== a.normalizedDirectScore) {
      return b.normalizedDirectScore - a.normalizedDirectScore;
    }
    if (b.rawDirectScore !== a.rawDirectScore) {
      return b.rawDirectScore - a.rawDirectScore;
    }
    const orderA = getCanonicalRegistryOrder(a.expressionId);
    const orderB = getCanonicalRegistryOrder(b.expressionId);
    if (orderA !== orderB) return orderA - orderB;
    if (a.expressionId < b.expressionId) return -1;
    if (a.expressionId > b.expressionId) return 1;
    return 0;
  }).map(c => c.expressionId);
}

/* ==================================================================
 *  5. Completion State
 * ================================================================*/

export function deriveExpressionConfirmationCompletionState(
  traces: readonly ExpressionConfirmationTrace[],
): ExpressionConfirmationCompletionState {
  if (traces.length === 0) return 'not-started';
  const anyAttempt = traces.some(t => t.attempts.length > 0);
  if (!anyAttempt) return 'not-started';
  if (traces.some(t => t.status === 'unresolved')) return 'partial';
  return 'complete';
}

/* ==================================================================
 *  6. Trace Serialization
 * ================================================================*/

export function serializeExpressionConfirmationTrace(
  trace: ExpressionConfirmationTrace,
): string {
  return JSON.stringify(trace);
}

export function serializeExpressionConfirmationResult(
  result: ExpressionConfirmationResult,
): string {
  return JSON.stringify(result);
}

/* ==================================================================
 *  7. Routing Result
 * ================================================================*/

export function deriveExpressionConfirmationNavigationTarget(
  candidates: readonly ExpressionScreeningGroupSelection[],
  rankedExpressionIds: readonly string[],
): ExpressionConfirmationNavigationTarget {
  for (const expressionId of rankedExpressionIds) {
    const candidate = candidates.find(c => c.expressionId === expressionId);
    if (!candidate) continue;
    const { parentId, parentType } = getParentInfo(expressionId);
    if (parentType === 'strategy' && parentId) {
      return { type: 'strategy', id: parentId };
    }
    if (parentType === 'core' && parentId) {
      return { type: 'core', id: parentId };
    }
  }
  return null;
}

export function confirmExpressionCandidates(
  mode: ExpressionConfirmationMode,
  candidates: readonly ExpressionScreeningGroupSelection[],
  responses: readonly ExpressionConfirmationResponseEntry[],
  retryResponses?: readonly ExpressionConfirmationResponseEntry[],
  config?: Config,
  items: readonly ExpressionConfirmationItem[] = EXPRESSION_CONFIRMATION_ITEMS,
  navigationTarget?: ExpressionConfirmationNavigationTarget,
): ExpressionConfirmationResult {
  const cfg = config ?? EXPRESSION_CONFIRMATION_CONFIG;

  if (mode === 'free') {
    return {
      confirmedExpressions: [],
      rejectedExpressionIds: [],
      unresolvedExpressionIds: [],
      traces: [],
      totalCandidates: 0,
      totalConfirmed: 0,
      totalRejected: 0,
      totalUnresolved: 0,
      completionState: 'not-started',
      resultCategory: 'expression-not-assessed',
      navigationTarget: null,
    };
  }

  const candidateIds = new Set(candidates.map(c => c.expressionId));

  const scoresByExpression: Record<string, ExpressionConfirmationScore> = {};
  const traces: ExpressionConfirmationTrace[] = [];

  for (const candidate of candidates) {
    const score = scoreExpressionConfirmation(candidate, responses, retryResponses, cfg, items);
    scoresByExpression[candidate.expressionId] = score;

    const item = getConfirmationItemForExpression(candidate.expressionId, items);
    const { parentId, parentType } = getParentInfo(candidate.expressionId);

    traces.push({
      configVersion: cfg.configVersion,
      mode,
      candidateExpressionId: candidate.expressionId,
      groupId: candidate.groupId,
      parentId,
      parentType,
      canonicalRegistryOrder: getCanonicalRegistryOrder(candidate.expressionId),
      screeningRawScore: candidate.rawDirectScore,
      screeningNormalizedScore: candidate.normalizedDirectScore,
      screeningAnsweredCount: candidate.answeredCount,
      confirmationItemId: item?.id ?? null,
      attempts: score.attempts,
      retryCount: score.retryCount,
      finalResponse: score.finalResponse,
      confirmationScore: score.confirmationScore,
      status: score.status,
      exclusionReason: score.exclusionReason,
      confirmationRank: null,
      finalRank: null,
      includedInResult: false,
      deterministicDecisionMessages: [...score.deterministicDecisionMessages],
    });
  }

  const unrecognizedItemIds = [...responses, ...(retryResponses ?? [])]
    .map(r => r.itemId)
    .filter(itemId => !items.some(i => i.id === itemId));
  const nonCandidateItemIds = items
    .filter(i => !candidateIds.has(i.expressionId))
    .map(i => i.id)
    .filter(id => responses.some(r => r.itemId === id) || (retryResponses ?? []).some(r => r.itemId === id));

  if (unrecognizedItemIds.length > 0) {
    traces.push({
      configVersion: cfg.configVersion,
      mode,
      candidateExpressionId: '',
      groupId: '',
      parentId: '',
      parentType: 'core',
      canonicalRegistryOrder: 999,
      screeningRawScore: 0,
      screeningNormalizedScore: 0,
      screeningAnsweredCount: 0,
      confirmationItemId: null,
      attempts: [],
      retryCount: 0,
      finalResponse: null,
      confirmationScore: null,
      status: 'not-confirmed',
      exclusionReason: 'not-screened-candidate',
      confirmationRank: null,
      finalRank: null,
      includedInResult: false,
      deterministicDecisionMessages: [`unrecognized response item(s) ignored: ${unrecognizedItemIds.join(', ')}`],
    });
  }

  for (const item of items) {
    if (candidateIds.has(item.expressionId)) continue;
    const answered = responses.some(r => r.itemId === item.id) ||
      (retryResponses ?? []).some(r => r.itemId === item.id);
    if (!answered) continue;

    const { parentId, parentType } = getParentInfo(item.expressionId);
    traces.push({
      configVersion: cfg.configVersion,
      mode,
      candidateExpressionId: item.expressionId,
      groupId: item.groupId,
      parentId,
      parentType,
      canonicalRegistryOrder: getCanonicalRegistryOrder(item.expressionId),
      screeningRawScore: 0,
      screeningNormalizedScore: 0,
      screeningAnsweredCount: 0,
      confirmationItemId: item.id,
      attempts: [],
      retryCount: 0,
      finalResponse: null,
      confirmationScore: null,
      status: 'not-confirmed',
      exclusionReason: 'not-screened-candidate',
      confirmationRank: null,
      finalRank: null,
      includedInResult: false,
      deterministicDecisionMessages: [`response supplied for ${item.expressionId} which is not a screened candidate; candidate set not expanded`],
    });
  }

  const rankedExpressionIds = rankAllCandidates(candidates, scoresByExpression);
  const rankByExpression: Record<string, number> = {};
  rankedExpressionIds.forEach((expressionId, index) => {
    rankByExpression[expressionId] = index + 1;
  });

  const confirmedEntries: ExpressionConfirmationResultEntry[] = [];
  const rejectedExpressionIds: string[] = [];
  const unresolvedExpressionIds: string[] = [];

  for (const candidate of candidates) {
    const score = scoresByExpression[candidate.expressionId];
    const { parentId, parentType } = getParentInfo(candidate.expressionId);
    if (score.status === 'unresolved') {
      unresolvedExpressionIds.push(candidate.expressionId);
    } else if (score.status === 'not-confirmed') {
      rejectedExpressionIds.push(candidate.expressionId);
    } else if (score.status === 'confirmed') {
      confirmedEntries.push({
        expressionId: candidate.expressionId,
        groupId: candidate.groupId,
        parentId,
        parentType,
        confirmationScore: score.confirmationScore ?? 0,
        screeningRawScore: candidate.rawDirectScore,
        screeningNormalizedScore: candidate.normalizedDirectScore,
        canonicalRegistryOrder: getCanonicalRegistryOrder(candidate.expressionId),
        rank: 0,
      });
    }
  }

  const sortedConfirmed = sortConfirmedExpressions(confirmedEntries);

  const confirmedCountByGroup: Record<string, number> = {};
  const selectedConfirmed: ExpressionConfirmationResultEntry[] = [];
  const capExcludedExpressionIds: string[] = [];
  const capReasonByExpression: Record<string, ExpressionConfirmationExclusionReason> = {};

  for (const entry of sortedConfirmed) {
    const groupCount = confirmedCountByGroup[entry.groupId] ?? 0;
    if (groupCount >= cfg.selection.maximumConfirmedPerGroup) {
      capExcludedExpressionIds.push(entry.expressionId);
      capReasonByExpression[entry.expressionId] = 'excluded-by-group-cap';
      rejectedExpressionIds.push(entry.expressionId);
      continue;
    }
    if (selectedConfirmed.length >= cfg.selection.maximumConfirmedTotal) {
      capExcludedExpressionIds.push(entry.expressionId);
      capReasonByExpression[entry.expressionId] = 'excluded-by-total-cap';
      rejectedExpressionIds.push(entry.expressionId);
      continue;
    }
    confirmedCountByGroup[entry.groupId] = groupCount + 1;
    selectedConfirmed.push(entry);
  }

  selectedConfirmed.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  const finalRankByExpression: Record<string, number> = {};
  selectedConfirmed.forEach((entry, index) => {
    finalRankByExpression[entry.expressionId] = index + 1;
  });

  for (const trace of traces) {
    const expressionId = trace.candidateExpressionId;
    const rank = rankByExpression[expressionId];
    const finalRank = finalRankByExpression[expressionId] ?? null;
    trace.confirmationRank = rank ?? null;
    trace.finalRank = finalRank;
    trace.includedInResult = trace.status === 'confirmed' && finalRank !== null;
    if (trace.status === 'confirmed' && capReasonByExpression[expressionId]) {
      trace.exclusionReason = capReasonByExpression[expressionId];
    }
  }

  const resolvedNavigationTarget: ExpressionConfirmationNavigationTarget =
    navigationTarget ?? deriveExpressionConfirmationNavigationTarget(candidates, rankedExpressionIds);

  const completionState = deriveExpressionConfirmationCompletionState(traces);

  let resultCategory: ExpressionConfirmationResultCategory;
  if (selectedConfirmed.length > 0) {
    resultCategory = 'confirmed';
  } else if (candidates.length === 0) {
    resultCategory = 'no-clear-expression';
  } else if (unresolvedExpressionIds.length === candidates.length) {
    resultCategory = 'insufficient-evidence';
  } else {
    resultCategory = 'no-clear-expression';
  }

  return {
    confirmedExpressions: selectedConfirmed,
    rejectedExpressionIds: [...rejectedExpressionIds],
    unresolvedExpressionIds: [...unresolvedExpressionIds],
    traces,
    totalCandidates: candidates.length,
    totalConfirmed: selectedConfirmed.length,
    totalRejected: rejectedExpressionIds.length,
    totalUnresolved: unresolvedExpressionIds.length,
    completionState,
    resultCategory,
    navigationTarget: resolvedNavigationTarget,
  };
}

/* ==================================================================
 *  8. Build-Time Readiness
 * ================================================================*/

export function getExpressionConfirmationReadiness(
  items: readonly ExpressionConfirmationItem[] = EXPRESSION_CONFIRMATION_ITEMS,
): ExpressionConfirmationReadiness {
  const missing: string[] = [];

  const expressionIds = new Set(EXPRESSION_REGISTRY.map(e => e.id));
  const groupIds = new Set(EXPRESSION_SCREENING_GROUPS.map(g => g.id));
  const totalItemCount = items.length;
  const itemsDefined = totalItemCount > 0;

  const expectedItemCount = expressionIds.size;
  if (totalItemCount !== expectedItemCount) missing.push(`expected ${expectedItemCount} items, got ${totalItemCount}`);

  const expressionItemCounts: Record<string, number> = {};
  for (const item of items) {
    if (!expressionItemCounts[item.expressionId]) expressionItemCounts[item.expressionId] = 0;
    expressionItemCounts[item.expressionId]++;
  }

  const missingItemExpressions = [...expressionIds].filter(eid => !expressionItemCounts[eid]);
  if (missingItemExpressions.length > 0) missing.push(`${missingItemExpressions.length} expressions have 0 confirmation items`);

  const allExpressionsHaveOneItem = expressionIds.size > 0 && [...expressionIds].every(eid => {
    const count = expressionItemCounts[eid] ?? 0;
    return count === 1;
  });
  if (!allExpressionsHaveOneItem) missing.push('not all expressions have exactly 1 confirmation item');

  const allItemsPro = items.every(i => i.access === 'pro');
  if (!allItemsPro) missing.push('not all items are pro access');

  const noReverseScored = items.every(i => i.reverseScored === false);
  if (!noReverseScored) missing.push('reverse-scored items found');

  const everyItemMapsToValidExpression = items.every(i => expressionIds.has(i.expressionId));
  if (!everyItemMapsToValidExpression) missing.push('item maps to invalid expression');

  const everyItemMapsToValidGroup = items.every(i => groupIds.has(i.groupId));
  if (!everyItemMapsToValidGroup) missing.push('item maps to invalid group');

  const everyExpressionToGroupMappingValid = items.every(i => {
    const group = EXPRESSION_SCREENING_GROUPS.find(g => g.id === i.groupId);
    return group?.expressionIds.includes(i.expressionId) ?? false;
  });
  if (!everyExpressionToGroupMappingValid) missing.push('expression-to-group mapping mismatch');

  const itemNumbersCorrect = items.length > 0 && items.every(i => i.itemNumber === 1);
  if (!itemNumbersCorrect && itemsDefined) missing.push('item numbers not 1 per expression');

  const itemIdsUnique = new Set(items.map(i => i.id)).size === items.length;
  if (!itemIdsUnique) missing.push('duplicate confirmation item IDs found');

  const allPromptsNonEmpty = items.every(i => i.prompt.trim().length > 0);
  if (!allPromptsNonEmpty) missing.push('some item prompts are empty');

  const allItemIdsUseCanonicalPrefix = items.every(i => i.id.startsWith(CONFIRMATION_ITEM_ID_PREFIX));
  if (!allItemIdsUseCanonicalPrefix) missing.push('item IDs missing canonical prefix');

  if (!itemsDefined) missing.push('no confirmation items defined');

  const ready = itemsDefined &&
    allExpressionsHaveOneItem &&
    totalItemCount === expectedItemCount &&
    allItemsPro &&
    noReverseScored &&
    everyItemMapsToValidExpression &&
    everyItemMapsToValidGroup &&
    everyExpressionToGroupMappingValid &&
    itemNumbersCorrect &&
    itemIdsUnique &&
    allPromptsNonEmpty &&
    allItemIdsUseCanonicalPrefix;

  return {
    itemsDefined,
    allExpressionsHaveOneItem,
    totalItemCount,
    allItemsPro,
    noReverseScored,
    everyItemMapsToValidExpression,
    everyItemMapsToValidGroup,
    everyExpressionToGroupMappingValid,
    itemNumbersCorrect,
    itemIdsUnique,
    allPromptsNonEmpty,
    allItemIdsUseCanonicalPrefix,
    scoringFunctionsExist: true,
    selectionFunctionsExist: true,
    retryHandlingExists: true,
    serializableTraceExists: true,
    validationSuitePasses: false,
    ready,
    missingRequirements: missing,
  };
}
