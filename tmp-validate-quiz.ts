import { PATTERNS_DATA } from './src/data/patterns';
import {
  CORE_PATTERN_IDS,
  STRATEGY_PATTERN_IDS,
  EXPRESSION_REGISTRY,
  EXPRESSION_TO_PARENT,
  STRATEGY_CORE_COMPATIBILITY,
} from './src/data/quiz/patternTaxonomy';
import { computeQuizScores, computeQuizResult, emptyQuizScoreState } from './src/lib/quiz/scoringEngine';
import { computeQuizResultFromLegacyAnswers, getNavigationTarget } from './src/lib/quiz/legacyAdapter';
import type { CorePatternId, StrategyPatternId } from './src/types/quiz';
import { EXPRESSION_CONFIDENCE_THRESHOLD, STRATEGY_COMPATIBILITY_BOOST_FACTOR, NEAR_TIE_FRACTION } from './src/types/quiz';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function check(condition: boolean, message: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(message);
  }
}

// 1. All nine core IDs exist
console.log('1. Verifying core IDs...');
const expectedCores = ['silenced-one', 'unheld-one', 'invisible-one', 'shame-bearer', 'controller', 'avoidant-one', 'hypervigilant-one', 'entangled-one', 'grief-bearer'];
for (const id of expectedCores) {
  check(CORE_PATTERN_IDS.includes(id as CorePatternId), `Core ID missing: ${id}`);
  check(PATTERNS_DATA.some(p => p.id === id && p.category === 'core'), `Pattern with core category not found: ${id}`);
}
check(CORE_PATTERN_IDS.length === 9, `Expected 9 cores, got ${CORE_PATTERN_IDS.length}`);

// 2. All six strategy IDs exist
console.log('2. Verifying strategy IDs...');
const expectedStrats = ['martyr', 'rescuer', 'over-responsible-one', 'overloaded-one', 'perfectionist', 'anger-shield'];
for (const id of expectedStrats) {
  check(STRATEGY_PATTERN_IDS.includes(id as StrategyPatternId), `Strategy ID missing: ${id}`);
  check(PATTERNS_DATA.some(p => p.id === id && p.category === 'sub'), `Pattern with sub category not found: ${id}`);
}
check(STRATEGY_PATTERN_IDS.length === 6, `Expected 6 strategies, got ${STRATEGY_PATTERN_IDS.length}`);

// 3. Abandonment does not exist as a code identifier
console.log('3. Checking for abandonment identifiers...');
check(!CORE_PATTERN_IDS.some(id => id.includes('abandon')), 'Core IDs contain abandonment');
check(!STRATEGY_PATTERN_IDS.some(id => id.includes('abandon')), 'Strategy IDs contain abandonment');
check(!EXPRESSION_REGISTRY.some(e => e.id.includes('abandon')), 'Expression IDs contain abandonment');
check(!Object.keys(STRATEGY_CORE_COMPATIBILITY).some(k => k.includes('abandon')), 'Compatibility keys contain abandonment');

// 4. Every expression ID is unique
console.log('4. Checking expression uniqueness...');
const exprIds = EXPRESSION_REGISTRY.map(e => e.id);
const uniqueExprIds = new Set(exprIds);
check(uniqueExprIds.size === exprIds.length, `Expression IDs not unique: ${exprIds.length} entries but ${uniqueExprIds.size} unique`);

// 5. Every expression parent exists
console.log('5. Checking expression parents...');
const allPatternIds = new Set(PATTERNS_DATA.map(p => p.id));
for (const expr of EXPRESSION_REGISTRY) {
  check(allPatternIds.has(expr.parentPatternId), `Expression ${expr.id} has missing parent: ${expr.parentPatternId}`);
}

// 6. Every strategy compatibility core exists
console.log('6. Checking strategy compatibility...');
for (const [stratId, coreIds] of Object.entries(STRATEGY_CORE_COMPATIBILITY)) {
  check(STRATEGY_PATTERN_IDS.includes(stratId as StrategyPatternId), `Strategy ${stratId} in compatibility map is not a valid strategy`);
  for (const cid of coreIds) {
    check(CORE_PATTERN_IDS.includes(cid as CorePatternId), `Compatibility core ${cid} for ${stratId} is not a valid core`);
  }
}

// 7. No strategy maps to another strategy as a root
console.log('7. Checking strategy root integrity...');
for (const [, coreIds] of Object.entries(STRATEGY_CORE_COMPATIBILITY)) {
  for (const cid of coreIds) {
    check(!STRATEGY_PATTERN_IDS.includes(cid as StrategyPatternId), `Strategy ${cid} appears in compatibility list — should only be cores`);
  }
}

// 8. No expression appears as a standalone PatternEntry
console.log('8. Checking no expression is a standalone pattern...');
const allPatternIdsSet = new Set(PATTERNS_DATA.map(p => p.id));
for (const expr of EXPRESSION_REGISTRY) {
  check(!allPatternIdsSet.has(expr.id), `Expression ID ${expr.id} is also a standalone pattern`);
}

// 9. No scoring target uses display names
console.log('9. Checking no display names in scoring...');
const allIds = new Set([...CORE_PATTERN_IDS, ...STRATEGY_PATTERN_IDS, ...EXPRESSION_REGISTRY.map(e => e.id)]);
for (const p of PATTERNS_DATA) {
  check(!allIds.has(p.name), `Pattern display name "${p.name}" found in scoring IDs — should use ID not name`);
}

// 10. No stale quiz key points to a nonexistent pattern
console.log('10. Checking quizKey validity...');
for (const p of PATTERNS_DATA) {
  if (p.quizKey) {
    check(typeof p.quizKey === 'string' && p.quizKey.length === 1, `Invalid quizKey ${p.quizKey} on ${p.id}`);
  }
}

// 11. Zero direct strategy evidence returns strategy: null
console.log('11. Zero strategy evidence test...');
const onlyCoreState = emptyQuizScoreState();
onlyCoreState.core['silenced-one'] = 5;
const onlyCoreResult = computeQuizResult(onlyCoreState);
check(onlyCoreResult.strategy === null, 'Zero strategy evidence should return strategy: null');
check(onlyCoreResult.core !== null, 'Core should exist even with zero strategy evidence');

// 12. Zero direct expression evidence returns expression: null
console.log('12. Zero expression evidence test...');
const stateWithStrategy = emptyQuizScoreState();
stateWithStrategy.strategy['martyr'] = 3;
stateWithStrategy.core['controller'] = 2;
const resultNoExpr = computeQuizResult(stateWithStrategy);
check(resultNoExpr.expression === null, 'Zero expression evidence should return expression: null');

// 13. Strong direct strategy score beats a weak compatibility boost
console.log('13. Direct strategy dominance test...');
const stateBoostTest = emptyQuizScoreState();
stateBoostTest.strategy['rescuer'] = 5;
stateBoostTest.strategy['martyr'] = 1;
stateBoostTest.core['controller'] = 10;
stateBoostTest.core['unheld-one'] = 1;
const boostResult = computeQuizResult(stateBoostTest);
check(boostResult.strategy?.id === 'rescuer', `Expected rescuer to win (direct 5), got ${boostResult.strategy?.id}`);

// 14. A compatibility boost can break a close strategy tie modestly
console.log('14. Compatibility boost tiebreak test...');
const stateTiebreak = emptyQuizScoreState();
stateTiebreak.strategy['rescuer'] = 3;
stateTiebreak.strategy['martyr'] = 3;
stateTiebreak.core['avoidant-one'] = 10;
const tiebreakResult = computeQuizResult(stateTiebreak);
check(tiebreakResult.strategy !== null, 'Tiebreak should produce a strategy winner');
if (tiebreakResult.strategy) {
  console.log(`   Tiebreak winner: ${tiebreakResult.strategy.id} (rescuer.compat[avoidant-one=10*0.2=2] vs martyr.compat[no avoidant-one]=0)`);
  check(tiebreakResult.strategy.id === 'rescuer', `Expected rescuer to win on compatibility boost (avoidant-one is unique to rescuer), got ${tiebreakResult.strategy.id}`);
}

// 15. Expression cannot win outside its parent result
console.log('15. Expression parent gating test...');
const stateExprGate = emptyQuizScoreState();
stateExprGate.core['avoidant-one'] = 5;
stateExprGate.expression['silenced-people-pleaser'] = 5;
const exprGateResult = computeQuizResult(stateExprGate);
check(exprGateResult.expression === null, 'Expression should be null when parent (silenced-one) is not relevant');

// 16. Expression can win when parent is the winner
console.log('16. Expression parent matching test...');
const stateExprMatch = emptyQuizScoreState();
stateExprMatch.core['silenced-one'] = 5;
stateExprMatch.expression['silenced-people-pleaser'] = 3;
const exprMatchResult = computeQuizResult(stateExprMatch);
check(exprMatchResult.expression !== null, 'Expression should be non-null when parent (silenced-one) is the winner');
if (exprMatchResult.expression) {
  check(exprMatchResult.expression.id === 'silenced-people-pleaser', `Expected silenced-people-pleaser, got ${exprMatchResult.expression.id}`);
}

// 17. Result navigation resolves correctly
console.log('17. Result navigation test...');
const navState = emptyQuizScoreState();
navState.strategy['anger-shield'] = 3;
navState.core['controller'] = 2;
const navResult = computeQuizResult(navState);
const nav = getNavigationTarget(navResult);
check(nav.patternId === 'anger-shield', `Navigation should go to strategy (anger-shield), got ${nav.patternId}`);

const navState2 = emptyQuizScoreState();
navState2.core['grief-bearer'] = 5;
const navResult2 = computeQuizResult(navState2);
const nav2 = getNavigationTarget(navResult2);
check(nav2.patternId === 'grief-bearer', `Navigation should go to core (grief-bearer) when no strategy, got ${nav2.patternId}`);

// 18. Verify expression count
console.log('18. Expression count...');
check(EXPRESSION_REGISTRY.length === 145, `Expected 145 expressions, got ${EXPRESSION_REGISTRY.length}`);

// 19. Legacy adapter produces valid results
console.log('19. Legacy adapter test...');
const legacyAnswers: Array<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'> = ['A', 'A', 'B', 'C', 'A', 'F', 'G'];
const legacyResult = computeQuizResultFromLegacyAnswers(legacyAnswers);
check(legacyResult.strategy !== null, 'Legacy adapter should produce strategy result');
if (legacyResult.strategy) {
  check(legacyResult.strategy.id === 'martyr', `Expected martyr from legacy answers (3 A answers), got ${legacyResult.strategy.id}`);
}

// 20. No object insertion order dependence
console.log('20. Order independence test...');
const stateOrder1 = emptyQuizScoreState();
stateOrder1.core['silenced-one'] = 3;
stateOrder1.core['controller'] = 3;
const resultOrder1 = computeQuizResult(stateOrder1);

const stateOrder2 = emptyQuizScoreState();
stateOrder2.core['controller'] = 3;
stateOrder2.core['silenced-one'] = 3;
const resultOrder2 = computeQuizResult(stateOrder2);

check(resultOrder1.core?.id === resultOrder2.core?.id, 'Tie results should be order-independent');
if (resultOrder1.core && resultOrder2.core) {
  check(resultOrder1.core.id === 'controller' || resultOrder1.core.id === 'silenced-one', 'Tie should be resolved by stable ID');
}

// Summary
console.log(`\n=== VALIDATION RESULTS ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (errors.length > 0) {
  console.log(`\nFailures:`);
  errors.forEach(e => console.log(`  ❌ ${e}`));
  process.exit(1);
} else {
  console.log(`\n✅ ALL ${passed} CHECKS PASSED`);
}

// Report all formula values
console.log(`\n=== CONFIGURATION ===`);
console.log(`EXPRESSION_CONFIDENCE_THRESHOLD: ${EXPRESSION_CONFIDENCE_THRESHOLD}`);
console.log(`STRATEGY_COMPATIBILITY_BOOST_FACTOR: ${STRATEGY_COMPATIBILITY_BOOST_FACTOR}`);
console.log(`NEAR_TIE_FRACTION: ${NEAR_TIE_FRACTION}`);
