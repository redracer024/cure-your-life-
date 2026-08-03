import {
  EXPRESSION_SCREENING_CONFIG,
} from '../../data/quiz/expressionScreeningConfig';
import {
  EXPRESSION_SCREENING_ITEMS,
} from '../../data/quiz/expressionScreeningItems';
import {
  EXPRESSION_SCREENING_GROUPS,
} from '../../data/quiz/expressionScreeningGroups';
import {
  EXPRESSION_REGISTRY,
} from '../../data/quiz/patternTaxonomy';
import type {
  ExpressionScreeningMode,
  ExpressionScreeningItemDefinition,
  ExpressionScreeningResponse,
  ExpressionDirectScreeningScore,
  ExpressionScreeningGroupSelection,
  ExpressionScreeningCategory,
  ExpressionScreeningResult,
  ExpressionScreeningReadiness,
  PerGroupRankingEntry,
  ExpressionScreeningTrace,
} from '../../types/expressionScreening';
import type { ExpressionId } from '../../types/quiz';

type Config = typeof EXPRESSION_SCREENING_CONFIG;

/* ==================================================================
 *  1. Expression Retrieval
 * ================================================================*/

export function getEligibleExpressions(
  advancingGroupIds: readonly string[],
): {
  eligibleExpressionIdsByGroup: Record<string, readonly string[]>;
  duplicateExpressionIdsPrevented: readonly string[];
  invalidAdvancingGroupIds: readonly string[];
} {
  const seen = new Set<string>();
  const duplicatePrevented: string[] = [];
  const invalidGroups: string[] = [];
  const validGroupIds = new Set(EXPRESSION_SCREENING_GROUPS.map(g => g.id));
  const result: Record<string, readonly string[]> = {};

  const deduplicated = advancingGroupIds.filter(id => {
    if (!validGroupIds.has(id)) {
      invalidGroups.push(id);
      return false;
    }
    return true;
  });

  const processedGroupIds = new Set<string>();

  for (const groupId of deduplicated) {
    if (processedGroupIds.has(groupId)) {
      continue;
    }
    processedGroupIds.add(groupId);

    const group = EXPRESSION_SCREENING_GROUPS.find(g => g.id === groupId);
    if (!group) {
      invalidGroups.push(groupId);
      continue;
    }

    const groupExpressionIds: string[] = [];
    for (const eid of group.expressionIds) {
      if (seen.has(eid)) {
        duplicatePrevented.push(eid);
      } else {
        seen.add(eid);
        groupExpressionIds.push(eid);
      }
    }
    result[groupId] = groupExpressionIds;
  }

  return {
    eligibleExpressionIdsByGroup: result,
    duplicateExpressionIdsPrevented: duplicatePrevented,
    invalidAdvancingGroupIds: invalidGroups,
  };
}

export function getEligibleExpressionIds(
  advancingGroupIds: readonly string[],
): readonly string[] {
  const { eligibleExpressionIdsByGroup, invalidAdvancingGroupIds, duplicateExpressionIdsPrevented } =
    getEligibleExpressions(advancingGroupIds);
  const ids: string[] = [];
  for (const groupId of Object.keys(eligibleExpressionIdsByGroup)) {
    for (const eid of eligibleExpressionIdsByGroup[groupId]) {
      ids.push(eid);
    }
  }
  return ids;
}

/* ==================================================================
 *  2. Screening Item Retrieval
 * ================================================================*/

export function getExpressionScreeningItems(
  expressionId: string,
): readonly ExpressionScreeningItemDefinition[] {
  return EXPRESSION_SCREENING_ITEMS.filter(i => i.expressionId === expressionId);
}

export function getAllScreeningItemsForExpressions(
  expressionIds: readonly string[],
): {
  screeningItemIdsByExpression: Record<string, readonly string[]>;
  missingItemMappings: readonly string[];
  duplicateItemIdsPrevented: readonly string[];
} {
  const seenItemIds = new Set<string>();
  const duplicatePrevented: string[] = [];
  const missing: string[] = [];
  const expressionIdsSet = new Set(expressionIds);
  const result: Record<string, string[]> = {};

  for (const eid of expressionIds) {
    result[eid] = [];
  }

  for (const item of EXPRESSION_SCREENING_ITEMS) {
    if (!expressionIdsSet.has(item.expressionId)) {
      continue;
    }
    if (result[item.expressionId] === undefined) {
      continue;
    }
    if (seenItemIds.has(item.id)) {
      duplicatePrevented.push(item.id);
      continue;
    }
    seenItemIds.add(item.id);
    result[item.expressionId].push(item.id);
  }

  for (const eid of expressionIds) {
    if (result[eid].length < 2) {
      missing.push(eid);
    }
  }

  const readonlyResult: Record<string, readonly string[]> = {};
  for (const key of Object.keys(result)) {
    readonlyResult[key] = result[key];
  }

  return {
    screeningItemIdsByExpression: readonlyResult,
    missingItemMappings: missing,
    duplicateItemIdsPrevented: duplicatePrevented,
  };
}

export function findRetryableSkippedItemIds(
  expressionId: string,
  responses: readonly ExpressionScreeningResponse[],
): readonly string[] {
  const items = getExpressionScreeningItems(expressionId);
  const answeredItemIds = new Set(responses.map(r => r.itemId));
  return items
    .filter(item => !answeredItemIds.has(item.id))
    .map(item => item.id);
}

/* ==================================================================
 *  3. Direct Scoring
 * ================================================================*/

export function computeExpressionDirectScore(
  expressionId: string,
  responses: readonly ExpressionScreeningResponse[],
  config?: Config,
): ExpressionDirectScreeningScore {
  const cfg = config ?? EXPRESSION_SCREENING_CONFIG;
  const items = getExpressionScreeningItems(expressionId);
  const responseMap = new Map<string, number>();
  for (const r of responses) {
    responseMap.set(r.itemId, r.selectedValue);
  }

  const missingItemIds: string[] = [];
  const answeredValues: number[] = [];

  for (const item of items) {
    if (responseMap.has(item.id)) {
      answeredValues.push(responseMap.get(item.id)!);
    } else {
      missingItemIds.push(item.id);
    }
  }

  const answeredCount = answeredValues.length;
  const requiredCount = cfg.screening.itemsPerExpression;
  const rawDirectScore = answeredValues.reduce((sum, v) => sum + v, 0);
  const normalizedDirectScore = answeredCount > 0 ? rawDirectScore / answeredCount : null;

  const complete = answeredCount === requiredCount;
  let qualifies = false;
  let incompleteReason: string | null = null;

  if (items.length < requiredCount) {
    qualifies = false;
    incompleteReason = 'expression has fewer than 2 screening items registered';
  } else if (answeredCount < requiredCount) {
    qualifies = false;
    incompleteReason = `answered ${answeredCount}/${requiredCount} items`;
  } else if (normalizedDirectScore !== null &&
             normalizedDirectScore < cfg.screening.minimumNormalizedDirectScore) {
    qualifies = false;
    incompleteReason = `normalized score ${normalizedDirectScore.toFixed(2)} below minimum ${cfg.screening.minimumNormalizedDirectScore}`;
  } else if (rawDirectScore < cfg.screening.minimumRawDirectScore) {
    qualifies = false;
    incompleteReason = `raw score ${rawDirectScore} below minimum ${cfg.screening.minimumRawDirectScore}`;
  } else {
    qualifies = true;
  }

  return {
    expressionId,
    groupId: '',
    rawDirectScore,
    answeredCount,
    normalizedDirectScore,
    complete,
    qualifies,
    missingItemIds,
    incompleteReason: qualifies ? null : incompleteReason,
  };
}

export function scoreExpressionAfterRetry(
  expressionId: string,
  originalResponses: readonly ExpressionScreeningResponse[],
  retryResponses: readonly ExpressionScreeningResponse[],
  config?: Config,
): {
  score: ExpressionDirectScreeningScore;
  initiallySkipped: readonly string[];
  retriedItemIds: readonly string[];
  answeredAfterRetry: readonly string[];
  stillSkippedAfterRetry: readonly string[];
} {
  const items = getExpressionScreeningItems(expressionId);
  const originalItemIds = new Set(originalResponses.map(r => r.itemId));
  const retryMap = new Map(retryResponses.map(r => [r.itemId, r.selectedValue]));

  const initiallySkipped = items.filter(i => !originalItemIds.has(i.id)).map(i => i.id);
  const retriedItemIds: string[] = [];
  const answeredAfterRetry: string[] = [];
  const stillSkippedAfterRetry: string[] = [];

  const mergedResponses = [...originalResponses];

  for (const skippedId of initiallySkipped) {
    if (retryMap.has(skippedId)) {
      retriedItemIds.push(skippedId);
      mergedResponses.push({ itemId: skippedId, selectedValue: retryMap.get(skippedId)! });
      answeredAfterRetry.push(skippedId);
    } else {
      stillSkippedAfterRetry.push(skippedId);
    }
  }

  const score = computeExpressionDirectScore(expressionId, mergedResponses, config);
  return { score, initiallySkipped, retriedItemIds, answeredAfterRetry, stillSkippedAfterRetry };
}

/* ==================================================================
 *  4. Within-Group Ranking
 * ================================================================*/

export function rankExpressionScores(
  scores: readonly ExpressionDirectScreeningScore[],
): readonly ExpressionDirectScreeningScore[] {
  return [...scores].sort((a, b) => {
    const na = a.normalizedDirectScore ?? -1;
    const nb = b.normalizedDirectScore ?? -1;
    if (nb !== na) return nb - na;
    if (a.answeredCount !== b.answeredCount) return b.answeredCount - a.answeredCount;
    if (a.rawDirectScore !== b.rawDirectScore) return b.rawDirectScore - a.rawDirectScore;
    const orderA = getExpressionOrder(a.expressionId);
    const orderB = getExpressionOrder(b.expressionId);
    if (orderA !== orderB) return orderA - orderB;
    if (a.expressionId < b.expressionId) return -1;
    if (a.expressionId > b.expressionId) return 1;
    return 0;
  });
}

function getExpressionOrder(expressionId: string): number {
  for (const group of EXPRESSION_SCREENING_GROUPS) {
    const order = group.expressionOrder[expressionId];
    if (order !== undefined) return order;
  }
  return 999;
}

export function selectGroupCandidates(
  groupId: string,
  qualifyingScores: readonly ExpressionDirectScreeningScore[],
  config?: Config,
): {
  leader: ExpressionScreeningGroupSelection | null;
  secondary: ExpressionScreeningGroupSelection | null;
  closeBandDecision: string;
} {
  const cfg = config ?? EXPRESSION_SCREENING_CONFIG;
  const maxPerGroup = cfg.selection.maximumCandidatesPerGroup;
  const closeBand = cfg.selection.additionalExpressionCloseBandPoints;

  const group = EXPRESSION_SCREENING_GROUPS.find(g => g.id === groupId);
  if (!group || qualifyingScores.length === 0) {
    return { leader: null, secondary: null, closeBandDecision: 'no qualifying expressions' };
  }

  const ranked = rankExpressionScores(qualifyingScores);

  const buildSelection = (
    score: ExpressionDirectScreeningScore,
    isLeader: boolean,
  ): ExpressionScreeningGroupSelection => ({
    expressionId: score.expressionId,
    groupId,
    normalizedDirectScore: score.normalizedDirectScore ?? 0,
    rawDirectScore: score.rawDirectScore,
    answeredCount: score.answeredCount,
    groupOrder: group.groupOrder,
    expressionOrder: getExpressionOrder(score.expressionId),
    isLeader,
  });

  const leader = buildSelection(ranked[0], true);

  if (ranked.length < 2 || maxPerGroup < 2) {
    return { leader, secondary: null, closeBandDecision: 'only one qualifying expression' };
  }

  const secondScore = ranked[1];
  const leaderNorm = leader.normalizedDirectScore;
  const secondNorm = secondScore.normalizedDirectScore ?? 0;

  const diff = leaderNorm - secondNorm;
  if (diff <= closeBand) {
    const secondary = buildSelection(secondScore, false);
    return {
      leader,
      secondary,
      closeBandDecision: `secondary ${secondScore.expressionId} within ${diff.toFixed(2)} points of leader ${leader.expressionId}`,
    };
  }

  return {
    leader,
    secondary: null,
    closeBandDecision: `secondary ${secondScore.expressionId} too far (${diff.toFixed(2)} > ${closeBand.toFixed(2)})`,
  };
}

/* ==================================================================
 *  5. Cross-Group Selection (Reserved Leader Algorithm)
 * ================================================================*/

export function selectFinalCandidates(
  groupCandidates: readonly {
    groupId: string;
    leader: ExpressionScreeningGroupSelection | null;
    secondary: ExpressionScreeningGroupSelection | null;
  }[],
  config?: Config,
): {
  finalCandidates: readonly ExpressionScreeningGroupSelection[];
  reservedLeaders: readonly { groupId: string; expressionId: string }[];
  eligibleSecondaries: readonly { groupId: string; expressionId: string }[];
  rankedSecondaries: readonly { groupId: string; expressionId: string }[];
  totalCapApplied: number;
  capacityDecisions: readonly string[];
} {
  const cfg = config ?? EXPRESSION_SCREENING_CONFIG;
  const maxTotal = cfg.selection.maximumCandidatesTotal;
  const decisions: string[] = [];

  const reservedLeaders: { groupId: string; expressionId: string }[] = [];
  const leaders: ExpressionScreeningGroupSelection[] = [];
  const allSecondaries: ExpressionScreeningGroupSelection[] = [];

  for (const gc of groupCandidates) {
    if (gc.leader) {
      reservedLeaders.push({ groupId: gc.groupId, expressionId: gc.leader.expressionId });
      leaders.push(gc.leader);
    }
    if (gc.secondary) {
      allSecondaries.push(gc.secondary);
    }
  }

  decisions.push(`reserved ${reservedLeaders.length} group leader(s): ${reservedLeaders.map(l => l.expressionId).join(', ') || 'none'}`);

  const finalCandidates: ExpressionScreeningGroupSelection[] = [...leaders];

  if (finalCandidates.length >= maxTotal) {
    decisions.push(`total cap ${maxTotal} reached by reserved leaders alone, no secondary candidates eligible`);
    return {
      finalCandidates: finalCandidates.slice(0, maxTotal),
      reservedLeaders,
      eligibleSecondaries: allSecondaries.map(s => ({ groupId: s.groupId, expressionId: s.expressionId })),
      rankedSecondaries: [],
      totalCapApplied: maxTotal,
      capacityDecisions: decisions,
    };
  }

  const remainingSlots = maxTotal - finalCandidates.length;
  const eligibleSecondaries = allSecondaries.map(s => ({
    groupId: s.groupId,
    expressionId: s.expressionId,
  }));

  const rankedSecondaries = [...allSecondaries].sort((a, b) => {
    if (b.normalizedDirectScore !== a.normalizedDirectScore) return b.normalizedDirectScore - a.normalizedDirectScore;
    if (b.answeredCount !== a.answeredCount) return b.answeredCount - a.answeredCount;
    if (b.rawDirectScore !== a.rawDirectScore) return b.rawDirectScore - a.rawDirectScore;
    const orderA = getExpressionOrder(a.expressionId);
    const orderB = getExpressionOrder(b.expressionId);
    if (orderA !== orderB) return orderA - orderB;
    if (a.expressionId < b.expressionId) return -1;
    if (a.expressionId > b.expressionId) return 1;
    return 0;
  });

  let added = 0;
  for (const sec of rankedSecondaries) {
    if (added >= remainingSlots) break;

    const alreadySelected = finalCandidates.some(fc => fc.expressionId === sec.expressionId);
    if (alreadySelected) {
      decisions.push(`skipped ${sec.expressionId} already selected as leader`);
      continue;
    }

    finalCandidates.push(sec);
    added++;
  }

  const totalCap = Math.min(finalCandidates.length, maxTotal);
  const trimmedCandidates = finalCandidates.slice(0, maxTotal);
  decisions.push(`selected ${trimmedCandidates.length} final candidate(s) from ${reservedLeaders.length} group(s)`);

  return {
    finalCandidates: trimmedCandidates,
    reservedLeaders,
    eligibleSecondaries,
    rankedSecondaries: rankedSecondaries.map(s => ({ groupId: s.groupId, expressionId: s.expressionId })),
    totalCapApplied: totalCap,
    capacityDecisions: decisions,
  };
}

/* ==================================================================
 *  6. Routing Result
 * ================================================================*/

export function routeExpressionScreening(
  mode: ExpressionScreeningMode,
  advancingGroupIds: readonly string[],
  responses: readonly ExpressionScreeningResponse[],
  retryResponses?: readonly ExpressionScreeningResponse[],
  config?: Config,
): ExpressionScreeningResult {
  const cfg = config ?? EXPRESSION_SCREENING_CONFIG;

  const decisions: string[] = [];

  if (mode === 'free') {
    return {
      category: 'expression-not-assessed',
      selectedCandidates: [],
      trace: buildEmptyTrace(cfg, mode, advancingGroupIds, 'expression-not-assessed', 'free mode does not assess expressions'),
    };
  }

  if (advancingGroupIds.length === 0) {
    return {
      category: 'no-advancing-expression-group',
      selectedCandidates: [],
      trace: buildEmptyTrace(cfg, mode, advancingGroupIds, 'no-advancing-expression-group', 'no advancing expression groups'),
    };
  }

  const {
    eligibleExpressionIdsByGroup,
    duplicateExpressionIdsPrevented,
    invalidAdvancingGroupIds,
  } = getEligibleExpressions(advancingGroupIds);

  const allEligibleIds: string[] = [];
  for (const ids of Object.values(eligibleExpressionIdsByGroup)) {
    for (const id of ids) {
      allEligibleIds.push(id);
    }
  }

  const {
    screeningItemIdsByExpression,
    missingItemMappings,
    duplicateItemIdsPrevented,
  } = getAllScreeningItemsForExpressions(allEligibleIds);

  if (allEligibleIds.length === 0) {
    return {
      category: 'no-advancing-expression-group',
      selectedCandidates: [],
      trace: buildEmptyTrace(cfg, mode, advancingGroupIds, 'no-advancing-expression-group', 'no eligible expressions found'),
    };
  }

  const mergedResponses = [...responses];
  const retriedItemIds: string[] = [];
  const answeredAfterRetry: string[] = [];
  const stillSkippedAfterRetry: string[] = [];

  if (retryResponses && retryResponses.length > 0) {
    for (const rr of retryResponses) {
      mergedResponses.push(rr);
      retriedItemIds.push(rr.itemId);
      answeredAfterRetry.push(rr.itemId);
    }
  }

  const scores: ExpressionDirectScreeningScore[] = [];
  const incompleteExpressions: string[] = [];
  const incompleteReasons: string[] = [];
  const qualifyingExpressions: string[] = [];
  const rejectedExpressions: string[] = [];
  const rejectedReasons: string[] = [];

  for (const eid of allEligibleIds) {
    const score = computeExpressionDirectScore(eid, mergedResponses, cfg);
    const scoreWithGroup: ExpressionDirectScreeningScore = {
      ...score,
      groupId: findGroupIdForExpression(eid) ?? '',
    };
    scores.push(scoreWithGroup);

    if (!score.complete) {
      incompleteExpressions.push(eid);
      incompleteReasons.push(score.incompleteReason ?? 'incomplete');
    } else if (!score.qualifies) {
      rejectedExpressions.push(eid);
      rejectedReasons.push(score.incompleteReason ?? 'does not qualify');
    } else {
      qualifyingExpressions.push(eid);
    }
  }

  const initiallySkippedItemIds: string[] = [];
  const retryableSkippedItemIds: string[] = [];

  for (const eid of allEligibleIds) {
    const skipped = findRetryableSkippedItemIds(eid, responses);
    for (const s of skipped) {
      initiallySkippedItemIds.push(s);
      if (cfg.screening.retrySkippedItemsOnce) {
        if (!retriedItemIds.includes(s)) {
          retryableSkippedItemIds.push(s);
        }
      }
    }
  }

  const dedupInitiallySkipped = [...new Set(initiallySkippedItemIds)];
  const dedupRetryableSkipped = [...new Set(retryableSkippedItemIds)];

  for (const eid of allEligibleIds) {
    const items = getExpressionScreeningItems(eid);
    const responseItemIds = new Set(mergedResponses.map(r => r.itemId));
    const stillMissing = items.filter(i => !responseItemIds.has(i.id) && retriedItemIds.includes(i.id)).map(i => i.id);
    for (const sm of stillMissing) {
      if (!stillSkippedAfterRetry.includes(sm)) {
        stillSkippedAfterRetry.push(sm);
      }
    }
  }

  if (allEligibleIds.length > 0 && incompleteExpressions.length === allEligibleIds.length) {
    const finalTrace = buildFullTrace(
      cfg, mode, advancingGroupIds, invalidAdvancingGroupIds,
      eligibleExpressionIdsByGroup, duplicateExpressionIdsPrevented,
      screeningItemIdsByExpression, missingItemMappings, duplicateItemIdsPrevented,
      mergedResponses, dedupInitiallySkipped, dedupRetryableSkipped,
      retriedItemIds, answeredAfterRetry, stillSkippedAfterRetry,
      scores, incompleteExpressions, incompleteReasons,
      qualifyingExpressions, rejectedExpressions, rejectedReasons,
      [], [], [], [], [], 'insufficient-expression-evidence',
      'all eligible expressions incomplete',
    );
    return { category: 'insufficient-expression-evidence', selectedCandidates: [], trace: finalTrace };
  }

  if (qualifyingExpressions.length === 0) {
    const finalTrace = buildFullTrace(
      cfg, mode, advancingGroupIds, invalidAdvancingGroupIds,
      eligibleExpressionIdsByGroup, duplicateExpressionIdsPrevented,
      screeningItemIdsByExpression, missingItemMappings, duplicateItemIdsPrevented,
      mergedResponses, dedupInitiallySkipped, dedupRetryableSkipped,
      retriedItemIds, answeredAfterRetry, stillSkippedAfterRetry,
      scores, incompleteExpressions, incompleteReasons,
      qualifyingExpressions, rejectedExpressions, rejectedReasons,
      [], [], [], [], [], 'no-clear-expression',
      'no qualifying expressions',
    );
    return { category: 'no-clear-expression', selectedCandidates: [], trace: finalTrace };
  }

  const qualifyingScoresByGroup = groupQualifyingScores(scores, qualifyingExpressions);
  const perGroupRankings: PerGroupRankingEntry[] = [];
  const groupCandidatesList: {
    groupId: string;
    leader: ExpressionScreeningGroupSelection | null;
    secondary: ExpressionScreeningGroupSelection | null;
  }[] = [];

  for (const groupIdStr of Object.keys(eligibleExpressionIdsByGroup)) {
    const qScores = qualifyingScoresByGroup[groupIdStr] ?? [];
    const groupResult = selectGroupCandidates(groupIdStr, qScores, cfg);

    const rankedIds = rankExpressionScores(qScores).map(s => s.expressionId);
    perGroupRankings.push({
      groupId: groupIdStr,
      rankedExpressionIds: rankedIds,
      leaderExpressionId: groupResult.leader?.expressionId ?? null,
      secondaryExpressionId: groupResult.secondary?.expressionId ?? null,
      closeBandDecision: groupResult.closeBandDecision,
    });

    groupCandidatesList.push({
      groupId: groupIdStr,
      leader: groupResult.leader,
      secondary: groupResult.secondary,
    });
  }

  const {
    finalCandidates,
    reservedLeaders,
    eligibleSecondaries,
    rankedSecondaries,
    totalCapApplied,
    capacityDecisions,
  } = selectFinalCandidates(groupCandidatesList, cfg);

  let finalCategory: ExpressionScreeningCategory;
  let finalReason: string;

  if (finalCandidates.length === 0) {
    finalCategory = 'no-clear-expression';
    finalReason = 'no candidates after cross-group selection';
  } else if (finalCandidates.length === 1) {
    finalCategory = 'one-expression-candidate';
    finalReason = `single candidate: ${finalCandidates[0].expressionId}`;
  } else {
    finalCategory = 'expression-candidates-selected';
    finalReason = `${finalCandidates.length} candidate(s) selected`;
  }

  const finalCandidateIdList = finalCandidates.map(c => c.expressionId);
  const finalTrace = buildFullTrace(
    cfg, mode, advancingGroupIds, invalidAdvancingGroupIds,
    eligibleExpressionIdsByGroup, duplicateExpressionIdsPrevented,
    screeningItemIdsByExpression, missingItemMappings, duplicateItemIdsPrevented,
    mergedResponses, dedupInitiallySkipped, dedupRetryableSkipped,
    retriedItemIds, answeredAfterRetry, stillSkippedAfterRetry,
    scores, incompleteExpressions, incompleteReasons,
    qualifyingExpressions, rejectedExpressions, rejectedReasons,
    perGroupRankings, reservedLeaders, eligibleSecondaries,
    rankedSecondaries, capacityDecisions, finalCategory, finalReason,
    finalCandidateIdList,
  );

  return {
    category: finalCategory,
    selectedCandidates: finalCandidates,
    trace: finalTrace,
  };
}

/* ==================================================================
 *  7. Helpers
 * ================================================================*/

function findGroupIdForExpression(expressionId: string): string | undefined {
  for (const group of EXPRESSION_SCREENING_GROUPS) {
    if (group.expressionIds.includes(expressionId)) {
      return group.id;
    }
  }
  return undefined;
}

function groupQualifyingScores(
  scores: readonly ExpressionDirectScreeningScore[],
  qualifyingExpressionIds: readonly string[],
): Record<string, ExpressionDirectScreeningScore[]> {
  const qualifyingSet = new Set(qualifyingExpressionIds);
  const result: Record<string, ExpressionDirectScreeningScore[]> = {};

  for (const score of scores) {
    if (!qualifyingSet.has(score.expressionId)) continue;
    const gid = findGroupIdForExpression(score.expressionId) ?? 'unknown';
    if (!result[gid]) result[gid] = [];
    result[gid].push(score);
  }

  return result;
}

function buildEmptyTrace(
  cfg: Config,
  mode: ExpressionScreeningMode,
  advancingGroupIds: readonly string[],
  category: ExpressionScreeningCategory,
  reason: string,
): ExpressionScreeningTrace {
  return {
    configVersion: cfg.configVersion,
    mode,
    advancingGroupIds: [...advancingGroupIds],
    invalidAdvancingGroupIds: [],
    eligibleExpressionIdsByGroup: {},
    duplicateExpressionIdsPrevented: [],
    screeningItemIdsByExpression: {},
    duplicateItemIdsPrevented: [],
    missingItemMappings: [],
    responses: [],
    initiallySkippedItemIds: [],
    retryableSkippedItemIds: [],
    retriedItemIds: [],
    answeredAfterRetryItemIds: [],
    stillSkippedAfterRetryItemIds: [],
    rawDirectScores: {},
    normalizedDirectScores: {},
    answeredCounts: {},
    incompleteExpressions: [],
    incompleteExpressionReasons: [],
    qualifyingExpressions: [],
    rejectedExpressions: [],
    rejectedExpressionReasons: [],
    perGroupRankings: [],
    reservedLeaders: [],
    eligibleSecondaryCandidates: [],
    rankedSecondaryCandidates: [],
    totalCapDecisions: [],
    duplicatePreventionDecisions: [],
    capacityDecisions: [],
    finalCandidateIds: [],
    finalCategory: category,
    finalReason: reason,
    deterministicDecisionMessages: [reason],
  };
}

function buildFullTrace(
  cfg: Config,
  mode: ExpressionScreeningMode,
  advancingGroupIds: readonly string[],
  invalidAdvancingGroupIds: readonly string[],
  eligibleExpressionIdsByGroup: Record<string, readonly string[]>,
  duplicateExpressionIdsPrevented: readonly string[],
  screeningItemIdsByExpression: Record<string, readonly string[]>,
  missingItemMappings: readonly string[],
  duplicateItemIdsPrevented: readonly string[],
  responses: readonly ExpressionScreeningResponse[],
  initiallySkippedItemIds: readonly string[],
  retryableSkippedItemIds: readonly string[],
  retriedItemIds: readonly string[],
  answeredAfterRetryItemIds: readonly string[],
  stillSkippedAfterRetryItemIds: readonly string[],
  scores: readonly ExpressionDirectScreeningScore[],
  incompleteExpressions: readonly string[],
  incompleteExpressionReasons: readonly string[],
  qualifyingExpressions: readonly string[],
  rejectedExpressions: readonly string[],
  rejectedExpressionReasons: readonly string[],
  perGroupRankings: readonly PerGroupRankingEntry[],
  reservedLeaders: readonly { groupId: string; expressionId: string }[],
  eligibleSecondaryCandidates: readonly { groupId: string; expressionId: string }[],
  rankedSecondaryCandidates: readonly { groupId: string; expressionId: string }[],
  capacityDecisions: readonly string[],
  finalCategory: ExpressionScreeningCategory,
  finalReason: string,
  finalCandidateIds?: readonly string[],
): ExpressionScreeningTrace {
  const rawDirectScores: Record<string, number> = {};
  const normalizedDirectScores: Record<string, number | null> = {};
  const answeredCounts: Record<string, number> = {};

  for (const s of scores) {
    rawDirectScores[s.expressionId] = s.rawDirectScore;
    normalizedDirectScores[s.expressionId] = s.normalizedDirectScore;
    answeredCounts[s.expressionId] = s.answeredCount;
  }

  const duplicateDecisions: string[] = [];
  if (duplicateExpressionIdsPrevented.length > 0) {
    duplicateDecisions.push(`prevented duplicate expression IDs: ${duplicateExpressionIdsPrevented.join(', ')}`);
  }
  if (duplicateItemIdsPrevented.length > 0) {
    duplicateDecisions.push(`prevented duplicate item IDs: ${duplicateItemIdsPrevented.join(', ')}`);
  }

  const totalCapDecisions: string[] = [];

  const finalCandidatesForTrace = finalCandidateIds ?? [];

  return {
    configVersion: cfg.configVersion,
    mode,
    advancingGroupIds: [...advancingGroupIds],
    invalidAdvancingGroupIds: [...invalidAdvancingGroupIds],
    eligibleExpressionIdsByGroup: { ...eligibleExpressionIdsByGroup },
    duplicateExpressionIdsPrevented: [...duplicateExpressionIdsPrevented],
    screeningItemIdsByExpression: { ...screeningItemIdsByExpression },
    duplicateItemIdsPrevented: [...duplicateItemIdsPrevented],
    missingItemMappings: [...missingItemMappings],
    responses: responses.map(r => ({ itemId: r.itemId, selectedValue: r.selectedValue })),
    initiallySkippedItemIds: [...initiallySkippedItemIds],
    retryableSkippedItemIds: [...retryableSkippedItemIds],
    retriedItemIds: [...retriedItemIds],
    answeredAfterRetryItemIds: [...answeredAfterRetryItemIds],
    stillSkippedAfterRetryItemIds: [...stillSkippedAfterRetryItemIds],
    rawDirectScores,
    normalizedDirectScores,
    answeredCounts,
    incompleteExpressions: [...incompleteExpressions],
    incompleteExpressionReasons: [...incompleteExpressionReasons],
    qualifyingExpressions: [...qualifyingExpressions],
    rejectedExpressions: [...rejectedExpressions],
    rejectedExpressionReasons: [...rejectedExpressionReasons],
    perGroupRankings: perGroupRankings.map(r => ({ ...r, rankedExpressionIds: [...r.rankedExpressionIds] })),
    reservedLeaders: reservedLeaders.map(l => ({ ...l })),
    eligibleSecondaryCandidates: eligibleSecondaryCandidates.map(s => ({ ...s })),
    rankedSecondaryCandidates: rankedSecondaryCandidates.map(s => ({ ...s })),
    totalCapDecisions,
    duplicatePreventionDecisions: duplicateDecisions,
    capacityDecisions: [...capacityDecisions],
    finalCandidateIds: finalCandidatesForTrace,
    finalCategory,
    finalReason,
    deterministicDecisionMessages: [finalReason],
  };
}

/* ==================================================================
 *  8. Readiness
 * ================================================================*/

export function getExpressionScreeningReadiness(): ExpressionScreeningReadiness {
  const missing: string[] = [];

  const expressionIds = new Set(EXPRESSION_REGISTRY.map(e => e.id));
  const groupIds = new Set(EXPRESSION_SCREENING_GROUPS.map(g => g.id));
  const totalItemCount = EXPRESSION_SCREENING_ITEMS.length;
  const itemsDefined = totalItemCount > 0;

  const expectedItemCount = expressionIds.size * 2;
  if (totalItemCount !== expectedItemCount) missing.push(`expected ${expectedItemCount} items, got ${totalItemCount}`);

  const expressionItemCounts: Record<string, number> = {};
  for (const item of EXPRESSION_SCREENING_ITEMS) {
    if (!expressionItemCounts[item.expressionId]) expressionItemCounts[item.expressionId] = 0;
    expressionItemCounts[item.expressionId]++;
  }

  const missingItemExpressions = [...expressionIds].filter(eid => !expressionItemCounts[eid]);
  if (missingItemExpressions.length > 0) missing.push(`${missingItemExpressions.length} expressions have 0 screening items`);

  const allExpressionsHaveTwoItems = expressionIds.size > 0 && [...expressionIds].every(eid => {
    const count = expressionItemCounts[eid] ?? 0;
    return count === 2;
  });
  if (!allExpressionsHaveTwoItems) missing.push('not all expressions have exactly 2 items');

  const allItemsPro = EXPRESSION_SCREENING_ITEMS.every(i => i.access === 'pro');
  if (!allItemsPro) missing.push('not all items are pro access');

  const noReverseScored = EXPRESSION_SCREENING_ITEMS.every(i => i.reverseScored === false);
  if (!noReverseScored) missing.push('reverse-scored items found');

  const everyItemMapsToValidExpression = EXPRESSION_SCREENING_ITEMS.every(i => expressionIds.has(i.expressionId));
  if (!everyItemMapsToValidExpression) missing.push('item maps to invalid expression');

  const everyItemMapsToValidGroup = EXPRESSION_SCREENING_ITEMS.every(i => groupIds.has(i.groupId));
  if (!everyItemMapsToValidGroup) missing.push('item maps to invalid group');

  const allPromptsNonEmpty = EXPRESSION_SCREENING_ITEMS.every(i => i.prompt.trim().length > 0);
  if (!allPromptsNonEmpty) missing.push('some item prompts are empty');

  const itemNumbersCorrect = EXPRESSION_SCREENING_ITEMS.filter(i => {
    const eid = i.expressionId;
    const expressionItems = EXPRESSION_SCREENING_ITEMS.filter(x => x.expressionId === eid);
    const numbers = expressionItems.map(x => x.itemNumber).sort();
    return numbers.length === 2 && numbers[0] === 1 && numbers[1] === 2;
  }).length === totalItemCount;
  if (!itemNumbersCorrect && itemsDefined) missing.push('item numbers not 1 and 2 per expression');

  if (!itemsDefined) missing.push('no screening items defined');

  const ready = itemsDefined &&
    allExpressionsHaveTwoItems &&
    totalItemCount === expectedItemCount &&
    allItemsPro &&
    noReverseScored &&
    everyItemMapsToValidExpression &&
    everyItemMapsToValidGroup &&
    itemNumbersCorrect &&
    allPromptsNonEmpty;

  return {
    itemsDefined,
    allExpressionsHaveTwoItems,
    totalItemCount,
    allItemsPro,
    noReverseScored,
    everyItemMapsToValidExpression,
    everyItemMapsToValidGroup,
    itemNumbersCorrect,
    allPromptsNonEmpty,
    scoringFunctionsExist: true,
    selectionFunctionsExist: true,
    retryHandlingExists: true,
    serializableTraceExists: true,
    validationSuitePasses: false,
    ready,
    missingRequirements: missing,
  };
}
