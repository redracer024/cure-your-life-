import { PATTERNS_DATA } from '../patterns';
import type { CorePatternId, StrategyPatternId, ExpressionId } from '../../types/quiz';

export interface ExpressionRegistryEntry {
  id: ExpressionId;
  name: string;
  parentPatternId: string;
}

function buildRegistries() {
  const expressionRegistry: ExpressionRegistryEntry[] = [];
  const expressionToParent: Record<ExpressionId, string> = {};

  for (const pattern of PATTERNS_DATA) {
    for (const sp of pattern.subPatterns) {
      if (sp.id) {
        const entry: ExpressionRegistryEntry = {
          id: sp.id,
          name: sp.name,
          parentPatternId: pattern.id,
        };
        expressionRegistry.push(entry);
        expressionToParent[sp.id] = pattern.id;
      }
    }
  }

  const coreIds = PATTERNS_DATA
    .filter(p => p.category === 'core')
    .map(p => p.id) as CorePatternId[];

  const strategyIds = PATTERNS_DATA
    .filter(p => p.category === 'sub')
    .map(p => p.id) as StrategyPatternId[];

  return { expressionRegistry, expressionToParent, coreIds, strategyIds };
}

const registries = buildRegistries();

export const EXPRESSION_REGISTRY: ExpressionRegistryEntry[] = registries.expressionRegistry;

export const EXPRESSION_TO_PARENT: Record<ExpressionId, string> = registries.expressionToParent;

export const CORE_PATTERN_IDS: CorePatternId[] = registries.coreIds;

export const STRATEGY_PATTERN_IDS: StrategyPatternId[] = registries.strategyIds;

export function getExpressionParent(expressionId: string): string | undefined {
  return EXPRESSION_TO_PARENT[expressionId];
}

export function isCorePattern(patternId: string): boolean {
  return (CORE_PATTERN_IDS as readonly string[]).includes(patternId);
}

export function isStrategyPattern(patternId: string): boolean {
  return (STRATEGY_PATTERN_IDS as readonly string[]).includes(patternId);
}

export function getPatternCategory(patternId: string): 'core' | 'sub' | undefined {
  const entry = PATTERNS_DATA.find(p => p.id === patternId);
  return entry?.category;
}

export function getPatternDisplayName(patternId: string): string | undefined {
  const entry = PATTERNS_DATA.find(p => p.id === patternId);
  return entry?.name;
}

export const STRATEGY_CORE_COMPATIBILITY: Record<StrategyPatternId, CorePatternId[]> = {
  martyr: ['controller', 'entangled-one', 'silenced-one', 'unheld-one', 'hypervigilant-one', 'shame-bearer'],
  'overloaded-one': ['controller', 'hypervigilant-one', 'unheld-one', 'avoidant-one', 'entangled-one', 'silenced-one'],
  perfectionist: ['controller', 'invisible-one', 'silenced-one', 'unheld-one'],
  'over-responsible-one': ['shame-bearer', 'entangled-one', 'silenced-one', 'controller', 'hypervigilant-one', 'unheld-one', 'avoidant-one'],
  'anger-shield': ['controller', 'silenced-one', 'entangled-one', 'unheld-one', 'invisible-one'],
  rescuer: ['controller', 'entangled-one', 'unheld-one', 'shame-bearer', 'hypervigilant-one', 'avoidant-one', 'silenced-one', 'invisible-one'],
};
