import type { ExpressionScreeningGroup, ExpressionGroupingValidationResult } from '../../types/expressionGrouping';
import type { ExpressionRegistryEntry } from '../../data/quiz/patternTaxonomy';
import type { CorePatternId, StrategyPatternId } from '../../types/quiz';

const MIN_GROUP_SIZE = 2;
const MAX_GROUP_SIZE = 5;

export function validateExpressionScreeningGroups(
  groups: readonly ExpressionScreeningGroup[],
  expressionRegistry: readonly ExpressionRegistryEntry[],
  corePatternIds: readonly CorePatternId[],
  strategyPatternIds: readonly StrategyPatternId[],
): ExpressionGroupingValidationResult {
  const allRegisteredIds = new Set<string>();
  const expressionParentMap = new Map<string, string>();
  for (const expr of expressionRegistry) {
    allRegisteredIds.add(expr.id);
    expressionParentMap.set(expr.id, expr.parentPatternId);
  }

  const allParentIds = new Set<string>([...corePatternIds, ...strategyPatternIds]);
  const coreParentSet = new Set<string>(corePatternIds);
  const strategyParentSet = new Set<string>(strategyPatternIds);

  const seenGroupIds = new Set<string>();
  const duplicateGroupIds: string[] = [];
  const duplicateGroupOrders: string[] = [];
  const duplicateExpressionOrders: string[] = [];
  const invalidExpressionIds: string[] = [];
  const invalidParentIds: string[] = [];
  const parentMismatchExpressionIds: string[] = [];
  const groupsBelowMinimumSize: string[] = [];
  const groupsAboveMaximumSize: string[] = [];
  const assignedExpressionIds = new Set<string>();
  const duplicateExpressionIds: string[] = [];
  const groupOrderTracker = new Map<string, Set<number>>();
  const missingFromExpressionOrder: string[] = [];
  const extraExpressionOrderKeys: string[] = [];
  const omittedExpressionIds: string[] = [];
  let coreGroupCount = 0;
  let strategyGroupCount = 0;

  for (const group of groups) {
    if (seenGroupIds.has(group.id)) {
      duplicateGroupIds.push(group.id);
    }
    seenGroupIds.add(group.id);

    if (!groupOrderTracker.has(group.parentId)) {
      groupOrderTracker.set(group.parentId, new Set());
    }
    const ordersForParent = groupOrderTracker.get(group.parentId)!;
    if (ordersForParent.has(group.groupOrder)) {
      duplicateGroupOrders.push(`${group.parentId}:${group.groupOrder}`);
    }
    ordersForParent.add(group.groupOrder);

    if (group.parentType === 'core') {
      coreGroupCount++;
    } else if (group.parentType === 'strategy') {
      strategyGroupCount++;
    }

    if (!allParentIds.has(group.parentId)) {
      invalidParentIds.push(group.parentId);
    }

    const exprOrderSeen = new Set<number>();
    for (const [exprId, order] of Object.entries(group.expressionOrder)) {
      if (exprOrderSeen.has(order)) {
        duplicateExpressionOrders.push(`${group.id}:${exprId}:${order}`);
      }
      exprOrderSeen.add(order);
    }

    const exprInArray = new Set(group.expressionIds);
    for (const exprId of group.expressionIds) {
      if (!allRegisteredIds.has(exprId)) {
        invalidExpressionIds.push(exprId);
      }
      if (expressionParentMap.get(exprId) !== group.parentId) {
        parentMismatchExpressionIds.push(exprId);
      }
      if (assignedExpressionIds.has(exprId)) {
        duplicateExpressionIds.push(exprId);
      }
      assignedExpressionIds.add(exprId);
    }

    for (const exprId of Object.keys(group.expressionOrder)) {
      if (!exprInArray.has(exprId)) {
        extraExpressionOrderKeys.push(`${group.id}:${exprId}`);
      }
    }

    for (const exprId of group.expressionIds) {
      if (!(exprId in group.expressionOrder)) {
        missingFromExpressionOrder.push(`${group.id}:${exprId}`);
      }
    }

    if (group.expressionIds.length < MIN_GROUP_SIZE) {
      groupsBelowMinimumSize.push(group.id);
    }
    if (group.expressionIds.length > MAX_GROUP_SIZE) {
      groupsAboveMaximumSize.push(group.id);
    }
  }

  for (const expr of expressionRegistry) {
    if (!assignedExpressionIds.has(expr.id)) {
      omittedExpressionIds.push(expr.id);
    }
  }

  const parentsWithGroups = new Set(groups.map(g => g.parentId));
  const parentsWithoutGroups: string[] = [];
  for (const pid of allParentIds) {
    if (!parentsWithGroups.has(pid)) {
      parentsWithoutGroups.push(pid);
    }
  }

  const valid =
    groups.length > 0 &&
    duplicateGroupIds.length === 0 &&
    invalidExpressionIds.length === 0 &&
    invalidParentIds.length === 0 &&
    parentMismatchExpressionIds.length === 0 &&
    duplicateGroupOrders.length === 0 &&
    duplicateExpressionOrders.length === 0 &&
    groupsBelowMinimumSize.length === 0 &&
    groupsAboveMaximumSize.length === 0 &&
    missingFromExpressionOrder.length === 0 &&
    extraExpressionOrderKeys.length === 0 &&
    omittedExpressionIds.length === 0 &&
    parentsWithoutGroups.length === 0;

  return {
    valid,
    groupCount: groups.length,
    coreGroupCount,
    strategyGroupCount,
    assignmentCount: assignedExpressionIds.size,
    uniqueExpressionCount: assignedExpressionIds.size,
    duplicateExpressionIds,
    omittedExpressionIds,
    invalidExpressionIds,
    invalidParentIds,
    parentMismatchExpressionIds,
    duplicateGroupIds,
    duplicateGroupOrders,
    duplicateExpressionOrders,
    groupsBelowMinimumSize,
    groupsAboveMaximumSize,
    parentsWithoutGroups,
  };
}
