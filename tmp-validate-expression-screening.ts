/*
 * Expression Individual Screening Validation — Batch 14 (Final)
 *
 * Validates 290 items across 42 groups, 145 Expressions.
 */

import {
  routeExpressionScreening,
  getEligibleExpressions,
  getEligibleExpressionIds,
  getExpressionScreeningItems,
  getAllScreeningItemsForExpressions,
  computeExpressionDirectScore,
  findRetryableSkippedItemIds,
  scoreExpressionAfterRetry,
  rankExpressionScores,
  selectGroupCandidates,
  selectFinalCandidates,
  getExpressionScreeningReadiness,
} from './src/lib/quiz/expressionScreening';
import { EXPRESSION_SCREENING_CONFIG } from './src/data/quiz/expressionScreeningConfig';
import { EXPRESSION_SCREENING_ITEMS } from './src/data/quiz/expressionScreeningItems';
import { EXPRESSION_REGISTRY } from './src/data/quiz/patternTaxonomy';
import { getAssessmentReadiness } from './src/data/quiz/questionBank';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(`FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

/* ==================================================================
 *  Config
 * ================================================================*/
assert('configVersion', EXPRESSION_SCREENING_CONFIG.configVersion === '1.0.0');

/* ==================================================================
 *  Batch 14 content validation
 * ================================================================*/

assert('total item count is 290', EXPRESSION_SCREENING_ITEMS.length === 290);

const items = EXPRESSION_SCREENING_ITEMS;
const allExprIds = new Set(EXPRESSION_REGISTRY.map(e => e.id));

const batch1 = [
  "silenced-people-pleaser","silenced-conflict-avoider","silenced-tension-and-silence",
  "silenced-pressure-building-anger","silenced-blurt-or-freeze","silenced-explanation-flood",
];
const batch2 = [
  "unheld-attachment-alarm","unheld-reassurance-seeker","unheld-return-tester",
  "unheld-jealousy-interpreter","unheld-conflict-for-contact","unheld-relationship-threat-scanner",
];
const batch3 = [
  "invisible-presence-minimizer","invisible-background-positioner","invisible-hidden-ambition",
  "invisible-praise-deflector","invisible-recognition-conflict",
  "invisible-approval-chameleon","invisible-needs-concealer",
];
const batch4 = [
  "shame-defective-one","shame-burden","shame-imposter","shame-comparison-prisoner",
  "shame-praise-disqualifier","shame-secret-keeper","shame-self-punisher",
];
const batch5 = [
  "shame-to-perfection","shame-to-anger","shame-to-disappearance",
  "shame-chronic-apologizer","shame-confession-loop",
  "shame-body-shamed-self","shame-morally-condemned-self",
  "controller-standard-enforcer","controller-constant-evaluator","controller-proving-achiever",
];
const batch6 = [
  "controller-control-scanner","controller-analysis-gatekeeper","controller-fixed-plan","controller-perception-manager",
  "avoidant-procrastinator","avoidant-distractor","avoidant-busy-avoider","avoidant-intellectualizer",
  "avoidant-emotional-evader","avoidant-ghost","avoidant-sleep-disappear","avoidant-pleasure-avoider",
];
const batch7 = [
  "avoidant-indecisive-one","avoidant-commitment-dodger","avoidant-perpetual-researcher","avoidant-crisis-creator",
  "hypervigilant-threat-forecaster","hypervigilant-conflict-predictor","hypervigilant-worst-case-rehearser","hypervigilant-loss-forecaster",
  "hypervigilant-exit-planner","hypervigilant-emergency-preparer","hypervigilant-sleepless-guard","hypervigilant-protective-parent",
];
const batch8 = [
  "hypervigilant-mood-scanner","hypervigilant-betrayal-scanner","hypervigilant-ambiguous-signal-interpreter","hypervigilant-weather-reporter",
  "hypervigilant-body-monitor","hypervigilant-digital-monitor","hypervigilant-substance-watcher",
  "entangled-pursuer","entangled-appeaser","entangled-direction-dependent","entangled-crisis-pair",
];
const batch9 = [
  "entangled-rescuer","entangled-mutual-monitor","entangled-identity-merger","entangled-withdraw-return",
  "grief-unexpressed","grief-silent-mourning","grief-later-emerging",
  "grief-specific-loss","grief-loyalty-to-pain","grief-protective-numbing",
];
const batch10 = [
  "martyr-over-giver","martyr-silent-sufferer","martyr-refuses-to-receive",
  "martyr-scorekeeper","martyr-guilt-tripper",
  "martyr-overfunctioning","martyr-rescuer-martyr","martyr-moral-martyr","martyr-crisis-martyr","martyr-burnout-blame",
];
const batch11 = [
  "rescuer-fixer","rescuer-crisis-rescuer","rescuer-advice-giver","rescuer-emotional-paramedic",
  "rescuer-consequence-blocker","rescuer-financial-rescuer","rescuer-protective-parent",
  "rescuer-indispensable-one","rescuer-white-knight","rescuer-professional-helper","rescuer-recovery-manager",
];
const batch12 = [
  "rescuer-overfunctioner","rescuer-hidden-contract-helper","rescuer-to-control","rescuer-to-martyr",
  "over-responsible-emotional-caretaker","over-responsible-peacekeeper","over-responsible-parentified-one","over-responsible-family-stabilizer",
  "over-responsible-chronic-apologizer","over-responsible-blame-taker","over-responsible-responsibility-sponge","over-responsible-consequence-carrier",
  "over-responsible-rest-guilty","over-responsible-boundary-guilty","over-responsible-survivor-guilt",
];
const batch13 = [
  "over-responsible-mind-reader","over-responsible-preventer","over-responsible-moral-overcorrector","over-responsible-confession-seeker",
  "overloaded-human-backup-system","overloaded-default-adult","overloaded-no-backup",
  "overloaded-mental-load-carrier","overloaded-cannot-delegate","overloaded-competence-trap",
  "overloaded-crisis-juggler","overloaded-capacity-denier","overloaded-last-minute-preventer","overloaded-stop-then-resume",
];
const batch14 = [
  "perfectionist-endless-reviser","perfectionist-moving-goalpost","perfectionist-all-or-nothing-evaluator",
  "perfectionist-beginner-avoider","perfectionist-performance-curator",
  "anger-explosive-shield","anger-contempt-shield","anger-intimidator",
  "anger-cold-shield","anger-defensive-debater","anger-passive-aggressive-shield","anger-grievance-keeper",
  "anger-righteous-avenger","anger-apology-cycle",
];
const allCovered = [...batch1, ...batch2, ...batch3, ...batch4, ...batch5, ...batch6, ...batch7, ...batch8, ...batch9, ...batch10, ...batch11, ...batch12, ...batch13, ...batch14];

const coveredSet = new Set(items.map(i => i.expressionId));
assert('covered count is 145', coveredSet.size === 145);
for (const eid of allCovered) assert(`covered: ${eid}`, coveredSet.has(eid));
assert('uncovered count is 0', allExprIds.size - coveredSet.size === 0);

// Items per Expression
{
  const counts: Record<string, number> = {};
  for (const i of items) counts[i.expressionId] = (counts[i.expressionId] ?? 0) + 1;
  for (const eid of allCovered) assert(`${eid} has 2 items`, counts[eid] === 2);
}

// Item numbers
for (const eid of allCovered) {
  const nums = items.filter(i => i.expressionId === eid).map(i => i.itemNumber).sort();
  assert(`${eid} numbers 1 and 2`, nums.length === 2 && nums[0] === 1 && nums[1] === 2);
}

// No dup IDs
assert('duplicate item IDs: 0', items.length === new Set(items.map(i => i.id)).size);
assert('invalid Expression IDs: 0', items.every(i => allExprIds.has(i.expressionId)));

// Groups
const allGroupIds = new Set(items.map(i => i.groupId));
assert('42 groups covered', allGroupIds.size === 42);

// All 25 uncovered groups
const allGroupDefs = [
  "expression-group-silenced-one-conflict-suppression","expression-group-silenced-one-speech-emergence",
  "expression-group-unheld-one-attachment-alarm-and-return","expression-group-unheld-one-relationship-threat-interpretation",
  "expression-group-invisible-one-presence-avoidance","expression-group-invisible-one-recognition-conflict",
  "expression-group-shame-bearer-core-defectiveness","expression-group-shame-bearer-exposure-concealment",
  "expression-group-shame-bearer-shame-expression-channels","expression-group-shame-bearer-body-moral-condemnation",
  "expression-group-controller-standards-evaluation","expression-group-controller-situation-management",
  "expression-group-avoidant-one-delay-distraction","expression-group-avoidant-one-withdrawal-disappearance",
  "expression-group-avoidant-one-decision-commitment",
  "expression-group-hypervigilant-one-anticipatory-threat","expression-group-hypervigilant-one-preparedness-exit",
  "expression-group-hypervigilant-one-relational-scanning","expression-group-hypervigilant-one-monitoring",
  "expression-group-entangled-one-proximity-pursuit","expression-group-entangled-one-identity-merger",
  "expression-group-grief-bearer-unexpressed-delayed","expression-group-grief-bearer-loss-attachment",
  "expression-group-martyr-overgiving-depletion","expression-group-martyr-recognition-reciprocity",
  "expression-group-martyr-overfunctioning-crisis",
  "expression-group-rescuer-intervention-fixing","expression-group-rescuer-consequence-prevention",
  "expression-group-rescuer-indispensable-helper","expression-group-rescuer-hidden-contract-control",
  "expression-group-over-responsible-one-emotional-care","expression-group-over-responsible-one-guilt-blame",
  "expression-group-over-responsible-one-boundary-rest","expression-group-over-responsible-one-anticipatory-moral",
  "expression-group-overloaded-one-capacity-backup","expression-group-overloaded-one-mental-load",
  "expression-group-overloaded-one-crisis-stop-resume",
  "expression-group-perfectionist-standards-evaluation","expression-group-perfectionist-performance-exposure",
  "expression-group-anger-shield-explosive-contempt","expression-group-anger-shield-cold-defensive",
  "expression-group-anger-shield-righteous-cycle",
];
assert('covered groups = 42', allGroupIds.size === 42);
assert('uncovered groups = 0', allGroupDefs.filter(g => !allGroupIds.has(g)).length === 0);

// Expression-to-group mapping
const expectedGroup: Record<string,string> = {
  "silenced-people-pleaser":"expression-group-silenced-one-conflict-suppression",
  "silenced-conflict-avoider":"expression-group-silenced-one-conflict-suppression",
  "silenced-tension-and-silence":"expression-group-silenced-one-conflict-suppression",
  "silenced-pressure-building-anger":"expression-group-silenced-one-speech-emergence",
  "silenced-blurt-or-freeze":"expression-group-silenced-one-speech-emergence",
  "silenced-explanation-flood":"expression-group-silenced-one-speech-emergence",
  "unheld-attachment-alarm":"expression-group-unheld-one-attachment-alarm-and-return",
  "unheld-reassurance-seeker":"expression-group-unheld-one-attachment-alarm-and-return",
  "unheld-return-tester":"expression-group-unheld-one-attachment-alarm-and-return",
  "unheld-jealousy-interpreter":"expression-group-unheld-one-relationship-threat-interpretation",
  "unheld-conflict-for-contact":"expression-group-unheld-one-relationship-threat-interpretation",
  "unheld-relationship-threat-scanner":"expression-group-unheld-one-relationship-threat-interpretation",
  "invisible-presence-minimizer":"expression-group-invisible-one-presence-avoidance",
  "invisible-background-positioner":"expression-group-invisible-one-presence-avoidance",
  "invisible-hidden-ambition":"expression-group-invisible-one-presence-avoidance",
  "invisible-praise-deflector":"expression-group-invisible-one-recognition-conflict",
  "invisible-recognition-conflict":"expression-group-invisible-one-recognition-conflict",
  "invisible-approval-chameleon":"expression-group-invisible-one-recognition-conflict",
  "invisible-needs-concealer":"expression-group-invisible-one-recognition-conflict",
  "shame-defective-one":"expression-group-shame-bearer-core-defectiveness",
  "shame-burden":"expression-group-shame-bearer-core-defectiveness",
  "shame-imposter":"expression-group-shame-bearer-core-defectiveness",
  "shame-comparison-prisoner":"expression-group-shame-bearer-core-defectiveness",
  "shame-praise-disqualifier":"expression-group-shame-bearer-exposure-concealment",
  "shame-secret-keeper":"expression-group-shame-bearer-exposure-concealment",
  "shame-self-punisher":"expression-group-shame-bearer-exposure-concealment",
  "shame-to-perfection":"expression-group-shame-bearer-shame-expression-channels",
  "shame-to-anger":"expression-group-shame-bearer-shame-expression-channels",
  "shame-to-disappearance":"expression-group-shame-bearer-shame-expression-channels",
  "shame-chronic-apologizer":"expression-group-shame-bearer-shame-expression-channels",
  "shame-confession-loop":"expression-group-shame-bearer-shame-expression-channels",
  "shame-body-shamed-self":"expression-group-shame-bearer-body-moral-condemnation",
  "shame-morally-condemned-self":"expression-group-shame-bearer-body-moral-condemnation",
  "controller-standard-enforcer":"expression-group-controller-standards-evaluation",
  "controller-constant-evaluator":"expression-group-controller-standards-evaluation",
  "controller-proving-achiever":"expression-group-controller-standards-evaluation",
  "controller-control-scanner":"expression-group-controller-situation-management",
  "controller-analysis-gatekeeper":"expression-group-controller-situation-management",
  "controller-fixed-plan":"expression-group-controller-situation-management",
  "controller-perception-manager":"expression-group-controller-situation-management",
  "avoidant-procrastinator":"expression-group-avoidant-one-delay-distraction",
  "avoidant-distractor":"expression-group-avoidant-one-delay-distraction",
  "avoidant-busy-avoider":"expression-group-avoidant-one-delay-distraction",
  "avoidant-intellectualizer":"expression-group-avoidant-one-delay-distraction",
  "avoidant-emotional-evader":"expression-group-avoidant-one-withdrawal-disappearance",
  "avoidant-ghost":"expression-group-avoidant-one-withdrawal-disappearance",
  "avoidant-sleep-disappear":"expression-group-avoidant-one-withdrawal-disappearance",
  "avoidant-pleasure-avoider":"expression-group-avoidant-one-withdrawal-disappearance",
  "avoidant-indecisive-one":"expression-group-avoidant-one-decision-commitment",
  "avoidant-commitment-dodger":"expression-group-avoidant-one-decision-commitment",
  "avoidant-perpetual-researcher":"expression-group-avoidant-one-decision-commitment",
  "avoidant-crisis-creator":"expression-group-avoidant-one-decision-commitment",
  "hypervigilant-threat-forecaster":"expression-group-hypervigilant-one-anticipatory-threat",
  "hypervigilant-conflict-predictor":"expression-group-hypervigilant-one-anticipatory-threat",
  "hypervigilant-worst-case-rehearser":"expression-group-hypervigilant-one-anticipatory-threat",
  "hypervigilant-loss-forecaster":"expression-group-hypervigilant-one-anticipatory-threat",
  "hypervigilant-exit-planner":"expression-group-hypervigilant-one-preparedness-exit",
  "hypervigilant-emergency-preparer":"expression-group-hypervigilant-one-preparedness-exit",
  "hypervigilant-sleepless-guard":"expression-group-hypervigilant-one-preparedness-exit",
  "hypervigilant-protective-parent":"expression-group-hypervigilant-one-preparedness-exit",
  "hypervigilant-mood-scanner":"expression-group-hypervigilant-one-relational-scanning",
  "hypervigilant-betrayal-scanner":"expression-group-hypervigilant-one-relational-scanning",
  "hypervigilant-ambiguous-signal-interpreter":"expression-group-hypervigilant-one-relational-scanning",
  "hypervigilant-weather-reporter":"expression-group-hypervigilant-one-relational-scanning",
  "hypervigilant-body-monitor":"expression-group-hypervigilant-one-monitoring",
  "hypervigilant-digital-monitor":"expression-group-hypervigilant-one-monitoring",
  "hypervigilant-substance-watcher":"expression-group-hypervigilant-one-monitoring",
  "entangled-pursuer":"expression-group-entangled-one-proximity-pursuit",
  "entangled-appeaser":"expression-group-entangled-one-proximity-pursuit",
  "entangled-direction-dependent":"expression-group-entangled-one-proximity-pursuit",
  "entangled-crisis-pair":"expression-group-entangled-one-proximity-pursuit",
  "entangled-rescuer":"expression-group-entangled-one-identity-merger",
  "entangled-mutual-monitor":"expression-group-entangled-one-identity-merger",
  "entangled-identity-merger":"expression-group-entangled-one-identity-merger",
  "entangled-withdraw-return":"expression-group-entangled-one-identity-merger",
  "grief-unexpressed":"expression-group-grief-bearer-unexpressed-delayed",
  "grief-silent-mourning":"expression-group-grief-bearer-unexpressed-delayed",
  "grief-later-emerging":"expression-group-grief-bearer-unexpressed-delayed",
  "grief-specific-loss":"expression-group-grief-bearer-loss-attachment",
  "grief-loyalty-to-pain":"expression-group-grief-bearer-loss-attachment",
  "grief-protective-numbing":"expression-group-grief-bearer-loss-attachment",
  "martyr-over-giver":"expression-group-martyr-overgiving-depletion",
  "martyr-silent-sufferer":"expression-group-martyr-overgiving-depletion",
  "martyr-refuses-to-receive":"expression-group-martyr-overgiving-depletion",
  "martyr-scorekeeper":"expression-group-martyr-recognition-reciprocity",
  "martyr-guilt-tripper":"expression-group-martyr-recognition-reciprocity",
  "martyr-overfunctioning":"expression-group-martyr-overfunctioning-crisis",
  "martyr-rescuer-martyr":"expression-group-martyr-overfunctioning-crisis",
  "martyr-moral-martyr":"expression-group-martyr-overfunctioning-crisis",
  "martyr-crisis-martyr":"expression-group-martyr-overfunctioning-crisis",
  "martyr-burnout-blame":"expression-group-martyr-overfunctioning-crisis",
  "rescuer-fixer":"expression-group-rescuer-intervention-fixing",
  "rescuer-crisis-rescuer":"expression-group-rescuer-intervention-fixing",
  "rescuer-advice-giver":"expression-group-rescuer-intervention-fixing",
  "rescuer-emotional-paramedic":"expression-group-rescuer-intervention-fixing",
  "rescuer-consequence-blocker":"expression-group-rescuer-consequence-prevention",
  "rescuer-financial-rescuer":"expression-group-rescuer-consequence-prevention",
  "rescuer-protective-parent":"expression-group-rescuer-consequence-prevention",
  "rescuer-indispensable-one":"expression-group-rescuer-indispensable-helper",
  "rescuer-white-knight":"expression-group-rescuer-indispensable-helper",
  "rescuer-professional-helper":"expression-group-rescuer-indispensable-helper",
  "rescuer-recovery-manager":"expression-group-rescuer-indispensable-helper",
  "rescuer-overfunctioner":"expression-group-rescuer-hidden-contract-control",
  "rescuer-hidden-contract-helper":"expression-group-rescuer-hidden-contract-control",
  "rescuer-to-control":"expression-group-rescuer-hidden-contract-control",
  "rescuer-to-martyr":"expression-group-rescuer-hidden-contract-control",
  "over-responsible-emotional-caretaker":"expression-group-over-responsible-one-emotional-care",
  "over-responsible-peacekeeper":"expression-group-over-responsible-one-emotional-care",
  "over-responsible-parentified-one":"expression-group-over-responsible-one-emotional-care",
  "over-responsible-family-stabilizer":"expression-group-over-responsible-one-emotional-care",
  "over-responsible-chronic-apologizer":"expression-group-over-responsible-one-guilt-blame",
  "over-responsible-blame-taker":"expression-group-over-responsible-one-guilt-blame",
  "over-responsible-responsibility-sponge":"expression-group-over-responsible-one-guilt-blame",
  "over-responsible-consequence-carrier":"expression-group-over-responsible-one-guilt-blame",
  "over-responsible-rest-guilty":"expression-group-over-responsible-one-boundary-rest",
  "over-responsible-boundary-guilty":"expression-group-over-responsible-one-boundary-rest",
  "over-responsible-survivor-guilt":"expression-group-over-responsible-one-boundary-rest",
  "over-responsible-mind-reader":"expression-group-over-responsible-one-anticipatory-moral",
  "over-responsible-preventer":"expression-group-over-responsible-one-anticipatory-moral",
  "over-responsible-moral-overcorrector":"expression-group-over-responsible-one-anticipatory-moral",
  "over-responsible-confession-seeker":"expression-group-over-responsible-one-anticipatory-moral",
  "overloaded-human-backup-system":"expression-group-overloaded-one-capacity-backup",
  "overloaded-default-adult":"expression-group-overloaded-one-capacity-backup",
  "overloaded-no-backup":"expression-group-overloaded-one-capacity-backup",
  "overloaded-mental-load-carrier":"expression-group-overloaded-one-mental-load",
  "overloaded-cannot-delegate":"expression-group-overloaded-one-mental-load",
  "overloaded-competence-trap":"expression-group-overloaded-one-mental-load",
  "overloaded-crisis-juggler":"expression-group-overloaded-one-crisis-stop-resume",
  "overloaded-capacity-denier":"expression-group-overloaded-one-crisis-stop-resume",
  "overloaded-last-minute-preventer":"expression-group-overloaded-one-crisis-stop-resume",
  "overloaded-stop-then-resume":"expression-group-overloaded-one-crisis-stop-resume",
  "perfectionist-endless-reviser":"expression-group-perfectionist-standards-evaluation",
  "perfectionist-moving-goalpost":"expression-group-perfectionist-standards-evaluation",
  "perfectionist-all-or-nothing-evaluator":"expression-group-perfectionist-standards-evaluation",
  "perfectionist-beginner-avoider":"expression-group-perfectionist-performance-exposure",
  "perfectionist-performance-curator":"expression-group-perfectionist-performance-exposure",
  "anger-explosive-shield":"expression-group-anger-shield-explosive-contempt",
  "anger-contempt-shield":"expression-group-anger-shield-explosive-contempt",
  "anger-intimidator":"expression-group-anger-shield-explosive-contempt",
  "anger-cold-shield":"expression-group-anger-shield-cold-defensive",
  "anger-defensive-debater":"expression-group-anger-shield-cold-defensive",
  "anger-passive-aggressive-shield":"expression-group-anger-shield-cold-defensive",
  "anger-grievance-keeper":"expression-group-anger-shield-cold-defensive",
  "anger-righteous-avenger":"expression-group-anger-shield-righteous-cycle",
  "anger-apology-cycle":"expression-group-anger-shield-righteous-cycle",
};
for (const item of items) {
  const exp = expectedGroup[item.expressionId];
  assert(`${item.expressionId} → ${exp}`, item.groupId === exp);
}

// All Pro, no reverse, no empty
assert('non-Pro: 0', items.every(i => i.access === 'pro'));
assert('reverse-scored: 0', items.every(i => i.reverseScored === false));
assert('empty prompts: 0', items.every(i => i.prompt.trim().length > 0));

// Group sizes
{
  for (const g of ['expression-group-silenced-one-conflict-suppression','expression-group-silenced-one-speech-emergence',
                   'expression-group-unheld-one-attachment-alarm-and-return','expression-group-unheld-one-relationship-threat-interpretation',
                   'expression-group-invisible-one-presence-avoidance']) {
    const gi = items.filter(i => i.groupId === g);
    assert(`${g} 3 expr`, new Set(gi.map(i => i.expressionId)).size === 3);
    assert(`${g} 6 items`, gi.length === 6);
  }
  const rcItems = items.filter(i => i.groupId === 'expression-group-invisible-one-recognition-conflict');
  assert('recognition-conflict 4 expr', new Set(rcItems.map(i => i.expressionId)).size === 4);
  assert('recognition-conflict 8 items', rcItems.length === 8);
  const g7 = items.filter(i => i.groupId === 'expression-group-shame-bearer-core-defectiveness');
  assert('core-defectiveness 4 expr', new Set(g7.map(i => i.expressionId)).size === 4);
  assert('core-defectiveness 8 items', g7.length === 8);
  const g8 = items.filter(i => i.groupId === 'expression-group-shame-bearer-exposure-concealment');
  assert('exposure-concealment 3 expr', new Set(g8.map(i => i.expressionId)).size === 3);
  assert('exposure-concealment 6 items', g8.length === 6);
  const g9 = items.filter(i => i.groupId === 'expression-group-shame-bearer-shame-expression-channels');
  assert('shame-expression-channels 5 expr', new Set(g9.map(i => i.expressionId)).size === 5);
  assert('shame-expression-channels 10 items', g9.length === 10);
  const g10 = items.filter(i => i.groupId === 'expression-group-shame-bearer-body-moral-condemnation');
  assert('body-moral-condemnation 2 expr', new Set(g10.map(i => i.expressionId)).size === 2);
  assert('body-moral-condemnation 4 items', g10.length === 4);
  const g11 = items.filter(i => i.groupId === 'expression-group-controller-standards-evaluation');
  assert('standards-evaluation 3 expr', new Set(g11.map(i => i.expressionId)).size === 3);
  assert('standards-evaluation 6 items', g11.length === 6);
  const g12 = items.filter(i => i.groupId === 'expression-group-controller-situation-management');
  assert('situation-management 4 expr', new Set(g12.map(i => i.expressionId)).size === 4);
  assert('situation-management 8 items', g12.length === 8);
  const g13 = items.filter(i => i.groupId === 'expression-group-avoidant-one-delay-distraction');
  assert('delay-distraction 4 expr', new Set(g13.map(i => i.expressionId)).size === 4);
  assert('delay-distraction 8 items', g13.length === 8);
  const g14 = items.filter(i => i.groupId === 'expression-group-avoidant-one-withdrawal-disappearance');
  assert('withdrawal-disappearance 4 expr', new Set(g14.map(i => i.expressionId)).size === 4);
  assert('withdrawal-disappearance 8 items', g14.length === 8);
  const g15 = items.filter(i => i.groupId === 'expression-group-avoidant-one-decision-commitment');
  assert('decision-commitment 4 expr', new Set(g15.map(i => i.expressionId)).size === 4);
  assert('decision-commitment 8 items', g15.length === 8);
  const g16 = items.filter(i => i.groupId === 'expression-group-hypervigilant-one-anticipatory-threat');
  assert('anticipatory-threat 4 expr', new Set(g16.map(i => i.expressionId)).size === 4);
  assert('anticipatory-threat 8 items', g16.length === 8);
  const g17 = items.filter(i => i.groupId === 'expression-group-hypervigilant-one-preparedness-exit');
  assert('preparedness-exit 4 expr', new Set(g17.map(i => i.expressionId)).size === 4);
  assert('preparedness-exit 8 items', g17.length === 8);
  const g18 = items.filter(i => i.groupId === 'expression-group-hypervigilant-one-relational-scanning');
  assert('relational-scanning 4 expr', new Set(g18.map(i => i.expressionId)).size === 4);
  assert('relational-scanning 8 items', g18.length === 8);
  const g19 = items.filter(i => i.groupId === 'expression-group-hypervigilant-one-monitoring');
  assert('monitoring 3 expr', new Set(g19.map(i => i.expressionId)).size === 3);
  assert('monitoring 6 items', g19.length === 6);
  const g20 = items.filter(i => i.groupId === 'expression-group-entangled-one-proximity-pursuit');
  assert('proximity-pursuit 4 expr', new Set(g20.map(i => i.expressionId)).size === 4);
  assert('proximity-pursuit 8 items', g20.length === 8);
  const g21 = items.filter(i => i.groupId === 'expression-group-entangled-one-identity-merger');
  assert('identity-merger 4 expr', new Set(g21.map(i => i.expressionId)).size === 4);
  assert('identity-merger 8 items', g21.length === 8);
  const g22 = items.filter(i => i.groupId === 'expression-group-grief-bearer-unexpressed-delayed');
  assert('unexpressed-delayed 3 expr', new Set(g22.map(i => i.expressionId)).size === 3);
  assert('unexpressed-delayed 6 items', g22.length === 6);
  const g23 = items.filter(i => i.groupId === 'expression-group-grief-bearer-loss-attachment');
  assert('loss-attachment 3 expr', new Set(g23.map(i => i.expressionId)).size === 3);
  assert('loss-attachment 6 items', g23.length === 6);
  const g24 = items.filter(i => i.groupId === 'expression-group-martyr-overgiving-depletion');
  assert('overgiving-depletion 3 expr', new Set(g24.map(i => i.expressionId)).size === 3);
  assert('overgiving-depletion 6 items', g24.length === 6);
  const g25 = items.filter(i => i.groupId === 'expression-group-martyr-recognition-reciprocity');
  assert('recognition-reciprocity 2 expr', new Set(g25.map(i => i.expressionId)).size === 2);
  assert('recognition-reciprocity 4 items', g25.length === 4);
  const g26 = items.filter(i => i.groupId === 'expression-group-martyr-overfunctioning-crisis');
  assert('overfunctioning-crisis 5 expr', new Set(g26.map(i => i.expressionId)).size === 5);
  assert('overfunctioning-crisis 10 items', g26.length === 10);
  const g27 = items.filter(i => i.groupId === 'expression-group-rescuer-intervention-fixing');
  assert('intervention-fixing 4 expr', new Set(g27.map(i => i.expressionId)).size === 4);
  assert('intervention-fixing 8 items', g27.length === 8);
  const g28 = items.filter(i => i.groupId === 'expression-group-rescuer-consequence-prevention');
  assert('consequence-prevention 3 expr', new Set(g28.map(i => i.expressionId)).size === 3);
  assert('consequence-prevention 6 items', g28.length === 6);
  const g29 = items.filter(i => i.groupId === 'expression-group-rescuer-indispensable-helper');
  assert('indispensable-helper 4 expr', new Set(g29.map(i => i.expressionId)).size === 4);
  assert('indispensable-helper 8 items', g29.length === 8);
  const g30 = items.filter(i => i.groupId === 'expression-group-rescuer-hidden-contract-control');
  assert('hidden-contract-control 4 expr', new Set(g30.map(i => i.expressionId)).size === 4);
  assert('hidden-contract-control 8 items', g30.length === 8);
  const g31 = items.filter(i => i.groupId === 'expression-group-over-responsible-one-emotional-care');
  assert('emotional-care 4 expr', new Set(g31.map(i => i.expressionId)).size === 4);
  assert('emotional-care 8 items', g31.length === 8);
  const g32 = items.filter(i => i.groupId === 'expression-group-over-responsible-one-guilt-blame');
  assert('guilt-blame 4 expr', new Set(g32.map(i => i.expressionId)).size === 4);
  assert('guilt-blame 8 items', g32.length === 8);
  const g33 = items.filter(i => i.groupId === 'expression-group-over-responsible-one-boundary-rest');
  assert('boundary-rest 3 expr', new Set(g33.map(i => i.expressionId)).size === 3);
  assert('boundary-rest 6 items', g33.length === 6);
  const g34 = items.filter(i => i.groupId === 'expression-group-over-responsible-one-anticipatory-moral');
  assert('anticipatory-moral 4 expr', new Set(g34.map(i => i.expressionId)).size === 4);
  assert('anticipatory-moral 8 items', g34.length === 8);
  const g35 = items.filter(i => i.groupId === 'expression-group-overloaded-one-capacity-backup');
  assert('capacity-backup 3 expr', new Set(g35.map(i => i.expressionId)).size === 3);
  assert('capacity-backup 6 items', g35.length === 6);
  const g36 = items.filter(i => i.groupId === 'expression-group-overloaded-one-mental-load');
  assert('mental-load 3 expr', new Set(g36.map(i => i.expressionId)).size === 3);
  assert('mental-load 6 items', g36.length === 6);
  const g37 = items.filter(i => i.groupId === 'expression-group-overloaded-one-crisis-stop-resume');
  assert('crisis-stop-resume 4 expr', new Set(g37.map(i => i.expressionId)).size === 4);
  assert('crisis-stop-resume 8 items', g37.length === 8);
  const g38 = items.filter(i => i.groupId === 'expression-group-perfectionist-standards-evaluation');
  assert('standards-evaluation 3 expr', new Set(g38.map(i => i.expressionId)).size === 3);
  assert('standards-evaluation 6 items', g38.length === 6);
  const g39 = items.filter(i => i.groupId === 'expression-group-perfectionist-performance-exposure');
  assert('performance-exposure 2 expr', new Set(g39.map(i => i.expressionId)).size === 2);
  assert('performance-exposure 4 items', g39.length === 4);
  const g40 = items.filter(i => i.groupId === 'expression-group-anger-shield-explosive-contempt');
  assert('explosive-contempt 3 expr', new Set(g40.map(i => i.expressionId)).size === 3);
  assert('explosive-contempt 6 items', g40.length === 6);
  const g41 = items.filter(i => i.groupId === 'expression-group-anger-shield-cold-defensive');
  assert('cold-defensive 4 expr', new Set(g41.map(i => i.expressionId)).size === 4);
  assert('cold-defensive 8 items', g41.length === 8);
  const g42 = items.filter(i => i.groupId === 'expression-group-anger-shield-righteous-cycle');
  assert('righteous-cycle 2 expr', new Set(g42.map(i => i.expressionId)).size === 2);
  assert('righteous-cycle 4 items', g42.length === 4);
}

// No other Expression has items
assert('0 uncovered have no items',
  [...allExprIds].filter(e => !coveredSet.has(e)).length === 0);

// Batch 14 additions: canonical prefix, uniqueness, unchanged prior items
{
  const batch14Items = items.filter(i => batch14.includes(i.expressionId));
  assert('batch14 exactly 28 items', batch14Items.length === 28);
  assert('28 new IDs occur exactly once', new Set(batch14Items.map(i => i.id)).size === 28);
  assert('every new ID has parent prefix',
    batch14Items.every(i => i.id.startsWith('expression-screen-perfectionist-') || i.id.startsWith('expression-screen-anger-')));
  const displayNames = new Set(EXPRESSION_REGISTRY.map(e => e.name.toLowerCase()));
  assert('no display name registered as Expression ID',
    batch14Items.every(i => !displayNames.has(i.expressionId.toLowerCase().replace(/-/g, ' '))));
  const nonBatch14 = items.filter(i => !batch14.includes(i.expressionId));
  assert('262 prior items unchanged', nonBatch14.length === 262);
  assert('no other Expression receives items',
    [...allExprIds].every(e => batch14.includes(e) || coveredSet.has(e) === (nonBatch14.some(i => i.expressionId === e))));
}

/* ==================================================================
 *  Free mode
 * ================================================================*/
{
  const r = routeExpressionScreening('free', ['expression-group-hypervigilant-one-relational-scanning'], []);
  assert('free → expression-not-assessed', r.category === 'expression-not-assessed');
}

/* ==================================================================
 *  Retrieval — Batch 7 groups
 * ================================================================*/
{
  const e = getEligibleExpressions(['expression-group-avoidant-one-decision-commitment']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-avoidant-one-decision-commitment'] ?? [];
  assert('decision-commitment → 4', ids.length === 4);
  assert('avoidant-indecisive-one', ids.includes('avoidant-indecisive-one'));
  assert('avoidant-commitment-dodger', ids.includes('avoidant-commitment-dodger'));
  assert('avoidant-perpetual-researcher', ids.includes('avoidant-perpetual-researcher'));
  assert('avoidant-crisis-creator', ids.includes('avoidant-crisis-creator'));
}
{
  const e = getEligibleExpressions(['expression-group-hypervigilant-one-anticipatory-threat']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-hypervigilant-one-anticipatory-threat'] ?? [];
  assert('anticipatory-threat → 4', ids.length === 4);
  assert('hypervigilant-threat-forecaster', ids.includes('hypervigilant-threat-forecaster'));
  assert('hypervigilant-conflict-predictor', ids.includes('hypervigilant-conflict-predictor'));
  assert('hypervigilant-worst-case-rehearser', ids.includes('hypervigilant-worst-case-rehearser'));
  assert('hypervigilant-loss-forecaster', ids.includes('hypervigilant-loss-forecaster'));
}
{
  const e = getEligibleExpressions(['expression-group-hypervigilant-one-preparedness-exit']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-hypervigilant-one-preparedness-exit'] ?? [];
  assert('preparedness-exit → 4', ids.length === 4);
  assert('hypervigilant-exit-planner', ids.includes('hypervigilant-exit-planner'));
  assert('hypervigilant-emergency-preparer', ids.includes('hypervigilant-emergency-preparer'));
  assert('hypervigilant-sleepless-guard', ids.includes('hypervigilant-sleepless-guard'));
  assert('hypervigilant-protective-parent', ids.includes('hypervigilant-protective-parent'));
}
{
  const e = getEligibleExpressions(['expression-group-hypervigilant-one-relational-scanning']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-hypervigilant-one-relational-scanning'] ?? [];
  assert('relational-scanning → 4', ids.length === 4);
  assert('hypervigilant-mood-scanner', ids.includes('hypervigilant-mood-scanner'));
  assert('hypervigilant-betrayal-scanner', ids.includes('hypervigilant-betrayal-scanner'));
  assert('hypervigilant-ambiguous-signal-interpreter', ids.includes('hypervigilant-ambiguous-signal-interpreter'));
  assert('hypervigilant-weather-reporter', ids.includes('hypervigilant-weather-reporter'));
}
{
  const e = getEligibleExpressions(['expression-group-hypervigilant-one-monitoring']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-hypervigilant-one-monitoring'] ?? [];
  assert('monitoring → 3', ids.length === 3);
  assert('hypervigilant-body-monitor', ids.includes('hypervigilant-body-monitor'));
  assert('hypervigilant-digital-monitor', ids.includes('hypervigilant-digital-monitor'));
  assert('hypervigilant-substance-watcher', ids.includes('hypervigilant-substance-watcher'));
}
{
  const e = getEligibleExpressions(['expression-group-entangled-one-proximity-pursuit']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-entangled-one-proximity-pursuit'] ?? [];
  assert('proximity-pursuit → 4', ids.length === 4);
  assert('entangled-pursuer', ids.includes('entangled-pursuer'));
  assert('entangled-appeaser', ids.includes('entangled-appeaser'));
  assert('entangled-direction-dependent', ids.includes('entangled-direction-dependent'));
  assert('entangled-crisis-pair', ids.includes('entangled-crisis-pair'));
}
assert('all 3 → 11', getEligibleExpressionIds([
  'expression-group-hypervigilant-one-relational-scanning',
  'expression-group-hypervigilant-one-monitoring',
  'expression-group-entangled-one-proximity-pursuit',
]).length === 11);

// All 162 item IDs returned once
{
  const ids = getEligibleExpressionIds([...allGroupIds]);
  const { screeningItemIdsByExpression, duplicateItemIdsPrevented } = getAllScreeningItemsForExpressions(ids);
  const allReturned = Object.values(screeningItemIdsByExpression).flat();
  assert('all 290 items returned', allReturned.length === 290);
  assert('all 290 unique', new Set(allReturned).size === 290);
  assert('no duplicate items', duplicateItemIdsPrevented.length === 0);
}

// Item ownership
for (const item of items) {
  assert(`${item.expressionId} owns items`,
    getExpressionScreeningItems(item.expressionId).every(r => r.expressionId === item.expressionId));
}

// Excluded
assert('indecisive excluded from hypervigilant',
  !getEligibleExpressionIds(['expression-group-hypervigilant-one-anticipatory-threat']).includes('avoidant-indecisive-one'));

// Duplicate group
assert('dup group no dup',
  new Set(Object.values(getEligibleExpressions(['expression-group-hypervigilant-one-anticipatory-threat','expression-group-hypervigilant-one-anticipatory-threat']).eligibleExpressionIdsByGroup).flat()).size === 4);

// Batch 7 expressions are not missing
assert('hypervigilant-threat-forecaster has items',
  !getAllScreeningItemsForExpressions(['hypervigilant-threat-forecaster']).missingItemMappings.includes('hypervigilant-threat-forecaster'));
assert('avoidant-indecisive-one has items',
  !getAllScreeningItemsForExpressions(['avoidant-indecisive-one']).missingItemMappings.includes('avoidant-indecisive-one'));
assert('hypervigilant-sleepless-guard has items',
  !getAllScreeningItemsForExpressions(['hypervigilant-sleepless-guard']).missingItemMappings.includes('hypervigilant-sleepless-guard'));
assert('hypervigilant-mood-scanner has items',
  !getAllScreeningItemsForExpressions(['hypervigilant-mood-scanner']).missingItemMappings.includes('hypervigilant-mood-scanner'));
assert('hypervigilant-substance-watcher has items',
  !getAllScreeningItemsForExpressions(['hypervigilant-substance-watcher']).missingItemMappings.includes('hypervigilant-substance-watcher'));
assert('entangled-pursuer has items',
  !getAllScreeningItemsForExpressions(['entangled-pursuer']).missingItemMappings.includes('entangled-pursuer'));

/* ==================================================================
 *  Retrieval — Batch 9 groups
 * ================================================================*/
{
  const e = getEligibleExpressions(['expression-group-entangled-one-identity-merger']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-entangled-one-identity-merger'] ?? [];
  assert('identity-merger → 4', ids.length === 4);
  assert('entangled-rescuer', ids.includes('entangled-rescuer'));
  assert('entangled-mutual-monitor', ids.includes('entangled-mutual-monitor'));
  assert('entangled-identity-merger', ids.includes('entangled-identity-merger'));
  assert('entangled-withdraw-return', ids.includes('entangled-withdraw-return'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('identity-merger 8 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 8);
}
{
  const e = getEligibleExpressions(['expression-group-grief-bearer-unexpressed-delayed']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-grief-bearer-unexpressed-delayed'] ?? [];
  assert('unexpressed-delayed → 3', ids.length === 3);
  assert('grief-unexpressed', ids.includes('grief-unexpressed'));
  assert('grief-silent-mourning', ids.includes('grief-silent-mourning'));
  assert('grief-later-emerging', ids.includes('grief-later-emerging'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('unexpressed-delayed 6 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 6);
}
{
  const e = getEligibleExpressions(['expression-group-grief-bearer-loss-attachment']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-grief-bearer-loss-attachment'] ?? [];
  assert('loss-attachment → 3', ids.length === 3);
  assert('grief-specific-loss', ids.includes('grief-specific-loss'));
  assert('grief-loyalty-to-pain', ids.includes('grief-loyalty-to-pain'));
  assert('grief-protective-numbing', ids.includes('grief-protective-numbing'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('loss-attachment 6 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 6);
}
{
  const ids = getEligibleExpressionIds([
    'expression-group-entangled-one-identity-merger',
    'expression-group-grief-bearer-unexpressed-delayed',
    'expression-group-grief-bearer-loss-attachment',
  ]);
  assert('all 3 → 10', ids.length === 10);
  const { screeningItemIdsByExpression, missingItemMappings } = getAllScreeningItemsForExpressions(ids);
  const allReturned = Object.values(screeningItemIdsByExpression).flat();
  assert('10 unique Expressions', new Set(ids).size === 10);
  assert('20 unique items', allReturned.length === 20 && new Set(allReturned).size === 20);
  assert('no missing mappings batch 9', missingItemMappings.length === 0);
}
assert('dup group no dup batch 9',
  new Set(Object.values(getEligibleExpressions([
    'expression-group-entangled-one-identity-merger',
    'expression-group-entangled-one-identity-merger',
  ]).eligibleExpressionIdsByGroup).flat()).size === 4);
assert('pursuer excluded from identity-merger',
  !getEligibleExpressionIds(['expression-group-entangled-one-identity-merger']).includes('entangled-pursuer'));
assert('grief-unexpressed excluded from loss-attachment',
  !getEligibleExpressionIds(['expression-group-grief-bearer-loss-attachment']).includes('grief-unexpressed'));
assert('batch 7+9 all covered, none missing',
  getAllScreeningItemsForExpressions(['entangled-rescuer', 'perfectionist-endless-reviser']).missingItemMappings.length === 0);
assert('covered not missing',
  !getAllScreeningItemsForExpressions(['entangled-rescuer', 'perfectionist-endless-reviser']).missingItemMappings.includes('entangled-rescuer'));
assert('batch 9 has items',
  !getAllScreeningItemsForExpressions(['grief-protective-numbing']).missingItemMappings.includes('grief-protective-numbing'));
assert('entangled-rescuer has items',
  !getAllScreeningItemsForExpressions(['entangled-rescuer']).missingItemMappings.includes('entangled-rescuer'));

/* ==================================================================
 *  Retrieval — Batch 10 groups
 * ================================================================*/
{
  const e = getEligibleExpressions(['expression-group-martyr-overgiving-depletion']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-martyr-overgiving-depletion'] ?? [];
  assert('overgiving-depletion → 3', ids.length === 3);
  assert('martyr-over-giver', ids.includes('martyr-over-giver'));
  assert('martyr-silent-sufferer', ids.includes('martyr-silent-sufferer'));
  assert('martyr-refuses-to-receive', ids.includes('martyr-refuses-to-receive'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('overgiving-depletion 6 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 6);
}
{
  const e = getEligibleExpressions(['expression-group-martyr-recognition-reciprocity']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-martyr-recognition-reciprocity'] ?? [];
  assert('recognition-reciprocity → 2', ids.length === 2);
  assert('martyr-scorekeeper', ids.includes('martyr-scorekeeper'));
  assert('martyr-guilt-tripper', ids.includes('martyr-guilt-tripper'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('recognition-reciprocity 4 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 4);
}
{
  const e = getEligibleExpressions(['expression-group-martyr-overfunctioning-crisis']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-martyr-overfunctioning-crisis'] ?? [];
  assert('overfunctioning-crisis → 5', ids.length === 5);
  assert('martyr-overfunctioning', ids.includes('martyr-overfunctioning'));
  assert('martyr-rescuer-martyr', ids.includes('martyr-rescuer-martyr'));
  assert('martyr-moral-martyr', ids.includes('martyr-moral-martyr'));
  assert('martyr-crisis-martyr', ids.includes('martyr-crisis-martyr'));
  assert('martyr-burnout-blame', ids.includes('martyr-burnout-blame'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('overfunctioning-crisis 10 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 10);
}
{
  const ids = getEligibleExpressionIds([
    'expression-group-martyr-overgiving-depletion',
    'expression-group-martyr-recognition-reciprocity',
    'expression-group-martyr-overfunctioning-crisis',
  ]);
  assert('all 3 → 10', ids.length === 10);
  const { screeningItemIdsByExpression, missingItemMappings } = getAllScreeningItemsForExpressions(ids);
  const allReturned = Object.values(screeningItemIdsByExpression).flat();
  assert('10 unique Expressions', new Set(ids).size === 10);
  assert('20 unique items', allReturned.length === 20 && new Set(allReturned).size === 20);
  assert('no missing mappings batch 10', missingItemMappings.length === 0);
}
assert('dup group no dup batch 10',
  new Set(Object.values(getEligibleExpressions([
    'expression-group-martyr-overfunctioning-crisis',
    'expression-group-martyr-overfunctioning-crisis',
  ]).eligibleExpressionIdsByGroup).flat()).size === 5);
assert('scorekeeper excluded from overgiving-depletion',
  !getEligibleExpressionIds(['expression-group-martyr-overgiving-depletion']).includes('martyr-scorekeeper'));
assert('rescuer-fixer excluded from martyr groups',
  !getEligibleExpressionIds(['expression-group-martyr-overfunctioning-crisis']).includes('rescuer-fixer'));
assert('over-giver excluded from recognition-reciprocity',
  !getEligibleExpressionIds(['expression-group-martyr-recognition-reciprocity']).includes('martyr-over-giver'));
assert('martyr + anger-shield all covered, none missing',
  getAllScreeningItemsForExpressions(['martyr-over-giver', 'anger-explosive-shield']).missingItemMappings.length === 0);
assert('martyr-over-giver not missing',
  !getAllScreeningItemsForExpressions(['martyr-over-giver']).missingItemMappings.includes('martyr-over-giver'));
assert('all martyr expressions have items',
  batch10.every(eid => !getAllScreeningItemsForExpressions([eid]).missingItemMappings.includes(eid)));

/* ==================================================================
 *  Retrieval — Batch 11 groups
 * ================================================================*/
{
  const e = getEligibleExpressions(['expression-group-rescuer-intervention-fixing']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-rescuer-intervention-fixing'] ?? [];
  assert('intervention-fixing → 4', ids.length === 4);
  assert('rescuer-fixer', ids.includes('rescuer-fixer'));
  assert('rescuer-crisis-rescuer', ids.includes('rescuer-crisis-rescuer'));
  assert('rescuer-advice-giver', ids.includes('rescuer-advice-giver'));
  assert('rescuer-emotional-paramedic', ids.includes('rescuer-emotional-paramedic'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('intervention-fixing 8 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 8);
}
{
  const e = getEligibleExpressions(['expression-group-rescuer-consequence-prevention']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-rescuer-consequence-prevention'] ?? [];
  assert('consequence-prevention → 3', ids.length === 3);
  assert('rescuer-consequence-blocker', ids.includes('rescuer-consequence-blocker'));
  assert('rescuer-financial-rescuer', ids.includes('rescuer-financial-rescuer'));
  assert('rescuer-protective-parent', ids.includes('rescuer-protective-parent'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('consequence-prevention 6 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 6);
}
{
  const e = getEligibleExpressions(['expression-group-rescuer-indispensable-helper']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-rescuer-indispensable-helper'] ?? [];
  assert('indispensable-helper → 4', ids.length === 4);
  assert('rescuer-indispensable-one', ids.includes('rescuer-indispensable-one'));
  assert('rescuer-white-knight', ids.includes('rescuer-white-knight'));
  assert('rescuer-professional-helper', ids.includes('rescuer-professional-helper'));
  assert('rescuer-recovery-manager', ids.includes('rescuer-recovery-manager'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('indispensable-helper 8 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 8);
}
{
  const ids = getEligibleExpressionIds([
    'expression-group-rescuer-intervention-fixing',
    'expression-group-rescuer-consequence-prevention',
    'expression-group-rescuer-indispensable-helper',
  ]);
  assert('all 3 → 11', ids.length === 11);
  const { screeningItemIdsByExpression, missingItemMappings } = getAllScreeningItemsForExpressions(ids);
  const allReturned = Object.values(screeningItemIdsByExpression).flat();
  assert('11 unique Expressions', new Set(ids).size === 11);
  assert('22 unique items', allReturned.length === 22 && new Set(allReturned).size === 22);
  assert('no missing mappings batch 11', missingItemMappings.length === 0);
}
assert('dup group no dup batch 11',
  new Set(Object.values(getEligibleExpressions([
    'expression-group-rescuer-indispensable-helper',
    'expression-group-rescuer-indispensable-helper',
  ]).eligibleExpressionIdsByGroup).flat()).size === 4);
assert('crisis-rescuer excluded from consequence-prevention',
  !getEligibleExpressionIds(['expression-group-rescuer-consequence-prevention']).includes('rescuer-crisis-rescuer'));
assert('rescuer-overfunctioner excluded from batch 11 groups',
  !getEligibleExpressionIds([
    'expression-group-rescuer-intervention-fixing',
    'expression-group-rescuer-consequence-prevention',
    'expression-group-rescuer-indispensable-helper',
  ]).includes('rescuer-overfunctioner'));
assert('over-responsible-emotional-caretaker excluded from rescuer groups',
  !getEligibleExpressionIds(['expression-group-rescuer-intervention-fixing']).includes('over-responsible-emotional-caretaker'));
assert('batch 11 all covered, none missing',
  getAllScreeningItemsForExpressions(['rescuer-fixer', 'perfectionist-moving-goalpost']).missingItemMappings.length === 0);
assert('rescuer-fixer not missing',
  !getAllScreeningItemsForExpressions(['rescuer-fixer']).missingItemMappings.includes('rescuer-fixer'));
assert('all rescuer batch 11 expressions have items',
  batch11.every(eid => !getAllScreeningItemsForExpressions([eid]).missingItemMappings.includes(eid)));

/* ==================================================================
 *  Retrieval — Batch 12 groups
 * ================================================================*/
{
  const e = getEligibleExpressions(['expression-group-rescuer-hidden-contract-control']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-rescuer-hidden-contract-control'] ?? [];
  assert('hidden-contract-control → 4', ids.length === 4);
  assert('rescuer-overfunctioner', ids.includes('rescuer-overfunctioner'));
  assert('rescuer-hidden-contract-helper', ids.includes('rescuer-hidden-contract-helper'));
  assert('rescuer-to-control', ids.includes('rescuer-to-control'));
  assert('rescuer-to-martyr', ids.includes('rescuer-to-martyr'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('hidden-contract-control 8 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 8);
}
{
  const e = getEligibleExpressions(['expression-group-over-responsible-one-emotional-care']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-over-responsible-one-emotional-care'] ?? [];
  assert('emotional-care → 4', ids.length === 4);
  assert('over-responsible-emotional-caretaker', ids.includes('over-responsible-emotional-caretaker'));
  assert('over-responsible-peacekeeper', ids.includes('over-responsible-peacekeeper'));
  assert('over-responsible-parentified-one', ids.includes('over-responsible-parentified-one'));
  assert('over-responsible-family-stabilizer', ids.includes('over-responsible-family-stabilizer'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('emotional-care 8 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 8);
}
{
  const e = getEligibleExpressions(['expression-group-over-responsible-one-guilt-blame']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-over-responsible-one-guilt-blame'] ?? [];
  assert('guilt-blame → 4', ids.length === 4);
  assert('over-responsible-chronic-apologizer', ids.includes('over-responsible-chronic-apologizer'));
  assert('over-responsible-blame-taker', ids.includes('over-responsible-blame-taker'));
  assert('over-responsible-responsibility-sponge', ids.includes('over-responsible-responsibility-sponge'));
  assert('over-responsible-consequence-carrier', ids.includes('over-responsible-consequence-carrier'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('guilt-blame 8 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 8);
}
{
  const e = getEligibleExpressions(['expression-group-over-responsible-one-boundary-rest']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-over-responsible-one-boundary-rest'] ?? [];
  assert('boundary-rest → 3', ids.length === 3);
  assert('over-responsible-rest-guilty', ids.includes('over-responsible-rest-guilty'));
  assert('over-responsible-boundary-guilty', ids.includes('over-responsible-boundary-guilty'));
  assert('over-responsible-survivor-guilt', ids.includes('over-responsible-survivor-guilt'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('boundary-rest 6 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 6);
}
{
  const ids = getEligibleExpressionIds([
    'expression-group-rescuer-hidden-contract-control',
    'expression-group-over-responsible-one-emotional-care',
    'expression-group-over-responsible-one-guilt-blame',
    'expression-group-over-responsible-one-boundary-rest',
  ]);
  assert('all 4 → 15', ids.length === 15);
  const { screeningItemIdsByExpression, missingItemMappings } = getAllScreeningItemsForExpressions(ids);
  const allReturned = Object.values(screeningItemIdsByExpression).flat();
  assert('15 unique Expressions', new Set(ids).size === 15);
  assert('30 unique items', allReturned.length === 30 && new Set(allReturned).size === 30);
  assert('no missing mappings batch 12', missingItemMappings.length === 0);
}
assert('dup group no dup batch 12',
  new Set(Object.values(getEligibleExpressions([
    'expression-group-over-responsible-one-emotional-care',
    'expression-group-over-responsible-one-emotional-care',
  ]).eligibleExpressionIdsByGroup).flat()).size === 4);
assert('overfunctioner excluded from emotional-care',
  !getEligibleExpressionIds(['expression-group-over-responsible-one-emotional-care']).includes('rescuer-overfunctioner'));
assert('rescuer-fixer excluded from hidden-contract-control',
  !getEligibleExpressionIds(['expression-group-rescuer-hidden-contract-control']).includes('rescuer-fixer'));
assert('mind-reader excluded from batch 12 groups',
  !getEligibleExpressionIds([
    'expression-group-over-responsible-one-emotional-care',
    'expression-group-over-responsible-one-guilt-blame',
    'expression-group-over-responsible-one-boundary-rest',
  ]).includes('over-responsible-mind-reader'));
assert('batch 12 all covered, none missing',
  getAllScreeningItemsForExpressions(['over-responsible-blame-taker', 'anger-explosive-shield']).missingItemMappings.length === 0);
assert('blame-taker not missing',
  !getAllScreeningItemsForExpressions(['over-responsible-blame-taker']).missingItemMappings.includes('over-responsible-blame-taker'));
assert('all batch 12 expressions have items',
  batch12.every(eid => !getAllScreeningItemsForExpressions([eid]).missingItemMappings.includes(eid)));

/* ==================================================================
 *  Retrieval — Batch 13 groups
 * ================================================================*/
{
  const e = getEligibleExpressions(['expression-group-over-responsible-one-anticipatory-moral']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-over-responsible-one-anticipatory-moral'] ?? [];
  assert('anticipatory-moral → 4', ids.length === 4);
  assert('over-responsible-mind-reader', ids.includes('over-responsible-mind-reader'));
  assert('over-responsible-preventer', ids.includes('over-responsible-preventer'));
  assert('over-responsible-moral-overcorrector', ids.includes('over-responsible-moral-overcorrector'));
  assert('over-responsible-confession-seeker', ids.includes('over-responsible-confession-seeker'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('anticipatory-moral 8 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 8);
}
{
  const e = getEligibleExpressions(['expression-group-overloaded-one-capacity-backup']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-overloaded-one-capacity-backup'] ?? [];
  assert('capacity-backup → 3', ids.length === 3);
  assert('overloaded-human-backup-system', ids.includes('overloaded-human-backup-system'));
  assert('overloaded-default-adult', ids.includes('overloaded-default-adult'));
  assert('overloaded-no-backup', ids.includes('overloaded-no-backup'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('capacity-backup 6 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 6);
}
{
  const e = getEligibleExpressions(['expression-group-overloaded-one-mental-load']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-overloaded-one-mental-load'] ?? [];
  assert('mental-load → 3', ids.length === 3);
  assert('overloaded-mental-load-carrier', ids.includes('overloaded-mental-load-carrier'));
  assert('overloaded-cannot-delegate', ids.includes('overloaded-cannot-delegate'));
  assert('overloaded-competence-trap', ids.includes('overloaded-competence-trap'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('mental-load 6 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 6);
}
{
  const e = getEligibleExpressions(['expression-group-overloaded-one-crisis-stop-resume']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-overloaded-one-crisis-stop-resume'] ?? [];
  assert('crisis-stop-resume → 4', ids.length === 4);
  assert('overloaded-crisis-juggler', ids.includes('overloaded-crisis-juggler'));
  assert('overloaded-capacity-denier', ids.includes('overloaded-capacity-denier'));
  assert('overloaded-last-minute-preventer', ids.includes('overloaded-last-minute-preventer'));
  assert('overloaded-stop-then-resume', ids.includes('overloaded-stop-then-resume'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('crisis-stop-resume 8 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 8);
}
{
  const ids = getEligibleExpressionIds([
    'expression-group-over-responsible-one-anticipatory-moral',
    'expression-group-overloaded-one-capacity-backup',
    'expression-group-overloaded-one-mental-load',
    'expression-group-overloaded-one-crisis-stop-resume',
  ]);
  assert('all 4 → 14', ids.length === 14);
  const { screeningItemIdsByExpression, missingItemMappings } = getAllScreeningItemsForExpressions(ids);
  const allReturned = Object.values(screeningItemIdsByExpression).flat();
  assert('14 unique Expressions', new Set(ids).size === 14);
  assert('28 unique items', allReturned.length === 28 && new Set(allReturned).size === 28);
  assert('no missing mappings batch 13', missingItemMappings.length === 0);
}
assert('dup group no dup batch 13',
  new Set(Object.values(getEligibleExpressions([
    'expression-group-overloaded-one-mental-load',
    'expression-group-overloaded-one-mental-load',
  ]).eligibleExpressionIdsByGroup).flat()).size === 3);
assert('default-adult excluded from mental-load',
  !getEligibleExpressionIds(['expression-group-overloaded-one-mental-load']).includes('overloaded-default-adult'));
assert('mind-reader excluded from batch 13 groups (except anticipatory-moral)',
  !getEligibleExpressionIds([
    'expression-group-overloaded-one-capacity-backup',
    'expression-group-overloaded-one-mental-load',
    'expression-group-overloaded-one-crisis-stop-resume',
  ]).includes('over-responsible-mind-reader'));
assert('batch 13 all covered, none missing',
  getAllScreeningItemsForExpressions(['over-responsible-confession-seeker', 'perfectionist-endless-reviser']).missingItemMappings.length === 0);
assert('confession-seeker not missing',
  !getAllScreeningItemsForExpressions(['over-responsible-confession-seeker']).missingItemMappings.includes('over-responsible-confession-seeker'));
assert('all batch 13 expressions have items',
  batch13.every(eid => !getAllScreeningItemsForExpressions([eid]).missingItemMappings.includes(eid)));

/* ==================================================================
 *  Retrieval — Batch 14 groups
 * ================================================================*/
{
  const e = getEligibleExpressions(['expression-group-perfectionist-standards-evaluation']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-perfectionist-standards-evaluation'] ?? [];
  assert('standards-evaluation → 3', ids.length === 3);
  assert('perfectionist-endless-reviser', ids.includes('perfectionist-endless-reviser'));
  assert('perfectionist-moving-goalpost', ids.includes('perfectionist-moving-goalpost'));
  assert('perfectionist-all-or-nothing-evaluator', ids.includes('perfectionist-all-or-nothing-evaluator'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('standards-evaluation 6 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 6);
}
{
  const e = getEligibleExpressions(['expression-group-perfectionist-performance-exposure']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-perfectionist-performance-exposure'] ?? [];
  assert('performance-exposure → 2', ids.length === 2);
  assert('perfectionist-beginner-avoider', ids.includes('perfectionist-beginner-avoider'));
  assert('perfectionist-performance-curator', ids.includes('perfectionist-performance-curator'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('performance-exposure 4 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 4);
}
{
  const e = getEligibleExpressions(['expression-group-anger-shield-explosive-contempt']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-anger-shield-explosive-contempt'] ?? [];
  assert('explosive-contempt → 3', ids.length === 3);
  assert('anger-explosive-shield', ids.includes('anger-explosive-shield'));
  assert('anger-contempt-shield', ids.includes('anger-contempt-shield'));
  assert('anger-intimidator', ids.includes('anger-intimidator'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('explosive-contempt 6 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 6);
}
{
  const e = getEligibleExpressions(['expression-group-anger-shield-cold-defensive']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-anger-shield-cold-defensive'] ?? [];
  assert('cold-defensive → 4', ids.length === 4);
  assert('anger-cold-shield', ids.includes('anger-cold-shield'));
  assert('anger-defensive-debater', ids.includes('anger-defensive-debater'));
  assert('anger-passive-aggressive-shield', ids.includes('anger-passive-aggressive-shield'));
  assert('anger-grievance-keeper', ids.includes('anger-grievance-keeper'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('cold-defensive 8 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 8);
}
{
  const e = getEligibleExpressions(['expression-group-anger-shield-righteous-cycle']);
  const ids = e.eligibleExpressionIdsByGroup['expression-group-anger-shield-righteous-cycle'] ?? [];
  assert('righteous-cycle → 2', ids.length === 2);
  assert('anger-righteous-avenger', ids.includes('anger-righteous-avenger'));
  assert('anger-apology-cycle', ids.includes('anger-apology-cycle'));
  const itemsById = getAllScreeningItemsForExpressions(ids);
  assert('righteous-cycle 4 items', Object.values(itemsById.screeningItemIdsByExpression).flat().length === 4);
}
{
  const ids = getEligibleExpressionIds([
    'expression-group-perfectionist-standards-evaluation',
    'expression-group-perfectionist-performance-exposure',
    'expression-group-anger-shield-explosive-contempt',
    'expression-group-anger-shield-cold-defensive',
    'expression-group-anger-shield-righteous-cycle',
  ]);
  assert('all 5 → 14', ids.length === 14);
  const { screeningItemIdsByExpression, missingItemMappings } = getAllScreeningItemsForExpressions(ids);
  const allReturned = Object.values(screeningItemIdsByExpression).flat();
  assert('14 unique Expressions', new Set(ids).size === 14);
  assert('28 unique items', allReturned.length === 28 && new Set(allReturned).size === 28);
  assert('no missing mappings batch 14', missingItemMappings.length === 0);
}
assert('dup group no dup batch 14',
  new Set(Object.values(getEligibleExpressions([
    'expression-group-perfectionist-standards-evaluation',
    'expression-group-perfectionist-standards-evaluation',
  ]).eligibleExpressionIdsByGroup).flat()).size === 3);
assert('beginner-avoider excluded from standards-evaluation',
  !getEligibleExpressionIds(['expression-group-perfectionist-standards-evaluation']).includes('perfectionist-beginner-avoider'));
assert('explosive-shield excluded from cold-defensive',
  !getEligibleExpressionIds(['expression-group-anger-shield-cold-defensive']).includes('anger-explosive-shield'));
assert('righteous-avenger excluded from explosive-contempt',
  !getEligibleExpressionIds(['expression-group-anger-shield-explosive-contempt']).includes('anger-righteous-avenger'));
assert('all batch 14 expressions have items',
  batch14.every(eid => !getAllScreeningItemsForExpressions([eid]).missingItemMappings.includes(eid)));
assert('all 42 groups have complete mappings',
  [...allGroupDefs].every(g => {
    const ids = getEligibleExpressionIds([g]);
    return ids.length > 0 && getAllScreeningItemsForExpressions(ids).missingItemMappings.length === 0;
  }));
assert('all 145 Expressions have exactly 2 screening items',
  [...allExprIds].every(eid => getExpressionScreeningItems(eid).length === 2));

/* ==================================================================
 *  Scoring with real Batch 7 items
 * ================================================================ */
{
  const i = getExpressionScreeningItems('hypervigilant-threat-forecaster');
  const s4 = computeExpressionDirectScore('hypervigilant-threat-forecaster', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B7 4+5 qualifies', s4.qualifies); assert('B7 4+5 raw=9', s4.rawDirectScore === 9);

  const s3 = computeExpressionDirectScore('hypervigilant-threat-forecaster', [
    { itemId: i[0].id, selectedValue: 3 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B7 3+3 qualifies floor', s3.qualifies); assert('B7 3+3 raw=6', s3.rawDirectScore === 6);

  const sf = computeExpressionDirectScore('hypervigilant-threat-forecaster', [
    { itemId: i[0].id, selectedValue: 2 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B7 2+3 fails', !sf.qualifies); assert('B7 2+3 raw=5', sf.rawDirectScore === 5);

  const si = computeExpressionDirectScore('hypervigilant-threat-forecaster', [
    { itemId: i[0].id, selectedValue: 4 },
  ]);
  assert('B7 one answered incomplete', !si.complete);

  const sb = computeExpressionDirectScore('hypervigilant-threat-forecaster', []);
  assert('B7 both skipped incomplete', !sb.complete); assert('B7 answered=0', sb.answeredCount === 0);
}
{
  const i = getExpressionScreeningItems('avoidant-indecisive-one');
  const s = computeExpressionDirectScore('avoidant-indecisive-one', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B7 indecisive qualifies', s.qualifies); assert('B7 indecisive raw=9', s.rawDirectScore === 9);
}
{
  const i = getExpressionScreeningItems('hypervigilant-protective-parent');
  const s = computeExpressionDirectScore('hypervigilant-protective-parent', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B7 protective-parent qualifies', s.qualifies); assert('B7 protective-parent raw=8', s.rawDirectScore === 8);
}

// Retry
{
  const i = getExpressionScreeningItems('avoidant-crisis-creator');
  const r1 = scoreExpressionAfterRetry('avoidant-crisis-creator', [
    { itemId: i[0].id, selectedValue: 4 },
  ], [
    { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B7 retry qualifies', r1.score.qualifies); assert('B7 retry raw=8', r1.score.rawDirectScore === 8);
  assert('B7 retried=1', r1.retriedItemIds.length === 1); assert('B7 stillSkipped=0', r1.stillSkippedAfterRetry.length === 0);

  const r2 = scoreExpressionAfterRetry('avoidant-crisis-creator', [
    { itemId: i[0].id, selectedValue: 4 },
  ], []);
  assert('B7 skip retry incomplete', !r2.score.complete); assert('B7 stillSkipped=1', r2.stillSkippedAfterRetry.length === 1);
}

// Skips never become 3
{
  const s = computeExpressionDirectScore('hypervigilant-exit-planner', []);
  assert('B7 skips norm=null', s.normalizedDirectScore === null);
  assert('B7 skips raw=0', s.rawDirectScore === 0);
}

// No group score
{
  const i = getExpressionScreeningItems('hypervigilant-exit-planner');
  const s = computeExpressionDirectScore('hypervigilant-exit-planner', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B7 no bonus raw=9', s.rawDirectScore === 9);
}

// No parent score inflation
{
  const i = getExpressionScreeningItems('hypervigilant-sleepless-guard');
  const s = computeExpressionDirectScore('hypervigilant-sleepless-guard', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B7 parent no inflation raw=9', s.rawDirectScore === 9);
}
/* ------------------------------------------------------------------
 *  Scoring with real Batch 8 items
 * ---------------------------------------------------------------- */
{
  const i = getExpressionScreeningItems('hypervigilant-mood-scanner');
  const s4 = computeExpressionDirectScore('hypervigilant-mood-scanner', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B8 4+5 qualifies', s4.qualifies); assert('B8 4+5 raw=9', s4.rawDirectScore === 9);

  const s3 = computeExpressionDirectScore('hypervigilant-mood-scanner', [
    { itemId: i[0].id, selectedValue: 3 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B8 3+3 qualifies floor', s3.qualifies); assert('B8 3+3 raw=6', s3.rawDirectScore === 6);

  const sf = computeExpressionDirectScore('hypervigilant-mood-scanner', [
    { itemId: i[0].id, selectedValue: 2 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B8 2+3 fails', !sf.qualifies); assert('B8 2+3 raw=5', sf.rawDirectScore === 5);

  const si = computeExpressionDirectScore('hypervigilant-mood-scanner', [
    { itemId: i[0].id, selectedValue: 4 },
  ]);
  assert('B8 one answered incomplete', !si.complete);

  const sb = computeExpressionDirectScore('hypervigilant-mood-scanner', []);
  assert('B8 both skipped incomplete', !sb.complete); assert('B8 answered=0', sb.answeredCount === 0);
}
{
  const i = getExpressionScreeningItems('hypervigilant-body-monitor');
  const s = computeExpressionDirectScore('hypervigilant-body-monitor', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B8 body-monitor qualifies', s.qualifies); assert('B8 body-monitor raw=9', s.rawDirectScore === 9);
}
{
  const i = getExpressionScreeningItems('entangled-pursuer');
  const s = computeExpressionDirectScore('entangled-pursuer', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B8 pursuer qualifies', s.qualifies); assert('B8 pursuer raw=8', s.rawDirectScore === 8);
}
// B8 retry
{
  const i = getExpressionScreeningItems('entangled-appeaser');
  const r1 = scoreExpressionAfterRetry('entangled-appeaser', [
    { itemId: i[0].id, selectedValue: 4 },
  ], [
    { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B8 retry qualifies', r1.score.qualifies); assert('B8 retry raw=8', r1.score.rawDirectScore === 8);
  assert('B8 retried=1', r1.retriedItemIds.length === 1); assert('B8 stillSkipped=0', r1.stillSkippedAfterRetry.length === 0);

  const r2 = scoreExpressionAfterRetry('entangled-appeaser', [
    { itemId: i[0].id, selectedValue: 4 },
  ], []);
  assert('B8 skip retry incomplete', !r2.score.complete); assert('B8 stillSkipped=1', r2.stillSkippedAfterRetry.length === 1);
}
// B8 skips never become 3
{
  const s = computeExpressionDirectScore('hypervigilant-digital-monitor', []);
  assert('B8 skips norm=null', s.normalizedDirectScore === null);
  assert('B8 skips raw=0', s.rawDirectScore === 0);
}
// B8 no group score
{
  const i = getExpressionScreeningItems('hypervigilant-digital-monitor');
  const s = computeExpressionDirectScore('hypervigilant-digital-monitor', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B8 no bonus raw=9', s.rawDirectScore === 9);
}
// B8 parent no inflation
{
  const i = getExpressionScreeningItems('entangled-crisis-pair');
  const s = computeExpressionDirectScore('entangled-crisis-pair', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B8 parent no inflation raw=9', s.rawDirectScore === 9);
}
// B8 routing
{
  const ms = getExpressionScreeningItems('hypervigilant-mood-scanner');
  const bs = getExpressionScreeningItems('hypervigilant-betrayal-scanner');
  const asi = getExpressionScreeningItems('hypervigilant-ambiguous-signal-interpreter');
  const wr = getExpressionScreeningItems('hypervigilant-weather-reporter');
  const responses = [
    { itemId: ms[0].id, selectedValue: 5 }, { itemId: ms[1].id, selectedValue: 5 },
    { itemId: bs[0].id, selectedValue: 4 }, { itemId: bs[1].id, selectedValue: 4 },
    { itemId: asi[0].id, selectedValue: 3 }, { itemId: asi[1].id, selectedValue: 3 },
    { itemId: wr[0].id, selectedValue: 4 }, { itemId: wr[1].id, selectedValue: 4 },
  ];
  const r = routeExpressionScreening('pro', ['expression-group-hypervigilant-one-relational-scanning'], responses);
  assert('B8 routing yields candidates',
    r.category === 'one-expression-candidate' || r.category === 'expression-candidates-selected');
  assert('B8 candidates ≤2', r.selectedCandidates.length <= 2);
}
// B8 entangled routing
{
  const pu = getExpressionScreeningItems('entangled-pursuer');
  const ap = getExpressionScreeningItems('entangled-appeaser');
  const responses = [
    { itemId: pu[0].id, selectedValue: 5 }, { itemId: pu[1].id, selectedValue: 5 },
    { itemId: ap[0].id, selectedValue: 4 }, { itemId: ap[1].id, selectedValue: 4 },
  ];
  const r = routeExpressionScreening('pro', ['expression-group-entangled-one-proximity-pursuit'], responses);
  assert('B8 entangled routing yields candidates',
    r.category === 'one-expression-candidate' || r.category === 'expression-candidates-selected');
}
// B8 no qualifying
{
  const ms = getExpressionScreeningItems('hypervigilant-mood-scanner');
  assert('B8 below threshold',
    routeExpressionScreening('pro', ['expression-group-hypervigilant-one-relational-scanning'], [
      { itemId: ms[0].id, selectedValue: 2 }, { itemId: ms[1].id, selectedValue: 2 },
    ]).category === 'no-clear-expression');
}
// B8 all incomplete
{
  const ms = getExpressionScreeningItems('hypervigilant-mood-scanner');
  assert('B8 all incomplete',
    routeExpressionScreening('pro', ['expression-group-hypervigilant-one-relational-scanning'], [
      { itemId: ms[0].id, selectedValue: 4 },
    ]).category === 'insufficient-expression-evidence');
}
{
  const pu = getExpressionScreeningItems('entangled-pursuer');
  assert('B8 entangled incomplete',
    routeExpressionScreening('pro', ['expression-group-entangled-one-proximity-pursuit'], [
      { itemId: pu[0].id, selectedValue: 4 },
    ]).category === 'insufficient-expression-evidence');
}
/* ------------------------------------------------------------------
 *  Scoring with real Batch 9 items
 * ---------------------------------------------------------------- */
{
  const i = getExpressionScreeningItems('entangled-rescuer');
  const s4 = computeExpressionDirectScore('entangled-rescuer', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B9 4+5 qualifies', s4.qualifies); assert('B9 4+5 raw=9', s4.rawDirectScore === 9);

  const s3 = computeExpressionDirectScore('entangled-rescuer', [
    { itemId: i[0].id, selectedValue: 3 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B9 3+3 qualifies floor', s3.qualifies); assert('B9 3+3 raw=6', s3.rawDirectScore === 6);

  const sf = computeExpressionDirectScore('entangled-rescuer', [
    { itemId: i[0].id, selectedValue: 2 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B9 2+3 fails', !sf.qualifies); assert('B9 2+3 raw=5', sf.rawDirectScore === 5);

  const si = computeExpressionDirectScore('entangled-rescuer', [
    { itemId: i[0].id, selectedValue: 4 },
  ]);
  assert('B9 one answered incomplete', !si.complete);

  const sb = computeExpressionDirectScore('entangled-rescuer', []);
  assert('B9 both skipped incomplete', !sb.complete); assert('B9 answered=0', sb.answeredCount === 0);
}
{
  const i = getExpressionScreeningItems('grief-unexpressed');
  const s = computeExpressionDirectScore('grief-unexpressed', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B9 grief-unexpressed qualifies', s.qualifies); assert('B9 grief-unexpressed raw=9', s.rawDirectScore === 9);
}
{
  const i = getExpressionScreeningItems('grief-loyalty-to-pain');
  const s = computeExpressionDirectScore('grief-loyalty-to-pain', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B9 loyalty-to-pain qualifies', s.qualifies); assert('B9 loyalty-to-pain raw=8', s.rawDirectScore === 8);
}
// B9 retry
{
  const i = getExpressionScreeningItems('entangled-mutual-monitor');
  const r1 = scoreExpressionAfterRetry('entangled-mutual-monitor', [
    { itemId: i[0].id, selectedValue: 4 },
  ], [
    { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B9 retry qualifies', r1.score.qualifies); assert('B9 retry raw=8', r1.score.rawDirectScore === 8);
  assert('B9 retried=1', r1.retriedItemIds.length === 1); assert('B9 stillSkipped=0', r1.stillSkippedAfterRetry.length === 0);

  const r2 = scoreExpressionAfterRetry('entangled-mutual-monitor', [
    { itemId: i[0].id, selectedValue: 4 },
  ], []);
  assert('B9 skip retry incomplete', !r2.score.complete); assert('B9 stillSkipped=1', r2.stillSkippedAfterRetry.length === 1);
}
// B9 skips never become 3
{
  const s = computeExpressionDirectScore('grief-silent-mourning', []);
  assert('B9 skips norm=null', s.normalizedDirectScore === null);
  assert('B9 skips raw=0', s.rawDirectScore === 0);
}
// B9 no group score
{
  const i = getExpressionScreeningItems('grief-silent-mourning');
  const s = computeExpressionDirectScore('grief-silent-mourning', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B9 no bonus raw=9', s.rawDirectScore === 9);
}
// B9 parent no inflation
{
  const i = getExpressionScreeningItems('grief-protective-numbing');
  const s = computeExpressionDirectScore('grief-protective-numbing', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B9 parent no inflation raw=9', s.rawDirectScore === 9);
}
// B9 routing
{
  const rs = getExpressionScreeningItems('entangled-rescuer');
  const mm = getExpressionScreeningItems('entangled-mutual-monitor');
  const responses = [
    { itemId: rs[0].id, selectedValue: 5 }, { itemId: rs[1].id, selectedValue: 5 },
    { itemId: mm[0].id, selectedValue: 4 }, { itemId: mm[1].id, selectedValue: 4 },
  ];
  const r = routeExpressionScreening('pro', ['expression-group-entangled-one-identity-merger'], responses);
  assert('B9 routing yields candidates',
    r.category === 'one-expression-candidate' || r.category === 'expression-candidates-selected');
  assert('B9 candidates ≤2', r.selectedCandidates.length <= 2);
}
{
  const gu = getExpressionScreeningItems('grief-unexpressed');
  assert('B9 below threshold',
    routeExpressionScreening('pro', ['expression-group-grief-bearer-unexpressed-delayed'], [
      { itemId: gu[0].id, selectedValue: 2 }, { itemId: gu[1].id, selectedValue: 2 },
    ]).category === 'no-clear-expression');
}
{
  const sl = getExpressionScreeningItems('grief-specific-loss');
  assert('B9 incomplete',
    routeExpressionScreening('pro', ['expression-group-grief-bearer-loss-attachment'], [
      { itemId: sl[0].id, selectedValue: 4 },
    ]).category === 'insufficient-expression-evidence');
}
/* ------------------------------------------------------------------
 *  Scoring with real Batch 10 items
 * ---------------------------------------------------------------- */
{
  const i = getExpressionScreeningItems('martyr-over-giver');
  const s4 = computeExpressionDirectScore('martyr-over-giver', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B10 4+5 qualifies', s4.qualifies); assert('B10 4+5 raw=9', s4.rawDirectScore === 9);

  const s3 = computeExpressionDirectScore('martyr-over-giver', [
    { itemId: i[0].id, selectedValue: 3 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B10 3+3 qualifies floor', s3.qualifies); assert('B10 3+3 raw=6', s3.rawDirectScore === 6);

  const sf = computeExpressionDirectScore('martyr-over-giver', [
    { itemId: i[0].id, selectedValue: 2 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B10 2+3 fails', !sf.qualifies); assert('B10 2+3 raw=5', sf.rawDirectScore === 5);

  const si = computeExpressionDirectScore('martyr-over-giver', [
    { itemId: i[0].id, selectedValue: 4 },
  ]);
  assert('B10 one answered incomplete', !si.complete);

  const sb = computeExpressionDirectScore('martyr-over-giver', []);
  assert('B10 both skipped incomplete', !sb.complete); assert('B10 answered=0', sb.answeredCount === 0);
}
{
  const i = getExpressionScreeningItems('martyr-guilt-tripper');
  const s = computeExpressionDirectScore('martyr-guilt-tripper', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B10 guilt-tripper qualifies', s.qualifies); assert('B10 guilt-tripper raw=9', s.rawDirectScore === 9);
}
{
  const i = getExpressionScreeningItems('martyr-moral-martyr');
  const s = computeExpressionDirectScore('martyr-moral-martyr', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B10 moral-martyr qualifies', s.qualifies); assert('B10 moral-martyr raw=8', s.rawDirectScore === 8);
}
// B10 retry
{
  const i = getExpressionScreeningItems('martyr-rescuer-martyr');
  const r1 = scoreExpressionAfterRetry('martyr-rescuer-martyr', [
    { itemId: i[0].id, selectedValue: 4 },
  ], [
    { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B10 retry qualifies', r1.score.qualifies); assert('B10 retry raw=8', r1.score.rawDirectScore === 8);
  assert('B10 retried=1', r1.retriedItemIds.length === 1); assert('B10 stillSkipped=0', r1.stillSkippedAfterRetry.length === 0);

  const r2 = scoreExpressionAfterRetry('martyr-rescuer-martyr', [
    { itemId: i[0].id, selectedValue: 4 },
  ], []);
  assert('B10 skip retry incomplete', !r2.score.complete); assert('B10 stillSkipped=1', r2.stillSkippedAfterRetry.length === 1);
}
// B10 skips never become 3
{
  const s = computeExpressionDirectScore('martyr-crisis-martyr', []);
  assert('B10 skips norm=null', s.normalizedDirectScore === null);
  assert('B10 skips raw=0', s.rawDirectScore === 0);
}
// B10 no group score
{
  const i = getExpressionScreeningItems('martyr-scorekeeper');
  const s = computeExpressionDirectScore('martyr-scorekeeper', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B10 no bonus raw=9', s.rawDirectScore === 9);
}
// B10 parent no inflation
{
  const i = getExpressionScreeningItems('martyr-burnout-blame');
  const s = computeExpressionDirectScore('martyr-burnout-blame', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B10 parent no inflation raw=9', s.rawDirectScore === 9);
}
// B10 routing
{
  const of = getExpressionScreeningItems('martyr-overfunctioning');
  const cm = getExpressionScreeningItems('martyr-crisis-martyr');
  const responses = [
    { itemId: of[0].id, selectedValue: 5 }, { itemId: of[1].id, selectedValue: 5 },
    { itemId: cm[0].id, selectedValue: 4 }, { itemId: cm[1].id, selectedValue: 4 },
  ];
  const r = routeExpressionScreening('pro', ['expression-group-martyr-overfunctioning-crisis'], responses);
  assert('B10 routing yields candidates',
    r.category === 'one-expression-candidate' || r.category === 'expression-candidates-selected');
  assert('B10 candidates ≤2', r.selectedCandidates.length <= 2);
}
{
  const rr = getExpressionScreeningItems('martyr-refuses-to-receive');
  assert('B10 below threshold',
    routeExpressionScreening('pro', ['expression-group-martyr-overgiving-depletion'], [
      { itemId: rr[0].id, selectedValue: 2 }, { itemId: rr[1].id, selectedValue: 2 },
    ]).category === 'no-clear-expression');
}
{
  const ss = getExpressionScreeningItems('martyr-silent-sufferer');
  assert('B10 incomplete',
    routeExpressionScreening('pro', ['expression-group-martyr-overgiving-depletion'], [
      { itemId: ss[0].id, selectedValue: 4 },
    ]).category === 'insufficient-expression-evidence');
}
/* ------------------------------------------------------------------
 *  Scoring with real Batch 11 items
 * ---------------------------------------------------------------- */
{
  const i = getExpressionScreeningItems('rescuer-fixer');
  const s4 = computeExpressionDirectScore('rescuer-fixer', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B11 4+5 qualifies', s4.qualifies); assert('B11 4+5 raw=9', s4.rawDirectScore === 9);

  const s3 = computeExpressionDirectScore('rescuer-fixer', [
    { itemId: i[0].id, selectedValue: 3 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B11 3+3 qualifies floor', s3.qualifies); assert('B11 3+3 raw=6', s3.rawDirectScore === 6);

  const sf = computeExpressionDirectScore('rescuer-fixer', [
    { itemId: i[0].id, selectedValue: 2 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B11 2+3 fails', !sf.qualifies); assert('B11 2+3 raw=5', sf.rawDirectScore === 5);

  const si = computeExpressionDirectScore('rescuer-fixer', [
    { itemId: i[0].id, selectedValue: 4 },
  ]);
  assert('B11 one answered incomplete', !si.complete);

  const sb = computeExpressionDirectScore('rescuer-fixer', []);
  assert('B11 both skipped incomplete', !sb.complete); assert('B11 answered=0', sb.answeredCount === 0);
}
{
  const i = getExpressionScreeningItems('rescuer-consequence-blocker');
  const s = computeExpressionDirectScore('rescuer-consequence-blocker', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B11 consequence-blocker qualifies', s.qualifies); assert('B11 consequence-blocker raw=9', s.rawDirectScore === 9);
}
{
  const i = getExpressionScreeningItems('rescuer-white-knight');
  const s = computeExpressionDirectScore('rescuer-white-knight', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B11 white-knight qualifies', s.qualifies); assert('B11 white-knight raw=8', s.rawDirectScore === 8);
}
// B11 retry
{
  const i = getExpressionScreeningItems('rescuer-recovery-manager');
  const r1 = scoreExpressionAfterRetry('rescuer-recovery-manager', [
    { itemId: i[0].id, selectedValue: 4 },
  ], [
    { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B11 retry qualifies', r1.score.qualifies); assert('B11 retry raw=8', r1.score.rawDirectScore === 8);
  assert('B11 retried=1', r1.retriedItemIds.length === 1); assert('B11 stillSkipped=0', r1.stillSkippedAfterRetry.length === 0);

  const r2 = scoreExpressionAfterRetry('rescuer-recovery-manager', [
    { itemId: i[0].id, selectedValue: 4 },
  ], []);
  assert('B11 skip retry incomplete', !r2.score.complete); assert('B11 stillSkipped=1', r2.stillSkippedAfterRetry.length === 1);
}
// B11 skips never become 3
{
  const s = computeExpressionDirectScore('rescuer-advice-giver', []);
  assert('B11 skips norm=null', s.normalizedDirectScore === null);
  assert('B11 skips raw=0', s.rawDirectScore === 0);
}
// B11 no group score
{
  const i = getExpressionScreeningItems('rescuer-advice-giver');
  const s = computeExpressionDirectScore('rescuer-advice-giver', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B11 no bonus raw=9', s.rawDirectScore === 9);
}
// B11 parent no inflation
{
  const i = getExpressionScreeningItems('rescuer-financial-rescuer');
  const s = computeExpressionDirectScore('rescuer-financial-rescuer', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B11 parent no inflation raw=9', s.rawDirectScore === 9);
}
// B11 routing
{
  const cf = getExpressionScreeningItems('rescuer-crisis-rescuer');
  const ep = getExpressionScreeningItems('rescuer-emotional-paramedic');
  const responses = [
    { itemId: cf[0].id, selectedValue: 5 }, { itemId: cf[1].id, selectedValue: 5 },
    { itemId: ep[0].id, selectedValue: 4 }, { itemId: ep[1].id, selectedValue: 4 },
  ];
  const r = routeExpressionScreening('pro', ['expression-group-rescuer-intervention-fixing'], responses);
  assert('B11 routing yields candidates',
    r.category === 'one-expression-candidate' || r.category === 'expression-candidates-selected');
  assert('B11 candidates ≤2', r.selectedCandidates.length <= 2);
}
{
  const pp = getExpressionScreeningItems('rescuer-protective-parent');
  assert('B11 below threshold',
    routeExpressionScreening('pro', ['expression-group-rescuer-consequence-prevention'], [
      { itemId: pp[0].id, selectedValue: 2 }, { itemId: pp[1].id, selectedValue: 2 },
    ]).category === 'no-clear-expression');
}
{
  const wk = getExpressionScreeningItems('rescuer-white-knight');
  assert('B11 incomplete',
    routeExpressionScreening('pro', ['expression-group-rescuer-indispensable-helper'], [
      { itemId: wk[0].id, selectedValue: 4 },
    ]).category === 'insufficient-expression-evidence');
}
/* ------------------------------------------------------------------
 *  Scoring with real Batch 12 items
 * ---------------------------------------------------------------- */
{
  const i = getExpressionScreeningItems('over-responsible-emotional-caretaker');
  const s4 = computeExpressionDirectScore('over-responsible-emotional-caretaker', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B12 4+5 qualifies', s4.qualifies); assert('B12 4+5 raw=9', s4.rawDirectScore === 9);

  const s3 = computeExpressionDirectScore('over-responsible-emotional-caretaker', [
    { itemId: i[0].id, selectedValue: 3 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B12 3+3 qualifies floor', s3.qualifies); assert('B12 3+3 raw=6', s3.rawDirectScore === 6);

  const sf = computeExpressionDirectScore('over-responsible-emotional-caretaker', [
    { itemId: i[0].id, selectedValue: 2 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B12 2+3 fails', !sf.qualifies); assert('B12 2+3 raw=5', sf.rawDirectScore === 5);

  const si = computeExpressionDirectScore('over-responsible-emotional-caretaker', [
    { itemId: i[0].id, selectedValue: 4 },
  ]);
  assert('B12 one answered incomplete', !si.complete);

  const sb = computeExpressionDirectScore('over-responsible-emotional-caretaker', []);
  assert('B12 both skipped incomplete', !sb.complete); assert('B12 answered=0', sb.answeredCount === 0);
}
{
  const i = getExpressionScreeningItems('rescuer-hidden-contract-helper');
  const s = computeExpressionDirectScore('rescuer-hidden-contract-helper', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B12 hidden-contract-helper qualifies', s.qualifies); assert('B12 hidden-contract-helper raw=9', s.rawDirectScore === 9);
}
{
  const i = getExpressionScreeningItems('over-responsible-boundary-guilty');
  const s = computeExpressionDirectScore('over-responsible-boundary-guilty', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B12 boundary-guilty qualifies', s.qualifies); assert('B12 boundary-guilty raw=8', s.rawDirectScore === 8);
}
// B12 retry
{
  const i = getExpressionScreeningItems('over-responsible-blame-taker');
  const r1 = scoreExpressionAfterRetry('over-responsible-blame-taker', [
    { itemId: i[0].id, selectedValue: 4 },
  ], [
    { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B12 retry qualifies', r1.score.qualifies); assert('B12 retry raw=8', r1.score.rawDirectScore === 8);
  assert('B12 retried=1', r1.retriedItemIds.length === 1); assert('B12 stillSkipped=0', r1.stillSkippedAfterRetry.length === 0);

  const r2 = scoreExpressionAfterRetry('over-responsible-blame-taker', [
    { itemId: i[0].id, selectedValue: 4 },
  ], []);
  assert('B12 skip retry incomplete', !r2.score.complete); assert('B12 stillSkipped=1', r2.stillSkippedAfterRetry.length === 1);
}
// B12 skips never become 3
{
  const s = computeExpressionDirectScore('rescuer-to-control', []);
  assert('B12 skips norm=null', s.normalizedDirectScore === null);
  assert('B12 skips raw=0', s.rawDirectScore === 0);
}
// B12 no group score
{
  const i = getExpressionScreeningItems('rescuer-to-control');
  const s = computeExpressionDirectScore('rescuer-to-control', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B12 no bonus raw=9', s.rawDirectScore === 9);
}
// B12 parent no inflation
{
  const i = getExpressionScreeningItems('over-responsible-family-stabilizer');
  const s = computeExpressionDirectScore('over-responsible-family-stabilizer', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B12 parent no inflation raw=9', s.rawDirectScore === 9);
}
// B12 routing
{
  const ca = getExpressionScreeningItems('over-responsible-chronic-apologizer');
  const cc = getExpressionScreeningItems('over-responsible-consequence-carrier');
  const responses = [
    { itemId: ca[0].id, selectedValue: 5 }, { itemId: ca[1].id, selectedValue: 5 },
    { itemId: cc[0].id, selectedValue: 4 }, { itemId: cc[1].id, selectedValue: 4 },
  ];
  const r = routeExpressionScreening('pro', ['expression-group-over-responsible-one-guilt-blame'], responses);
  assert('B12 routing yields candidates',
    r.category === 'one-expression-candidate' || r.category === 'expression-candidates-selected');
  assert('B12 candidates ≤2', r.selectedCandidates.length <= 2);
}
{
  const pc = getExpressionScreeningItems('over-responsible-peacekeeper');
  assert('B12 below threshold',
    routeExpressionScreening('pro', ['expression-group-over-responsible-one-emotional-care'], [
      { itemId: pc[0].id, selectedValue: 2 }, { itemId: pc[1].id, selectedValue: 2 },
    ]).category === 'no-clear-expression');
}
{
  const sg = getExpressionScreeningItems('over-responsible-survivor-guilt');
  assert('B12 incomplete',
    routeExpressionScreening('pro', ['expression-group-over-responsible-one-boundary-rest'], [
      { itemId: sg[0].id, selectedValue: 4 },
    ]).category === 'insufficient-expression-evidence');
}

/* ==================================================================
 *  Scoring with real Batch 13 items
 * ---------------------------------------------------------------- */
{
  const i = getExpressionScreeningItems('over-responsible-mind-reader');
  assert('B13 mind-reader 2 items', i.length === 2);
  const s4 = computeExpressionDirectScore('over-responsible-mind-reader', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B13 4+5 qualifies', s4.qualifies); assert('B13 4+5 raw=9', s4.rawDirectScore === 9);

  const s3 = computeExpressionDirectScore('over-responsible-mind-reader', [
    { itemId: i[0].id, selectedValue: 3 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B13 3+3 qualifies floor', s3.qualifies); assert('B13 3+3 raw=6', s3.rawDirectScore === 6);

  const sf = computeExpressionDirectScore('over-responsible-mind-reader', [
    { itemId: i[0].id, selectedValue: 2 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B13 2+3 fails', !sf.qualifies); assert('B13 2+3 raw=5', sf.rawDirectScore === 5);

  const si = computeExpressionDirectScore('over-responsible-mind-reader', [
    { itemId: i[0].id, selectedValue: 4 },
  ]);
  assert('B13 one answered incomplete', !si.complete);

  const sb = computeExpressionDirectScore('over-responsible-mind-reader', []);
  assert('B13 both skipped incomplete', !sb.complete); assert('B13 answered=0', sb.answeredCount === 0);
}
{
  const i = getExpressionScreeningItems('overloaded-no-backup');
  const s = computeExpressionDirectScore('overloaded-no-backup', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B13 no-backup qualifies', s.qualifies); assert('B13 no-backup raw=9', s.rawDirectScore === 9);
}
{
  const i = getExpressionScreeningItems('overloaded-competence-trap');
  const s = computeExpressionDirectScore('overloaded-competence-trap', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B13 competence-trap qualifies', s.qualifies); assert('B13 competence-trap raw=8', s.rawDirectScore === 8);
}
// B13 retry
{
  const i = getExpressionScreeningItems('over-responsible-preventer');
  const r1 = scoreExpressionAfterRetry('over-responsible-preventer', [
    { itemId: i[0].id, selectedValue: 4 },
  ], [
    { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B13 retry qualifies', r1.score.qualifies); assert('B13 retry raw=8', r1.score.rawDirectScore === 8);
  assert('B13 retried=1', r1.retriedItemIds.length === 1); assert('B13 stillSkipped=0', r1.stillSkippedAfterRetry.length === 0);

  const r2 = scoreExpressionAfterRetry('over-responsible-preventer', [
    { itemId: i[0].id, selectedValue: 4 },
  ], []);
  assert('B13 skip retry incomplete', !r2.score.complete); assert('B13 stillSkipped=1', r2.stillSkippedAfterRetry.length === 1);
}
// B13 skips never become 3
{
  const s = computeExpressionDirectScore('overloaded-crisis-juggler', []);
  assert('B13 skips norm=null', s.normalizedDirectScore === null);
  assert('B13 skips raw=0', s.rawDirectScore === 0);
}
// B13 no group score
{
  const i = getExpressionScreeningItems('overloaded-crisis-juggler');
  const s = computeExpressionDirectScore('overloaded-crisis-juggler', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B13 no bonus raw=9', s.rawDirectScore === 9);
}
// B13 parent no inflation
{
  const i = getExpressionScreeningItems('overloaded-human-backup-system');
  const s = computeExpressionDirectScore('overloaded-human-backup-system', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B13 parent no inflation raw=9', s.rawDirectScore === 9);
}
// B13 routing
{
  const mr = getExpressionScreeningItems('over-responsible-mind-reader');
  const pv = getExpressionScreeningItems('over-responsible-preventer');
  const responses = [
    { itemId: mr[0].id, selectedValue: 5 }, { itemId: mr[1].id, selectedValue: 5 },
    { itemId: pv[0].id, selectedValue: 4 }, { itemId: pv[1].id, selectedValue: 4 },
  ];
  const r = routeExpressionScreening('pro', ['expression-group-over-responsible-one-anticipatory-moral'], responses);
  assert('B13 routing yields candidates',
    r.category === 'one-expression-candidate' || r.category === 'expression-candidates-selected');
  assert('B13 candidates ≤2', r.selectedCandidates.length <= 2);
}
{
  const ml = getExpressionScreeningItems('overloaded-mental-load-carrier');
  assert('B13 below threshold',
    routeExpressionScreening('pro', ['expression-group-overloaded-one-mental-load'], [
      { itemId: ml[0].id, selectedValue: 2 }, { itemId: ml[1].id, selectedValue: 2 },
    ]).category === 'no-clear-expression');
}
{
  const st = getExpressionScreeningItems('overloaded-stop-then-resume');
  assert('B13 incomplete',
    routeExpressionScreening('pro', ['expression-group-overloaded-one-crisis-stop-resume'], [
      { itemId: st[0].id, selectedValue: 4 },
    ]).category === 'insufficient-expression-evidence');
}

/* ==================================================================
 *  Scoring with real Batch 14 items
 * ---------------------------------------------------------------- */
{
  const i = getExpressionScreeningItems('perfectionist-endless-reviser');
  assert('B14 endless-reviser 2 items', i.length === 2);
  const s4 = computeExpressionDirectScore('perfectionist-endless-reviser', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B14 4+5 qualifies', s4.qualifies); assert('B14 4+5 raw=9', s4.rawDirectScore === 9);

  const s3 = computeExpressionDirectScore('perfectionist-endless-reviser', [
    { itemId: i[0].id, selectedValue: 3 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B14 3+3 qualifies floor', s3.qualifies); assert('B14 3+3 raw=6', s3.rawDirectScore === 6);

  const sf = computeExpressionDirectScore('perfectionist-endless-reviser', [
    { itemId: i[0].id, selectedValue: 2 }, { itemId: i[1].id, selectedValue: 3 },
  ]);
  assert('B14 2+3 fails', !sf.qualifies); assert('B14 2+3 raw=5', sf.rawDirectScore === 5);

  const si = computeExpressionDirectScore('perfectionist-endless-reviser', [
    { itemId: i[0].id, selectedValue: 4 },
  ]);
  assert('B14 one answered incomplete', !si.complete);

  const sb = computeExpressionDirectScore('perfectionist-endless-reviser', []);
  assert('B14 both skipped incomplete', !sb.complete); assert('B14 answered=0', sb.answeredCount === 0);
}
{
  const i = getExpressionScreeningItems('anger-cold-shield');
  const s = computeExpressionDirectScore('anger-cold-shield', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B14 cold-shield qualifies', s.qualifies); assert('B14 cold-shield raw=9', s.rawDirectScore === 9);
}
{
  const i = getExpressionScreeningItems('anger-righteous-avenger');
  const s = computeExpressionDirectScore('anger-righteous-avenger', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B14 righteous-avenger qualifies', s.qualifies); assert('B14 righteous-avenger raw=8', s.rawDirectScore === 8);
}
// B14 retry
{
  const i = getExpressionScreeningItems('perfectionist-performance-curator');
  const r1 = scoreExpressionAfterRetry('perfectionist-performance-curator', [
    { itemId: i[0].id, selectedValue: 4 },
  ], [
    { itemId: i[1].id, selectedValue: 4 },
  ]);
  assert('B14 retry qualifies', r1.score.qualifies); assert('B14 retry raw=8', r1.score.rawDirectScore === 8);
  assert('B14 retried=1', r1.retriedItemIds.length === 1); assert('B14 stillSkipped=0', r1.stillSkippedAfterRetry.length === 0);

  const r2 = scoreExpressionAfterRetry('perfectionist-performance-curator', [
    { itemId: i[0].id, selectedValue: 4 },
  ], []);
  assert('B14 skip retry incomplete', !r2.score.complete); assert('B14 stillSkipped=1', r2.stillSkippedAfterRetry.length === 1);
}
// B14 skips never become 3
{
  const s = computeExpressionDirectScore('anger-apology-cycle', []);
  assert('B14 skips norm=null', s.normalizedDirectScore === null);
  assert('B14 skips raw=0', s.rawDirectScore === 0);
}
// B14 no group score
{
  const i = getExpressionScreeningItems('anger-apology-cycle');
  const s = computeExpressionDirectScore('anger-apology-cycle', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B14 no bonus raw=9', s.rawDirectScore === 9);
}
// B14 parent no inflation
{
  const i = getExpressionScreeningItems('perfectionist-beginner-avoider');
  const s = computeExpressionDirectScore('perfectionist-beginner-avoider', [
    { itemId: i[0].id, selectedValue: 4 }, { itemId: i[1].id, selectedValue: 5 },
  ]);
  assert('B14 parent no inflation raw=9', s.rawDirectScore === 9);
}
// B14 routing
{
  const er = getExpressionScreeningItems('perfectionist-endless-reviser');
  const mg = getExpressionScreeningItems('perfectionist-moving-goalpost');
  const responses = [
    { itemId: er[0].id, selectedValue: 5 }, { itemId: er[1].id, selectedValue: 5 },
    { itemId: mg[0].id, selectedValue: 4 }, { itemId: mg[1].id, selectedValue: 4 },
  ];
  const r = routeExpressionScreening('pro', ['expression-group-perfectionist-standards-evaluation'], responses);
  assert('B14 routing yields candidates',
    r.category === 'one-expression-candidate' || r.category === 'expression-candidates-selected');
  assert('B14 candidates ≤2', r.selectedCandidates.length <= 2);
}
{
  const es = getExpressionScreeningItems('anger-explosive-shield');
  assert('B14 below threshold',
    routeExpressionScreening('pro', ['expression-group-anger-shield-explosive-contempt'], [
      { itemId: es[0].id, selectedValue: 2 }, { itemId: es[1].id, selectedValue: 2 },
    ]).category === 'no-clear-expression');
}
{
  const gk = getExpressionScreeningItems('anger-grievance-keeper');
  assert('B14 incomplete',
    routeExpressionScreening('pro', ['expression-group-anger-shield-cold-defensive'], [
      { itemId: gk[0].id, selectedValue: 4 },
    ]).category === 'insufficient-expression-evidence');
}

/* ==================================================================
 *  Routing
 * ================================================================ */
{
  const tf = getExpressionScreeningItems('hypervigilant-threat-forecaster');
  const cp = getExpressionScreeningItems('hypervigilant-conflict-predictor');
  const wc = getExpressionScreeningItems('hypervigilant-worst-case-rehearser');
  const lf = getExpressionScreeningItems('hypervigilant-loss-forecaster');
  const responses = [
    { itemId: tf[0].id, selectedValue: 5 }, { itemId: tf[1].id, selectedValue: 5 },
    { itemId: cp[0].id, selectedValue: 4 }, { itemId: cp[1].id, selectedValue: 4 },
    { itemId: wc[0].id, selectedValue: 3 }, { itemId: wc[1].id, selectedValue: 3 },
    { itemId: lf[0].id, selectedValue: 4 }, { itemId: lf[1].id, selectedValue: 4 },
  ];
  const r = routeExpressionScreening('pro', ['expression-group-hypervigilant-one-anticipatory-threat'], responses);
  assert('B7 routing yields candidates',
    r.category === 'one-expression-candidate' || r.category === 'expression-candidates-selected');
  assert('B7 candidates ≤2', r.selectedCandidates.length <= 2);
}

// Routing with Batch 7 avoidant group
{
  const ii = getExpressionScreeningItems('avoidant-indecisive-one');
  const cd = getExpressionScreeningItems('avoidant-commitment-dodger');
  const responses = [
    { itemId: ii[0].id, selectedValue: 5 }, { itemId: ii[1].id, selectedValue: 5 },
    { itemId: cd[0].id, selectedValue: 4 }, { itemId: cd[1].id, selectedValue: 4 },
  ];
  const r = routeExpressionScreening('pro', ['expression-group-avoidant-one-decision-commitment'], responses);
  assert('B7 avoidant routing yields candidates',
    r.category === 'one-expression-candidate' || r.category === 'expression-candidates-selected');
}

// No qualifying
{
  const tf = getExpressionScreeningItems('hypervigilant-threat-forecaster');
  assert('B7 below threshold',
    routeExpressionScreening('pro', ['expression-group-hypervigilant-one-anticipatory-threat'], [
      { itemId: tf[0].id, selectedValue: 2 }, { itemId: tf[1].id, selectedValue: 2 },
    ]).category === 'no-clear-expression');
}

// All incomplete
{
  const tf = getExpressionScreeningItems('hypervigilant-threat-forecaster');
  assert('B7 all incomplete',
    routeExpressionScreening('pro', ['expression-group-hypervigilant-one-anticipatory-threat'], [
      { itemId: tf[0].id, selectedValue: 4 },
    ]).category === 'insufficient-expression-evidence');
}

// All incomplete for avoidant group
{
  const ii = getExpressionScreeningItems('avoidant-indecisive-one');
  assert('B7 avoidant incomplete',
    routeExpressionScreening('pro', ['expression-group-avoidant-one-decision-commitment'], [
      { itemId: ii[0].id, selectedValue: 4 },
    ]).category === 'insufficient-expression-evidence');
}

/* ==================================================================
 *  Distinction validation — Batch 7
 * ================================================================*/

const itemCache = new Map<string, ReturnType<typeof getExpressionScreeningItems>>();
function itemsFor(eid: string) {
  if (!itemCache.has(eid)) itemCache.set(eid, getExpressionScreeningItems(eid));
  return itemCache.get(eid)!;
}
function hasItems(eid: string): boolean { return itemsFor(eid).length > 0; }

function promptsDiffer(e1: string, e2: string): boolean {
  if (!hasItems(e1) || !hasItems(e2)) return true;
  const i1 = itemsFor(e1), i2 = itemsFor(e2);
  for (const a of i1) for (const b of i2) if (a.prompt === b.prompt) return false;
  return true;
}

function idsDiffer(e1: string, e2: string): boolean {
  if (!hasItems(e1) || !hasItems(e2)) return e1 !== e2;
  return itemsFor(e1)[0].expressionId !== itemsFor(e2)[0].expressionId;
}

function groupsDiffer(e1: string, e2: string): boolean {
  if (!hasItems(e1) || !hasItems(e2)) return false;
  return itemsFor(e1)[0].groupId !== itemsFor(e2)[0].groupId;
}

// avoidant-indecisive-one versus controller-analysis-gatekeeper (cross-parent)
assert('indecisive ≠ analysis-gatekeeper ids', idsDiffer('avoidant-indecisive-one', 'controller-analysis-gatekeeper'));
assert('indecisive ≠ analysis-gatekeeper groups', groupsDiffer('avoidant-indecisive-one', 'controller-analysis-gatekeeper'));
assert('indecisive ≠ analysis-gatekeeper prompts', promptsDiffer('avoidant-indecisive-one', 'controller-analysis-gatekeeper'));

// avoidant-indecisive-one versus avoidant-perpetual-researcher (same group)
assert('indecisive ≠ perpetual-researcher ids', idsDiffer('avoidant-indecisive-one', 'avoidant-perpetual-researcher'));
assert('indecisive ≠ perpetual-researcher prompts', promptsDiffer('avoidant-indecisive-one', 'avoidant-perpetual-researcher'));

// avoidant-indecisive-one versus avoidant-commitment-dodger (same group)
assert('indecisive ≠ commitment-dodger ids', idsDiffer('avoidant-indecisive-one', 'avoidant-commitment-dodger'));
assert('indecisive ≠ commitment-dodger prompts', promptsDiffer('avoidant-indecisive-one', 'avoidant-commitment-dodger'));

// avoidant-commitment-dodger versus avoidant-ghost (different avoidant groups)
assert('commitment-dodger ≠ ghost ids', idsDiffer('avoidant-commitment-dodger', 'avoidant-ghost'));
assert('commitment-dodger ≠ ghost groups', groupsDiffer('avoidant-commitment-dodger', 'avoidant-ghost'));
assert('commitment-dodger ≠ ghost prompts', promptsDiffer('avoidant-commitment-dodger', 'avoidant-ghost'));

// avoidant-commitment-dodger versus controller-fixed-plan (cross-parent)
assert('commitment-dodger ≠ fixed-plan ids', idsDiffer('avoidant-commitment-dodger', 'controller-fixed-plan'));
assert('commitment-dodger ≠ fixed-plan groups', groupsDiffer('avoidant-commitment-dodger', 'controller-fixed-plan'));
assert('commitment-dodger ≠ fixed-plan prompts', promptsDiffer('avoidant-commitment-dodger', 'controller-fixed-plan'));

// avoidant-perpetual-researcher versus controller-analysis-gatekeeper (cross-parent)
assert('perpetual-researcher ≠ analysis-gatekeeper ids', idsDiffer('avoidant-perpetual-researcher', 'controller-analysis-gatekeeper'));
assert('perpetual-researcher ≠ analysis-gatekeeper groups', groupsDiffer('avoidant-perpetual-researcher', 'controller-analysis-gatekeeper'));
assert('perpetual-researcher ≠ analysis-gatekeeper prompts', promptsDiffer('avoidant-perpetual-researcher', 'controller-analysis-gatekeeper'));

// avoidant-perpetual-researcher versus unheld-reassurance-seeker (cross-parent)
assert('perpetual-researcher ≠ reassurance-seeker ids', idsDiffer('avoidant-perpetual-researcher', 'unheld-reassurance-seeker'));
assert('perpetual-researcher ≠ reassurance-seeker groups', groupsDiffer('avoidant-perpetual-researcher', 'unheld-reassurance-seeker'));
assert('perpetual-researcher ≠ reassurance-seeker prompts', promptsDiffer('avoidant-perpetual-researcher', 'unheld-reassurance-seeker'));

// avoidant-crisis-creator versus avoidant-procrastinator (different avoidant groups)
assert('crisis-creator ≠ procrastinator ids', idsDiffer('avoidant-crisis-creator', 'avoidant-procrastinator'));
assert('crisis-creator ≠ procrastinator groups', groupsDiffer('avoidant-crisis-creator', 'avoidant-procrastinator'));
assert('crisis-creator ≠ procrastinator prompts', promptsDiffer('avoidant-crisis-creator', 'avoidant-procrastinator'));

// avoidant-crisis-creator versus overloaded-one (cross-parent)
assert('crisis-creator ≠ overloaded-crisis-juggler ids', idsDiffer('avoidant-crisis-creator', 'overloaded-crisis-juggler'));
assert('crisis-creator ≠ overloaded-crisis-juggler prompts', promptsDiffer('avoidant-crisis-creator', 'overloaded-crisis-juggler'));

// hypervigilant-threat-forecaster versus controller-control-scanner (cross-parent)
assert('threat-forecaster ≠ control-scanner ids', idsDiffer('hypervigilant-threat-forecaster', 'controller-control-scanner'));
assert('threat-forecaster ≠ control-scanner groups', groupsDiffer('hypervigilant-threat-forecaster', 'controller-control-scanner'));
assert('threat-forecaster ≠ control-scanner prompts', promptsDiffer('hypervigilant-threat-forecaster', 'controller-control-scanner'));

// hypervigilant-threat-forecaster versus hypervigilant-conflict-predictor (same group)
assert('threat-forecaster ≠ conflict-predictor ids', idsDiffer('hypervigilant-threat-forecaster', 'hypervigilant-conflict-predictor'));
assert('threat-forecaster ≠ conflict-predictor prompts', promptsDiffer('hypervigilant-threat-forecaster', 'hypervigilant-conflict-predictor'));

// hypervigilant-threat-forecaster versus hypervigilant-loss-forecaster (same group)
assert('threat-forecaster ≠ loss-forecaster ids', idsDiffer('hypervigilant-threat-forecaster', 'hypervigilant-loss-forecaster'));
assert('threat-forecaster ≠ loss-forecaster prompts', promptsDiffer('hypervigilant-threat-forecaster', 'hypervigilant-loss-forecaster'));

// hypervigilant-conflict-predictor versus unheld-relationship-threat-scanner (cross-parent)
assert('conflict-predictor ≠ threat-scanner ids', idsDiffer('hypervigilant-conflict-predictor', 'unheld-relationship-threat-scanner'));
assert('conflict-predictor ≠ threat-scanner groups', groupsDiffer('hypervigilant-conflict-predictor', 'unheld-relationship-threat-scanner'));
assert('conflict-predictor ≠ threat-scanner prompts', promptsDiffer('hypervigilant-conflict-predictor', 'unheld-relationship-threat-scanner'));

// hypervigilant-conflict-predictor versus silenced-conflict-avoider (cross-parent)
assert('conflict-predictor ≠ conflict-avoider ids', idsDiffer('hypervigilant-conflict-predictor', 'silenced-conflict-avoider'));
assert('conflict-predictor ≠ conflict-avoider groups', groupsDiffer('hypervigilant-conflict-predictor', 'silenced-conflict-avoider'));
assert('conflict-predictor ≠ conflict-avoider prompts', promptsDiffer('hypervigilant-conflict-predictor', 'silenced-conflict-avoider'));

// hypervigilant-worst-case-rehearser versus hypervigilant-threat-forecaster (same group)
assert('worst-case ≠ threat-forecaster ids', idsDiffer('hypervigilant-worst-case-rehearser', 'hypervigilant-threat-forecaster'));
assert('worst-case ≠ threat-forecaster prompts', promptsDiffer('hypervigilant-worst-case-rehearser', 'hypervigilant-threat-forecaster'));

// hypervigilant-worst-case-rehearser versus hypervigilant-emergency-preparer (different hypervigilant groups)
assert('worst-case ≠ emergency-preparer ids', idsDiffer('hypervigilant-worst-case-rehearser', 'hypervigilant-emergency-preparer'));
assert('worst-case ≠ emergency-preparer groups', groupsDiffer('hypervigilant-worst-case-rehearser', 'hypervigilant-emergency-preparer'));
assert('worst-case ≠ emergency-preparer prompts', promptsDiffer('hypervigilant-worst-case-rehearser', 'hypervigilant-emergency-preparer'));

// hypervigilant-worst-case-rehearser versus hypervigilant-loss-forecaster (same group)
assert('worst-case ≠ loss-forecaster ids', idsDiffer('hypervigilant-worst-case-rehearser', 'hypervigilant-loss-forecaster'));
assert('worst-case ≠ loss-forecaster prompts', promptsDiffer('hypervigilant-worst-case-rehearser', 'hypervigilant-loss-forecaster'));

// hypervigilant-loss-forecaster versus grief-bearer (cross-parent)
assert('loss-forecaster ≠ grief-protective-numbing ids', idsDiffer('hypervigilant-loss-forecaster', 'grief-protective-numbing'));
assert('loss-forecaster ≠ grief-protective-numbing prompts', promptsDiffer('hypervigilant-loss-forecaster', 'grief-protective-numbing'));

// hypervigilant-loss-forecaster versus unheld-relationship-threat-scanner (cross-parent)
assert('loss-forecaster ≠ threat-scanner ids', idsDiffer('hypervigilant-loss-forecaster', 'unheld-relationship-threat-scanner'));
assert('loss-forecaster ≠ threat-scanner groups', groupsDiffer('hypervigilant-loss-forecaster', 'unheld-relationship-threat-scanner'));
assert('loss-forecaster ≠ threat-scanner prompts', promptsDiffer('hypervigilant-loss-forecaster', 'unheld-relationship-threat-scanner'));

// hypervigilant-loss-forecaster versus avoidant-pleasure-avoider (cross-parent)
assert('loss-forecaster ≠ pleasure-avoider ids', idsDiffer('hypervigilant-loss-forecaster', 'avoidant-pleasure-avoider'));
assert('loss-forecaster ≠ pleasure-avoider groups', groupsDiffer('hypervigilant-loss-forecaster', 'avoidant-pleasure-avoider'));
assert('loss-forecaster ≠ pleasure-avoider prompts', promptsDiffer('hypervigilant-loss-forecaster', 'avoidant-pleasure-avoider'));

// hypervigilant-exit-planner versus hypervigilant-threat-forecaster (different hypervigilant groups)
assert('exit-planner ≠ threat-forecaster ids', idsDiffer('hypervigilant-exit-planner', 'hypervigilant-threat-forecaster'));
assert('exit-planner ≠ threat-forecaster groups', groupsDiffer('hypervigilant-exit-planner', 'hypervigilant-threat-forecaster'));
assert('exit-planner ≠ threat-forecaster prompts', promptsDiffer('hypervigilant-exit-planner', 'hypervigilant-threat-forecaster'));

// hypervigilant-exit-planner versus avoidant-commitment-dodger (cross-parent)
assert('exit-planner ≠ commitment-dodger ids', idsDiffer('hypervigilant-exit-planner', 'avoidant-commitment-dodger'));
assert('exit-planner ≠ commitment-dodger groups', groupsDiffer('hypervigilant-exit-planner', 'avoidant-commitment-dodger'));
assert('exit-planner ≠ commitment-dodger prompts', promptsDiffer('hypervigilant-exit-planner', 'avoidant-commitment-dodger'));

// hypervigilant-exit-planner versus avoidant-ghost (cross-parent)
assert('exit-planner ≠ ghost ids', idsDiffer('hypervigilant-exit-planner', 'avoidant-ghost'));
assert('exit-planner ≠ ghost groups', groupsDiffer('hypervigilant-exit-planner', 'avoidant-ghost'));
assert('exit-planner ≠ ghost prompts', promptsDiffer('hypervigilant-exit-planner', 'avoidant-ghost'));

// hypervigilant-emergency-preparer versus controller-control-scanner (cross-parent)
assert('emergency-preparer ≠ control-scanner ids', idsDiffer('hypervigilant-emergency-preparer', 'controller-control-scanner'));
assert('emergency-preparer ≠ control-scanner groups', groupsDiffer('hypervigilant-emergency-preparer', 'controller-control-scanner'));
assert('emergency-preparer ≠ control-scanner prompts', promptsDiffer('hypervigilant-emergency-preparer', 'controller-control-scanner'));

// hypervigilant-sleepless-guard versus avoidant-sleep-disappear (cross-parent)
assert('sleepless-guard ≠ sleep-disappear ids', idsDiffer('hypervigilant-sleepless-guard', 'avoidant-sleep-disappear'));
assert('sleepless-guard ≠ sleep-disappear groups', groupsDiffer('hypervigilant-sleepless-guard', 'avoidant-sleep-disappear'));
assert('sleepless-guard ≠ sleep-disappear prompts', promptsDiffer('hypervigilant-sleepless-guard', 'avoidant-sleep-disappear'));

// hypervigilant-sleepless-guard versus hypervigilant-emergency-preparer (same group)
assert('sleepless-guard ≠ emergency-preparer ids', idsDiffer('hypervigilant-sleepless-guard', 'hypervigilant-emergency-preparer'));
assert('sleepless-guard ≠ emergency-preparer prompts', promptsDiffer('hypervigilant-sleepless-guard', 'hypervigilant-emergency-preparer'));

// hypervigilant-protective-parent versus rescuer (cross-parent)
assert('protective-parent ≠ rescuer-fixer ids', idsDiffer('hypervigilant-protective-parent', 'rescuer-fixer'));
assert('protective-parent ≠ rescuer-fixer prompts', promptsDiffer('hypervigilant-protective-parent', 'rescuer-fixer'));

// hypervigilant-protective-parent versus over-responsible-one (cross-parent)
assert('protective-parent ≠ over-responsible-emotional-caretaker ids', idsDiffer('hypervigilant-protective-parent', 'over-responsible-emotional-caretaker'));
assert('protective-parent ≠ over-responsible-emotional-caretaker prompts', promptsDiffer('hypervigilant-protective-parent', 'over-responsible-emotional-caretaker'));

// hypervigilant-protective-parent versus unheld-relationship-threat-scanner (cross-parent)
assert('protective-parent ≠ threat-scanner ids', idsDiffer('hypervigilant-protective-parent', 'unheld-relationship-threat-scanner'));
assert('protective-parent ≠ threat-scanner groups', groupsDiffer('hypervigilant-protective-parent', 'unheld-relationship-threat-scanner'));
assert('protective-parent ≠ threat-scanner prompts', promptsDiffer('hypervigilant-protective-parent', 'unheld-relationship-threat-scanner'));

/* ==================================================================
 *  Safety validation — Batch 7 prompts
 * ================================================================*/

const allPrompts = items.map(i => i.prompt);

// Does not call the user paranoid
for (const p of allPrompts) {
  assert('no paranoid label', !p.toLowerCase().includes('paranoid'));
  assert('no paranoid label', !p.toLowerCase().includes('paranoia'));
}

// Does not diagnose anxiety
for (const p of allPrompts) {
  assert('no anxiety diagnosis', !p.toLowerCase().includes('anxiety disorder'));
  assert('no anxiety diagnosis', !p.toLowerCase().includes('generalized anxiety'));
}

// Does not diagnose trauma
for (const p of allPrompts) {
  assert('no trauma diagnosis', !p.toLowerCase().includes('ptsd'));
  assert('no trauma diagnosis', !p.toLowerCase().includes('trauma'));
  assert('no trauma diagnosis', !p.toLowerCase().includes('traumatic'));
}

// Does not diagnose insomnia
for (const p of allPrompts) {
  assert('no insomnia diagnosis', !p.toLowerCase().includes('insomnia'));
  assert('no insomnia diagnosis', !p.toLowerCase().includes('sleep disorder'));
}

// Does not diagnose grief
for (const p of allPrompts) {
  assert('no grief diagnosis', !p.toLowerCase().includes('complicated grief'));
  assert('no grief diagnosis', !p.toLowerCase().includes('prolonged grief'));
}

// Does not condemn reasonable safety planning
for (const p of allPrompts) {
  assert('no condemn safety planning', !p.toLowerCase().includes('you should not prepare'));
  assert('no condemn safety planning', !p.toLowerCase().includes('safety planning is unhealthy'));
}

// Does not condemn leaving unsafe situations
for (const p of allPrompts) {
  assert('no condemn leaving', !p.toLowerCase().includes('should not leave'));
  assert('no condemn leaving', !p.toLowerCase().includes('should stay'));
}

// Does not pathologize ordinary emergency preparation
for (const p of allPrompts) {
  assert('no pathologize emergency prep', !p.toLowerCase().includes('emergency kit'));
  assert('no pathologize emergency prep', !p.toLowerCase().includes('disaster prep'));
}

// Does not accuse user of intentionally creating crises
for (const p of allPrompts) {
  assert('no accuse crisis creation', !p.toLowerCase().includes('create crisis'));
  assert('no accuse crisis creation', !p.toLowerCase().includes('intentionally'));
}

// Does not accuse user of controlling another person
for (const p of allPrompts) {
  assert('no accuse control', !p.toLowerCase().includes('controlling'));
  assert('no accuse control', !p.toLowerCase().includes('manipulative'));
}

// Does not require biological or legal parenthood
for (const p of allPrompts) {
  assert('no parenthood required', !p.toLowerCase().includes('your child'));
  assert('no parenthood required', !p.toLowerCase().includes('your kid'));
  assert('no parenthood required', !p.toLowerCase().includes('your son'));
  assert('no parenthood required', !p.toLowerCase().includes('your daughter'));
}

// Does not equate caution with pathology
for (const p of allPrompts) {
  assert('no caution = pathology', !p.toLowerCase().includes('too cautious'));
  assert('no caution = pathology', !p.toLowerCase().includes('overcautious'));
  assert('no caution = pathology', !p.toLowerCase().includes('over-cautious'));
}

// Does not treat anticipated danger as established fact
for (const p of allPrompts) {
  assert('no anticipation = fact', !p.toLowerCase().includes('will happen'));
  assert('no anticipation = fact', !p.toLowerCase().includes('is going to be'));
}

// crisis-creator prompts describe delay without alleging deliberate sabotage
{
  const cc = getExpressionScreeningItems('avoidant-crisis-creator');
  assert('crisis-creator-01 no sabotage', !cc[0].prompt.toLowerCase().includes('sabotage'));
  assert('crisis-creator-01 no deliberate', !cc[0].prompt.toLowerCase().includes('deliberately'));
  assert('crisis-creator-02 no sabotage', !cc[1].prompt.toLowerCase().includes('sabotage'));
  assert('crisis-creator-02 describes delay', cc[1].prompt.toLowerCase().includes('delay') || cc[1].prompt.toLowerCase().includes('wait') || cc[1].prompt.toLowerCase().includes('last-minute'));
}

// threat prompts describe anticipation rather than objective danger
{
  const tf = getExpressionScreeningItems('hypervigilant-threat-forecaster');
  assert('threat-forecaster-01 "could become"', tf[0].prompt.includes('could become'));
  assert('threat-forecaster-02 "possible danger"', tf[1].prompt.includes('possible danger'));
}

// exit-planner-01 includes the absence of clear current danger
{
  const ep = getExpressionScreeningItems('hypervigilant-exit-planner');
  assert('exit-planner-01 "no clear danger"', ep[0].prompt.includes('no clear danger'));
}

// emergency-preparer-01 uses one preparedness concept
{
  const em = getExpressionScreeningItems('hypervigilant-emergency-preparer');
  assert('emergency-preparer-01 "backup resources"', em[0].prompt.includes('backup resources'));
  assert('emergency-preparer-01 "clearly requires"', em[0].prompt.includes('clearly requires'));
}

// sleepless-guard prompts describe vigilance rather than diagnosing insomnia
{
  const sg = getExpressionScreeningItems('hypervigilant-sleepless-guard');
  assert('sleepless-guard-01 "monitoring for possible problems"', sg[0].prompt.includes('monitoring for possible problems'));
  assert('sleepless-guard-02 "stay mentally ready"', sg[1].prompt.includes('stay mentally ready'));
  assert('sleepless-guard-01 no insomnia', !sg[0].prompt.toLowerCase().includes('insomnia'));
  assert('sleepless-guard-02 no insomnia', !sg[1].prompt.toLowerCase().includes('insomnia'));
}

// protective-parent-01 distinguishes heightened monitoring from reasonable precautions
{
  const pp = getExpressionScreeningItems('hypervigilant-protective-parent');
  assert('protective-parent-01 "after reasonable precautions"', pp[0].prompt.includes('after reasonable precautions are already in place'));
}

// protective-parent prompts do not require having children
{
  const pp = getExpressionScreeningItems('hypervigilant-protective-parent');
  assert('protective-parent-01 "someone I feel responsible for"', pp[0].prompt.includes('someone I feel responsible for'));
  assert('protective-parent-02 "another person"', pp[1].prompt.includes("another person's"));
}

/* ==================================================================
 *  Distinction validation — Batch 8
 * ================================================================*/

// mood-scanner versus relationship-threat-scanner (cross-parent)
assert('mood-scanner ≠ threat-scanner ids', idsDiffer('hypervigilant-mood-scanner', 'unheld-relationship-threat-scanner'));
assert('mood-scanner ≠ threat-scanner groups', groupsDiffer('hypervigilant-mood-scanner', 'unheld-relationship-threat-scanner'));
assert('mood-scanner ≠ threat-scanner prompts', promptsDiffer('hypervigilant-mood-scanner', 'unheld-relationship-threat-scanner'));

// mood-scanner versus entangled-appeaser (cross-parent)
assert('mood-scanner ≠ appeaser ids', idsDiffer('hypervigilant-mood-scanner', 'entangled-appeaser'));
assert('mood-scanner ≠ appeaser groups', groupsDiffer('hypervigilant-mood-scanner', 'entangled-appeaser'));
assert('mood-scanner ≠ appeaser prompts', promptsDiffer('hypervigilant-mood-scanner', 'entangled-appeaser'));

// mood-scanner versus weather-reporter (same group)
assert('mood-scanner ≠ weather-reporter ids', idsDiffer('hypervigilant-mood-scanner', 'hypervigilant-weather-reporter'));
assert('mood-scanner ≠ weather-reporter prompts', promptsDiffer('hypervigilant-mood-scanner', 'hypervigilant-weather-reporter'));

// betrayal-scanner versus relationship-threat-scanner (cross-parent)
assert('betrayal-scanner ≠ threat-scanner ids', idsDiffer('hypervigilant-betrayal-scanner', 'unheld-relationship-threat-scanner'));
assert('betrayal-scanner ≠ threat-scanner groups', groupsDiffer('hypervigilant-betrayal-scanner', 'unheld-relationship-threat-scanner'));
assert('betrayal-scanner ≠ threat-scanner prompts', promptsDiffer('hypervigilant-betrayal-scanner', 'unheld-relationship-threat-scanner'));

// betrayal-scanner versus ambiguous-signal-interpreter (same group)
assert('betrayal-scanner ≠ ambiguous-signal-interpreter ids', idsDiffer('hypervigilant-betrayal-scanner', 'hypervigilant-ambiguous-signal-interpreter'));
assert('betrayal-scanner ≠ ambiguous-signal-interpreter prompts', promptsDiffer('hypervigilant-betrayal-scanner', 'hypervigilant-ambiguous-signal-interpreter'));

// betrayal-scanner versus jealousy-interpreter (cross-parent)
assert('betrayal-scanner ≠ jealousy-interpreter ids', idsDiffer('hypervigilant-betrayal-scanner', 'unheld-jealousy-interpreter'));
assert('betrayal-scanner ≠ jealousy-interpreter groups', groupsDiffer('hypervigilant-betrayal-scanner', 'unheld-jealousy-interpreter'));
assert('betrayal-scanner ≠ jealousy-interpreter prompts', promptsDiffer('hypervigilant-betrayal-scanner', 'unheld-jealousy-interpreter'));

// ambiguous-signal-interpreter versus conflict-predictor (different hypervigilant groups)
assert('ambiguous-signal-interpreter ≠ conflict-predictor ids', idsDiffer('hypervigilant-ambiguous-signal-interpreter', 'hypervigilant-conflict-predictor'));
assert('ambiguous-signal-interpreter ≠ conflict-predictor groups', groupsDiffer('hypervigilant-ambiguous-signal-interpreter', 'hypervigilant-conflict-predictor'));
assert('ambiguous-signal-interpreter ≠ conflict-predictor prompts', promptsDiffer('hypervigilant-ambiguous-signal-interpreter', 'hypervigilant-conflict-predictor'));

// ambiguous-signal-interpreter versus relationship-threat-scanner (cross-parent)
assert('ambiguous-signal-interpreter ≠ threat-scanner ids', idsDiffer('hypervigilant-ambiguous-signal-interpreter', 'unheld-relationship-threat-scanner'));
assert('ambiguous-signal-interpreter ≠ threat-scanner groups', groupsDiffer('hypervigilant-ambiguous-signal-interpreter', 'unheld-relationship-threat-scanner'));
assert('ambiguous-signal-interpreter ≠ threat-scanner prompts', promptsDiffer('hypervigilant-ambiguous-signal-interpreter', 'unheld-relationship-threat-scanner'));

// weather-reporter versus mood-scanner (same group)
assert('weather-reporter ≠ mood-scanner ids', idsDiffer('hypervigilant-weather-reporter', 'hypervigilant-mood-scanner'));
assert('weather-reporter ≠ mood-scanner prompts', promptsDiffer('hypervigilant-weather-reporter', 'hypervigilant-mood-scanner'));

// weather-reporter versus perception-manager (cross-parent)
assert('weather-reporter ≠ perception-manager ids', idsDiffer('hypervigilant-weather-reporter', 'controller-perception-manager'));
assert('weather-reporter ≠ perception-manager groups', groupsDiffer('hypervigilant-weather-reporter', 'controller-perception-manager'));
assert('weather-reporter ≠ perception-manager prompts', promptsDiffer('hypervigilant-weather-reporter', 'controller-perception-manager'));

// weather-reporter versus entangled-appeaser (cross-parent)
assert('weather-reporter ≠ appeaser ids', idsDiffer('hypervigilant-weather-reporter', 'entangled-appeaser'));
assert('weather-reporter ≠ appeaser groups', groupsDiffer('hypervigilant-weather-reporter', 'entangled-appeaser'));
assert('weather-reporter ≠ appeaser prompts', promptsDiffer('hypervigilant-weather-reporter', 'entangled-appeaser'));

// body-monitor versus sleepless-guard (different hypervigilant groups)
assert('body-monitor ≠ sleepless-guard ids', idsDiffer('hypervigilant-body-monitor', 'hypervigilant-sleepless-guard'));
assert('body-monitor ≠ sleepless-guard groups', groupsDiffer('hypervigilant-body-monitor', 'hypervigilant-sleepless-guard'));
assert('body-monitor ≠ sleepless-guard prompts', promptsDiffer('hypervigilant-body-monitor', 'hypervigilant-sleepless-guard'));

// digital-monitor versus betrayal-scanner (different hypervigilant groups)
assert('digital-monitor ≠ betrayal-scanner ids', idsDiffer('hypervigilant-digital-monitor', 'hypervigilant-betrayal-scanner'));
assert('digital-monitor ≠ betrayal-scanner groups', groupsDiffer('hypervigilant-digital-monitor', 'hypervigilant-betrayal-scanner'));
assert('digital-monitor ≠ betrayal-scanner prompts', promptsDiffer('hypervigilant-digital-monitor', 'hypervigilant-betrayal-scanner'));

// digital-monitor versus reassurance-seeker (cross-parent)
assert('digital-monitor ≠ reassurance-seeker ids', idsDiffer('hypervigilant-digital-monitor', 'unheld-reassurance-seeker'));
assert('digital-monitor ≠ reassurance-seeker groups', groupsDiffer('hypervigilant-digital-monitor', 'unheld-reassurance-seeker'));
assert('digital-monitor ≠ reassurance-seeker prompts', promptsDiffer('hypervigilant-digital-monitor', 'unheld-reassurance-seeker'));

// digital-monitor versus relationship-threat-scanner (cross-parent)
assert('digital-monitor ≠ threat-scanner ids', idsDiffer('hypervigilant-digital-monitor', 'unheld-relationship-threat-scanner'));
assert('digital-monitor ≠ threat-scanner groups', groupsDiffer('hypervigilant-digital-monitor', 'unheld-relationship-threat-scanner'));
assert('digital-monitor ≠ threat-scanner prompts', promptsDiffer('hypervigilant-digital-monitor', 'unheld-relationship-threat-scanner'));

// substance-watcher versus mood-scanner (different hypervigilant groups)
assert('substance-watcher ≠ mood-scanner ids', idsDiffer('hypervigilant-substance-watcher', 'hypervigilant-mood-scanner'));
assert('substance-watcher ≠ mood-scanner groups', groupsDiffer('hypervigilant-substance-watcher', 'hypervigilant-mood-scanner'));
assert('substance-watcher ≠ mood-scanner prompts', promptsDiffer('hypervigilant-substance-watcher', 'hypervigilant-mood-scanner'));

// substance-watcher versus threat-forecaster (different hypervigilant groups)
assert('substance-watcher ≠ threat-forecaster ids', idsDiffer('hypervigilant-substance-watcher', 'hypervigilant-threat-forecaster'));
assert('substance-watcher ≠ threat-forecaster groups', groupsDiffer('hypervigilant-substance-watcher', 'hypervigilant-threat-forecaster'));
assert('substance-watcher ≠ threat-forecaster prompts', promptsDiffer('hypervigilant-substance-watcher', 'hypervigilant-threat-forecaster'));

// substance-watcher versus betrayal-scanner (different hypervigilant groups)
assert('substance-watcher ≠ betrayal-scanner ids', idsDiffer('hypervigilant-substance-watcher', 'hypervigilant-betrayal-scanner'));
assert('substance-watcher ≠ betrayal-scanner groups', groupsDiffer('hypervigilant-substance-watcher', 'hypervigilant-betrayal-scanner'));
assert('substance-watcher ≠ betrayal-scanner prompts', promptsDiffer('hypervigilant-substance-watcher', 'hypervigilant-betrayal-scanner'));

// entangled-pursuer versus reassurance-seeker (cross-parent)
assert('pursuer ≠ reassurance-seeker ids', idsDiffer('entangled-pursuer', 'unheld-reassurance-seeker'));
assert('pursuer ≠ reassurance-seeker groups', groupsDiffer('entangled-pursuer', 'unheld-reassurance-seeker'));
assert('pursuer ≠ reassurance-seeker prompts', promptsDiffer('entangled-pursuer', 'unheld-reassurance-seeker'));

// entangled-pursuer versus conflict-for-contact (cross-parent)
assert('pursuer ≠ conflict-for-contact ids', idsDiffer('entangled-pursuer', 'unheld-conflict-for-contact'));
assert('pursuer ≠ conflict-for-contact groups', groupsDiffer('entangled-pursuer', 'unheld-conflict-for-contact'));
assert('pursuer ≠ conflict-for-contact prompts', promptsDiffer('entangled-pursuer', 'unheld-conflict-for-contact'));

// entangled-pursuer versus ghost (cross-parent)
assert('pursuer ≠ ghost ids', idsDiffer('entangled-pursuer', 'avoidant-ghost'));
assert('pursuer ≠ ghost groups', groupsDiffer('entangled-pursuer', 'avoidant-ghost'));
assert('pursuer ≠ ghost prompts', promptsDiffer('entangled-pursuer', 'avoidant-ghost'));

// entangled-pursuer versus relationship-threat-scanner (cross-parent)
assert('pursuer ≠ threat-scanner ids', idsDiffer('entangled-pursuer', 'unheld-relationship-threat-scanner'));
assert('pursuer ≠ threat-scanner groups', groupsDiffer('entangled-pursuer', 'unheld-relationship-threat-scanner'));
assert('pursuer ≠ threat-scanner prompts', promptsDiffer('entangled-pursuer', 'unheld-relationship-threat-scanner'));

// entangled-appeaser versus people-pleaser (cross-parent)
assert('appeaser ≠ people-pleaser ids', idsDiffer('entangled-appeaser', 'silenced-people-pleaser'));
assert('appeaser ≠ people-pleaser groups', groupsDiffer('entangled-appeaser', 'silenced-people-pleaser'));
assert('appeaser ≠ people-pleaser prompts', promptsDiffer('entangled-appeaser', 'silenced-people-pleaser'));

// entangled-appeaser versus approval-chameleon (cross-parent)
assert('appeaser ≠ approval-chameleon ids', idsDiffer('entangled-appeaser', 'invisible-approval-chameleon'));
assert('appeaser ≠ approval-chameleon groups', groupsDiffer('entangled-appeaser', 'invisible-approval-chameleon'));
assert('appeaser ≠ approval-chameleon prompts', promptsDiffer('entangled-appeaser', 'invisible-approval-chameleon'));

// entangled-appeaser versus conflict-avoider (cross-parent)
assert('appeaser ≠ conflict-avoider ids', idsDiffer('entangled-appeaser', 'silenced-conflict-avoider'));
assert('appeaser ≠ conflict-avoider groups', groupsDiffer('entangled-appeaser', 'silenced-conflict-avoider'));
assert('appeaser ≠ conflict-avoider prompts', promptsDiffer('entangled-appeaser', 'silenced-conflict-avoider'));

// entangled-direction-dependent versus indecisive-one (cross-parent)
assert('direction-dependent ≠ indecisive-one ids', idsDiffer('entangled-direction-dependent', 'avoidant-indecisive-one'));
assert('direction-dependent ≠ indecisive-one groups', groupsDiffer('entangled-direction-dependent', 'avoidant-indecisive-one'));
assert('direction-dependent ≠ indecisive-one prompts', promptsDiffer('entangled-direction-dependent', 'avoidant-indecisive-one'));

// entangled-direction-dependent versus reassurance-seeker (cross-parent)
assert('direction-dependent ≠ reassurance-seeker ids', idsDiffer('entangled-direction-dependent', 'unheld-reassurance-seeker'));
assert('direction-dependent ≠ reassurance-seeker groups', groupsDiffer('entangled-direction-dependent', 'unheld-reassurance-seeker'));
assert('direction-dependent ≠ reassurance-seeker prompts', promptsDiffer('entangled-direction-dependent', 'unheld-reassurance-seeker'));

// entangled-direction-dependent versus approval-chameleon (cross-parent)
assert('direction-dependent ≠ approval-chameleon ids', idsDiffer('entangled-direction-dependent', 'invisible-approval-chameleon'));
assert('direction-dependent ≠ approval-chameleon groups', groupsDiffer('entangled-direction-dependent', 'invisible-approval-chameleon'));
assert('direction-dependent ≠ approval-chameleon prompts', promptsDiffer('entangled-direction-dependent', 'invisible-approval-chameleon'));

// entangled-crisis-pair versus conflict-for-contact (cross-parent)
assert('crisis-pair ≠ conflict-for-contact ids', idsDiffer('entangled-crisis-pair', 'unheld-conflict-for-contact'));
assert('crisis-pair ≠ conflict-for-contact groups', groupsDiffer('entangled-crisis-pair', 'unheld-conflict-for-contact'));
assert('crisis-pair ≠ conflict-for-contact prompts', promptsDiffer('entangled-crisis-pair', 'unheld-conflict-for-contact'));

// entangled-crisis-pair versus crisis-creator (cross-parent)
assert('crisis-pair ≠ crisis-creator ids', idsDiffer('entangled-crisis-pair', 'avoidant-crisis-creator'));
assert('crisis-pair ≠ crisis-creator groups', groupsDiffer('entangled-crisis-pair', 'avoidant-crisis-creator'));
assert('crisis-pair ≠ crisis-creator prompts', promptsDiffer('entangled-crisis-pair', 'avoidant-crisis-creator'));

// entangled-crisis-pair versus entangled-pursuer (same group)
assert('crisis-pair ≠ pursuer ids', idsDiffer('entangled-crisis-pair', 'entangled-pursuer'));
assert('crisis-pair ≠ pursuer prompts', promptsDiffer('entangled-crisis-pair', 'entangled-pursuer'));

/* ==================================================================
 *  Safety validation — Batch 8 prompts
 * ================================================================*/

// Does not accuse another person of betrayal
for (const p of allPrompts) {
  assert('no accuse betrayal', !p.toLowerCase().includes('has betrayed'));
  assert('no accuse betrayal', !p.toLowerCase().includes('is betraying'));
}

// Does not accuse another person of substance use
for (const p of allPrompts) {
  assert('no accuse substance use', !p.toLowerCase().includes('has been drinking'));
  assert('no accuse substance use', !p.toLowerCase().includes('is using'));
}

// Does not diagnose addiction
for (const p of allPrompts) {
  assert('no addiction diagnosis', !p.toLowerCase().includes('addict'));
  assert('no addiction diagnosis', !p.toLowerCase().includes('substance use disorder'));
}

// Does not diagnose anxiety
for (const p of allPrompts) {
  assert('no anxiety diagnosis', !p.toLowerCase().includes('anxiety disorder'));
  assert('no anxiety diagnosis', !p.toLowerCase().includes('generalized anxiety'));
}

// Does not diagnose trauma
for (const p of allPrompts) {
  assert('no trauma diagnosis', !p.toLowerCase().includes('ptsd'));
  assert('no trauma diagnosis', !p.toLowerCase().includes('trauma'));
}

// Does not diagnose codependency
for (const p of allPrompts) {
  assert('no codependency diagnosis', !p.toLowerCase().includes('codependen'));
}

// Does not diagnose health anxiety
for (const p of allPrompts) {
  assert('no health anxiety diagnosis', !p.toLowerCase().includes('health anxiety'));
  assert('no health anxiety diagnosis', !p.toLowerCase().includes('hypochondria'));
}

// Does not encourage digital surveillance
for (const p of allPrompts) {
  assert('no digital surveillance', !p.toLowerCase().includes('surveillance'));
  assert('no digital surveillance', !p.toLowerCase().includes('spy'));
}

// Does not encourage privacy violations
for (const p of allPrompts) {
  assert('no privacy violations', !p.toLowerCase().includes('password'));
  assert('no privacy violations', !p.toLowerCase().includes('private messages'));
}

// Does not encourage searching belongings
for (const p of allPrompts) {
  assert('no searching belongings', !p.toLowerCase().includes('belongings'));
  assert('no searching belongings', !p.toLowerCase().includes('search their'));
}

// Does not encourage confrontation
for (const p of allPrompts) {
  assert('no confrontation', !p.toLowerCase().includes('you should confront'));
  assert('no confrontation', !p.toLowerCase().includes('you must confront'));
  assert('no confrontation', !p.toLowerCase().includes('you need to confront'));
}

// Does not encourage unwanted contact
for (const p of allPrompts) {
  assert('no unwanted contact', !p.toLowerCase().includes('keep contacting'));
  assert('no unwanted contact', !p.toLowerCase().includes('keep messaging'));
}

// Does not normalize ignoring boundaries
for (const p of allPrompts) {
  assert('no ignoring boundaries', !p.toLowerCase().includes('ignore their boundary'));
  assert('no ignoring boundaries', !p.toLowerCase().includes('respect their boundary'));
}

// Does not blame appeasement used for safety
for (const p of allPrompts) {
  assert('no blame appeasement', !p.toLowerCase().includes('should not agree'));
  assert('no blame appeasement', !p.toLowerCase().includes('appeasement is wrong'));
}

// Does not romanticize relational crises
for (const p of allPrompts) {
  assert('no romanticize crisis', !p.toLowerCase().includes('proof of love'));
  assert('no romanticize crisis', !p.toLowerCase().includes('shows how much'));
}

// Does not excuse abuse or aggression
for (const p of allPrompts) {
  assert('no excuse abuse', !p.toLowerCase().includes('understand why they'));
  assert('no excuse abuse', !p.toLowerCase().includes('abuse'));
}

// Does not claim substance use causes abuse
for (const p of allPrompts) {
  assert('no substance = abuse', !p.toLowerCase().includes('substance use causes'));
  assert('no substance = abuse', !p.toLowerCase().includes('drinking causes'));
}

// Does not treat ambiguous cues as proof
for (const p of allPrompts) {
  assert('no ambiguous = proof', !p.toLowerCase().includes('certain they'));
}
// Batch 8 prompts do not treat ambiguous relational cues as proof
{
  const batch8Items = items.filter(i => allCovered.slice(48, 59).includes(i.expressionId));
  for (const p of batch8Items.map(i => i.prompt)) {
    assert('B8 no ambiguous = proof', !p.toLowerCase().includes('proof'));
    assert('B8 no ambiguous = proof', !p.toLowerCase().includes('certain they'));
  }
}

// digital-monitor-02 is limited to information lawfully visible to the user
{
  const dm = getExpressionScreeningItems('hypervigilant-digital-monitor');
  assert('digital-monitor-02 "lawfully visible"', dm[1].prompt.includes('lawfully visible to me'));
}

// substance-watcher-02 refers only to visible changes in a shared environment
{
  const sw = getExpressionScreeningItems('hypervigilant-substance-watcher');
  assert('substance-watcher-02 "shared environment"', sw[1].prompt.includes('shared environment'));
}

// pursuer-01 excludes situations where a boundary has been set
{
  const pu = getExpressionScreeningItems('entangled-pursuer');
  assert('pursuer-01 "without setting a boundary"', pu[0].prompt.includes('without setting a boundary'));
}

// appeaser-01 includes a reasonably safe context
{
  const ap = getExpressionScreeningItems('entangled-appeaser');
  assert('appeaser-01 "reasonably safe"', ap[0].prompt.includes('reasonably safe'));
}

// crisis-pair-01 describes only a temporary increase in perceived closeness
{
  const cp = getExpressionScreeningItems('entangled-crisis-pair');
  assert('crisis-pair-01 "temporary increase"', cp[0].prompt.includes('temporary increase'));
}

// crisis-pair prompts do not imply that crisis is desirable or proof of love
{
  const cp = getExpressionScreeningItems('entangled-crisis-pair');
  assert('crisis-pair-01 no desirability', !cp[0].prompt.toLowerCase().includes('desirable'));
  assert('crisis-pair-01 no proof of love', !cp[0].prompt.toLowerCase().includes('love'));
  assert('crisis-pair-02 no desirability', !cp[1].prompt.toLowerCase().includes('desirable'));
  assert('crisis-pair-02 no proof of love', !cp[1].prompt.toLowerCase().includes('love'));
}

/* ==================================================================
 *  Distinction validation — Batch 9
 * ================================================================*/

// entangled-rescuer versus over-responsible-one (cross-parent)
assert('rescuer ≠ over-responsible-emotional-caretaker ids', idsDiffer('entangled-rescuer', 'over-responsible-emotional-caretaker'));
assert('rescuer ≠ over-responsible-emotional-caretaker prompts', promptsDiffer('entangled-rescuer', 'over-responsible-emotional-caretaker'));

// entangled-rescuer versus hypervigilant-protective-parent (cross-parent)
assert('rescuer ≠ protective-parent ids', idsDiffer('entangled-rescuer', 'hypervigilant-protective-parent'));
assert('rescuer ≠ protective-parent groups', groupsDiffer('entangled-rescuer', 'hypervigilant-protective-parent'));
assert('rescuer ≠ protective-parent prompts', promptsDiffer('entangled-rescuer', 'hypervigilant-protective-parent'));

// entangled-rescuer versus martyr (cross-parent)
assert('rescuer ≠ martyr-over-giver ids', idsDiffer('entangled-rescuer', 'martyr-over-giver'));
assert('rescuer ≠ martyr-over-giver prompts', promptsDiffer('entangled-rescuer', 'martyr-over-giver'));

// entangled-mutual-monitor versus hypervigilant-digital-monitor (cross-parent)
assert('mutual-monitor ≠ digital-monitor ids', idsDiffer('entangled-mutual-monitor', 'hypervigilant-digital-monitor'));
assert('mutual-monitor ≠ digital-monitor groups', groupsDiffer('entangled-mutual-monitor', 'hypervigilant-digital-monitor'));
assert('mutual-monitor ≠ digital-monitor prompts', promptsDiffer('entangled-mutual-monitor', 'hypervigilant-digital-monitor'));

// entangled-mutual-monitor versus relationship-threat-scanner (cross-parent)
assert('mutual-monitor ≠ threat-scanner ids', idsDiffer('entangled-mutual-monitor', 'unheld-relationship-threat-scanner'));
assert('mutual-monitor ≠ threat-scanner groups', groupsDiffer('entangled-mutual-monitor', 'unheld-relationship-threat-scanner'));
assert('mutual-monitor ≠ threat-scanner prompts', promptsDiffer('entangled-mutual-monitor', 'unheld-relationship-threat-scanner'));

// entangled-mutual-monitor versus reassurance-seeker (cross-parent)
assert('mutual-monitor ≠ reassurance-seeker ids', idsDiffer('entangled-mutual-monitor', 'unheld-reassurance-seeker'));
assert('mutual-monitor ≠ reassurance-seeker groups', groupsDiffer('entangled-mutual-monitor', 'unheld-reassurance-seeker'));
assert('mutual-monitor ≠ reassurance-seeker prompts', promptsDiffer('entangled-mutual-monitor', 'unheld-reassurance-seeker'));

// entangled-identity-merger versus entangled-direction-dependent (different entangled groups)
assert('identity-merger ≠ direction-dependent ids', idsDiffer('entangled-identity-merger', 'entangled-direction-dependent'));
assert('identity-merger ≠ direction-dependent groups', groupsDiffer('entangled-identity-merger', 'entangled-direction-dependent'));
assert('identity-merger ≠ direction-dependent prompts', promptsDiffer('entangled-identity-merger', 'entangled-direction-dependent'));

// entangled-identity-merger versus approval-chameleon (cross-parent)
assert('identity-merger ≠ approval-chameleon ids', idsDiffer('entangled-identity-merger', 'invisible-approval-chameleon'));
assert('identity-merger ≠ approval-chameleon groups', groupsDiffer('entangled-identity-merger', 'invisible-approval-chameleon'));
assert('identity-merger ≠ approval-chameleon prompts', promptsDiffer('entangled-identity-merger', 'invisible-approval-chameleon'));

// entangled-identity-merger versus people-pleaser (cross-parent)
assert('identity-merger ≠ people-pleaser ids', idsDiffer('entangled-identity-merger', 'silenced-people-pleaser'));
assert('identity-merger ≠ people-pleaser groups', groupsDiffer('entangled-identity-merger', 'silenced-people-pleaser'));
assert('identity-merger ≠ people-pleaser prompts', promptsDiffer('entangled-identity-merger', 'silenced-people-pleaser'));

// entangled-withdraw-return versus avoidant-ghost (cross-parent)
assert('withdraw-return ≠ ghost ids', idsDiffer('entangled-withdraw-return', 'avoidant-ghost'));
assert('withdraw-return ≠ ghost groups', groupsDiffer('entangled-withdraw-return', 'avoidant-ghost'));
assert('withdraw-return ≠ ghost prompts', promptsDiffer('entangled-withdraw-return', 'avoidant-ghost'));

// entangled-withdraw-return versus entangled-pursuer (different entangled groups)
assert('withdraw-return ≠ pursuer ids', idsDiffer('entangled-withdraw-return', 'entangled-pursuer'));
assert('withdraw-return ≠ pursuer groups', groupsDiffer('entangled-withdraw-return', 'entangled-pursuer'));
assert('withdraw-return ≠ pursuer prompts', promptsDiffer('entangled-withdraw-return', 'entangled-pursuer'));

// entangled-withdraw-return versus entangled-crisis-pair (different entangled groups)
assert('withdraw-return ≠ crisis-pair ids', idsDiffer('entangled-withdraw-return', 'entangled-crisis-pair'));
assert('withdraw-return ≠ crisis-pair groups', groupsDiffer('entangled-withdraw-return', 'entangled-crisis-pair'));
assert('withdraw-return ≠ crisis-pair prompts', promptsDiffer('entangled-withdraw-return', 'entangled-crisis-pair'));

// grief-unexpressed versus grief-silent-mourning (same group)
assert('grief-unexpressed ≠ silent-mourning ids', idsDiffer('grief-unexpressed', 'grief-silent-mourning'));
assert('grief-unexpressed ≠ silent-mourning prompts', promptsDiffer('grief-unexpressed', 'grief-silent-mourning'));

// grief-unexpressed versus avoidant-emotional-evader (cross-parent)
assert('grief-unexpressed ≠ emotional-evader ids', idsDiffer('grief-unexpressed', 'avoidant-emotional-evader'));
assert('grief-unexpressed ≠ emotional-evader groups', groupsDiffer('grief-unexpressed', 'avoidant-emotional-evader'));
assert('grief-unexpressed ≠ emotional-evader prompts', promptsDiffer('grief-unexpressed', 'avoidant-emotional-evader'));

// grief-unexpressed versus secret-keeper (cross-parent)
assert('grief-unexpressed ≠ secret-keeper ids', idsDiffer('grief-unexpressed', 'shame-secret-keeper'));
assert('grief-unexpressed ≠ secret-keeper groups', groupsDiffer('grief-unexpressed', 'shame-secret-keeper'));
assert('grief-unexpressed ≠ secret-keeper prompts', promptsDiffer('grief-unexpressed', 'shame-secret-keeper'));

// grief-silent-mourning versus shame-to-disappearance (cross-parent)
assert('silent-mourning ≠ shame-to-disappearance ids', idsDiffer('grief-silent-mourning', 'shame-to-disappearance'));
assert('silent-mourning ≠ shame-to-disappearance groups', groupsDiffer('grief-silent-mourning', 'shame-to-disappearance'));
assert('silent-mourning ≠ shame-to-disappearance prompts', promptsDiffer('grief-silent-mourning', 'shame-to-disappearance'));

// grief-later-emerging versus grief-protective-numbing (different grief groups)
assert('later-emerging ≠ protective-numbing ids', idsDiffer('grief-later-emerging', 'grief-protective-numbing'));
assert('later-emerging ≠ protective-numbing groups', groupsDiffer('grief-later-emerging', 'grief-protective-numbing'));
assert('later-emerging ≠ protective-numbing prompts', promptsDiffer('grief-later-emerging', 'grief-protective-numbing'));

// grief-later-emerging versus grief-unexpressed (same group)
assert('later-emerging ≠ grief-unexpressed ids', idsDiffer('grief-later-emerging', 'grief-unexpressed'));
assert('later-emerging ≠ grief-unexpressed prompts', promptsDiffer('grief-later-emerging', 'grief-unexpressed'));

// grief-specific-loss versus hypervigilant-loss-forecaster (cross-parent)
assert('specific-loss ≠ loss-forecaster ids', idsDiffer('grief-specific-loss', 'hypervigilant-loss-forecaster'));
assert('specific-loss ≠ loss-forecaster groups', groupsDiffer('grief-specific-loss', 'hypervigilant-loss-forecaster'));
assert('specific-loss ≠ loss-forecaster prompts', promptsDiffer('grief-specific-loss', 'hypervigilant-loss-forecaster'));

// grief-specific-loss versus grief-loyalty-to-pain (same group)
assert('specific-loss ≠ loyalty-to-pain ids', idsDiffer('grief-specific-loss', 'grief-loyalty-to-pain'));
assert('specific-loss ≠ loyalty-to-pain prompts', promptsDiffer('grief-specific-loss', 'grief-loyalty-to-pain'));

// grief-specific-loss versus grief-later-emerging (different grief groups)
assert('specific-loss ≠ later-emerging ids', idsDiffer('grief-specific-loss', 'grief-later-emerging'));
assert('specific-loss ≠ later-emerging groups', groupsDiffer('grief-specific-loss', 'grief-later-emerging'));
assert('specific-loss ≠ later-emerging prompts', promptsDiffer('grief-specific-loss', 'grief-later-emerging'));

// grief-loyalty-to-pain versus self-punisher (cross-parent)
assert('loyalty-to-pain ≠ self-punisher ids', idsDiffer('grief-loyalty-to-pain', 'shame-self-punisher'));
assert('loyalty-to-pain ≠ self-punisher groups', groupsDiffer('grief-loyalty-to-pain', 'shame-self-punisher'));
assert('loyalty-to-pain ≠ self-punisher prompts', promptsDiffer('grief-loyalty-to-pain', 'shame-self-punisher'));

// grief-loyalty-to-pain versus avoidant-pleasure-avoider (cross-parent)
assert('loyalty-to-pain ≠ pleasure-avoider ids', idsDiffer('grief-loyalty-to-pain', 'avoidant-pleasure-avoider'));
assert('loyalty-to-pain ≠ pleasure-avoider groups', groupsDiffer('grief-loyalty-to-pain', 'avoidant-pleasure-avoider'));
assert('loyalty-to-pain ≠ pleasure-avoider prompts', promptsDiffer('grief-loyalty-to-pain', 'avoidant-pleasure-avoider'));

// grief-protective-numbing versus avoidant-emotional-evader (cross-parent)
assert('protective-numbing ≠ emotional-evader ids', idsDiffer('grief-protective-numbing', 'avoidant-emotional-evader'));
assert('protective-numbing ≠ emotional-evader groups', groupsDiffer('grief-protective-numbing', 'avoidant-emotional-evader'));
assert('protective-numbing ≠ emotional-evader prompts', promptsDiffer('grief-protective-numbing', 'avoidant-emotional-evader'));

// grief-protective-numbing versus grief-unexpressed (different grief groups)
assert('protective-numbing ≠ grief-unexpressed ids', idsDiffer('grief-protective-numbing', 'grief-unexpressed'));
assert('protective-numbing ≠ grief-unexpressed groups', groupsDiffer('grief-protective-numbing', 'grief-unexpressed'));
assert('protective-numbing ≠ grief-unexpressed prompts', promptsDiffer('grief-protective-numbing', 'grief-unexpressed'));

// grief-protective-numbing versus grief-later-emerging (different grief groups)
assert('protective-numbing ≠ later-emerging ids', idsDiffer('grief-protective-numbing', 'grief-later-emerging'));
assert('protective-numbing ≠ later-emerging groups', groupsDiffer('grief-protective-numbing', 'grief-later-emerging'));
assert('protective-numbing ≠ later-emerging prompts', promptsDiffer('grief-protective-numbing', 'grief-later-emerging'));

// grief-protective-numbing versus avoidant-pleasure-avoider (cross-parent)
assert('protective-numbing ≠ pleasure-avoider ids', idsDiffer('grief-protective-numbing', 'avoidant-pleasure-avoider'));
assert('protective-numbing ≠ pleasure-avoider groups', groupsDiffer('grief-protective-numbing', 'avoidant-pleasure-avoider'));
assert('protective-numbing ≠ pleasure-avoider prompts', promptsDiffer('grief-protective-numbing', 'avoidant-pleasure-avoider'));

/* ==================================================================
 *  Safety validation — Batch 9 prompts
 * ================================================================*/

// Does not diagnose codependency
for (const p of allPrompts) {
  assert('no codependency diagnosis', !p.toLowerCase().includes('codependen'));
}

// Does not diagnose attachment style
for (const p of allPrompts) {
  assert('no attachment diagnosis', !p.toLowerCase().includes('attachment style'));
  assert('no attachment diagnosis', !p.toLowerCase().includes('attachment disorder'));
}

// Does not diagnose depression
for (const p of allPrompts) {
  assert('no depression diagnosis', !p.toLowerCase().includes('depress'));
}

// Does not diagnose dissociation
for (const p of allPrompts) {
  assert('no dissociation diagnosis', !p.toLowerCase().includes('dissociat'));
}

// Does not diagnose prolonged grief
for (const p of allPrompts) {
  assert('no prolonged grief diagnosis', !p.toLowerCase().includes('prolonged grief'));
  assert('no prolonged grief diagnosis', !p.toLowerCase().includes('complicated grief'));
}

// Does not prescribe a grief timeline
for (const p of allPrompts) {
  assert('no grief timeline', !p.toLowerCase().includes('should have moved on'));
  assert('no grief timeline', !p.toLowerCase().includes('time to move on'));
  assert('no grief timeline', !p.toLowerCase().includes('should be over'));
}

// Does not imply grief should end
for (const p of allPrompts) {
  assert('no grief should end', !p.toLowerCase().includes('grief should'));
  assert('no grief should end', !p.toLowerCase().includes('should stop grieving'));
}

// Does not pressure grief disclosure
for (const p of allPrompts) {
  assert('no disclosure pressure', !p.toLowerCase().includes('should share'));
  assert('no disclosure pressure', !p.toLowerCase().includes('should talk about'));
  assert('no disclosure pressure', !p.toLowerCase().includes('should express'));
}

// Does not pressure accepting support
for (const p of allPrompts) {
  assert('no support pressure', !p.toLowerCase().includes('should accept'));
  assert('no support pressure', !p.toLowerCase().includes('should seek help'));
}

// Does not discourage appropriate emergency help
for (const p of allPrompts) {
  assert('no discourage emergency help', !p.toLowerCase().includes('should not seek'));
  assert('no discourage emergency help', !p.toLowerCase().includes('should not call'));
}

// Does not discourage leaving unsafe situations
for (const p of allPrompts) {
  assert('no discourage leaving', !p.toLowerCase().includes('should not leave'));
  assert('no discourage leaving', !p.toLowerCase().includes('should stay'));
}

// Does not encourage surveillance
for (const p of allPrompts) {
  assert('no surveillance', !p.toLowerCase().includes('surveillance'));
  assert('no surveillance', !p.toLowerCase().includes('spy'));
  assert('no surveillance', !p.toLowerCase().includes('keep watch over'));
}

// Does not encourage privacy violations
for (const p of allPrompts) {
  assert('no privacy violations', !p.toLowerCase().includes('password'));
  assert('no privacy violations', !p.toLowerCase().includes('private messages'));
  assert('no privacy violations', !p.toLowerCase().includes('read their'));
}

// Does not accuse the user of controlling another person
for (const p of allPrompts) {
  assert('no accuse control', !p.toLowerCase().includes('controlling'));
  assert('no accuse control', !p.toLowerCase().includes('manipulative'));
  assert('no accuse control', !p.toLowerCase().includes('coercive'));
}

// Does not imply continued grief is a moral failure
{
  const batch9Items = items.filter(i => allCovered.slice(71, 81).includes(i.expressionId));
  for (const p of batch9Items.map(i => i.prompt)) {
    assert('no moral failure', !p.toLowerCase().includes('failure'));
    assert('no moral failure', !p.toLowerCase().includes('wrong to grieve'));
  }
}

// Does not imply healing means forgetting
for (const p of allPrompts) {
  assert('no healing = forgetting', !p.toLowerCase().includes('forget'));
}

// Does not encourage suffering as loyalty
for (const p of allPrompts) {
  assert('no suffering = loyalty', !p.toLowerCase().includes('should suffer'));
  assert('no suffering = loyalty', !p.toLowerCase().includes('must hurt'));
}

// Does not imply numbness is deliberate misconduct
for (const p of allPrompts) {
  assert('no numbness misconduct', !p.toLowerCase().includes('deliberately'));
  assert('no numbness misconduct', !p.toLowerCase().includes('pretending'));
}

// Does not pathologize private mourning
for (const p of allPrompts) {
  assert('no pathologize private mourning', !p.toLowerCase().includes('should not keep'));
  assert('no pathologize private mourning', !p.toLowerCase().includes('unhealthy to mourn'));
}

// Does not pathologize shared identity or closeness
for (const p of allPrompts) {
  assert('no pathologize closeness', !p.toLowerCase().includes('unhealthy closeness'));
  assert('no pathologize closeness', !p.toLowerCase().includes('too close'));
}

// rescuer-01 distinguishes taking over from ordinary requested help
{
  const rs = getExpressionScreeningItems('entangled-rescuer');
  assert('rescuer-01 "have not asked"', rs[0].prompt.includes('they have not asked me to take over'));
}

// mutual-monitor-01 frames frequent updates as a connection belief
{
  const mm = getExpressionScreeningItems('entangled-mutual-monitor');
  assert('mutual-monitor-01 "staying close requires"', mm[0].prompt.includes('staying close requires frequent updates'));
}

// identity-merger-02 is written in first person
{
  const im = getExpressionScreeningItems('entangled-identity-merger');
  assert('identity-merger-02 first person', im[1].prompt.startsWith('I '));
  assert('identity-merger-02 "our closeness"', im[1].prompt.includes('our closeness'));
}

// withdraw-return prompts do not condemn protective withdrawal
{
  const wr = getExpressionScreeningItems('entangled-withdraw-return');
  assert('withdraw-return-01 no condemnation', !wr[0].prompt.toLowerCase().includes('should not pull'));
  assert('withdraw-return-01 describes felt experience', wr[0].prompt.includes('closeness starts to feel emotionally intense'));
  assert('withdraw-return-02 "renewed connection"', wr[1].prompt.includes('renewed connection'));
}

// grief prompts do not prescribe expression or support
{
  const gu = getExpressionScreeningItems('grief-unexpressed');
  const sm = getExpressionScreeningItems('grief-silent-mourning');
  const sl = getExpressionScreeningItems('grief-specific-loss');
  for (const p of [...gu, ...sm, ...sl].map(i => i.prompt)) {
    assert('grief prompt no "should"', !p.toLowerCase().includes('should'));
    assert('grief prompt no "must"', !p.toLowerCase().includes('must'));
  }
}

// loyalty-to-pain-02 does not encourage suffering
{
  const lt = getExpressionScreeningItems('grief-loyalty-to-pain');
  assert('loyalty-to-pain-02 no encouragement', !lt[1].prompt.toLowerCase().includes('should'));
  assert('loyalty-to-pain-02 describes belief', lt[1].prompt.includes('as evidence that the loss still matters'));
}

// protective-numbing-01 describes an observed response rather than deliberate behavior
{
  const pn = getExpressionScreeningItems('grief-protective-numbing');
  assert('protective-numbing-01 "notice myself"', pn[0].prompt.includes('notice myself becoming emotionally numb'));
  assert('protective-numbing-02 no blame', !pn[1].prompt.toLowerCase().includes('wrong'));
  assert('protective-numbing-02 describes limiting', pn[1].prompt.includes('limit contact with reminders'));
}

/* ==================================================================
 *  Distinction validation — Batch 10
 * ================================================================*/

const registryIds = new Set(EXPRESSION_REGISTRY.map(e => e.id));
function inRegistry(eid: string): boolean { return registryIds.has(eid); }

const batch10Expressions = [...batch10];
for (const eid of batch10Expressions) {
  assert(`registry: ${eid}`, inRegistry(eid));
  assert(`ownership: ${eid}`, getExpressionScreeningItems(eid).every(r => r.expressionId === eid));
}

// Same-group pairs — overgiving-depletion (3 pairs)
assert('over-giver ≠ silent-sufferer registry', inRegistry('martyr-over-giver') && inRegistry('martyr-silent-sufferer'));
assert('over-giver ≠ silent-sufferer ids', idsDiffer('martyr-over-giver', 'martyr-silent-sufferer'));
assert('over-giver ≠ silent-sufferer exact prompts', promptsDiffer('martyr-over-giver', 'martyr-silent-sufferer'));

assert('over-giver ≠ refuses-to-receive registry', inRegistry('martyr-over-giver') && inRegistry('martyr-refuses-to-receive'));
assert('over-giver ≠ refuses-to-receive ids', idsDiffer('martyr-over-giver', 'martyr-refuses-to-receive'));
assert('over-giver ≠ refuses-to-receive exact prompts', promptsDiffer('martyr-over-giver', 'martyr-refuses-to-receive'));

assert('silent-sufferer ≠ refuses-to-receive registry', inRegistry('martyr-silent-sufferer') && inRegistry('martyr-refuses-to-receive'));
assert('silent-sufferer ≠ refuses-to-receive ids', idsDiffer('martyr-silent-sufferer', 'martyr-refuses-to-receive'));
assert('silent-sufferer ≠ refuses-to-receive exact prompts', promptsDiffer('martyr-silent-sufferer', 'martyr-refuses-to-receive'));

// Same-group pair — recognition-reciprocity (1 pair)
assert('scorekeeper ≠ guilt-tripper registry', inRegistry('martyr-scorekeeper') && inRegistry('martyr-guilt-tripper'));
assert('scorekeeper ≠ guilt-tripper ids', idsDiffer('martyr-scorekeeper', 'martyr-guilt-tripper'));
assert('scorekeeper ≠ guilt-tripper exact prompts', promptsDiffer('martyr-scorekeeper', 'martyr-guilt-tripper'));

// Same-group pairs — overfunctioning-crisis (10 pairs)
assert('overfunctioning ≠ rescuer-martyr registry', inRegistry('martyr-overfunctioning') && inRegistry('martyr-rescuer-martyr'));
assert('overfunctioning ≠ rescuer-martyr ids', idsDiffer('martyr-overfunctioning', 'martyr-rescuer-martyr'));
assert('overfunctioning ≠ rescuer-martyr exact prompts', promptsDiffer('martyr-overfunctioning', 'martyr-rescuer-martyr'));

assert('overfunctioning ≠ moral-martyr registry', inRegistry('martyr-overfunctioning') && inRegistry('martyr-moral-martyr'));
assert('overfunctioning ≠ moral-martyr ids', idsDiffer('martyr-overfunctioning', 'martyr-moral-martyr'));
assert('overfunctioning ≠ moral-martyr exact prompts', promptsDiffer('martyr-overfunctioning', 'martyr-moral-martyr'));

assert('overfunctioning ≠ crisis-martyr registry', inRegistry('martyr-overfunctioning') && inRegistry('martyr-crisis-martyr'));
assert('overfunctioning ≠ crisis-martyr ids', idsDiffer('martyr-overfunctioning', 'martyr-crisis-martyr'));
assert('overfunctioning ≠ crisis-martyr exact prompts', promptsDiffer('martyr-overfunctioning', 'martyr-crisis-martyr'));

assert('overfunctioning ≠ burnout-blame registry', inRegistry('martyr-overfunctioning') && inRegistry('martyr-burnout-blame'));
assert('overfunctioning ≠ burnout-blame ids', idsDiffer('martyr-overfunctioning', 'martyr-burnout-blame'));
assert('overfunctioning ≠ burnout-blame exact prompts', promptsDiffer('martyr-overfunctioning', 'martyr-burnout-blame'));

assert('rescuer-martyr ≠ moral-martyr registry', inRegistry('martyr-rescuer-martyr') && inRegistry('martyr-moral-martyr'));
assert('rescuer-martyr ≠ moral-martyr ids', idsDiffer('martyr-rescuer-martyr', 'martyr-moral-martyr'));
assert('rescuer-martyr ≠ moral-martyr exact prompts', promptsDiffer('martyr-rescuer-martyr', 'martyr-moral-martyr'));

assert('rescuer-martyr ≠ crisis-martyr registry', inRegistry('martyr-rescuer-martyr') && inRegistry('martyr-crisis-martyr'));
assert('rescuer-martyr ≠ crisis-martyr ids', idsDiffer('martyr-rescuer-martyr', 'martyr-crisis-martyr'));
assert('rescuer-martyr ≠ crisis-martyr exact prompts', promptsDiffer('martyr-rescuer-martyr', 'martyr-crisis-martyr'));

assert('rescuer-martyr ≠ burnout-blame registry', inRegistry('martyr-rescuer-martyr') && inRegistry('martyr-burnout-blame'));
assert('rescuer-martyr ≠ burnout-blame ids', idsDiffer('martyr-rescuer-martyr', 'martyr-burnout-blame'));
assert('rescuer-martyr ≠ burnout-blame exact prompts', promptsDiffer('martyr-rescuer-martyr', 'martyr-burnout-blame'));

assert('moral-martyr ≠ crisis-martyr registry', inRegistry('martyr-moral-martyr') && inRegistry('martyr-crisis-martyr'));
assert('moral-martyr ≠ crisis-martyr ids', idsDiffer('martyr-moral-martyr', 'martyr-crisis-martyr'));
assert('moral-martyr ≠ crisis-martyr exact prompts', promptsDiffer('martyr-moral-martyr', 'martyr-crisis-martyr'));

assert('moral-martyr ≠ burnout-blame registry', inRegistry('martyr-moral-martyr') && inRegistry('martyr-burnout-blame'));
assert('moral-martyr ≠ burnout-blame ids', idsDiffer('martyr-moral-martyr', 'martyr-burnout-blame'));
assert('moral-martyr ≠ burnout-blame exact prompts', promptsDiffer('martyr-moral-martyr', 'martyr-burnout-blame'));

assert('crisis-martyr ≠ burnout-blame registry', inRegistry('martyr-crisis-martyr') && inRegistry('martyr-burnout-blame'));
assert('crisis-martyr ≠ burnout-blame ids', idsDiffer('martyr-crisis-martyr', 'martyr-burnout-blame'));
assert('crisis-martyr ≠ burnout-blame exact prompts', promptsDiffer('martyr-crisis-martyr', 'martyr-burnout-blame'));

// Cross-group pairs within martyr (8 pairs)
assert('over-giver ≠ scorekeeper registry', inRegistry('martyr-over-giver') && inRegistry('martyr-scorekeeper'));
assert('over-giver ≠ scorekeeper ids', idsDiffer('martyr-over-giver', 'martyr-scorekeeper'));
assert('over-giver ≠ scorekeeper groups', groupsDiffer('martyr-over-giver', 'martyr-scorekeeper'));
assert('over-giver ≠ scorekeeper exact prompts', promptsDiffer('martyr-over-giver', 'martyr-scorekeeper'));

assert('silent-sufferer ≠ guilt-tripper registry', inRegistry('martyr-silent-sufferer') && inRegistry('martyr-guilt-tripper'));
assert('silent-sufferer ≠ guilt-tripper ids', idsDiffer('martyr-silent-sufferer', 'martyr-guilt-tripper'));
assert('silent-sufferer ≠ guilt-tripper groups', groupsDiffer('martyr-silent-sufferer', 'martyr-guilt-tripper'));
assert('silent-sufferer ≠ guilt-tripper exact prompts', promptsDiffer('martyr-silent-sufferer', 'martyr-guilt-tripper'));

assert('refuses-to-receive ≠ overfunctioning registry', inRegistry('martyr-refuses-to-receive') && inRegistry('martyr-overfunctioning'));
assert('refuses-to-receive ≠ overfunctioning ids', idsDiffer('martyr-refuses-to-receive', 'martyr-overfunctioning'));
assert('refuses-to-receive ≠ overfunctioning groups', groupsDiffer('martyr-refuses-to-receive', 'martyr-overfunctioning'));
assert('refuses-to-receive ≠ overfunctioning exact prompts', promptsDiffer('martyr-refuses-to-receive', 'martyr-overfunctioning'));

assert('scorekeeper ≠ moral-martyr registry', inRegistry('martyr-scorekeeper') && inRegistry('martyr-moral-martyr'));
assert('scorekeeper ≠ moral-martyr ids', idsDiffer('martyr-scorekeeper', 'martyr-moral-martyr'));
assert('scorekeeper ≠ moral-martyr groups', groupsDiffer('martyr-scorekeeper', 'martyr-moral-martyr'));
assert('scorekeeper ≠ moral-martyr exact prompts', promptsDiffer('martyr-scorekeeper', 'martyr-moral-martyr'));

assert('guilt-tripper ≠ crisis-martyr registry', inRegistry('martyr-guilt-tripper') && inRegistry('martyr-crisis-martyr'));
assert('guilt-tripper ≠ crisis-martyr ids', idsDiffer('martyr-guilt-tripper', 'martyr-crisis-martyr'));
assert('guilt-tripper ≠ crisis-martyr groups', groupsDiffer('martyr-guilt-tripper', 'martyr-crisis-martyr'));
assert('guilt-tripper ≠ crisis-martyr exact prompts', promptsDiffer('martyr-guilt-tripper', 'martyr-crisis-martyr'));

assert('over-giver ≠ overfunctioning registry', inRegistry('martyr-over-giver') && inRegistry('martyr-overfunctioning'));
assert('over-giver ≠ overfunctioning ids', idsDiffer('martyr-over-giver', 'martyr-overfunctioning'));
assert('over-giver ≠ overfunctioning groups', groupsDiffer('martyr-over-giver', 'martyr-overfunctioning'));
assert('over-giver ≠ overfunctioning exact prompts', promptsDiffer('martyr-over-giver', 'martyr-overfunctioning'));

assert('refuses-to-receive ≠ rescuer-martyr registry', inRegistry('martyr-refuses-to-receive') && inRegistry('martyr-rescuer-martyr'));
assert('refuses-to-receive ≠ rescuer-martyr ids', idsDiffer('martyr-refuses-to-receive', 'martyr-rescuer-martyr'));
assert('refuses-to-receive ≠ rescuer-martyr groups', groupsDiffer('martyr-refuses-to-receive', 'martyr-rescuer-martyr'));
assert('refuses-to-receive ≠ rescuer-martyr exact prompts', promptsDiffer('martyr-refuses-to-receive', 'martyr-rescuer-martyr'));

assert('silent-sufferer ≠ burnout-blame registry', inRegistry('martyr-silent-sufferer') && inRegistry('martyr-burnout-blame'));
assert('silent-sufferer ≠ burnout-blame ids', idsDiffer('martyr-silent-sufferer', 'martyr-burnout-blame'));
assert('silent-sufferer ≠ burnout-blame groups', groupsDiffer('martyr-silent-sufferer', 'martyr-burnout-blame'));
assert('silent-sufferer ≠ burnout-blame exact prompts', promptsDiffer('martyr-silent-sufferer', 'martyr-burnout-blame'));

// Cross-parent pairs (7 pairs)
assert('over-giver ≠ entangled-rescuer registry', inRegistry('martyr-over-giver') && inRegistry('entangled-rescuer'));
assert('over-giver ≠ entangled-rescuer ids', idsDiffer('martyr-over-giver', 'entangled-rescuer'));
assert('over-giver ≠ entangled-rescuer groups', groupsDiffer('martyr-over-giver', 'entangled-rescuer'));
assert('over-giver ≠ entangled-rescuer exact prompts', promptsDiffer('martyr-over-giver', 'entangled-rescuer'));

assert('over-giver ≠ people-pleaser registry', inRegistry('martyr-over-giver') && inRegistry('silenced-people-pleaser'));
assert('over-giver ≠ people-pleaser ids', idsDiffer('martyr-over-giver', 'silenced-people-pleaser'));
assert('over-giver ≠ people-pleaser groups', groupsDiffer('martyr-over-giver', 'silenced-people-pleaser'));
assert('over-giver ≠ people-pleaser exact prompts', promptsDiffer('martyr-over-giver', 'silenced-people-pleaser'));

assert('silent-sufferer ≠ shame-to-disappearance registry', inRegistry('martyr-silent-sufferer') && inRegistry('shame-to-disappearance'));
assert('silent-sufferer ≠ shame-to-disappearance ids', idsDiffer('martyr-silent-sufferer', 'shame-to-disappearance'));
assert('silent-sufferer ≠ shame-to-disappearance groups', groupsDiffer('martyr-silent-sufferer', 'shame-to-disappearance'));
assert('silent-sufferer ≠ shame-to-disappearance exact prompts', promptsDiffer('martyr-silent-sufferer', 'shame-to-disappearance'));

assert('scorekeeper ≠ crisis-pair registry', inRegistry('martyr-scorekeeper') && inRegistry('entangled-crisis-pair'));
assert('scorekeeper ≠ crisis-pair ids', idsDiffer('martyr-scorekeeper', 'entangled-crisis-pair'));
assert('scorekeeper ≠ crisis-pair groups', groupsDiffer('martyr-scorekeeper', 'entangled-crisis-pair'));
assert('scorekeeper ≠ crisis-pair exact prompts', promptsDiffer('martyr-scorekeeper', 'entangled-crisis-pair'));

assert('rescuer-martyr ≠ entangled-rescuer registry', inRegistry('martyr-rescuer-martyr') && inRegistry('entangled-rescuer'));
assert('rescuer-martyr ≠ entangled-rescuer ids', idsDiffer('martyr-rescuer-martyr', 'entangled-rescuer'));
assert('rescuer-martyr ≠ entangled-rescuer groups', groupsDiffer('martyr-rescuer-martyr', 'entangled-rescuer'));
assert('rescuer-martyr ≠ entangled-rescuer exact prompts', promptsDiffer('martyr-rescuer-martyr', 'entangled-rescuer'));

assert('crisis-martyr ≠ crisis-pair registry', inRegistry('martyr-crisis-martyr') && inRegistry('entangled-crisis-pair'));
assert('crisis-martyr ≠ crisis-pair ids', idsDiffer('martyr-crisis-martyr', 'entangled-crisis-pair'));
assert('crisis-martyr ≠ crisis-pair groups', groupsDiffer('martyr-crisis-martyr', 'entangled-crisis-pair'));
assert('crisis-martyr ≠ crisis-pair exact prompts', promptsDiffer('martyr-crisis-martyr', 'entangled-crisis-pair'));

assert('moral-martyr ≠ protective-parent registry', inRegistry('martyr-moral-martyr') && inRegistry('hypervigilant-protective-parent'));
assert('moral-martyr ≠ protective-parent ids', idsDiffer('martyr-moral-martyr', 'hypervigilant-protective-parent'));
assert('moral-martyr ≠ protective-parent groups', groupsDiffer('martyr-moral-martyr', 'hypervigilant-protective-parent'));
assert('moral-martyr ≠ protective-parent exact prompts', promptsDiffer('martyr-moral-martyr', 'hypervigilant-protective-parent'));

/* ==================================================================
 *  Safety validation — Batch 10 prompts
 * ================================================================*/

const batch10Items = items.filter(i => batch10.includes(i.expressionId));
const batch10Prompts = batch10Items.map(i => i.prompt);

// Does not diagnose codependency
for (const p of batch10Prompts) {
  assert('no codependency diagnosis', !p.toLowerCase().includes('codependen'));
}

// Does not diagnose personality disorder
for (const p of batch10Prompts) {
  assert('no personality disorder diagnosis', !p.toLowerCase().includes('personality disorder'));
  assert('no personality disorder diagnosis', !p.toLowerCase().includes('borderline'));
}

// Does not accuse the user of manipulation
for (const p of batch10Prompts) {
  assert('no manipulation accusation', !p.toLowerCase().includes('manipulat'));
}

// Does not assume deliberate harmful intent
for (const p of batch10Prompts) {
  assert('no deliberate intent', !p.toLowerCase().includes('deliberately'));
  assert('no deliberate intent', !p.toLowerCase().includes('intentionally'));
}

// Does not discourage emergency intervention
for (const p of batch10Prompts) {
  assert('no discourage emergency intervention', !p.toLowerCase().includes('should not seek'));
  assert('no discourage emergency intervention', !p.toLowerCase().includes('should not call'));
}

// Does not discourage protecting someone in immediate danger
for (const p of batch10Prompts) {
  assert('no discourage protection', !p.toLowerCase().includes('should not protect'));
  assert('no discourage protection', !p.toLowerCase().includes('should not step in'));
}

// Does not pressure accepting help
for (const p of batch10Prompts) {
  assert('no accept-help pressure', !p.toLowerCase().includes('should accept'));
  assert('no accept-help pressure', !p.toLowerCase().includes('must accept'));
}

// Does not imply generosity is unhealthy
for (const p of batch10Prompts) {
  assert('no generosity unhealthy', !p.toLowerCase().includes('unhealthy'));
}

// Does not imply the user alone caused burnout
for (const p of batch10Prompts) {
  assert('no alone-caused burnout', !p.toLowerCase().includes('your fault'));
  assert('no alone-caused burnout', !p.toLowerCase().includes('you caused'));
}

// Does not deny genuine exploitation or unequal labor
for (const p of batch10Prompts) {
  assert('no deny exploitation', !p.toLowerCase().includes('your share is fair'));
  assert('no deny exploitation', !p.toLowerCase().includes('it is fair'));
}

// Does not accuse the user of creating crises
for (const p of batch10Prompts) {
  assert('no crisis creation accusation', !p.toLowerCase().includes('create crises'));
  assert('no crisis creation accusation', !p.toLowerCase().includes('cause the crisis'));
}

// Does not treat resentment as moral failure
for (const p of batch10Prompts) {
  assert('no resentment moral failure', !p.toLowerCase().includes('moral failure'));
  assert('no resentment moral failure', !p.toLowerCase().includes('wrong to resent'));
}

// silent-sufferer-01 contains a reasonably-safe context
{
  const ss = getExpressionScreeningItems('martyr-silent-sufferer');
  assert('silent-sufferer-01 "reasonably safe"', ss[0].prompt.includes('even when doing so would be reasonably safe'));
}

// guilt-tripper-02 contains one influence mechanism only
{
  const gt = getExpressionScreeningItems('martyr-guilt-tripper');
  assert('guilt-tripper-02 "influence"', gt[1].prompt.includes('influence'));
  assert('guilt-tripper-02 one mechanism only', (gt[1].prompt.match(/influence/gi) ?? []).length === 1);
  assert('guilt-tripper-02 no coercion', !gt[1].prompt.toLowerCase().includes('coerc'));
}

// moral-martyr-02 is first-person and measures interpretation
{
  const mm = getExpressionScreeningItems('martyr-moral-martyr');
  assert('moral-martyr-02 first person', mm[1].prompt.startsWith('I '));
  assert('moral-martyr-02 measures interpretation', mm[1].prompt.includes('as less committed than I am'));
}

// burnout-blame-02 measures attribution after overextension without denying unequal labor
{
  const bb = getExpressionScreeningItems('martyr-burnout-blame');
  assert('burnout-blame-02 "After exceeding my limits"', bb[1].prompt.includes('After exceeding my limits'));
  assert('burnout-blame-02 attribution', bb[1].prompt.includes('how others allowed the burden to continue'));
  assert('burnout-blame-02 no denial', !bb[1].prompt.toLowerCase().includes('fair'));
}

// crisis-martyr items do not imply intentional crisis creation
{
  const cm = getExpressionScreeningItems('martyr-crisis-martyr');
  assert('crisis-martyr-01 no create', !cm[0].prompt.toLowerCase().includes('create'));
  assert('crisis-martyr-01 "during crisis"', cm[0].prompt.includes('during crisis'));
  assert('crisis-martyr-02 no create', !cm[1].prompt.toLowerCase().includes('create'));
  assert('crisis-martyr-02 "others are overwhelmed"', cm[1].prompt.includes('others are overwhelmed'));
}

// refuses-to-receive items do not imply every offer should be accepted
{
  const rr = getExpressionScreeningItems('martyr-refuses-to-receive');
  assert('refuses-01 no accept pressure', !rr[0].prompt.toLowerCase().includes('should accept'));
  assert('refuses-01 "available help"', rr[0].prompt.includes('available help'));
  assert('refuses-02 no accept pressure', !rr[1].prompt.toLowerCase().includes('should accept'));
  assert('refuses-02 "more comfortable giving"', rr[1].prompt.includes('more comfortable giving'));
}

// over-giver-02 distinguishes excess from ordinary requested help
{
  const og = getExpressionScreeningItems('martyr-over-giver');
  assert('over-giver-02 "was requested or required"', og[1].prompt.includes('than was requested or required'));
}

// overfunctioning-01 distinguishes taking over from ordinary collaboration
{
  const of = getExpressionScreeningItems('martyr-overfunctioning');
  assert('overfunctioning-02 "could reasonably be shared"', of[1].prompt.includes('could reasonably be shared'));
}

/* ==================================================================
 *  Distinction validation — Batch 11
 * ================================================================*/

const batch11Expressions = [...batch11];
for (const eid of batch11Expressions) {
  assert(`registry: ${eid}`, inRegistry(eid));
  assert(`ownership: ${eid}`, getExpressionScreeningItems(eid).every(r => r.expressionId === eid));
}

// Same-group pairs — intervention-fixing (6 pairs)
assert('fixer ≠ crisis-rescuer registry', inRegistry('rescuer-fixer') && inRegistry('rescuer-crisis-rescuer'));
assert('fixer ≠ crisis-rescuer ids', idsDiffer('rescuer-fixer', 'rescuer-crisis-rescuer'));
assert('fixer ≠ crisis-rescuer exact prompts', promptsDiffer('rescuer-fixer', 'rescuer-crisis-rescuer'));

assert('fixer ≠ advice-giver registry', inRegistry('rescuer-fixer') && inRegistry('rescuer-advice-giver'));
assert('fixer ≠ advice-giver ids', idsDiffer('rescuer-fixer', 'rescuer-advice-giver'));
assert('fixer ≠ advice-giver exact prompts', promptsDiffer('rescuer-fixer', 'rescuer-advice-giver'));

assert('fixer ≠ emotional-paramedic registry', inRegistry('rescuer-fixer') && inRegistry('rescuer-emotional-paramedic'));
assert('fixer ≠ emotional-paramedic ids', idsDiffer('rescuer-fixer', 'rescuer-emotional-paramedic'));
assert('fixer ≠ emotional-paramedic exact prompts', promptsDiffer('rescuer-fixer', 'rescuer-emotional-paramedic'));

assert('crisis-rescuer ≠ advice-giver registry', inRegistry('rescuer-crisis-rescuer') && inRegistry('rescuer-advice-giver'));
assert('crisis-rescuer ≠ advice-giver ids', idsDiffer('rescuer-crisis-rescuer', 'rescuer-advice-giver'));
assert('crisis-rescuer ≠ advice-giver exact prompts', promptsDiffer('rescuer-crisis-rescuer', 'rescuer-advice-giver'));

assert('crisis-rescuer ≠ emotional-paramedic registry', inRegistry('rescuer-crisis-rescuer') && inRegistry('rescuer-emotional-paramedic'));
assert('crisis-rescuer ≠ emotional-paramedic ids', idsDiffer('rescuer-crisis-rescuer', 'rescuer-emotional-paramedic'));
assert('crisis-rescuer ≠ emotional-paramedic exact prompts', promptsDiffer('rescuer-crisis-rescuer', 'rescuer-emotional-paramedic'));

assert('advice-giver ≠ emotional-paramedic registry', inRegistry('rescuer-advice-giver') && inRegistry('rescuer-emotional-paramedic'));
assert('advice-giver ≠ emotional-paramedic ids', idsDiffer('rescuer-advice-giver', 'rescuer-emotional-paramedic'));
assert('advice-giver ≠ emotional-paramedic exact prompts', promptsDiffer('rescuer-advice-giver', 'rescuer-emotional-paramedic'));

// Same-group pairs — consequence-prevention (3 pairs)
assert('consequence-blocker ≠ financial-rescuer registry', inRegistry('rescuer-consequence-blocker') && inRegistry('rescuer-financial-rescuer'));
assert('consequence-blocker ≠ financial-rescuer ids', idsDiffer('rescuer-consequence-blocker', 'rescuer-financial-rescuer'));
assert('consequence-blocker ≠ financial-rescuer exact prompts', promptsDiffer('rescuer-consequence-blocker', 'rescuer-financial-rescuer'));

assert('consequence-blocker ≠ protective-parent registry', inRegistry('rescuer-consequence-blocker') && inRegistry('rescuer-protective-parent'));
assert('consequence-blocker ≠ protective-parent ids', idsDiffer('rescuer-consequence-blocker', 'rescuer-protective-parent'));
assert('consequence-blocker ≠ protective-parent exact prompts', promptsDiffer('rescuer-consequence-blocker', 'rescuer-protective-parent'));

assert('financial-rescuer ≠ protective-parent registry', inRegistry('rescuer-financial-rescuer') && inRegistry('rescuer-protective-parent'));
assert('financial-rescuer ≠ protective-parent ids', idsDiffer('rescuer-financial-rescuer', 'rescuer-protective-parent'));
assert('financial-rescuer ≠ protective-parent exact prompts', promptsDiffer('rescuer-financial-rescuer', 'rescuer-protective-parent'));

// Same-group pairs — indispensable-helper (6 pairs)
assert('indispensable-one ≠ white-knight registry', inRegistry('rescuer-indispensable-one') && inRegistry('rescuer-white-knight'));
assert('indispensable-one ≠ white-knight ids', idsDiffer('rescuer-indispensable-one', 'rescuer-white-knight'));
assert('indispensable-one ≠ white-knight exact prompts', promptsDiffer('rescuer-indispensable-one', 'rescuer-white-knight'));

assert('indispensable-one ≠ professional-helper registry', inRegistry('rescuer-indispensable-one') && inRegistry('rescuer-professional-helper'));
assert('indispensable-one ≠ professional-helper ids', idsDiffer('rescuer-indispensable-one', 'rescuer-professional-helper'));
assert('indispensable-one ≠ professional-helper exact prompts', promptsDiffer('rescuer-indispensable-one', 'rescuer-professional-helper'));

assert('indispensable-one ≠ recovery-manager registry', inRegistry('rescuer-indispensable-one') && inRegistry('rescuer-recovery-manager'));
assert('indispensable-one ≠ recovery-manager ids', idsDiffer('rescuer-indispensable-one', 'rescuer-recovery-manager'));
assert('indispensable-one ≠ recovery-manager exact prompts', promptsDiffer('rescuer-indispensable-one', 'rescuer-recovery-manager'));

assert('white-knight ≠ professional-helper registry', inRegistry('rescuer-white-knight') && inRegistry('rescuer-professional-helper'));
assert('white-knight ≠ professional-helper ids', idsDiffer('rescuer-white-knight', 'rescuer-professional-helper'));
assert('white-knight ≠ professional-helper exact prompts', promptsDiffer('rescuer-white-knight', 'rescuer-professional-helper'));

assert('white-knight ≠ recovery-manager registry', inRegistry('rescuer-white-knight') && inRegistry('rescuer-recovery-manager'));
assert('white-knight ≠ recovery-manager ids', idsDiffer('rescuer-white-knight', 'rescuer-recovery-manager'));
assert('white-knight ≠ recovery-manager exact prompts', promptsDiffer('rescuer-white-knight', 'rescuer-recovery-manager'));

assert('professional-helper ≠ recovery-manager registry', inRegistry('rescuer-professional-helper') && inRegistry('rescuer-recovery-manager'));
assert('professional-helper ≠ recovery-manager ids', idsDiffer('rescuer-professional-helper', 'rescuer-recovery-manager'));
assert('professional-helper ≠ recovery-manager exact prompts', promptsDiffer('rescuer-professional-helper', 'rescuer-recovery-manager'));

// Cross-group pairs within rescuer (10 pairs)
assert('fixer ≠ consequence-blocker registry', inRegistry('rescuer-fixer') && inRegistry('rescuer-consequence-blocker'));
assert('fixer ≠ consequence-blocker ids', idsDiffer('rescuer-fixer', 'rescuer-consequence-blocker'));
assert('fixer ≠ consequence-blocker groups', groupsDiffer('rescuer-fixer', 'rescuer-consequence-blocker'));
assert('fixer ≠ consequence-blocker exact prompts', promptsDiffer('rescuer-fixer', 'rescuer-consequence-blocker'));

assert('crisis-rescuer ≠ consequence-blocker registry', inRegistry('rescuer-crisis-rescuer') && inRegistry('rescuer-consequence-blocker'));
assert('crisis-rescuer ≠ consequence-blocker ids', idsDiffer('rescuer-crisis-rescuer', 'rescuer-consequence-blocker'));
assert('crisis-rescuer ≠ consequence-blocker groups', groupsDiffer('rescuer-crisis-rescuer', 'rescuer-consequence-blocker'));
assert('crisis-rescuer ≠ consequence-blocker exact prompts', promptsDiffer('rescuer-crisis-rescuer', 'rescuer-consequence-blocker'));

assert('advice-giver ≠ financial-rescuer registry', inRegistry('rescuer-advice-giver') && inRegistry('rescuer-financial-rescuer'));
assert('advice-giver ≠ financial-rescuer ids', idsDiffer('rescuer-advice-giver', 'rescuer-financial-rescuer'));
assert('advice-giver ≠ financial-rescuer groups', groupsDiffer('rescuer-advice-giver', 'rescuer-financial-rescuer'));
assert('advice-giver ≠ financial-rescuer exact prompts', promptsDiffer('rescuer-advice-giver', 'rescuer-financial-rescuer'));

assert('emotional-paramedic ≠ protective-parent registry', inRegistry('rescuer-emotional-paramedic') && inRegistry('rescuer-protective-parent'));
assert('emotional-paramedic ≠ protective-parent ids', idsDiffer('rescuer-emotional-paramedic', 'rescuer-protective-parent'));
assert('emotional-paramedic ≠ protective-parent groups', groupsDiffer('rescuer-emotional-paramedic', 'rescuer-protective-parent'));
assert('emotional-paramedic ≠ protective-parent exact prompts', promptsDiffer('rescuer-emotional-paramedic', 'rescuer-protective-parent'));

assert('fixer ≠ indispensable-one registry', inRegistry('rescuer-fixer') && inRegistry('rescuer-indispensable-one'));
assert('fixer ≠ indispensable-one ids', idsDiffer('rescuer-fixer', 'rescuer-indispensable-one'));
assert('fixer ≠ indispensable-one groups', groupsDiffer('rescuer-fixer', 'rescuer-indispensable-one'));
assert('fixer ≠ indispensable-one exact prompts', promptsDiffer('rescuer-fixer', 'rescuer-indispensable-one'));

assert('crisis-rescuer ≠ white-knight registry', inRegistry('rescuer-crisis-rescuer') && inRegistry('rescuer-white-knight'));
assert('crisis-rescuer ≠ white-knight ids', idsDiffer('rescuer-crisis-rescuer', 'rescuer-white-knight'));
assert('crisis-rescuer ≠ white-knight groups', groupsDiffer('rescuer-crisis-rescuer', 'rescuer-white-knight'));
assert('crisis-rescuer ≠ white-knight exact prompts', promptsDiffer('rescuer-crisis-rescuer', 'rescuer-white-knight'));

assert('advice-giver ≠ professional-helper registry', inRegistry('rescuer-advice-giver') && inRegistry('rescuer-professional-helper'));
assert('advice-giver ≠ professional-helper ids', idsDiffer('rescuer-advice-giver', 'rescuer-professional-helper'));
assert('advice-giver ≠ professional-helper groups', groupsDiffer('rescuer-advice-giver', 'rescuer-professional-helper'));
assert('advice-giver ≠ professional-helper exact prompts', promptsDiffer('rescuer-advice-giver', 'rescuer-professional-helper'));

assert('emotional-paramedic ≠ recovery-manager registry', inRegistry('rescuer-emotional-paramedic') && inRegistry('rescuer-recovery-manager'));
assert('emotional-paramedic ≠ recovery-manager ids', idsDiffer('rescuer-emotional-paramedic', 'rescuer-recovery-manager'));
assert('emotional-paramedic ≠ recovery-manager groups', groupsDiffer('rescuer-emotional-paramedic', 'rescuer-recovery-manager'));
assert('emotional-paramedic ≠ recovery-manager exact prompts', promptsDiffer('rescuer-emotional-paramedic', 'rescuer-recovery-manager'));

assert('consequence-blocker ≠ white-knight registry', inRegistry('rescuer-consequence-blocker') && inRegistry('rescuer-white-knight'));
assert('consequence-blocker ≠ white-knight ids', idsDiffer('rescuer-consequence-blocker', 'rescuer-white-knight'));
assert('consequence-blocker ≠ white-knight groups', groupsDiffer('rescuer-consequence-blocker', 'rescuer-white-knight'));
assert('consequence-blocker ≠ white-knight exact prompts', promptsDiffer('rescuer-consequence-blocker', 'rescuer-white-knight'));

assert('protective-parent ≠ recovery-manager registry', inRegistry('rescuer-protective-parent') && inRegistry('rescuer-recovery-manager'));
assert('protective-parent ≠ recovery-manager ids', idsDiffer('rescuer-protective-parent', 'rescuer-recovery-manager'));
assert('protective-parent ≠ recovery-manager groups', groupsDiffer('rescuer-protective-parent', 'rescuer-recovery-manager'));
assert('protective-parent ≠ recovery-manager exact prompts', promptsDiffer('rescuer-protective-parent', 'rescuer-recovery-manager'));

// Cross-parent pairs (8 pairs)
assert('fixer ≠ martyr-overfunctioning registry', inRegistry('rescuer-fixer') && inRegistry('martyr-overfunctioning'));
assert('fixer ≠ martyr-overfunctioning ids', idsDiffer('rescuer-fixer', 'martyr-overfunctioning'));
assert('fixer ≠ martyr-overfunctioning groups', groupsDiffer('rescuer-fixer', 'martyr-overfunctioning'));
assert('fixer ≠ martyr-overfunctioning exact prompts', promptsDiffer('rescuer-fixer', 'martyr-overfunctioning'));

assert('crisis-rescuer ≠ martyr-crisis-martyr registry', inRegistry('rescuer-crisis-rescuer') && inRegistry('martyr-crisis-martyr'));
assert('crisis-rescuer ≠ martyr-crisis-martyr ids', idsDiffer('rescuer-crisis-rescuer', 'martyr-crisis-martyr'));
assert('crisis-rescuer ≠ martyr-crisis-martyr groups', groupsDiffer('rescuer-crisis-rescuer', 'martyr-crisis-martyr'));
assert('crisis-rescuer ≠ martyr-crisis-martyr exact prompts', promptsDiffer('rescuer-crisis-rescuer', 'martyr-crisis-martyr'));

assert('financial-rescuer ≠ martyr-over-giver registry', inRegistry('rescuer-financial-rescuer') && inRegistry('martyr-over-giver'));
assert('financial-rescuer ≠ martyr-over-giver ids', idsDiffer('rescuer-financial-rescuer', 'martyr-over-giver'));
assert('financial-rescuer ≠ martyr-over-giver groups', groupsDiffer('rescuer-financial-rescuer', 'martyr-over-giver'));
assert('financial-rescuer ≠ martyr-over-giver exact prompts', promptsDiffer('rescuer-financial-rescuer', 'martyr-over-giver'));

assert('white-knight ≠ martyr-rescuer-martyr registry', inRegistry('rescuer-white-knight') && inRegistry('martyr-rescuer-martyr'));
assert('white-knight ≠ martyr-rescuer-martyr ids', idsDiffer('rescuer-white-knight', 'martyr-rescuer-martyr'));
assert('white-knight ≠ martyr-rescuer-martyr groups', groupsDiffer('rescuer-white-knight', 'martyr-rescuer-martyr'));
assert('white-knight ≠ martyr-rescuer-martyr exact prompts', promptsDiffer('rescuer-white-knight', 'martyr-rescuer-martyr'));

assert('protective-parent ≠ hypervigilant-protective-parent registry', inRegistry('rescuer-protective-parent') && inRegistry('hypervigilant-protective-parent'));
assert('protective-parent ≠ hypervigilant-protective-parent ids', idsDiffer('rescuer-protective-parent', 'hypervigilant-protective-parent'));
assert('protective-parent ≠ hypervigilant-protective-parent groups', groupsDiffer('rescuer-protective-parent', 'hypervigilant-protective-parent'));
assert('protective-parent ≠ hypervigilant-protective-parent exact prompts', promptsDiffer('rescuer-protective-parent', 'hypervigilant-protective-parent'));

assert('recovery-manager ≠ entangled-mutual-monitor registry', inRegistry('rescuer-recovery-manager') && inRegistry('entangled-mutual-monitor'));
assert('recovery-manager ≠ entangled-mutual-monitor ids', idsDiffer('rescuer-recovery-manager', 'entangled-mutual-monitor'));
assert('recovery-manager ≠ entangled-mutual-monitor groups', groupsDiffer('rescuer-recovery-manager', 'entangled-mutual-monitor'));
assert('recovery-manager ≠ entangled-mutual-monitor exact prompts', promptsDiffer('rescuer-recovery-manager', 'entangled-mutual-monitor'));

assert('advice-giver ≠ controller-standard-enforcer registry', inRegistry('rescuer-advice-giver') && inRegistry('controller-standard-enforcer'));
assert('advice-giver ≠ controller-standard-enforcer ids', idsDiffer('rescuer-advice-giver', 'controller-standard-enforcer'));
assert('advice-giver ≠ controller-standard-enforcer groups', groupsDiffer('rescuer-advice-giver', 'controller-standard-enforcer'));
assert('advice-giver ≠ controller-standard-enforcer exact prompts', promptsDiffer('rescuer-advice-giver', 'controller-standard-enforcer'));

assert('emotional-paramedic ≠ entangled-appeaser registry', inRegistry('rescuer-emotional-paramedic') && inRegistry('entangled-appeaser'));
assert('emotional-paramedic ≠ entangled-appeaser ids', idsDiffer('rescuer-emotional-paramedic', 'entangled-appeaser'));
assert('emotional-paramedic ≠ entangled-appeaser groups', groupsDiffer('rescuer-emotional-paramedic', 'entangled-appeaser'));
assert('emotional-paramedic ≠ entangled-appeaser exact prompts', promptsDiffer('rescuer-emotional-paramedic', 'entangled-appeaser'));

/* ==================================================================
 *  Safety validation — Batch 11 prompts
 * ================================================================*/

const batch11Items = items.filter(i => batch11.includes(i.expressionId));
const batch11Prompts = batch11Items.map(i => i.prompt);

// Does not diagnose codependency
for (const p of batch11Prompts) {
  assert('no codependency diagnosis', !p.toLowerCase().includes('codependen'));
}

// Does not diagnose addiction
for (const p of batch11Prompts) {
  assert('no addiction diagnosis', !p.toLowerCase().includes('addict'));
  assert('no addiction diagnosis', !p.toLowerCase().includes('substance use disorder'));
}

// Does not diagnose mental illness
for (const p of batch11Prompts) {
  assert('no mental illness diagnosis', !p.toLowerCase().includes('mental illness'));
  assert('no mental illness diagnosis', !p.toLowerCase().includes('disorder'));
}

// Does not accuse the user of manipulation
for (const p of batch11Prompts) {
  assert('no manipulation accusation', !p.toLowerCase().includes('manipulat'));
}

// Does not accuse the user of creating dependence
for (const p of batch11Prompts) {
  assert('no create dependence', !p.toLowerCase().includes('create dependence'));
  assert('no create dependence', !p.toLowerCase().includes('make them depend'));
}

// Does not assume malicious intent
for (const p of batch11Prompts) {
  assert('no malicious intent', !p.toLowerCase().includes('deliberately'));
  assert('no malicious intent', !p.toLowerCase().includes('malicious'));
}

// Does not encourage surveillance
for (const p of batch11Prompts) {
  assert('no surveillance', !p.toLowerCase().includes('surveillance'));
  assert('no surveillance', !p.toLowerCase().includes('spy'));
  assert('no surveillance', !p.toLowerCase().includes('keep watch over'));
}

// Does not encourage searching belongings
for (const p of batch11Prompts) {
  assert('no searching belongings', !p.toLowerCase().includes('belongings'));
  assert('no searching belongings', !p.toLowerCase().includes('search their'));
}

// Does not encourage controlling another person's medication
for (const p of batch11Prompts) {
  assert('no medication control', !p.toLowerCase().includes('medication'));
  assert('no medication control', !p.toLowerCase().includes('their meds'));
}

// Does not discourage emergency intervention
for (const p of batch11Prompts) {
  assert('no discourage emergency', !p.toLowerCase().includes('should not seek'));
  assert('no discourage emergency', !p.toLowerCase().includes('should not call'));
}

// Does not discourage protecting someone from immediate danger
for (const p of batch11Prompts) {
  assert('no discourage protection', !p.toLowerCase().includes('should not protect'));
  assert('no discourage protection', !p.toLowerCase().includes('should not step in'));
}

// Does not condemn requested help
for (const p of batch11Prompts) {
  assert('no condemn requested help', !p.toLowerCase().includes('should not ask for help'));
  assert('no condemn requested help', !p.toLowerCase().includes('asking for help is wrong'));
}

// Does not condemn professional expertise
for (const p of batch11Prompts) {
  assert('no condemn expertise', !p.toLowerCase().includes('expertise is unhealthy'));
  assert('no condemn expertise', !p.toLowerCase().includes('should not use your training'));
}

// Does not imply the person receiving help is incapable
for (const p of batch11Prompts) {
  assert('no recipient incapable', !p.toLowerCase().includes('incapable'));
  assert('no recipient incapable', !p.toLowerCase().includes('cannot manage anything'));
}

// Does not imply substance use causes abuse
for (const p of batch11Prompts) {
  assert('no substance = abuse', !p.toLowerCase().includes('substance use causes'));
  assert('no substance = abuse', !p.toLowerCase().includes('drinking causes'));
}

// Does not excuse aggression or harmful conduct
for (const p of batch11Prompts) {
  assert('no excuse harm', !p.toLowerCase().includes('understand why they hurt'));
  assert('no excuse harm', !p.toLowerCase().includes('abuse is understandable'));
}

// Does not imply all financial help is unhealthy
for (const p of batch11Prompts) {
  assert('no all financial help unhealthy', !p.toLowerCase().includes('all financial help'));
  assert('no all financial help unhealthy', !p.toLowerCase().includes('never help financially'));
}

// crisis-rescuer-02 contains one internal response only
{
  const cr = getExpressionScreeningItems('rescuer-crisis-rescuer');
  assert('crisis-rescuer-02 one internal response', (cr[1].prompt.match(/feel|want|need/gi) ?? []).length === 1);
  assert('crisis-rescuer-02 "feel especially useful"', cr[1].prompt.includes('feel especially useful'));
}

// advice-giver-01 distinguishes unsolicited advice from requested advice
{
  const ag = getExpressionScreeningItems('rescuer-advice-giver');
  assert('advice-giver-01 "before finding out whether"', ag[0].prompt.includes('before finding out whether'));
  assert('advice-giver-01 "wants advice"', ag[0].prompt.includes('wants advice'));
}

// financial-rescuer-02 connects personal financial strain to helping
{
  const fr = getExpressionScreeningItems('rescuer-financial-rescuer');
  assert('financial-rescuer-02 "meaningful strain"', fr[1].prompt.includes('places meaningful strain on me'));
}

// protective-parent items refer to a capable person and manageable difficulty
{
  const pp = getExpressionScreeningItems('rescuer-protective-parent');
  assert('protective-parent-01 "capable person"', pp[0].prompt.includes('capable person'));
  assert('protective-parent-01 "manageable difficulty"', pp[0].prompt.includes('manageable difficulty'));
  assert('protective-parent-02 "capable person"', pp[1].prompt.includes('capable person'));
  assert('protective-parent-02 "manageable difficulty"', pp[1].prompt.includes('manageable difficulty'));
}

// protective-parent prompts do not require having children
{
  const pp = getExpressionScreeningItems('rescuer-protective-parent');
  for (const p of pp.map(i => i.prompt)) {
    assert('protective-parent no child wording', !p.toLowerCase().includes('child'));
    assert('protective-parent no child wording', !p.toLowerCase().includes('kid'));
  }
}

// recovery-manager-01 distinguishes taking ownership from ordinary support
{
  const rm = getExpressionScreeningItems('rescuer-recovery-manager');
  assert('recovery-manager-01 "not responsible for managing"', rm[0].prompt.includes('even when I am not responsible for managing it'));
}

// recovery-manager prompts do not encourage surveillance or medication control
{
  const rm = getExpressionScreeningItems('rescuer-recovery-manager');
  for (const p of rm.map(i => i.prompt)) {
    assert('recovery-manager no surveillance', !p.toLowerCase().includes('surveillance'));
    assert('recovery-manager no surveillance', !p.toLowerCase().includes('spy'));
    assert('recovery-manager no medication', !p.toLowerCase().includes('medication'));
  }
  assert('recovery-manager-01 "keep track of whether"', rm[0].prompt.includes('keep track of whether'));
}

// white-knight prompts do not discourage protection from actual abuse or danger
{
  const wk = getExpressionScreeningItems('rescuer-white-knight');
  for (const p of wk.map(i => i.prompt)) {
    assert('white-knight no discourage protection', !p.toLowerCase().includes('should not protect'));
    assert('white-knight no discourage protection', !p.toLowerCase().includes('should not step in'));
  }
  assert('white-knight-01 "feel compelled"', wk[0].prompt.includes('feel compelled'));
  assert('white-knight-02 "I see as vulnerable"', wk[1].prompt.includes('I see as vulnerable'));
}

/* ==================================================================
 *  Distinction validation — Batch 12
 * ================================================================*/

const batch12Expressions = [...batch12];
for (const eid of batch12Expressions) {
  assert(`registry: ${eid}`, inRegistry(eid));
  assert(`ownership: ${eid}`, getExpressionScreeningItems(eid).every(r => r.expressionId === eid));
}

// Same-group pairs — hidden-contract-control (6 pairs)
assert('overfunctioner ≠ hidden-contract-helper registry', inRegistry('rescuer-overfunctioner') && inRegistry('rescuer-hidden-contract-helper'));
assert('overfunctioner ≠ hidden-contract-helper ids', idsDiffer('rescuer-overfunctioner', 'rescuer-hidden-contract-helper'));
assert('overfunctioner ≠ hidden-contract-helper exact prompts', promptsDiffer('rescuer-overfunctioner', 'rescuer-hidden-contract-helper'));

assert('overfunctioner ≠ to-control registry', inRegistry('rescuer-overfunctioner') && inRegistry('rescuer-to-control'));
assert('overfunctioner ≠ to-control ids', idsDiffer('rescuer-overfunctioner', 'rescuer-to-control'));
assert('overfunctioner ≠ to-control exact prompts', promptsDiffer('rescuer-overfunctioner', 'rescuer-to-control'));

assert('overfunctioner ≠ to-martyr registry', inRegistry('rescuer-overfunctioner') && inRegistry('rescuer-to-martyr'));
assert('overfunctioner ≠ to-martyr ids', idsDiffer('rescuer-overfunctioner', 'rescuer-to-martyr'));
assert('overfunctioner ≠ to-martyr exact prompts', promptsDiffer('rescuer-overfunctioner', 'rescuer-to-martyr'));

assert('hidden-contract-helper ≠ to-control registry', inRegistry('rescuer-hidden-contract-helper') && inRegistry('rescuer-to-control'));
assert('hidden-contract-helper ≠ to-control ids', idsDiffer('rescuer-hidden-contract-helper', 'rescuer-to-control'));
assert('hidden-contract-helper ≠ to-control exact prompts', promptsDiffer('rescuer-hidden-contract-helper', 'rescuer-to-control'));

assert('hidden-contract-helper ≠ to-martyr registry', inRegistry('rescuer-hidden-contract-helper') && inRegistry('rescuer-to-martyr'));
assert('hidden-contract-helper ≠ to-martyr ids', idsDiffer('rescuer-hidden-contract-helper', 'rescuer-to-martyr'));
assert('hidden-contract-helper ≠ to-martyr exact prompts', promptsDiffer('rescuer-hidden-contract-helper', 'rescuer-to-martyr'));

assert('to-control ≠ to-martyr registry', inRegistry('rescuer-to-control') && inRegistry('rescuer-to-martyr'));
assert('to-control ≠ to-martyr ids', idsDiffer('rescuer-to-control', 'rescuer-to-martyr'));
assert('to-control ≠ to-martyr exact prompts', promptsDiffer('rescuer-to-control', 'rescuer-to-martyr'));

// Same-group pairs — emotional-care (6 pairs)
assert('emotional-caretaker ≠ peacekeeper registry', inRegistry('over-responsible-emotional-caretaker') && inRegistry('over-responsible-peacekeeper'));
assert('emotional-caretaker ≠ peacekeeper ids', idsDiffer('over-responsible-emotional-caretaker', 'over-responsible-peacekeeper'));
assert('emotional-caretaker ≠ peacekeeper exact prompts', promptsDiffer('over-responsible-emotional-caretaker', 'over-responsible-peacekeeper'));

assert('emotional-caretaker ≠ parentified-one registry', inRegistry('over-responsible-emotional-caretaker') && inRegistry('over-responsible-parentified-one'));
assert('emotional-caretaker ≠ parentified-one ids', idsDiffer('over-responsible-emotional-caretaker', 'over-responsible-parentified-one'));
assert('emotional-caretaker ≠ parentified-one exact prompts', promptsDiffer('over-responsible-emotional-caretaker', 'over-responsible-parentified-one'));

assert('emotional-caretaker ≠ family-stabilizer registry', inRegistry('over-responsible-emotional-caretaker') && inRegistry('over-responsible-family-stabilizer'));
assert('emotional-caretaker ≠ family-stabilizer ids', idsDiffer('over-responsible-emotional-caretaker', 'over-responsible-family-stabilizer'));
assert('emotional-caretaker ≠ family-stabilizer exact prompts', promptsDiffer('over-responsible-emotional-caretaker', 'over-responsible-family-stabilizer'));

assert('peacekeeper ≠ parentified-one registry', inRegistry('over-responsible-peacekeeper') && inRegistry('over-responsible-parentified-one'));
assert('peacekeeper ≠ parentified-one ids', idsDiffer('over-responsible-peacekeeper', 'over-responsible-parentified-one'));
assert('peacekeeper ≠ parentified-one exact prompts', promptsDiffer('over-responsible-peacekeeper', 'over-responsible-parentified-one'));

assert('peacekeeper ≠ family-stabilizer registry', inRegistry('over-responsible-peacekeeper') && inRegistry('over-responsible-family-stabilizer'));
assert('peacekeeper ≠ family-stabilizer ids', idsDiffer('over-responsible-peacekeeper', 'over-responsible-family-stabilizer'));
assert('peacekeeper ≠ family-stabilizer exact prompts', promptsDiffer('over-responsible-peacekeeper', 'over-responsible-family-stabilizer'));

assert('parentified-one ≠ family-stabilizer registry', inRegistry('over-responsible-parentified-one') && inRegistry('over-responsible-family-stabilizer'));
assert('parentified-one ≠ family-stabilizer ids', idsDiffer('over-responsible-parentified-one', 'over-responsible-family-stabilizer'));
assert('parentified-one ≠ family-stabilizer exact prompts', promptsDiffer('over-responsible-parentified-one', 'over-responsible-family-stabilizer'));

// Same-group pairs — guilt-blame (6 pairs)
assert('chronic-apologizer ≠ blame-taker registry', inRegistry('over-responsible-chronic-apologizer') && inRegistry('over-responsible-blame-taker'));
assert('chronic-apologizer ≠ blame-taker ids', idsDiffer('over-responsible-chronic-apologizer', 'over-responsible-blame-taker'));
assert('chronic-apologizer ≠ blame-taker exact prompts', promptsDiffer('over-responsible-chronic-apologizer', 'over-responsible-blame-taker'));

assert('chronic-apologizer ≠ responsibility-sponge registry', inRegistry('over-responsible-chronic-apologizer') && inRegistry('over-responsible-responsibility-sponge'));
assert('chronic-apologizer ≠ responsibility-sponge ids', idsDiffer('over-responsible-chronic-apologizer', 'over-responsible-responsibility-sponge'));
assert('chronic-apologizer ≠ responsibility-sponge exact prompts', promptsDiffer('over-responsible-chronic-apologizer', 'over-responsible-responsibility-sponge'));

assert('chronic-apologizer ≠ consequence-carrier registry', inRegistry('over-responsible-chronic-apologizer') && inRegistry('over-responsible-consequence-carrier'));
assert('chronic-apologizer ≠ consequence-carrier ids', idsDiffer('over-responsible-chronic-apologizer', 'over-responsible-consequence-carrier'));
assert('chronic-apologizer ≠ consequence-carrier exact prompts', promptsDiffer('over-responsible-chronic-apologizer', 'over-responsible-consequence-carrier'));

assert('blame-taker ≠ responsibility-sponge registry', inRegistry('over-responsible-blame-taker') && inRegistry('over-responsible-responsibility-sponge'));
assert('blame-taker ≠ responsibility-sponge ids', idsDiffer('over-responsible-blame-taker', 'over-responsible-responsibility-sponge'));
assert('blame-taker ≠ responsibility-sponge exact prompts', promptsDiffer('over-responsible-blame-taker', 'over-responsible-responsibility-sponge'));

assert('blame-taker ≠ consequence-carrier registry', inRegistry('over-responsible-blame-taker') && inRegistry('over-responsible-consequence-carrier'));
assert('blame-taker ≠ consequence-carrier ids', idsDiffer('over-responsible-blame-taker', 'over-responsible-consequence-carrier'));
assert('blame-taker ≠ consequence-carrier exact prompts', promptsDiffer('over-responsible-blame-taker', 'over-responsible-consequence-carrier'));

assert('responsibility-sponge ≠ consequence-carrier registry', inRegistry('over-responsible-responsibility-sponge') && inRegistry('over-responsible-consequence-carrier'));
assert('responsibility-sponge ≠ consequence-carrier ids', idsDiffer('over-responsible-responsibility-sponge', 'over-responsible-consequence-carrier'));
assert('responsibility-sponge ≠ consequence-carrier exact prompts', promptsDiffer('over-responsible-responsibility-sponge', 'over-responsible-consequence-carrier'));

// Same-group pairs — boundary-rest (3 pairs)
assert('rest-guilty ≠ boundary-guilty registry', inRegistry('over-responsible-rest-guilty') && inRegistry('over-responsible-boundary-guilty'));
assert('rest-guilty ≠ boundary-guilty ids', idsDiffer('over-responsible-rest-guilty', 'over-responsible-boundary-guilty'));
assert('rest-guilty ≠ boundary-guilty exact prompts', promptsDiffer('over-responsible-rest-guilty', 'over-responsible-boundary-guilty'));

assert('rest-guilty ≠ survivor-guilt registry', inRegistry('over-responsible-rest-guilty') && inRegistry('over-responsible-survivor-guilt'));
assert('rest-guilty ≠ survivor-guilt ids', idsDiffer('over-responsible-rest-guilty', 'over-responsible-survivor-guilt'));
assert('rest-guilty ≠ survivor-guilt exact prompts', promptsDiffer('over-responsible-rest-guilty', 'over-responsible-survivor-guilt'));

assert('boundary-guilty ≠ survivor-guilt registry', inRegistry('over-responsible-boundary-guilty') && inRegistry('over-responsible-survivor-guilt'));
assert('boundary-guilty ≠ survivor-guilt ids', idsDiffer('over-responsible-boundary-guilty', 'over-responsible-survivor-guilt'));
assert('boundary-guilty ≠ survivor-guilt exact prompts', promptsDiffer('over-responsible-boundary-guilty', 'over-responsible-survivor-guilt'));

// Cross-group pairs within over-responsible-one (12 pairs)
assert('emotional-caretaker ≠ chronic-apologizer registry', inRegistry('over-responsible-emotional-caretaker') && inRegistry('over-responsible-chronic-apologizer'));
assert('emotional-caretaker ≠ chronic-apologizer ids', idsDiffer('over-responsible-emotional-caretaker', 'over-responsible-chronic-apologizer'));
assert('emotional-caretaker ≠ chronic-apologizer groups', groupsDiffer('over-responsible-emotional-caretaker', 'over-responsible-chronic-apologizer'));
assert('emotional-caretaker ≠ chronic-apologizer exact prompts', promptsDiffer('over-responsible-emotional-caretaker', 'over-responsible-chronic-apologizer'));

assert('emotional-caretaker ≠ rest-guilty registry', inRegistry('over-responsible-emotional-caretaker') && inRegistry('over-responsible-rest-guilty'));
assert('emotional-caretaker ≠ rest-guilty ids', idsDiffer('over-responsible-emotional-caretaker', 'over-responsible-rest-guilty'));
assert('emotional-caretaker ≠ rest-guilty groups', groupsDiffer('over-responsible-emotional-caretaker', 'over-responsible-rest-guilty'));
assert('emotional-caretaker ≠ rest-guilty exact prompts', promptsDiffer('over-responsible-emotional-caretaker', 'over-responsible-rest-guilty'));

assert('peacekeeper ≠ blame-taker registry', inRegistry('over-responsible-peacekeeper') && inRegistry('over-responsible-blame-taker'));
assert('peacekeeper ≠ blame-taker ids', idsDiffer('over-responsible-peacekeeper', 'over-responsible-blame-taker'));
assert('peacekeeper ≠ blame-taker groups', groupsDiffer('over-responsible-peacekeeper', 'over-responsible-blame-taker'));
assert('peacekeeper ≠ blame-taker exact prompts', promptsDiffer('over-responsible-peacekeeper', 'over-responsible-blame-taker'));

assert('peacekeeper ≠ survivor-guilt registry', inRegistry('over-responsible-peacekeeper') && inRegistry('over-responsible-survivor-guilt'));
assert('peacekeeper ≠ survivor-guilt ids', idsDiffer('over-responsible-peacekeeper', 'over-responsible-survivor-guilt'));
assert('peacekeeper ≠ survivor-guilt groups', groupsDiffer('over-responsible-peacekeeper', 'over-responsible-survivor-guilt'));
assert('peacekeeper ≠ survivor-guilt exact prompts', promptsDiffer('over-responsible-peacekeeper', 'over-responsible-survivor-guilt'));

assert('parentified-one ≠ responsibility-sponge registry', inRegistry('over-responsible-parentified-one') && inRegistry('over-responsible-responsibility-sponge'));
assert('parentified-one ≠ responsibility-sponge ids', idsDiffer('over-responsible-parentified-one', 'over-responsible-responsibility-sponge'));
assert('parentified-one ≠ responsibility-sponge groups', groupsDiffer('over-responsible-parentified-one', 'over-responsible-responsibility-sponge'));
assert('parentified-one ≠ responsibility-sponge exact prompts', promptsDiffer('over-responsible-parentified-one', 'over-responsible-responsibility-sponge'));

assert('parentified-one ≠ boundary-guilty registry', inRegistry('over-responsible-parentified-one') && inRegistry('over-responsible-boundary-guilty'));
assert('parentified-one ≠ boundary-guilty ids', idsDiffer('over-responsible-parentified-one', 'over-responsible-boundary-guilty'));
assert('parentified-one ≠ boundary-guilty groups', groupsDiffer('over-responsible-parentified-one', 'over-responsible-boundary-guilty'));
assert('parentified-one ≠ boundary-guilty exact prompts', promptsDiffer('over-responsible-parentified-one', 'over-responsible-boundary-guilty'));

assert('family-stabilizer ≠ consequence-carrier registry', inRegistry('over-responsible-family-stabilizer') && inRegistry('over-responsible-consequence-carrier'));
assert('family-stabilizer ≠ consequence-carrier ids', idsDiffer('over-responsible-family-stabilizer', 'over-responsible-consequence-carrier'));
assert('family-stabilizer ≠ consequence-carrier groups', groupsDiffer('over-responsible-family-stabilizer', 'over-responsible-consequence-carrier'));
assert('family-stabilizer ≠ consequence-carrier exact prompts', promptsDiffer('over-responsible-family-stabilizer', 'over-responsible-consequence-carrier'));

assert('family-stabilizer ≠ rest-guilty registry', inRegistry('over-responsible-family-stabilizer') && inRegistry('over-responsible-rest-guilty'));
assert('family-stabilizer ≠ rest-guilty ids', idsDiffer('over-responsible-family-stabilizer', 'over-responsible-rest-guilty'));
assert('family-stabilizer ≠ rest-guilty groups', groupsDiffer('over-responsible-family-stabilizer', 'over-responsible-rest-guilty'));
assert('family-stabilizer ≠ rest-guilty exact prompts', promptsDiffer('over-responsible-family-stabilizer', 'over-responsible-rest-guilty'));

assert('chronic-apologizer ≠ boundary-guilty registry', inRegistry('over-responsible-chronic-apologizer') && inRegistry('over-responsible-boundary-guilty'));
assert('chronic-apologizer ≠ boundary-guilty ids', idsDiffer('over-responsible-chronic-apologizer', 'over-responsible-boundary-guilty'));
assert('chronic-apologizer ≠ boundary-guilty groups', groupsDiffer('over-responsible-chronic-apologizer', 'over-responsible-boundary-guilty'));
assert('chronic-apologizer ≠ boundary-guilty exact prompts', promptsDiffer('over-responsible-chronic-apologizer', 'over-responsible-boundary-guilty'));

assert('blame-taker ≠ survivor-guilt registry', inRegistry('over-responsible-blame-taker') && inRegistry('over-responsible-survivor-guilt'));
assert('blame-taker ≠ survivor-guilt ids', idsDiffer('over-responsible-blame-taker', 'over-responsible-survivor-guilt'));
assert('blame-taker ≠ survivor-guilt groups', groupsDiffer('over-responsible-blame-taker', 'over-responsible-survivor-guilt'));
assert('blame-taker ≠ survivor-guilt exact prompts', promptsDiffer('over-responsible-blame-taker', 'over-responsible-survivor-guilt'));

assert('responsibility-sponge ≠ rest-guilty registry', inRegistry('over-responsible-responsibility-sponge') && inRegistry('over-responsible-rest-guilty'));
assert('responsibility-sponge ≠ rest-guilty ids', idsDiffer('over-responsible-responsibility-sponge', 'over-responsible-rest-guilty'));
assert('responsibility-sponge ≠ rest-guilty groups', groupsDiffer('over-responsible-responsibility-sponge', 'over-responsible-rest-guilty'));
assert('responsibility-sponge ≠ rest-guilty exact prompts', promptsDiffer('over-responsible-responsibility-sponge', 'over-responsible-rest-guilty'));

assert('consequence-carrier ≠ survivor-guilt registry', inRegistry('over-responsible-consequence-carrier') && inRegistry('over-responsible-survivor-guilt'));
assert('consequence-carrier ≠ survivor-guilt ids', idsDiffer('over-responsible-consequence-carrier', 'over-responsible-survivor-guilt'));
assert('consequence-carrier ≠ survivor-guilt groups', groupsDiffer('over-responsible-consequence-carrier', 'over-responsible-survivor-guilt'));
assert('consequence-carrier ≠ survivor-guilt exact prompts', promptsDiffer('over-responsible-consequence-carrier', 'over-responsible-survivor-guilt'));

// Cross-group pairs within rescuer (5 pairs)
assert('overfunctioner ≠ fixer registry', inRegistry('rescuer-overfunctioner') && inRegistry('rescuer-fixer'));
assert('overfunctioner ≠ fixer ids', idsDiffer('rescuer-overfunctioner', 'rescuer-fixer'));
assert('overfunctioner ≠ fixer groups', groupsDiffer('rescuer-overfunctioner', 'rescuer-fixer'));
assert('overfunctioner ≠ fixer exact prompts', promptsDiffer('rescuer-overfunctioner', 'rescuer-fixer'));

assert('overfunctioner ≠ indispensable-one registry', inRegistry('rescuer-overfunctioner') && inRegistry('rescuer-indispensable-one'));
assert('overfunctioner ≠ indispensable-one ids', idsDiffer('rescuer-overfunctioner', 'rescuer-indispensable-one'));
assert('overfunctioner ≠ indispensable-one groups', groupsDiffer('rescuer-overfunctioner', 'rescuer-indispensable-one'));
assert('overfunctioner ≠ indispensable-one exact prompts', promptsDiffer('rescuer-overfunctioner', 'rescuer-indispensable-one'));

assert('hidden-contract-helper ≠ advice-giver registry', inRegistry('rescuer-hidden-contract-helper') && inRegistry('rescuer-advice-giver'));
assert('hidden-contract-helper ≠ advice-giver ids', idsDiffer('rescuer-hidden-contract-helper', 'rescuer-advice-giver'));
assert('hidden-contract-helper ≠ advice-giver groups', groupsDiffer('rescuer-hidden-contract-helper', 'rescuer-advice-giver'));
assert('hidden-contract-helper ≠ advice-giver exact prompts', promptsDiffer('rescuer-hidden-contract-helper', 'rescuer-advice-giver'));

assert('to-control ≠ protective-parent registry', inRegistry('rescuer-to-control') && inRegistry('rescuer-protective-parent'));
assert('to-control ≠ protective-parent ids', idsDiffer('rescuer-to-control', 'rescuer-protective-parent'));
assert('to-control ≠ protective-parent groups', groupsDiffer('rescuer-to-control', 'rescuer-protective-parent'));
assert('to-control ≠ protective-parent exact prompts', promptsDiffer('rescuer-to-control', 'rescuer-protective-parent'));

assert('to-martyr ≠ white-knight registry', inRegistry('rescuer-to-martyr') && inRegistry('rescuer-white-knight'));
assert('to-martyr ≠ white-knight ids', idsDiffer('rescuer-to-martyr', 'rescuer-white-knight'));
assert('to-martyr ≠ white-knight groups', groupsDiffer('rescuer-to-martyr', 'rescuer-white-knight'));
assert('to-martyr ≠ white-knight exact prompts', promptsDiffer('rescuer-to-martyr', 'rescuer-white-knight'));

// Cross-parent pairs (7 pairs)
assert('overfunctioner ≠ martyr-overfunctioning registry', inRegistry('rescuer-overfunctioner') && inRegistry('martyr-overfunctioning'));
assert('overfunctioner ≠ martyr-overfunctioning ids', idsDiffer('rescuer-overfunctioner', 'martyr-overfunctioning'));
assert('overfunctioner ≠ martyr-overfunctioning groups', groupsDiffer('rescuer-overfunctioner', 'martyr-overfunctioning'));
assert('overfunctioner ≠ martyr-overfunctioning exact prompts', promptsDiffer('rescuer-overfunctioner', 'martyr-overfunctioning'));

assert('to-martyr ≠ martyr-over-giver registry', inRegistry('rescuer-to-martyr') && inRegistry('martyr-over-giver'));
assert('to-martyr ≠ martyr-over-giver ids', idsDiffer('rescuer-to-martyr', 'martyr-over-giver'));
assert('to-martyr ≠ martyr-over-giver groups', groupsDiffer('rescuer-to-martyr', 'martyr-over-giver'));
assert('to-martyr ≠ martyr-over-giver exact prompts', promptsDiffer('rescuer-to-martyr', 'martyr-over-giver'));

assert('emotional-caretaker ≠ entangled-appeaser registry', inRegistry('over-responsible-emotional-caretaker') && inRegistry('entangled-appeaser'));
assert('emotional-caretaker ≠ entangled-appeaser ids', idsDiffer('over-responsible-emotional-caretaker', 'entangled-appeaser'));
assert('emotional-caretaker ≠ entangled-appeaser groups', groupsDiffer('over-responsible-emotional-caretaker', 'entangled-appeaser'));
assert('emotional-caretaker ≠ entangled-appeaser exact prompts', promptsDiffer('over-responsible-emotional-caretaker', 'entangled-appeaser'));

assert('emotional-caretaker ≠ protective-parent registry', inRegistry('over-responsible-emotional-caretaker') && inRegistry('hypervigilant-protective-parent'));
assert('emotional-caretaker ≠ protective-parent ids', idsDiffer('over-responsible-emotional-caretaker', 'hypervigilant-protective-parent'));
assert('emotional-caretaker ≠ protective-parent groups', groupsDiffer('over-responsible-emotional-caretaker', 'hypervigilant-protective-parent'));
assert('emotional-caretaker ≠ protective-parent exact prompts', promptsDiffer('over-responsible-emotional-caretaker', 'hypervigilant-protective-parent'));

assert('peacekeeper ≠ conflict-avoider registry', inRegistry('over-responsible-peacekeeper') && inRegistry('silenced-conflict-avoider'));
assert('peacekeeper ≠ conflict-avoider ids', idsDiffer('over-responsible-peacekeeper', 'silenced-conflict-avoider'));
assert('peacekeeper ≠ conflict-avoider groups', groupsDiffer('over-responsible-peacekeeper', 'silenced-conflict-avoider'));
assert('peacekeeper ≠ conflict-avoider exact prompts', promptsDiffer('over-responsible-peacekeeper', 'silenced-conflict-avoider'));

assert('rest-guilty ≠ pleasure-avoider registry', inRegistry('over-responsible-rest-guilty') && inRegistry('avoidant-pleasure-avoider'));
assert('rest-guilty ≠ pleasure-avoider ids', idsDiffer('over-responsible-rest-guilty', 'avoidant-pleasure-avoider'));
assert('rest-guilty ≠ pleasure-avoider groups', groupsDiffer('over-responsible-rest-guilty', 'avoidant-pleasure-avoider'));
assert('rest-guilty ≠ pleasure-avoider exact prompts', promptsDiffer('over-responsible-rest-guilty', 'avoidant-pleasure-avoider'));

assert('survivor-guilt ≠ loyalty-to-pain registry', inRegistry('over-responsible-survivor-guilt') && inRegistry('grief-loyalty-to-pain'));
assert('survivor-guilt ≠ loyalty-to-pain ids', idsDiffer('over-responsible-survivor-guilt', 'grief-loyalty-to-pain'));
assert('survivor-guilt ≠ loyalty-to-pain groups', groupsDiffer('over-responsible-survivor-guilt', 'grief-loyalty-to-pain'));
assert('survivor-guilt ≠ loyalty-to-pain exact prompts', promptsDiffer('over-responsible-survivor-guilt', 'grief-loyalty-to-pain'));

/* ==================================================================
 *  Distinction validation — Batch 13
 * ================================================================*/

const batch13Expressions = [...batch13];
for (const eid of batch13Expressions) {
  assert(`registry: ${eid}`, inRegistry(eid));
  assert(`ownership: ${eid}`, getExpressionScreeningItems(eid).every(r => r.expressionId === eid));
}

// Same-group pairs — anticipatory-moral (6 pairs)
assert('mind-reader ≠ preventer registry', inRegistry('over-responsible-mind-reader') && inRegistry('over-responsible-preventer'));
assert('mind-reader ≠ preventer ids', idsDiffer('over-responsible-mind-reader', 'over-responsible-preventer'));
assert('mind-reader ≠ preventer exact prompts', promptsDiffer('over-responsible-mind-reader', 'over-responsible-preventer'));

assert('mind-reader ≠ moral-overcorrector registry', inRegistry('over-responsible-mind-reader') && inRegistry('over-responsible-moral-overcorrector'));
assert('mind-reader ≠ moral-overcorrector ids', idsDiffer('over-responsible-mind-reader', 'over-responsible-moral-overcorrector'));
assert('mind-reader ≠ moral-overcorrector exact prompts', promptsDiffer('over-responsible-mind-reader', 'over-responsible-moral-overcorrector'));

assert('mind-reader ≠ confession-seeker registry', inRegistry('over-responsible-mind-reader') && inRegistry('over-responsible-confession-seeker'));
assert('mind-reader ≠ confession-seeker ids', idsDiffer('over-responsible-mind-reader', 'over-responsible-confession-seeker'));
assert('mind-reader ≠ confession-seeker exact prompts', promptsDiffer('over-responsible-mind-reader', 'over-responsible-confession-seeker'));

assert('preventer ≠ moral-overcorrector registry', inRegistry('over-responsible-preventer') && inRegistry('over-responsible-moral-overcorrector'));
assert('preventer ≠ moral-overcorrector ids', idsDiffer('over-responsible-preventer', 'over-responsible-moral-overcorrector'));
assert('preventer ≠ moral-overcorrector exact prompts', promptsDiffer('over-responsible-preventer', 'over-responsible-moral-overcorrector'));

assert('preventer ≠ confession-seeker registry', inRegistry('over-responsible-preventer') && inRegistry('over-responsible-confession-seeker'));
assert('preventer ≠ confession-seeker ids', idsDiffer('over-responsible-preventer', 'over-responsible-confession-seeker'));
assert('preventer ≠ confession-seeker exact prompts', promptsDiffer('over-responsible-preventer', 'over-responsible-confession-seeker'));

assert('moral-overcorrector ≠ confession-seeker registry', inRegistry('over-responsible-moral-overcorrector') && inRegistry('over-responsible-confession-seeker'));
assert('moral-overcorrector ≠ confession-seeker ids', idsDiffer('over-responsible-moral-overcorrector', 'over-responsible-confession-seeker'));
assert('moral-overcorrector ≠ confession-seeker exact prompts', promptsDiffer('over-responsible-moral-overcorrector', 'over-responsible-confession-seeker'));

// Same-group pairs — capacity-backup (3 pairs)
assert('human-backup-system ≠ default-adult registry', inRegistry('overloaded-human-backup-system') && inRegistry('overloaded-default-adult'));
assert('human-backup-system ≠ default-adult ids', idsDiffer('overloaded-human-backup-system', 'overloaded-default-adult'));
assert('human-backup-system ≠ default-adult exact prompts', promptsDiffer('overloaded-human-backup-system', 'overloaded-default-adult'));

assert('human-backup-system ≠ no-backup registry', inRegistry('overloaded-human-backup-system') && inRegistry('overloaded-no-backup'));
assert('human-backup-system ≠ no-backup ids', idsDiffer('overloaded-human-backup-system', 'overloaded-no-backup'));
assert('human-backup-system ≠ no-backup exact prompts', promptsDiffer('overloaded-human-backup-system', 'overloaded-no-backup'));

assert('default-adult ≠ no-backup registry', inRegistry('overloaded-default-adult') && inRegistry('overloaded-no-backup'));
assert('default-adult ≠ no-backup ids', idsDiffer('overloaded-default-adult', 'overloaded-no-backup'));
assert('default-adult ≠ no-backup exact prompts', promptsDiffer('overloaded-default-adult', 'overloaded-no-backup'));

// Same-group pairs — mental-load (3 pairs)
assert('mental-load-carrier ≠ cannot-delegate registry', inRegistry('overloaded-mental-load-carrier') && inRegistry('overloaded-cannot-delegate'));
assert('mental-load-carrier ≠ cannot-delegate ids', idsDiffer('overloaded-mental-load-carrier', 'overloaded-cannot-delegate'));
assert('mental-load-carrier ≠ cannot-delegate exact prompts', promptsDiffer('overloaded-mental-load-carrier', 'overloaded-cannot-delegate'));

assert('mental-load-carrier ≠ competence-trap registry', inRegistry('overloaded-mental-load-carrier') && inRegistry('overloaded-competence-trap'));
assert('mental-load-carrier ≠ competence-trap ids', idsDiffer('overloaded-mental-load-carrier', 'overloaded-competence-trap'));
assert('mental-load-carrier ≠ competence-trap exact prompts', promptsDiffer('overloaded-mental-load-carrier', 'overloaded-competence-trap'));

assert('cannot-delegate ≠ competence-trap registry', inRegistry('overloaded-cannot-delegate') && inRegistry('overloaded-competence-trap'));
assert('cannot-delegate ≠ competence-trap ids', idsDiffer('overloaded-cannot-delegate', 'overloaded-competence-trap'));
assert('cannot-delegate ≠ competence-trap exact prompts', promptsDiffer('overloaded-cannot-delegate', 'overloaded-competence-trap'));

// Same-group pairs — crisis-stop-resume (6 pairs)
assert('crisis-juggler ≠ capacity-denier registry', inRegistry('overloaded-crisis-juggler') && inRegistry('overloaded-capacity-denier'));
assert('crisis-juggler ≠ capacity-denier ids', idsDiffer('overloaded-crisis-juggler', 'overloaded-capacity-denier'));
assert('crisis-juggler ≠ capacity-denier exact prompts', promptsDiffer('overloaded-crisis-juggler', 'overloaded-capacity-denier'));

assert('crisis-juggler ≠ last-minute-preventer registry', inRegistry('overloaded-crisis-juggler') && inRegistry('overloaded-last-minute-preventer'));
assert('crisis-juggler ≠ last-minute-preventer ids', idsDiffer('overloaded-crisis-juggler', 'overloaded-last-minute-preventer'));
assert('crisis-juggler ≠ last-minute-preventer exact prompts', promptsDiffer('overloaded-crisis-juggler', 'overloaded-last-minute-preventer'));

assert('crisis-juggler ≠ stop-then-resume registry', inRegistry('overloaded-crisis-juggler') && inRegistry('overloaded-stop-then-resume'));
assert('crisis-juggler ≠ stop-then-resume ids', idsDiffer('overloaded-crisis-juggler', 'overloaded-stop-then-resume'));
assert('crisis-juggler ≠ stop-then-resume exact prompts', promptsDiffer('overloaded-crisis-juggler', 'overloaded-stop-then-resume'));

assert('capacity-denier ≠ last-minute-preventer registry', inRegistry('overloaded-capacity-denier') && inRegistry('overloaded-last-minute-preventer'));
assert('capacity-denier ≠ last-minute-preventer ids', idsDiffer('overloaded-capacity-denier', 'overloaded-last-minute-preventer'));
assert('capacity-denier ≠ last-minute-preventer exact prompts', promptsDiffer('overloaded-capacity-denier', 'overloaded-last-minute-preventer'));

assert('capacity-denier ≠ stop-then-resume registry', inRegistry('overloaded-capacity-denier') && inRegistry('overloaded-stop-then-resume'));
assert('capacity-denier ≠ stop-then-resume ids', idsDiffer('overloaded-capacity-denier', 'overloaded-stop-then-resume'));
assert('capacity-denier ≠ stop-then-resume exact prompts', promptsDiffer('overloaded-capacity-denier', 'overloaded-stop-then-resume'));

assert('last-minute-preventer ≠ stop-then-resume registry', inRegistry('overloaded-last-minute-preventer') && inRegistry('overloaded-stop-then-resume'));
assert('last-minute-preventer ≠ stop-then-resume ids', idsDiffer('overloaded-last-minute-preventer', 'overloaded-stop-then-resume'));
assert('last-minute-preventer ≠ stop-then-resume exact prompts', promptsDiffer('overloaded-last-minute-preventer', 'overloaded-stop-then-resume'));

// Cross-group pairs within over-responsible-one (4 pairs)
assert('mind-reader ≠ emotional-caretaker registry', inRegistry('over-responsible-mind-reader') && inRegistry('over-responsible-emotional-caretaker'));
assert('mind-reader ≠ emotional-caretaker ids', idsDiffer('over-responsible-mind-reader', 'over-responsible-emotional-caretaker'));
assert('mind-reader ≠ emotional-caretaker groups', groupsDiffer('over-responsible-mind-reader', 'over-responsible-emotional-caretaker'));
assert('mind-reader ≠ emotional-caretaker exact prompts', promptsDiffer('over-responsible-mind-reader', 'over-responsible-emotional-caretaker'));

assert('preventer ≠ chronic-apologizer registry', inRegistry('over-responsible-preventer') && inRegistry('over-responsible-chronic-apologizer'));
assert('preventer ≠ chronic-apologizer ids', idsDiffer('over-responsible-preventer', 'over-responsible-chronic-apologizer'));
assert('preventer ≠ chronic-apologizer groups', groupsDiffer('over-responsible-preventer', 'over-responsible-chronic-apologizer'));
assert('preventer ≠ chronic-apologizer exact prompts', promptsDiffer('over-responsible-preventer', 'over-responsible-chronic-apologizer'));

assert('moral-overcorrector ≠ boundary-guilty registry', inRegistry('over-responsible-moral-overcorrector') && inRegistry('over-responsible-boundary-guilty'));
assert('moral-overcorrector ≠ boundary-guilty ids', idsDiffer('over-responsible-moral-overcorrector', 'over-responsible-boundary-guilty'));
assert('moral-overcorrector ≠ boundary-guilty groups', groupsDiffer('over-responsible-moral-overcorrector', 'over-responsible-boundary-guilty'));
assert('moral-overcorrector ≠ boundary-guilty exact prompts', promptsDiffer('over-responsible-moral-overcorrector', 'over-responsible-boundary-guilty'));

assert('confession-seeker ≠ survivor-guilt registry', inRegistry('over-responsible-confession-seeker') && inRegistry('over-responsible-survivor-guilt'));
assert('confession-seeker ≠ survivor-guilt ids', idsDiffer('over-responsible-confession-seeker', 'over-responsible-survivor-guilt'));
assert('confession-seeker ≠ survivor-guilt groups', groupsDiffer('over-responsible-confession-seeker', 'over-responsible-survivor-guilt'));
assert('confession-seeker ≠ survivor-guilt exact prompts', promptsDiffer('over-responsible-confession-seeker', 'over-responsible-survivor-guilt'));

// Cross-group pairs within overloaded-one (9 pairs)
assert('human-backup-system ≠ mental-load-carrier registry', inRegistry('overloaded-human-backup-system') && inRegistry('overloaded-mental-load-carrier'));
assert('human-backup-system ≠ mental-load-carrier ids', idsDiffer('overloaded-human-backup-system', 'overloaded-mental-load-carrier'));
assert('human-backup-system ≠ mental-load-carrier groups', groupsDiffer('overloaded-human-backup-system', 'overloaded-mental-load-carrier'));
assert('human-backup-system ≠ mental-load-carrier exact prompts', promptsDiffer('overloaded-human-backup-system', 'overloaded-mental-load-carrier'));

assert('default-adult ≠ cannot-delegate registry', inRegistry('overloaded-default-adult') && inRegistry('overloaded-cannot-delegate'));
assert('default-adult ≠ cannot-delegate ids', idsDiffer('overloaded-default-adult', 'overloaded-cannot-delegate'));
assert('default-adult ≠ cannot-delegate groups', groupsDiffer('overloaded-default-adult', 'overloaded-cannot-delegate'));
assert('default-adult ≠ cannot-delegate exact prompts', promptsDiffer('overloaded-default-adult', 'overloaded-cannot-delegate'));

assert('no-backup ≠ competence-trap registry', inRegistry('overloaded-no-backup') && inRegistry('overloaded-competence-trap'));
assert('no-backup ≠ competence-trap ids', idsDiffer('overloaded-no-backup', 'overloaded-competence-trap'));
assert('no-backup ≠ competence-trap groups', groupsDiffer('overloaded-no-backup', 'overloaded-competence-trap'));
assert('no-backup ≠ competence-trap exact prompts', promptsDiffer('overloaded-no-backup', 'overloaded-competence-trap'));

assert('human-backup-system ≠ crisis-juggler registry', inRegistry('overloaded-human-backup-system') && inRegistry('overloaded-crisis-juggler'));
assert('human-backup-system ≠ crisis-juggler ids', idsDiffer('overloaded-human-backup-system', 'overloaded-crisis-juggler'));
assert('human-backup-system ≠ crisis-juggler groups', groupsDiffer('overloaded-human-backup-system', 'overloaded-crisis-juggler'));
assert('human-backup-system ≠ crisis-juggler exact prompts', promptsDiffer('overloaded-human-backup-system', 'overloaded-crisis-juggler'));

assert('default-adult ≠ capacity-denier registry', inRegistry('overloaded-default-adult') && inRegistry('overloaded-capacity-denier'));
assert('default-adult ≠ capacity-denier ids', idsDiffer('overloaded-default-adult', 'overloaded-capacity-denier'));
assert('default-adult ≠ capacity-denier groups', groupsDiffer('overloaded-default-adult', 'overloaded-capacity-denier'));
assert('default-adult ≠ capacity-denier exact prompts', promptsDiffer('overloaded-default-adult', 'overloaded-capacity-denier'));

assert('no-backup ≠ stop-then-resume registry', inRegistry('overloaded-no-backup') && inRegistry('overloaded-stop-then-resume'));
assert('no-backup ≠ stop-then-resume ids', idsDiffer('overloaded-no-backup', 'overloaded-stop-then-resume'));
assert('no-backup ≠ stop-then-resume groups', groupsDiffer('overloaded-no-backup', 'overloaded-stop-then-resume'));
assert('no-backup ≠ stop-then-resume exact prompts', promptsDiffer('overloaded-no-backup', 'overloaded-stop-then-resume'));

assert('mental-load-carrier ≠ last-minute-preventer registry', inRegistry('overloaded-mental-load-carrier') && inRegistry('overloaded-last-minute-preventer'));
assert('mental-load-carrier ≠ last-minute-preventer ids', idsDiffer('overloaded-mental-load-carrier', 'overloaded-last-minute-preventer'));
assert('mental-load-carrier ≠ last-minute-preventer groups', groupsDiffer('overloaded-mental-load-carrier', 'overloaded-last-minute-preventer'));
assert('mental-load-carrier ≠ last-minute-preventer exact prompts', promptsDiffer('overloaded-mental-load-carrier', 'overloaded-last-minute-preventer'));

assert('cannot-delegate ≠ capacity-denier registry', inRegistry('overloaded-cannot-delegate') && inRegistry('overloaded-capacity-denier'));
assert('cannot-delegate ≠ capacity-denier ids', idsDiffer('overloaded-cannot-delegate', 'overloaded-capacity-denier'));
assert('cannot-delegate ≠ capacity-denier groups', groupsDiffer('overloaded-cannot-delegate', 'overloaded-capacity-denier'));
assert('cannot-delegate ≠ capacity-denier exact prompts', promptsDiffer('overloaded-cannot-delegate', 'overloaded-capacity-denier'));

assert('competence-trap ≠ crisis-juggler registry', inRegistry('overloaded-competence-trap') && inRegistry('overloaded-crisis-juggler'));
assert('competence-trap ≠ crisis-juggler ids', idsDiffer('overloaded-competence-trap', 'overloaded-crisis-juggler'));
assert('competence-trap ≠ crisis-juggler groups', groupsDiffer('overloaded-competence-trap', 'overloaded-crisis-juggler'));
assert('competence-trap ≠ crisis-juggler exact prompts', promptsDiffer('overloaded-competence-trap', 'overloaded-crisis-juggler'));

// Cross-parent pairs (11 pairs)
assert('human-backup-system ≠ rescuer-overfunctioner registry', inRegistry('overloaded-human-backup-system') && inRegistry('rescuer-overfunctioner'));
assert('human-backup-system ≠ rescuer-overfunctioner ids', idsDiffer('overloaded-human-backup-system', 'rescuer-overfunctioner'));
assert('human-backup-system ≠ rescuer-overfunctioner groups', groupsDiffer('overloaded-human-backup-system', 'rescuer-overfunctioner'));
assert('human-backup-system ≠ rescuer-overfunctioner exact prompts', promptsDiffer('overloaded-human-backup-system', 'rescuer-overfunctioner'));

assert('human-backup-system ≠ hypervigilant-sleepless-guard registry', inRegistry('overloaded-human-backup-system') && inRegistry('hypervigilant-sleepless-guard'));
assert('human-backup-system ≠ hypervigilant-sleepless-guard ids', idsDiffer('overloaded-human-backup-system', 'hypervigilant-sleepless-guard'));
assert('human-backup-system ≠ hypervigilant-sleepless-guard groups', groupsDiffer('overloaded-human-backup-system', 'hypervigilant-sleepless-guard'));
assert('human-backup-system ≠ hypervigilant-sleepless-guard exact prompts', promptsDiffer('overloaded-human-backup-system', 'hypervigilant-sleepless-guard'));

assert('no-backup ≠ over-responsible-consequence-carrier registry', inRegistry('overloaded-no-backup') && inRegistry('over-responsible-consequence-carrier'));
assert('no-backup ≠ over-responsible-consequence-carrier ids', idsDiffer('overloaded-no-backup', 'over-responsible-consequence-carrier'));
assert('no-backup ≠ over-responsible-consequence-carrier groups', groupsDiffer('overloaded-no-backup', 'over-responsible-consequence-carrier'));
assert('no-backup ≠ over-responsible-consequence-carrier exact prompts', promptsDiffer('overloaded-no-backup', 'over-responsible-consequence-carrier'));

assert('mental-load-carrier ≠ over-responsible-emotional-caretaker registry', inRegistry('overloaded-mental-load-carrier') && inRegistry('over-responsible-emotional-caretaker'));
assert('mental-load-carrier ≠ over-responsible-emotional-caretaker ids', idsDiffer('overloaded-mental-load-carrier', 'over-responsible-emotional-caretaker'));
assert('mental-load-carrier ≠ over-responsible-emotional-caretaker groups', groupsDiffer('overloaded-mental-load-carrier', 'over-responsible-emotional-caretaker'));
assert('mental-load-carrier ≠ over-responsible-emotional-caretaker exact prompts', promptsDiffer('overloaded-mental-load-carrier', 'over-responsible-emotional-caretaker'));

assert('cannot-delegate ≠ rescuer-fixer registry', inRegistry('overloaded-cannot-delegate') && inRegistry('rescuer-fixer'));
assert('cannot-delegate ≠ rescuer-fixer ids', idsDiffer('overloaded-cannot-delegate', 'rescuer-fixer'));
assert('cannot-delegate ≠ rescuer-fixer groups', groupsDiffer('overloaded-cannot-delegate', 'rescuer-fixer'));
assert('cannot-delegate ≠ rescuer-fixer exact prompts', promptsDiffer('overloaded-cannot-delegate', 'rescuer-fixer'));

assert('competence-trap ≠ martyr-overfunctioning registry', inRegistry('overloaded-competence-trap') && inRegistry('martyr-overfunctioning'));
assert('competence-trap ≠ martyr-overfunctioning ids', idsDiffer('overloaded-competence-trap', 'martyr-overfunctioning'));
assert('competence-trap ≠ martyr-overfunctioning groups', groupsDiffer('overloaded-competence-trap', 'martyr-overfunctioning'));
assert('competence-trap ≠ martyr-overfunctioning exact prompts', promptsDiffer('overloaded-competence-trap', 'martyr-overfunctioning'));

assert('crisis-juggler ≠ hypervigilant-threat-forecaster registry', inRegistry('overloaded-crisis-juggler') && inRegistry('hypervigilant-threat-forecaster'));
assert('crisis-juggler ≠ hypervigilant-threat-forecaster ids', idsDiffer('overloaded-crisis-juggler', 'hypervigilant-threat-forecaster'));
assert('crisis-juggler ≠ hypervigilant-threat-forecaster groups', groupsDiffer('overloaded-crisis-juggler', 'hypervigilant-threat-forecaster'));
assert('crisis-juggler ≠ hypervigilant-threat-forecaster exact prompts', promptsDiffer('overloaded-crisis-juggler', 'hypervigilant-threat-forecaster'));

assert('capacity-denier ≠ martyr-over-giver registry', inRegistry('overloaded-capacity-denier') && inRegistry('martyr-over-giver'));
assert('capacity-denier ≠ martyr-over-giver ids', idsDiffer('overloaded-capacity-denier', 'martyr-over-giver'));
assert('capacity-denier ≠ martyr-over-giver groups', groupsDiffer('overloaded-capacity-denier', 'martyr-over-giver'));
assert('capacity-denier ≠ martyr-over-giver exact prompts', promptsDiffer('overloaded-capacity-denier', 'martyr-over-giver'));

assert('last-minute-preventer ≠ rescuer-indispensable-one registry', inRegistry('overloaded-last-minute-preventer') && inRegistry('rescuer-indispensable-one'));
assert('last-minute-preventer ≠ rescuer-indispensable-one ids', idsDiffer('overloaded-last-minute-preventer', 'rescuer-indispensable-one'));
assert('last-minute-preventer ≠ rescuer-indispensable-one groups', groupsDiffer('overloaded-last-minute-preventer', 'rescuer-indispensable-one'));
assert('last-minute-preventer ≠ rescuer-indispensable-one exact prompts', promptsDiffer('overloaded-last-minute-preventer', 'rescuer-indispensable-one'));

assert('stop-then-resume ≠ avoidant-commitment-dodger registry', inRegistry('overloaded-stop-then-resume') && inRegistry('avoidant-commitment-dodger'));
assert('stop-then-resume ≠ avoidant-commitment-dodger ids', idsDiffer('overloaded-stop-then-resume', 'avoidant-commitment-dodger'));
assert('stop-then-resume ≠ avoidant-commitment-dodger groups', groupsDiffer('overloaded-stop-then-resume', 'avoidant-commitment-dodger'));
assert('stop-then-resume ≠ avoidant-commitment-dodger exact prompts', promptsDiffer('overloaded-stop-then-resume', 'avoidant-commitment-dodger'));

assert('preventer ≠ hypervigilant-conflict-predictor registry', inRegistry('over-responsible-preventer') && inRegistry('hypervigilant-conflict-predictor'));
assert('preventer ≠ hypervigilant-conflict-predictor ids', idsDiffer('over-responsible-preventer', 'hypervigilant-conflict-predictor'));
assert('preventer ≠ hypervigilant-conflict-predictor groups', groupsDiffer('over-responsible-preventer', 'hypervigilant-conflict-predictor'));
assert('preventer ≠ hypervigilant-conflict-predictor exact prompts', promptsDiffer('over-responsible-preventer', 'hypervigilant-conflict-predictor'));

/* ==================================================================
 *  Distinction validation — Batch 14
 * ================================================================*/

const batch14Expressions = [...batch14];
for (const eid of batch14Expressions) {
  assert(`registry: ${eid}`, inRegistry(eid));
  assert(`ownership: ${eid}`, getExpressionScreeningItems(eid).every(r => r.expressionId === eid));
}

// Same-group pairs — standards-evaluation (3 pairs)
assert('endless-reviser ≠ moving-goalpost registry', inRegistry('perfectionist-endless-reviser') && inRegistry('perfectionist-moving-goalpost'));
assert('endless-reviser ≠ moving-goalpost ids', idsDiffer('perfectionist-endless-reviser', 'perfectionist-moving-goalpost'));
assert('endless-reviser ≠ moving-goalpost exact prompts', promptsDiffer('perfectionist-endless-reviser', 'perfectionist-moving-goalpost'));

assert('endless-reviser ≠ all-or-nothing-evaluator registry', inRegistry('perfectionist-endless-reviser') && inRegistry('perfectionist-all-or-nothing-evaluator'));
assert('endless-reviser ≠ all-or-nothing-evaluator ids', idsDiffer('perfectionist-endless-reviser', 'perfectionist-all-or-nothing-evaluator'));
assert('endless-reviser ≠ all-or-nothing-evaluator exact prompts', promptsDiffer('perfectionist-endless-reviser', 'perfectionist-all-or-nothing-evaluator'));

assert('moving-goalpost ≠ all-or-nothing-evaluator registry', inRegistry('perfectionist-moving-goalpost') && inRegistry('perfectionist-all-or-nothing-evaluator'));
assert('moving-goalpost ≠ all-or-nothing-evaluator ids', idsDiffer('perfectionist-moving-goalpost', 'perfectionist-all-or-nothing-evaluator'));
assert('moving-goalpost ≠ all-or-nothing-evaluator exact prompts', promptsDiffer('perfectionist-moving-goalpost', 'perfectionist-all-or-nothing-evaluator'));

// Same-group pairs — performance-exposure (1 pair)
assert('beginner-avoider ≠ performance-curator registry', inRegistry('perfectionist-beginner-avoider') && inRegistry('perfectionist-performance-curator'));
assert('beginner-avoider ≠ performance-curator ids', idsDiffer('perfectionist-beginner-avoider', 'perfectionist-performance-curator'));
assert('beginner-avoider ≠ performance-curator exact prompts', promptsDiffer('perfectionist-beginner-avoider', 'perfectionist-performance-curator'));

// Same-group pairs — explosive-contempt (3 pairs)
assert('explosive-shield ≠ contempt-shield registry', inRegistry('anger-explosive-shield') && inRegistry('anger-contempt-shield'));
assert('explosive-shield ≠ contempt-shield ids', idsDiffer('anger-explosive-shield', 'anger-contempt-shield'));
assert('explosive-shield ≠ contempt-shield exact prompts', promptsDiffer('anger-explosive-shield', 'anger-contempt-shield'));

assert('explosive-shield ≠ intimidator registry', inRegistry('anger-explosive-shield') && inRegistry('anger-intimidator'));
assert('explosive-shield ≠ intimidator ids', idsDiffer('anger-explosive-shield', 'anger-intimidator'));
assert('explosive-shield ≠ intimidator exact prompts', promptsDiffer('anger-explosive-shield', 'anger-intimidator'));

assert('contempt-shield ≠ intimidator registry', inRegistry('anger-contempt-shield') && inRegistry('anger-intimidator'));
assert('contempt-shield ≠ intimidator ids', idsDiffer('anger-contempt-shield', 'anger-intimidator'));
assert('contempt-shield ≠ intimidator exact prompts', promptsDiffer('anger-contempt-shield', 'anger-intimidator'));

// Same-group pairs — cold-defensive (6 pairs)
assert('cold-shield ≠ defensive-debater registry', inRegistry('anger-cold-shield') && inRegistry('anger-defensive-debater'));
assert('cold-shield ≠ defensive-debater ids', idsDiffer('anger-cold-shield', 'anger-defensive-debater'));
assert('cold-shield ≠ defensive-debater exact prompts', promptsDiffer('anger-cold-shield', 'anger-defensive-debater'));

assert('cold-shield ≠ passive-aggressive-shield registry', inRegistry('anger-cold-shield') && inRegistry('anger-passive-aggressive-shield'));
assert('cold-shield ≠ passive-aggressive-shield ids', idsDiffer('anger-cold-shield', 'anger-passive-aggressive-shield'));
assert('cold-shield ≠ passive-aggressive-shield exact prompts', promptsDiffer('anger-cold-shield', 'anger-passive-aggressive-shield'));

assert('cold-shield ≠ grievance-keeper registry', inRegistry('anger-cold-shield') && inRegistry('anger-grievance-keeper'));
assert('cold-shield ≠ grievance-keeper ids', idsDiffer('anger-cold-shield', 'anger-grievance-keeper'));
assert('cold-shield ≠ grievance-keeper exact prompts', promptsDiffer('anger-cold-shield', 'anger-grievance-keeper'));

assert('defensive-debater ≠ passive-aggressive-shield registry', inRegistry('anger-defensive-debater') && inRegistry('anger-passive-aggressive-shield'));
assert('defensive-debater ≠ passive-aggressive-shield ids', idsDiffer('anger-defensive-debater', 'anger-passive-aggressive-shield'));
assert('defensive-debater ≠ passive-aggressive-shield exact prompts', promptsDiffer('anger-defensive-debater', 'anger-passive-aggressive-shield'));

assert('defensive-debater ≠ grievance-keeper registry', inRegistry('anger-defensive-debater') && inRegistry('anger-grievance-keeper'));
assert('defensive-debater ≠ grievance-keeper ids', idsDiffer('anger-defensive-debater', 'anger-grievance-keeper'));
assert('defensive-debater ≠ grievance-keeper exact prompts', promptsDiffer('anger-defensive-debater', 'anger-grievance-keeper'));

assert('passive-aggressive-shield ≠ grievance-keeper registry', inRegistry('anger-passive-aggressive-shield') && inRegistry('anger-grievance-keeper'));
assert('passive-aggressive-shield ≠ grievance-keeper ids', idsDiffer('anger-passive-aggressive-shield', 'anger-grievance-keeper'));
assert('passive-aggressive-shield ≠ grievance-keeper exact prompts', promptsDiffer('anger-passive-aggressive-shield', 'anger-grievance-keeper'));

// Same-group pairs — righteous-cycle (1 pair)
assert('righteous-avenger ≠ apology-cycle registry', inRegistry('anger-righteous-avenger') && inRegistry('anger-apology-cycle'));
assert('righteous-avenger ≠ apology-cycle ids', idsDiffer('anger-righteous-avenger', 'anger-apology-cycle'));
assert('righteous-avenger ≠ apology-cycle exact prompts', promptsDiffer('anger-righteous-avenger', 'anger-apology-cycle'));

// Cross-group pairs within perfectionist (2 pairs)
assert('endless-reviser ≠ beginner-avoider registry', inRegistry('perfectionist-endless-reviser') && inRegistry('perfectionist-beginner-avoider'));
assert('endless-reviser ≠ beginner-avoider ids', idsDiffer('perfectionist-endless-reviser', 'perfectionist-beginner-avoider'));
assert('endless-reviser ≠ beginner-avoider groups', groupsDiffer('perfectionist-endless-reviser', 'perfectionist-beginner-avoider'));
assert('endless-reviser ≠ beginner-avoider exact prompts', promptsDiffer('perfectionist-endless-reviser', 'perfectionist-beginner-avoider'));

assert('all-or-nothing-evaluator ≠ performance-curator registry', inRegistry('perfectionist-all-or-nothing-evaluator') && inRegistry('perfectionist-performance-curator'));
assert('all-or-nothing-evaluator ≠ performance-curator ids', idsDiffer('perfectionist-all-or-nothing-evaluator', 'perfectionist-performance-curator'));
assert('all-or-nothing-evaluator ≠ performance-curator groups', groupsDiffer('perfectionist-all-or-nothing-evaluator', 'perfectionist-performance-curator'));
assert('all-or-nothing-evaluator ≠ performance-curator exact prompts', promptsDiffer('perfectionist-all-or-nothing-evaluator', 'perfectionist-performance-curator'));

// Cross-group pairs within anger-shield (12 pairs)
assert('explosive-shield ≠ cold-shield registry', inRegistry('anger-explosive-shield') && inRegistry('anger-cold-shield'));
assert('explosive-shield ≠ cold-shield ids', idsDiffer('anger-explosive-shield', 'anger-cold-shield'));
assert('explosive-shield ≠ cold-shield groups', groupsDiffer('anger-explosive-shield', 'anger-cold-shield'));
assert('explosive-shield ≠ cold-shield exact prompts', promptsDiffer('anger-explosive-shield', 'anger-cold-shield'));

assert('explosive-shield ≠ defensive-debater registry', inRegistry('anger-explosive-shield') && inRegistry('anger-defensive-debater'));
assert('explosive-shield ≠ defensive-debater ids', idsDiffer('anger-explosive-shield', 'anger-defensive-debater'));
assert('explosive-shield ≠ defensive-debater groups', groupsDiffer('anger-explosive-shield', 'anger-defensive-debater'));
assert('explosive-shield ≠ defensive-debater exact prompts', promptsDiffer('anger-explosive-shield', 'anger-defensive-debater'));

assert('explosive-shield ≠ passive-aggressive-shield registry', inRegistry('anger-explosive-shield') && inRegistry('anger-passive-aggressive-shield'));
assert('explosive-shield ≠ passive-aggressive-shield ids', idsDiffer('anger-explosive-shield', 'anger-passive-aggressive-shield'));
assert('explosive-shield ≠ passive-aggressive-shield groups', groupsDiffer('anger-explosive-shield', 'anger-passive-aggressive-shield'));
assert('explosive-shield ≠ passive-aggressive-shield exact prompts', promptsDiffer('anger-explosive-shield', 'anger-passive-aggressive-shield'));

assert('explosive-shield ≠ grievance-keeper registry', inRegistry('anger-explosive-shield') && inRegistry('anger-grievance-keeper'));
assert('explosive-shield ≠ grievance-keeper ids', idsDiffer('anger-explosive-shield', 'anger-grievance-keeper'));
assert('explosive-shield ≠ grievance-keeper groups', groupsDiffer('anger-explosive-shield', 'anger-grievance-keeper'));
assert('explosive-shield ≠ grievance-keeper exact prompts', promptsDiffer('anger-explosive-shield', 'anger-grievance-keeper'));

assert('explosive-shield ≠ righteous-avenger registry', inRegistry('anger-explosive-shield') && inRegistry('anger-righteous-avenger'));
assert('explosive-shield ≠ righteous-avenger ids', idsDiffer('anger-explosive-shield', 'anger-righteous-avenger'));
assert('explosive-shield ≠ righteous-avenger groups', groupsDiffer('anger-explosive-shield', 'anger-righteous-avenger'));
assert('explosive-shield ≠ righteous-avenger exact prompts', promptsDiffer('anger-explosive-shield', 'anger-righteous-avenger'));

assert('explosive-shield ≠ apology-cycle registry', inRegistry('anger-explosive-shield') && inRegistry('anger-apology-cycle'));
assert('explosive-shield ≠ apology-cycle ids', idsDiffer('anger-explosive-shield', 'anger-apology-cycle'));
assert('explosive-shield ≠ apology-cycle groups', groupsDiffer('anger-explosive-shield', 'anger-apology-cycle'));
assert('explosive-shield ≠ apology-cycle exact prompts', promptsDiffer('anger-explosive-shield', 'anger-apology-cycle'));

assert('contempt-shield ≠ cold-shield registry', inRegistry('anger-contempt-shield') && inRegistry('anger-cold-shield'));
assert('contempt-shield ≠ cold-shield ids', idsDiffer('anger-contempt-shield', 'anger-cold-shield'));
assert('contempt-shield ≠ cold-shield groups', groupsDiffer('anger-contempt-shield', 'anger-cold-shield'));
assert('contempt-shield ≠ cold-shield exact prompts', promptsDiffer('anger-contempt-shield', 'anger-cold-shield'));

assert('contempt-shield ≠ grievance-keeper registry', inRegistry('anger-contempt-shield') && inRegistry('anger-grievance-keeper'));
assert('contempt-shield ≠ grievance-keeper ids', idsDiffer('anger-contempt-shield', 'anger-grievance-keeper'));
assert('contempt-shield ≠ grievance-keeper groups', groupsDiffer('anger-contempt-shield', 'anger-grievance-keeper'));
assert('contempt-shield ≠ grievance-keeper exact prompts', promptsDiffer('anger-contempt-shield', 'anger-grievance-keeper'));

assert('intimidator ≠ cold-shield registry', inRegistry('anger-intimidator') && inRegistry('anger-cold-shield'));
assert('intimidator ≠ cold-shield ids', idsDiffer('anger-intimidator', 'anger-cold-shield'));
assert('intimidator ≠ cold-shield groups', groupsDiffer('anger-intimidator', 'anger-cold-shield'));
assert('intimidator ≠ cold-shield exact prompts', promptsDiffer('anger-intimidator', 'anger-cold-shield'));

assert('intimidator ≠ defensive-debater registry', inRegistry('anger-intimidator') && inRegistry('anger-defensive-debater'));
assert('intimidator ≠ defensive-debater ids', idsDiffer('anger-intimidator', 'anger-defensive-debater'));
assert('intimidator ≠ defensive-debater groups', groupsDiffer('anger-intimidator', 'anger-defensive-debater'));
assert('intimidator ≠ defensive-debater exact prompts', promptsDiffer('anger-intimidator', 'anger-defensive-debater'));

assert('intimidator ≠ passive-aggressive-shield registry', inRegistry('anger-intimidator') && inRegistry('anger-passive-aggressive-shield'));
assert('intimidator ≠ passive-aggressive-shield ids', idsDiffer('anger-intimidator', 'anger-passive-aggressive-shield'));
assert('intimidator ≠ passive-aggressive-shield groups', groupsDiffer('anger-intimidator', 'anger-passive-aggressive-shield'));
assert('intimidator ≠ passive-aggressive-shield exact prompts', promptsDiffer('anger-intimidator', 'anger-passive-aggressive-shield'));

assert('intimidator ≠ righteous-avenger registry', inRegistry('anger-intimidator') && inRegistry('anger-righteous-avenger'));
assert('intimidator ≠ righteous-avenger ids', idsDiffer('anger-intimidator', 'anger-righteous-avenger'));
assert('intimidator ≠ righteous-avenger groups', groupsDiffer('anger-intimidator', 'anger-righteous-avenger'));
assert('intimidator ≠ righteous-avenger exact prompts', promptsDiffer('anger-intimidator', 'anger-righteous-avenger'));

assert('cold-shield ≠ righteous-avenger registry', inRegistry('anger-cold-shield') && inRegistry('anger-righteous-avenger'));
assert('cold-shield ≠ righteous-avenger ids', idsDiffer('anger-cold-shield', 'anger-righteous-avenger'));
assert('cold-shield ≠ righteous-avenger groups', groupsDiffer('anger-cold-shield', 'anger-righteous-avenger'));
assert('cold-shield ≠ righteous-avenger exact prompts', promptsDiffer('anger-cold-shield', 'anger-righteous-avenger'));

assert('defensive-debater ≠ righteous-avenger registry', inRegistry('anger-defensive-debater') && inRegistry('anger-righteous-avenger'));
assert('defensive-debater ≠ righteous-avenger ids', idsDiffer('anger-defensive-debater', 'anger-righteous-avenger'));
assert('defensive-debater ≠ righteous-avenger groups', groupsDiffer('anger-defensive-debater', 'anger-righteous-avenger'));
assert('defensive-debater ≠ righteous-avenger exact prompts', promptsDiffer('anger-defensive-debater', 'anger-righteous-avenger'));

assert('passive-aggressive-shield ≠ righteous-avenger registry', inRegistry('anger-passive-aggressive-shield') && inRegistry('anger-righteous-avenger'));
assert('passive-aggressive-shield ≠ righteous-avenger ids', idsDiffer('anger-passive-aggressive-shield', 'anger-righteous-avenger'));
assert('passive-aggressive-shield ≠ righteous-avenger groups', groupsDiffer('anger-passive-aggressive-shield', 'anger-righteous-avenger'));
assert('passive-aggressive-shield ≠ righteous-avenger exact prompts', promptsDiffer('anger-passive-aggressive-shield', 'anger-righteous-avenger'));

assert('grievance-keeper ≠ apology-cycle registry', inRegistry('anger-grievance-keeper') && inRegistry('anger-apology-cycle'));
assert('grievance-keeper ≠ apology-cycle ids', idsDiffer('anger-grievance-keeper', 'anger-apology-cycle'));
assert('grievance-keeper ≠ apology-cycle groups', groupsDiffer('anger-grievance-keeper', 'anger-apology-cycle'));
assert('grievance-keeper ≠ apology-cycle exact prompts', promptsDiffer('anger-grievance-keeper', 'anger-apology-cycle'));

// Cross-parent pairs (14 pairs)
assert('endless-reviser ≠ controller-constant-evaluator registry', inRegistry('perfectionist-endless-reviser') && inRegistry('controller-constant-evaluator'));
assert('endless-reviser ≠ controller-constant-evaluator ids', idsDiffer('perfectionist-endless-reviser', 'controller-constant-evaluator'));
assert('endless-reviser ≠ controller-constant-evaluator groups', groupsDiffer('perfectionist-endless-reviser', 'controller-constant-evaluator'));
assert('endless-reviser ≠ controller-constant-evaluator exact prompts', promptsDiffer('perfectionist-endless-reviser', 'controller-constant-evaluator'));

assert('moving-goalpost ≠ controller-constant-evaluator registry', inRegistry('perfectionist-moving-goalpost') && inRegistry('controller-constant-evaluator'));
assert('moving-goalpost ≠ controller-constant-evaluator ids', idsDiffer('perfectionist-moving-goalpost', 'controller-constant-evaluator'));
assert('moving-goalpost ≠ controller-constant-evaluator groups', groupsDiffer('perfectionist-moving-goalpost', 'controller-constant-evaluator'));
assert('moving-goalpost ≠ controller-constant-evaluator exact prompts', promptsDiffer('perfectionist-moving-goalpost', 'controller-constant-evaluator'));

assert('all-or-nothing-evaluator ≠ controller-constant-evaluator registry', inRegistry('perfectionist-all-or-nothing-evaluator') && inRegistry('controller-constant-evaluator'));
assert('all-or-nothing-evaluator ≠ controller-constant-evaluator ids', idsDiffer('perfectionist-all-or-nothing-evaluator', 'controller-constant-evaluator'));
assert('all-or-nothing-evaluator ≠ controller-constant-evaluator groups', groupsDiffer('perfectionist-all-or-nothing-evaluator', 'controller-constant-evaluator'));
assert('all-or-nothing-evaluator ≠ controller-constant-evaluator exact prompts', promptsDiffer('perfectionist-all-or-nothing-evaluator', 'controller-constant-evaluator'));

assert('beginner-avoider ≠ avoidant-procrastinator registry', inRegistry('perfectionist-beginner-avoider') && inRegistry('avoidant-procrastinator'));
assert('beginner-avoider ≠ avoidant-procrastinator ids', idsDiffer('perfectionist-beginner-avoider', 'avoidant-procrastinator'));
assert('beginner-avoider ≠ avoidant-procrastinator groups', groupsDiffer('perfectionist-beginner-avoider', 'avoidant-procrastinator'));
assert('beginner-avoider ≠ avoidant-procrastinator exact prompts', promptsDiffer('perfectionist-beginner-avoider', 'avoidant-procrastinator'));

assert('performance-curator ≠ shame-secret-keeper registry', inRegistry('perfectionist-performance-curator') && inRegistry('shame-secret-keeper'));
assert('performance-curator ≠ shame-secret-keeper ids', idsDiffer('perfectionist-performance-curator', 'shame-secret-keeper'));
assert('performance-curator ≠ shame-secret-keeper groups', groupsDiffer('perfectionist-performance-curator', 'shame-secret-keeper'));
assert('performance-curator ≠ shame-secret-keeper exact prompts', promptsDiffer('perfectionist-performance-curator', 'shame-secret-keeper'));

assert('explosive-shield ≠ silenced-pressure-building-anger registry', inRegistry('anger-explosive-shield') && inRegistry('silenced-pressure-building-anger'));
assert('explosive-shield ≠ silenced-pressure-building-anger ids', idsDiffer('anger-explosive-shield', 'silenced-pressure-building-anger'));
assert('explosive-shield ≠ silenced-pressure-building-anger groups', groupsDiffer('anger-explosive-shield', 'silenced-pressure-building-anger'));
assert('explosive-shield ≠ silenced-pressure-building-anger exact prompts', promptsDiffer('anger-explosive-shield', 'silenced-pressure-building-anger'));

assert('contempt-shield ≠ silenced-conflict-avoider registry', inRegistry('anger-contempt-shield') && inRegistry('silenced-conflict-avoider'));
assert('contempt-shield ≠ silenced-conflict-avoider ids', idsDiffer('anger-contempt-shield', 'silenced-conflict-avoider'));
assert('contempt-shield ≠ silenced-conflict-avoider groups', groupsDiffer('anger-contempt-shield', 'silenced-conflict-avoider'));
assert('contempt-shield ≠ silenced-conflict-avoider exact prompts', promptsDiffer('anger-contempt-shield', 'silenced-conflict-avoider'));

assert('intimidator ≠ controller-perception-manager registry', inRegistry('anger-intimidator') && inRegistry('controller-perception-manager'));
assert('intimidator ≠ controller-perception-manager ids', idsDiffer('anger-intimidator', 'controller-perception-manager'));
assert('intimidator ≠ controller-perception-manager groups', groupsDiffer('anger-intimidator', 'controller-perception-manager'));
assert('intimidator ≠ controller-perception-manager exact prompts', promptsDiffer('anger-intimidator', 'controller-perception-manager'));

assert('cold-shield ≠ avoidant-ghost registry', inRegistry('anger-cold-shield') && inRegistry('avoidant-ghost'));
assert('cold-shield ≠ avoidant-ghost ids', idsDiffer('anger-cold-shield', 'avoidant-ghost'));
assert('cold-shield ≠ avoidant-ghost groups', groupsDiffer('anger-cold-shield', 'avoidant-ghost'));
assert('cold-shield ≠ avoidant-ghost exact prompts', promptsDiffer('anger-cold-shield', 'avoidant-ghost'));

assert('defensive-debater ≠ controller-analysis-gatekeeper registry', inRegistry('anger-defensive-debater') && inRegistry('controller-analysis-gatekeeper'));
assert('defensive-debater ≠ controller-analysis-gatekeeper ids', idsDiffer('anger-defensive-debater', 'controller-analysis-gatekeeper'));
assert('defensive-debater ≠ controller-analysis-gatekeeper groups', groupsDiffer('anger-defensive-debater', 'controller-analysis-gatekeeper'));
assert('defensive-debater ≠ controller-analysis-gatekeeper exact prompts', promptsDiffer('anger-defensive-debater', 'controller-analysis-gatekeeper'));

assert('passive-aggressive-shield ≠ avoidant-emotional-evader registry', inRegistry('anger-passive-aggressive-shield') && inRegistry('avoidant-emotional-evader'));
assert('passive-aggressive-shield ≠ avoidant-emotional-evader ids', idsDiffer('anger-passive-aggressive-shield', 'avoidant-emotional-evader'));
assert('passive-aggressive-shield ≠ avoidant-emotional-evader groups', groupsDiffer('anger-passive-aggressive-shield', 'avoidant-emotional-evader'));
assert('passive-aggressive-shield ≠ avoidant-emotional-evader exact prompts', promptsDiffer('anger-passive-aggressive-shield', 'avoidant-emotional-evader'));

assert('grievance-keeper ≠ hypervigilant-threat-forecaster registry', inRegistry('anger-grievance-keeper') && inRegistry('hypervigilant-threat-forecaster'));
assert('grievance-keeper ≠ hypervigilant-threat-forecaster ids', idsDiffer('anger-grievance-keeper', 'hypervigilant-threat-forecaster'));
assert('grievance-keeper ≠ hypervigilant-threat-forecaster groups', groupsDiffer('anger-grievance-keeper', 'hypervigilant-threat-forecaster'));
assert('grievance-keeper ≠ hypervigilant-threat-forecaster exact prompts', promptsDiffer('anger-grievance-keeper', 'hypervigilant-threat-forecaster'));

assert('righteous-avenger ≠ martyr-moral-martyr registry', inRegistry('anger-righteous-avenger') && inRegistry('martyr-moral-martyr'));
assert('righteous-avenger ≠ martyr-moral-martyr ids', idsDiffer('anger-righteous-avenger', 'martyr-moral-martyr'));
assert('righteous-avenger ≠ martyr-moral-martyr groups', groupsDiffer('anger-righteous-avenger', 'martyr-moral-martyr'));
assert('righteous-avenger ≠ martyr-moral-martyr exact prompts', promptsDiffer('anger-righteous-avenger', 'martyr-moral-martyr'));

assert('apology-cycle ≠ shame-confession-loop registry', inRegistry('anger-apology-cycle') && inRegistry('shame-confession-loop'));
assert('apology-cycle ≠ shame-confession-loop ids', idsDiffer('anger-apology-cycle', 'shame-confession-loop'));
assert('apology-cycle ≠ shame-confession-loop groups', groupsDiffer('anger-apology-cycle', 'shame-confession-loop'));
assert('apology-cycle ≠ shame-confession-loop exact prompts', promptsDiffer('anger-apology-cycle', 'shame-confession-loop'));

/* ==================================================================
 *  Safety validation — Batch 12 prompts
 * ================================================================*/

const batch12Items = items.filter(i => batch12.includes(i.expressionId));
const batch12Prompts = batch12Items.map(i => i.prompt);

// Does not diagnose codependency
for (const p of batch12Prompts) {
  assert('no codependency diagnosis', !p.toLowerCase().includes('codependen'));
}

// Does not diagnose parentification
for (const p of batch12Prompts) {
  assert('no parentification diagnosis', !p.toLowerCase().includes('parentification'));
  assert('no parentification diagnosis', !p.toLowerCase().includes('parentified'));
}

// Does not diagnose survivor guilt
for (const p of batch12Prompts) {
  assert('no survivor guilt diagnosis', !p.toLowerCase().includes('survivor guilt'));
  assert('no survivor guilt diagnosis', !p.toLowerCase().includes('survivor syndrome'));
}

// Does not diagnose trauma
for (const p of batch12Prompts) {
  assert('no trauma diagnosis', !p.toLowerCase().includes('ptsd'));
  assert('no trauma diagnosis', !p.toLowerCase().includes('trauma'));
}

// Does not accuse the user of manipulation
for (const p of batch12Prompts) {
  assert('no manipulation accusation', !p.toLowerCase().includes('manipulat'));
}

// Does not assume malicious intent
for (const p of batch12Prompts) {
  assert('no malicious intent', !p.toLowerCase().includes('deliberately'));
  assert('no malicious intent', !p.toLowerCase().includes('malicious'));
  assert('no malicious intent', !p.toLowerCase().includes('intentionally'));
}

// Does not imply the user alone caused unequal responsibility
for (const p of batch12Prompts) {
  assert('no alone-caused imbalance', !p.toLowerCase().includes('you caused'));
  assert('no alone-caused imbalance', !p.toLowerCase().includes('your fault'));
}

// Does not deny genuine exploitation
for (const p of batch12Prompts) {
  assert('no deny exploitation', !p.toLowerCase().includes('your share is fair'));
  assert('no deny exploitation', !p.toLowerCase().includes('nothing is unfair'));
}

// Does not imply empathy or caregiving is unhealthy
for (const p of batch12Prompts) {
  assert('no empathy unhealthy', !p.toLowerCase().includes('empathy is unhealthy'));
  assert('no empathy unhealthy', !p.toLowerCase().includes('caring is unhealthy'));
}

// Does not discourage accountability
for (const p of batch12Prompts) {
  assert('no discourage accountability', !p.toLowerCase().includes('should not take responsibility'));
  assert('no discourage accountability', !p.toLowerCase().includes('never apologize'));
}

// Does not discourage emergency protection
for (const p of batch12Prompts) {
  assert('no discourage emergency protection', !p.toLowerCase().includes('should not protect'));
  assert('no discourage emergency protection', !p.toLowerCase().includes('should not step in'));
}

// Does not pressure boundary-setting in unsafe situations
for (const p of batch12Prompts) {
  assert('no unsafe boundary pressure', !p.toLowerCase().includes('should set limits'));
  assert('no unsafe boundary pressure', !p.toLowerCase().includes('must set boundaries'));
}

// Does not blame the user for another person's aggression
for (const p of batch12Prompts) {
  assert('no blame for aggression', !p.toLowerCase().includes('you made them angry'));
  assert('no blame for aggression', !p.toLowerCase().includes('you provoked'));
}

// Does not imply rest is always possible
for (const p of batch12Prompts) {
  assert('no rest always possible', !p.toLowerCase().includes('rest is always possible'));
  assert('no rest always possible', !p.toLowerCase().includes('you can always rest'));
}

// Does not imply another person's suffering is the user's fault
for (const p of batch12Prompts) {
  assert('no suffering is your fault', !p.toLowerCase().includes('their suffering is your fault'));
  assert('no suffering is your fault', !p.toLowerCase().includes('you caused their suffering'));
}

// Does not treat guilt as proof of actual responsibility
for (const p of batch12Prompts) {
  assert('no guilt = responsibility', !p.toLowerCase().includes('guilt proves'));
  assert('no guilt = responsibility', !p.toLowerCase().includes('feeling guilty means you are responsible'));
}

// Does not imply every consequence should be left untouched
for (const p of batch12Prompts) {
  assert('no leave all consequences', !p.toLowerCase().includes('never intervene'));
  assert('no leave all consequences', !p.toLowerCase().includes('all consequences should be left'));
}

// overfunctioner-02 does not imply deceptive presentation
{
  const of = getExpressionScreeningItems('rescuer-overfunctioner');
  assert('overfunctioner-02 "I believe doing so will help"', of[1].prompt.includes('because I believe doing so will help'));
  assert('overfunctioner-02 no deception', !of[1].prompt.toLowerCase().includes('pretend'));
  assert('overfunctioner-02 no deception', !of[1].prompt.toLowerCase().includes('deceive'));
}

// hidden-contract-helper-01 uses plain language and one expected response
{
  const hc = getExpressionScreeningItems('rescuer-hidden-contract-helper');
  assert('hidden-contract-helper-01 "I hope helping"', hc[0].prompt.includes('I hope helping someone'));
  assert('hidden-contract-helper-01 one expected response', (hc[0].prompt.match(/respond/gi) ?? []).length === 1);
  assert('hidden-contract-helper-01 plain language', !hc[0].prompt.toLowerCase().includes('owe'));
  assert('hidden-contract-helper-01 plain language', !hc[0].prompt.toLowerCase().includes('deserve'));
  assert('hidden-contract-helper-01 plain language', !hc[0].prompt.toLowerCase().includes('return'));
}

// rescue-to-control-01 measures expected influence without loaded entitlement wording
{
  const tc = getExpressionScreeningItems('rescuer-to-control');
  assert('to-control-01 "more influence"', tc[0].prompt.includes('more influence over what they decide'));
  assert('to-control-01 no entitlement wording', !tc[0].prompt.toLowerCase().includes('owe'));
  assert('to-control-01 no entitlement wording', !tc[0].prompt.toLowerCase().includes('deserve'));
}

// rescue-to-martyr prompts do not deny genuine exploitation
{
  const tm = getExpressionScreeningItems('rescuer-to-martyr');
  for (const p of tm.map(i => i.prompt)) {
    assert('to-martyr no denial', !p.toLowerCase().includes('your share is fair'));
    assert('to-martyr no denial', !p.toLowerCase().includes('nothing is unfair'));
  }
  assert('to-martyr-01 "feel trapped"', tm[0].prompt.includes('feel trapped by the responsibility'));
  assert('to-martyr-02 "into resentment"', tm[1].prompt.includes('from helping into resentment'));
}

// parentified-one-01 describes a present adult relationship pattern
{
  const po = getExpressionScreeningItems('over-responsible-parentified-one');
  assert('parentified-one-01 "other capable adults"', po[0].prompt.includes('other capable adults'));
  assert('parentified-one-01 no childhood framing', !po[0].prompt.toLowerCase().includes('when you were a child'));
  assert('parentified-one-01 no childhood framing', !po[0].prompt.toLowerCase().includes('as a child'));
  assert('parentified-one-02 "equal responsibility"', po[1].prompt.includes('equal responsibility'));
}

// family-stabilizer-01 includes family-like groups
{
  const fs = getExpressionScreeningItems('over-responsible-family-stabilizer');
  assert('family-stabilizer-01 "family or family-like"', fs[0].prompt.includes('family or family-like group'));
}

// chronic-apologizer-02 does not imply deliberate emotional strategy
{
  const ca = getExpressionScreeningItems('over-responsible-chronic-apologizer');
  assert('chronic-apologizer-02 "to reduce tension"', ca[1].prompt.includes('to reduce tension'));
  assert('chronic-apologizer-02 no strategy', !ca[1].prompt.toLowerCase().includes('strategy'));
  assert('chronic-apologizer-02 no strategy', !ca[1].prompt.toLowerCase().includes('to control'));
}

// boundary-guilty-01 refers to a reasonable decline in a safe context
{
  const bg = getExpressionScreeningItems('over-responsible-boundary-guilty');
  assert('boundary-guilty-01 "reasonably declining"', bg[0].prompt.includes('reasonably declining a request'));
  assert('boundary-guilty-01 "feels safe"', bg[0].prompt.includes('where doing so feels safe'));
}

// survivor-guilt prompts do not diagnose or require trauma exposure
{
  const sg = getExpressionScreeningItems('over-responsible-survivor-guilt');
  for (const p of sg.map(i => i.prompt)) {
    assert('survivor-guilt no diagnosis', !p.toLowerCase().includes('survivor guilt'));
    assert('survivor-guilt no trauma', !p.toLowerCase().includes('trauma'));
  }
  assert('survivor-guilt-01 no event framing', !sg[0].prompt.toLowerCase().includes('after a disaster'));
  assert('survivor-guilt-01 "someone who has struggled"', sg[0].prompt.includes('someone who has struggled'));
}

/* ==================================================================
 *  Safety validation — Batch 13 prompts
 * ================================================================*/

const batch13Items = items.filter(i => batch13.includes(i.expressionId));
const batch13Prompts = batch13Items.map(i => i.prompt);

// Does not diagnose anxiety disorders
for (const p of batch13Prompts) {
  assert('no anxiety diagnosis', !p.toLowerCase().includes('anxiety disorder'));
  assert('no anxiety diagnosis', !p.toLowerCase().includes('anxious disorder'));
}

// Does not diagnose OCD or scrupulosity
for (const p of batch13Prompts) {
  assert('no ocd diagnosis', !p.toLowerCase().includes('ocd'));
  assert('no ocd diagnosis', !p.toLowerCase().includes('obsessive-compulsive'));
  assert('no scrupulosity diagnosis', !p.toLowerCase().includes('scrupulosity'));
}

// Does not diagnose burnout or executive dysfunction
for (const p of batch13Prompts) {
  assert('no burnout diagnosis', !p.toLowerCase().includes('burnout'));
  assert('no executive dysfunction diagnosis', !p.toLowerCase().includes('executive dysfunction'));
  assert('no executive dysfunction diagnosis', !p.toLowerCase().includes('executive function'));
}

// Does not accuse the user of control or manipulation
for (const p of batch13Prompts) {
  assert('no control accusation', !p.toLowerCase().includes('to control'));
  assert('no manipulation accusation', !p.toLowerCase().includes('manipulat'));
}

// Does not assume malicious intent
for (const p of batch13Prompts) {
  assert('no malicious intent', !p.toLowerCase().includes('deliberately'));
  assert('no malicious intent', !p.toLowerCase().includes('malicious'));
  assert('no malicious intent', !p.toLowerCase().includes('intentionally'));
}

// Does not imply empathy or caregiving is unhealthy
for (const p of batch13Prompts) {
  assert('no empathy unhealthy', !p.toLowerCase().includes('empathy is unhealthy'));
  assert('no empathy unhealthy', !p.toLowerCase().includes('caring is unhealthy'));
}

// Does not discourage accountability, honest disclosure, or reporting
for (const p of batch13Prompts) {
  assert('no discourage accountability', !p.toLowerCase().includes('should not take responsibility'));
  assert('no discourage disclosure', !p.toLowerCase().includes('should not disclose'));
  assert('no discourage disclosure', !p.toLowerCase().includes('should not tell'));
}

// Does not pressure secrecy
for (const p of batch13Prompts) {
  assert('no secrecy pressure', !p.toLowerCase().includes('keep it a secret'));
  assert('no secrecy pressure', !p.toLowerCase().includes('do not tell anyone'));
}

// Does not discourage safety planning
for (const p of batch13Prompts) {
  assert('no discourage safety planning', !p.toLowerCase().includes('should not plan for safety'));
  assert('no discourage safety planning', !p.toLowerCase().includes('should not prepare'));
}

// Does not deny unequal labor or lack of support
for (const p of batch13Prompts) {
  assert('no denial of unequal labor', !p.toLowerCase().includes('your share is fair'));
  assert('no denial of unequal labor', !p.toLowerCase().includes('nothing is unfair'));
  assert('no denial of lack of support', !p.toLowerCase().includes('you are not overloaded'));
}

// Does not pressure delegation
for (const p of batch13Prompts) {
  assert('no delegation pressure', !p.toLowerCase().includes('you should delegate'));
  assert('no delegation pressure', !p.toLowerCase().includes('must delegate'));
}

// Does not blame the user for their own overload
for (const p of batch13Prompts) {
  assert('no overload blame', !p.toLowerCase().includes('you caused your overload'));
  assert('no overload blame', !p.toLowerCase().includes('your overload is your fault'));
}

// Does not imply stopping is always possible
for (const p of batch13Prompts) {
  assert('no stopping always possible', !p.toLowerCase().includes('you can always stop'));
  assert('no stopping always possible', !p.toLowerCase().includes('stopping is always possible'));
}

// Does not accuse the user of creating crises
for (const p of batch13Prompts) {
  assert('no crisis-creation accusation', !p.toLowerCase().includes('you create crises'));
  assert('no crisis-creation accusation', !p.toLowerCase().includes('you manufacture'));
}

// Does not treat competence as a flaw
for (const p of batch13Prompts) {
  assert('no competence as flaw', !p.toLowerCase().includes('competence is a flaw'));
  assert('no competence as flaw', !p.toLowerCase().includes('being capable is a problem'));
}

// mind-reader prompts measure anticipated needs without mind-reading diagnosis
{
  const mr = getExpressionScreeningItems('over-responsible-mind-reader');
  assert('mind-reader-01 "before they are expressed"', mr[0].prompt.includes("before they are expressed"));
  assert('mind-reader-02 "assumed expectation"', mr[1].prompt.includes('assumed expectation'));
  assert('mind-reader no mind-reading diagnosis', !mr[0].prompt.toLowerCase().includes('you can read minds'));
}

// preventer-01 includes other people; preventer-02 leaves ownership unclear
{
  const pv = getExpressionScreeningItems('over-responsible-preventer');
  assert('preventer-01 "involve other people"', pv[0].prompt.includes('involve other people'));
  assert('preventer-02 "ownership is unclear"', pv[1].prompt.includes('even when ownership is unclear'));
}

// moral-overcorrector-02 measures reputational repair without labeling the user
{
  const mo = getExpressionScreeningItems('over-responsible-moral-overcorrector');
  assert('moral-overcorrector-02 "see me as fair"', mo[1].prompt.includes('see me as fair and responsible'));
}

// confession-seeker prompts measure disclosure-seeking without requiring confession
{
  const cs = getExpressionScreeningItems('over-responsible-confession-seeker');
  for (const p of cs.map(i => i.prompt)) {
    assert('confession-seeker no mandatory disclosure', !p.toLowerCase().includes('must confess'));
    assert('confession-seeker no mandatory disclosure', !p.toLowerCase().includes('have to disclose'));
  }
  assert('confession-seeker-01 "before its significance is clear"', cs[0].prompt.includes('before its significance is clear'));
  assert('confession-seeker-02 "may not require disclosure"', cs[1].prompt.includes('may not require disclosure'));
}

// no-backup prompts describe absence of support without demanding self-reliance
{
  const nb = getExpressionScreeningItems('overloaded-no-backup');
  assert('no-backup-01 "essential responsibilities"', nb[0].prompt.includes('essential responsibilities'));
  assert('no-backup-02 "no reliable substitute"', nb[1].prompt.includes('no reliable substitute'));
}

// cannot-delegate-01 describes distrust of reliability, not contempt
{
  const cd = getExpressionScreeningItems('overloaded-cannot-delegate');
  assert('cannot-delegate-01 "do not trust another person"', cd[0].prompt.includes('do not trust another person to handle it reliably'));
  assert('cannot-delegate-01 no contempt', !cd[0].prompt.toLowerCase().includes('incompetent'));
  assert('cannot-delegate-01 no contempt', !cd[0].prompt.toLowerCase().includes('incapable'));
}

// competence-trap prompts describe assigned workload, not self-promotion
{
  const ct = getExpressionScreeningItems('overloaded-competence-trap');
  assert('competence-trap-01 "because others expect"', ct[0].prompt.includes('because others expect me to handle it well'));
  assert('competence-trap-02 "responsible for it again"', ct[1].prompt.includes('responsible for it again'));
  assert('competence-trap no self-promotion', !ct[0].prompt.toLowerCase().includes('bragging'));
}

// capacity-denier-02 describes pushing through, not glorifying overwork
{
  const cdn = getExpressionScreeningItems('overloaded-capacity-denier');
  assert('capacity-denier-02 "obstacles to push through"', cdn[1].prompt.includes('obstacles to push through'));
  assert('capacity-denier no glorification', !cdn[0].prompt.toLowerCase().includes('stronger than'));
}

// stop-then-resume prompts describe the pattern without endorsing it
{
  const st = getExpressionScreeningItems('overloaded-stop-then-resume');
  assert('stop-then-resume-01 "only when continuing becomes impossible"', st[0].prompt.includes('only when continuing becomes impossible'));
  assert('stop-then-resume-02 "after a brief recovery"', st[1].prompt.includes('after a brief recovery'));
}

/* ==================================================================
 *  Safety validation — Batch 14 prompts
 * ================================================================*/

const batch14Items = items.filter(i => batch14.includes(i.expressionId));
const batch14Prompts = batch14Items.map(i => i.prompt);

// Does not diagnose perfectionism
for (const p of batch14Prompts) {
  assert('no perfectionism diagnosis', !p.toLowerCase().includes('perfectionist disorder'));
  assert('no perfectionism diagnosis', !p.toLowerCase().includes('clinical perfectionism'));
}

// Does not diagnose social anxiety
for (const p of batch14Prompts) {
  assert('no social anxiety diagnosis', !p.toLowerCase().includes('social anxiety'));
  assert('no social anxiety diagnosis', !p.toLowerCase().includes('social phobia'));
}

// Does not diagnose an anger or impulse-control disorder
for (const p of batch14Prompts) {
  assert('no anger disorder diagnosis', !p.toLowerCase().includes('intermittent explosive disorder'));
  assert('no anger disorder diagnosis', !p.toLowerCase().includes('impulse-control disorder'));
}

// Does not diagnose abuse
for (const p of batch14Prompts) {
  assert('no abuse diagnosis', !p.toLowerCase().includes('you are abusive'));
  assert('no abuse diagnosis', !p.toLowerCase().includes('abuse disorder'));
}

// Does not accuse the user of manipulation
for (const p of batch14Prompts) {
  assert('no manipulation accusation', !p.toLowerCase().includes('manipulat'));
}

// Does not assume malicious intent
for (const p of batch14Prompts) {
  assert('no malicious intent', !p.toLowerCase().includes('deliberately'));
  assert('no malicious intent', !p.toLowerCase().includes('malicious'));
  assert('no malicious intent', !p.toLowerCase().includes('intentionally'));
}

// Does not assume violence
for (const p of batch14Prompts) {
  assert('no violence assumption', !p.toLowerCase().includes('violent'));
  assert('no violence assumption', !p.toLowerCase().includes('physical harm'));
}

// Does not excuse aggression
for (const p of batch14Prompts) {
  assert('no excuse aggression', !p.toLowerCase().includes('your anger is justified'));
  assert('no excuse aggression', !p.toLowerCase().includes('aggression is acceptable'));
}

// Does not normalize threats
for (const p of batch14Prompts) {
  assert('no normalize threats', !p.toLowerCase().includes('threatening others is normal'));
  assert('no normalize threats', !p.toLowerCase().includes('threats are understandable'));
}

// Does not encourage intimidation
for (const p of batch14Prompts) {
  assert('no encourage intimidation', !p.toLowerCase().includes('you should intimidate'));
  assert('no encourage intimidation', !p.toLowerCase().includes('use intensity to get results'));
}

// Does not encourage retaliation
for (const p of batch14Prompts) {
  assert('no encourage retaliation', !p.toLowerCase().includes('you should retaliate'));
  assert('no encourage retaliation', !p.toLowerCase().includes('getting even'));
}

// Does not endorse vigilante behavior
for (const p of batch14Prompts) {
  assert('no vigilante endorsement', !p.toLowerCase().includes('take justice into your own hands'));
  assert('no vigilante endorsement', !p.toLowerCase().includes('vigilante'));
}

// Does not imply apology erases harm
for (const p of batch14Prompts) {
  assert('no apology erases harm', !p.toLowerCase().includes('an apology erases'));
  assert('no apology erases harm', !p.toLowerCase().includes('apologizing fixes everything'));
}

// Does not imply forgiveness is required
for (const p of batch14Prompts) {
  assert('no forgiveness required', !p.toLowerCase().includes('you must forgive'));
  assert('no forgiveness required', !p.toLowerCase().includes('forgiveness is required'));
}

// Does not pressure reconciliation
for (const p of batch14Prompts) {
  assert('no reconciliation pressure', !p.toLowerCase().includes('you should reconcile'));
  assert('no reconciliation pressure', !p.toLowerCase().includes('make up with'));
}

// Does not condemn leaving unsafe conflict
for (const p of batch14Prompts) {
  assert('no condemn leaving conflict', !p.toLowerCase().includes('you should not leave'));
  assert('no condemn leaving conflict', !p.toLowerCase().includes('staying is the only safe option'));
}

// Does not pathologize temporary safety-related distance
for (const p of batch14Prompts) {
  assert('no pathologize safety distance', !p.toLowerCase().includes('distance is a disorder'));
  assert('no pathologize safety distance', !p.toLowerCase().includes('distancing is always harmful'));
}

// Does not deny genuine betrayal or harm
for (const p of batch14Prompts) {
  assert('no deny betrayal', !p.toLowerCase().includes('you were not harmed'));
  assert('no deny betrayal', !p.toLowerCase().includes('nothing wrong happened'));
}

// Does not treat perceived injustice as established fact
for (const p of batch14Prompts) {
  assert('no perceived injustice as fact', !p.toLowerCase().includes('your injustice is real'));
  assert('no injustice assertion', !p.toLowerCase().includes('the injustice is undeniable'));
}

// Does not imply privacy or careful work is unhealthy
for (const p of batch14Prompts) {
  assert('no privacy unhealthy', !p.toLowerCase().includes('privacy is unhealthy'));
  assert('no privacy unhealthy', !p.toLowerCase().includes('careful work is unhealthy'));
}

// performance-curator-02 uses neutral privacy language
{
  const pc = getExpressionScreeningItems('perfectionist-performance-curator');
  assert('performance-curator-02 "keeping weaker ones private"', pc[1].prompt.includes('keeping weaker ones private'));
  assert('performance-curator-02 no secrecy framing', !pc[1].prompt.toLowerCase().includes('hiding'));
  assert('performance-curator-02 no secrecy framing', !pc[1].prompt.toLowerCase().includes('deceiv'));
}

// explosive-shield-02 uses plain non-clinical language
{
  const es = getExpressionScreeningItems('anger-explosive-shield');
  assert('explosive-shield-02 "much stronger than the immediate situation"', es[1].prompt.includes('much stronger than the immediate situation'));
  assert('explosive-shield-02 no clinical labels', !es[1].prompt.toLowerCase().includes('episode'));
  assert('explosive-shield-02 no clinical labels', !es[1].prompt.toLowerCase().includes('rage attack'));
}

// contempt-shield-01 measures dismissal without global character judgment
{
  const cs = getExpressionScreeningItems('anger-contempt-shield');
  assert('contempt-shield-01 "viewpoint as not worth serious consideration"', cs[0].prompt.includes("viewpoint as not worth serious consideration"));
  assert('contempt-shield-01 no character judgment', !cs[0].prompt.toLowerCase().includes('worthless person'));
  assert('contempt-shield-01 no character judgment', !cs[0].prompt.toLowerCase().includes('bad person'));
}

// intimidator-01 does not assume deliberate malicious intent
{
  const it = getExpressionScreeningItems('anger-intimidator');
  assert('intimidator-01 "may back down"', it[0].prompt.includes('and the other person may back down'));
  assert('intimidator-01 no deliberate intent', !it[0].prompt.toLowerCase().includes('deliberately'));
  assert('intimidator-01 no deliberate intent', !it[0].prompt.toLowerCase().includes('to scare'));
}

// cold-shield-02 does not condemn temporary distance for safety
{
  const cd = getExpressionScreeningItems('anger-cold-shield');
  assert('cold-shield-02 "further vulnerability feels difficult"', cd[1].prompt.includes('further vulnerability feels difficult'));
  assert('cold-shield-02 no condemnation', !cd[1].prompt.toLowerCase().includes('wrong to withdraw'));
  assert('cold-shield-02 no condemnation', !cd[1].prompt.toLowerCase().includes('never distance'));
}

// defensive-debater-02 does not assume criticism is valid
{
  const dd = getExpressionScreeningItems('anger-defensive-debater');
  assert('defensive-debater-02 "may be trying to communicate"', dd[1].prompt.includes('may be trying to communicate'));
  assert('defensive-debater-02 no validity assumption', !dd[1].prompt.toLowerCase().includes('valid criticism'));
  assert('defensive-debater-02 no validity assumption', !dd[1].prompt.toLowerCase().includes('correct criticism'));
}

// passive-aggressive-shield-02 does not assume deliberate deniability
{
  const pa = getExpressionScreeningItems('anger-passive-aggressive-shield');
  assert('passive-aggressive-shield-02 "meaning can remain unclear"', pa[1].prompt.includes('my meaning can remain unclear'));
  assert('passive-aggressive-shield-02 no deliberate deniability', !pa[1].prompt.toLowerCase().includes('deniability'));
  assert('passive-aggressive-shield-02 no deliberate deniability', !pa[1].prompt.toLowerCase().includes('on purpose'));
}

// grievance-keeper items do not imply forgiveness or reconciliation is required
{
  const gk = getExpressionScreeningItems('anger-grievance-keeper');
  for (const p of gk.map(i => i.prompt)) {
    assert('grievance-keeper no forgiveness required', !p.toLowerCase().includes('forgive'));
    assert('grievance-keeper no reconciliation pressure', !p.toLowerCase().includes('reconcile'));
  }
  assert('grievance-keeper-01 "past injuries as warnings"', gk[0].prompt.includes('past injuries as warnings'));
}

// righteous-avenger items refer to perceived injustice
{
  const ra = getExpressionScreeningItems('anger-righteous-avenger');
  for (const p of ra.map(i => i.prompt)) {
    assert('righteous-avenger perceived injustice', p.toLowerCase().includes('perceived injustice') || p.toLowerCase().includes('fairness'));
  }
  assert('righteous-avenger-01 "perceived injustice"', ra[0].prompt.includes('perceived injustice'));
  assert('righteous-avenger-02 "enforce fairness"', ra[1].prompt.includes('enforce fairness'));
}

// anger-apology-cycle-02 describes recurrence without implying apology erases harm
{
  const ac = getExpressionScreeningItems('anger-apology-cycle');
  assert('apology-cycle-02 "but the same cycle later happens again"', ac[1].prompt.includes('but the same cycle later happens again'));
  assert('apology-cycle-02 no erasure implication', !ac[1].prompt.toLowerCase().includes('erases'));
  assert('apology-cycle-02 no erasure implication', !ac[1].prompt.toLowerCase().includes('undoes'));
}

// Display names resolve to canonical IDs
{
  const byName = new Map(EXPRESSION_REGISTRY.map(e => [e.name.toLowerCase(), e.id]));
  assert('"the explosive / reactive one" → anger-explosive-shield', byName.get('the explosive / reactive one') === 'anger-explosive-shield');
  assert('"the sniper / passing shots" → anger-passive-aggressive-shield', byName.get('the sniper / passing shots') === 'anger-passive-aggressive-shield');
}

/* ==================================================================
 *  Candidate selection (unchanged)
 * ================================================================*/

assert('rank empty', rankExpressionScores([]).length === 0);
assert('no qualifying null leader',
  selectGroupCandidates('expression-group-hypervigilant-one-relational-scanning', []).leader === null);
assert('no candidates empty', selectFinalCandidates([]).finalCandidates.length === 0);
assert('two groups → 2',
  selectFinalCandidates([
    { groupId: 'g1', leader: { expressionId: 'e1', groupId: 'g1', normalizedDirectScore: 4, rawDirectScore: 8, answeredCount: 2, groupOrder: 1, expressionOrder: 1, isLeader: true }, secondary: null },
    { groupId: 'g2', leader: { expressionId: 'e2', groupId: 'g2', normalizedDirectScore: 3.5, rawDirectScore: 7, answeredCount: 2, groupOrder: 1, expressionOrder: 1, isLeader: true }, secondary: null },
  ]).finalCandidates.length === 2);
assert('three groups → 3',
  selectFinalCandidates([
    { groupId: 'g1', leader: { expressionId: 'e1', groupId: 'g1', normalizedDirectScore: 4, rawDirectScore: 8, answeredCount: 2, groupOrder: 1, expressionOrder: 1, isLeader: true }, secondary: null },
    { groupId: 'g2', leader: { expressionId: 'e2', groupId: 'g2', normalizedDirectScore: 3.5, rawDirectScore: 7, answeredCount: 2, groupOrder: 1, expressionOrder: 1, isLeader: true }, secondary: null },
    { groupId: 'g3', leader: { expressionId: 'e3', groupId: 'g3', normalizedDirectScore: 3, rawDirectScore: 6, answeredCount: 2, groupOrder: 1, expressionOrder: 1, isLeader: true }, secondary: null },
  ]).finalCandidates.length === 3);
assert('3+1 → 4',
  selectFinalCandidates([
    { groupId: 'g1', leader: { expressionId: 'e1', groupId: 'g1', normalizedDirectScore: 4, rawDirectScore: 8, answeredCount: 2, groupOrder: 1, expressionOrder: 1, isLeader: true },
      secondary: { expressionId: 'e1b', groupId: 'g1', normalizedDirectScore: 3.8, rawDirectScore: 7, answeredCount: 2, groupOrder: 1, expressionOrder: 2, isLeader: false } },
    { groupId: 'g2', leader: { expressionId: 'e2', groupId: 'g2', normalizedDirectScore: 3.5, rawDirectScore: 7, answeredCount: 2, groupOrder: 1, expressionOrder: 1, isLeader: true }, secondary: null },
    { groupId: 'g3', leader: { expressionId: 'e3', groupId: 'g3', normalizedDirectScore: 3, rawDirectScore: 6, answeredCount: 2, groupOrder: 1, expressionOrder: 1, isLeader: true }, secondary: null },
  ]).finalCandidates.length === 4);
{
  const candidates = [];
  for (let i = 0; i < 5; i++) candidates.push({
    groupId: `g${i}`, leader: { expressionId: `e${i}`, groupId: `g${i}`, normalizedDirectScore: 5, rawDirectScore: 10, answeredCount: 2, groupOrder: i, expressionOrder: 1, isLeader: true }, secondary: null,
  });
  assert('cap 4', selectFinalCandidates(candidates).finalCandidates.length <= 4);
}

/* ==================================================================
 *  JSON serializability
 * ================================================================*/
{
  const r = routeExpressionScreening('pro', ['expression-group-hypervigilant-one-relational-scanning'], []);
  const p = JSON.parse(JSON.stringify(r));
  assert('JSON roundtrip category', p.category === r.category);
  assert('JSON roundtrip configVersion', p.trace.configVersion === '1.0.0');
  assert('not Map', !(r instanceof Map)); assert('not Set', !(r instanceof Set));
}
{
  const raw = getExpressionScreeningReadiness();
  const p = JSON.parse(JSON.stringify(raw));
  assert('readiness JSON roundtrip', p.totalItemCount === 290);
  assert('readiness not Map', !(raw instanceof Map)); assert('readiness not Set', !(raw instanceof Set));
}

/* ==================================================================
 *  Readiness
 * ================================================================*/

const readiness = getExpressionScreeningReadiness();
assert('readiness total=290', readiness.totalItemCount === 290);
assert('readiness itemsDefined', readiness.itemsDefined === true);
assert('readiness allExpressionsHaveTwoItems=true (145/145)', readiness.allExpressionsHaveTwoItems === true);
assert('readiness allItemsPro', readiness.allItemsPro === true);
assert('readiness noReverseScored', readiness.noReverseScored === true);
assert('readiness everyItemMapsToValidExpression', readiness.everyItemMapsToValidExpression === true);
assert('readiness everyItemMapsToValidGroup', readiness.everyItemMapsToValidGroup === true);
assert('readiness itemNumbersCorrect', readiness.itemNumbersCorrect === true);
assert('readiness allPromptsNonEmpty', readiness.allPromptsNonEmpty === true);
assert('readiness ready=true', readiness.ready === true);
assert('readiness no missing requirements', readiness.missingRequirements.length === 0);

/* ==================================================================
 *  Assessment readiness (Pro and Free)
 * ================================================================*/

const PRO_REASON = 'universal strategy screen complete';
const FREE_REASON = 'strategy pro bank not required for free mode; universal strategy screen complete';

{
  const pro = getAssessmentReadiness('pro');
  assert('pro ready=true', pro.ready === true);
  assert('pro expressionGroupingComplete', pro.expressionGroupingComplete === true);
  assert('pro expressionGroupScreeningComplete', pro.expressionGroupScreeningComplete === true);
  assert('pro expressionScreeningComplete=true', pro.expressionScreeningComplete === true);
  assert('pro expressionConfirmationComplete=true', pro.expressionConfirmationComplete === true);
  assert('pro exact reason', pro.missingRequirements.join('; ') === PRO_REASON);
}
{
  const free = getAssessmentReadiness('free');
  assert('free ready=false', free.ready === false);
  assert('free expressionGroupingComplete', free.expressionGroupingComplete === true);
  assert('free expressionGroupScreeningComplete', free.expressionGroupScreeningComplete === true);
  assert('free expressionScreeningComplete=true', free.expressionScreeningComplete === true);
  assert('free expressionConfirmationComplete=true', free.expressionConfirmationComplete === true);
  assert('free exact reason', free.missingRequirements.join('; ') === FREE_REASON);
}

/* ==================================================================
 *  Summary
 * ================================================================*/

console.log(`\nIndividual Expression Screening Validation — Batch 14 (Final)`);
console.log(`  passed: ${passed}`);
console.log(`  failed: ${failed}`);
if (failed > 0) {
  console.log(`  errors:`);
  for (const e of errors) {
    console.log(`    ${e}`);
  }
}
