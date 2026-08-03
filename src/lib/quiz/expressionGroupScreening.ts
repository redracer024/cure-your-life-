import {
  EXPRESSION_SCREENING_GROUPS,
} from '../../data/quiz/expressionScreeningGroups';
import {
  EXPRESSION_GROUP_SCREENING_ITEMS,
} from '../../data/quiz/expressionGroupScreeningItems';
import {
  EXPRESSION_GROUP_SCREENING_CONFIG,
} from '../../data/quiz/expressionGroupScreeningConfig';
import {
  APPROVED_QUIZ_ITEMS,
} from '../../data/quiz/approvedQuestions';
import {
  CORE_PATTERN_IDS,
  STRATEGY_PATTERN_IDS,
} from '../../data/quiz/patternTaxonomy';
import type { ExpressionScreeningGroup } from '../../types/expressionGrouping';
import type { PatternQuizResult, ApprovedQuizItem } from '../../types/quiz';
import type {
  ExpressionGroupScreeningMode,
  ExpressionParentBranch,
  ExpressionGroupDirectScore,
  ExpressionGroupEligibilityResult,
  ExpressionGroupSelection,
  ExpressionGroupRoutingCategory,
  ExpressionGroupRoutingResult,
  ExpressionGroupRoutingTrace,
  ExpressionGroupScreeningReadiness,
} from '../../types/expressionGroupScreening';

type Config = typeof EXPRESSION_GROUP_SCREENING_CONFIG;

/* ==================================================================
 *  Helpers
 * ================================================================*/

function computeDirectAverage(
  responses: Record<string, number>,
  itemIds: readonly string[],
): { normalizedScore: number; answeredCount: number; answeredItemIds: readonly string[]; skippedItemIds: readonly string[] } {
  const answered: string[] = [];
  const skipped: string[] = [];
  for (const id of itemIds) {
    if (id in responses) {
      answered.push(id);
    } else {
      skipped.push(id);
    }
  }
  if (answered.length === 0) {
    return { normalizedScore: 0, answeredCount: 0, answeredItemIds: [], skippedItemIds: skipped };
  }
  const sum = answered.reduce((acc, id) => acc + responses[id], 0);
  return {
    normalizedScore: sum / answered.length,
    answeredCount: answered.length,
    answeredItemIds: answered,
    skippedItemIds: skipped,
  };
}

function coreItemIds(): string[] {
  return APPROVED_QUIZ_ITEMS
    .filter(i => i.layer === 'core')
    .map(i => i.id);
}

function strategyItemIds(): string[] {
  return APPROVED_QUIZ_ITEMS
    .filter(i => i.layer === 'strategy')
    .map(i => i.id);
}

function getItemsForGroup(groupId: string): readonly (typeof EXPRESSION_GROUP_SCREENING_ITEMS)[number][] {
  return EXPRESSION_GROUP_SCREENING_ITEMS.filter(i => i.groupId === groupId);
}

/* ==================================================================
 *  1. Parent-branch selection
 * ================================================================*/

export function selectExpressionCoreParentBranch(
  result: PatternQuizResult,
  responses: Record<string, number>,
  config: Config,
): ExpressionParentBranch | null {
  if (!result.core) return null;
  const ids = coreItemIds();
  const { normalizedScore, answeredCount } = computeDirectAverage(responses, ids);
  if (answeredCount < config.parentSelection.minimumCoreAnsweredItems) return null;
  if (normalizedScore < config.parentSelection.minimumCoreDirectScore) return null;
  return {
    parentId: result.core.id,
    parentType: 'core',
    normalizedDirectScore: normalizedScore,
    answeredItemCount: answeredCount,
  };
}

export function selectExpressionStrategyParentBranch(
  result: PatternQuizResult,
  responses: Record<string, number>,
  config: Config,
): ExpressionParentBranch | null {
  if (!result.strategy) return null;
  const ids = strategyItemIds();
  const { normalizedScore, answeredCount } = computeDirectAverage(responses, ids);
  if (answeredCount < config.parentSelection.minimumStrategyAnsweredItems) return null;
  if (normalizedScore < config.parentSelection.minimumStrategyDirectScore) return null;
  return {
    parentId: result.strategy.id,
    parentType: 'strategy',
    normalizedDirectScore: normalizedScore,
    answeredItemCount: answeredCount,
  };
}

export function selectExpressionParentBranches(
  mode: ExpressionGroupScreeningMode,
  result: PatternQuizResult,
  responses: Record<string, number>,
  config: Config = EXPRESSION_GROUP_SCREENING_CONFIG,
): {
  branches: readonly ExpressionParentBranch[];
  rejectedReasons: readonly string[];
} {
  if (mode === 'free') {
    return { branches: [], rejectedReasons: ['expression-not-assessed for free mode'] };
  }
  const rejectedReasons: string[] = [];
  const branches: ExpressionParentBranch[] = [];

  const coreBranch = selectExpressionCoreParentBranch(result, responses, config);
  if (coreBranch) {
    branches.push(coreBranch);
  } else {
    rejectedReasons.push(result.core
      ? 'core parent below eligibility threshold'
      : 'no primary core result');
  }

  const strategyBranch = selectExpressionStrategyParentBranch(result, responses, config);
  if (strategyBranch) {
    branches.push(strategyBranch);
  } else {
    rejectedReasons.push(result.strategy
      ? 'strategy parent below eligibility threshold'
      : 'no primary strategy result');
  }

  const maxTotal = config.parentSelection.maximumTotalBranches;
  if (branches.length > maxTotal) {
    const removed = branches.splice(maxTotal, branches.length - maxTotal);
    for (const r of removed) {
      rejectedReasons.push(`${r.parentId} removed due to maximum branch limit`);
    }
  }

  return { branches, rejectedReasons };
}

/* ==================================================================
 *  2. Group retrieval
 * ================================================================*/

export function getGroupsForExpressionParent(parentId: string): readonly ExpressionScreeningGroup[] {
  return EXPRESSION_SCREENING_GROUPS.filter(g => g.parentId === parentId);
}

export function getGroupsForSelectedExpressionParents(
  parents: readonly ExpressionParentBranch[],
): readonly ExpressionScreeningGroup[] {
  const parentIds = new Set<string>(parents.map(p => p.parentId));
  return EXPRESSION_SCREENING_GROUPS.filter(g => parentIds.has(g.parentId));
}

/* ==================================================================
 *  3. Item IDs
 * ================================================================*/

export function getGroupScreeningItemIds(groupId: string): readonly string[] {
  return getItemsForGroup(groupId).map(i => i.id);
}

export function getRetryableGroupScreeningItems(
  groupId: string,
  answeredItemIds: ReadonlySet<string>,
  skippedItemIds: ReadonlySet<string>,
): readonly string[] {
  return getItemsForGroup(groupId)
    .filter(i => skippedItemIds.has(i.id))
    .map(i => i.id);
}

/* ==================================================================
 *  4. Group scoring
 * ================================================================*/

export function scoreExpressionGroupDirectEvidence(
  groupId: string,
  responseValues: readonly number[],
): ExpressionGroupDirectScore {
  const answeredCount = responseValues.length;
  const rawDirectScore = responseValues.reduce((s, v) => s + v, 0);
  const normalizedDirectScore = answeredCount > 0 ? rawDirectScore / answeredCount : null;
  return {
    groupId,
    rawDirectScore,
    answeredCount,
    normalizedDirectScore,
  };
}

function scoreGroupFromResponses(
  group: ExpressionScreeningGroup,
  responses: Record<string, number>,
): ExpressionGroupDirectScore {
  const itemIds = getGroupScreeningItemIds(group.id);
  const values: number[] = [];
  for (const id of itemIds) {
    if (id in responses) {
      values.push(responses[id]);
    }
  }
  return scoreExpressionGroupDirectEvidence(group.id, values);
}

export function scoreExpressionGroupsForParent(
  parentId: string,
  responses: Record<string, number>,
): readonly ExpressionGroupDirectScore[] {
  const groups = getGroupsForExpressionParent(parentId);
  return groups.map(g => scoreGroupFromResponses(g, responses));
}

/* ==================================================================
 *  5. Ranking and group selection
 * ================================================================*/

export function rankExpressionGroupsWithinParent(
  scores: readonly ExpressionGroupDirectScore[],
): readonly ExpressionGroupDirectScore[] {
  return [...scores].sort((a, b) => {
    const na = a.normalizedDirectScore ?? 0;
    const nb = b.normalizedDirectScore ?? 0;
    if (nb !== na) return nb - na;
    if (b.answeredCount !== a.answeredCount) return b.answeredCount - a.answeredCount;
    if (b.rawDirectScore !== a.rawDirectScore) return b.rawDirectScore - a.rawDirectScore;
    const ga = EXPRESSION_SCREENING_GROUPS.find(g => g.id === a.groupId);
    const gb = EXPRESSION_SCREENING_GROUPS.find(g => g.id === b.groupId);
    const oa = ga?.groupOrder ?? 0;
    const ob = gb?.groupOrder ?? 0;
    if (oa !== ob) return oa - ob;
    if (a.groupId < b.groupId) return -1;
    if (a.groupId > b.groupId) return 1;
    return 0;
  });
}

function groupQualifies(
  score: ExpressionGroupDirectScore,
  config: Config,
): boolean {
  if (score.answeredCount < config.screening.minimumAnsweredItems) return false;
  if (score.answeredCount !== 2) return false;
  if (score.rawDirectScore < config.screening.minimumRawDirectScore) return false;
  if (score.normalizedDirectScore === null) return false;
  if (score.normalizedDirectScore < config.screening.minimumNormalizedDirectScore) return false;
  return true;
}

export function selectAdvancingGroupsForParent(
  parentId: string,
  responses: Record<string, number>,
  config: Config = EXPRESSION_GROUP_SCREENING_CONFIG,
): {
  selections: readonly ExpressionGroupSelection[];
  incompleteGroups: readonly string[];
  incompleteGroupReasons: readonly string[];
} {
  const groups = getGroupsForExpressionParent(parentId);
  const scores = groups.map(g => scoreGroupFromResponses(g, responses));
  const ranked = rankExpressionGroupsWithinParent(scores);

  const incompleteGroups: string[] = [];
  const incompleteGroupReasons: string[] = [];
  const qualifying: ExpressionGroupDirectScore[] = [];

  for (const score of ranked) {
    if (score.answeredCount < 2) {
      incompleteGroups.push(score.groupId);
      incompleteGroupReasons.push(`answered ${score.answeredCount}/2`);
      continue;
    }
    if (groupQualifies(score, config)) {
      qualifying.push(score);
    }
  }

  if (qualifying.length === 0) {
    return { selections: [], incompleteGroups, incompleteGroupReasons };
  }

  const selections: ExpressionGroupSelection[] = [];
  const leaderScore = qualifying[0];
  const leaderGroup = EXPRESSION_SCREENING_GROUPS.find(g => g.id === leaderScore.groupId)!;

  selections.push({
    groupId: leaderScore.groupId,
    parentId,
    parentType: leaderGroup.parentType,
    normalizedDirectScore: leaderScore.normalizedDirectScore!,
    rawDirectScore: leaderScore.rawDirectScore,
    answeredCount: leaderScore.answeredCount,
    groupOrder: leaderGroup.groupOrder,
    isLeader: true,
  });

  const closeBand = config.selection.additionalGroupCloseBandPoints;
  const maxPerParent = config.selection.maximumGroupsPerParent;
  for (let i = 1; i < qualifying.length && selections.length < maxPerParent; i++) {
    const candidate = qualifying[i];
    const diff = (leaderScore.normalizedDirectScore!) - (candidate.normalizedDirectScore!);
    if (diff > closeBand) break;
    const cg = EXPRESSION_SCREENING_GROUPS.find(g => g.id === candidate.groupId)!;
    selections.push({
      groupId: candidate.groupId,
      parentId,
      parentType: cg.parentType,
      normalizedDirectScore: candidate.normalizedDirectScore!,
      rawDirectScore: candidate.rawDirectScore,
      answeredCount: candidate.answeredCount,
      groupOrder: cg.groupOrder,
      isLeader: false,
    });
  }

  return { selections, incompleteGroups, incompleteGroupReasons };
}

/* ==================================================================
 *  6. Final cross-parent selection
 * ================================================================*/

export function selectFinalAdvancingGroups(
  perParentSelections: readonly (readonly ExpressionGroupSelection[])[],
  config: Config = EXPRESSION_GROUP_SCREENING_CONFIG,
): {
  finalGroups: readonly ExpressionGroupSelection[];
  decisions: readonly string[];
} {
  const decisions: string[] = [];
  const maxTotal = config.selection.maximumGroupsTotal;
  const maxPerParent = config.selection.maximumGroupsPerParent;

  const allSelections = perParentSelections.flat();
  if (allSelections.length === 0) {
    decisions.push('no qualifying groups from any parent');
    return { finalGroups: [], decisions };
  }

  const parentIds = new Set(allSelections.map(s => s.parentId));

  const reservedLeaders: ExpressionGroupSelection[] = [];
  const additionalCandidates: ExpressionGroupSelection[] = [];

  for (const pid of parentIds) {
    const parentGroups = allSelections.filter(s => s.parentId === pid);
    const leader = parentGroups.find(s => s.isLeader);
    if (leader) {
      reservedLeaders.push(leader);
      decisions.push(`reserved leader ${leader.groupId} for parent ${pid}`);
    }
    const others = parentGroups.filter(s => !s.isLeader);
    for (const o of others) {
      additionalCandidates.push(o);
    }
  }

  const selected = new Map<string, ExpressionGroupSelection>();
  for (const rl of reservedLeaders) {
    selected.set(rl.groupId, rl);
  }

  if (reservedLeaders.length === 1) {
    const pid = reservedLeaders[0].parentId;
    const siblings = allSelections.filter(s => s.parentId === pid && !s.isLeader);
    for (const sib of siblings) {
      if (selected.size >= maxTotal) {
        decisions.push(`total cap ${maxTotal} reached, cannot add ${sib.groupId}`);
        break;
      }
      if (selected.size >= maxPerParent) {
        decisions.push(`per-parent cap ${maxPerParent} reached, cannot add ${sib.groupId}`);
        break;
      }
      selected.set(sib.groupId, sib);
      decisions.push(`added sibling ${sib.groupId} under same parent`);
    }
  } else if (reservedLeaders.length === 2) {
    const remainingSlots = maxTotal - selected.size;
    decisions.push(`${reservedLeaders.length} leaders reserved, ${remainingSlots} slots remaining`);

    const rankedAdditional = [...additionalCandidates].sort((a, b) => {
      if (b.normalizedDirectScore !== a.normalizedDirectScore) return b.normalizedDirectScore - a.normalizedDirectScore;
      if (b.answeredCount !== a.answeredCount) return b.answeredCount - a.answeredCount;
      if (b.rawDirectScore !== a.rawDirectScore) return b.rawDirectScore - a.rawDirectScore;
      if (a.groupId < b.groupId) return -1;
      if (a.groupId > b.groupId) return 1;
      return 0;
    });

    let slot = 0;
    for (const add of rankedAdditional) {
      if (slot >= remainingSlots) {
        decisions.push(`total cap ${maxTotal} reached, cannot add ${add.groupId}`);
        break;
      }
      if (selected.has(add.groupId)) {
        decisions.push(`duplicate prevention: ${add.groupId} already selected`);
        continue;
      }
      const pid = add.parentId;
      const alreadyForParent = [...selected.values()].filter(s => s.parentId === pid).length;
      if (alreadyForParent >= maxPerParent) {
        decisions.push(`per-parent cap ${maxPerParent} for ${pid}, cannot add ${add.groupId}`);
        continue;
      }
      selected.set(add.groupId, add);
      slot++;
      decisions.push(`added additional group ${add.groupId} to fill slot ${slot}`);
    }
  }

  const finalGroups = [...selected.values()];
  decisions.push(`final selected groups: ${finalGroups.map(g => g.groupId).join(', ')}`);
  return { finalGroups, decisions };
}

/* ==================================================================
 *  7. Routing result
 * ================================================================*/

function determineCategory(
  branches: readonly ExpressionParentBranch[],
  finalGroups: readonly ExpressionGroupSelection[],
  allIncomplete: readonly string[],
  mode: ExpressionGroupScreeningMode,
): { category: ExpressionGroupRoutingCategory; reason: string } {
  if (mode === 'free') {
    return { category: 'expression-not-assessed', reason: 'Expression screening is not available in free mode' };
  }
  if (branches.length === 0) {
    return { category: 'no-eligible-expression-parent', reason: 'No eligible Core or Strategy parent branch' };
  }
  if (allIncomplete.length > 0 && finalGroups.length === 0) {
    const stillIncomplete = allIncomplete.filter(id =>
      !finalGroups.some(fg => fg.groupId === id)
    );
    if (stillIncomplete.length > 0 && finalGroups.length === 0) {
      return { category: 'insufficient-group-evidence', reason: `${stillIncomplete.length} group(s) incomplete due to missing answers` };
    }
  }
  if (finalGroups.length === 0) {
    return { category: 'no-clear-group', reason: 'No groups met the qualifying score thresholds' };
  }
  if (finalGroups.length === 1) {
    return { category: 'one-group-selected', reason: `One group selected: ${finalGroups[0].groupId}` };
  }
  return { category: 'groups-selected', reason: `${finalGroups.length} groups selected for expression screening` };
}

export function produceExpressionGroupRoutingResult(
  finalGroups: readonly ExpressionGroupSelection[],
  category: ExpressionGroupRoutingCategory,
  trace: ExpressionGroupRoutingTrace,
): ExpressionGroupRoutingResult {
  const screeningItemIds: string[] = [];
  for (const g of finalGroups) {
    const items = getGroupScreeningItemIds(g.groupId);
    for (const id of items) {
      screeningItemIds.push(id);
    }
  }

  return {
    category,
    selectedGroups: finalGroups,
    screeningItemIds,
    trace,
  };
}

export function explainExpressionGroupRoutingDecision(
  category: ExpressionGroupRoutingCategory,
  finalGroups: readonly ExpressionGroupSelection[],
  trace: ExpressionGroupRoutingTrace,
): string {
  const parts: string[] = [];
  parts.push(`Category: ${category}`);
  if (finalGroups.length > 0) {
    parts.push(`Selected groups: ${finalGroups.map(g => `${g.groupId}${g.isLeader ? ' (leader)' : ''}`).join(', ')}`);
  }
  if (trace.finalReason) {
    parts.push(`Reason: ${trace.finalReason}`);
  }
  return parts.join(' | ');
}

/* ==================================================================
 *  8. Trace
 * ================================================================*/

export function createExpressionGroupRoutingTrace(
  mode: ExpressionGroupScreeningMode,
  configVersion: string,
  coreResultSummary: { hasPrimary: boolean; primaryId: string | null; normalizedScore: number; rawScore: number },
  strategyResultSummary: { hasPrimary: boolean; primaryId: string | null; normalizedScore: number; rawScore: number },
  branches: readonly ExpressionParentBranch[],
  rejectedReasons: readonly string[],
  responses: Record<string, number>,
  allCompletedItemIds: readonly string[],
  perParentSelections: readonly (readonly ExpressionGroupSelection[])[],
  incompleteGroups: readonly string[],
  incompleteGroupReasons: readonly string[],
  finalGroups: readonly ExpressionGroupSelection[],
  category: ExpressionGroupRoutingCategory,
  finalReason: string,
  decisions: readonly string[],
): ExpressionGroupRoutingTrace {
  const answeredItemIds = Object.keys(responses);
  const skippedItemIds = allCompletedItemIds.filter(id => !(id in responses));

  const availableGroupsByParent: Record<string, readonly string[]> = {};
  for (const branch of branches) {
    availableGroupsByParent[branch.parentId] = getGroupsForExpressionParent(branch.parentId).map(g => g.id);
  }

  const expectedScreeningItemIds: string[] = [];
  for (const g of EXPRESSION_SCREENING_GROUPS) {
    const items = getGroupScreeningItemIds(g.id);
    for (const id of items) {
      expectedScreeningItemIds.push(id);
    }
  }

  const rawScoresByGroup: Record<string, number> = {};
  const normalizedScoresByGroup: Record<string, number> = {};
  const answeredCountsByGroup: Record<string, number> = {};
  for (const g of EXPRESSION_SCREENING_GROUPS) {
    const score = scoreGroupFromResponses(g, responses);
    rawScoresByGroup[g.id] = score.rawDirectScore;
    normalizedScoresByGroup[g.id] = score.normalizedDirectScore ?? 0;
    answeredCountsByGroup[g.id] = score.answeredCount;
  }

  const retryableSkippedItemIds: string[] = [];
  const retriedItemIds: string[] = [];
  for (const g of EXPRESSION_SCREENING_GROUPS) {
    const items = getItemsForGroup(g.id);
    for (const item of items) {
      if (skippedItemIds.includes(item.id)) {
        retryableSkippedItemIds.push(item.id);
      }
    }
  }

  const qualifyingGroups: string[] = [];
  for (const g of EXPRESSION_SCREENING_GROUPS) {
    const score = scoreGroupFromResponses(g, responses);
    if (groupQualifies(score, EXPRESSION_GROUP_SCREENING_CONFIG)) {
      qualifyingGroups.push(g.id);
    }
  }

  const perParentRankings: { parentId: string; rankedGroupIds: readonly string[] }[] = [];
  const perParentLeaders: { parentId: string; leaderGroupId: string | null }[] = [];
  for (const branch of branches) {
    const scores = scoreExpressionGroupsForParent(branch.parentId, responses);
    const ranked = rankExpressionGroupsWithinParent(scores);
    perParentRankings.push({ parentId: branch.parentId, rankedGroupIds: ranked.map(s => s.groupId) });
    const leader = finalGroups.find(g => g.parentId === branch.parentId && g.isLeader);
    perParentLeaders.push({ parentId: branch.parentId, leaderGroupId: leader?.groupId ?? null });
  }

  const eligibleAdditionalGroups: string[] = [];
  for (const g of finalGroups) {
    if (!g.isLeader) {
      eligibleAdditionalGroups.push(g.groupId);
    }
  }

  const reservedLeaders = finalGroups.filter(g => g.isLeader).map(g => g.groupId);

  const selectedParentBranches = branches.map(b => ({
    parentId: b.parentId,
    parentType: b.parentType,
    normalizedDirectScore: b.normalizedDirectScore,
    answeredItemCount: b.answeredItemCount,
  }));

  return {
    configVersion,
    mode,
    receivedCoreResultSummary: coreResultSummary,
    receivedStrategyResultSummary: strategyResultSummary,
    selectedCoreParent: branches.find(b => b.parentType === 'core')?.parentId ?? null,
    selectedStrategyParent: branches.find(b => b.parentType === 'strategy')?.parentId ?? null,
    rejectedParentReasons: rejectedReasons,
    selectedParentBranches,
    availableGroupsByParent,
    expectedScreeningItemIds,
    answeredItemIds,
    skippedItemIds,
    retryableSkippedItemIds,
    retriedItemIds,
    rawScoresByGroup,
    normalizedScoresByGroup,
    answeredCountsByGroup,
    incompleteGroups,
    incompleteGroupReasons,
    qualifyingGroups,
    perParentRankings,
    perParentLeaders,
    eligibleAdditionalGroups,
    reservedLeaders,
    totalCapDecisions: decisions.filter(d => d.includes('cap') || d.includes('slot')),
    duplicatePreventionDecisions: decisions.filter(d => d.includes('duplicate')),
    finalSelectedGroups: finalGroups.map(g => g.groupId),
    finalCategory: category,
    finalReason,
  };
}

/* ==================================================================
 *  9. Top-level routing function
 * ================================================================*/

export function routeExpressionGroupScreening(
  mode: ExpressionGroupScreeningMode,
  result: PatternQuizResult,
  responses: Record<string, number>,
  allItemIds: readonly string[],
  config: Config = EXPRESSION_GROUP_SCREENING_CONFIG,
): ExpressionGroupRoutingResult {
  const { branches, rejectedReasons } = selectExpressionParentBranches(mode, result, responses, config);

  const coreResultSummary = {
    hasPrimary: result.core !== null,
    primaryId: result.core?.id ?? null,
    normalizedScore: result.core?.normalizedScore ?? 0,
    rawScore: result.core?.rawScore ?? 0,
  };

  const strategyResultSummary = {
    hasPrimary: result.strategy !== null,
    primaryId: result.strategy?.id ?? null,
    normalizedScore: result.strategy?.normalizedScore ?? 0,
    rawScore: result.strategy?.rawScore ?? 0,
  };

  const allIncompleteGroups: string[] = [];
  const allIncompleteReasons: string[] = [];
  const perParentSelections: ExpressionGroupSelection[][] = [];

  for (const branch of branches) {
    const { selections, incompleteGroups, incompleteGroupReasons } = selectAdvancingGroupsForParent(
      branch.parentId, responses, config,
    );
    for (const id of incompleteGroups) allIncompleteGroups.push(id);
    for (const r of incompleteGroupReasons) allIncompleteReasons.push(r);
    perParentSelections.push(selections as ExpressionGroupSelection[]);
  }

  const { finalGroups, decisions } = selectFinalAdvancingGroups(perParentSelections, config);

  const { category, reason } = determineCategory(branches, finalGroups, allIncompleteGroups, mode);

  const trace = createExpressionGroupRoutingTrace(
    mode,
    config.configVersion,
    coreResultSummary,
    strategyResultSummary,
    branches,
    rejectedReasons,
    responses,
    allItemIds,
    perParentSelections,
    allIncompleteGroups,
    allIncompleteReasons,
    finalGroups,
    category,
    reason,
    decisions,
  );

  return produceExpressionGroupRoutingResult(finalGroups, category, trace);
}

/* ==================================================================
 *  10. Readiness
 * ================================================================*/

export function getExpressionGroupScreeningReadiness(): ExpressionGroupScreeningReadiness {
  const missing: string[] = [];
  const totalItemCount = EXPRESSION_GROUP_SCREENING_ITEMS.length;

  const groupIds = new Set(EXPRESSION_SCREENING_GROUPS.map(g => g.id));
  const itemsDefined = totalItemCount > 0;

  const groupsWithItems = new Set(EXPRESSION_GROUP_SCREENING_ITEMS.map(i => i.groupId));
  const allGroupsHaveTwoItems = groupIds.size > 0 && [...groupIds].every(gid => {
    const groupItems = EXPRESSION_GROUP_SCREENING_ITEMS.filter(i => i.groupId === gid);
    return groupItems.length === 2;
  });
  if (!allGroupsHaveTwoItems) missing.push('not all groups have exactly 2 items');

  const expectedItemCount = groupIds.size * 2;
  if (totalItemCount !== expectedItemCount) missing.push(`expected ${expectedItemCount} items, got ${totalItemCount}`);

  const allItemsPro = EXPRESSION_GROUP_SCREENING_ITEMS.every(i => i.access === 'pro');
  if (!allItemsPro) missing.push('not all items are pro access');

  const noReverseScored = EXPRESSION_GROUP_SCREENING_ITEMS.every(i => i.reverseScored === false);
  if (!noReverseScored) missing.push('reverse-scored items found');

  const everyItemMapsToValidGroup = EXPRESSION_GROUP_SCREENING_ITEMS.every(i => groupIds.has(i.groupId));
  if (!everyItemMapsToValidGroup) missing.push('item maps to invalid group');

  const itemNumbersCorrect = EXPRESSION_GROUP_SCREENING_ITEMS.every(i => {
    const groupItems = EXPRESSION_GROUP_SCREENING_ITEMS.filter(x => x.groupId === i.groupId);
    const numbers = groupItems.map(x => x.itemNumber).sort();
    return numbers.length === 2 && numbers[0] === 1 && numbers[1] === 2;
  });
  if (!itemNumbersCorrect) missing.push('item numbers not 1 and 2 per group');

  if (!itemsDefined) missing.push('no screening items defined');

  const ready = itemsDefined &&
    allGroupsHaveTwoItems &&
    totalItemCount === expectedItemCount &&
    allItemsPro &&
    noReverseScored &&
    everyItemMapsToValidGroup &&
    itemNumbersCorrect;

  return {
    itemsDefined,
    allGroupsHaveTwoItems,
    totalItemCount,
    allItemsPro,
    noReverseScored,
    everyItemMapsToValidGroup,
    itemNumbersCorrect,
    scoringFunctionsExist: true,
    selectionFunctionsExist: true,
    retryHandlingExists: true,
    serializableTraceExists: true,
    allValidationScenariosPass: false,
    ready,
    missingRequirements: missing,
  };
}
