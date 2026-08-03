import type {
  CorePatternId,
  StrategyPatternId,
  ExpressionId,
  QuizScoreState,
  QuizLayerResult,
  PatternQuizResult,
  ConfidenceLevel,
} from '../../types/quiz';
import {
  CORE_PATTERN_IDS,
  STRATEGY_PATTERN_IDS,
  EXPRESSION_REGISTRY,
  STRATEGY_CORE_COMPATIBILITY,
  getExpressionParent,
} from '../../data/quiz/patternTaxonomy';
import { STRATEGY_COMPATIBILITY_BOOST_FACTOR, NEAR_TIE_FRACTION, EXPRESSION_CONFIDENCE_THRESHOLD } from '../../types/quiz';

export interface QuizScoreIncrement {
  targetType: 'core' | 'strategy' | 'expression';
  targetId: string;
  value: number;
}

export function emptyQuizScoreState(): QuizScoreState {
  const core = {} as Record<CorePatternId, number>;
  const strategy = {} as Record<StrategyPatternId, number>;
  for (const id of CORE_PATTERN_IDS) core[id] = 0;
  for (const id of STRATEGY_PATTERN_IDS) strategy[id] = 0;
  return { core, strategy, expression: {} };
}

export function computeQuizScores(increments: QuizScoreIncrement[]): QuizScoreState {
  const state = emptyQuizScoreState();

  for (const inc of increments) {
    if (inc.targetType === 'core') {
      const id = inc.targetId as CorePatternId;
      if (id in state.core) {
        state.core[id] += inc.value;
      }
    } else if (inc.targetType === 'strategy') {
      const id = inc.targetId as StrategyPatternId;
      if (id in state.strategy) {
        state.strategy[id] += inc.value;
      }
    } else if (inc.targetType === 'expression') {
      const id = inc.targetId;
      if (!(id in state.expression)) {
        state.expression[id] = 0;
      }
      state.expression[id] += inc.value;
    }
  }

  return state;
}

function normalizeLayer(scores: Record<string, number>): Record<string, number> {
  const values = Object.values(scores);
  const max = values.length > 0 ? Math.max(...values) : 0;
  if (max <= 0) {
    const result: Record<string, number> = {};
    for (const key of Object.keys(scores)) result[key] = 0;
    return result;
  }
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(scores)) {
    result[key] = val / max;
  }
  return result;
}

function computeConfidence(normalizedScore: number): ConfidenceLevel {
  if (normalizedScore >= 0.8) return 'high';
  if (normalizedScore >= 0.4) return 'moderate';
  return 'low';
}

function sortByStableId<T extends string>(entries: { id: T; score: number }[]): { id: T; score: number }[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
}

function isNearTie(winnerScore: number, contenderScore: number): boolean {
  if (winnerScore <= 0) return false;
  return (winnerScore - contenderScore) / winnerScore <= NEAR_TIE_FRACTION;
}

function findLayerWinner<TId extends string>(
  ids: readonly TId[],
  rawScores: Record<string, number>,
): { winner: QuizLayerResult<TId> | null; secondary: QuizLayerResult<TId>[] } {
  const entries = ids
    .map(id => ({ id: id as TId, rawScore: rawScores[id as string] ?? 0 }))
    .filter(e => e.rawScore > 0);

  if (entries.length === 0) {
    return { winner: null, secondary: [] };
  }

  const normalized = normalizeLayer(
    Object.fromEntries(entries.map(e => [e.id, e.rawScore]))
  );

  const sorted = sortByStableId(entries.map(e => ({
    id: e.id as TId,
    score: e.rawScore,
  })));

  const best = sorted[0];
  const bestNormalized = normalized[best.id as string] ?? 0;

  const secondary: QuizLayerResult<TId>[] = [];
  for (let i = 1; i < sorted.length; i++) {
    if (isNearTie(best.score, sorted[i].score)) {
      secondary.push({
        id: sorted[i].id,
        rawScore: sorted[i].score,
        normalizedScore: normalized[sorted[i].id as string] ?? 0,
        confidence: computeConfidence(normalized[sorted[i].id as string] ?? 0),
      });
    }
  }

  return {
    winner: {
      id: best.id,
      rawScore: best.score,
      normalizedScore: bestNormalized,
      confidence: computeConfidence(bestNormalized),
    },
    secondary,
  };
}

function hasDirectStrategyEvidence(state: QuizScoreState): boolean {
  return Object.values(state.strategy).some(v => v > 0);
}

function findStrategyWinner(
  state: QuizScoreState,
): { winner: QuizLayerResult<StrategyPatternId> | null; secondary: QuizLayerResult<StrategyPatternId>[] } {
  if (!hasDirectStrategyEvidence(state)) {
    return { winner: null, secondary: [] };
  }

  const normalizedCore = normalizeLayer(state.core as unknown as Record<string, number>);

  const boostedScores: Record<string, number> = {};
  for (const sid of STRATEGY_PATTERN_IDS) {
    const direct = state.strategy[sid] ?? 0;
    const compatibleCores = STRATEGY_CORE_COMPATIBILITY[sid] ?? [];
    let bestCompatNormalized = 0;
    for (const cid of compatibleCores) {
      const n = normalizedCore[cid as string] ?? 0;
      if (n > bestCompatNormalized) bestCompatNormalized = n;
    }
    boostedScores[sid] = direct + bestCompatNormalized * STRATEGY_COMPATIBILITY_BOOST_FACTOR;
  }

  const entries = STRATEGY_PATTERN_IDS
    .map(id => ({ id: id as StrategyPatternId, rawScore: state.strategy[id], boostedScore: boostedScores[id as string] }))
    .filter(e => e.rawScore > 0);

  if (entries.length === 0) {
    return { winner: null, secondary: [] };
  }

  const normalizedBoosted = normalizeLayer(boostedScores);
  const normalizedDirect = normalizeLayer(state.strategy as unknown as Record<string, number>);

  const sorted = sortByStableId(entries.map(e => ({
    id: e.id as StrategyPatternId,
    score: e.boostedScore,
  })));

  const best = sorted[0];
  const bestDirectScore = state.strategy[best.id];

  const secondary: QuizLayerResult<StrategyPatternId>[] = [];
  for (let i = 1; i < sorted.length; i++) {
    if (isNearTie(best.score, sorted[i].score)) {
      secondary.push({
        id: sorted[i].id,
        rawScore: state.strategy[sorted[i].id],
        normalizedScore: normalizedDirect[sorted[i].id as string] ?? 0,
        confidence: computeConfidence(normalizedDirect[sorted[i].id as string] ?? 0),
      });
    }
  }

  return {
    winner: {
      id: best.id,
      rawScore: bestDirectScore,
      normalizedScore: normalizedDirect[best.id as string] ?? 0,
      confidence: computeConfidence(normalizedDirect[best.id as string] ?? 0),
    },
    secondary,
  };
}

function findExpressionWinner(
  state: QuizScoreState,
  winningCoreId: CorePatternId | null,
  winningStrategyId: StrategyPatternId | null,
): { winner: QuizLayerResult<ExpressionId> | null } {
  const expressionEntries = Object.entries(state.expression)
    .filter(([, score]) => score >= EXPRESSION_CONFIDENCE_THRESHOLD)
    .map(([id, rawScore]) => ({ id, rawScore, parentId: getExpressionParent(id) }))
    .filter(e => e.parentId !== undefined);

  const relevantParentIds = new Set<string>();
  if (winningCoreId) relevantParentIds.add(winningCoreId);
  if (winningStrategyId) relevantParentIds.add(winningStrategyId);

  const gated = expressionEntries.filter(e => relevantParentIds.has(e.parentId!));

  if (gated.length === 0) {
    return { winner: null };
  }

  const normalized = normalizeLayer(
    Object.fromEntries(gated.map(e => [e.id, e.rawScore]))
  );

  const sorted = sortByStableId(gated.map(e => ({
    id: e.id,
    score: e.rawScore,
  })));

  const best = sorted[0];

  return {
    winner: {
      id: best.id,
      rawScore: best.score,
      normalizedScore: normalized[best.id] ?? 0,
      confidence: computeConfidence(normalized[best.id] ?? 0),
    },
  };
}

export function computeQuizResult(state: QuizScoreState): PatternQuizResult {
  const coreResult = findLayerWinner<CorePatternId>(CORE_PATTERN_IDS, state.core as unknown as Record<string, number>);
  const strategyResult = findStrategyWinner(state);
  const expressionResult = findExpressionWinner(state, coreResult.winner?.id ?? null, strategyResult.winner?.id ?? null);

  return {
    core: coreResult.winner,
    strategy: strategyResult.winner,
    expression: expressionResult.winner,
    secondaryCores: coreResult.secondary,
    secondaryStrategies: strategyResult.secondary,
  };
}

export function getNavigationTarget(result: PatternQuizResult): { patternId: string } {
  if (result.strategy) {
    return { patternId: result.strategy.id };
  }
  if (result.core) {
    return { patternId: result.core.id };
  }
  return { patternId: '' };
}
