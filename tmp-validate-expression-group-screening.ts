import {
  EXPRESSION_GROUP_SCREENING_CONFIG,
} from './src/data/quiz/expressionGroupScreeningConfig';
import {
  EXPRESSION_GROUP_SCREENING_ITEMS,
} from './src/data/quiz/expressionGroupScreeningItems';
import {
  APPROVED_QUIZ_ITEMS,
} from './src/data/quiz/approvedQuestions';
import {
  CORE_PATTERN_IDS,
  STRATEGY_PATTERN_IDS,
} from './src/data/quiz/patternTaxonomy';
import {
  EXPRESSION_SCREENING_GROUPS,
} from './src/data/quiz/expressionScreeningGroups';
import {
  scoreExpressionGroupDirectEvidence,
  selectExpressionCoreParentBranch,
  selectExpressionStrategyParentBranch,
  selectExpressionParentBranches,
  getGroupsForExpressionParent,
  getGroupsForSelectedExpressionParents,
  getGroupScreeningItemIds,
  getRetryableGroupScreeningItems,
  scoreExpressionGroupsForParent,
  rankExpressionGroupsWithinParent,
  selectAdvancingGroupsForParent,
  selectFinalAdvancingGroups,
  produceExpressionGroupRoutingResult,
  explainExpressionGroupRoutingDecision,
  createExpressionGroupRoutingTrace,
  routeExpressionGroupScreening,
  getExpressionGroupScreeningReadiness,
} from './src/lib/quiz/expressionGroupScreening';
import type { PatternQuizResult } from './src/types/quiz';
import type { ExpressionGroupDirectScore, ExpressionGroupSelection } from './src/types/expressionGroupScreening';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function check(condition: boolean, message: string) {
  if (condition) { passed++; } else { failed++; errors.push(message); }
}

/* ==================================================================
 *  Mock helpers
 * ================================================================*/

const coreItemIds = APPROVED_QUIZ_ITEMS.filter(i => i.layer === 'core').map(i => i.id);
const strategyItemIds = APPROVED_QUIZ_ITEMS.filter(i => i.layer === 'strategy').map(i => i.id);

function coreResponses(values: number[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (let i = 0; i < Math.min(values.length, coreItemIds.length); i++) {
    r[coreItemIds[i]] = values[i];
  }
  return r;
}

function strategyResponses(values: number[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (let i = 0; i < Math.min(values.length, strategyItemIds.length); i++) {
    r[strategyItemIds[i]] = values[i];
  }
  return r;
}

function makeCoreResult(overrides?: Partial<PatternQuizResult['core']>): PatternQuizResult['core'] {
  return { id: 'silenced-one', rawScore: 30, normalizedScore: 0.85, confidence: 'high', ...overrides };
}

function makeStrategyResult(overrides?: Partial<PatternQuizResult['strategy']>): PatternQuizResult['strategy'] {
  return { id: 'martyr', rawScore: 25, normalizedScore: 0.75, confidence: 'moderate', ...overrides };
}

const emptyResult: PatternQuizResult = { core: null, strategy: null, expression: null, secondaryCores: [], secondaryStrategies: [] };

function makeFullResult(core?: PatternQuizResult['core'], strategy?: PatternQuizResult['strategy']): PatternQuizResult {
  return { core: core ?? null, strategy: strategy ?? null, expression: null, secondaryCores: [], secondaryStrategies: [] };
}

const CONFIG = EXPRESSION_GROUP_SCREENING_CONFIG;

/* ==================================================================
 *  1. Free mode returns expression-not-assessed
 * ================================================================*/

{
  const responses: Record<string, number> = {};
  for (const id of coreItemIds) responses[id] = 4;
  for (const id of strategyItemIds) responses[id] = 4;
  const result = routeExpressionGroupScreening('free', makeFullResult(makeCoreResult(), makeStrategyResult()), responses, []);
  check(result.category === 'expression-not-assessed', '1: Free mode should return expression-not-assessed');
  check(result.selectedGroups.length === 0, '1: Free mode should have no selected groups');
  check(result.screeningItemIds.length === 0, '1: Free mode should have no screening item IDs');
}

/* ==================================================================
 *  2. No eligible parent (no core, no strategy)
 * ================================================================*/

{
  const { branches, rejectedReasons } = selectExpressionParentBranches('pro', emptyResult, {}, CONFIG);
  check(branches.length === 0, '2: No branches when no core/strategy result');
  check(rejectedReasons.length >= 2, '2: Both core and strategy should be rejected');
}

/* ==================================================================
 *  3. Eligible Core only
 * ================================================================*/

{
  const responses = coreResponses([4, 4, 4, 4, 4, 4, 4, 4, 4]);
  const result = makeFullResult(makeCoreResult());
  const { branches } = selectExpressionParentBranches('pro', result, responses, CONFIG);
  check(branches.length >= 1, '3: Should select core branch');
  check(branches.some(b => b.parentType === 'core'), '3: Core branch should have core type');
  check(!branches.some(b => b.parentType === 'strategy'), '3: No strategy branch when no strategy result');
}

/* ==================================================================
 *  4. Eligible Strategy only
 * ================================================================*/

{
  const responses = { ...coreResponses([4, 4, 4, 4, 4]), ...strategyResponses([4, 4, 4, 4, 4]) };
  const result = makeFullResult(null, makeStrategyResult());
  const { branches } = selectExpressionParentBranches('pro', result, responses, CONFIG);
  check(branches.length >= 1, '4: Should select strategy branch');
  check(!branches.some(b => b.parentType === 'core'), '4: No core branch when no core result');
  check(branches.some(b => b.parentType === 'strategy'), '4: Strategy branch should have strategy type');
}

/* ==================================================================
 *  5. Eligible Core and Strategy
 * ================================================================*/

{
  const responses = { ...coreResponses([4, 4, 4, 4, 4, 4, 4, 4, 4]), ...strategyResponses([4, 4, 4, 4, 4, 4]) };
  const result = makeFullResult(makeCoreResult(), makeStrategyResult());
  const { branches } = selectExpressionParentBranches('pro', result, responses, CONFIG);
  check(branches.length === 2, '5: Both core and strategy should be selected');
  check(branches.some(b => b.parentType === 'core'), '5: Core branch present');
  check(branches.some(b => b.parentType === 'strategy'), '5: Strategy branch present');
}

/* ==================================================================
 *  6. Ineligible Core score (below 3.5)
 * ================================================================*/

{
  const responses = coreResponses([1, 1, 1, 1, 1, 1, 1, 1, 1]);
  const result = makeFullResult(makeCoreResult());
  const branch = selectExpressionCoreParentBranch(result, responses, CONFIG);
  check(branch === null, '6: Core branch should be null when average below 3.5');
}

/* ==================================================================
 *  7. Ineligible Strategy score (below 3.5)
 * ================================================================*/

{
  const responses = strategyResponses([2, 2, 2, 2, 2, 2]);
  const result = makeFullResult(null, makeStrategyResult());
  const branch = selectExpressionStrategyParentBranch(result, responses, CONFIG);
  check(branch === null, '7: Strategy branch should be null when average below 3.5');
}

/* ==================================================================
 *  8. Parent answered-count floor (minimum 5)
 * ================================================================*/

{
  const responses = coreResponses([5, 5]);
  const result = makeFullResult(makeCoreResult());
  const branch = selectExpressionCoreParentBranch(result, responses, CONFIG);
  check(branch === null, '8: Core branch should be null with only 2 answered items');
}

/* ==================================================================
 *  9. Two groups under one parent
 * ================================================================*/

{
  const silencedGroups = getGroupsForExpressionParent('silenced-one');
  check(silencedGroups.length === 2, '9: silenced-one should have 2 groups');
}

/* ==================================================================
 *  10. Four groups under one parent
 * ================================================================*/

{
  const shameGroups = getGroupsForExpressionParent('shame-bearer');
  check(shameGroups.length === 4, '10: shame-bearer should have 4 groups');
}

/* ==================================================================
 *  11. Two four-group parents
 * ================================================================*/

{
  const hyperGroups = getGroupsForExpressionParent('hypervigilant-one');
  check(hyperGroups.length === 4, '11a: hypervigilant-one should have 4 groups');
  const rescuerGroups = getGroupsForExpressionParent('rescuer');
  check(rescuerGroups.length === 4, '11b: rescuer should have 4 groups');
}

/* ==================================================================
 *  12. Responses 4 and 5 pass scoring
 * ================================================================*/

{
  const score = scoreExpressionGroupDirectEvidence('expression-group-silenced-one-conflict-suppression', [4, 5]);
  check(score.answeredCount === 2, '12a: answered count should be 2');
  check(score.rawDirectScore === 9, '12b: raw score should be 9');
  check(score.normalizedDirectScore === 4.5, '12c: normalized score should be 4.5');
}

/* ==================================================================
 *  13. Responses 2 and 2 fail (below raw 6, below normalized 3)
 * ================================================================*/

{
  const score = scoreExpressionGroupDirectEvidence('expression-group-silenced-one-conflict-suppression', [2, 2]);
  check(score.rawDirectScore === 4, '13a: raw score 4 is below minimum 6');
  check(score.normalizedDirectScore === 2, '13b: normalized 2 is below minimum 3');
}

/* ==================================================================
 *  14. One answer and one skip is incomplete (answeredCount === 1)
 * ================================================================*/

{
  const score = scoreExpressionGroupDirectEvidence('expression-group-silenced-one-conflict-suppression', [5]);
  check(score.answeredCount === 1, '14: answered count 1 should be incomplete');
}

/* ==================================================================
 *  15. Both skipped is incomplete
 * ================================================================*/

{
  const score = scoreExpressionGroupDirectEvidence('expression-group-silenced-one-conflict-suppression', []);
  check(score.answeredCount === 0, '15: answered count 0 should be incomplete');
  check(score.normalizedDirectScore === null, '15: normalized should be null');
}

/* ==================================================================
 *  16. Skipped item is retryable once
 * ================================================================*/

{
  const answered = new Set<string>(['item-1']);
  const skipped = new Set<string>(['item-2']);
  const retryable = getRetryableGroupScreeningItems(
    'expression-group-silenced-one-conflict-suppression',
    answered, skipped,
  );
  check(retryable.length === 0, '16: No retryable items because no items registered');
}

/* ==================================================================
 *  17-21. Comprehensive scoring, ranking, and selection
 *   Using scoreExpressionGroupDirectEvidence directly (items not yet created)
 * ================================================================*/

{
  const scoreA = scoreExpressionGroupDirectEvidence('group-a', [4, 5]);
  const scoreB = scoreExpressionGroupDirectEvidence('group-b', [4, 4]);
  const scoreC = scoreExpressionGroupDirectEvidence('group-c', [3, 3]);
  const ranked = rankExpressionGroupsWithinParent([scoreC, scoreA, scoreB]);
  check(ranked[0].groupId === 'group-a', '17a: group-a (4.5) should rank first');
  check(ranked[1].groupId === 'group-b', '17b: group-b (4.0) should rank second');
  check(ranked[2].groupId === 'group-c', '17c: group-c (3.0) should rank third');
}

/* ==================================================================
 *  19. Additional group 0.3 behind advances (within 0.5 band)
 * ================================================================*/

{
  const scoreA = scoreExpressionGroupDirectEvidence('expression-group-silenced-one-conflict-suppression', [4, 5]);
  const scoreB = scoreExpressionGroupDirectEvidence('expression-group-silenced-one-speech-emergence', [4, 4]);
  const ranked = rankExpressionGroupsWithinParent([scoreB, scoreA]);
  check(ranked[0].groupId === 'expression-group-silenced-one-conflict-suppression', '19a: leader should be group with 4.5');
  check(ranked[1].normalizedDirectScore! === 4, '19b: second group has normalized 4');
  check((ranked[0].normalizedDirectScore!) - (ranked[1].normalizedDirectScore!) <= 0.5, '19c: within 0.5 close band');
}

/* ==================================================================
 *  20. Additional group 0.6 behind does not advance
 * ================================================================*/

{
  const scoreA = scoreExpressionGroupDirectEvidence('group-x', [5, 5]);
  const scoreB = scoreExpressionGroupDirectEvidence('group-y', [4, 4]);
  const diff = (scoreA.normalizedDirectScore!) - (scoreB.normalizedDirectScore!);
  check(diff > 0.5, '20: diff 1.0 exceeds 0.5 band, second group should not advance');
}

/* ==================================================================
 *  21, 22. Group-score tie uses groupOrder, per-parent and total cap
 * ================================================================*/

{
  const scores: ExpressionGroupDirectScore[] = [
    { groupId: 'expression-group-silenced-one-conflict-suppression', rawDirectScore: 8, answeredCount: 2, normalizedDirectScore: 4 },
    { groupId: 'expression-group-silenced-one-speech-emergence', rawDirectScore: 8, answeredCount: 2, normalizedDirectScore: 4 },
  ];
  const ranked = rankExpressionGroupsWithinParent(scores);
  check(ranked[0].groupId === 'expression-group-silenced-one-conflict-suppression', '21: groupOrder 1 should beat groupOrder 2');
  check(ranked[1].groupId === 'expression-group-silenced-one-speech-emergence', '21: lower groupOrder second');
}

/* ==================================================================
 *  23. Reserved leader from each parent preserved
 * ================================================================*/

{
  const selectionA: ExpressionGroupSelection[] = [
    { groupId: 'ga1', parentId: 'silenced-one', parentType: 'core', normalizedDirectScore: 4, rawDirectScore: 8, answeredCount: 2, groupOrder: 1, isLeader: true },
  ];
  const selectionB: ExpressionGroupSelection[] = [
    { groupId: 'gb1', parentId: 'martyr', parentType: 'strategy', normalizedDirectScore: 3.5, rawDirectScore: 7, answeredCount: 2, groupOrder: 1, isLeader: true },
  ];
  const { finalGroups, decisions } = selectFinalAdvancingGroups([selectionA, selectionB], CONFIG);
  check(finalGroups.length === 2, '23a: two leaders reserved');
  check(finalGroups.some(g => g.groupId === 'ga1'), '23b: ga1 leader preserved');
  check(finalGroups.some(g => g.groupId === 'gb1'), '23c: gb1 leader preserved');
  check(decisions.some(d => d.includes('reserved leader')), '23d: decisions mention reserved leader');
}

/* ==================================================================
 *  24. No group qualifies (all incomplete)
 * ================================================================*/

{
  const responses = coreResponses([4, 4, 4, 4, 4, 4, 4, 4, 4]);
  const result = makeFullResult(makeCoreResult());
  const { selections } = selectAdvancingGroupsForParent('silenced-one', responses, CONFIG);
  check(selections.length === 0, '24: No qualifying groups when items are empty (all 0 answered)');
}

/* ==================================================================
 *  25. Parent score does not inflate group score
 * ================================================================*/

{
  const groupScore = scoreExpressionGroupDirectEvidence('expression-group-silenced-one-conflict-suppression', [3, 3]);
  check(groupScore.normalizedDirectScore === 3, '25: Group score is 3.0 regardless of parent scores');
  check(groupScore.rawDirectScore === 6, '25: Group raw is 6 regardless');
}

/* ==================================================================
 *  26. No duplicate item returned
 * ================================================================*/

{
  const result = routeExpressionGroupScreening('pro', emptyResult, {}, []);
  const seen = new Set(result.screeningItemIds);
  check(seen.size === result.screeningItemIds.length, '26: No duplicate screening item IDs');
}

/* ==================================================================
 *  27. No reverse scoring applied (reverseScoringAllowed: false)
 * ================================================================*/

{
  check(CONFIG.screening.reverseScoringAllowed === false, '27: reverseScoringAllowed should be false');
}

/* ==================================================================
 *  28. Partial item registry keeps readiness false (only 6/42 groups)
 * ================================================================*/

{
  const readiness = getExpressionGroupScreeningReadiness();
  check(readiness.itemsDefined === true, '28a: itemsDefined should be true');
  check(readiness.totalItemCount === 84, '28b: totalItemCount should be 84');
  check(readiness.allGroupsHaveTwoItems === true, '28c: allGroupsHaveTwoItems should be true');
  check(readiness.ready === true, '28d: readiness should be true');
  check(readiness.missingRequirements.length === 0, '28e: should have no missing requirements, got ' + readiness.missingRequirements.join(', '));
}

/* ==================================================================
 *  IB. Item bank validation
 * ================================================================*/

{
  const allGroupIds = new Set(EXPRESSION_SCREENING_GROUPS.map(g => g.id));

  check(EXPRESSION_GROUP_SCREENING_ITEMS.length === 84, 'IB1: total item count should be 84');

  const coveredGroupIds = new Set(EXPRESSION_GROUP_SCREENING_ITEMS.map(i => i.groupId));
  check(coveredGroupIds.size === 42, 'IB2: covered group count should be 42');

  const expectedCovered = EXPRESSION_SCREENING_GROUPS.map(g => g.id).sort();
  for (const gid of expectedCovered) {
    check(coveredGroupIds.has(gid), `IB3: ${gid} should be covered`);
  }

  const uncoveredCount = [...allGroupIds].filter(gid => !coveredGroupIds.has(gid)).length;
  check(uncoveredCount === 0, `IB4: uncovered group count should be 0, got ${uncoveredCount}`);

  const coreCoveredGroups = [...coveredGroupIds].filter(gid =>
    EXPRESSION_SCREENING_GROUPS.some(g => g.id === gid && g.parentType === 'core'),
  ).length;
  check(coreCoveredGroups === 23, `IB4a: Core-parent covered groups should be 23, got ${coreCoveredGroups}`);

  const strategyCoveredGroups = [...coveredGroupIds].filter(gid =>
    EXPRESSION_SCREENING_GROUPS.some(g => g.id === gid && g.parentType === 'strategy'),
  ).length;
  check(strategyCoveredGroups === 19, `IB4b: Strategy-parent covered groups should be 19, got ${strategyCoveredGroups}`);

  /* ── Every registered group validated ── */

  const parentIds = new Set(EXPRESSION_SCREENING_GROUPS.map(g => g.parentId));
  check(parentIds.size === 15, `IB5a: 15 parent IDs, got ${parentIds.size}`);
  check([...parentIds].filter(p => CORE_PATTERN_IDS.includes(p as any)).length === 9, 'IB5b: 9 core parents');
  check([...parentIds].filter(p => STRATEGY_PATTERN_IDS.includes(p as any)).length === 6, 'IB5c: 6 strategy parents');

  let totalItemNumberIssues = 0;
  let totalReverseScored = 0;
  let totalNonPro = 0;
  let totalEmptyPrompts = 0;

  for (const g of EXPRESSION_SCREENING_GROUPS) {
    const items = EXPRESSION_GROUP_SCREENING_ITEMS.filter(i => i.groupId === g.id);
    check(items.length === 2, `IB6a: ${g.id} has 2 items, got ${items.length}`);

    const numbers = items.map(i => i.itemNumber).sort();
    if (numbers.length !== 2 || numbers[0] !== 1 || numbers[1] !== 2) {
      totalItemNumberIssues++;
    }

    const ids = items.map(i => i.id);
    check(new Set(ids).size === 2, `IB6b: ${g.id} has 2 unique IDs`);

    for (const item of items) {
      if (item.reverseScored !== false) totalReverseScored++;
      if (item.access !== 'pro') totalNonPro++;
      if (!item.prompt || item.prompt.trim().length === 0) totalEmptyPrompts++;
    }
  }
  check(totalItemNumberIssues === 0, `IB7: item number issues: ${totalItemNumberIssues}`);
  check(totalReverseScored === 0, `IB8: reverse-scored items: ${totalReverseScored}`);
  check(totalNonPro === 0, `IB9: non-Pro items: ${totalNonPro}`);
  check(totalEmptyPrompts === 0, `IB10: empty prompts: ${totalEmptyPrompts}`);

  /* ── Traversal: all 42 groups retrievable and scorable ── */

  for (const g of EXPRESSION_SCREENING_GROUPS) {
    const itemIds = getGroupScreeningItemIds(g.id);
    check(itemIds.length === 2, `TV1: ${g.id} has 2 item IDs`);
    const score = scoreExpressionGroupDirectEvidence(g.id, [3, 4]);
    check(score.groupId === g.id, 'TV2: score groupId matches');
    check(score.answeredCount === 2, 'TV3: answered count 2');
  }

  const seenIds = new Set<string>();
  let duplicateIdCount = 0;
  for (const item of EXPRESSION_GROUP_SCREENING_ITEMS) {
    if (seenIds.has(item.id)) duplicateIdCount++;
    seenIds.add(item.id);
  }
  check(duplicateIdCount === 0, `IB5: duplicate item IDs should be 0, got ${duplicateIdCount}`);

  let invalidGroupCount = 0;
  for (const item of EXPRESSION_GROUP_SCREENING_ITEMS) {
    if (!allGroupIds.has(item.groupId)) invalidGroupCount++;
  }
  check(invalidGroupCount === 0, `IB6: invalid group IDs should be 0, got ${invalidGroupCount}`);

  let duplicateItemNumbers = 0;
  let missingItemNumbers = 0;
  for (const gid of coveredGroupIds) {
    const groupItems = EXPRESSION_GROUP_SCREENING_ITEMS.filter(i => i.groupId === gid);
    const numbers = groupItems.map(i => i.itemNumber).sort();
    if (numbers.length !== 2 || numbers[0] !== 1 || numbers[1] !== 2) {
      duplicateItemNumbers += numbers.length - new Set(numbers).size;
      if (!numbers.includes(1)) missingItemNumbers++;
      if (!numbers.includes(2)) missingItemNumbers++;
    }
  }
  check(duplicateItemNumbers === 0, `IB7: duplicate item numbers within groups should be 0, got ${duplicateItemNumbers}`);
  check(missingItemNumbers === 0, `IB8: missing item numbers should be 0, got ${missingItemNumbers}`);

  const reverseScored = EXPRESSION_GROUP_SCREENING_ITEMS.filter(i => i.reverseScored !== false).length;
  check(reverseScored === 0, `IB9: reverse-scored items should be 0, got ${reverseScored}`);

  const nonPro = EXPRESSION_GROUP_SCREENING_ITEMS.filter(i => i.access !== 'pro').length;
  check(nonPro === 0, `IB10: non-Pro items should be 0, got ${nonPro}`);

  for (const gid of expectedCovered) {
    const groupItems = EXPRESSION_GROUP_SCREENING_ITEMS.filter(i => i.groupId === gid);
    check(groupItems.length === 2, `IB11: ${gid} should have exactly 2 items, got ${groupItems.length}`);
  }

  const uncoveredWithItems = [...allGroupIds].filter(gid => !coveredGroupIds.has(gid));
  for (const gid of uncoveredWithItems) {
    const count = EXPRESSION_GROUP_SCREENING_ITEMS.filter(i => i.groupId === gid).length;
    check(count === 0, `IB12: ${gid} should have 0 items, got ${count}`);
  }
}

/* ==================================================================
 *  29. Trace is JSON serializable
 * ================================================================*/

{
  const result = routeExpressionGroupScreening('pro', emptyResult, {}, []);
  let serialized = '';
  let parseError = false;
  try {
    serialized = JSON.stringify(result.trace);
    JSON.parse(serialized);
  } catch {
    parseError = true;
  }
  check(!parseError, '29: Trace should be JSON serializable');
  check(serialized.length > 0, '29: Serialized trace should not be empty');
}

/* ==================================================================
 *  30. Stable group ID is final tie fallback
 * ================================================================*/

{
  const scores: ExpressionGroupDirectScore[] = [
    { groupId: 'group-z', rawDirectScore: 6, answeredCount: 2, normalizedDirectScore: 3 },
    { groupId: 'group-a', rawDirectScore: 6, answeredCount: 2, normalizedDirectScore: 3 },
  ];
  const ranked = rankExpressionGroupsWithinParent(scores);
  check(ranked[0].groupId === 'group-a', '30: group-a beats group-z alphabetically');
  check(ranked[1].groupId === 'group-z', '30: group-z second');
}

/* ==================================================================
 *  Readiness checks
 * ================================================================*/

{
  const readiness = getExpressionGroupScreeningReadiness();
  check(readiness.scoringFunctionsExist === true, 'R1: scoringFunctionsExist');
  check(readiness.selectionFunctionsExist === true, 'R2: selectionFunctionsExist');
  check(readiness.retryHandlingExists === true, 'R3: retryHandlingExists');
  check(readiness.serializableTraceExists === true, 'R4: serializableTraceExists');
  check(readiness.allValidationScenariosPass === false, 'R5: validation scenarios not yet all passing');
}

/* ==================================================================
 *  Config values
 * ================================================================*/

{
  check(CONFIG.configVersion === '1.0.0', 'C1: configVersion');
  check(CONFIG.parentSelection.maximumCoreBranches === 1, 'C2: maxCoreBranches');
  check(CONFIG.parentSelection.maximumStrategyBranches === 1, 'C3: maxStrategyBranches');
  check(CONFIG.parentSelection.maximumTotalBranches === 2, 'C4: maxTotalBranches');
  check(CONFIG.parentSelection.minimumCoreDirectScore === 3.5, 'C5: minCoreScore');
  check(CONFIG.parentSelection.minimumCoreAnsweredItems === 5, 'C6: minCoreItems');
  check(CONFIG.screening.itemsPerGroup === 2, 'C7: itemsPerGroup');
  check(CONFIG.screening.minimumAnsweredItems === 2, 'C8: minAnswered');
  check(CONFIG.screening.minimumRawDirectScore === 6, 'C9: minRaw');
  check(CONFIG.screening.minimumNormalizedDirectScore === 3, 'C10: minNorm');
  check(CONFIG.screening.retrySkippedItemsOnce === true, 'C11: retryOnce');
  check(CONFIG.screening.useAnsweredItemsOnly === true, 'C12: useAnsweredOnly');
  check(CONFIG.screening.reverseScoringAllowed === false, 'C13: noReverse');
  check(CONFIG.selection.maximumGroupsPerParent === 2, 'C14: maxPerParent');
  check(CONFIG.selection.maximumGroupsTotal === 3, 'C15: maxTotal');
  check(CONFIG.selection.additionalGroupCloseBandPoints === 0.5, 'C16: closeBand');
  check(CONFIG.selection.reserveLeaderPerSelectedParent === true, 'C17: reserveLeader');
}

/* ==================================================================
 *  SUMMARY
 * ================================================================*/

console.log(`\n=== EXPRESSION GROUP SCREENING ROUTING VALIDATION ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (errors.length > 0) {
  console.log(`\nFailures:`);
  errors.forEach(e => console.log(`  ❌ ${e}`));
  process.exit(1);
} else {
  console.log(`\n✅ ALL ${passed} CHECKS PASSED`);
}
