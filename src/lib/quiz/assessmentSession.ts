import { APPROVED_QUIZ_ITEMS } from '../../data/quiz/approvedQuestions';
import { EXPRESSION_GROUP_SCREENING_ITEMS } from '../../data/quiz/expressionGroupScreeningItems';
import { EXPRESSION_GROUP_SCREENING_CONFIG } from '../../data/quiz/expressionGroupScreeningConfig';
import { EXPRESSION_SCREENING_ITEMS } from '../../data/quiz/expressionScreeningItems';
import { EXPRESSION_SCREENING_CONFIG } from '../../data/quiz/expressionScreeningConfig';
import { EXPRESSION_CONFIRMATION_ITEMS } from '../../data/quiz/expressionConfirmationItems';
import { EXPRESSION_CONFIRMATION_CONFIG } from '../../data/quiz/expressionConfirmationConfig';
import {
  getApprovedItemsForMode,
  getUniversalStrategyScreenItems,
  scoreApprovedItemResponse,
} from '../../data/quiz/questionBank';
import {
  computeQuizScores,
  computeQuizResult,
  getNavigationTarget,
} from './scoringEngine';
import type { QuizScoreIncrement } from './scoringEngine';
import {
  produceStrategyRoutingResult,
  selectInitialStrategyCandidates,
  evaluateUniversalEligibility,
  scoreStrategyDirectEvidence,
  getFreeStrategyFollowUp,
  getProFirstStrategyBatch,
  getProSecondStrategyBatch,
  shouldStopProStrategyRouting,
} from './strategyRouting';
import {
  routeExpressionGroupScreening,
  selectExpressionParentBranches,
  getGroupsForExpressionParent,
  getGroupScreeningItemIds,
} from './expressionGroupScreening';
import {
  routeExpressionScreening,
  getEligibleExpressionIds,
  getExpressionScreeningItems,
} from './expressionScreening';
import {
  confirmExpressionCandidates,
  getConfirmationItemForExpression,
} from './expressionConfirmation';
import type {
  AssessmentMode,
  AssessmentStage,
  AssessmentResponseValue,
  AssessmentSession,
  AssessmentCompletionState,
} from '../../types/assessmentSession';
import type { PatternQuizResult, ConfidenceLevel } from '../../types/quiz';
import type { ExpressionConfirmationResponseEntry } from '../../types/expressionConfirmation';
import type { StrategyCandidateSelection } from '../../types/strategyRouting';
import type { StrategyCandidateScore } from '../../types/strategyRouting';

export const ASSESSMENT_SESSION_VERSION =
  `strategy-1.0|groups-${EXPRESSION_GROUP_SCREENING_CONFIG.configVersion}|screening-${EXPRESSION_SCREENING_CONFIG.configVersion}|confirmation-${EXPRESSION_CONFIRMATION_CONFIG.configVersion}`;

const ALL_STAGES: readonly AssessmentStage[] = [
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

const KNOWN_ITEM_IDS = new Set<string>([
  ...APPROVED_QUIZ_ITEMS.map(i => i.id),
  ...EXPRESSION_GROUP_SCREENING_ITEMS.map(i => i.id),
  ...EXPRESSION_SCREENING_ITEMS.map(i => i.id),
  ...EXPRESSION_CONFIRMATION_ITEMS.map(i => i.id),
]);

function now(): string {
  return new Date().toISOString();
}

function cloneSession(session: AssessmentSession): AssessmentSession {
  return {
    ...session,
    responses: { ...session.responses },
    retryResponses: { ...session.retryResponses },
    retryState: {
      skippedItemIds: [...session.retryState.skippedItemIds],
      retriedItemIds: [...session.retryState.retriedItemIds],
      unresolvedItemIds: [...session.retryState.unresolvedItemIds],
    },
    currentItemIds: [...session.currentItemIds],
    completedItemIds: [...session.completedItemIds],
    navigationTarget: { ...session.navigationTarget },
  };
}

function coreItemIds(mode: AssessmentMode): string[] {
  return getApprovedItemsForMode(mode)
    .filter(i => i.layer === 'core')
    .map(i => i.id);
}

function universalItemIds(mode: AssessmentMode): string[] {
  return getUniversalStrategyScreenItems(mode).map(i => i.id);
}

function mergeResponses(session: AssessmentSession): Record<string, number> {
  return { ...session.responses, ...session.retryResponses };
}

function responseEntries(
  session: AssessmentSession,
  scope: readonly string[],
): ExpressionConfirmationResponseEntry[] {
  const scopeSet = new Set(scope);
  const entries: ExpressionConfirmationResponseEntry[] = [];
  for (const [itemId, selectedValue] of Object.entries(session.responses)) {
    if (scopeSet.has(itemId)) {
      entries.push({ itemId, selectedValue });
    }
  }
  return entries;
}

function retryEntries(
  session: AssessmentSession,
  scope: readonly string[],
): ExpressionConfirmationResponseEntry[] {
  const scopeSet = new Set(scope);
  const entries: ExpressionConfirmationResponseEntry[] = [];
  for (const [itemId, selectedValue] of Object.entries(session.retryResponses)) {
    if (scopeSet.has(itemId)) {
      entries.push({ itemId, selectedValue });
    }
  }
  return entries;
}

function confidenceFor(normalizedScore: number): ConfidenceLevel {
  if (normalizedScore >= 0.8) return 'high';
  if (normalizedScore >= 0.4) return 'moderate';
  return 'low';
}

function computeCoreResult(session: AssessmentSession): PatternQuizResult {
  const increments: QuizScoreIncrement[] = [];
  for (const [itemId, selectedValue] of Object.entries(session.responses)) {
    const item = APPROVED_QUIZ_ITEMS.find(i => i.id === itemId);
    if (!item || item.layer !== 'core') continue;
    increments.push({
      targetType: 'core',
      targetId: item.patternId,
      value: scoreApprovedItemResponse(item, selectedValue),
    });
  }
  return computeQuizResult(computeQuizScores(increments));
}

function initialCandidates(
  session: AssessmentSession,
  merged: Record<string, number>,
): {
  candidates: StrategyCandidateSelection[];
  combinedScores: StrategyCandidateScore[];
} {
  const eligibility = evaluateUniversalEligibility(merged);
  const directScores = scoreStrategyDirectEvidence(merged);
  const selection = selectInitialStrategyCandidates(eligibility, directScores, session.mode, merged);
  return { candidates: selection.candidates, combinedScores: selection.combinedScores };
}

function buildExpressionStageQuizResult(session: AssessmentSession): PatternQuizResult {
  const core = session.coreResult?.core ?? null;
  const strategyResult = session.strategyResult;
  const strategy = strategyResult && strategyResult.primary
    ? {
        id: strategyResult.primary,
        rawScore: strategyResult.primaryRawScore,
        normalizedScore: strategyResult.primaryNormalizedScore,
        confidence: confidenceFor(strategyResult.primaryNormalizedScore),
      }
    : null;
  return {
    core,
    strategy,
    expression: null,
    secondaryCores: session.coreResult?.secondaryCores ?? [],
    secondaryStrategies: [],
  };
}

function groupStageItemIds(
  mode: AssessmentMode,
  quizResult: PatternQuizResult,
  merged: Record<string, number>,
): string[] {
  const { branches } = selectExpressionParentBranches(
    mode,
    quizResult,
    merged,
    EXPRESSION_GROUP_SCREENING_CONFIG,
  );
  const ids: string[] = [];
  for (const branch of branches) {
    for (const group of getGroupsForExpressionParent(branch.parentId)) {
      ids.push(...getGroupScreeningItemIds(group.id));
    }
  }
  return ids;
}

function screeningStageItemIds(advancingGroupIds: readonly string[]): string[] {
  const eligibleExpressionIds = getEligibleExpressionIds(advancingGroupIds);
  const ids: string[] = [];
  for (const expressionId of eligibleExpressionIds) {
    for (const item of getExpressionScreeningItems(expressionId)) {
      ids.push(item.id);
    }
  }
  return ids;
}

function confirmationStageItemIds(
  candidates: readonly { expressionId: string }[],
): string[] {
  const ids: string[] = [];
  for (const candidate of candidates) {
    const item = getConfirmationItemForExpression(candidate.expressionId);
    if (item) {
      ids.push(item.id);
    }
  }
  return ids;
}

function enterResults(session: AssessmentSession): void {
  session.stage = 'results';
  session.currentItemIds = [];
}

function finalizeStrategy(session: AssessmentSession, merged: Record<string, number>): void {
  const strategyResult = produceStrategyRoutingResult(merged, session.mode);
  session.strategyResult = strategyResult;
  session.navigationTarget = {
    patternId: strategyResult.primary ?? session.coreResult?.core?.id ?? '',
  };
}

function enterGroupStage(session: AssessmentSession, merged: Record<string, number>): void {
  const quizResult = buildExpressionStageQuizResult(session);
  const itemIds = groupStageItemIds(session.mode, quizResult, merged);
  if (itemIds.length === 0) {
    session.expressionGroupResult = routeExpressionGroupScreening(
      session.mode,
      quizResult,
      merged,
      [],
    );
    enterResults(session);
  } else {
    session.stage = 'expression-group-screening';
    session.currentItemIds = itemIds;
  }
}

function finalizeStage(session: AssessmentSession): void {
  const mode = session.mode;
  const merged = mergeResponses(session);

  switch (session.stage) {
    case 'core': {
      const coreResult = computeCoreResult(session);
      session.coreResult = coreResult;
      session.navigationTarget = getNavigationTarget(coreResult);
      session.stage = 'strategy-universal';
      session.currentItemIds = universalItemIds(mode);
      break;
    }
    case 'strategy-universal': {
      const { candidates } = initialCandidates(session, merged);
      if (candidates.length === 0) {
        finalizeStrategy(session, merged);
        if (mode === 'free') {
          enterResults(session);
        } else {
          enterGroupStage(session, merged);
        }
      } else if (mode === 'free') {
        session.currentItemIds = getFreeStrategyFollowUp(candidates, merged).allItemIds;
        session.stage = 'strategy-follow-up-first';
      } else {
        session.currentItemIds = getProFirstStrategyBatch(candidates, merged).allItemIds;
        session.stage = 'strategy-follow-up-first';
      }
      break;
    }
    case 'strategy-follow-up-first': {
      if (mode === 'free') {
        finalizeStrategy(session, merged);
        enterResults(session);
        break;
      }
      const { candidates, combinedScores } = initialCandidates(session, merged);
      const { stopped } = shouldStopProStrategyRouting(candidates, combinedScores, merged);
      if (stopped) {
        finalizeStrategy(session, merged);
        enterGroupStage(session, merged);
      } else {
        session.currentItemIds = getProSecondStrategyBatch(candidates, merged, combinedScores).allItemIds;
        session.stage = 'strategy-follow-up-second';
      }
      break;
    }
    case 'strategy-follow-up-second': {
      finalizeStrategy(session, merged);
      enterGroupStage(session, merged);
      break;
    }
    case 'expression-group-screening': {
      const quizResult = buildExpressionStageQuizResult(session);
      const allGroupItemIds = groupStageItemIds(mode, quizResult, merged);
      const groupResult = routeExpressionGroupScreening(
        mode,
        quizResult,
        merged,
        allGroupItemIds,
      );
      session.expressionGroupResult = groupResult;
      if (groupResult.selectedGroups.length === 0) {
        enterResults(session);
      } else {
        const advancingGroupIds = groupResult.selectedGroups.map(g => g.groupId);
        session.stage = 'expression-screening';
        session.currentItemIds = screeningStageItemIds(advancingGroupIds);
      }
      break;
    }
    case 'expression-screening': {
      const groupResult = session.expressionGroupResult;
      const advancingGroupIds = groupResult
        ? groupResult.selectedGroups.map(g => g.groupId)
        : [];
      const scope = screeningStageItemIds(advancingGroupIds);
      const screeningResult = routeExpressionScreening(
        mode,
        advancingGroupIds,
        responseEntries(session, scope),
        retryEntries(session, scope),
      );
      session.expressionScreeningResult = screeningResult;
      if (screeningResult.selectedCandidates.length === 0) {
        enterResults(session);
      } else {
        session.stage = 'expression-confirmation';
        session.currentItemIds = confirmationStageItemIds(screeningResult.selectedCandidates);
      }
      break;
    }
    case 'expression-confirmation': {
      const screeningResult = session.expressionScreeningResult;
      const candidates = screeningResult ? screeningResult.selectedCandidates : [];
      const scope = confirmationStageItemIds(candidates);
      const confirmationResult = confirmExpressionCandidates(
        mode,
        candidates,
        responseEntries(session, scope),
        retryEntries(session, scope),
      );
      session.expressionConfirmationResult = confirmationResult;
      if (confirmationResult.navigationTarget) {
        session.navigationTarget = { patternId: confirmationResult.navigationTarget.id };
      }
      enterResults(session);
      break;
    }
    case 'results':
      break;
    case 'not-started':
      break;
  }
}

export function startAssessmentSession(mode: AssessmentMode): AssessmentSession {
  const timestamp = now();
  return {
    sessionVersion: ASSESSMENT_SESSION_VERSION,
    mode,
    stage: 'core',
    responses: {},
    retryResponses: {},
    retryState: { skippedItemIds: [], retriedItemIds: [], unresolvedItemIds: [] },
    currentItemIds: coreItemIds(mode),
    completedItemIds: [],
    coreResult: null,
    strategyResult: null,
    expressionGroupResult: null,
    expressionScreeningResult: null,
    expressionConfirmationResult: null,
    navigationTarget: { patternId: '' },
    completionState: 'not-started',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function getCurrentStageItems(session: AssessmentSession): string[] {
  return [...session.currentItemIds];
}

export function recordAssessmentResponse(
  session: AssessmentSession,
  itemId: string,
  selectedValue: AssessmentResponseValue,
): AssessmentSession {
  const value = normalizeResponseValue(selectedValue);
  if (value === null) return session;
  if (!session.currentItemIds.includes(itemId)) return session;
  if (session.completedItemIds.includes(itemId)) return session;

  const next = cloneSession(session);
  if (next.retryState.skippedItemIds.includes(itemId)) {
    next.retryResponses[itemId] = value;
    next.retryState.skippedItemIds = next.retryState.skippedItemIds.filter(id => id !== itemId);
    next.retryState.retriedItemIds.push(itemId);
  } else {
    next.responses[itemId] = value;
  }
  next.currentItemIds = next.currentItemIds.filter(id => id !== itemId);
  next.completedItemIds.push(itemId);
  next.completionState = getAssessmentSessionCompletionState(next);
  next.updatedAt = now();
  return next;
}

export function skipAssessmentItem(
  session: AssessmentSession,
  itemId: string,
): AssessmentSession {
  if (!session.currentItemIds.includes(itemId)) return session;
  if (session.completedItemIds.includes(itemId)) return session;

  const next = cloneSession(session);
  next.currentItemIds = next.currentItemIds.filter(id => id !== itemId);
  if (next.stage === 'core') {
    next.completedItemIds.push(itemId);
  } else if (next.retryState.skippedItemIds.includes(itemId)) {
    next.retryState.skippedItemIds = next.retryState.skippedItemIds.filter(id => id !== itemId);
    next.retryState.unresolvedItemIds.push(itemId);
    next.completedItemIds.push(itemId);
  } else {
    next.retryState.skippedItemIds.push(itemId);
  }
  next.completionState = getAssessmentSessionCompletionState(next);
  next.updatedAt = now();
  return next;
}

export function advanceAssessmentStage(session: AssessmentSession): AssessmentSession {
  const next = cloneSession(session);

  if (next.stage === 'not-started') {
    next.stage = 'core';
    next.currentItemIds = coreItemIds(next.mode);
    next.completionState = getAssessmentSessionCompletionState(next);
    next.updatedAt = now();
    return next;
  }

  if (next.currentItemIds.length > 0) {
    return session;
  }

  const pendingRetry = next.retryState.skippedItemIds.filter(id =>
    !next.retryState.retriedItemIds.includes(id) &&
    !next.retryState.unresolvedItemIds.includes(id),
  );
  if (pendingRetry.length > 0) {
    next.currentItemIds = pendingRetry;
    next.completionState = getAssessmentSessionCompletionState(next);
    next.updatedAt = now();
    return next;
  }

  finalizeStage(next);
  next.completionState = getAssessmentSessionCompletionState(next);
  next.updatedAt = now();
  return next;
}

export function getAssessmentSessionCompletionState(
  session: AssessmentSession,
): AssessmentCompletionState {
  if (session.stage === 'not-started') return 'not-started';

  const untouched =
    session.stage === 'core' &&
    Object.keys(session.responses).length === 0 &&
    Object.keys(session.retryResponses).length === 0 &&
    session.retryState.skippedItemIds.length === 0 &&
    session.retryState.retriedItemIds.length === 0 &&
    session.retryState.unresolvedItemIds.length === 0 &&
    session.completedItemIds.length === 0;
  if (untouched) return 'not-started';

  if (session.stage === 'results') {
    if (session.expressionConfirmationResult?.completionState === 'partial') {
      return 'partial';
    }
    return 'complete';
  }

  return 'in-progress';
}

export function serializeAssessmentSession(session: AssessmentSession): string {
  return JSON.stringify({
    sessionVersion: session.sessionVersion,
    mode: session.mode,
    stage: session.stage,
    responses: session.responses,
    retryResponses: session.retryResponses,
    retryState: session.retryState,
    currentItemIds: session.currentItemIds,
    completedItemIds: session.completedItemIds,
    coreResult: session.coreResult,
    strategyResult: session.strategyResult,
    expressionGroupResult: session.expressionGroupResult,
    expressionScreeningResult: session.expressionScreeningResult,
    expressionConfirmationResult: session.expressionConfirmationResult,
    navigationTarget: session.navigationTarget,
    completionState: session.completionState,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  });
}

function sanitizeResponses(value: unknown): Record<string, AssessmentResponseValue> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const out: Record<string, AssessmentResponseValue> = {};
  for (const [id, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!KNOWN_ITEM_IDS.has(id)) continue;
    if (typeof entry !== 'number' || !Number.isInteger(entry)) continue;
    if (entry < 1 || entry > 5) continue;
    out[id] = entry as AssessmentResponseValue;
  }
  return out;
}

function sanitizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  for (const entry of value) {
    if (typeof entry !== 'string') return null;
  }
  return [...value];
}

function sanitizeNullableObject(value: unknown): boolean {
  return value === null || (typeof value === 'object' && !Array.isArray(value));
}

export function deserializeAssessmentSession(json: string): AssessmentSession | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;

  const raw = parsed as Record<string, unknown>;
  if (raw.sessionVersion !== ASSESSMENT_SESSION_VERSION) return null;
  if (raw.mode !== 'free' && raw.mode !== 'pro') return null;
  if (typeof raw.stage !== 'string' || !ALL_STAGES.includes(raw.stage as AssessmentStage)) {
    return null;
  }

  const responses = sanitizeResponses(raw.responses);
  if (responses === null) return null;
  const retryResponses = sanitizeResponses(raw.retryResponses);
  if (retryResponses === null) return null;

  if (typeof raw.retryState !== 'object' || raw.retryState === null || Array.isArray(raw.retryState)) {
    return null;
  }
  const retryState = raw.retryState as Record<string, unknown>;
  const skippedItemIds = sanitizeStringArray(retryState.skippedItemIds);
  if (skippedItemIds === null) return null;
  const retriedItemIds = sanitizeStringArray(retryState.retriedItemIds);
  if (retriedItemIds === null) return null;
  const unresolvedItemIds = sanitizeStringArray(retryState.unresolvedItemIds);
  if (unresolvedItemIds === null) return null;

  const currentItemIds = sanitizeStringArray(raw.currentItemIds);
  if (currentItemIds === null) return null;
  const completedItemIds = sanitizeStringArray(raw.completedItemIds);
  if (completedItemIds === null) return null;

  if (!sanitizeNullableObject(raw.coreResult)) return null;
  if (!sanitizeNullableObject(raw.strategyResult)) return null;
  if (!sanitizeNullableObject(raw.expressionGroupResult)) return null;
  if (!sanitizeNullableObject(raw.expressionScreeningResult)) return null;
  if (!sanitizeNullableObject(raw.expressionConfirmationResult)) return null;

  if (typeof raw.navigationTarget !== 'object' || raw.navigationTarget === null || Array.isArray(raw.navigationTarget)) {
    return null;
  }
  const navigationTarget = raw.navigationTarget as Record<string, unknown>;
  if (typeof navigationTarget.patternId !== 'string') return null;

  const completionState = raw.completionState;
  if (
    completionState !== 'not-started' &&
    completionState !== 'in-progress' &&
    completionState !== 'partial' &&
    completionState !== 'complete'
  ) {
    return null;
  }

  if (typeof raw.createdAt !== 'string') return null;
  if (typeof raw.updatedAt !== 'string') return null;

  const session: AssessmentSession = {
    sessionVersion: ASSESSMENT_SESSION_VERSION,
    mode: raw.mode as AssessmentMode,
    stage: raw.stage as AssessmentStage,
    responses,
    retryResponses,
    retryState: {
      skippedItemIds,
      retriedItemIds,
      unresolvedItemIds,
    },
    currentItemIds,
    completedItemIds,
    coreResult: raw.coreResult as AssessmentSession['coreResult'],
    strategyResult: raw.strategyResult as AssessmentSession['strategyResult'],
    expressionGroupResult: raw.expressionGroupResult as AssessmentSession['expressionGroupResult'],
    expressionScreeningResult: raw.expressionScreeningResult as AssessmentSession['expressionScreeningResult'],
    expressionConfirmationResult: raw.expressionConfirmationResult as AssessmentSession['expressionConfirmationResult'],
    navigationTarget: { patternId: navigationTarget.patternId },
    completionState,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
  session.completionState = getAssessmentSessionCompletionState(session);
  return session;
}

function normalizeResponseValue(value: AssessmentResponseValue): AssessmentResponseValue | null {
  const numeric = typeof value === 'number' && Number.isInteger(value) ? value : NaN;
  if (numeric >= 1 && numeric <= 5) {
    return numeric as AssessmentResponseValue;
  }
  return null;
}
