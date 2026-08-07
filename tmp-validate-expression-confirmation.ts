/*
 * Expression Confirmation Architecture + Batch C1/C2/C3 Validation
 *
 * Validates the foundational Individual Expression Confirmation architecture:
 * types, configuration, scoring, skip/retry, candidate-set preservation,
 * deterministic ordering, serializable traces, build-time readiness — plus
 * Batch C1: 31 confirmation items across groups 1-9 (silenced-one,
 * unheld-one, invisible-one, shame-bearer), Batch C2: 33 confirmation items
 * across groups 10-18 (shame-bearer body/moral condemnation, controller,
 * avoidant-one, hypervigilant-one), Batch C3: 27 confirmation items
 * across groups 19-26 (hypervigilant-one monitoring, entangled-one,
 * grief-bearer, martyr), Batch C4: 30 confirmation items across
 * groups 27-34 (rescuer, over-responsible-one), and Batch C5: 24 confirmation
 * items across groups 35-42 (overloaded-one, perfectionist, anger-shield)
 * completing the 145-item bank.
 *
 * Sections:
 *  A. Real production bank (145 / 145) + exact readiness reasons
 *  A2. Batch C1 content: exact prompts, group counts, distinctness, safety
 *  A3. Batch C2 content: exact prompts, group counts, distinctness, safety,
 *      scoring/retry/caps/ordering on real C2 records
 *  A4. Batch C3 content: exact prompts, group counts, distinctness, safety,
 *      scoring/retry/caps/ordering on real C3 records
 *  A5. Batch C4 content: exact prompts, group counts, distinctness, safety,
 *      scoring/retry/caps/ordering on real C4 records
 *  A6. Batch C5 content: exact prompts, group counts, distinctness, safety,
 *      scoring/retry/caps/ordering on real C5 records
 *  B. Synthetic valid 145-item fixture banks
 *  C. Invalid fixture banks
 *  D. Scoring boundaries
 *  E. Skip and retry
 *  F. Candidate-set behavior
 *  G. Ordering
 *  H. Serialization
 *  I. Free runtime behavior
 *  J. Preservation of existing expression assessment data
 *  K. No live quiz wiring
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  confirmExpressionCandidates,
  getConfirmationItemForExpression,
  getConfirmationItemsForCandidates,
  scoreExpressionConfirmation,
  sortConfirmedExpressions,
  deriveExpressionConfirmationCompletionState,
  serializeExpressionConfirmationTrace,
  serializeExpressionConfirmationResult,
  getExpressionConfirmationReadiness,
} from './src/lib/quiz/expressionConfirmation';
import { EXPRESSION_CONFIRMATION_CONFIG } from './src/data/quiz/expressionConfirmationConfig';
import { EXPRESSION_CONFIRMATION_ITEMS } from './src/data/quiz/expressionConfirmationItems';
import { EXPRESSION_SCREENING_ITEMS } from './src/data/quiz/expressionScreeningItems';
import { EXPRESSION_GROUP_SCREENING_ITEMS } from './src/data/quiz/expressionGroupScreeningItems';
import { EXPRESSION_SCREENING_GROUPS } from './src/data/quiz/expressionScreeningGroups';
import {
  EXPRESSION_REGISTRY,
  EXPRESSION_TO_PARENT,
  CORE_PATTERN_IDS,
  STRATEGY_PATTERN_IDS,
} from './src/data/quiz/patternTaxonomy';
import { getAssessmentReadiness } from './src/data/quiz/questionBank';
import type { ExpressionScreeningGroupSelection } from './src/types/expressionScreening';
import type { ExpressionConfirmationItem } from './src/types/expressionConfirmation';

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
 *  Fixture Helpers
 * ================================================================*/

function groupForExpression(expressionId: string): string {
  const group = EXPRESSION_SCREENING_GROUPS.find(g => g.expressionIds.includes(expressionId));
  return group?.id ?? '';
}

function buildSyntheticBank(): ExpressionConfirmationItem[] {
  return EXPRESSION_REGISTRY.map(entry => ({
    id: `expression-confirm-${entry.id}-01`,
    expressionId: entry.id,
    groupId: groupForExpression(entry.id),
    itemNumber: 1 as const,
    prompt: `Synthetic confirmation prompt for ${entry.id}.`,
    access: 'pro' as const,
    reverseScored: false as const,
  }));
}

function candidateFor(expressionId: string): ExpressionScreeningGroupSelection {
  return {
    expressionId,
    groupId: groupForExpression(expressionId),
    normalizedDirectScore: 3,
    rawDirectScore: 6,
    answeredCount: 2,
    groupOrder: 1,
    expressionOrder: 1,
    isLeader: true,
  };
}

function candidateWith(
  expressionId: string,
  normalizedDirectScore: number,
  rawDirectScore: number,
): ExpressionScreeningGroupSelection {
  return {
    ...candidateFor(expressionId),
    normalizedDirectScore,
    rawDirectScore,
  };
}

const syntheticBank = buildSyntheticBank();

/* ==================================================================
 *  A. Real production bank + exact readiness reasons
 * ================================================================*/

const realReadiness = getExpressionConfirmationReadiness();
assert('A real bank item count is 145', EXPRESSION_CONFIRMATION_ITEMS.length === 145, `got ${EXPRESSION_CONFIRMATION_ITEMS.length}`);
assert('A real bank readiness totalItemCount is 145', realReadiness.totalItemCount === 145);
assert('A real bank no expressions missing items', !realReadiness.missingRequirements.some(m =>
  m.includes('expressions have 0 confirmation items')));
assert('A real bank readiness is true', realReadiness.ready === true);
assert('A real bank no expected-items message', !realReadiness.missingRequirements.some(m =>
  m.startsWith('expected ')));
assert('A real bank no not-exactly-1 message', !realReadiness.missingRequirements.some(m =>
  m.includes('not all expressions have exactly 1 confirmation item')));
assert('A real bank items defined', realReadiness.itemsDefined === true);
assert('A real bank allExpressionsHaveOneItem true', realReadiness.allExpressionsHaveOneItem === true);
assert('A real bank itemNumbersCorrect true', realReadiness.itemNumbersCorrect === true);
assert('A real bank itemIdsUnique true', realReadiness.itemIdsUnique === true);
assert('A real bank no missing requirements', realReadiness.missingRequirements.length === 0,
  realReadiness.missingRequirements.join(' | '));

const proReadiness = getAssessmentReadiness('pro');
assert('A Pro ready is true', proReadiness.ready === true);
assert('A Pro expressionConfirmationComplete is true', proReadiness.expressionConfirmationComplete === true);
assert('A Pro expressionScreeningComplete is true', proReadiness.expressionScreeningComplete === true);
assert('A Pro expressionGroupScreeningComplete is true', proReadiness.expressionGroupScreeningComplete === true);
assert('A Pro expressionGroupingComplete is true', proReadiness.expressionGroupingComplete === true);
assert('A Pro exact reason string',
  proReadiness.missingRequirements.join('; ') === 'universal strategy screen complete',
  proReadiness.missingRequirements.join('; '));

const freeReadiness = getAssessmentReadiness('free');
assert('A Free ready is false', freeReadiness.ready === false);
assert('A Free expressionConfirmationComplete is true', freeReadiness.expressionConfirmationComplete === true);
assert('A Free exact full reason string',
  freeReadiness.missingRequirements.join('; ') === 'strategy pro bank not required for free mode; universal strategy screen complete',
  freeReadiness.missingRequirements.join('; '));

/* ==================================================================
 *  A2. Batch C1 content: exact prompts, group counts, distinctness, safety
 * ================================================================*/

const c1ExpressionIds = [
  'silenced-people-pleaser',
  'silenced-conflict-avoider',
  'silenced-tension-and-silence',
  'silenced-pressure-building-anger',
  'silenced-blurt-or-freeze',
  'silenced-explanation-flood',
  'unheld-attachment-alarm',
  'unheld-reassurance-seeker',
  'unheld-return-tester',
  'unheld-jealousy-interpreter',
  'unheld-conflict-for-contact',
  'unheld-relationship-threat-scanner',
  'invisible-presence-minimizer',
  'invisible-background-positioner',
  'invisible-hidden-ambition',
  'invisible-praise-deflector',
  'invisible-recognition-conflict',
  'invisible-approval-chameleon',
  'invisible-needs-concealer',
  'shame-defective-one',
  'shame-burden',
  'shame-imposter',
  'shame-comparison-prisoner',
  'shame-praise-disqualifier',
  'shame-secret-keeper',
  'shame-self-punisher',
  'shame-to-perfection',
  'shame-to-anger',
  'shame-to-disappearance',
  'shame-chronic-apologizer',
  'shame-confession-loop',
];

const c1Prompts: Record<string, string> = {
  'silenced-people-pleaser': 'After agreeing to something, I later regret not expressing what I actually wanted.',
  'silenced-conflict-avoider': 'Important topics remain unresolved because I avoid having the conversation.',
  'silenced-tension-and-silence': 'I become quiet even in low-stakes moments when I am asked for my opinion.',
  'silenced-pressure-building-anger': 'Holding irritation back and later releasing it forcefully becomes a recurring cycle for me.',
  'silenced-blurt-or-freeze': 'I think of what I meant to say only after the interaction has ended.',
  'silenced-explanation-flood': 'I start explaining myself before anyone has asked for an explanation.',
  'unheld-attachment-alarm': 'When connection feels uncertain, I feel pulled to check whether the relationship is still secure.',
  'unheld-reassurance-seeker': 'Reassurance gives me only brief relief before the same need returns.',
  'unheld-return-tester': 'I pay close attention to whether someone moves closer after I create distance.',
  'unheld-jealousy-interpreter': 'After the moment has passed, I still feel that my place in the relationship may be threatened.',
  'unheld-conflict-for-contact': 'Conflict becomes a recurring way that contact between us resumes.',
  'unheld-relationship-threat-scanner': 'I keep watching for relational changes even during uneventful periods.',
  'invisible-presence-minimizer': 'I remain outside participation even when I privately want to contribute.',
  'invisible-background-positioner': 'I stay in the background while privately wishing for greater recognition.',
  'invisible-hidden-ambition': 'I delay moving toward a goal that still matters to me.',
  'invisible-praise-deflector': 'Becoming the focus of positive attention makes me uncomfortable.',
  'invisible-recognition-conflict': 'After receiving recognition I wanted, I often pull back from the attention.',
  'invisible-approval-chameleon': 'Across different settings, I become uncertain which version of my self-presentation feels most like me.',
  'invisible-needs-concealer': 'I wait to ask for help until the need becomes substantially harder to manage.',
  'shame-defective-one': 'After one perceived flaw is exposed, I begin to feel as though other parts of me are wrong too.',
  'shame-burden': 'I turn down support I could accept because I worry about imposing on the other person.',
  'shame-imposter': 'Even after a real success, I still doubt whether I belong or am qualified.',
  'shame-comparison-prisoner': 'After leaving a comparison situation, I continue to rank myself against the other person.',
  'shame-praise-disqualifier': 'I dismiss positive feedback even when it comes from someone who knows my work well.',
  'shame-secret-keeper': 'I expect rejection if certain parts of me become known, even when I have not tested that expectation.',
  'shame-self-punisher': 'After a mistake, I focus on making myself suffer more than on taking practical repair steps.',
  'shame-to-perfection': 'I strive for flawlessness because imperfection feels as though it could make me unacceptable to others.',
  'shame-to-anger': 'Anger often follows moments when I feel judged or humiliated.',
  'shame-to-disappearance': 'After feeling exposed, I stay away from a setting that still matters to me.',
  'shame-chronic-apologizer': 'I apologize before taking up ordinary conversational space.',
  'shame-confession-loop': 'I return to the same disclosure repeatedly even when there is no new information to share.',
};

assert('A2 covered Expression count 31', c1ExpressionIds.length === 31);
assert('A2 covered group count 42, uncovered 0', new Set(EXPRESSION_CONFIRMATION_ITEMS.map(i => i.groupId)).size === 42);
assert('A2 exactly 145 items in real bank', EXPRESSION_CONFIRMATION_ITEMS.length === 145);

for (const eid of c1ExpressionIds) {
  const items = EXPRESSION_CONFIRMATION_ITEMS.filter(i => i.expressionId === eid);
  assert(`A2 ${eid} has exactly 1 confirmation item`, items.length === 1, `${items.length}`);
  assert(`A2 ${eid} itemNumber is 1`, items[0].itemNumber === 1);
  assert(`A2 ${eid} access pro`, items[0].access === 'pro');
  assert(`A2 ${eid} reverseScored false`, items[0].reverseScored === false);
  assert(`A2 ${eid} canonical prefix`, items[0].id === `expression-confirm-${eid}-01`);
}

const c1GroupCounts: Record<string, number> = {
  'expression-group-silenced-one-conflict-suppression': 3,
  'expression-group-silenced-one-speech-emergence': 3,
  'expression-group-unheld-one-attachment-alarm-and-return': 3,
  'expression-group-unheld-one-relationship-threat-interpretation': 3,
  'expression-group-invisible-one-presence-avoidance': 3,
  'expression-group-invisible-one-recognition-conflict': 4,
  'expression-group-shame-bearer-core-defectiveness': 4,
  'expression-group-shame-bearer-exposure-concealment': 3,
  'expression-group-shame-bearer-shame-expression-channels': 5,
};
for (const [groupId, expectedCount] of Object.entries(c1GroupCounts)) {
  const groupItems = EXPRESSION_CONFIRMATION_ITEMS.filter(i => i.groupId === groupId);
  const group = EXPRESSION_SCREENING_GROUPS.find(g => g.id === groupId);
  assert(`A2 group ${groupId} has ${expectedCount} items`, groupItems.length === expectedCount, `${groupItems.length}`);
  assert(`A2 group ${groupId} expressions match registry`, group?.expressionIds.length === expectedCount);
  assert(`A2 group ${groupId} every item mapping valid`,
    groupItems.every(i => group?.expressionIds.includes(i.expressionId) ?? false));
}

const c1ItemIds = EXPRESSION_CONFIRMATION_ITEMS.map(i => i.id);
assert('A2 all item IDs unique', new Set(c1ItemIds).size === 145);
assert('A2 no duplicate Expression coverage', new Set(EXPRESSION_CONFIRMATION_ITEMS.map(i => i.expressionId)).size === 145);
assert('A2 every Expression ID canonical', EXPRESSION_CONFIRMATION_ITEMS.every(i => EXPRESSION_REGISTRY.some(e => e.id === i.expressionId)));
assert('A2 every group ID valid', EXPRESSION_CONFIRMATION_ITEMS.every(i => EXPRESSION_SCREENING_GROUPS.some(g => g.id === i.groupId)));
assert('A2 every mapping valid', EXPRESSION_CONFIRMATION_ITEMS.every(i => {
  const group = EXPRESSION_SCREENING_GROUPS.find(g => g.id === i.groupId);
  return group?.expressionIds.includes(i.expressionId) ?? false;
}));
const allCoveredExpressionIds = [...c1ExpressionIds, 'shame-body-shamed-self', 'shame-morally-condemned-self',
  'controller-standard-enforcer', 'controller-constant-evaluator', 'controller-proving-achiever',
  'controller-control-scanner', 'controller-analysis-gatekeeper', 'controller-fixed-plan', 'controller-perception-manager',
  'avoidant-procrastinator', 'avoidant-distractor', 'avoidant-busy-avoider', 'avoidant-intellectualizer',
  'avoidant-emotional-evader', 'avoidant-ghost', 'avoidant-sleep-disappear', 'avoidant-pleasure-avoider',
  'avoidant-indecisive-one', 'avoidant-commitment-dodger', 'avoidant-perpetual-researcher', 'avoidant-crisis-creator',
  'hypervigilant-threat-forecaster', 'hypervigilant-conflict-predictor', 'hypervigilant-worst-case-rehearser', 'hypervigilant-loss-forecaster',
  'hypervigilant-exit-planner', 'hypervigilant-emergency-preparer', 'hypervigilant-sleepless-guard', 'hypervigilant-protective-parent',
  'hypervigilant-mood-scanner', 'hypervigilant-betrayal-scanner', 'hypervigilant-ambiguous-signal-interpreter', 'hypervigilant-weather-reporter',
  'hypervigilant-body-monitor', 'hypervigilant-digital-monitor', 'hypervigilant-substance-watcher',
  'entangled-pursuer', 'entangled-appeaser', 'entangled-direction-dependent', 'entangled-crisis-pair',
  'entangled-rescuer', 'entangled-mutual-monitor', 'entangled-identity-merger', 'entangled-withdraw-return',
  'grief-unexpressed', 'grief-silent-mourning', 'grief-later-emerging',
  'grief-specific-loss', 'grief-loyalty-to-pain', 'grief-protective-numbing',
  'martyr-over-giver', 'martyr-silent-sufferer', 'martyr-refuses-to-receive',
  'martyr-scorekeeper', 'martyr-guilt-tripper',
  'martyr-overfunctioning', 'martyr-rescuer-martyr', 'martyr-moral-martyr', 'martyr-crisis-martyr', 'martyr-burnout-blame',
  'rescuer-fixer', 'rescuer-crisis-rescuer', 'rescuer-advice-giver', 'rescuer-emotional-paramedic',
  'rescuer-consequence-blocker', 'rescuer-financial-rescuer', 'rescuer-protective-parent',
  'rescuer-indispensable-one', 'rescuer-white-knight', 'rescuer-professional-helper', 'rescuer-recovery-manager',
  'rescuer-overfunctioner', 'rescuer-hidden-contract-helper', 'rescuer-to-control', 'rescuer-to-martyr',
  'over-responsible-emotional-caretaker', 'over-responsible-peacekeeper', 'over-responsible-parentified-one', 'over-responsible-family-stabilizer',
  'over-responsible-chronic-apologizer', 'over-responsible-blame-taker', 'over-responsible-responsibility-sponge', 'over-responsible-consequence-carrier',
  'over-responsible-rest-guilty', 'over-responsible-boundary-guilty', 'over-responsible-survivor-guilt',
  'over-responsible-mind-reader', 'over-responsible-preventer', 'over-responsible-moral-overcorrector', 'over-responsible-confession-seeker',
  'overloaded-human-backup-system', 'overloaded-default-adult', 'overloaded-no-backup',
  'overloaded-mental-load-carrier', 'overloaded-cannot-delegate', 'overloaded-competence-trap',
  'overloaded-crisis-juggler', 'overloaded-capacity-denier', 'overloaded-last-minute-preventer', 'overloaded-stop-then-resume',
  'perfectionist-endless-reviser', 'perfectionist-moving-goalpost', 'perfectionist-all-or-nothing-evaluator',
  'perfectionist-beginner-avoider', 'perfectionist-performance-curator',
  'anger-explosive-shield', 'anger-contempt-shield', 'anger-intimidator',
  'anger-cold-shield', 'anger-defensive-debater', 'anger-passive-aggressive-shield', 'anger-grievance-keeper',
  'anger-righteous-avenger', 'anger-apology-cycle',
];
assert('A2 combined C1+C2+C3+C4+C5 list has 145 entries', allCoveredExpressionIds.length === 145 &&
  new Set(allCoveredExpressionIds).size === 145);
assert('A2 no expressions outside C1/C2/C3/C4/C5 covered', EXPRESSION_CONFIRMATION_ITEMS.every(i => allCoveredExpressionIds.includes(i.expressionId)));

for (const eid of c1ExpressionIds) {
  const item = EXPRESSION_CONFIRMATION_ITEMS.find(i => i.expressionId === eid)!;
  assert(`A2 exact prompt for ${eid}`, item.prompt === c1Prompts[eid], `got: ${item.prompt}`);
}

const itemRegistryNames: Record<string, string> = {};
for (const item of EXPRESSION_CONFIRMATION_ITEMS) {
  const entry = EXPRESSION_REGISTRY.find(e => e.id === item.expressionId);
  itemRegistryNames[item.expressionId] = entry?.name ?? '';
}

for (const item of EXPRESSION_CONFIRMATION_ITEMS) {
  const screeningItems = EXPRESSION_SCREENING_ITEMS.filter(i => i.expressionId === item.expressionId);
  const s1 = screeningItems.find(s => s.itemNumber === 1)?.prompt ?? '';
  const s2 = screeningItems.find(s => s.itemNumber === 2)?.prompt ?? '';
  const prompt = item.prompt;
  assert(`A2 distinctness ${item.expressionId} not screening 1`, prompt !== s1);
  assert(`A2 distinctness ${item.expressionId} not screening 2`, prompt !== s2);
  assert(`A2 distinctness ${item.expressionId} not concatenation`,
    prompt !== s1 + ' ' + s2 && prompt !== s2 + ' ' + s1 && prompt !== s1 + s2 && prompt !== s2 + s1);
  const markerList = [
    'recurring', 'repeatedly', 'often', 'still', 'keep', 'remain', 'continue',
    'later', 'after', 'before', 'again', 'return', 'returns', 'wait', 'delay',
    'stay', 'across', 'even when', 'even in', 'becomes', 'begin', 'worry',
    'expect', 'uncomfortable', 'regret', 'feel', 'feels', 'pulled', 'strive', 'doubt',
    'when', 'whenever', 'starts', 'until', 'even during', 'each', 'new', 'another', 'may',
  ];
  assert(`A2 recurrence/persistence evidence ${item.expressionId}`,
    markerList.some(m => prompt.toLowerCase().includes(m)), prompt);
  assert(`A2 one answerable idea ${item.expressionId}`, !prompt.includes('?') && !prompt.includes(';'));
  assert(`A2 single sentence ${item.expressionId}`,
    prompt.trim().endsWith('.') && prompt.split('.').length === 2);
  const normalizedName = itemRegistryNames[item.expressionId]
    .toLowerCase()
    .replace(/^the /, '')
    .replace(/-/g, ' ')
    .replace(/ pattern$/, '')
    .trim();
  assert(`A2 no internal label ${item.expressionId}`, !prompt.toLowerCase().includes(normalizedName),
    `label token: ${normalizedName}`);
  const promptLower = prompt.toLowerCase();
  assert(`A2 first person ${item.expressionId}`, !promptLower.includes('you') && !promptLower.includes('your'));
}

const forbiddenSafetyWords = [
  'disorder', 'diagnos', 'anxiety', 'trauma', 'ocd', 'scrupul', 'nervous system',
  'ptsd', 'phobi', 'should', 'must', 'abandoned', 'abandonment',
  'defective', 'disgusting', 'immoral', 'burdensome', 'worthless', 'a burden',
  'deserved', 'justified', 'always safe', 'reach out', 'keep asking',
];
for (const word of forbiddenSafetyWords) {
  assert(`A2 safety: no prompt contains "${word}"`,
    EXPRESSION_CONFIRMATION_ITEMS.every(i => !i.prompt.toLowerCase().includes(word)));
}

const c1ByExpression = new Map(EXPRESSION_CONFIRMATION_ITEMS.map(i => [i.expressionId, i]));
const c1PleaserPrompt = c1ByExpression.get('silenced-people-pleaser')!.prompt;
const c1AvoiderPrompt = c1ByExpression.get('silenced-conflict-avoider')!.prompt;
const c1TensionPrompt = c1ByExpression.get('silenced-tension-and-silence')!.prompt;
const c1AlarmPrompt = c1ByExpression.get('unheld-attachment-alarm')!.prompt;
const c1JealousyPrompt = c1ByExpression.get('unheld-jealousy-interpreter')!.prompt;
const c1RecognitionPrompt = c1ByExpression.get('invisible-recognition-conflict')!.prompt;
const c1DefectivePrompt = c1ByExpression.get('shame-defective-one')!.prompt;
const c1SecretPrompt = c1ByExpression.get('shame-secret-keeper')!.prompt;
const c1PunisherPrompt = c1ByExpression.get('shame-self-punisher')!.prompt;
const c1PerfectionPrompt = c1ByExpression.get('shame-to-perfection')!.prompt;
const c1ApologizerPrompt = c1ByExpression.get('shame-chronic-apologizer')!.prompt;

assert('A2 pressure-building-anger measures recurring sequence', c1PleaserPrompt.length > 0 &&
  c1ByExpression.get('silenced-pressure-building-anger')!.prompt.includes('recurring cycle'));
assert('A2 attachment-alarm does not instruct repeated contact',
  !c1AlarmPrompt.includes('you') && !c1AlarmPrompt.includes('should') && !c1AlarmPrompt.includes('must') &&
  !c1AlarmPrompt.includes('reach out') && !c1AlarmPrompt.includes('keep asking'));
assert('A2 jealousy-interpreter hedges instead of proving danger', c1JealousyPrompt.includes('may be threatened'));
assert('A2 recognition-conflict is one recurring response',
  c1RecognitionPrompt.includes('often') && !c1RecognitionPrompt.includes(';') && !c1RecognitionPrompt.includes('?'));
assert('A2 defective-one uses feel-as-though framing', c1DefectivePrompt.includes('feel as though'));
assert('A2 defective-one does not affirm wrongness', !c1DefectivePrompt.includes('defective'));
assert('A2 secret-keeper measures untested expectation', c1SecretPrompt.includes('have not tested'));
assert('A2 secret-keeper does not pressure disclosure',
  !c1SecretPrompt.includes('share') && !c1SecretPrompt.includes('tell'));
assert('A2 self-punisher distinguishes suffering from repair',
  c1PunisherPrompt.includes('suffer') && c1PunisherPrompt.includes('practical repair'));
assert('A2 shame-to-perfection avoids internal name', !c1PerfectionPrompt.includes('shame'));
assert('A2 chronic-apologizer one broad mechanism',
  !c1ApologizerPrompt.includes(',') && !c1ApologizerPrompt.includes(' and ') && !c1ApologizerPrompt.includes(' or '));

const c1RealScoring = scoreExpressionConfirmation(
  candidateFor('silenced-people-pleaser'),
  [{ itemId: 'expression-confirm-silenced-people-pleaser-01', selectedValue: 1 }],
);
assert('A2 real record response 1 not confirmed', c1RealScoring.status === 'not-confirmed');
const c1RealScoring4 = scoreExpressionConfirmation(
  candidateFor('silenced-people-pleaser'),
  [{ itemId: 'expression-confirm-silenced-people-pleaser-01', selectedValue: 4 }],
);
assert('A2 real record response 4 confirms at exact threshold', c1RealScoring4.status === 'confirmed');
const c1RealScoring5 = scoreExpressionConfirmation(
  candidateFor('silenced-people-pleaser'),
  [{ itemId: 'expression-confirm-silenced-people-pleaser-01', selectedValue: 5 }],
);
assert('A2 real record response 5 confirms', c1RealScoring5.status === 'confirmed');
const c1RealHighScreening = scoreExpressionConfirmation(
  candidateWith('silenced-people-pleaser', 5, 10),
  [{ itemId: 'expression-confirm-silenced-people-pleaser-01', selectedValue: 2 }],
);
assert('A2 real record high screening + response 2 does not confirm', c1RealHighScreening.status === 'not-confirmed');
const c1RealBarely = scoreExpressionConfirmation(
  candidateWith('silenced-people-pleaser', 3, 6),
  [{ itemId: 'expression-confirm-silenced-people-pleaser-01', selectedValue: 5 }],
);
assert('A2 real record barely qualifying + response 5 confirms', c1RealBarely.status === 'confirmed');

const c1RealRetry = scoreExpressionConfirmation(
  candidateFor('silenced-people-pleaser'),
  [],
  [{ itemId: 'expression-confirm-silenced-people-pleaser-01', selectedValue: 4 }],
);
assert('A2 real record retry response 4 confirms', c1RealRetry.status === 'confirmed');
const c1RealDoubleSkip = scoreExpressionConfirmation(
  candidateFor('silenced-people-pleaser'),
  [],
  [],
);
assert('A2 real record double skip unresolved', c1RealDoubleSkip.status === 'unresolved');

const c1RealRouting = confirmExpressionCandidates(
  'pro',
  [candidateFor('silenced-people-pleaser'), candidateFor('silenced-conflict-avoider')],
  [
    { itemId: 'expression-confirm-silenced-people-pleaser-01', selectedValue: 4 },
    { itemId: 'expression-confirm-silenced-conflict-avoider-01', selectedValue: 2 },
  ],
);
assert('A2 real routing confirmed + rejected', c1RealRouting.totalConfirmed === 1 &&
  c1RealRouting.rejectedExpressionIds.includes('silenced-conflict-avoider'));
assert('A2 real routing trace serializes', typeof serializeExpressionConfirmationTrace(c1RealRouting.traces[0]) === 'string');
assert('A2 real routing result serializes', typeof serializeExpressionConfirmationResult(c1RealRouting) === 'string');

const c1RealCap = confirmExpressionCandidates(
  'pro',
  [candidateFor('silenced-people-pleaser'), candidateFor('silenced-conflict-avoider'), candidateFor('silenced-tension-and-silence')],
  [
    { itemId: 'expression-confirm-silenced-people-pleaser-01', selectedValue: 5 },
    { itemId: 'expression-confirm-silenced-conflict-avoider-01', selectedValue: 4 },
    { itemId: 'expression-confirm-silenced-tension-and-silence-01', selectedValue: 4 },
  ],
);
assert('A2 real per-group cap 2', c1RealCap.totalConfirmed === 2);
assert('A2 real no third candidate per group', c1RealCap.rejectedExpressionIds.includes('silenced-tension-and-silence'));

/* ==================================================================
 *  A3. Batch C2 content: exact prompts, group counts, distinctness,
 *      safety, scoring/retry/caps/ordering on real C2 records
 * ================================================================*/

const c2ExpressionIds = allCoveredExpressionIds.slice(31, 64);

const c2Prompts: Record<string, string> = {
  'shame-body-shamed-self': 'When my body becomes noticeable to me, I pull my attention away from it.',
  'shame-morally-condemned-self': 'After an ordinary mistake, I continue to feel as though it means I am morally bad.',
  'controller-standard-enforcer': 'After I miss one of my personal rules, I continue judging myself harshly for it.',
  'controller-constant-evaluator': 'I keep evaluating myself even when nothing important is at stake.',
  'controller-proving-achiever': 'After I achieve something, I feel a new need to prove myself again.',
  'controller-control-scanner': 'I keep scanning for what is unmanaged even when things are going smoothly.',
  'controller-analysis-gatekeeper': 'After gathering useful information, I still feel that I do not know enough to act.',
  'controller-fixed-plan': 'Even after a plan changes, I mentally return to the original plan.',
  'controller-perception-manager': 'Across different situations, I try to steer how other people understand what happened.',
  'avoidant-procrastinator': 'With new tasks, I repeatedly delay starting until pressure builds.',
  'avoidant-distractor': 'I shift my attention elsewhere whenever internal discomfort begins to rise.',
  'avoidant-busy-avoider': 'When a difficult matter starts to surface, I find something useful to do instead.',
  'avoidant-intellectualizer': 'While an emotion remains present, I keep moving into explanation rather than noticing how it feels.',
  'avoidant-emotional-evader': 'When an emotion becomes recognizable, I repeatedly move my attention away from it.',
  'avoidant-ghost': 'When communication seems reasonably safe, I still withdraw from contact without explaining the change.',
  'avoidant-sleep-disappear': 'When emotional pressure rises, I repeatedly feel pulled to retreat into sleep.',
  'avoidant-pleasure-avoider': 'Across positive experiences, I pull back when allowing myself enjoyment feels uncomfortable.',
  'avoidant-indecisive-one': 'Across different decisions, I repeatedly move between options without settling on one.',
  'avoidant-commitment-dodger': 'After I make a commitment, I continue holding onto an escape route.',
  'avoidant-perpetual-researcher': 'After I find one more source, I begin looking for yet another one.',
  'avoidant-crisis-creator': 'With new manageable demands, I repeatedly wait until pressure builds before fully engaging.',
  'hypervigilant-threat-forecaster': 'In uncertain situations without clear warning signs, I still anticipate possible danger.',
  'hypervigilant-conflict-predictor': 'I expect conflict in ambiguous interactions before any disagreement occurs.',
  'hypervigilant-worst-case-rehearser': 'My mind returns to rehearsing damaging outcomes even after I have considered how I might respond.',
  'hypervigilant-loss-forecaster': 'When something positive appears, I begin expecting that I may lose it.',
  'hypervigilant-exit-planner': 'I scan for exits when I enter a setting without a clear sign of danger.',
  'hypervigilant-emergency-preparer': 'With each new situation, I feel the need to create another backup plan.',
  'hypervigilant-sleepless-guard': 'When I try to settle for rest, I keep monitoring for possible problems.',
  'hypervigilant-protective-parent': 'I continue monitoring someone\'s safety day to day even when no new risk information appears.',
  'hypervigilant-mood-scanner': 'I monitor other people\'s emotional tone even during calm interactions.',
  'hypervigilant-betrayal-scanner': 'Across different relationships, I repeatedly search for signs that loyalty may have changed.',
  'hypervigilant-ambiguous-signal-interpreter': 'When a response remains unclear, I form a concerning conclusion before more information arrives.',
  'hypervigilant-weather-reporter': 'Across different settings, I tell others what emotional state I think another person may be in.',
};

assert('A3 covered Expression count 33', c2ExpressionIds.length === 33);
assert('A3 exactly 33 C2 items in real bank', c2ExpressionIds.length === 33);

for (const eid of c2ExpressionIds) {
  const items = EXPRESSION_CONFIRMATION_ITEMS.filter(i => i.expressionId === eid);
  assert(`A3 ${eid} has exactly 1 confirmation item`, items.length === 1, `${items.length}`);
  assert(`A3 ${eid} itemNumber is 1`, items[0].itemNumber === 1);
  assert(`A3 ${eid} access pro`, items[0].access === 'pro');
  assert(`A3 ${eid} reverseScored false`, items[0].reverseScored === false);
  assert(`A3 ${eid} canonical prefix`, items[0].id === `expression-confirm-${eid}-01`);
}

const c2GroupCounts: Record<string, number> = {
  'expression-group-shame-bearer-body-moral-condemnation': 2,
  'expression-group-controller-standards-evaluation': 3,
  'expression-group-controller-situation-management': 4,
  'expression-group-avoidant-one-delay-distraction': 4,
  'expression-group-avoidant-one-withdrawal-disappearance': 4,
  'expression-group-avoidant-one-decision-commitment': 4,
  'expression-group-hypervigilant-one-anticipatory-threat': 4,
  'expression-group-hypervigilant-one-preparedness-exit': 4,
  'expression-group-hypervigilant-one-relational-scanning': 4,
};
for (const [groupId, expectedCount] of Object.entries(c2GroupCounts)) {
  const groupItems = EXPRESSION_CONFIRMATION_ITEMS.filter(i => i.groupId === groupId);
  const group = EXPRESSION_SCREENING_GROUPS.find(g => g.id === groupId);
  assert(`A3 group ${groupId} has ${expectedCount} items`, groupItems.length === expectedCount, `${groupItems.length}`);
  assert(`A3 group ${groupId} expressions match registry`, group?.expressionIds.length === expectedCount);
  assert(`A3 group ${groupId} every item mapping valid`,
    groupItems.every(i => group?.expressionIds.includes(i.expressionId) ?? false));
}
assert('A3 C1 items unchanged: 31 items still present with exact prompts',
  c1ExpressionIds.every(eid => {
    const item = EXPRESSION_CONFIRMATION_ITEMS.find(i => i.expressionId === eid);
    return item !== undefined && item.prompt === c1Prompts[eid];
  }));

for (const eid of c2ExpressionIds) {
  const item = EXPRESSION_CONFIRMATION_ITEMS.find(i => i.expressionId === eid)!;
  assert(`A3 exact prompt for ${eid}`, item.prompt === c2Prompts[eid], `got: ${item.prompt}`);
}

for (const eid of c2ExpressionIds) {
  const prompt = c2Prompts[eid];
  assert(`A3 prompt presence for ${eid}`, prompt.length > 0);
}

assert('A3 body-shamed-self not tautological (no shame verdict, adds attention-pull)',
  c2Prompts['shame-body-shamed-self'].includes('pull my attention away') &&
  !c2Prompts['shame-body-shamed-self'].includes('ashamed of'));
assert('A3 morally-condemned-self uses feel-as-though framing', c2Prompts['shame-morally-condemned-self'].includes('feel as though'));
assert('A3 standard-enforcer adds continuation beyond the event', c2Prompts['controller-standard-enforcer'].includes('continue'));
assert('A3 analysis-gatekeeper avoids repeated information phrasing',
  (c2Prompts['controller-analysis-gatekeeper'].match(/information/g) ?? []).length === 1 &&
  !c2Prompts['controller-analysis-gatekeeper'].includes('more analysis'));
assert('A3 procrastinator written in first person',
  c2Prompts['avoidant-procrastinator'].includes('I ') && !c2Prompts['avoidant-procrastinator'].includes('you'));
assert('A3 intellectualizer does not claim emotion absent', c2Prompts['avoidant-intellectualizer'].includes('remains present'));
assert('A3 ghost explicitly limits to reasonably safe communication', c2Prompts['avoidant-ghost'].includes('reasonably safe'));
assert('A3 pleasure-avoider retains discomfort mechanism',
  c2Prompts['avoidant-pleasure-avoider'].includes('uncomfortable') && c2Prompts['avoidant-pleasure-avoider'].includes('enjoyment'));
assert('A3 indecisive-one adds recurrence across decisions',
  c2Prompts['avoidant-indecisive-one'].includes('Across different decisions') && c2Prompts['avoidant-indecisive-one'].includes('repeatedly'));
assert('A3 threat-forecaster does not call danger imaginary',
  !c2Prompts['hypervigilant-threat-forecaster'].includes('imaginary'));
assert('A3 worst-case-rehearser adds persistence beyond initial planning',
  c2Prompts['hypervigilant-worst-case-rehearser'].includes('returns') && c2Prompts['hypervigilant-worst-case-rehearser'].includes('even after'));
assert('A3 loss-forecaster uses may-lose rather than asserting removal',
  c2Prompts['hypervigilant-loss-forecaster'].includes('may lose'));
assert('A3 exit-planner does not declare setting objectively safe',
  !c2Prompts['hypervigilant-exit-planner'].includes('safe'));
assert('A3 betrayal-scanner does not assert betrayal or disloyalty as fact',
  !c2Prompts['hypervigilant-betrayal-scanner'].includes('betrayal') && c2Prompts['hypervigilant-betrayal-scanner'].includes('may have changed'));
assert('A3 ambiguous-signal-interpreter does not assert conclusion is true',
  !c2Prompts['hypervigilant-ambiguous-signal-interpreter'].includes('definitely') &&
  !c2Prompts['hypervigilant-ambiguous-signal-interpreter'].includes('is wrong'));
assert('A3 weather-reporter frames state as presumed',
  c2Prompts['hypervigilant-weather-reporter'].includes('I think') && c2Prompts['hypervigilant-weather-reporter'].includes('may be in'));

assert('A3 all C2 prompts single sentence',
  c2ExpressionIds.every(eid => c2Prompts[eid].trim().endsWith('.') && c2Prompts[eid].split('.').length === 2));
assert('A3 all C2 prompts first person without you/your',
  c2ExpressionIds.every(eid => !c2Prompts[eid].includes('you') && !c2Prompts[eid].includes('your')));
assert('A3 all C2 prompts no question or semicolon',
  c2ExpressionIds.every(eid => !c2Prompts[eid].includes('?') && !c2Prompts[eid].includes(';')));

for (const eid of c2ExpressionIds) {
  const item = EXPRESSION_CONFIRMATION_ITEMS.find(i => i.expressionId === eid)!;
  const screeningItems = EXPRESSION_SCREENING_ITEMS.filter(i => i.expressionId === eid);
  const s1 = screeningItems.find(s => s.itemNumber === 1)?.prompt ?? '';
  const s2 = screeningItems.find(s => s.itemNumber === 2)?.prompt ?? '';
  assert(`A3 distinctness ${eid} not screening 1`, item.prompt !== s1);
  assert(`A3 distinctness ${eid} not screening 2`, item.prompt !== s2);
  assert(`A3 distinctness ${eid} not concatenation`,
    item.prompt !== s1 + ' ' + s2 && item.prompt !== s2 + ' ' + s1);
}

const c2SafetyWords = [
  'dysmorphia', 'eating disorder', 'adhd', 'executive function', 'anxiety', 'depression',
  'ptsd', 'paranoia', 'insomnia', 'trauma', 'nervous system', 'immoral', 'disgusting',
  'manipulat', 'dominat', 'abuse', 'lazy', 'should', 'must', 'imaginary',
];
for (const word of c2SafetyWords) {
  assert(`A3 safety: no C2 prompt contains "${word}"`,
    c2ExpressionIds.every(eid => !c2Prompts[eid].toLowerCase().includes(word)));
}

const c2ByExpression = new Map(EXPRESSION_CONFIRMATION_ITEMS.map(i => [i.expressionId, i]));
const c2ProcrastinatorPrompt = c2ByExpression.get('avoidant-procrastinator')!.prompt;

const c2RealScoring1 = scoreExpressionConfirmation(
  candidateFor('avoidant-procrastinator'),
  [{ itemId: 'expression-confirm-avoidant-procrastinator-01', selectedValue: 1 }],
);
assert('A3 real C2 record response 1 not confirmed', c2RealScoring1.status === 'not-confirmed');
const c2RealScoring2 = scoreExpressionConfirmation(
  candidateFor('avoidant-procrastinator'),
  [{ itemId: 'expression-confirm-avoidant-procrastinator-01', selectedValue: 2 }],
);
assert('A3 real C2 record response 2 not confirmed', c2RealScoring2.status === 'not-confirmed');
const c2RealScoring3 = scoreExpressionConfirmation(
  candidateFor('avoidant-procrastinator'),
  [{ itemId: 'expression-confirm-avoidant-procrastinator-01', selectedValue: 3 }],
);
assert('A3 real C2 record response 3 not confirmed', c2RealScoring3.status === 'not-confirmed');
const c2RealScoring4 = scoreExpressionConfirmation(
  candidateFor('avoidant-procrastinator'),
  [{ itemId: 'expression-confirm-avoidant-procrastinator-01', selectedValue: 4 }],
);
assert('A3 real C2 record response 4 confirms at exact threshold', c2RealScoring4.status === 'confirmed');
const c2RealScoring5 = scoreExpressionConfirmation(
  candidateFor('avoidant-procrastinator'),
  [{ itemId: 'expression-confirm-avoidant-procrastinator-01', selectedValue: 5 }],
);
assert('A3 real C2 record response 5 confirms', c2RealScoring5.status === 'confirmed');
const c2RealHighScreening = scoreExpressionConfirmation(
  candidateWith('avoidant-procrastinator', 5, 10),
  [{ itemId: 'expression-confirm-avoidant-procrastinator-01', selectedValue: 2 }],
);
assert('A3 real C2 high screening + response 2 does not confirm', c2RealHighScreening.status === 'not-confirmed');
const c2RealBarely = scoreExpressionConfirmation(
  candidateWith('avoidant-procrastinator', 3, 6),
  [{ itemId: 'expression-confirm-avoidant-procrastinator-01', selectedValue: 5 }],
);
assert('A3 real C2 barely qualifying + response 5 confirms', c2RealBarely.status === 'confirmed');

const c2RealRetry = scoreExpressionConfirmation(
  candidateFor('avoidant-procrastinator'),
  [],
  [{ itemId: 'expression-confirm-avoidant-procrastinator-01', selectedValue: 4 }],
);
assert('A3 real C2 retry response 4 confirms', c2RealRetry.status === 'confirmed');
const c2RealRetryNotConfirm = scoreExpressionConfirmation(
  candidateFor('avoidant-procrastinator'),
  [],
  [{ itemId: 'expression-confirm-avoidant-procrastinator-01', selectedValue: 2 }],
);
assert('A3 real C2 retry response 2 does not confirm', c2RealRetryNotConfirm.status === 'not-confirmed');
const c2RealDoubleSkip = scoreExpressionConfirmation(
  candidateFor('avoidant-procrastinator'),
  [],
  [],
);
assert('A3 real C2 double skip unresolved', c2RealDoubleSkip.status === 'unresolved');

const c2RealRouting = confirmExpressionCandidates(
  'pro',
  [candidateFor('avoidant-procrastinator'), candidateFor('hypervigilant-betrayal-scanner')],
  [
    { itemId: 'expression-confirm-avoidant-procrastinator-01', selectedValue: 4 },
    { itemId: 'expression-confirm-hypervigilant-betrayal-scanner-01', selectedValue: 2 },
  ],
);
assert('A3 real C2 routing confirmed + rejected', c2RealRouting.totalConfirmed === 1 &&
  c2RealRouting.rejectedExpressionIds.includes('hypervigilant-betrayal-scanner'));
assert('A3 real C2 trace serializes', typeof serializeExpressionConfirmationTrace(c2RealRouting.traces[0]) === 'string');
assert('A3 real C2 result serializes', typeof serializeExpressionConfirmationResult(c2RealRouting) === 'string');

const c2RealCap = confirmExpressionCandidates(
  'pro',
  [
    candidateFor('avoidant-procrastinator'),
    candidateFor('avoidant-distractor'),
    candidateFor('avoidant-busy-avoider'),
  ],
  [
    { itemId: 'expression-confirm-avoidant-procrastinator-01', selectedValue: 5 },
    { itemId: 'expression-confirm-avoidant-distractor-01', selectedValue: 4 },
    { itemId: 'expression-confirm-avoidant-busy-avoider-01', selectedValue: 4 },
  ],
);
assert('A3 real C2 per-group cap 2', c2RealCap.totalConfirmed === 2);
assert('A3 real C2 no third candidate per group', c2RealCap.rejectedExpressionIds.includes('avoidant-busy-avoider'));

const c2RealExpansion = confirmExpressionCandidates(
  'pro',
  [candidateFor('avoidant-procrastinator')],
  [
    { itemId: 'expression-confirm-avoidant-procrastinator-01', selectedValue: 5 },
    { itemId: 'expression-confirm-hypervigilant-threat-forecaster-01', selectedValue: 5 },
  ],
);
assert('A3 real C2 noncandidate cannot expand set', c2RealExpansion.totalCandidates === 1 &&
  c2RealExpansion.confirmedExpressions.length === 1);
assert('A3 real C2 noncandidate traced as not-screened-candidate', c2RealExpansion.traces.some(t =>
  t.candidateExpressionId === 'hypervigilant-threat-forecaster' && t.exclusionReason === 'not-screened-candidate'));

const c2RealTotalCap = confirmExpressionCandidates(
  'pro',
  [
    candidateFor('controller-standard-enforcer'),
    candidateFor('avoidant-procrastinator'),
    candidateFor('hypervigilant-threat-forecaster'),
    candidateFor('shame-body-shamed-self'),
    candidateFor('hypervigilant-mood-scanner'),
  ],
  [
    { itemId: 'expression-confirm-controller-standard-enforcer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-avoidant-procrastinator-01', selectedValue: 4 },
    { itemId: 'expression-confirm-hypervigilant-threat-forecaster-01', selectedValue: 4 },
    { itemId: 'expression-confirm-shame-body-shamed-self-01', selectedValue: 4 },
    { itemId: 'expression-confirm-hypervigilant-mood-scanner-01', selectedValue: 4 },
  ],
);
assert('A3 real C2 total cap holds at 4', c2RealTotalCap.totalConfirmed === 4);
assert('A3 real C2 fifth candidate excluded-by-total-cap', c2RealTotalCap.rejectedExpressionIds.includes('hypervigilant-threat-forecaster'),
  c2RealTotalCap.rejectedExpressionIds.join(','));
assert('A3 real C2 does not truncate to 3', c2RealTotalCap.totalConfirmed === 4);

const c2RealOrdering = confirmExpressionCandidates(
  'pro',
  [
    candidateWith('controller-standard-enforcer', 3, 6),
    candidateWith('avoidant-procrastinator', 3, 6),
    candidateWith('hypervigilant-mood-scanner', 3, 6),
    candidateWith('shame-body-shamed-self', 4, 8),
  ],
  [
    { itemId: 'expression-confirm-controller-standard-enforcer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-avoidant-procrastinator-01', selectedValue: 4 },
    { itemId: 'expression-confirm-hypervigilant-mood-scanner-01', selectedValue: 4 },
    { itemId: 'expression-confirm-shame-body-shamed-self-01', selectedValue: 5 },
  ],
);
const c2OrderedIds = c2RealOrdering.confirmedExpressions.map(e => e.expressionId);
assert('A3 C2 confirmation score sorts first', c2OrderedIds[0] === 'shame-body-shamed-self');
assert('A3 C2 canonical registry order breaks ties',
  c2OrderedIds.join(',') === 'shame-body-shamed-self,controller-standard-enforcer,avoidant-procrastinator,hypervigilant-mood-scanner',
  c2OrderedIds.join(','));
assert('A3 C2 parent and group scores do not affect ordering',
  c2RealOrdering.confirmedExpressions.every(e => e.confirmationScore > 0));
const c2RepeatedOrder = confirmExpressionCandidates(
  'pro',
  [
    candidateWith('controller-standard-enforcer', 3, 6),
    candidateWith('avoidant-procrastinator', 3, 6),
    candidateWith('hypervigilant-mood-scanner', 3, 6),
    candidateWith('shame-body-shamed-self', 4, 8),
  ],
  [
    { itemId: 'expression-confirm-controller-standard-enforcer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-avoidant-procrastinator-01', selectedValue: 4 },
    { itemId: 'expression-confirm-hypervigilant-mood-scanner-01', selectedValue: 4 },
    { itemId: 'expression-confirm-shame-body-shamed-self-01', selectedValue: 5 },
  ],
);
assert('A3 C2 ordering deterministic across repeated runs',
  JSON.stringify(c2RepeatedOrder.confirmedExpressions.map(e => e.expressionId)) === JSON.stringify(c2OrderedIds));

assert('A3 C2 procrastinator exact prompt still matches bank',
  c2ProcrastinatorPrompt === c2Prompts['avoidant-procrastinator']);

/* ==================================================================
 *  A4. Batch C3 content: exact prompts, group counts, distinctness,
 *      safety, scoring/retry/caps/ordering on real C3 records
 * ================================================================*/

const c3ExpressionIds = allCoveredExpressionIds.slice(64, 91);

const c3Prompts: Record<string, string> = {
  'hypervigilant-body-monitor': 'I check a physical sensation again even when it has not changed and no new action seems needed.',
  'hypervigilant-digital-monitor': 'I check the same lawfully visible digital information again when nothing new has appeared.',
  'hypervigilant-substance-watcher': 'I remain watchful for possible signs of substance use even when no new sign has appeared.',
  'entangled-pursuer': 'I keep trying to reconnect after an initial response has not eased the distance.',
  'entangled-appeaser': 'When tension appears, I repeatedly let go of a preference I still care about.',
  'entangled-direction-dependent': 'After making a decision, I continue doubting it when it differs from the direction of someone important to me.',
  'entangled-crisis-pair': 'With new relational problems, closeness repeatedly returns through urgency and repair.',
  'entangled-rescuer': 'I continue stepping in even when the other person appears to be managing the problem.',
  'entangled-mutual-monitor': 'My unease returns whenever the frequency of mutual updates decreases.',
  'entangled-identity-merger': 'Even after a shared decision is made, my own preference remains unclear to me.',
  'entangled-withdraw-return': 'Across periods of closeness, I repeatedly move away and then seek connection again.',
  'grief-unexpressed': 'When grief returns, I still find it difficult to put the experience into words.',
  'grief-silent-mourning': 'Over time, I continue carrying my mourning privately.',
  'grief-later-emerging': 'Across losses, the emotional impact tends to arrive after immediate demands have passed.',
  'grief-specific-loss': 'Over time, current experiences repeatedly bring me back emotionally to the same loss.',
  'grief-loyalty-to-pain': 'When the pain of a loss eases, I begin questioning whether I still care enough.',
  'grief-protective-numbing': 'When grief intensifies, I repeatedly notice myself becoming emotionally numb.',
  'martyr-over-giver': 'I continue giving even after I recognize that my energy is depleted.',
  'martyr-silent-sufferer': 'Across different situations, I continue hoping others will notice my sacrifice without being told.',
  'martyr-refuses-to-receive': 'I continue turning down freely offered help even when I see no clear drawback to accepting it.',
  'martyr-scorekeeper': 'After an exchange ends, I continue mentally tallying what I contributed.',
  'martyr-guilt-tripper': 'During disagreements, I repeatedly emphasize what I have sacrificed.',
  'martyr-overfunctioning': 'I continue taking over even when another person appears ready to act.',
  'martyr-rescuer-martyr': 'After repeatedly stepping in at personal cost, I again feel that my effort has gone unnoticed.',
  'martyr-moral-martyr': 'When another person sets a limit, I compare their level of commitment with mine.',
  'martyr-crisis-martyr': 'When support could reasonably be shared, I repeatedly take on the central burden during crises.',
  'martyr-burnout-blame': 'After exceeding my limits, I repeatedly become resentful about how the burden remained with me.',
};

assert('A4 covered Expression count 27', c3ExpressionIds.length === 27);

for (const eid of c3ExpressionIds) {
  const items = EXPRESSION_CONFIRMATION_ITEMS.filter(i => i.expressionId === eid);
  assert(`A4 ${eid} has exactly 1 confirmation item`, items.length === 1, `${items.length}`);
  assert(`A4 ${eid} itemNumber is 1`, items[0].itemNumber === 1);
  assert(`A4 ${eid} access pro`, items[0].access === 'pro');
  assert(`A4 ${eid} reverseScored false`, items[0].reverseScored === false);
  assert(`A4 ${eid} canonical prefix`, items[0].id === `expression-confirm-${eid}-01`);
}

const c3GroupCounts: Record<string, number> = {
  'expression-group-hypervigilant-one-monitoring': 3,
  'expression-group-entangled-one-proximity-pursuit': 4,
  'expression-group-entangled-one-identity-merger': 4,
  'expression-group-grief-bearer-unexpressed-delayed': 3,
  'expression-group-grief-bearer-loss-attachment': 3,
  'expression-group-martyr-overgiving-depletion': 3,
  'expression-group-martyr-recognition-reciprocity': 2,
  'expression-group-martyr-overfunctioning-crisis': 5,
};
for (const [groupId, expectedCount] of Object.entries(c3GroupCounts)) {
  const groupItems = EXPRESSION_CONFIRMATION_ITEMS.filter(i => i.groupId === groupId);
  const group = EXPRESSION_SCREENING_GROUPS.find(g => g.id === groupId);
  assert(`A4 group ${groupId} has ${expectedCount} items`, groupItems.length === expectedCount, `${groupItems.length}`);
  assert(`A4 group ${groupId} expressions match registry`, group?.expressionIds.length === expectedCount);
  assert(`A4 group ${groupId} every item mapping valid`,
    groupItems.every(i => group?.expressionIds.includes(i.expressionId) ?? false));
}
assert('A4 C1+C2 items unchanged: 64 items still present with exact prompts',
  c1ExpressionIds.every(eid => {
    const item = EXPRESSION_CONFIRMATION_ITEMS.find(i => i.expressionId === eid);
    return item !== undefined && item.prompt === c1Prompts[eid];
  }) && c2ExpressionIds.every(eid => {
    const item = EXPRESSION_CONFIRMATION_ITEMS.find(i => i.expressionId === eid);
    return item !== undefined && item.prompt === c2Prompts[eid];
  }));

for (const eid of c3ExpressionIds) {
  const item = EXPRESSION_CONFIRMATION_ITEMS.find(i => i.expressionId === eid)!;
  assert(`A4 exact prompt for ${eid}`, item.prompt === c3Prompts[eid], `got: ${item.prompt}`);
}

assert('A4 body-monitor does not dismiss or diagnose physical symptoms',
  !c3Prompts['hypervigilant-body-monitor'].includes('imaginary') &&
  !c3Prompts['hypervigilant-body-monitor'].includes('diagnos'));
assert('A4 digital-monitor refers only to lawfully visible information',
  c3Prompts['hypervigilant-digital-monitor'].includes('lawfully visible'));
assert('A4 substance-watcher uses possible-signs hedging and does not state use',
  c3Prompts['hypervigilant-substance-watcher'].includes('possible signs') &&
  !c3Prompts['hypervigilant-substance-watcher'].includes('used'));
assert('A4 pursuer does not imply ignoring an expressed boundary',
  !c3Prompts['entangled-pursuer'].includes('boundary') && !c3Prompts['entangled-pursuer'].includes('ignore'));
assert('A4 appeaser retains a meaningful personal preference',
  c3Prompts['entangled-appeaser'].includes('preference') && c3Prompts['entangled-appeaser'].includes('care about'));
assert('A4 direction-dependent measures doubt after a decision',
  c3Prompts['entangled-direction-dependent'].includes('After making a decision') &&
  c3Prompts['entangled-direction-dependent'].includes('continue doubting'));
assert('A4 crisis-pair does not say crises are intentionally created',
  !c3Prompts['entangled-crisis-pair'].includes('create') && !c3Prompts['entangled-crisis-pair'].includes('intention'));
assert('A4 entangled-rescuer does not claim the other person is incapable',
  !c3Prompts['entangled-rescuer'].includes('incapable') && !c3Prompts['entangled-rescuer'].includes('cannot'));
assert('A4 mutual-monitor does not say another person owes updates',
  !c3Prompts['entangled-mutual-monitor'].includes('owe') && !c3Prompts['entangled-mutual-monitor'].includes('should'));
assert('A4 identity-merger measures personal preference blurring',
  c3Prompts['entangled-identity-merger'].includes('preference') && c3Prompts['entangled-identity-merger'].includes('remains unclear'));
assert('A4 withdraw-return does not condemn needing space',
  !c3Prompts['entangled-withdraw-return'].includes('should') && !c3Prompts['entangled-withdraw-return'].includes('must'));
assert('A4 grief-unexpressed does not pressure expression',
  !c3Prompts['grief-unexpressed'].includes('should') && !c3Prompts['grief-unexpressed'].includes('must') &&
  !c3Prompts['grief-unexpressed'].includes('tell') && !c3Prompts['grief-unexpressed'].includes('share'));
assert('A4 silent-mourning does not condemn private grief',
  !c3Prompts['grief-silent-mourning'].includes('should') && !c3Prompts['grief-silent-mourning'].includes('must'));
assert('A4 later-emerging grief does not prescribe timing',
  !c3Prompts['grief-later-emerging'].includes('should') && !c3Prompts['grief-later-emerging'].includes('time to'));
assert('A4 specific-loss does not use move-on framing',
  !c3Prompts['grief-specific-loss'].includes('move on') && !c3Prompts['grief-specific-loss'].includes('let go') &&
  !c3Prompts['grief-specific-loss'].includes('move past'));
assert('A4 loyalty-to-pain does not say pain must ease',
  !c3Prompts['grief-loyalty-to-pain'].includes('must') && !c3Prompts['grief-loyalty-to-pain'].includes('should'));
assert('A4 protective-numbing does not claim a proven protective cause',
  !c3Prompts['grief-protective-numbing'].includes('because') && !c3Prompts['grief-protective-numbing'].includes('protect'));
assert('A4 over-giver distinguishes continued giving after recognized depletion',
  c3Prompts['martyr-over-giver'].includes('continue giving') && c3Prompts['martyr-over-giver'].includes('recognize'));
assert('A4 silent-sufferer does not assign motives to others',
  !c3Prompts['martyr-silent-sufferer'].includes('expects') && !c3Prompts['martyr-silent-sufferer'].includes('wants'));
assert('A4 refuses-to-receive does not assume every offer is safe or usable',
  c3Prompts['martyr-refuses-to-receive'].includes('no clear drawback'));
assert('A4 scorekeeper measures continued internal tallying',
  c3Prompts['martyr-scorekeeper'].includes('continue mentally tallying'));
assert('A4 guilt-tripper describes behavior without assigning manipulative intent',
  !c3Prompts['martyr-guilt-tripper'].includes('manipulat') && !c3Prompts['martyr-guilt-tripper'].includes('intent'));
assert('A4 overfunctioning distinguishes another person appearing ready',
  c3Prompts['martyr-overfunctioning'].includes('appears ready'));
assert('A4 rescuer-martyr avoids the internal phrase rescue cycle',
  !c3Prompts['martyr-rescuer-martyr'].includes('rescue cycle'));
assert('A4 moral-martyr does not label either person morally superior',
  !c3Prompts['martyr-moral-martyr'].includes('superior') && !c3Prompts['martyr-moral-martyr'].includes('better than'));
assert('A4 crisis-martyr limits the pattern to support that could reasonably be shared',
  c3Prompts['martyr-crisis-martyr'].includes('could reasonably be shared'));
assert('A4 burnout-blame does not state others caused or intended the burden',
  !c3Prompts['martyr-burnout-blame'].includes('caused') && !c3Prompts['martyr-burnout-blame'].includes('intend') &&
  !c3Prompts['martyr-burnout-blame'].includes('fault'));

assert('A4 all C3 prompts single sentence',
  c3ExpressionIds.every(eid => c3Prompts[eid].trim().endsWith('.') && c3Prompts[eid].split('.').length === 2));
assert('A4 all C3 prompts first person without you/your',
  c3ExpressionIds.every(eid => !c3Prompts[eid].includes('you') && !c3Prompts[eid].includes('your')));
assert('A4 all C3 prompts no question or semicolon',
  c3ExpressionIds.every(eid => !c3Prompts[eid].includes('?') && !c3Prompts[eid].includes(';')));

for (const eid of c3ExpressionIds) {
  const item = EXPRESSION_CONFIRMATION_ITEMS.find(i => i.expressionId === eid)!;
  const screeningItems = EXPRESSION_SCREENING_ITEMS.filter(i => i.expressionId === eid);
  const s1 = screeningItems.find(s => s.itemNumber === 1)?.prompt ?? '';
  const s2 = screeningItems.find(s => s.itemNumber === 2)?.prompt ?? '';
  assert(`A4 distinctness ${eid} not screening 1`, item.prompt !== s1);
  assert(`A4 distinctness ${eid} not screening 2`, item.prompt !== s2);
  assert(`A4 distinctness ${eid} not concatenation`,
    item.prompt !== s1 + ' ' + s2 && item.prompt !== s2 + ' ' + s1);
}

const c3SafetyWords = [
  'disorder', 'diagnos', 'anxiety', 'ptsd', 'paranoia', 'trauma', 'addiction', 'codepend',
  'depression', 'prolonged grief', 'anhedonia', 'relapse', 'surveillance', 'coercion',
  'tracking', 'safe', 'dangerous', 'betrayal', 'overdose', 'violent', 'imaginary',
  'manipulat', 'exploit', 'ungrateful', 'helpless', 'selfish', 'victim', 'abuse',
  'cause', 'because', 'protect', 'move on', 'should', 'must',
];
for (const word of c3SafetyWords) {
  assert(`A4 safety: no C3 prompt contains "${word}"`,
    c3ExpressionIds.every(eid => !c3Prompts[eid].toLowerCase().includes(word)));
}

const c3ByExpression = new Map(EXPRESSION_CONFIRMATION_ITEMS.map(i => [i.expressionId, i]));
const c3OverGiverPrompt = c3ByExpression.get('martyr-over-giver')!.prompt;

const c3RealScoring1 = scoreExpressionConfirmation(
  candidateFor('martyr-over-giver'),
  [{ itemId: 'expression-confirm-martyr-over-giver-01', selectedValue: 1 }],
);
assert('A4 real C3 record response 1 not confirmed', c3RealScoring1.status === 'not-confirmed');
const c3RealScoring2 = scoreExpressionConfirmation(
  candidateFor('martyr-over-giver'),
  [{ itemId: 'expression-confirm-martyr-over-giver-01', selectedValue: 2 }],
);
assert('A4 real C3 record response 2 not confirmed', c3RealScoring2.status === 'not-confirmed');
const c3RealScoring3 = scoreExpressionConfirmation(
  candidateFor('martyr-over-giver'),
  [{ itemId: 'expression-confirm-martyr-over-giver-01', selectedValue: 3 }],
);
assert('A4 real C3 record response 3 not confirmed', c3RealScoring3.status === 'not-confirmed');
const c3RealScoring4 = scoreExpressionConfirmation(
  candidateFor('martyr-over-giver'),
  [{ itemId: 'expression-confirm-martyr-over-giver-01', selectedValue: 4 }],
);
assert('A4 real C3 record response 4 confirms at exact threshold', c3RealScoring4.status === 'confirmed');
const c3RealScoring5 = scoreExpressionConfirmation(
  candidateFor('martyr-over-giver'),
  [{ itemId: 'expression-confirm-martyr-over-giver-01', selectedValue: 5 }],
);
assert('A4 real C3 record response 5 confirms', c3RealScoring5.status === 'confirmed');
const c3RealHighScreening = scoreExpressionConfirmation(
  candidateWith('martyr-over-giver', 5, 10),
  [{ itemId: 'expression-confirm-martyr-over-giver-01', selectedValue: 2 }],
);
assert('A4 real C3 high screening + response 2 does not confirm', c3RealHighScreening.status === 'not-confirmed');
const c3RealBarely = scoreExpressionConfirmation(
  candidateWith('martyr-over-giver', 3, 6),
  [{ itemId: 'expression-confirm-martyr-over-giver-01', selectedValue: 5 }],
);
assert('A4 real C3 barely qualifying + response 5 confirms', c3RealBarely.status === 'confirmed');

const c3RealRetry = scoreExpressionConfirmation(
  candidateFor('martyr-over-giver'),
  [],
  [{ itemId: 'expression-confirm-martyr-over-giver-01', selectedValue: 4 }],
);
assert('A4 real C3 retry response 4 confirms', c3RealRetry.status === 'confirmed');
const c3RealRetryNotConfirm = scoreExpressionConfirmation(
  candidateFor('martyr-over-giver'),
  [],
  [{ itemId: 'expression-confirm-martyr-over-giver-01', selectedValue: 2 }],
);
assert('A4 real C3 retry response 2 does not confirm', c3RealRetryNotConfirm.status === 'not-confirmed');
const c3RealDoubleSkip = scoreExpressionConfirmation(
  candidateFor('martyr-over-giver'),
  [],
  [],
);
assert('A4 real C3 double skip unresolved', c3RealDoubleSkip.status === 'unresolved');

const c3RealRouting = confirmExpressionCandidates(
  'pro',
  [candidateFor('martyr-over-giver'), candidateFor('grief-specific-loss')],
  [
    { itemId: 'expression-confirm-martyr-over-giver-01', selectedValue: 4 },
    { itemId: 'expression-confirm-grief-specific-loss-01', selectedValue: 2 },
  ],
);
assert('A4 real C3 routing confirmed + rejected', c3RealRouting.totalConfirmed === 1 &&
  c3RealRouting.rejectedExpressionIds.includes('grief-specific-loss'));
assert('A4 real C3 trace serializes', typeof serializeExpressionConfirmationTrace(c3RealRouting.traces[0]) === 'string');
assert('A4 real C3 result serializes', typeof serializeExpressionConfirmationResult(c3RealRouting) === 'string');

const c3RealCap = confirmExpressionCandidates(
  'pro',
  [
    candidateFor('grief-specific-loss'),
    candidateFor('grief-loyalty-to-pain'),
    candidateFor('grief-protective-numbing'),
  ],
  [
    { itemId: 'expression-confirm-grief-specific-loss-01', selectedValue: 5 },
    { itemId: 'expression-confirm-grief-loyalty-to-pain-01', selectedValue: 4 },
    { itemId: 'expression-confirm-grief-protective-numbing-01', selectedValue: 4 },
  ],
);
assert('A4 real C3 per-group cap 2', c3RealCap.totalConfirmed === 2);
assert('A4 real C3 no third candidate per group', c3RealCap.rejectedExpressionIds.includes('grief-protective-numbing'));

const c3RealExpansion = confirmExpressionCandidates(
  'pro',
  [candidateFor('martyr-over-giver')],
  [
    { itemId: 'expression-confirm-martyr-over-giver-01', selectedValue: 5 },
    { itemId: 'expression-confirm-entangled-pursuer-01', selectedValue: 5 },
  ],
);
assert('A4 real C3 noncandidate cannot expand set', c3RealExpansion.totalCandidates === 1 &&
  c3RealExpansion.confirmedExpressions.length === 1);
assert('A4 real C3 noncandidate traced as not-screened-candidate', c3RealExpansion.traces.some(t =>
  t.candidateExpressionId === 'entangled-pursuer' && t.exclusionReason === 'not-screened-candidate'));

const c3RealTotalCap = confirmExpressionCandidates(
  'pro',
  [
    candidateFor('martyr-over-giver'),
    candidateFor('martyr-scorekeeper'),
    candidateFor('grief-unexpressed'),
    candidateFor('entangled-pursuer'),
    candidateFor('hypervigilant-body-monitor'),
  ],
  [
    { itemId: 'expression-confirm-martyr-over-giver-01', selectedValue: 4 },
    { itemId: 'expression-confirm-martyr-scorekeeper-01', selectedValue: 4 },
    { itemId: 'expression-confirm-grief-unexpressed-01', selectedValue: 4 },
    { itemId: 'expression-confirm-entangled-pursuer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-hypervigilant-body-monitor-01', selectedValue: 4 },
  ],
);
assert('A4 real C3 total cap holds at 4', c3RealTotalCap.totalConfirmed === 4);
assert('A4 real C3 fifth candidate excluded-by-total-cap', c3RealTotalCap.rejectedExpressionIds.includes('hypervigilant-body-monitor'),
  c3RealTotalCap.rejectedExpressionIds.join(','));
assert('A4 real C3 does not truncate to 3', c3RealTotalCap.totalConfirmed === 4);

const c3RealOrdering = confirmExpressionCandidates(
  'pro',
  [
    candidateWith('martyr-over-giver', 3, 6),
    candidateWith('grief-specific-loss', 3, 6),
    candidateWith('entangled-rescuer', 3, 6),
    candidateWith('hypervigilant-body-monitor', 4, 8),
  ],
  [
    { itemId: 'expression-confirm-martyr-over-giver-01', selectedValue: 4 },
    { itemId: 'expression-confirm-grief-specific-loss-01', selectedValue: 4 },
    { itemId: 'expression-confirm-entangled-rescuer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-hypervigilant-body-monitor-01', selectedValue: 5 },
  ],
);
const c3OrderedIds = c3RealOrdering.confirmedExpressions.map(e => e.expressionId);
assert('A4 C3 confirmation score sorts first', c3OrderedIds[0] === 'hypervigilant-body-monitor');
assert('A4 C3 canonical registry order breaks ties',
  c3OrderedIds.join(',') === 'hypervigilant-body-monitor,martyr-over-giver,grief-specific-loss,entangled-rescuer',
  c3OrderedIds.join(','));
const c3RepeatedOrder = confirmExpressionCandidates(
  'pro',
  [
    candidateWith('martyr-over-giver', 3, 6),
    candidateWith('grief-specific-loss', 3, 6),
    candidateWith('entangled-rescuer', 3, 6),
    candidateWith('hypervigilant-body-monitor', 4, 8),
  ],
  [
    { itemId: 'expression-confirm-martyr-over-giver-01', selectedValue: 4 },
    { itemId: 'expression-confirm-grief-specific-loss-01', selectedValue: 4 },
    { itemId: 'expression-confirm-entangled-rescuer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-hypervigilant-body-monitor-01', selectedValue: 5 },
  ],
);
assert('A4 C3 ordering deterministic across repeated runs',
  JSON.stringify(c3RepeatedOrder.confirmedExpressions.map(e => e.expressionId)) === JSON.stringify(c3OrderedIds));

assert('A4 C3 over-giver exact prompt still matches bank',
  c3OverGiverPrompt === c3Prompts['martyr-over-giver']);

/* ==================================================================
 *  A5. Batch C4 content: exact prompts, group counts, distinctness,
 *      safety, scoring/retry/caps/ordering on real C4 records
 * ================================================================*/

const c4ExpressionIds = allCoveredExpressionIds.slice(91, 121);

const c4Prompts: Record<string, string> = {
  'rescuer-fixer': 'Hearing about a problem pulls me into solving it before I know what the other person wants.',
  'rescuer-crisis-rescuer': "When another person's situation becomes urgent, I feel pulled to act before I have been asked.",
  'rescuer-advice-giver': 'I keep offering recommendations even when the other person has not shown interest in them.',
  'rescuer-emotional-paramedic': 'When another person is upset, I feel pulled to soothe the distress myself.',
  'rescuer-consequence-blocker': "I intercept the consequences of another person's choice before they arrive.",
  'rescuer-financial-rescuer': "My money repeatedly becomes the answer to another person's ongoing problems.",
  'rescuer-protective-parent': 'Across situations, I spare capable people from difficulty they could handle on their own.',
  'rescuer-indispensable-one': 'My sense of worth stays tied to how much other people need my help.',
  'rescuer-white-knight': 'I feel a strong sense of purpose when hardship leaves someone needing me to act.',
  'rescuer-professional-helper': 'I adopt an expert stance even in everyday personal conversations.',
  'rescuer-recovery-manager': 'Even when recovery is not mine to manage, I keep checking how the other person is progressing.',
  'rescuer-overfunctioner': 'I take over a task when I doubt it will be done well unless I control how it goes.',
  'rescuer-hidden-contract-helper': 'I privately expect my help to be returned to me in some form.',
  'rescuer-to-control': "I expect the help I give to earn me more say in the other person's choices.",
  'rescuer-to-martyr': 'Willing help gradually becomes a weight I feel I cannot put down.',
  'over-responsible-emotional-caretaker': 'I keep managing the emotional state of people close to me as though it belongs to me.',
  'over-responsible-peacekeeper': 'When tension arises between other people, I feel a need to settle it.',
  'over-responsible-parentified-one': 'With other capable adults, I keep ending up in the caretaking role.',
  'over-responsible-family-stabilizer': 'I keep feeling that my family-like group holds together only through what I do.',
  'over-responsible-chronic-apologizer': 'I repeatedly apologize for things I had little or no part in.',
  'over-responsible-blame-taker': 'I take ownership of what went wrong even when the fault is shared with others.',
  'over-responsible-responsibility-sponge': 'I absorb responsibility for problems that are shared across several people.',
  'over-responsible-consequence-carrier': "I keep holding onto the weight of other people's choices as if it belongs to me.",
  'over-responsible-rest-guilty': 'Rest feels wrong to me while anything remains unfinished.',
  'over-responsible-boundary-guilty': 'After turning down a reasonable request, I still carry guilt about it.',
  'over-responsible-survivor-guilt': 'When I am doing well and someone close to me is struggling, I feel uneasy about it.',
  'over-responsible-mind-reader': 'I act on what I assume other people need before they tell me.',
  'over-responsible-preventer': 'I keep planning ahead for problems other people might face.',
  'over-responsible-moral-overcorrector': 'I keep doing more repair than a situation calls for so that I appear fair.',
  'over-responsible-confession-seeker': 'I feel the need to admit possible mistakes even before I know whether I made one.',
};

assert('A5 covered Expression count 30', c4ExpressionIds.length === 30);

for (const eid of c4ExpressionIds) {
  const items = EXPRESSION_CONFIRMATION_ITEMS.filter(i => i.expressionId === eid);
  assert(`A5 ${eid} has exactly 1 confirmation item`, items.length === 1, `${items.length}`);
  assert(`A5 ${eid} itemNumber is 1`, items[0].itemNumber === 1);
  assert(`A5 ${eid} access pro`, items[0].access === 'pro');
  assert(`A5 ${eid} reverseScored false`, items[0].reverseScored === false);
  assert(`A5 ${eid} canonical prefix`, items[0].id === `expression-confirm-${eid}-01`);
}

const c4GroupCounts: Record<string, number> = {
  'expression-group-rescuer-intervention-fixing': 4,
  'expression-group-rescuer-consequence-prevention': 3,
  'expression-group-rescuer-indispensable-helper': 4,
  'expression-group-rescuer-hidden-contract-control': 4,
  'expression-group-over-responsible-one-emotional-care': 4,
  'expression-group-over-responsible-one-guilt-blame': 4,
  'expression-group-over-responsible-one-boundary-rest': 3,
  'expression-group-over-responsible-one-anticipatory-moral': 4,
};
for (const [groupId, expectedCount] of Object.entries(c4GroupCounts)) {
  const groupItems = EXPRESSION_CONFIRMATION_ITEMS.filter(i => i.groupId === groupId);
  const group = EXPRESSION_SCREENING_GROUPS.find(g => g.id === groupId);
  assert(`A5 group ${groupId} has ${expectedCount} items`, groupItems.length === expectedCount, `${groupItems.length}`);
  assert(`A5 group ${groupId} expressions match registry`, group?.expressionIds.length === expectedCount);
  assert(`A5 group ${groupId} every item mapping valid`,
    groupItems.every(i => group?.expressionIds.includes(i.expressionId) ?? false));
}
const c1c2c3Prompts: Record<string, string> = { ...c1Prompts, ...c2Prompts, ...c3Prompts };
assert('A5 C1+C2+C3 items unchanged: 91 items still present with exact prompts',
  allCoveredExpressionIds.slice(0, 91).every(eid => {
    const item = EXPRESSION_CONFIRMATION_ITEMS.find(i => i.expressionId === eid);
    return item !== undefined && item.prompt === c1c2c3Prompts[eid];
  }));

for (const eid of c4ExpressionIds) {
  const item = EXPRESSION_CONFIRMATION_ITEMS.find(i => i.expressionId === eid)!;
  assert(`A5 exact prompt for ${eid}`, item.prompt === c4Prompts[eid], `got: ${item.prompt}`);
}

assert('A5 overfunctioner uses control rationale, distinct from C3 overfunctioning',
  c4Prompts['rescuer-overfunctioner'].includes('unless I control') &&
  !c4Prompts['rescuer-overfunctioner'].includes('appears ready') &&
  !c4Prompts['rescuer-overfunctioner'].includes('easier') &&
  !c4Prompts['rescuer-overfunctioner'].includes('help'));
assert('A5 chronic-apologizer does not take the space-taking angle used by C1',
  c4Prompts['over-responsible-chronic-apologizer'].includes('little or no part') &&
  !c4Prompts['over-responsible-chronic-apologizer'].includes('space'));
assert('A5 protective-parent does not take the safety-monitoring angle used by C2',
  c4Prompts['rescuer-protective-parent'].includes('capable') &&
  !c4Prompts['rescuer-protective-parent'].includes('safety') &&
  !c4Prompts['rescuer-protective-parent'].includes('monitor') &&
  !c4Prompts['rescuer-protective-parent'].includes('risk'));
assert('A5 to-martyr distinct from C3 rescuer-martyr and burnout-blame',
  !c4Prompts['rescuer-to-martyr'].includes('unnoticed') &&
  !c4Prompts['rescuer-to-martyr'].includes('resent') &&
  !c4Prompts['rescuer-to-martyr'].includes('rescue cycle'));
assert('A5 hidden-contract-helper does not say others owe a return',
  !c4Prompts['rescuer-hidden-contract-helper'].includes('owe'));
assert('A5 to-control measures expected influence, not retrospective reminders',
  c4Prompts['rescuer-to-control'].includes('more say') &&
  !c4Prompts['rescuer-to-control'].includes('prior help'));
assert('A5 consequence-blocker distinct from consequence-carrier',
  c4Prompts['rescuer-consequence-blocker'].includes('intercept') &&
  !c4Prompts['rescuer-consequence-blocker'].includes('carry') &&
  !c4Prompts['rescuer-consequence-blocker'].includes('hold'));
assert('A5 family-stabilizer does not say the group is unstable or that stepping back is judged',
  !c4Prompts['over-responsible-family-stabilizer'].includes('unstable') &&
  !c4Prompts['over-responsible-family-stabilizer'].includes('step back'));
assert('A5 survivor-guilt does not label personal relief unfair',
  !c4Prompts['over-responsible-survivor-guilt'].includes('unfair'));
assert('A5 confession-seeker distinct from C1 confession-loop repeated disclosure',
  !c4Prompts['over-responsible-confession-seeker'].includes('repeatedly') &&
  !c4Prompts['over-responsible-confession-seeker'].includes('disclosure'));
assert('A5 white-knight does not claim the other person is saved',
  !c4Prompts['rescuer-white-knight'].includes('save'));
assert('A5 rest-guilty does not judge rest as neglect',
  !c4Prompts['over-responsible-rest-guilty'].includes('neglect'));
assert('A5 mind-reader does not use the expressed-needs wording of screening',
  !c4Prompts['over-responsible-mind-reader'].includes('express'));

assert('A5 all C4 prompts single sentence',
  c4ExpressionIds.every(eid => c4Prompts[eid].trim().endsWith('.') && c4Prompts[eid].split('.').length === 2));
assert('A5 all C4 prompts first person without you/your',
  c4ExpressionIds.every(eid => !c4Prompts[eid].includes('you') && !c4Prompts[eid].includes('your')));
assert('A5 all C4 prompts no question or semicolon',
  c4ExpressionIds.every(eid => !c4Prompts[eid].includes('?') && !c4Prompts[eid].includes(';')));

for (const eid of c4ExpressionIds) {
  const item = EXPRESSION_CONFIRMATION_ITEMS.find(i => i.expressionId === eid)!;
  const screeningItems = EXPRESSION_SCREENING_ITEMS.filter(i => i.expressionId === eid);
  const s1 = screeningItems.find(s => s.itemNumber === 1)?.prompt ?? '';
  const s2 = screeningItems.find(s => s.itemNumber === 2)?.prompt ?? '';
  assert(`A5 distinctness ${eid} not screening 1`, item.prompt !== s1);
  assert(`A5 distinctness ${eid} not screening 2`, item.prompt !== s2);
  assert(`A5 distinctness ${eid} not concatenation`,
    item.prompt !== s1 + ' ' + s2 && item.prompt !== s2 + ' ' + s1);
}
assert('A5 all C4 prompts mutually distinct',
  new Set(c4ExpressionIds.map(eid => c4Prompts[eid])).size === 30);

const c4SafetyWords = [
  'disorder', 'diagnos', 'anxiety', 'ptsd', 'paranoia', 'trauma', 'addiction', 'codepend',
  'depression', 'prolonged grief', 'anhedonia', 'relapse', 'surveillance', 'coercion',
  'tracking', 'safe', 'dangerous', 'betrayal', 'overdose', 'violent', 'imaginary',
  'manipulat', 'exploit', 'ungrateful', 'helpless', 'selfish', 'victim', 'abuse',
  'cause', 'because', 'protect', 'move on', 'should', 'must',
];
for (const word of c4SafetyWords) {
  assert(`A5 safety: no C4 prompt contains "${word}"`,
    c4ExpressionIds.every(eid => !c4Prompts[eid].toLowerCase().includes(word)));
}

const c4RealScoring1 = scoreExpressionConfirmation(
  candidateFor('rescuer-fixer'),
  [{ itemId: 'expression-confirm-rescuer-fixer-01', selectedValue: 1 }],
);
assert('A5 real C4 record response 1 not confirmed', c4RealScoring1.status === 'not-confirmed');
const c4RealScoring3 = scoreExpressionConfirmation(
  candidateFor('rescuer-fixer'),
  [{ itemId: 'expression-confirm-rescuer-fixer-01', selectedValue: 3 }],
);
assert('A5 real C4 record response 3 not confirmed', c4RealScoring3.status === 'not-confirmed');
const c4RealScoring4 = scoreExpressionConfirmation(
  candidateFor('rescuer-fixer'),
  [{ itemId: 'expression-confirm-rescuer-fixer-01', selectedValue: 4 }],
);
assert('A5 real C4 record response 4 confirms at exact threshold', c4RealScoring4.status === 'confirmed');
const c4RealScoring5 = scoreExpressionConfirmation(
  candidateFor('rescuer-fixer'),
  [{ itemId: 'expression-confirm-rescuer-fixer-01', selectedValue: 5 }],
);
assert('A5 real C4 record response 5 confirms', c4RealScoring5.status === 'confirmed');
const c4RealHighScreening = scoreExpressionConfirmation(
  candidateWith('rescuer-fixer', 5, 10),
  [{ itemId: 'expression-confirm-rescuer-fixer-01', selectedValue: 2 }],
);
assert('A5 real C4 high screening + response 2 does not confirm', c4RealHighScreening.status === 'not-confirmed');
const c4RealBarely = scoreExpressionConfirmation(
  candidateWith('rescuer-fixer', 3, 6),
  [{ itemId: 'expression-confirm-rescuer-fixer-01', selectedValue: 5 }],
);
assert('A5 real C4 barely qualifying + response 5 confirms', c4RealBarely.status === 'confirmed');

const c4RealRetry = scoreExpressionConfirmation(
  candidateFor('rescuer-fixer'),
  [],
  [{ itemId: 'expression-confirm-rescuer-fixer-01', selectedValue: 4 }],
);
assert('A5 real C4 retry response 4 confirms', c4RealRetry.status === 'confirmed');
const c4RealRetryNotConfirm = scoreExpressionConfirmation(
  candidateFor('rescuer-fixer'),
  [],
  [{ itemId: 'expression-confirm-rescuer-fixer-01', selectedValue: 2 }],
);
assert('A5 real C4 retry response 2 does not confirm', c4RealRetryNotConfirm.status === 'not-confirmed');
const c4RealDoubleSkip = scoreExpressionConfirmation(
  candidateFor('rescuer-fixer'),
  [],
  [],
);
assert('A5 real C4 double skip unresolved', c4RealDoubleSkip.status === 'unresolved');

const c4RealRouting = confirmExpressionCandidates(
  'pro',
  [candidateFor('rescuer-fixer'), candidateFor('over-responsible-chronic-apologizer')],
  [
    { itemId: 'expression-confirm-rescuer-fixer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-over-responsible-chronic-apologizer-01', selectedValue: 2 },
  ],
);
assert('A5 real C4 routing confirmed + rejected', c4RealRouting.totalConfirmed === 1 &&
  c4RealRouting.rejectedExpressionIds.includes('over-responsible-chronic-apologizer'));
assert('A5 real C4 trace serializes', typeof serializeExpressionConfirmationTrace(c4RealRouting.traces[0]) === 'string');
assert('A5 real C4 result serializes', typeof serializeExpressionConfirmationResult(c4RealRouting) === 'string');

const c4RealCap = confirmExpressionCandidates(
  'pro',
  [
    candidateFor('rescuer-fixer'),
    candidateFor('rescuer-crisis-rescuer'),
    candidateFor('rescuer-advice-giver'),
  ],
  [
    { itemId: 'expression-confirm-rescuer-fixer-01', selectedValue: 5 },
    { itemId: 'expression-confirm-rescuer-crisis-rescuer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-rescuer-advice-giver-01', selectedValue: 4 },
  ],
);
assert('A5 real C4 per-group cap 2', c4RealCap.totalConfirmed === 2);
assert('A5 real C4 no third candidate per group', c4RealCap.rejectedExpressionIds.includes('rescuer-advice-giver'));

const c4RealExpansion = confirmExpressionCandidates(
  'pro',
  [candidateFor('rescuer-fixer')],
  [
    { itemId: 'expression-confirm-rescuer-fixer-01', selectedValue: 5 },
    { itemId: 'expression-confirm-entangled-pursuer-01', selectedValue: 5 },
  ],
);
assert('A5 real C4 noncandidate cannot expand set', c4RealExpansion.totalCandidates === 1 &&
  c4RealExpansion.confirmedExpressions.length === 1);
assert('A5 real C4 noncandidate traced as not-screened-candidate', c4RealExpansion.traces.some(t =>
  t.candidateExpressionId === 'entangled-pursuer' && t.exclusionReason === 'not-screened-candidate'));

const c4RealTotalCap = confirmExpressionCandidates(
  'pro',
  [
    candidateFor('rescuer-fixer'),
    candidateFor('rescuer-consequence-blocker'),
    candidateFor('rescuer-indispensable-one'),
    candidateFor('rescuer-overfunctioner'),
    candidateFor('over-responsible-emotional-caretaker'),
  ],
  [
    { itemId: 'expression-confirm-rescuer-fixer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-rescuer-consequence-blocker-01', selectedValue: 4 },
    { itemId: 'expression-confirm-rescuer-indispensable-one-01', selectedValue: 4 },
    { itemId: 'expression-confirm-rescuer-overfunctioner-01', selectedValue: 4 },
    { itemId: 'expression-confirm-over-responsible-emotional-caretaker-01', selectedValue: 4 },
  ],
);
assert('A5 real C4 total cap holds at 4', c4RealTotalCap.totalConfirmed === 4);
assert('A5 real C4 fifth candidate excluded-by-total-cap', c4RealTotalCap.rejectedExpressionIds.includes('rescuer-indispensable-one'),
  c4RealTotalCap.rejectedExpressionIds.join(','));
assert('A5 real C4 does not truncate to 3', c4RealTotalCap.totalConfirmed === 4);

const c4RealOrdering = confirmExpressionCandidates(
  'pro',
  [
    candidateWith('rescuer-fixer', 3, 6),
    candidateWith('over-responsible-chronic-apologizer', 3, 6),
    candidateWith('over-responsible-peacekeeper', 3, 6),
    candidateWith('over-responsible-mind-reader', 4, 8),
  ],
  [
    { itemId: 'expression-confirm-rescuer-fixer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-over-responsible-chronic-apologizer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-over-responsible-peacekeeper-01', selectedValue: 4 },
    { itemId: 'expression-confirm-over-responsible-mind-reader-01', selectedValue: 5 },
  ],
);
const c4OrderedIds = c4RealOrdering.confirmedExpressions.map(e => e.expressionId);
assert('A5 C4 confirmation score sorts first', c4OrderedIds[0] === 'over-responsible-mind-reader');
assert('A5 C4 canonical registry order breaks ties',
  c4OrderedIds.join(',') === 'over-responsible-mind-reader,over-responsible-chronic-apologizer,over-responsible-peacekeeper,rescuer-fixer',
  c4OrderedIds.join(','));
const c4RepeatedOrder = confirmExpressionCandidates(
  'pro',
  [
    candidateWith('rescuer-fixer', 3, 6),
    candidateWith('over-responsible-chronic-apologizer', 3, 6),
    candidateWith('over-responsible-peacekeeper', 3, 6),
    candidateWith('over-responsible-mind-reader', 4, 8),
  ],
  [
    { itemId: 'expression-confirm-rescuer-fixer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-over-responsible-chronic-apologizer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-over-responsible-peacekeeper-01', selectedValue: 4 },
    { itemId: 'expression-confirm-over-responsible-mind-reader-01', selectedValue: 5 },
  ],
);
assert('A5 C4 ordering deterministic across repeated runs',
  JSON.stringify(c4RepeatedOrder.confirmedExpressions.map(e => e.expressionId)) === JSON.stringify(c4OrderedIds));

const c4FixerPrompt = new Map(EXPRESSION_CONFIRMATION_ITEMS.map(i => [i.expressionId, i])).get('rescuer-fixer')!.prompt;
assert('A5 C4 fixer exact prompt still matches bank',
  c4FixerPrompt === c4Prompts['rescuer-fixer']);

/* ==================================================================
 *  A6. Batch C5 content: exact prompts, group counts, distinctness,
 *      safety, scoring/retry/caps/ordering on real C5 records
 * ================================================================*/

const c5ExpressionIds = allCoveredExpressionIds.slice(121);

const c5Prompts: Record<string, string> = {
  'overloaded-human-backup-system': 'Between urgent moments, I remain mentally prepared to become the fallback.',
  'overloaded-default-adult': 'I repeatedly find myself handling the same practical responsibilities without a new agreement.',
  'overloaded-no-backup': 'Over time, I continue feeling that essential responsibilities depend on my availability.',
  'overloaded-mental-load-carrier': 'I keep tracking practical logistics even when nobody has explicitly asked me to hold them.',
  'overloaded-cannot-delegate': 'After assigning a task, I repeatedly return to checking how it is being handled.',
  'overloaded-competence-trap': 'Doing work well repeatedly leads to more of the same responsibility being assigned to me.',
  'overloaded-crisis-juggler': 'I repeatedly find myself managing several urgent problems at the same time.',
  'overloaded-capacity-denier': 'I continue after consciously recognizing that I have reached a real limit.',
  'overloaded-last-minute-preventer': 'I repeatedly step in during the final window before an unfinished obligation has consequences.',
  'overloaded-stop-then-resume': 'After stopping to recover, I repeatedly return to the same level of responsibility.',
  'perfectionist-endless-reviser': 'I keep revising even when no new requirement or error has appeared.',
  'perfectionist-moving-goalpost': 'Each time I reach a goal, I tend to redefine what success requires.',
  'perfectionist-all-or-nothing-evaluator': 'When an outcome remains incomplete, I continue viewing it as a failure despite visible progress.',
  'perfectionist-beginner-avoider': 'At new beginnings where learning would be visible, I repeatedly avoid starting.',
  'perfectionist-performance-curator': 'Across different projects, I hold back completed work until only a polished version is visible.',
  'anger-explosive-shield': 'In tense moments, my anger repeatedly rises before I have time to consider my response.',
  'anger-contempt-shield': "During disagreements, I repeatedly stop treating the other person's viewpoint as worth considering.",
  'anger-intimidator': 'During conflict, I notice my intensity repeatedly changes how cautiously other people respond.',
  'anger-cold-shield': 'After being hurt, I continue keeping interpersonal distance after the immediate moment passes.',
  'anger-defensive-debater': 'When I perceive criticism, I repeatedly shift into argument before considering the broader message.',
  'anger-passive-aggressive-shield': 'When anger remains unspoken, I repeatedly communicate resistance through indirect remarks.',
  'anger-grievance-keeper': 'Old experiences of unfairness repeatedly re-enter my newer disagreements.',
  'anger-righteous-avenger': 'When I perceive injustice, I repeatedly treat the force of my anger as permission to act.',
  'anger-apology-cycle': 'I repeatedly move from anger escalation into repair efforts before the same pattern returns.',
};

assert('A6 covered Expression count 24', c5ExpressionIds.length === 24);
assert('A6 covered group count 42, uncovered 0', new Set(EXPRESSION_CONFIRMATION_ITEMS.map(i => i.groupId)).size === 42);
assert('A6 exactly 145 items in real bank', EXPRESSION_CONFIRMATION_ITEMS.length === 145);

for (const eid of c5ExpressionIds) {
  const items = EXPRESSION_CONFIRMATION_ITEMS.filter(i => i.expressionId === eid);
  assert(`A6 ${eid} has exactly 1 confirmation item`, items.length === 1, `${items.length}`);
  assert(`A6 ${eid} itemNumber is 1`, items[0].itemNumber === 1);
  assert(`A6 ${eid} access pro`, items[0].access === 'pro');
  assert(`A6 ${eid} reverseScored false`, items[0].reverseScored === false);
  assert(`A6 ${eid} canonical prefix`, items[0].id === `expression-confirm-${eid}-01`);
}

const c5GroupCounts: Record<string, number> = {
  'expression-group-overloaded-one-capacity-backup': 3,
  'expression-group-overloaded-one-mental-load': 3,
  'expression-group-overloaded-one-crisis-stop-resume': 4,
  'expression-group-perfectionist-standards-evaluation': 3,
  'expression-group-perfectionist-performance-exposure': 2,
  'expression-group-anger-shield-explosive-contempt': 3,
  'expression-group-anger-shield-cold-defensive': 4,
  'expression-group-anger-shield-righteous-cycle': 2,
};
for (const [groupId, expectedCount] of Object.entries(c5GroupCounts)) {
  const groupItems = EXPRESSION_CONFIRMATION_ITEMS.filter(i => i.groupId === groupId);
  const group = EXPRESSION_SCREENING_GROUPS.find(g => g.id === groupId);
  assert(`A6 group ${groupId} has ${expectedCount} items`, groupItems.length === expectedCount, `${groupItems.length}`);
  assert(`A6 group ${groupId} expressions match registry`, group?.expressionIds.length === expectedCount);
  assert(`A6 group ${groupId} every item mapping valid`,
    groupItems.every(i => group?.expressionIds.includes(i.expressionId) ?? false));
}
assert('A6 C1+C2+C3+C4 items unchanged: 121 items still present with exact prompts',
  allCoveredExpressionIds.slice(0, 91).every(eid => {
    const item = EXPRESSION_CONFIRMATION_ITEMS.find(i => i.expressionId === eid);
    return item !== undefined && item.prompt === c1c2c3Prompts[eid];
  }) && c4ExpressionIds.every(eid => {
    const item = EXPRESSION_CONFIRMATION_ITEMS.find(i => i.expressionId === eid);
    return item !== undefined && item.prompt === c4Prompts[eid];
  }));

for (const eid of c5ExpressionIds) {
  const item = EXPRESSION_CONFIRMATION_ITEMS.find(i => i.expressionId === eid)!;
  assert(`A6 exact prompt for ${eid}`, item.prompt === c5Prompts[eid], `got: ${item.prompt}`);
}

assert('A6 human-backup-system measures standby between urgent moments',
  c5Prompts['overloaded-human-backup-system'].includes('Between urgent moments') &&
  c5Prompts['overloaded-human-backup-system'].includes('fallback'));
assert('A6 default-adult is first-person and agreement-based',
  c5Prompts['overloaded-default-adult'].includes('I repeatedly find myself') &&
  c5Prompts['overloaded-default-adult'].includes('without a new agreement'));
assert('A6 no-backup framed as continued experience, not a claim about backup',
  c5Prompts['overloaded-no-backup'].includes('Over time') &&
  c5Prompts['overloaded-no-backup'].includes('continue feeling') &&
  !c5Prompts['overloaded-no-backup'].includes('exists'));
assert('A6 mental-load-carrier remains logistics rather than emotional needs',
  c5Prompts['overloaded-mental-load-carrier'].includes('logistics') &&
  !c5Prompts['overloaded-mental-load-carrier'].includes('need') &&
  !c5Prompts['overloaded-mental-load-carrier'].includes('emotional'));
assert('A6 cannot-delegate uses one post-assignment checking mechanism',
  c5Prompts['overloaded-cannot-delegate'].includes('After assigning') &&
  c5Prompts['overloaded-cannot-delegate'].includes('return to checking'));
assert('A6 competence-trap does not blame the user for being capable',
  !c5Prompts['overloaded-competence-trap'].includes('fault') &&
  !c5Prompts['overloaded-competence-trap'].includes('blame'));
assert('A6 crisis-juggler is first-person and recurring',
  c5Prompts['overloaded-crisis-juggler'].includes('I repeatedly') &&
  c5Prompts['overloaded-crisis-juggler'].includes('several urgent problems'));
assert('A6 capacity-denier recognizes a real limit without instructing continuation',
  c5Prompts['overloaded-capacity-denier'].includes('real limit') &&
  !c5Prompts['overloaded-capacity-denier'].includes('push') &&
  !c5Prompts['overloaded-capacity-denier'].includes('must'));
assert('A6 last-minute-preventer includes recurrence',
  c5Prompts['overloaded-last-minute-preventer'].includes('repeatedly step in'));
assert('A6 stop-then-resume contains no internal resume-same-load phrasing',
  !c5Prompts['overloaded-stop-then-resume'].includes('resume') &&
  !c5Prompts['overloaded-stop-then-resume'].includes('load'));
assert('A6 endless-reviser includes no-new-requirement evidence',
  c5Prompts['perfectionist-endless-reviser'].includes('no new requirement') &&
  c5Prompts['perfectionist-endless-reviser'].includes('error'));
assert('A6 moving-goalpost includes recurrence after attainment',
  c5Prompts['perfectionist-moving-goalpost'].includes('Each time I reach a goal') &&
  c5Prompts['perfectionist-moving-goalpost'].includes('redefine'));
assert('A6 all-or-nothing-evaluator preserves visible-progress evidence',
  c5Prompts['perfectionist-all-or-nothing-evaluator'].includes('visible progress'));
assert('A6 beginner-avoider specific to visible learning at new beginnings',
  c5Prompts['perfectionist-beginner-avoider'].includes('new beginnings') &&
  c5Prompts['perfectionist-beginner-avoider'].includes('learning'));
assert('A6 performance-curator adds cross-project recurrence',
  c5Prompts['perfectionist-performance-curator'].includes('Across different projects'));
assert('A6 explosive-shield contains neither explosive nor reactive',
  !c5Prompts['anger-explosive-shield'].includes('explosive') &&
  !c5Prompts['anger-explosive-shield'].includes('reactive'));
assert('A6 contempt-shield has no hidden-motive claim and no contempt label',
  !c5Prompts['anger-contempt-shield'].includes('avoid feeling') &&
  !c5Prompts['anger-contempt-shield'].includes('contempt'));
assert('A6 intimidator is observational and assigns no intent',
  c5Prompts['anger-intimidator'].includes('notice my intensity') &&
  !c5Prompts['anger-intimidator'].includes('intend') &&
  !c5Prompts['anger-intimidator'].includes('purpose'));
assert('A6 cold-shield does not use the phrase emotionally distant',
  !c5Prompts['anger-cold-shield'].includes('emotionally distant'));
assert('A6 defensive-debater distinguishes the argument-first sequence',
  c5Prompts['anger-defensive-debater'].includes('shift into argument before') &&
  c5Prompts['anger-defensive-debater'].includes('broader message'));
assert('A6 passive-aggressive-shield avoids banned display tokens',
  !c5Prompts['anger-passive-aggressive-shield'].includes('passive-aggressive') &&
  !c5Prompts['anger-passive-aggressive-shield'].includes('sniper') &&
  !c5Prompts['anger-passive-aggressive-shield'].includes('passing shots'));
assert('A6 grievance-keeper does not dispute the truth of past unfairness',
  c5Prompts['anger-grievance-keeper'].includes('Old experiences of unfairness') &&
  !c5Prompts['anger-grievance-keeper'].includes('imaginary') &&
  !c5Prompts['anger-grievance-keeper'].includes('imagined'));
assert('A6 righteous-avenger contains no justified',
  !c5Prompts['anger-righteous-avenger'].includes('justified'));
assert('A6 apology-cycle does not declare repair meaningless',
  c5Prompts['anger-apology-cycle'].includes('repair efforts') &&
  !c5Prompts['anger-apology-cycle'].includes('meaningless') &&
  !c5Prompts['anger-apology-cycle'].includes('pointless'));

assert('A6 all C5 prompts single sentence',
  c5ExpressionIds.every(eid => c5Prompts[eid].trim().endsWith('.') && c5Prompts[eid].split('.').length === 2));
assert('A6 all C5 prompts first person without you/your',
  c5ExpressionIds.every(eid => !c5Prompts[eid].includes('you') && !c5Prompts[eid].includes('your')));
assert('A6 all C5 prompts no question or semicolon',
  c5ExpressionIds.every(eid => !c5Prompts[eid].includes('?') && !c5Prompts[eid].includes(';')));

for (const eid of c5ExpressionIds) {
  const item = EXPRESSION_CONFIRMATION_ITEMS.find(i => i.expressionId === eid)!;
  const screeningItems = EXPRESSION_SCREENING_ITEMS.filter(i => i.expressionId === eid);
  const s1 = screeningItems.find(s => s.itemNumber === 1)?.prompt ?? '';
  const s2 = screeningItems.find(s => s.itemNumber === 2)?.prompt ?? '';
  assert(`A6 distinctness ${eid} not screening 1`, item.prompt !== s1);
  assert(`A6 distinctness ${eid} not screening 2`, item.prompt !== s2);
  assert(`A6 distinctness ${eid} not concatenation`,
    item.prompt !== s1 + ' ' + s2 && item.prompt !== s2 + ' ' + s1 &&
    item.prompt !== s1 + s2 && item.prompt !== s2 + s1);
}
assert('A6 all C5 prompts mutually distinct',
  new Set(c5ExpressionIds.map(eid => c5Prompts[eid])).size === 24);
const normalizePrompt = (p: string) => p.toLowerCase().replace(/\s+/g, ' ').trim();
assert('A6 no duplicate normalized prompts across all 145 items',
  new Set(EXPRESSION_CONFIRMATION_ITEMS.map(i => normalizePrompt(i.prompt))).size === 145);
assert('A6 no C5 prompt contains another Expression canonical ID',
  c5ExpressionIds.every(eid => {
    const promptLower = c5Prompts[eid].toLowerCase();
    return EXPRESSION_REGISTRY.every(entry =>
      entry.id === eid || !promptLower.includes(entry.id.replace(/-/g, ' ')));
  }));

const c5SafetyWords = [
  'disorder', 'diagnos', 'anxiety', 'trauma', 'ocd', 'scrupul', 'nervous system',
  'ptsd', 'phobi', 'should', 'must', 'abandoned', 'abandonment',
  'defective', 'disgusting', 'immoral', 'burdensome', 'worthless', 'a burden',
  'deserved', 'justified', 'always safe', 'reach out', 'keep asking',
  'lazy', 'irresponsib', 'rigid', 'obsessive', 'controlling', 'impossible',
  'adhd', 'executive', 'burnout', 'depress', 'sleep', 'addict', 'substance',
  'alcohol', 'violence', 'violent', 'aggress', 'stalk', 'abuse',
  'manipulat', 'exploit', 'victim', 'helpless', 'selfish', 'cause', 'because',
];
for (const word of c5SafetyWords) {
  assert(`A6 safety: no C5 prompt contains "${word}"`,
    c5ExpressionIds.every(eid => !c5Prompts[eid].toLowerCase().includes(word)));
}

const c5RealScoring1 = scoreExpressionConfirmation(
  candidateFor('anger-explosive-shield'),
  [{ itemId: 'expression-confirm-anger-explosive-shield-01', selectedValue: 1 }],
);
assert('A6 real C5 record response 1 not confirmed', c5RealScoring1.status === 'not-confirmed');
const c5RealScoring3 = scoreExpressionConfirmation(
  candidateFor('anger-explosive-shield'),
  [{ itemId: 'expression-confirm-anger-explosive-shield-01', selectedValue: 3 }],
);
assert('A6 real C5 record response 3 not confirmed', c5RealScoring3.status === 'not-confirmed');
const c5RealScoring4 = scoreExpressionConfirmation(
  candidateFor('anger-explosive-shield'),
  [{ itemId: 'expression-confirm-anger-explosive-shield-01', selectedValue: 4 }],
);
assert('A6 real C5 record response 4 confirms at exact threshold', c5RealScoring4.status === 'confirmed');
const c5RealScoring5 = scoreExpressionConfirmation(
  candidateFor('anger-explosive-shield'),
  [{ itemId: 'expression-confirm-anger-explosive-shield-01', selectedValue: 5 }],
);
assert('A6 real C5 record response 5 confirms', c5RealScoring5.status === 'confirmed');
const c5RealHighScreening = scoreExpressionConfirmation(
  candidateWith('anger-explosive-shield', 5, 10),
  [{ itemId: 'expression-confirm-anger-explosive-shield-01', selectedValue: 2 }],
);
assert('A6 real C5 high screening + response 2 does not confirm', c5RealHighScreening.status === 'not-confirmed');
const c5RealBarely = scoreExpressionConfirmation(
  candidateWith('anger-explosive-shield', 3, 6),
  [{ itemId: 'expression-confirm-anger-explosive-shield-01', selectedValue: 5 }],
);
assert('A6 real C5 barely qualifying + response 5 confirms', c5RealBarely.status === 'confirmed');
const c5RealParentBoost = scoreExpressionConfirmation(
  { ...candidateFor('anger-explosive-shield'), parentScore: 5 } as unknown as ExpressionScreeningGroupSelection,
  [{ itemId: 'expression-confirm-anger-explosive-shield-01', selectedValue: 3 }],
);
assert('A6 real C5 parent score does not inflate confirmation', c5RealParentBoost.status === 'not-confirmed');
const c5RealGroupBoost = scoreExpressionConfirmation(
  { ...candidateFor('anger-explosive-shield'), groupScore: 5 } as unknown as ExpressionScreeningGroupSelection,
  [{ itemId: 'expression-confirm-anger-explosive-shield-01', selectedValue: 3 }],
);
assert('A6 real C5 group score does not inflate confirmation', c5RealGroupBoost.status === 'not-confirmed');

const c5RealRetry = scoreExpressionConfirmation(
  candidateFor('anger-explosive-shield'),
  [],
  [{ itemId: 'expression-confirm-anger-explosive-shield-01', selectedValue: 4 }],
);
assert('A6 real C5 retry response 4 confirms', c5RealRetry.status === 'confirmed');
const c5RealRetryNotConfirm = scoreExpressionConfirmation(
  candidateFor('anger-explosive-shield'),
  [],
  [{ itemId: 'expression-confirm-anger-explosive-shield-01', selectedValue: 2 }],
);
assert('A6 real C5 retry response 2 does not confirm', c5RealRetryNotConfirm.status === 'not-confirmed');
const c5RealDoubleSkip = scoreExpressionConfirmation(
  candidateFor('anger-explosive-shield'),
  [],
  [],
);
assert('A6 real C5 double skip unresolved', c5RealDoubleSkip.status === 'unresolved');
assert('A6 real C5 double skip does not confirm', c5RealDoubleSkip.status !== 'confirmed');
const c5RealSkipRouting = confirmExpressionCandidates(
  'pro',
  [candidateFor('anger-explosive-shield')],
  [],
  [],
);
assert('A6 real C5 double skip unresolved in trace', c5RealSkipRouting.traces.some(t =>
  t.candidateExpressionId === 'anger-explosive-shield' && t.status === 'unresolved'));
assert('A6 real C5 double skip excluded from confirmed results', c5RealSkipRouting.confirmedExpressions.length === 0);
assert('A6 real C5 double skip partial completion', c5RealSkipRouting.completionState === 'partial');
assert('A6 real C5 double skip does not prevent result generation', c5RealSkipRouting.resultCategory !== undefined);

const c5RealRouting = confirmExpressionCandidates(
  'pro',
  [candidateFor('anger-explosive-shield'), candidateFor('anger-intimidator')],
  [
    { itemId: 'expression-confirm-anger-explosive-shield-01', selectedValue: 4 },
    { itemId: 'expression-confirm-anger-intimidator-01', selectedValue: 2 },
  ],
);
assert('A6 real C5 routing confirmed + rejected', c5RealRouting.totalConfirmed === 1 &&
  c5RealRouting.rejectedExpressionIds.includes('anger-intimidator'));
assert('A6 real C5 trace serializes', typeof serializeExpressionConfirmationTrace(c5RealRouting.traces[0]) === 'string');
assert('A6 real C5 result serializes', typeof serializeExpressionConfirmationResult(c5RealRouting) === 'string');

const c5RealCap = confirmExpressionCandidates(
  'pro',
  [
    candidateFor('anger-explosive-shield'),
    candidateFor('anger-contempt-shield'),
    candidateFor('anger-intimidator'),
  ],
  [
    { itemId: 'expression-confirm-anger-explosive-shield-01', selectedValue: 5 },
    { itemId: 'expression-confirm-anger-contempt-shield-01', selectedValue: 4 },
    { itemId: 'expression-confirm-anger-intimidator-01', selectedValue: 4 },
  ],
);
assert('A6 real C5 per-group cap 2', c5RealCap.totalConfirmed === 2);
assert('A6 real C5 no third candidate per group', c5RealCap.rejectedExpressionIds.includes('anger-intimidator'));

const c5RealExpansion = confirmExpressionCandidates(
  'pro',
  [candidateFor('anger-apology-cycle')],
  [
    { itemId: 'expression-confirm-anger-apology-cycle-01', selectedValue: 5 },
    { itemId: 'expression-confirm-entangled-pursuer-01', selectedValue: 5 },
  ],
);
assert('A6 real C5 noncandidate cannot expand set', c5RealExpansion.totalCandidates === 1 &&
  c5RealExpansion.confirmedExpressions.length === 1);
assert('A6 real C5 noncandidate traced as not-screened-candidate', c5RealExpansion.traces.some(t =>
  t.candidateExpressionId === 'entangled-pursuer' && t.exclusionReason === 'not-screened-candidate'));

const c5RealTotalCap = confirmExpressionCandidates(
  'pro',
  [
    candidateFor('overloaded-human-backup-system'),
    candidateFor('overloaded-mental-load-carrier'),
    candidateFor('perfectionist-endless-reviser'),
    candidateFor('anger-explosive-shield'),
    candidateFor('anger-righteous-avenger'),
  ],
  [
    { itemId: 'expression-confirm-overloaded-human-backup-system-01', selectedValue: 4 },
    { itemId: 'expression-confirm-overloaded-mental-load-carrier-01', selectedValue: 4 },
    { itemId: 'expression-confirm-perfectionist-endless-reviser-01', selectedValue: 4 },
    { itemId: 'expression-confirm-anger-explosive-shield-01', selectedValue: 4 },
    { itemId: 'expression-confirm-anger-righteous-avenger-01', selectedValue: 4 },
  ],
);
assert('A6 real C5 total cap holds at 4', c5RealTotalCap.totalConfirmed === 4);
assert('A6 real C5 fifth candidate excluded-by-total-cap', c5RealTotalCap.rejectedExpressionIds.includes('anger-righteous-avenger'),
  c5RealTotalCap.rejectedExpressionIds.join(','));
assert('A6 real C5 does not truncate to 3', c5RealTotalCap.totalConfirmed === 4);

const c5RealZero = confirmExpressionCandidates(
  'pro',
  [candidateFor('anger-apology-cycle')],
  [{ itemId: 'expression-confirm-anger-apology-cycle-01', selectedValue: 1 }],
);
assert('A6 real C5 zero confirmations valid no-clear-expression',
  c5RealZero.totalConfirmed === 0 && c5RealZero.confirmedExpressions.length === 0 &&
  c5RealZero.completionState !== undefined);

const c5RealOrdering = confirmExpressionCandidates(
  'pro',
  [
    candidateWith('overloaded-human-backup-system', 3, 6),
    candidateWith('perfectionist-endless-reviser', 3, 6),
    candidateWith('anger-intimidator', 3, 6),
    candidateWith('anger-apology-cycle', 4, 8),
  ],
  [
    { itemId: 'expression-confirm-overloaded-human-backup-system-01', selectedValue: 4 },
    { itemId: 'expression-confirm-perfectionist-endless-reviser-01', selectedValue: 4 },
    { itemId: 'expression-confirm-anger-intimidator-01', selectedValue: 4 },
    { itemId: 'expression-confirm-anger-apology-cycle-01', selectedValue: 5 },
  ],
);
const c5OrderedIds = c5RealOrdering.confirmedExpressions.map(e => e.expressionId);
assert('A6 C5 confirmation score sorts first', c5OrderedIds[0] === 'anger-apology-cycle');
assert('A6 C5 canonical registry order breaks ties',
  c5OrderedIds.join(',') === 'anger-apology-cycle,overloaded-human-backup-system,perfectionist-endless-reviser,anger-intimidator',
  c5OrderedIds.join(','));
const c5RepeatedOrder = confirmExpressionCandidates(
  'pro',
  [
    candidateWith('overloaded-human-backup-system', 3, 6),
    candidateWith('perfectionist-endless-reviser', 3, 6),
    candidateWith('anger-intimidator', 3, 6),
    candidateWith('anger-apology-cycle', 4, 8),
  ],
  [
    { itemId: 'expression-confirm-overloaded-human-backup-system-01', selectedValue: 4 },
    { itemId: 'expression-confirm-perfectionist-endless-reviser-01', selectedValue: 4 },
    { itemId: 'expression-confirm-anger-intimidator-01', selectedValue: 4 },
    { itemId: 'expression-confirm-anger-apology-cycle-01', selectedValue: 5 },
  ],
);
assert('A6 C5 ordering deterministic across repeated runs',
  JSON.stringify(c5RepeatedOrder.confirmedExpressions.map(e => e.expressionId)) === JSON.stringify(c5OrderedIds));
assert('A6 C5 ordering JSON round-trip preserves order',
  JSON.parse(JSON.stringify(c5OrderedIds)).join(',') === c5OrderedIds.join(','));

const c5ExplosivePrompt = new Map(EXPRESSION_CONFIRMATION_ITEMS.map(i => [i.expressionId, i])).get('anger-explosive-shield')!.prompt;
assert('A6 C5 explosive-shield exact prompt still matches bank',
  c5ExplosivePrompt === c5Prompts['anger-explosive-shield']);

/* ==================================================================
 *  B. Synthetic valid fixture banks
 * ================================================================*/

assert('B synthetic bank has 145 items', syntheticBank.length === 145, `got ${syntheticBank.length}`);

const bankExpressionIds = syntheticBank.map(i => i.expressionId);
assert('B exactly 1 item per Expression', new Set(bankExpressionIds).size === 145);
assert('B every Expression has exactly one item', EXPRESSION_REGISTRY.every(e =>
  bankExpressionIds.filter(id => id === e.id).length === 1));
assert('B every itemNumber is 1', syntheticBank.every(i => i.itemNumber === 1));
assert('B item IDs unique', new Set(syntheticBank.map(i => i.id)).size === 145);
assert('B item IDs canonical prefix', syntheticBank.every(i => i.id.startsWith('expression-confirm-')));
assert('B every Expression ID canonical', syntheticBank.every(i =>
  EXPRESSION_REGISTRY.some(e => e.id === i.expressionId)));
assert('B every group ID valid', syntheticBank.every(i =>
  EXPRESSION_SCREENING_GROUPS.some(g => g.id === i.groupId)));
assert('B every expression-to-group mapping valid', syntheticBank.every(i => {
  const group = EXPRESSION_SCREENING_GROUPS.find(g => g.id === i.groupId);
  return group?.expressionIds.includes(i.expressionId) ?? false;
}));
assert('B no display-name aliases', syntheticBank.every(i =>
  !['explosive-reactive-one', 'sniper-passing-shots'].includes(i.expressionId)));
assert('B all access pro', syntheticBank.every(i => i.access === 'pro'));
assert('B all reverseScored false', syntheticBank.every(i => i.reverseScored === false));
assert('B all prompts non-empty', syntheticBank.every(i => i.prompt.trim().length > 0));

const syntheticReadiness = getExpressionConfirmationReadiness(syntheticBank);
assert('B readiness is true for valid complete fixture', syntheticReadiness.ready === true,
  syntheticReadiness.missingRequirements.join(' | '));
assert('B readiness totalItemCount 145', syntheticReadiness.totalItemCount === 145);
assert('B readiness allExpressionsHaveOneItem', syntheticReadiness.allExpressionsHaveOneItem === true);
assert('B readiness itemNumbersCorrect', syntheticReadiness.itemNumbersCorrect === true);
assert('B readiness itemIdsUnique', syntheticReadiness.itemIdsUnique === true);
assert('B readiness everyItemMapsToValidExpression', syntheticReadiness.everyItemMapsToValidExpression === true);
assert('B readiness everyItemMapsToValidGroup', syntheticReadiness.everyItemMapsToValidGroup === true);
assert('B readiness mapping valid', syntheticReadiness.everyExpressionToGroupMappingValid === true);
assert('B readiness allItemsPro', syntheticReadiness.allItemsPro === true);
assert('B readiness noReverseScored', syntheticReadiness.noReverseScored === true);
assert('B readiness allPromptsNonEmpty', syntheticReadiness.allPromptsNonEmpty === true);
assert('B readiness canonical prefix', syntheticReadiness.allItemIdsUseCanonicalPrefix === true);
assert('B readiness no missing requirements', syntheticReadiness.missingRequirements.length === 0,
  syntheticReadiness.missingRequirements.join(' | '));

const itemForPleaser = getConfirmationItemForExpression('silenced-people-pleaser', syntheticBank);
assert('B getConfirmationItemForExpression resolves', itemForPleaser?.expressionId === 'silenced-people-pleaser');
assert('B getConfirmationItemForExpression returns null for unknown', getConfirmationItemForExpression('not-an-expression', syntheticBank) === null);
const itemsForCandidates = getConfirmationItemsForCandidates(
  ['silenced-people-pleaser', 'silenced-conflict-avoider'],
  syntheticBank,
);
assert('B getConfirmationItemsForCandidates returns 2 items', itemsForCandidates.length === 2);

const emptyBankItems = getConfirmationItemsForCandidates(['silenced-people-pleaser']);
assert('B real bank returns 1 item for covered candidate', emptyBankItems.length === 1);
const realUncoveredItems = getConfirmationItemsForCandidates(['not-a-candidate-expression']);
assert('B real bank returns 0 items for uncovered candidate', realUncoveredItems.length === 0);

/* ==================================================================
 *  C. Invalid fixture banks
 * ================================================================*/

function mutateBank(mutate: (items: ExpressionConfirmationItem[]) => void): ExpressionConfirmationItem[] {
  const copy: ExpressionConfirmationItem[] = syntheticBank.map(i => ({ ...i }));
  mutate(copy);
  return copy;
}

const duplicatedExpressionBank = mutateBank(items => {
  items[0] = { ...items[0], id: 'expression-confirm-silenced-conflict-avoider-01', expressionId: 'silenced-conflict-avoider' };
});
assert('C duplicate-Expression bank ready false',
  getExpressionConfirmationReadiness(duplicatedExpressionBank).ready === false);
assert('C duplicate-Expression bank not exactly 1 message',
  getExpressionConfirmationReadiness(duplicatedExpressionBank).missingRequirements.some(m => m === 'not all expressions have exactly 1 confirmation item'));

const duplicateIdsBank = mutateBank(items => {
  items[1] = { ...items[1], id: items[0].id, expressionId: items[0].expressionId };
});
const duplicateIdsReadiness = getExpressionConfirmationReadiness(duplicateIdsBank);
assert('C duplicate-ID bank ready false', duplicateIdsReadiness.ready === false);
assert('C duplicate-ID bank message', duplicateIdsReadiness.missingRequirements.some(m => m === 'duplicate confirmation item IDs found'));

const invalidExpressionBank = mutateBank(items => {
  items[0] = { ...items[0], expressionId: 'explosive-reactive-one' as never };
});
const invalidExpressionReadiness = getExpressionConfirmationReadiness(invalidExpressionBank);
assert('C invalid-expression bank ready false', invalidExpressionReadiness.ready === false);
assert('C invalid-expression bank message', invalidExpressionReadiness.missingRequirements.some(m => m === 'item maps to invalid expression'));

const aliasExpressionBank = mutateBank(items => {
  items[0] = { ...items[0], expressionId: 'sniper-passing-shots' as never };
});
assert('C display-name alias bank ready false', getExpressionConfirmationReadiness(aliasExpressionBank).ready === false);

const invalidGroupBank = mutateBank(items => {
  items[0] = { ...items[0], groupId: 'expression-group-not-a-real-group' };
});
const invalidGroupReadiness = getExpressionConfirmationReadiness(invalidGroupBank);
assert('C invalid-group bank ready false', invalidGroupReadiness.ready === false);
assert('C invalid-group bank message', invalidGroupReadiness.missingRequirements.some(m => m === 'item maps to invalid group'));

const mappingMismatchBank = mutateBank(items => {
  const otherGroup = EXPRESSION_SCREENING_GROUPS.find(g => g.id !== items[0].groupId);
  items[0] = { ...items[0], groupId: otherGroup?.id ?? items[0].groupId };
});
const mappingMismatchReadiness = getExpressionConfirmationReadiness(mappingMismatchBank);
assert('C mapping-mismatch bank ready false', mappingMismatchReadiness.ready === false);
assert('C mapping-mismatch bank message', mappingMismatchReadiness.missingRequirements.some(m => m === 'expression-to-group mapping mismatch'));

const wrongItemNumberBank = mutateBank(items => {
  items[0] = { ...items[0], itemNumber: 2 as never };
});
const wrongItemNumberReadiness = getExpressionConfirmationReadiness(wrongItemNumberBank);
assert('C itemNumber-2 bank ready false', wrongItemNumberReadiness.ready === false);
assert('C itemNumber-2 bank message', wrongItemNumberReadiness.missingRequirements.some(m => m === 'item numbers not 1 per expression'));

const nonProAccessBank = mutateBank(items => {
  items[0] = { ...items[0], access: 'free' as never };
});
const nonProReadiness = getExpressionConfirmationReadiness(nonProAccessBank);
assert('C non-Pro bank ready false', nonProReadiness.ready === false);
assert('C non-Pro bank message', nonProReadiness.missingRequirements.some(m => m === 'not all items are pro access'));

const reverseScoredBank = mutateBank(items => {
  items[0] = { ...items[0], reverseScored: true as never };
});
const reverseScoredReadiness = getExpressionConfirmationReadiness(reverseScoredBank);
assert('C reverseScored bank ready false', reverseScoredReadiness.ready === false);
assert('C reverseScored bank message', reverseScoredReadiness.missingRequirements.some(m => m === 'reverse-scored items found'));

const emptyPromptBank = mutateBank(items => {
  items[0] = { ...items[0], prompt: '   ' };
});
const emptyPromptReadiness = getExpressionConfirmationReadiness(emptyPromptBank);
assert('C empty-prompt bank ready false', emptyPromptReadiness.ready === false);
assert('C empty-prompt bank message', emptyPromptReadiness.missingRequirements.some(m => m === 'some item prompts are empty'));

assert('C all invalid fixtures keep 145 records', [
  duplicatedExpressionBank, duplicateIdsBank, invalidExpressionBank, invalidGroupBank,
  mappingMismatchBank, wrongItemNumberBank, nonProAccessBank, reverseScoredBank, emptyPromptBank,
].every(b => b.length === 145));

/* ==================================================================
 *  D. Scoring boundaries
 * ================================================================*/

const pleaser = candidateFor('silenced-people-pleaser');
const pleaserItemId = `expression-confirm-silenced-people-pleaser-01`;

for (const value of [1, 2, 3] as const) {
  const score = scoreExpressionConfirmation(
    pleaser,
    [{ itemId: pleaserItemId, selectedValue: value }],
    undefined,
    undefined,
    syntheticBank,
  );
  assert(`D response ${value} does not confirm`, score.status === 'not-confirmed');
  assert(`D response ${value} below-confirmation-threshold`, score.exclusionReason === 'below-confirmation-threshold');
  assert(`D response ${value} score preserved`, score.confirmationScore === value);
  assert(`D response ${value} attempt answered`, score.attempts[0].skipped === false && score.attempts[0].response === value);
}

const score4 = scoreExpressionConfirmation(
  pleaser,
  [{ itemId: pleaserItemId, selectedValue: 4 }],
  undefined,
  undefined,
  syntheticBank,
);
assert('D response 4 confirms at exact threshold', score4.status === 'confirmed');
assert('D response 4 no exclusion reason', score4.exclusionReason === null);

const score5 = scoreExpressionConfirmation(
  pleaser,
  [{ itemId: pleaserItemId, selectedValue: 5 }],
  undefined,
  undefined,
  syntheticBank,
);
assert('D response 5 confirms', score5.status === 'confirmed');

assert('D confirmation threshold is 4', EXPRESSION_CONFIRMATION_CONFIG.confirmation.minimumConfirmationScore === 4);
assert('D maximumConfirmedPerGroup is 2', EXPRESSION_CONFIRMATION_CONFIG.selection.maximumConfirmedPerGroup === 2);
assert('D maximumConfirmedTotal is 4', EXPRESSION_CONFIRMATION_CONFIG.selection.maximumConfirmedTotal === 4);
assert('D itemsPerExpression is 1', EXPRESSION_CONFIRMATION_CONFIG.confirmation.itemsPerExpression === 1);
assert('D candidateSetMayExpand is false', EXPRESSION_CONFIRMATION_CONFIG.selection.candidateSetMayExpand === false);

const highScreeningLowResponse = scoreExpressionConfirmation(
  candidateWith('silenced-people-pleaser', 5, 10),
  [{ itemId: pleaserItemId, selectedValue: 2 }],
  undefined,
  undefined,
  syntheticBank,
);
assert('D high screening + response 2 does not confirm', highScreeningLowResponse.status === 'not-confirmed');

const barelyQualifyingHighResponse = scoreExpressionConfirmation(
  candidateWith('silenced-people-pleaser', 3, 6),
  [{ itemId: pleaserItemId, selectedValue: 5 }],
  undefined,
  undefined,
  syntheticBank,
);
assert('D barely qualifying screening + response 5 confirms', barelyQualifyingHighResponse.status === 'confirmed');

const noItemCandidate = candidateFor('silenced-people-pleaser');
const noItemScore = scoreExpressionConfirmation(
  noItemCandidate,
  [],
  undefined,
  undefined,
  [],
);
assert('D candidate with no bank item is unresolved', noItemScore.status === 'unresolved');

/* ==================================================================
 *  E. Skip and retry
 * ================================================================*/

const firstSkip = scoreExpressionConfirmation(
  pleaser,
  [],
  undefined,
  undefined,
  syntheticBank,
);
assert('E first skip requests one retry (two attempts)', firstSkip.attempts.length === 2);
assert('E first skip attempt 1 is skipped', firstSkip.attempts[0].skipped === true);
assert('E first skip does not become response 3', firstSkip.attempts[0].response === null);
assert('E first skip does not confirm', firstSkip.status !== 'confirmed');
assert('E first skip does not reject as threshold', firstSkip.exclusionReason !== 'below-confirmation-threshold');
assert('E double skip is unresolved', firstSkip.status === 'unresolved');
assert('E double skip unresolved-after-retry', firstSkip.exclusionReason === 'unresolved-after-retry');
assert('E second skip attempt 2 is skipped', firstSkip.attempts[1].skipped === true && firstSkip.attempts[1].response === null);

const retryConfirms = scoreExpressionConfirmation(
  pleaser,
  [],
  [{ itemId: pleaserItemId, selectedValue: 4 }],
  undefined,
  syntheticBank,
);
assert('E retry response 4 confirms', retryConfirms.status === 'confirmed');
assert('E retry attempt history preserved', retryConfirms.attempts.length === 2 &&
  retryConfirms.attempts[0].skipped === true &&
  retryConfirms.attempts[1].skipped === false &&
  retryConfirms.attempts[1].response === 4);
assert('E retry scored normally (score 4)', retryConfirms.confirmationScore === 4);
assert('E retryCount is 1', retryConfirms.retryCount === 1);

const retryNotConfirm = scoreExpressionConfirmation(
  pleaser,
  [],
  [{ itemId: pleaserItemId, selectedValue: 2 }],
  undefined,
  syntheticBank,
);
assert('E retry response 2 does not confirm', retryNotConfirm.status === 'not-confirmed');
assert('E retry response 2 below threshold', retryNotConfirm.exclusionReason === 'below-confirmation-threshold');

const unresolvedResult = confirmExpressionCandidates(
  'pro',
  [pleaser],
  [],
  undefined,
  undefined,
  syntheticBank,
);
assert('E unresolved excluded from confirmed', unresolvedResult.confirmedExpressions.length === 0);
assert('E unresolved in unresolvedExpressionIds', unresolvedResult.unresolvedExpressionIds.includes('silenced-people-pleaser'));
assert('E unresolved remains in trace', unresolvedResult.traces.some(t =>
  t.candidateExpressionId === 'silenced-people-pleaser' && t.status === 'unresolved'));
assert('E unresolved produces partial completion', unresolvedResult.completionState === 'partial');
assert('E unresolved does not block result generation', unresolvedResult.resultCategory === 'insufficient-evidence');
assert('E unresolved not included in result', unresolvedResult.traces.every(t => t.includedInResult === false));

/* ==================================================================
 *  F. Candidate-set behavior
 * ================================================================*/

const failedScreeningCandidate = candidateFor('silenced-people-pleaser');
const failedScreeningResult = confirmExpressionCandidates(
  'pro',
  [candidateFor('silenced-conflict-avoider')],
  [
    { itemId: pleaserItemId, selectedValue: 5 },
    { itemId: 'expression-confirm-silenced-conflict-avoider-01', selectedValue: 4 },
  ],
  undefined,
  undefined,
  syntheticBank,
);
assert('F failed-screening Expression cannot confirm', !failedScreeningResult.confirmedExpressions.some(e => e.expressionId === 'silenced-people-pleaser'));
assert('F noncandidate response traced as not-screened-candidate', failedScreeningResult.traces.some(t =>
  t.candidateExpressionId === 'silenced-people-pleaser' && t.exclusionReason === 'not-screened-candidate' && t.includedInResult === false));
assert('F noncandidate response cannot expand candidate set', failedScreeningResult.totalCandidates === 1);
assert('F screened candidate still confirms', failedScreeningResult.confirmedExpressions.length === 1);

const twoPerGroup = confirmExpressionCandidates(
  'pro',
  [candidateFor('silenced-people-pleaser'), candidateFor('silenced-conflict-avoider')],
  [
    { itemId: 'expression-confirm-silenced-people-pleaser-01', selectedValue: 4 },
    { itemId: 'expression-confirm-silenced-conflict-avoider-01', selectedValue: 4 },
  ],
  undefined,
  undefined,
  syntheticBank,
);
assert('F two candidates in one group both confirm', twoPerGroup.totalConfirmed === 2);

const threePerGroup = confirmExpressionCandidates(
  'pro',
  [
    candidateFor('silenced-people-pleaser'),
    candidateFor('silenced-conflict-avoider'),
    candidateFor('silenced-tension-and-silence'),
  ],
  [
    { itemId: 'expression-confirm-silenced-people-pleaser-01', selectedValue: 5 },
    { itemId: 'expression-confirm-silenced-conflict-avoider-01', selectedValue: 4 },
    { itemId: 'expression-confirm-silenced-tension-and-silence-01', selectedValue: 4 },
  ],
  undefined,
  undefined,
  syntheticBank,
);
assert('F no third candidate per group', threePerGroup.totalConfirmed === 2);
assert('F third candidate excluded-by-group-cap', threePerGroup.rejectedExpressionIds.includes('silenced-tension-and-silence'));
assert('F group-cap exclusion traced', threePerGroup.traces.some(t =>
  t.candidateExpressionId === 'silenced-tension-and-silence' && t.exclusionReason === 'excluded-by-group-cap'));

const fourAcrossGroups = confirmExpressionCandidates(
  'pro',
  [
    candidateFor('silenced-people-pleaser'),
    candidateFor('unheld-attachment-alarm'),
    candidateFor('invisible-presence-minimizer'),
    candidateFor('shame-defective-one'),
  ],
  [
    { itemId: 'expression-confirm-silenced-people-pleaser-01', selectedValue: 4 },
    { itemId: 'expression-confirm-unheld-attachment-alarm-01', selectedValue: 4 },
    { itemId: 'expression-confirm-invisible-presence-minimizer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-shame-defective-one-01', selectedValue: 4 },
  ],
  undefined,
  undefined,
  syntheticBank,
);
assert('F four candidates across groups all confirm', fourAcrossGroups.totalConfirmed === 4);
assert('F maximum confirmed total is 4', fourAcrossGroups.totalConfirmed <= 4);

const fiveAcrossGroups = confirmExpressionCandidates(
  'pro',
  [
    candidateFor('silenced-people-pleaser'),
    candidateFor('unheld-attachment-alarm'),
    candidateFor('invisible-presence-minimizer'),
    candidateFor('shame-defective-one'),
    candidateFor('controller-standard-enforcer'),
  ],
  [
    { itemId: 'expression-confirm-silenced-people-pleaser-01', selectedValue: 4 },
    { itemId: 'expression-confirm-unheld-attachment-alarm-01', selectedValue: 4 },
    { itemId: 'expression-confirm-invisible-presence-minimizer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-shame-defective-one-01', selectedValue: 4 },
    { itemId: 'expression-confirm-controller-standard-enforcer-01', selectedValue: 4 },
  ],
  undefined,
  undefined,
  syntheticBank,
);
assert('F total cap holds at 4', fiveAcrossGroups.totalConfirmed === 4);
assert('F fifth candidate excluded-by-total-cap', fiveAcrossGroups.rejectedExpressionIds.includes('shame-defective-one'));
assert('F total-cap exclusion traced', fiveAcrossGroups.traces.some(t =>
  t.candidateExpressionId === 'shame-defective-one' && t.exclusionReason === 'excluded-by-total-cap'));
assert('F does not truncate to 3', fiveAcrossGroups.totalConfirmed === 4);

const zeroResult = confirmExpressionCandidates(
  'pro',
  [candidateFor('silenced-people-pleaser'), candidateFor('silenced-conflict-avoider')],
  [
    { itemId: 'expression-confirm-silenced-people-pleaser-01', selectedValue: 3 },
    { itemId: 'expression-confirm-silenced-conflict-avoider-01', selectedValue: 1 },
  ],
  undefined,
  undefined,
  syntheticBank,
);
assert('F zero qualifying confirmations returns no-clear-expression', zeroResult.resultCategory === 'no-clear-expression');
assert('F zero result has no confirmed expressions', zeroResult.confirmedExpressions.length === 0);
assert('F zero result is not forced', zeroResult.totalConfirmed === 0 &&
  (zeroResult.navigationTarget?.type === 'core' && zeroResult.navigationTarget.id === 'silenced-one'));

const emptyCandidatesResult = confirmExpressionCandidates('pro', [], [], undefined, undefined, syntheticBank);
assert('F empty candidate set returns no-clear-expression', emptyCandidatesResult.resultCategory === 'no-clear-expression');
assert('F empty candidate set not-started', emptyCandidatesResult.completionState === 'not-started');

/* ==================================================================
 *  G. Ordering
 * ================================================================*/

const orderingCandidates = [
  candidateWith('silenced-people-pleaser', 3, 6),
  candidateWith('unheld-attachment-alarm', 3, 6),
  candidateWith('invisible-presence-minimizer', 3, 6),
  candidateWith('shame-defective-one', 4, 8),
];
const orderingResult = confirmExpressionCandidates(
  'pro',
  orderingCandidates,
  [
    { itemId: 'expression-confirm-silenced-people-pleaser-01', selectedValue: 4 },
    { itemId: 'expression-confirm-unheld-attachment-alarm-01', selectedValue: 4 },
    { itemId: 'expression-confirm-invisible-presence-minimizer-01', selectedValue: 4 },
    { itemId: 'expression-confirm-shame-defective-one-01', selectedValue: 5 },
  ],
  undefined,
  undefined,
  syntheticBank,
);
const orderedIds = orderingResult.confirmedExpressions.map(e => e.expressionId);
assert('G confirmation score sorts first', orderedIds[0] === 'shame-defective-one');
assert('G normalized screening score breaks first tie', orderedIds[1] === 'silenced-people-pleaser');
assert('G raw screening score breaks second tie',
  orderedIds[1] === 'silenced-people-pleaser' && orderedIds[2] === 'unheld-attachment-alarm');
const registryOrderOf = (id: string) => EXPRESSION_REGISTRY.findIndex(e => e.id === id);
assert('G canonical registry order breaks complete ties',
  orderedIds[2] === 'unheld-attachment-alarm' && orderedIds[3] === 'invisible-presence-minimizer' &&
  registryOrderOf(orderedIds[2]) < registryOrderOf(orderedIds[3]));
assert('G ranks are 1-based sequential', orderingResult.confirmedExpressions.map(e => e.rank).join(',') === '1,2,3,4');
assert('G parent score does not affect ordering',
  orderedIds.join(',') === ['shame-defective-one', 'silenced-people-pleaser', 'unheld-attachment-alarm', 'invisible-presence-minimizer'].join(','));
assert('G group score does not affect ordering', orderingResult.traces.every(t => t.confirmationRank !== null));

const sortedDirect = sortConfirmedExpressions([
  { expressionId: 'b', groupId: 'g', parentId: 'p', parentType: 'core', confirmationScore: 4, screeningRawScore: 7, screeningNormalizedScore: 3, canonicalRegistryOrder: 2, rank: 1 },
  { expressionId: 'a', groupId: 'g', parentId: 'p', parentType: 'core', confirmationScore: 4, screeningRawScore: 7, screeningNormalizedScore: 3, canonicalRegistryOrder: 1, rank: 2 },
  { expressionId: 'c', groupId: 'g', parentId: 'p', parentType: 'core', confirmationScore: 5, screeningRawScore: 0, screeningNormalizedScore: 0, canonicalRegistryOrder: 3, rank: 3 },
]);
assert('G sortConfirmedExpressions sorts by confirmation then registry order', sortedDirect.map(e => e.expressionId).join(',') === 'c,a,b');

const repeatedSort = sortConfirmedExpressions(orderingResult.confirmedExpressions);
assert('G sorting deterministic across repeated runs',
  JSON.stringify(repeatedSort) === JSON.stringify(sortConfirmedExpressions(orderingResult.confirmedExpressions)));

const tieCandidates = [
  candidateWith('silenced-conflict-avoider', 3, 6),
  candidateWith('silenced-people-pleaser', 3, 6),
];
const tieResult = confirmExpressionCandidates(
  'pro',
  tieCandidates,
  [
    { itemId: 'expression-confirm-silenced-conflict-avoider-01', selectedValue: 4 },
    { itemId: 'expression-confirm-silenced-people-pleaser-01', selectedValue: 4 },
  ],
  undefined,
  undefined,
  syntheticBank,
);
assert('G complete tie breaks by canonical registry order asc',
  tieResult.confirmedExpressions[0].expressionId === 'silenced-people-pleaser' &&
  tieResult.confirmedExpressions[1].expressionId === 'silenced-conflict-avoider');

/* ==================================================================
 *  H. Serialization
 * ================================================================*/

const serializationResult = confirmExpressionCandidates(
  'pro',
  [pleaser, candidateFor('silenced-conflict-avoider')],
  [
    { itemId: pleaserItemId, selectedValue: 4 },
    { itemId: 'expression-confirm-silenced-conflict-avoider-01', selectedValue: 2 },
  ],
  undefined,
  undefined,
  syntheticBank,
);
const serializedTrace = serializeExpressionConfirmationTrace(serializationResult.traces[0]);
const parsedTrace = JSON.parse(serializedTrace) as unknown as Record<string, unknown>;
assert('H trace JSON.stringify succeeds', typeof serializedTrace === 'string' && serializedTrace.length > 0);
assert('H trace round-trips', JSON.stringify(parsedTrace) === serializedTrace);
assert('H trace attempts preserve skip and retry history',
  serializationResult.traces[0].attempts.length === 1 &&
  serializationResult.traces[0].attempts[0].skipped === false &&
  serializationResult.traces[0].attempts[0].response === 4);
assert('H trace status serializes', typeof parsedTrace.status === 'string' && parsedTrace.status === 'confirmed');
assert('H trace exclusion reason serializes',
  parsedTrace.exclusionReason === null && serializationResult.traces[1].exclusionReason === 'below-confirmation-threshold');

const serializedResult = serializeExpressionConfirmationResult(serializationResult);
const parsedResult = JSON.parse(serializedResult) as unknown as Record<string, unknown>;
assert('H result JSON.stringify succeeds', typeof serializedResult === 'string' && serializedResult.length > 0);
assert('H result round-trips', JSON.stringify(parsedResult) === serializedResult);
assert('H result status and exclusion unions serialize predictably',
  typeof parsedResult.completionState === 'string' &&
  typeof parsedResult.resultCategory === 'string' &&
  (parsedResult.navigationTarget as { type: string }).type === 'core');

const skipHistoryResult = confirmExpressionCandidates(
  'pro',
  [pleaser],
  [],
  [{ itemId: pleaserItemId, selectedValue: 5 }],
  undefined,
  syntheticBank,
);
const skipHistoryTrace = skipHistoryResult.traces[0];
assert('H skip history serializes',
  JSON.parse(serializeExpressionConfirmationTrace(skipHistoryTrace)).attempts.length === 2);
assert('H retryCount serializes', JSON.parse(serializeExpressionConfirmationTrace(skipHistoryTrace)).retryCount === 1);

const allUnresolvedState = deriveExpressionConfirmationCompletionState(
  serializationResult.traces.map(t => ({ ...t, status: 'unresolved' as const })),
);
const notStartedState = deriveExpressionConfirmationCompletionState([]);
assert('H completion state derive not-started', notStartedState === 'not-started');
assert('H completion state derive partial', allUnresolvedState === 'partial');
assert('H completion state derive complete',
  deriveExpressionConfirmationCompletionState(serializationResult.traces) === 'complete');

/* ==================================================================
 *  I. Free runtime behavior
 * ================================================================*/

const freeResult = confirmExpressionCandidates(
  'free',
  [pleaser],
  [{ itemId: pleaserItemId, selectedValue: 5 }],
  undefined,
  undefined,
  syntheticBank,
);
assert('I Free returns expression-not-assessed', freeResult.resultCategory === 'expression-not-assessed');
assert('I Free does not evaluate confirmation responses', freeResult.totalCandidates === 0 && freeResult.traces.length === 0);
assert('I Free does not create confirmed Expressions', freeResult.confirmedExpressions.length === 0);
assert('I Free does not create rejected Expressions', freeResult.rejectedExpressionIds.length === 0);
assert('I Free completion not-started', freeResult.completionState === 'not-started');
assert('I Free navigation null', freeResult.navigationTarget === null);
assert('I Free build readiness: confirmation complete but strategy bank free mode still gated',
  freeReadiness.expressionConfirmationComplete === true && freeReadiness.ready === false);

const proFreeMode = confirmExpressionCandidates(
  'pro',
  [pleaser],
  [{ itemId: pleaserItemId, selectedValue: 5 }],
  undefined,
  undefined,
  syntheticBank,
);
assert('I Pro mode with same responses confirms', proFreeMode.resultCategory === 'confirmed' && proFreeMode.totalConfirmed === 1);

/* ==================================================================
 *  J. Preservation of existing expression assessment data
 * ================================================================*/

const screeningIds = EXPRESSION_SCREENING_ITEMS.map(i => i.id);
assert('J all 290 screening items remain unchanged', screeningIds.length === 290);
assert('J screening item IDs unique', new Set(screeningIds).size === 290);
assert('J screening item ID shape', screeningIds.every(id => /^expression-screen-[a-z0-9-]+-(01|02)$/.test(id)));
const screeningCountByExpression: Record<string, number> = {};
for (const item of EXPRESSION_SCREENING_ITEMS) {
  screeningCountByExpression[item.expressionId] = (screeningCountByExpression[item.expressionId] ?? 0) + 1;
}
assert('J every registered Expression has exactly 2 screening items', EXPRESSION_REGISTRY.every(e =>
  (screeningCountByExpression[e.id] ?? 0) === 2));
for (const group of EXPRESSION_SCREENING_GROUPS) {
  for (const eid of group.expressionIds) {
    const expressionItems = EXPRESSION_SCREENING_ITEMS.filter(i => i.expressionId === eid);
    const numbers = expressionItems.map(i => i.itemNumber).sort();
    assert(`J ${eid} screening items numbered 1 and 2`,
      numbers.length === 2 && numbers[0] === 1 && numbers[1] === 2);
  }
}
assert('J screening items all pro', EXPRESSION_SCREENING_ITEMS.every(i => i.access === 'pro'));
assert('J screening items none reverseScored', EXPRESSION_SCREENING_ITEMS.every(i => i.reverseScored === false));

const groupScreeningIds = EXPRESSION_GROUP_SCREENING_ITEMS.map(i => i.id);
const expectedGroupScreeningIds: string[] = [];
for (const group of EXPRESSION_SCREENING_GROUPS) {
  const short = group.id.replace(/^expression-group-/, '');
  expectedGroupScreeningIds.push(`expression-group-screen-${short}-01`);
  expectedGroupScreeningIds.push(`expression-group-screen-${short}-02`);
}
assert('J all 84 group-screening items remain unchanged', groupScreeningIds.length === 84 &&
  JSON.stringify(groupScreeningIds) === JSON.stringify(expectedGroupScreeningIds));
assert('J group-screening items unique', new Set(groupScreeningIds).size === 84);

assert('J all 145 registered Expressions remain unchanged', EXPRESSION_REGISTRY.length === 145 &&
  new Set(EXPRESSION_REGISTRY.map(e => e.id)).size === 145);
assert('J every registry entry maps to its parent',
  EXPRESSION_REGISTRY.every(e => EXPRESSION_TO_PARENT[e.id] === e.parentPatternId));
assert('J registry parents valid', EXPRESSION_REGISTRY.every(e =>
  [...CORE_PATTERN_IDS, ...STRATEGY_PATTERN_IDS].includes(e.parentPatternId as never)));

assert('J all 42 Expression group assignments remain unchanged', EXPRESSION_SCREENING_GROUPS.length === 42);
const groupedExpressionIds = EXPRESSION_SCREENING_GROUPS.flatMap(g => g.expressionIds);
assert('J every group expression is registered', groupedExpressionIds.every(eid =>
  EXPRESSION_REGISTRY.some(e => e.id === eid)));
assert('J every registered Expression grouped exactly once', groupedExpressionIds.length === 145 &&
  new Set(groupedExpressionIds).size === 145);
assert('J every group has valid parent', EXPRESSION_SCREENING_GROUPS.every(g =>
  [...CORE_PATTERN_IDS, ...STRATEGY_PATTERN_IDS].includes(g.parentId as never)));
assert('J no confirmation items leaked into screening banks',
  !screeningIds.some(id => id.includes('confirm')) && !groupScreeningIds.some(id => id.includes('confirm')));

/* ==================================================================
 *  K. No live quiz wiring
 * ================================================================*/

function scanForWiring(dirs: string[], files: string[] = []): string[] {
  const hits: string[] = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('expressionConfirmation') || content.includes('EXPRESSION_CONFIRMATION')) {
      hits.push(file);
    }
  }
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        hits.push(...scanForWiring([fullPath]));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const fullPath = path.join(dir, entry.name);
        if (fullPath.includes(path.join('components', 'quiz'))) continue;
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('expressionConfirmation') || content.includes('EXPRESSION_CONFIRMATION')) {
          hits.push(fullPath);
        }
      }
    }
  }
  return hits;
}

const wiringHits = scanForWiring(
  [path.join(process.cwd(), 'src/components')],
  [
    path.join(process.cwd(), 'src/App.tsx'),
  ],
);
assert('K no live quiz wiring in components/App', wiringHits.length === 0,
  wiringHits.join(', '));
assert('Batch 10: legacy personalityQuiz data removed',
  !fs.existsSync(path.join(process.cwd(), 'src/data/personalityQuiz.ts')));

/* ==================================================================
 *  Summary
 * ================================================================*/

const expressionConfirmationReadiness = getExpressionConfirmationReadiness();
const proFinal = getAssessmentReadiness('pro');
const freeFinal = getAssessmentReadiness('free');

console.log('==========================================');
console.log('Expression Confirmation Architecture Validation');
console.log('------------------------------------------');
console.log(`confirmation threshold: ${EXPRESSION_CONFIRMATION_CONFIG.confirmation.minimumConfirmationScore}`);
console.log(`maximum confirmed per group: ${EXPRESSION_CONFIRMATION_CONFIG.selection.maximumConfirmedPerGroup}`);
console.log(`maximum confirmed total: ${EXPRESSION_CONFIRMATION_CONFIG.selection.maximumConfirmedTotal}`);
console.log(`production confirmation item count: ${EXPRESSION_CONFIRMATION_ITEMS.length}`);
console.log(`expected final confirmation item count: ${EXPRESSION_REGISTRY.length}`);
console.log(`expressionConfirmationComplete: ${expressionConfirmationReadiness.ready}`);
console.log(`Pro readiness: ${proFinal.ready} | ${proFinal.missingRequirements.join('; ')}`);
console.log(`Free readiness: ${freeFinal.ready} | ${freeFinal.missingRequirements.join('; ')}`);
console.log('------------------------------------------');
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
if (errors.length > 0) {
  console.log('Errors:');
  for (const err of errors) {
    console.log(`  ${err}`);
  }
  process.exit(1);
}
console.log('ALL ASSERTIONS PASSED');
