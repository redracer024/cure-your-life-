import type { PatternKey } from '../../data/personalityQuiz';
import type { QuizScoreIncrement } from './scoringEngine';
import { computeQuizScores, computeQuizResult, getNavigationTarget } from './scoringEngine';
import type { PatternQuizResult } from '../../types/quiz';

const QUIZKEY_TO_PATTERN_ID: Record<PatternKey, { targetType: 'core' | 'strategy'; targetId: string }> = {
  A: { targetType: 'strategy', targetId: 'martyr' },
  B: { targetType: 'core', targetId: 'silenced-one' },
  C: { targetType: 'core', targetId: 'unheld-one' },
  D: { targetType: 'core', targetId: 'controller' },
  E: { targetType: 'core', targetId: 'grief-bearer' },
  F: { targetType: 'strategy', targetId: 'overloaded-one' },
  G: { targetType: 'core', targetId: 'invisible-one' },
};

export function computeQuizResultFromLegacyAnswers(answers: PatternKey[]): PatternQuizResult {
  const increments: QuizScoreIncrement[] = [];

  for (const key of answers) {
    const mapping = QUIZKEY_TO_PATTERN_ID[key];
    if (mapping) {
      increments.push({
        targetType: mapping.targetType,
        targetId: mapping.targetId,
        value: 1,
      });
    }
  }

  const state = computeQuizScores(increments);
  return computeQuizResult(state);
}

export { getNavigationTarget };
