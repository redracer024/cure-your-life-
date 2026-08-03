import type { PatternQuizResult } from './quiz';
import type { StrategyRoutingResult } from './strategyRouting';
import type { ExpressionGroupRoutingResult } from './expressionGroupScreening';
import type { ExpressionScreeningResult } from './expressionScreening';
import type { ExpressionConfirmationResult } from './expressionConfirmation';

export type AssessmentMode = 'free' | 'pro';

export type AssessmentStage =
  | 'not-started'
  | 'core'
  | 'strategy-universal'
  | 'strategy-follow-up-first'
  | 'strategy-follow-up-second'
  | 'expression-group-screening'
  | 'expression-screening'
  | 'expression-confirmation'
  | 'results';

export type AssessmentResponseValue = 1 | 2 | 3 | 4 | 5;

export type AssessmentCompletionState = 'not-started' | 'in-progress' | 'partial' | 'complete';

export interface AssessmentRetryState {
  skippedItemIds: string[];
  retriedItemIds: string[];
  unresolvedItemIds: string[];
}

export interface AssessmentSession {
  sessionVersion: string;
  mode: AssessmentMode;
  stage: AssessmentStage;
  responses: Record<string, AssessmentResponseValue>;
  retryResponses: Record<string, AssessmentResponseValue>;
  retryState: AssessmentRetryState;
  currentItemIds: string[];
  completedItemIds: string[];
  coreResult: PatternQuizResult | null;
  strategyResult: StrategyRoutingResult | null;
  expressionGroupResult: ExpressionGroupRoutingResult | null;
  expressionScreeningResult: ExpressionScreeningResult | null;
  expressionConfirmationResult: ExpressionConfirmationResult | null;
  navigationTarget: { patternId: string };
  completionState: AssessmentCompletionState;
  createdAt: string;
  updatedAt: string;
}
