import { EXPRESSION_SCREENING_GROUPS } from './src/data/quiz/expressionScreeningGroups';
import { EXPRESSION_REGISTRY, CORE_PATTERN_IDS, STRATEGY_PATTERN_IDS } from './src/data/quiz/patternTaxonomy';
import { validateExpressionScreeningGroups } from './src/lib/quiz/expressionGroupingValidation';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function check(condition: boolean, message: string) {
  if (condition) { passed++; } else { failed++; errors.push(message); }
}

/* ========== 1. Complete-state detection ========== */

const result = validateExpressionScreeningGroups(
  EXPRESSION_SCREENING_GROUPS,
  EXPRESSION_REGISTRY,
  CORE_PATTERN_IDS,
  STRATEGY_PATTERN_IDS,
);

check(result.valid === true, `1: Valid should be true, got false`);
check(result.groupCount === 42, `1: Group count should be 42, got ${result.groupCount}`);
check(result.coreGroupCount === 23, `1: Core group count should be 23, got ${result.coreGroupCount}`);
check(result.strategyGroupCount === 19, `1: Strategy group count should be 19, got ${result.strategyGroupCount}`);
check(result.assignmentCount === 145, `1: Assignment count should be 145, got ${result.assignmentCount}`);
check(result.uniqueExpressionCount === 145, `1: Unique expression count should be 145, got ${result.uniqueExpressionCount}`);
check(result.duplicateExpressionIds.length === 0, `1: No duplicate expression IDs`);
check(result.invalidExpressionIds.length === 0, `1: No invalid expression IDs`);
check(result.invalidParentIds.length === 0, `1: No invalid parent IDs`);
check(result.parentMismatchExpressionIds.length === 0, `1: No parent mismatch`);
check(result.duplicateGroupIds.length === 0, `1: No duplicate group IDs`);
check(result.duplicateGroupOrders.length === 0, `1: No duplicate group orders`);
check(result.duplicateExpressionOrders.length === 0, `1: No duplicate expression orders`);
check(result.groupsBelowMinimumSize.length === 0, `1: No groups below minimum size`);
check(result.groupsAboveMaximumSize.length === 0, `1: No groups above maximum size`);
check(result.omittedExpressionIds.length === 0, `1: Should have 0 omitted expressions, got ${result.omittedExpressionIds.length}`);
check(result.parentsWithoutGroups.length === 0, `1: Should have 0 parents without groups, got ${result.parentsWithoutGroups.length}`);

/* ========== 2. Group-size distribution ========== */

const sizeCounts: Record<number, number> = {};
for (const g of EXPRESSION_SCREENING_GROUPS) {
  const s = g.expressionIds.length;
  sizeCounts[s] = (sizeCounts[s] || 0) + 1;
}
check(sizeCounts[2] === 4, `2: Groups with 2 expressions should be 4, got ${sizeCounts[2] || 0}`);
check(sizeCounts[3] === 17, `2: Groups with 3 expressions should be 17, got ${sizeCounts[3] || 0}`);
check(sizeCounts[4] === 19, `2: Groups with 4 expressions should be 19, got ${sizeCounts[4] || 0}`);
check(sizeCounts[5] === 2, `2: Groups with 5 expressions should be 2, got ${sizeCounts[5] || 0}`);

/* ========== 3. Parent group-count distribution ========== */

const groupCountByParent = new Map<string, number>();
for (const g of EXPRESSION_SCREENING_GROUPS) {
  groupCountByParent.set(g.parentId, (groupCountByParent.get(g.parentId) || 0) + 1);
}
const parentsWith2 = [...groupCountByParent.values()].filter(c => c === 2).length;
const parentsWith3 = [...groupCountByParent.values()].filter(c => c === 3).length;
const parentsWith4 = [...groupCountByParent.values()].filter(c => c === 4).length;
check(parentsWith2 === 7, `3: Parents with 2 groups should be 7, got ${parentsWith2}`);
check(parentsWith3 === 4, `3: Parents with 3 groups should be 4, got ${parentsWith3}`);
check(parentsWith4 === 4, `3: Parents with 4 groups should be 4, got ${parentsWith4}`);

/* ========== 4. Per-parent expression counts ========== */

function expressionCountForParent(parentId: string): number {
  return EXPRESSION_SCREENING_GROUPS
    .filter(g => g.parentId === parentId)
    .flatMap(g => g.expressionIds)
    .length;
}

check(expressionCountForParent('silenced-one') === 6, `4: silenced-one should have 6, got ${expressionCountForParent('silenced-one')}`);
check(expressionCountForParent('unheld-one') === 6, `4: unheld-one should have 6, got ${expressionCountForParent('unheld-one')}`);
check(expressionCountForParent('invisible-one') === 7, `4: invisible-one should have 7, got ${expressionCountForParent('invisible-one')}`);
check(expressionCountForParent('shame-bearer') === 14, `4: shame-bearer should have 14, got ${expressionCountForParent('shame-bearer')}`);
check(expressionCountForParent('controller') === 7, `4: controller should have 7, got ${expressionCountForParent('controller')}`);
check(expressionCountForParent('avoidant-one') === 12, `4: avoidant-one should have 12, got ${expressionCountForParent('avoidant-one')}`);
check(expressionCountForParent('hypervigilant-one') === 15, `4: hypervigilant-one should have 15, got ${expressionCountForParent('hypervigilant-one')}`);
check(expressionCountForParent('entangled-one') === 8, `4: entangled-one should have 8, got ${expressionCountForParent('entangled-one')}`);
check(expressionCountForParent('grief-bearer') === 6, `4: grief-bearer should have 6, got ${expressionCountForParent('grief-bearer')}`);
check(expressionCountForParent('martyr') === 10, `4: martyr should have 10, got ${expressionCountForParent('martyr')}`);
check(expressionCountForParent('rescuer') === 15, `4: rescuer should have 15, got ${expressionCountForParent('rescuer')}`);
check(expressionCountForParent('over-responsible-one') === 15, `4: over-responsible-one should have 15, got ${expressionCountForParent('over-responsible-one')}`);
check(expressionCountForParent('overloaded-one') === 10, `4: overloaded-one should have 10, got ${expressionCountForParent('overloaded-one')}`);
check(expressionCountForParent('perfectionist') === 5, `4: perfectionist should have 5, got ${expressionCountForParent('perfectionist')}`);
check(expressionCountForParent('anger-shield') === 9, `4: anger-shield should have 9, got ${expressionCountForParent('anger-shield')}`);

/* ========== 5. Complete taxonomy coverage ========== */

const allParentIds = new Set(EXPRESSION_SCREENING_GROUPS.map(g => g.parentId));
check(allParentIds.size === 15, `5: Should have 15 unique parent IDs, got ${allParentIds.size}`);

const coreParentsInGroups = new Set(
  EXPRESSION_SCREENING_GROUPS.filter(g => g.parentType === 'core').map(g => g.parentId),
);
check(coreParentsInGroups.size === 9, `5: Should have 9 core parents, got ${coreParentsInGroups.size}`);

const strategyParentsInGroups = new Set(
  EXPRESSION_SCREENING_GROUPS.filter(g => g.parentType === 'strategy').map(g => g.parentId),
);
check(strategyParentsInGroups.size === 6, `5: Should have 6 strategy parents, got ${strategyParentsInGroups.size}`);

/* ========== 6. All 145 expressions assigned exactly once ========== */

const allAssignedIds = EXPRESSION_SCREENING_GROUPS.flatMap(g => g.expressionIds);
check(allAssignedIds.length === 145, `6: Total assignments should be 145, got ${allAssignedIds.length}`);
const uniqueAssigned = new Set(allAssignedIds);
check(uniqueAssigned.size === 145, `6: Unique assigned IDs should be 145, got ${uniqueAssigned.size}`);

/* ========== 7. Registry integrity ========== */

check(EXPRESSION_REGISTRY.length === 145, `7: Registry should have 145 expressions, got ${EXPRESSION_REGISTRY.length}`);
check(CORE_PATTERN_IDS.length === 9, `7: Should have 9 core patterns, got ${CORE_PATTERN_IDS.length}`);
check(STRATEGY_PATTERN_IDS.length === 6, `7: Should have 6 strategy patterns, got ${STRATEGY_PATTERN_IDS.length}`);

/* ========== SUMMARY ========== */
console.log(`\n=== EXPRESSION GROUPING VALIDATION RESULTS ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (errors.length > 0) {
  console.log(`\nFailures:`);
  errors.forEach(e => console.log(`  ❌ ${e}`));
  process.exit(1);
} else {
  console.log(`\n✅ ALL ${passed} CHECKS PASSED`);
}
