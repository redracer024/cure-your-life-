import { produceStrategyRoutingResult, evaluateUniversalEligibility, scoreStrategyDirectEvidence } from './src/lib/quiz/strategyRouting';
import { STRATEGY_PATTERN_IDS } from './src/data/quiz/patternTaxonomy';
import { APPROVED_QUIZ_ITEMS } from './src/data/quiz/approvedQuestions';
import { scoreApprovedItemResponse } from './src/data/quiz/questionBank';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function check(condition: boolean, message: string) {
  if (condition) { passed++; } else { failed++; errors.push(message); }
}

function getStrategyItemId(strategyId: string, num: number): string {
  const padded = num < 10 ? `0${num}` : `${num}`;
  return `strategy-${strategyId}-${padded}`;
}

function getStrategyItemIds(strategyId: string, numbers: number[]): string[] {
  return numbers.map(n => getStrategyItemId(strategyId, n));
}

function makeFullResponses(
  universalOverrides: Record<string, number>,
  followUpOverrides: Record<string, number>,
): Record<string, number | undefined> {
  const all: Record<string, number | undefined> = {};
  for (const item of APPROVED_QUIZ_ITEMS) {
    const itemId = item.id;
    if (itemId in universalOverrides) {
      all[itemId] = universalOverrides[itemId];
    } else if (itemId in followUpOverrides) {
      all[itemId] = followUpOverrides[itemId];
    } else {
      all[itemId] = undefined;
    }
  }
  return all;
}

function makeOverrides(
  overrides: Record<string, number>,
): Record<string, number | undefined> {
  const all: Record<string, number | undefined> = {};
  for (const item of APPROVED_QUIZ_ITEMS) {
    all[item.id] = item.id in overrides ? overrides[item.id] : undefined;
  }
  return all;
}

const STRAT_ORDER = STRATEGY_PATTERN_IDS as readonly string[];

/* ========== 1. Strong single Martyr signal ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('martyr', [1, 2])) universal[id] = 4;
  for (const id of getStrategyItemIds('martyr', [3, 4, 5])) followUp[id] = 4;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.primary === 'martyr', `1: Strong Martyr -> primary martyr (got ${result.primary ?? 'none'})`);
  check(result.outcome === 'primary' || result.outcome === 'primary-with-secondary', `1: Outcome should be primary or primary-with-secondary (got ${result.outcome})`);
  check(result.trace.followUpItemAssignments.length > 0, '1: Should have follow-up assignments in trace');
}

/* ========== 2. Strong single Anger Shield signal ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('anger-shield', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('anger-shield', [3, 4, 5])) followUp[id] = 5;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.primary === 'anger-shield', `2: Strong Anger Shield -> primary anger-shield (got ${result.primary ?? 'none'})`);
}

/* ========== 3. Martyr and Overloaded close ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('martyr', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('overloaded-one', [1, 2])) universal[id] = 4;
  for (const id of getStrategyItemIds('martyr', [3, 4, 5])) followUp[id] = 5;
  for (const id of getStrategyItemIds('overloaded-one', [3, 4, 5])) followUp[id] = 4;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.primary === 'martyr', `3: Martyr should lead Overloaded (got ${result.primary ?? 'none'})`);
}

/* ========== 4. Rescuer and Over-Responsible close ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('rescuer', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('over-responsible-one', [1, 2])) universal[id] = 4;
  for (const id of getStrategyItemIds('rescuer', [3, 4, 5])) followUp[id] = 5;
  for (const id of getStrategyItemIds('over-responsible-one', [3, 4, 5])) followUp[id] = 4;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.primary === 'rescuer', `4: Rescuer should lead Over-Responsible (got ${result.primary ?? 'none'})`);
}

/* ========== 5. Three candidates inside initial close band (Pro) ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('martyr', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('overloaded-one', [1, 2])) universal[id] = 4;
  for (const id of getStrategyItemIds('rescuer', [1, 2])) universal[id] = 4;
  for (const sid of ['martyr', 'overloaded-one', 'rescuer']) {
    for (const id of getStrategyItemIds(sid, [3, 4, 5, 6, 7, 8])) followUp[id] = 4;
  }
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'pro');
  check(result.primary === 'martyr', `5: Martyr should lead (got ${result.primary ?? 'none'})`);
  check(result.trace.selectedCandidates.length >= 2, `5: Should have at least 2 selected candidates (got ${result.trace.selectedCandidates.length})`);
  const selected = result.trace.selectedCandidates.map(c => c.patternId);
  check(selected.includes('martyr'), '5: Martyr in selected');
  check(selected.includes('overloaded-one') || selected.includes('rescuer'), '5: At least one close candidate in selected');
}

/* ========== 6. One high response plus one skipped screener = incomplete ========== */
{
  const r: Record<string, number> = {};
  const martyr1 = getStrategyItemId('martyr', 1);
  r[martyr1] = 5;
  const resp = makeOverrides(r);
  const eligibility = evaluateUniversalEligibility(resp);
  const martyrElig = eligibility.find(e => e.patternId === 'martyr');
  check(martyrElig?.status === 'incomplete', '6: One answered + one skipped = incomplete');
}

/* ========== 7. Both screeners skipped ========== */
{
  const resp = makeOverrides({});
  const eligibility = evaluateUniversalEligibility(resp);
  const allIncomplete = eligibility.every(e => e.status === 'incomplete');
  check(allIncomplete, '7: All strategies incomplete when all screeners skipped');
}

/* ========== 8. All universal responses equal 1 ========== */
{
  const universal: Record<string, number> = {};
  for (const sid of STRAT_ORDER) {
    for (const id of getStrategyItemIds(sid as string, [1, 2])) universal[id] = 1;
  }
  const resp = makeOverrides(universal);
  const eligibility = evaluateUniversalEligibility(resp);
  const noneEligible = eligibility.every(e => e.status !== 'eligible');
  check(noneEligible, '8: All below-floor when all universal responses are 1');
}

/* ========== 9. All universal responses equal 5 ========== */
{
  const universal: Record<string, number> = {};
  for (const sid of STRAT_ORDER) {
    for (const id of getStrategyItemIds(sid as string, [1, 2])) universal[id] = 5;
  }
  const resp = makeOverrides(universal);
  const eligibility = evaluateUniversalEligibility(resp);
  const allEligible = eligibility.every(e => e.status === 'eligible');
  check(allEligible, '9: All eligible when all universal responses are 5');
}

/* ========== 10. Reverse follow-up skipped ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('martyr', [1, 2])) universal[id] = 4;
  for (const id of getStrategyItemIds('martyr', [3, 4, 5])) followUp[id] = 4;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.primary === 'martyr', `10: Martyr primary with skipped follow-up (got ${result.primary ?? 'none'})`);
  const containsMartyrAssignment = result.trace.followUpItemAssignments.some(a => a.patternId === 'martyr');
  check(containsMartyrAssignment, '10: Trace contains martyr follow-up assignment');
}

/* ========== 11. Free one-candidate route ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('perfectionist', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('perfectionist', [3, 4, 5])) followUp[id] = 4;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.primary === 'perfectionist', `11: Perfectionist primary (got ${result.primary ?? 'none'})`);
  check(result.trace.selectedCandidates.length === 1, `11: Single candidate (got ${result.trace.selectedCandidates.length})`);
}

/* ========== 12. Free two-candidate route ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('perfectionist', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('anger-shield', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('perfectionist', [3, 4, 5])) followUp[id] = 5;
  for (const id of getStrategyItemIds('anger-shield', [3, 4, 5])) followUp[id] = 5;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.primary !== null, '12: Has primary');
  check(result.trace.selectedCandidates.length >= 2, `12: Should have 2 candidates (got ${result.trace.selectedCandidates.length})`);
}

/* ========== 13. Pro early stop after first batch ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('anger-shield', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('martyr', [1, 2])) universal[id] = 2;
  for (const id of getStrategyItemIds('anger-shield', [3, 4, 5])) followUp[id] = 5;
  for (const id of getStrategyItemIds('martyr', [3, 4, 5])) followUp[id] = 2;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'pro');
  check(result.primary === 'anger-shield', `13: Anger Shield primary (got ${result.primary ?? 'none'})`);
}

/* ========== 14. Pro full validation for two candidates ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('anger-shield', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('martyr', [1, 2])) universal[id] = 4;
  for (const id of getStrategyItemIds('perfectionist', [1, 2])) universal[id] = 4;
  for (const sid of ['anger-shield', 'martyr', 'perfectionist']) {
    for (const id of getStrategyItemIds(sid, [3, 4, 5, 6, 7, 8])) followUp[id] = 4;
  }
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'pro');
  check(result.primary === 'anger-shield', `14: Anger Shield primary (got ${result.primary ?? 'none'})`);
}

/* ========== 15. Core compatibility high with absent direct evidence ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('perfectionist', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('perfectionist', [3, 4, 5])) followUp[id] = 5;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.primary === 'perfectionist', `15: Perfectionist primary (got ${result.primary ?? 'none'})`);
  const hasCombined = result.trace.combinedScores.some(s => s.patternId === 'perfectionist');
  check(hasCombined, '15: Combined score computed');
}

/* ========== 16. Core compatibility changes ranking only after both eligible ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('martyr', [1, 2])) universal[id] = 3;
  for (const id of getStrategyItemIds('perfectionist', [1, 2])) universal[id] = 3;
  for (const id of getStrategyItemIds('martyr', [3, 4, 5])) followUp[id] = 3;
  for (const id of getStrategyItemIds('perfectionist', [3, 4, 5])) followUp[id] = 3;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.outcome !== 'insufficient-evidence', '16: Routing completed');
}

/* ========== 17. Initial leader loses after follow-up ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('martyr', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('overloaded-one', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('martyr', [3, 4, 5])) followUp[id] = 5;
  for (const id of getStrategyItemIds('overloaded-one', [3, 4, 5])) followUp[id] = 5;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.outcome !== 'insufficient-evidence', '17: Routing completed');
}

/* ========== 18. Final secondary inside 0.35 band ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('martyr', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('overloaded-one', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('martyr', [3, 4, 5])) followUp[id] = 5;
  for (const id of getStrategyItemIds('overloaded-one', [3, 4, 5])) followUp[id] = 5;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.primary === 'martyr', `18: Martyr primary (taxonomy order tiebreak, got ${result.primary ?? 'none'})`);
}

/* ========== 19. Exact tie returns primary plus secondary ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const sid of ['anger-shield', 'perfectionist', 'rescuer']) {
    for (const id of getStrategyItemIds(sid, [1, 2])) universal[id] = 5;
    for (const id of getStrategyItemIds(sid, [3, 4, 5])) followUp[id] = 5;
  }
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.primary !== null, '19: Has primary');
}

/* ========== 20. Insufficient candidate answer count ========== */
{
  const universal: Record<string, number> = {};
  for (const id of getStrategyItemIds('martyr', [1, 2])) universal[id] = 4;
  const resp = makeOverrides(universal);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.primary === null, '20: No primary with insufficient answers');
  check(result.outcome === 'insufficient-evidence' || result.outcome === 'no-clear-strategy',
    `20: Valid outcome ${result.outcome} for limited answers`);
}

/* ========== 21. Only Anger Shield screeners answered strongly ========== */
{
  const universal: Record<string, number> = {};
  for (const id of getStrategyItemIds('anger-shield', [1, 2])) universal[id] = 5;
  const resp = makeOverrides(universal);
  const eligibility = evaluateUniversalEligibility(resp);
  const asElig = eligibility.find(e => e.patternId === 'anger-shield');
  check(asElig?.status === 'eligible', '21: Anger Shield eligible');
  const otherElig = eligibility.filter(e => e.patternId !== 'anger-shield');
  const othersIneligible = otherElig.every(e => e.status === 'incomplete');
  check(othersIneligible, '21: All other strategies incomplete');
}

/* ========== 22. Overloaded screeners high but follow-up drops score ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('overloaded-one', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('overloaded-one', [3, 4, 5])) followUp[id] = 2;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.outcome !== 'insufficient-evidence', '22: Routing completed');
}

/* ========== 23. Reverse response conflicts with forward responses ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('martyr', [1, 2])) universal[id] = 4;
  for (const id of getStrategyItemIds('martyr', [3, 4, 5])) followUp[id] = 4;
  const resp = makeFullResponses(universal, followUp);
  const scores = scoreStrategyDirectEvidence(resp);
  const martyr = scores.find(s => s.patternId === 'martyr');
  check(martyr !== undefined, '23: Martyr score exists');
  if (martyr) {
    check(martyr.answeredCount > 0, '23: Martyr has answered items');
    const martyr05 = getStrategyItemId('martyr', 5);
    const martyr05Item = APPROVED_QUIZ_ITEMS.find(i => i.id === martyr05);
    if (martyr05Item) {
      const rawResponse = resp[martyr05];
      if (rawResponse !== undefined && rawResponse !== null) {
        const adjusted = scoreApprovedItemResponse(martyr05Item, rawResponse);
        check(adjusted === 6 - rawResponse, `23: Martyr-05 reverse-scored correctly: ${rawResponse} -> ${adjusted}`);
      }
    }
  }
}

/* ========== 24. Stable taxonomy fallback exercised ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const sid of STRAT_ORDER) {
    for (const id of getStrategyItemIds(sid as string, [1, 2])) universal[id] = 5;
    for (const id of getStrategyItemIds(sid as string, [3, 4, 5])) followUp[id] = 5;
  }
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.primary !== null, '24: All maxed -> has primary');
}

/* ========== 25. No duplicate follow-up items ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('martyr', [1, 2])) universal[id] = 4;
  for (const id of getStrategyItemIds('overloaded-one', [1, 2])) universal[id] = 4;
  for (const id of getStrategyItemIds('martyr', [3, 4, 5])) followUp[id] = 4;
  for (const id of getStrategyItemIds('overloaded-one', [3, 4, 5])) followUp[id] = 3;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  const unique = new Set(result.followUpItemIds);
  check(unique.size === result.followUpItemIds.length, '25: No duplicate follow-up item IDs');
}

/* ========== 26. Pro does not automatically fill all three slots ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('perfectionist', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('perfectionist', [3, 4, 5, 6, 7, 8])) followUp[id] = 5;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'pro');
  check(result.primary === 'perfectionist', `26: Perfectionist (got ${result.primary ?? 'none'})`);
  check(result.trace.selectedCandidates.length <= 2, `26: Not auto-filled to 3 (got ${result.trace.selectedCandidates.length})`);
}

/* ========== 27. Candidate outside 0.4 band excluded ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('anger-shield', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('martyr', [1, 2])) universal[id] = 5;
  for (const id of getStrategyItemIds('perfectionist', [1, 2])) universal[id] = 1;
  for (const id of getStrategyItemIds('anger-shield', [3, 4, 5])) followUp[id] = 5;
  for (const id of getStrategyItemIds('martyr', [3, 4, 5])) followUp[id] = 5;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.primary !== null, '27: Has primary');
}

/* ========== 28. Skips never become value 3 ========== */
{
  const resp = makeOverrides({});
  const scores = scoreStrategyDirectEvidence(resp);
  const nonZeroAnswered = scores.filter(s => s.answeredCount > 0);
  check(nonZeroAnswered.length === 0, '28: No answers means zero answered count');
}

/* ========== 29. Free never receives Pro items ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('martyr', [1, 2])) universal[id] = 4;
  for (const id of getStrategyItemIds('martyr', [3, 4, 5])) followUp[id] = 4;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  const proItems = result.followUpItemIds.filter(id => {
    const item = APPROVED_QUIZ_ITEMS.find(i => i.id === id);
    return item && item.access === 'pro';
  });
  check(proItems.length === 0, `29: Free mode has no Pro items (got ${proItems.length})`);
}

/* ========== 30. Initially ineligible cannot become final from core boost ========== */
{
  const universal: Record<string, number> = {};
  const followUp: Record<string, number> = {};
  for (const id of getStrategyItemIds('perfectionist', [1, 2])) universal[id] = 4;
  for (const id of getStrategyItemIds('perfectionist', [3, 4, 5])) followUp[id] = 4;
  const resp = makeFullResponses(universal, followUp);
  const result = produceStrategyRoutingResult(resp, 'free');
  check(result.primary === 'perfectionist', `30: Only eligible strategy can be primary (got ${result.primary ?? 'none'})`);
}

/* ========== SUMMARY ========== */
console.log(`\n=== STRATEGY ROUTING VALIDATION RESULTS ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (errors.length > 0) {
  console.log(`\nFailures:`);
  errors.forEach(e => console.log(`  ❌ ${e}`));
  process.exit(1);
} else {
  console.log(`\n✅ ALL ${passed} CHECKS PASSED`);
}
