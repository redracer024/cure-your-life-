import * as fs from 'fs';
import * as path from 'path';
import {
  ASSESSMENT_SESSION_VERSION,
  startAssessmentSession,
  getCurrentStageItems,
  recordAssessmentResponse,
  skipAssessmentItem,
  advanceAssessmentStage,
  getAssessmentSessionCompletionState,
  serializeAssessmentSession,
  deserializeAssessmentSession,
} from './src/lib/quiz/assessmentSession';
import {
  computeQuizScores,
  computeQuizResult,
} from './src/lib/quiz/scoringEngine';
import {
  produceStrategyRoutingResult,
} from './src/lib/quiz/strategyRouting';
import {
  routeExpressionGroupScreening,
  selectExpressionParentBranches,
  getGroupsForExpressionParent,
  getGroupScreeningItemIds,
} from './src/lib/quiz/expressionGroupScreening';
import { EXPRESSION_GROUP_SCREENING_CONFIG } from './src/data/quiz/expressionGroupScreeningConfig';
import {
  routeExpressionScreening,
  getEligibleExpressionIds,
  getExpressionScreeningItems,
} from './src/lib/quiz/expressionScreening';
import {
  confirmExpressionCandidates,
  getConfirmationItemForExpression,
} from './src/lib/quiz/expressionConfirmation';
import { APPROVED_QUIZ_ITEMS } from './src/data/quiz/approvedQuestions';
import { EXPRESSION_REGISTRY } from './src/data/quiz/patternTaxonomy';
import {
  getApprovedItemsForMode,
  getUniversalStrategyScreenItems,
  scoreApprovedItemResponse,
} from './src/data/quiz/questionBank';
import type {
  AssessmentSession,
  AssessmentStage,
  AssessmentResponseValue,
} from './src/types/assessmentSession';
import type { PatternQuizResult } from './src/types/quiz';
import type { StrategyCandidateSelection } from './src/types/strategyRouting';
import type { StrategyCandidateScore } from './src/types/strategyRouting';

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

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function stripResponseSnapshot(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value;
  if (Array.isArray(value)) return value.map(v => stripResponseSnapshot(v));
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === 'answeredItemIds' || key === 'skippedItemIds') continue;
    out[key] = stripResponseSnapshot(entry);
  }
  return out;
}

function sameResult(a: unknown, b: unknown): boolean {
  return sameJson(stripResponseSnapshot(a), stripResponseSnapshot(b));
}

interface Driver {
  s: AssessmentSession;
  presented: number;
}

function stageValue(id: string, maximize: boolean): AssessmentResponseValue {
  const item = APPROVED_QUIZ_ITEMS.find(i => i.id === id);
  if (item) {
    const value = maximize ? (item.reverseScored ? 1 : 5) : (item.reverseScored ? 5 : 1);
    return value as AssessmentResponseValue;
  }
  return (maximize ? 5 : 1) as AssessmentResponseValue;
}

function answerCurrent(d: Driver, value: AssessmentResponseValue): void {
  const ids = getCurrentStageItems(d.s);
  for (const id of ids) {
    d.s = recordAssessmentResponse(d.s, id, value);
  }
  d.presented += ids.length;
}

function answerCurrentMax(d: Driver): void {
  const ids = getCurrentStageItems(d.s);
  for (const id of ids) {
    d.s = recordAssessmentResponse(d.s, id, stageValue(id, true));
  }
  d.presented += ids.length;
}

function answerCurrentMin(d: Driver): void {
  const ids = getCurrentStageItems(d.s);
  for (const id of ids) {
    d.s = recordAssessmentResponse(d.s, id, stageValue(id, false));
  }
  d.presented += ids.length;
}

function skipCurrent(d: Driver): void {
  const ids = getCurrentStageItems(d.s);
  for (const id of ids) {
    d.s = skipAssessmentItem(d.s, id);
  }
  d.presented += ids.length;
}

function advance(d: Driver): void {
  d.s = advanceAssessmentStage(d.s);
}

function scope(d: Driver): string[] {
  return getCurrentStageItems(d.s);
}

function mergedOf(s: AssessmentSession): Record<string, number> {
  return { ...s.responses, ...s.retryResponses };
}

function entriesOf(
  s: AssessmentSession,
  itemIds: string[],
): { itemId: string; selectedValue: AssessmentResponseValue }[] {
  const set = new Set(itemIds);
  const out: { itemId: string; selectedValue: AssessmentResponseValue }[] = [];
  for (const [itemId, selectedValue] of Object.entries(s.responses)) {
    if (set.has(itemId)) {
      out.push({ itemId, selectedValue });
    }
  }
  return out;
}

function retryEntriesOf(
  s: AssessmentSession,
  itemIds: string[],
): { itemId: string; selectedValue: AssessmentResponseValue }[] {
  const set = new Set(itemIds);
  const out: { itemId: string; selectedValue: AssessmentResponseValue }[] = [];
  for (const [itemId, selectedValue] of Object.entries(s.retryResponses)) {
    if (set.has(itemId)) {
      out.push({ itemId, selectedValue });
    }
  }
  return out;
}

function rebuildQuizResult(s: AssessmentSession): PatternQuizResult {
  const strategyResult = s.strategyResult;
  return {
    core: s.coreResult?.core ?? null,
    strategy: strategyResult && strategyResult.primary
      ? {
          id: strategyResult.primary,
          rawScore: strategyResult.primaryRawScore,
          normalizedScore: strategyResult.primaryNormalizedScore,
          confidence: strategyResult.primaryNormalizedScore >= 0.8
            ? 'high'
            : strategyResult.primaryNormalizedScore >= 0.4
              ? 'moderate'
              : 'low',
        }
      : null,
    expression: null,
    secondaryCores: s.coreResult?.secondaryCores ?? [],
    secondaryStrategies: [],
  };
}

function screeningScopeFrom(s: AssessmentSession, groupIds: readonly string[]): string[] {
  const out: string[] = [];
  for (const expressionId of getEligibleExpressionIds(groupIds)) {
    for (const item of getExpressionScreeningItems(expressionId)) {
      out.push(item.id);
    }
  }
  return out;
}

const CORE_FREE_COUNT = getApprovedItemsForMode('free').filter(i => i.layer === 'core').length;
const CORE_PRO_COUNT = getApprovedItemsForMode('pro').filter(i => i.layer === 'core').length;
const UNIVERSAL_COUNT = getUniversalStrategyScreenItems('pro').length;

/* ==================================================================
 *  A. Contract surface
 * ================================================================*/

assert(
  'session version matches engine config versions',
  ASSESSMENT_SESSION_VERSION === 'strategy-1.0|groups-1.0.0|screening-1.0.0|confirmation-1.0.0',
  ASSESSMENT_SESSION_VERSION,
);

const ALL_STAGES: AssessmentStage[] = [
  'not-started',
  'core',
  'strategy-universal',
  'strategy-follow-up-first',
  'strategy-follow-up-second',
  'expression-group-screening',
  'expression-screening',
  'expression-confirmation',
  'results',
];
assert('stage union covers all required stages', new Set(ALL_STAGES).size === 9);

const RESPONSE_VALUES: AssessmentResponseValue[] = [1, 2, 3, 4, 5];
assert('response value union is 1-5', RESPONSE_VALUES.length === 5 && RESPONSE_VALUES[0] === 1 && RESPONSE_VALUES[4] === 5);

const EXPORTS = [
  startAssessmentSession,
  getCurrentStageItems,
  recordAssessmentResponse,
  skipAssessmentItem,
  advanceAssessmentStage,
  getAssessmentSessionCompletionState,
  serializeAssessmentSession,
  deserializeAssessmentSession,
];
assert('all 8 orchestration exports exist as functions', EXPORTS.every(fn => typeof fn === 'function'));

/* ==================================================================
 *  B. Session lifecycle and core stage
 * ================================================================*/

const fresh = startAssessmentSession('free');
assert('fresh session version set', fresh.sessionVersion === ASSESSMENT_SESSION_VERSION);
assert('fresh session stage is core', fresh.stage === 'core');
assert('fresh session completion is not-started', fresh.completionState === 'not-started');
assert('fresh free session has 45 core items', fresh.currentItemIds.length === CORE_FREE_COUNT, `${fresh.currentItemIds.length}`);
assert('fresh session has empty responses', Object.keys(fresh.responses).length === 0);
assert('fresh session navigation target empty', fresh.navigationTarget.patternId === '');
assert('fresh session timestamps are strings', typeof fresh.createdAt === 'string' && typeof fresh.updatedAt === 'string');

const returnedSameOnPendingAdvance = advanceAssessmentStage(fresh) === fresh;
assert('advance is a no-op while items are pending', returnedSameOnPendingAdvance);

const returnedSameOnInvalidResponse = recordAssessmentResponse(fresh, 'strategy-martyr-01', 6 as AssessmentResponseValue) === fresh;
assert('invalid response value is rejected', returnedSameOnInvalidResponse);

const returnedSameOnUnknownItem = recordAssessmentResponse(fresh, 'not-a-real-item', 5) === fresh;
assert('unknown item id is rejected', returnedSameOnUnknownItem);

const returnedSameOnOutOfScopeItem = recordAssessmentResponse(fresh, 'strategy-martyr-01', 5) === fresh;
assert('item outside scope is rejected', returnedSameOnOutOfScopeItem);

const stageItemsCopy = getCurrentStageItems(fresh);
stageItemsCopy.push('mutated-copy');
assert('getCurrentStageItems returns a copy', fresh.currentItemIds.length === CORE_FREE_COUNT);

let coreSession = fresh;
const coreIds = getCurrentStageItems(coreSession);
coreSession = recordAssessmentResponse(coreSession, coreIds[0], 5);
assert('answering a core item transitions to in-progress', coreSession.completionState === 'in-progress');
assert('answered core item recorded in responses', coreSession.responses[coreIds[0]] === 5);
assert('answered core item completed', coreSession.completedItemIds.includes(coreIds[0]));
assert('answered core item removed from current items', !coreSession.currentItemIds.includes(coreIds[0]));
assert('input session not mutated by response', fresh.responses[coreIds[0]] === undefined);

const skippedCoreItemId = coreSession.currentItemIds[0];
const skippedCore = skipAssessmentItem(coreSession, skippedCoreItemId);
assert('core skip marks item completed', skippedCore.completedItemIds.includes(skippedCoreItemId));
assert('core skip does not schedule a retry', skippedCore.retryState.skippedItemIds.length === 0);
assert('core skip removes item from current items', skippedCore.currentItemIds.length === coreSession.currentItemIds.length - 1);

const notStartedSession = { ...fresh, stage: 'not-started' as AssessmentStage };
const fromNotStarted = advanceAssessmentStage(notStartedSession);
assert('advance from not-started enters core', fromNotStarted.stage === 'core');
assert('advance from not-started assigns core items', fromNotStarted.currentItemIds.length === CORE_FREE_COUNT);

/* ==================================================================
 *  C. Free mode fixtures (max = 5 on non-reverse, 1 on reverse)
 * ================================================================*/

{
  const d: Driver = { s: startAssessmentSession('free'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  assert('free max: universal stage reached', d.s.stage === 'strategy-universal' && d.s.currentItemIds.length === UNIVERSAL_COUNT);
  assert('free max: core result primary avoidant-one', d.s.coreResult?.core?.id === 'avoidant-one', `${d.s.coreResult?.core?.id}`);
  assert('free max: core result equivalence', sameJson(d.s.coreResult, (() => {
    const increments: { targetType: 'core'; targetId: string; value: number }[] = [];
    for (const [itemId, selectedValue] of Object.entries(mergedOf(d.s))) {
      const item = APPROVED_QUIZ_ITEMS.find(i => i.id === itemId);
      if (item && item.layer === 'core') {
        increments.push({ targetType: 'core', targetId: item.patternId, value: scoreApprovedItemResponse(item, selectedValue) });
      }
    }
    return computeQuizResult(computeQuizScores(increments));
  })()));
  assert('free max: core navigation target', d.s.navigationTarget.patternId === 'avoidant-one');
  answerCurrentMax(d);
  advance(d);
  assert('free max: follow-up stage has 6 items', d.s.stage === 'strategy-follow-up-first' && d.s.currentItemIds.length === 6, `${d.s.currentItemIds.length}`);
  const followUpIds = getCurrentStageItems(d.s);
  assert('free max: follow-up items belong to top two candidates', followUpIds.every(id => id.startsWith('strategy-martyr-') || id.startsWith('strategy-overloaded-one-')));
  answerCurrentMax(d);
  advance(d);
  assert('free max: results stage reached', d.s.stage === 'results');
  assert('free max: completion complete', d.s.completionState === 'complete');
  assert('free max: strategy result outcome primary-with-secondary', d.s.strategyResult?.outcome === 'primary-with-secondary');
  assert('free max: strategy primary martyr', d.s.strategyResult?.primary === 'martyr');
  assert('free max: strategy secondaries in ranking order', sameJson(d.s.strategyResult?.secondaries.map(x => x.patternId), ['overloaded-one']));
  assert('free max: strategy result equivalence', sameResult(d.s.strategyResult, produceStrategyRoutingResult(mergedOf(d.s), 'free')));
  assert('free max: expression results remain null', d.s.expressionGroupResult === null && d.s.expressionScreeningResult === null && d.s.expressionConfirmationResult === null);
  assert('free max: presented total 63', d.presented === CORE_FREE_COUNT + UNIVERSAL_COUNT + 6, `presented ${d.presented}`);
  assert('free max: navigation target is strategy primary', d.s.navigationTarget.patternId === 'martyr');
}

{
  const d: Driver = { s: startAssessmentSession('free'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  const universalIds = getUniversalStrategyScreenItems('free').map(i => i.id);
  for (const id of universalIds) {
    d.s = recordAssessmentResponse(d.s, id, id.startsWith('strategy-martyr-') ? stageValue(id, true) : stageValue(id, false));
  }
  d.presented += universalIds.length;
  advance(d);
  assert('free one-candidate: follow-up has 3 items', d.s.stage === 'strategy-follow-up-first' && d.s.currentItemIds.length === 3, `${d.s.currentItemIds.length}`);
  assert('free one-candidate: follow-up is martyr items', getCurrentStageItems(d.s).every(id => id.startsWith('strategy-martyr-')));
  answerCurrentMax(d);
  advance(d);
  assert('free one-candidate: results reached', d.s.stage === 'results');
  assert('free one-candidate: primary martyr', d.s.strategyResult?.primary === 'martyr');
  assert('free one-candidate: outcome primary', d.s.strategyResult?.outcome === 'primary');
  assert('free one-candidate: strategy result equivalence', sameResult(d.s.strategyResult, produceStrategyRoutingResult(mergedOf(d.s), 'free')));
  assert('free one-candidate: presented total 60', d.presented === CORE_FREE_COUNT + UNIVERSAL_COUNT + 3, `presented ${d.presented}`);
}

{
  const d: Driver = { s: startAssessmentSession('free'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  answerCurrentMin(d);
  advance(d);
  assert('free zero-candidate: results reached directly', d.s.stage === 'results');
  assert('free zero-candidate: no follow-up stage', d.presented === CORE_FREE_COUNT + UNIVERSAL_COUNT, `presented ${d.presented}`);
  assert('free zero-candidate: outcome no-clear-strategy', d.s.strategyResult?.outcome === 'no-clear-strategy');
  assert('free zero-candidate: primary null', d.s.strategyResult?.primary === null);
  assert('free zero-candidate: strategy result equivalence', sameResult(d.s.strategyResult, produceStrategyRoutingResult(mergedOf(d.s), 'free')));
  assert('free zero-candidate: navigation falls back to core', d.s.navigationTarget.patternId === 'avoidant-one');
  assert('free zero-candidate: completion complete', d.s.completionState === 'complete');
}

{
  const d: Driver = { s: startAssessmentSession('free'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  const universalIds = getUniversalStrategyScreenItems('free').map(i => i.id);
  const martyrSkip = universalIds.find(id => id.startsWith('strategy-martyr-'))!;
  for (const id of universalIds) {
    if (id === martyrSkip) {
      d.s = skipAssessmentItem(d.s, id);
    } else {
      d.s = recordAssessmentResponse(d.s, id, stageValue(id, true));
    }
  }
  d.presented += universalIds.length;
  assert('free retry: first skip recorded', d.s.retryState.skippedItemIds.length === 1);
  advance(d);
  assert('free retry: retry pass re-presents skipped item', d.s.currentItemIds.length === 1 && d.s.currentItemIds[0] === martyrSkip);
  answerCurrent(d, stageValue(martyrSkip, true));
  assert('free retry: item moved to retried', d.s.retryState.retriedItemIds.includes(martyrSkip));
  assert('free retry: item removed from skipped', !d.s.retryState.skippedItemIds.includes(martyrSkip));
  assert('free retry: retry response recorded separately', d.s.retryResponses[martyrSkip] === stageValue(martyrSkip, true) && d.s.responses[martyrSkip] === undefined);
  advance(d);
  assert('free retry: follow-up stage with 6 items', d.s.stage === 'strategy-follow-up-first' && d.s.currentItemIds.length === 6, `${d.s.currentItemIds.length}`);
  answerCurrentMax(d);
  advance(d);
  assert('free retry: results reached', d.s.stage === 'results');
  assert('free retry: strategy result equivalence with merged retries', sameResult(d.s.strategyResult, produceStrategyRoutingResult(mergedOf(d.s), 'free')));
  assert('free retry: presented total 64', d.presented === CORE_FREE_COUNT + UNIVERSAL_COUNT + 1 + 6, `presented ${d.presented}`);
}

{
  const d: Driver = { s: startAssessmentSession('free'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  skipCurrent(d);
  advance(d);
  assert('free double-skip: retry pass has 12 items', d.s.currentItemIds.length === UNIVERSAL_COUNT);
  skipCurrent(d);
  advance(d);
  assert('free double-skip: all unresolved', d.s.retryState.unresolvedItemIds.length === UNIVERSAL_COUNT);
  assert('free double-skip: results reached', d.s.stage === 'results');
  assert('free double-skip: outcome insufficient-evidence', d.s.strategyResult?.outcome === 'insufficient-evidence');
  assert('free double-skip: strategy result equivalence', sameResult(d.s.strategyResult, produceStrategyRoutingResult(mergedOf(d.s), 'free')));
  assert('free double-skip: presented total 69', d.presented === CORE_FREE_COUNT + UNIVERSAL_COUNT * 2, `presented ${d.presented}`);
}

/* ==================================================================
 *  D. Pro mode max fixture
 * ================================================================*/

let maxS: AssessmentSession;
let maxPresented = 0;
let maxGroupScope: string[] = [];
let maxScreeningScope: string[] = [];
let maxConfScope: string[] = [];
{
  const d: Driver = { s: startAssessmentSession('pro'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  assert('pro max: universal stage with 12 items', d.s.stage === 'strategy-universal' && d.s.currentItemIds.length === UNIVERSAL_COUNT);
  assert('pro max: core primary avoidant-one', d.s.coreResult?.core?.id === 'avoidant-one', `${d.s.coreResult?.core?.id}`);
  answerCurrentMax(d);
  advance(d);
  assert('pro max: first batch has 9 items', d.s.stage === 'strategy-follow-up-first' && d.s.currentItemIds.length === 9, `${d.s.currentItemIds.length}`);
  answerCurrentMax(d);
  advance(d);
  assert('pro max: second batch has 9 items', d.s.stage === 'strategy-follow-up-second' && d.s.currentItemIds.length === 9, `${d.s.currentItemIds.length}`);
  answerCurrentMax(d);
  advance(d);
  assert('pro max: group stage reached', d.s.stage === 'expression-group-screening');
  const groupScopeObserved = scope(d);
  assert('pro max: group scope is 12 items', groupScopeObserved.length === 12, `group scope ${groupScopeObserved.length}`);
  maxGroupScope = groupScopeObserved;
  answerCurrentMax(d);
  advance(d);
  assert('pro max: screening stage reached', d.s.stage === 'expression-screening');
  const screeningScopeObserved = scope(d);
  assert('pro max: screening scope is 22 items', screeningScopeObserved.length === 22, `screening scope ${screeningScopeObserved.length}`);
  maxScreeningScope = screeningScopeObserved;
  answerCurrentMax(d);
  advance(d);
  assert('pro max: confirmation stage reached', d.s.stage === 'expression-confirmation');
  const confScopeObserved = scope(d);
  assert('pro max: confirmation scope is 4 items', confScopeObserved.length === 4, `confirmation scope ${confScopeObserved.length}`);
  maxConfScope = confScopeObserved;
  answerCurrentMax(d);
  advance(d);
  assert('pro max: results reached', d.s.stage === 'results');
  assert('pro max: completion complete', d.s.completionState === 'complete');
  assert('pro max: presented total 140', d.presented === CORE_PRO_COUNT + UNIVERSAL_COUNT + 9 + 9 + 12 + 22 + 4, `presented ${d.presented}`);
  maxS = d.s;
  maxPresented = d.presented;
}

assert('pro max: strategy result equivalence', sameResult(maxS.strategyResult, produceStrategyRoutingResult(mergedOf(maxS), 'pro')));
assert('pro max: strategy outcome primary-with-secondary', maxS.strategyResult?.outcome === 'primary-with-secondary');
assert('pro max: strategy primary martyr', maxS.strategyResult?.primary === 'martyr');
assert('pro max: strategy secondaries in ranking order', sameJson(maxS.strategyResult?.secondaries.map(x => x.patternId), ['overloaded-one', 'perfectionist']));
{
  const quizResult = rebuildQuizResult(maxS);
  assert(
    'pro max: group result equivalence',
    sameResult(maxS.expressionGroupResult, routeExpressionGroupScreening('pro', quizResult, mergedOf(maxS), maxGroupScope)),
  );
  assert('pro max: group category groups-selected', maxS.expressionGroupResult?.category === 'groups-selected');
  assert('pro max: three groups selected', maxS.expressionGroupResult?.selectedGroups.length === 3, `${maxS.expressionGroupResult?.selectedGroups.length}`);
  assert('pro max: group scope matches all branch groups', sameJson(maxGroupScope, (() => {
    const { branches } = selectExpressionParentBranches('pro', quizResult, mergedOf(maxS), EXPRESSION_GROUP_SCREENING_CONFIG);
    const ids: string[] = [];
    for (const branch of branches) {
      for (const group of getGroupsForExpressionParent(branch.parentId)) {
        ids.push(...getGroupScreeningItemIds(group.id));
      }
    }
    return ids;
  })()));
}
{
  const advancingGroupIds = maxS.expressionGroupResult!.selectedGroups.map(g => g.groupId);
  const expectedScreeningScope = screeningScopeFrom(maxS, advancingGroupIds);
  assert('pro max: screening scope is 2 items per eligible expression', sameJson(maxScreeningScope, expectedScreeningScope));
  assert(
    'pro max: screening result equivalence',
    sameResult(
      maxS.expressionScreeningResult,
      routeExpressionScreening('pro', advancingGroupIds, entriesOf(maxS, maxScreeningScope), retryEntriesOf(maxS, maxScreeningScope)),
    ),
  );
  assert('pro max: screening category candidates selected', maxS.expressionScreeningResult?.category === 'expression-candidates-selected');
  assert('pro max: four candidates selected', maxS.expressionScreeningResult?.selectedCandidates.length === 4);
}
{
  const candidates = maxS.expressionScreeningResult!.selectedCandidates;
  const expectedConfScope: string[] = [];
  for (const candidate of candidates) {
    const item = getConfirmationItemForExpression(candidate.expressionId);
    if (item) expectedConfScope.push(item.id);
  }
  assert('pro max: confirmation scope is one per candidate', sameJson(maxConfScope, expectedConfScope));
  assert(
    'pro max: confirmation result equivalence',
    sameResult(
      maxS.expressionConfirmationResult,
      confirmExpressionCandidates('pro', candidates, entriesOf(maxS, maxConfScope), retryEntriesOf(maxS, maxConfScope)),
    ),
  );
  assert('pro max: four confirmed', maxS.expressionConfirmationResult?.totalConfirmed === 4);
  assert('pro max: confirmation completion complete', maxS.expressionConfirmationResult?.completionState === 'complete');
  assert('pro max: confirmed order follows registry order on ties', (() => {
    const confirmed = maxS.expressionConfirmationResult!.confirmedExpressions;
    const registryOrder: Record<string, number> = {};
    EXPRESSION_REGISTRY.forEach((entry, index) => {
      registryOrder[entry.id] = index;
    });
    const orders = confirmed.map(e => registryOrder[e.expressionId]);
    return orders.every((order, index) => index === 0 || orders[index - 1] <= order);
  })());
  assert('pro max: navigation target derives from confirmation', maxS.navigationTarget.patternId === (maxS.expressionConfirmationResult?.navigationTarget?.id ?? ''));
}

/* ==================================================================
 *  E. Pro candidate-narrow fixture (engine early-stop is inert:
 *  single-candidate branch has unreachable guard; multi-candidate
 *  leads are <= 0.4 candidate band < 0.6 early-stop lead, so the
 *  second batch is always presented — mirrors produceStrategyRoutingResult)
 * ================================================================*/

{
  const d: Driver = { s: startAssessmentSession('pro'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  const universalIds = getUniversalStrategyScreenItems('pro').map(i => i.id);
  for (const id of universalIds) {
    let value: AssessmentResponseValue;
    if (id.startsWith('strategy-martyr-') || id.startsWith('strategy-overloaded-one-')) {
      value = stageValue(id, true);
    } else {
      value = 3;
    }
    d.s = recordAssessmentResponse(d.s, id, value);
  }
  d.presented += universalIds.length;
  advance(d);
  assert('pro narrow: first batch of 6 for two candidates', d.s.stage === 'strategy-follow-up-first' && d.s.currentItemIds.length === 6, `${d.s.currentItemIds.length}`);
  const firstBatchIds = scope(d);
  for (const id of firstBatchIds) {
    const value = id.startsWith('strategy-martyr-') ? stageValue(id, true) : stageValue(id, false);
    d.s = recordAssessmentResponse(d.s, id, value);
  }
  d.presented += firstBatchIds.length;
  advance(d);
  assert('pro narrow: second batch assigned for narrowed leader', d.s.stage === 'strategy-follow-up-second' && d.s.currentItemIds.length === 3, `stage ${d.s.stage}, scope ${d.s.currentItemIds.length}`);
  assert('pro narrow: second batch is martyr items', getCurrentStageItems(d.s).every(id => id.startsWith('strategy-martyr-')));
  answerCurrentMax(d);
  advance(d);
  assert('pro narrow: group stage reached', d.s.stage === 'expression-group-screening');
  const groupScopeObserved = scope(d);
  assert('pro narrow: group scope of 12', groupScopeObserved.length === 12, `group scope ${groupScopeObserved.length}`);
  answerCurrentMax(d);
  advance(d);
  const screeningScopeObserved = scope(d);
  assert('pro narrow: screening scope of 22', screeningScopeObserved.length === 22, `screening scope ${screeningScopeObserved.length}`);
  answerCurrentMax(d);
  advance(d);
  const confScopeObserved = scope(d);
  assert('pro narrow: confirmation scope of 4', confScopeObserved.length === 4, `confirmation scope ${confScopeObserved.length}`);
  answerCurrentMax(d);
  advance(d);
  assert('pro narrow: results reached', d.s.stage === 'results');
  assert('pro narrow: outcome primary', d.s.strategyResult?.outcome === 'primary');
  assert('pro narrow: primary martyr', d.s.strategyResult?.primary === 'martyr');
  assert('pro narrow: strategy equivalence', sameResult(d.s.strategyResult, produceStrategyRoutingResult(mergedOf(d.s), 'pro')));
  assert(
    'pro narrow: group result equivalence',
    sameResult(d.s.expressionGroupResult, routeExpressionGroupScreening('pro', rebuildQuizResult(d.s), mergedOf(d.s), groupScopeObserved)),
  );
  assert(
    'pro narrow: screening result equivalence',
    sameResult(
      d.s.expressionScreeningResult,
      routeExpressionScreening(
        'pro',
        d.s.expressionGroupResult!.selectedGroups.map(g => g.groupId),
        entriesOf(d.s, screeningScopeObserved),
        retryEntriesOf(d.s, screeningScopeObserved),
      ),
    ),
  );
  assert('pro narrow: presented total 131', d.presented === CORE_PRO_COUNT + UNIVERSAL_COUNT + 6 + 3 + 12 + 22 + 4, `presented ${d.presented}`);
  assert('pro narrow: completion complete', d.s.completionState === 'complete');
}

/* ==================================================================
 *  F. Pro no-eligible-strategy fixture
 * ================================================================*/

{
  const d: Driver = { s: startAssessmentSession('pro'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  answerCurrentMin(d);
  advance(d);
  assert('pro no-strategy: group stage with core-only branch', d.s.stage === 'expression-group-screening' && d.s.currentItemIds.length === 6, `scope ${d.s.currentItemIds.length}`);
  assert('pro no-strategy: outcome no-clear-strategy', d.s.strategyResult?.outcome === 'no-clear-strategy');
  assert('pro no-strategy: primary null', d.s.strategyResult?.primary === null);
  const groupScopeObserved = scope(d);
  answerCurrentMax(d);
  advance(d);
  const screeningScopeObserved = scope(d);
  assert('pro no-strategy: screening scope of 16', screeningScopeObserved.length === 16, `screening scope ${screeningScopeObserved.length}`);
  answerCurrentMax(d);
  advance(d);
  const confScopeObserved = scope(d);
  assert('pro no-strategy: confirmation scope of 4', confScopeObserved.length === 4, `confirmation scope ${confScopeObserved.length}`);
  answerCurrentMax(d);
  advance(d);
  assert('pro no-strategy: results reached', d.s.stage === 'results');
  assert(
    'pro no-strategy: group result equivalence',
    sameResult(d.s.expressionGroupResult, routeExpressionGroupScreening('pro', rebuildQuizResult(d.s), mergedOf(d.s), groupScopeObserved)),
  );
  assert('pro no-strategy: group category groups-selected', d.s.expressionGroupResult?.category === 'groups-selected');
  assert(
    'pro no-strategy: screening result equivalence',
    sameResult(
      d.s.expressionScreeningResult,
      routeExpressionScreening(
        'pro',
        d.s.expressionGroupResult!.selectedGroups.map(g => g.groupId),
        entriesOf(d.s, screeningScopeObserved),
        retryEntriesOf(d.s, screeningScopeObserved),
      ),
    ),
  );
  assert(
    'pro no-strategy: confirmation result equivalence',
    sameResult(
      d.s.expressionConfirmationResult,
      confirmExpressionCandidates('pro', d.s.expressionScreeningResult!.selectedCandidates, entriesOf(d.s, confScopeObserved), retryEntriesOf(d.s, confScopeObserved)),
    ),
  );
  assert('pro no-strategy: four confirmed', d.s.expressionConfirmationResult?.totalConfirmed === 4);
  assert('pro no-strategy: presented total 110', d.presented === CORE_PRO_COUNT + UNIVERSAL_COUNT + 6 + 16 + 4, `presented ${d.presented}`);
  assert('pro no-strategy: completion complete', d.s.completionState === 'complete');
}

/* ==================================================================
 *  G. Pro terminal routing fixtures
 * ================================================================*/

{
  const d: Driver = { s: startAssessmentSession('pro'), presented: 0 };
  answerCurrentMin(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  assert('pro low-core: candidates exist', d.s.stage === 'strategy-follow-up-first');
  const firstBatchIds = scope(d);
  for (const id of firstBatchIds) {
    d.s = recordAssessmentResponse(d.s, id, stageValue(id, false));
  }
  d.presented += firstBatchIds.length;
  advance(d);
  assert('pro low-core: second batch assigned', d.s.stage === 'strategy-follow-up-second');
  const secondBatchIds = scope(d);
  for (const id of secondBatchIds) {
    d.s = recordAssessmentResponse(d.s, id, stageValue(id, false));
  }
  d.presented += secondBatchIds.length;
  advance(d);
  assert('pro low-core: results reached with no eligible parent', d.s.stage === 'results', `stage ${d.s.stage}`);
  assert('pro low-core: strategy primary null', d.s.strategyResult?.primary === null);
  assert('pro low-core: outcome no-clear-strategy', d.s.strategyResult?.outcome === 'no-clear-strategy');
  assert('pro low-core: no-eligible-expression-parent category', d.s.expressionGroupResult?.category === 'no-eligible-expression-parent');
  assert('pro low-core: screening result null', d.s.expressionScreeningResult === null);
  assert('pro low-core: confirmation result null', d.s.expressionConfirmationResult === null);
  assert('pro low-core: strategy result equivalence', sameResult(d.s.strategyResult, produceStrategyRoutingResult(mergedOf(d.s), 'pro')));
  assert('pro low-core: presented total 102', d.presented === CORE_PRO_COUNT + UNIVERSAL_COUNT + 9 + 9, `presented ${d.presented}`);
  assert('pro low-core: completion complete', d.s.completionState === 'complete');
}

{
  const d: Driver = { s: startAssessmentSession('pro'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  assert('pro no-clear-group: group stage reached', d.s.stage === 'expression-group-screening');
  answerCurrentMin(d);
  advance(d);
  assert('pro no-clear-group: results reached', d.s.stage === 'results');
  assert('pro no-clear-group: category no-clear-group', d.s.expressionGroupResult?.category === 'no-clear-group');
  assert('pro no-clear-group: no selected groups', d.s.expressionGroupResult?.selectedGroups.length === 0);
  assert('pro no-clear-group: screening and confirmation null', d.s.expressionScreeningResult === null && d.s.expressionConfirmationResult === null);
  assert('pro no-clear-group: presented total 114', d.presented === CORE_PRO_COUNT + UNIVERSAL_COUNT + 9 + 9 + 12, `presented ${d.presented}`);
  assert('pro no-clear-group: completion complete', d.s.completionState === 'complete');
}

{
  const d: Driver = { s: startAssessmentSession('pro'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  assert('pro insufficient-group: group stage reached', d.s.stage === 'expression-group-screening');
  skipCurrent(d);
  advance(d);
  assert('pro insufficient-group: retry pass re-presents all group items', d.s.currentItemIds.length === 12, `retry scope ${d.s.currentItemIds.length}`);
  skipCurrent(d);
  advance(d);
  assert('pro insufficient-group: all group items unresolved', d.s.retryState.unresolvedItemIds.length === 12);
  assert('pro insufficient-group: results reached', d.s.stage === 'results');
  assert('pro insufficient-group: category insufficient-group-evidence', d.s.expressionGroupResult?.category === 'insufficient-group-evidence');
  assert('pro insufficient-group: presented total 126', d.presented === CORE_PRO_COUNT + UNIVERSAL_COUNT + 9 + 9 + 12 + 12, `presented ${d.presented}`);
  assert('pro insufficient-group: completion complete', d.s.completionState === 'complete');
}

/* ==================================================================
 *  H. Confirmation outcomes
 * ================================================================*/

function driveToConfirmation(): Driver {
  const d: Driver = { s: startAssessmentSession('pro'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  return d;
}

{
  const d = driveToConfirmation();
  assert('pro zero-confirmed: confirmation stage reached', d.s.stage === 'expression-confirmation' && d.s.currentItemIds.length === 4);
  answerCurrentMin(d);
  advance(d);
  assert('pro zero-confirmed: results reached', d.s.stage === 'results');
  assert('pro zero-confirmed: zero confirmed', d.s.expressionConfirmationResult?.totalConfirmed === 0);
  assert('pro zero-confirmed: category no-clear-expression', d.s.expressionConfirmationResult?.resultCategory === 'no-clear-expression');
  assert('pro zero-confirmed: presented total 140', d.presented === CORE_PRO_COUNT + UNIVERSAL_COUNT + 9 + 9 + 12 + 22 + 4, `presented ${d.presented}`);
  assert('pro zero-confirmed: completion complete', d.s.completionState === 'complete');
}

{
  const d = driveToConfirmation();
  const confIds = scope(d);
  assert('pro one-confirmed: confirmation scope of 4', confIds.length === 4);
  confIds.forEach((id, index) => {
    d.s = recordAssessmentResponse(d.s, id, index === 0 ? stageValue(id, true) : stageValue(id, false));
  });
  d.presented += confIds.length;
  advance(d);
  assert('pro one-confirmed: exactly one confirmed', d.s.expressionConfirmationResult?.totalConfirmed === 1);
  assert('pro one-confirmed: three rejected', d.s.expressionConfirmationResult?.totalRejected === 3);
  assert('pro one-confirmed: confirmed entry is first candidate', d.s.expressionConfirmationResult?.confirmedExpressions[0].expressionId === d.s.expressionScreeningResult!.selectedCandidates[0].expressionId);
  assert('pro one-confirmed: completion complete', d.s.completionState === 'complete');
}

{
  const d = driveToConfirmation();
  const confIds = scope(d);
  assert('pro double-skip: confirmation scope of 4', confIds.length === 4);
  skipCurrent(d);
  advance(d);
  assert('pro double-skip: confirmation retry pass', d.s.currentItemIds.length === 4);
  skipCurrent(d);
  advance(d);
  assert('pro double-skip: results reached', d.s.stage === 'results');
  assert('pro double-skip: all four unresolved', d.s.expressionConfirmationResult?.totalUnresolved === 4);
  assert('pro double-skip: unresolved ids tracked', d.s.retryState.unresolvedItemIds.length === 4);
  assert('pro double-skip: confirmation partial', d.s.expressionConfirmationResult?.completionState === 'partial');
  assert('pro double-skip: session partial', d.s.completionState === 'partial');
  assert('pro double-skip: result category insufficient-evidence', d.s.expressionConfirmationResult?.resultCategory === 'insufficient-evidence');
  assert('pro double-skip: presented total 144', d.presented === CORE_PRO_COUNT + UNIVERSAL_COUNT + 9 + 9 + 12 + 22 + 4 + 4, `presented ${d.presented}`);
  assert(
    'pro double-skip: confirmation result equivalence',
    sameResult(
      d.s.expressionConfirmationResult,
      confirmExpressionCandidates('pro', d.s.expressionScreeningResult!.selectedCandidates, entriesOf(d.s, confIds), retryEntriesOf(d.s, confIds)),
    ),
  );
}

/* ==================================================================
 *  I. Serialization
 * ================================================================*/

{
  const roundTrip = deserializeAssessmentSession(serializeAssessmentSession(maxS));
  assert('serialize: round trip returns non-null', roundTrip !== null);
  if (roundTrip) {
    assert('serialize: round trip byte-identical', serializeAssessmentSession(roundTrip) === serializeAssessmentSession(maxS));
    assert('serialize: mode preserved', roundTrip.mode === maxS.mode);
    assert('serialize: stage preserved', roundTrip.stage === maxS.stage);
    assert('serialize: responses preserved', sameJson(roundTrip.responses, maxS.responses));
    assert('serialize: retry responses preserved', sameJson(roundTrip.retryResponses, maxS.retryResponses));
    assert('serialize: retry state preserved', sameJson(roundTrip.retryState, maxS.retryState));
    assert('serialize: core result preserved', sameJson(roundTrip.coreResult, maxS.coreResult));
    assert('serialize: strategy result preserved', sameJson(roundTrip.strategyResult, maxS.strategyResult));
    assert('serialize: group result preserved', sameJson(roundTrip.expressionGroupResult, maxS.expressionGroupResult));
    assert('serialize: screening result preserved', sameJson(roundTrip.expressionScreeningResult, maxS.expressionScreeningResult));
    assert('serialize: confirmation result preserved', sameJson(roundTrip.expressionConfirmationResult, maxS.expressionConfirmationResult));
    assert('serialize: navigation target preserved', roundTrip.navigationTarget.patternId === maxS.navigationTarget.patternId);
    assert('serialize: timestamps preserved', roundTrip.createdAt === maxS.createdAt && roundTrip.updatedAt === maxS.updatedAt);
  }
}

{
  const mid = startAssessmentSession('free');
  const midIds = getCurrentStageItems(mid);
  const midAnswered = recordAssessmentResponse(mid, midIds[0], 4);
  const roundTrip = deserializeAssessmentSession(serializeAssessmentSession(midAnswered));
  assert('serialize: mid-core round trip non-null', roundTrip !== null);
  if (roundTrip) {
    assert('serialize: mid-core round trip identical', serializeAssessmentSession(roundTrip) === serializeAssessmentSession(midAnswered));
    assert('serialize: completion state recomputed', roundTrip.completionState === 'in-progress');
  }
}

{
  const freshRoundTrip = deserializeAssessmentSession(serializeAssessmentSession(fresh));
  assert('serialize: fresh round trip non-null', freshRoundTrip !== null);
  if (freshRoundTrip) {
    assert('serialize: fresh completion stays not-started', freshRoundTrip.completionState === 'not-started');
  }
}

assert('deserialize: invalid JSON returns null', deserializeAssessmentSession('not json') === null);
assert('deserialize: truncated JSON returns null', deserializeAssessmentSession('{"mode":"free"') === null);
assert('deserialize: wrong version returns null', deserializeAssessmentSession(
  JSON.stringify({ ...JSON.parse(serializeAssessmentSession(fresh)), sessionVersion: 'strategy-9.9.9|groups-9.9.9' }),
) === null);
assert('deserialize: invalid mode returns null', deserializeAssessmentSession(
  JSON.stringify({ ...JSON.parse(serializeAssessmentSession(fresh)), mode: 'premium' }),
) === null);
assert('deserialize: invalid stage returns null', deserializeAssessmentSession(
  JSON.stringify({ ...JSON.parse(serializeAssessmentSession(fresh)), stage: 'corex' }),
) === null);
assert('deserialize: missing navigation target returns null', (() => {
  const payload = JSON.parse(serializeAssessmentSession(fresh)) as Record<string, unknown>;
  delete payload.navigationTarget;
  return deserializeAssessmentSession(JSON.stringify(payload)) === null;
})());
assert('deserialize: missing retry state returns null', (() => {
  const payload = JSON.parse(serializeAssessmentSession(fresh)) as Record<string, unknown>;
  delete payload.retryState;
  return deserializeAssessmentSession(JSON.stringify(payload)) === null;
})());
assert('deserialize: responses as array returns null', deserializeAssessmentSession(
  JSON.stringify({ ...JSON.parse(serializeAssessmentSession(fresh)), responses: [] }),
) === null);
assert('deserialize: current items non-array returns null', deserializeAssessmentSession(
  JSON.stringify({ ...JSON.parse(serializeAssessmentSession(fresh)), currentItemIds: 'core' }),
) === null);
assert('deserialize: invalid completion state returns null', deserializeAssessmentSession(
  JSON.stringify({ ...JSON.parse(serializeAssessmentSession(fresh)), completionState: 'bogus' }),
) === null);
assert('deserialize: numeric timestamp returns null', deserializeAssessmentSession(
  JSON.stringify({ ...JSON.parse(serializeAssessmentSession(fresh)), createdAt: 123 }),
) === null);
assert('deserialize: out-of-range response value sanitized', (() => {
  const payload = JSON.parse(serializeAssessmentSession(fresh)) as Record<string, unknown>;
  const responses = payload.responses as Record<string, unknown>;
  responses['strategy-martyr-01'] = 6;
  responses['strategy-martyr-02'] = 5;
  const result = deserializeAssessmentSession(JSON.stringify(payload));
  if (result === null) return false;
  return result.responses['strategy-martyr-01'] === undefined && result.responses['strategy-martyr-02'] === 5;
})());
assert('deserialize: unknown item id dropped', (() => {
  const payload = JSON.parse(serializeAssessmentSession(fresh)) as Record<string, unknown>;
  const responses = payload.responses as Record<string, unknown>;
  responses['not-a-real-item'] = 5;
  const result = deserializeAssessmentSession(JSON.stringify(payload));
  if (result === null) return false;
  return result.responses['not-a-real-item'] === undefined;
})());
assert('deserialize: not-started stage accepted', (() => {
  const payload = JSON.parse(serializeAssessmentSession(fresh)) as Record<string, unknown>;
  payload.stage = 'not-started';
  const result = deserializeAssessmentSession(JSON.stringify(payload));
  if (result === null) return false;
  return result.completionState === 'not-started';
})());
{
  const terminalJson = serializeAssessmentSession(maxS);
  const restored = deserializeAssessmentSession(terminalJson);
  assert('deserialize: terminal results session continues to be immutable no-op at results', (() => {
    if (restored === null) return false;
    const advanced = advanceAssessmentStage(restored);
    return advanced.stage === 'results';
  })());
}

/* ==================================================================
 *  J. Mutation safety
 * ================================================================*/

{
  const baseline = startAssessmentSession('pro');
  const deepFreeze = (value: unknown): void => {
    if (typeof value === 'object' && value !== null) {
      Object.freeze(value);
      for (const key of Object.keys(value)) {
        deepFreeze((value as Record<string, unknown>)[key]);
      }
    }
  };
  const frozen = JSON.parse(serializeAssessmentSession(baseline)) as AssessmentSession;
  deepFreeze(frozen);
  const frozenSerialized = JSON.stringify(frozen);
  const responded = recordAssessmentResponse(frozen, frozen.currentItemIds[0], 5);
  const skipped = skipAssessmentItem(frozen, frozen.currentItemIds[1]);
  const advanced = advanceAssessmentStage(frozen);
  getCurrentStageItems(frozen);
  assert('mutation safety: frozen input unchanged after record', JSON.stringify(frozen) === frozenSerialized);
  assert('mutation safety: frozen input unchanged after skip', JSON.stringify(frozen) === frozenSerialized);
  assert('mutation safety: frozen input unchanged after advance', JSON.stringify(frozen) === frozenSerialized);
  assert('mutation safety: frozen input unchanged after stage items read', JSON.stringify(frozen) === frozenSerialized);
  assert('mutation safety: record returns new object', responded !== frozen);
  assert('mutation safety: skip returns new object', skipped !== frozen);
  assert('mutation safety: advance is no-op returning same object while items pending', advanced === frozen);
  assert('mutation safety: response applied to returned object', responded.responses[frozen.currentItemIds[0]] === 5);
}

/* ==================================================================
 *  K. Preservation of existing application surfaces
 * ================================================================*/

{
  const libSource = fs.readFileSync(
    path.join(import.meta.dirname, 'src/lib/quiz/assessmentSession.ts'),
    'utf8',
  );
  assert('preservation: new lib has no react imports', !/from ['"]react['"]/.test(libSource));
  assert('preservation: new lib has no storage access', !libSource.includes('localStorage') && !libSource.includes('sessionStorage'));
  assert('preservation: new lib has no window access', !libSource.includes('window.'));
  assert('preservation: new lib has no fetch', !libSource.includes('fetch('));
  assert('preservation: new lib has no document access', !libSource.includes('document.'));

  const walk = (dir: string): string[] => {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...walk(full));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        out.push(full);
      }
    }
    return out;
  };
  const srcDir = path.join(import.meta.dirname, 'src');
  const violators: string[] = [];
  for (const file of walk(srcDir)) {
    if (file.endsWith('assessmentSession.ts')) continue;
    if (file.endsWith('assessmentSessionStorage.ts')) continue;
    if (file.includes('src/components/quiz/')) continue;
    if (file.endsWith('assessmentUiModel.ts')) continue;
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('assessmentSession')) {
      violators.push(file);
    }
  }
  assert('preservation: no other src file references the assessment session module', violators.length === 0, violators.join(', '));

  const appSource = fs.readFileSync(path.join(import.meta.dirname, 'src/App.tsx'), 'utf8');
  assert('preservation: App.tsx does not import the new module', !appSource.includes('assessmentSession'));

  const legacyQuizPath = path.join(import.meta.dirname, 'src/components/PersonalityQuiz.tsx');
  const legacyDataPath = path.join(import.meta.dirname, 'src/data/personalityQuiz.ts');
  assert('Batch 10: legacy PersonalityQuiz component removed', !fs.existsSync(legacyQuizPath));
  assert('Batch 10: legacy personalityQuiz data removed', !fs.existsSync(legacyDataPath));
}

/* ==================================================================
 *  Summary
 * ================================================================*/

console.log('==========================================');
console.log('Runtime Assessment Session Orchestration Validation');
console.log('------------------------------------------');
console.log(`session version: ${ASSESSMENT_SESSION_VERSION}`);
console.log(`core items free/pro: ${CORE_FREE_COUNT}/${CORE_PRO_COUNT}`);
console.log(`universal screeners: ${UNIVERSAL_COUNT}`);
console.log(`pro max presented total: ${maxPresented}`);
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
