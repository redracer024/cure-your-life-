import type { CorePatternId, StrategyPatternId } from './quiz';

export type ExpressionGroupParentType = 'core' | 'strategy';

export interface ExpressionScreeningGroup {
  id: string;
  parentId: string;
  parentType: ExpressionGroupParentType;
  groupOrder: number;
  expressionIds: readonly string[];
  expressionOrder: Readonly<Record<string, number>>;
}

export interface ExpressionGroupingValidationResult {
  valid: boolean;
  groupCount: number;
  coreGroupCount: number;
  strategyGroupCount: number;
  assignmentCount: number;
  uniqueExpressionCount: number;
  duplicateExpressionIds: readonly string[];
  omittedExpressionIds: readonly string[];
  invalidExpressionIds: readonly string[];
  invalidParentIds: readonly string[];
  parentMismatchExpressionIds: readonly string[];
  duplicateGroupIds: readonly string[];
  duplicateGroupOrders: readonly string[];
  duplicateExpressionOrders: readonly string[];
  groupsBelowMinimumSize: readonly string[];
  groupsAboveMaximumSize: readonly string[];
  parentsWithoutGroups: readonly string[];
}
