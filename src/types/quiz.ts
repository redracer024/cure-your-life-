export type CorePatternId =
  | 'silenced-one'
  | 'unheld-one'
  | 'invisible-one'
  | 'shame-bearer'
  | 'controller'
  | 'avoidant-one'
  | 'hypervigilant-one'
  | 'entangled-one'
  | 'grief-bearer';

export type StrategyPatternId =
  | 'martyr'
  | 'rescuer'
  | 'over-responsible-one'
  | 'overloaded-one'
  | 'perfectionist'
  | 'anger-shield';

export type ExpressionId = string;

export interface QuizScoreTarget {
  core?: Partial<Record<CorePatternId, number>>;
  strategy?: Partial<Record<StrategyPatternId, number>>;
  expression?: Record<ExpressionId, number>;
}

export interface QuizScoreState {
  core: Record<CorePatternId, number>;
  strategy: Record<StrategyPatternId, number>;
  expression: Record<ExpressionId, number>;
}

export type ConfidenceLevel = 'low' | 'moderate' | 'high';

export interface QuizLayerResult<TId extends string> {
  id: TId;
  rawScore: number;
  normalizedScore: number;
  confidence: ConfidenceLevel;
}

export interface PatternQuizResult {
  core: QuizLayerResult<CorePatternId> | null;
  strategy: QuizLayerResult<StrategyPatternId> | null;
  expression: QuizLayerResult<ExpressionId> | null;
  secondaryCores: QuizLayerResult<CorePatternId>[];
  secondaryStrategies: QuizLayerResult<StrategyPatternId>[];
}

export const EXPRESSION_CONFIDENCE_THRESHOLD = 1;

export const STRATEGY_COMPATIBILITY_BOOST_FACTOR = 0.2;

export const NEAR_TIE_FRACTION = 0.1;

export type QuizAccess = 'free' | 'pro';

export type QuizScale = 'frequency';

export interface ApprovedQuizItem {
  id: string;
  patternId: CorePatternId | StrategyPatternId;
  layer: 'core' | 'strategy' | 'expression';
  access: QuizAccess;
  text: string;
  scale: QuizScale;
  reverseScored: boolean;
  status: 'approved';
  /** Marks a strategy item for inclusion in the universal strategy screen. */
  strategyScreen?: 'universal';
}

export const FREQUENCY_SCALE = [
  { value: 1, label: 'Never' },
  { value: 2, label: 'Rarely' },
  { value: 3, label: 'Sometimes' },
  { value: 4, label: 'Often' },
  { value: 5, label: 'Almost always' },
] as const;
