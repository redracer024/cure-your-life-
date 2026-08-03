import { APPROVED_QUIZ_ITEMS } from './approvedQuestions';
import { CORE_PATTERN_IDS, STRATEGY_PATTERN_IDS, EXPRESSION_REGISTRY } from './patternTaxonomy';
import { STRATEGY_ROUTING_CONFIG } from './strategyRoutingConfig';
import { EXPRESSION_SCREENING_GROUPS } from './expressionScreeningGroups';
import { validateExpressionScreeningGroups } from '../../lib/quiz/expressionGroupingValidation';
import { getExpressionGroupScreeningReadiness } from '../../lib/quiz/expressionGroupScreening';
import { getExpressionScreeningReadiness } from '../../lib/quiz/expressionScreening';
import { getExpressionConfirmationReadiness } from '../../lib/quiz/expressionConfirmation';
import type { CorePatternId, StrategyPatternId, QuizAccess, ApprovedQuizItem } from '../../types/quiz';

const UNIVERSAL_SCREENER_TARGET = 2;
const STRATEGY_FREE_TARGET = 5;
const STRATEGY_PRO_TARGET = 8;

export function getApprovedItemsForMode(mode: QuizAccess): ApprovedQuizItem[] {
  if (mode === 'free') {
    return APPROVED_QUIZ_ITEMS.filter(item => item.access === 'free');
  }
  return APPROVED_QUIZ_ITEMS.filter(item => item.access === 'free' || item.access === 'pro');
}

export function getApprovedItemsForPattern(
  patternId: string,
  mode: QuizAccess,
): ApprovedQuizItem[] {
  return getApprovedItemsForMode(mode).filter(item => item.patternId === patternId);
}

export function getUniversalStrategyScreenItems(mode: QuizAccess): ApprovedQuizItem[] {
  return getApprovedItemsForMode(mode).filter(item => item.strategyScreen === 'universal');
}

export function getApprovedStrategyItemsForPattern(
  strategyId: string,
  mode: QuizAccess,
): ApprovedQuizItem[] {
  return getApprovedItemsForMode(mode).filter(
    item => item.patternId === strategyId && item.layer === 'strategy',
  );
}

export interface StrategyCoverage {
  universalScreenerCount: number;
  freeCount: number;
  proOnlyCount: number;
  totalProCount: number;
  universalComplete: boolean;
  freeComplete: boolean;
  proComplete: boolean;
}

export function getQuestionBankCoverage(): Record<string, StrategyCoverage> {
  const coverage: Record<string, StrategyCoverage> = {};

  for (const id of CORE_PATTERN_IDS) {
    const items = APPROVED_QUIZ_ITEMS.filter(item => item.patternId === id);
    const freeCount = items.filter(item => item.access === 'free').length;
    const proOnlyCount = items.filter(item => item.access === 'pro').length;
    const totalProCount = items.length;
    const universalScreenerCount = items.filter(item => item.strategyScreen === 'universal').length;
    coverage[id] = {
      universalScreenerCount,
      freeCount,
      proOnlyCount,
      totalProCount,
      universalComplete: universalScreenerCount >= UNIVERSAL_SCREENER_TARGET,
      freeComplete: freeCount >= 5,
      proComplete: totalProCount >= 8,
    };
  }

  for (const id of STRATEGY_PATTERN_IDS) {
    const items = APPROVED_QUIZ_ITEMS.filter(item => item.patternId === id);
    const freeCount = items.filter(item => item.access === 'free').length;
    const proOnlyCount = items.filter(item => item.access === 'pro').length;
    const totalProCount = items.length;
    const universalScreenerCount = items.filter(item => item.strategyScreen === 'universal').length;
    coverage[id] = {
      universalScreenerCount,
      freeCount,
      proOnlyCount,
      totalProCount,
      universalComplete: universalScreenerCount >= UNIVERSAL_SCREENER_TARGET,
      freeComplete: freeCount >= STRATEGY_FREE_TARGET,
      proComplete: totalProCount >= STRATEGY_PRO_TARGET,
    };
  }

  return coverage;
}

export interface AssessmentReadiness {
  ready: boolean;
  coreBankComplete: boolean;
  strategyBankComplete: boolean;
  universalStrategyScreenComplete: boolean;
  adaptiveConfigComplete: boolean;
  expressionGroupingComplete: boolean;
  expressionGroupScreeningComplete: boolean;
  expressionScreeningComplete: boolean;
  expressionConfirmationComplete: boolean;
  missingRequirements: string[];
}

export function getAssessmentReadiness(mode: QuizAccess): AssessmentReadiness {
  const coverage = getQuestionBankCoverage();
  const missing: string[] = [];
  let coreBankComplete = true;

  for (const id of CORE_PATTERN_IDS) {
    const c = coverage[id];
    const target = mode === 'free' ? c.freeComplete : c.proComplete;
    if (!target) {
      coreBankComplete = false;
      missing.push(`core:${id} ${mode === 'free' ? 'free' : 'pro'} incomplete (${mode === 'free' ? c.freeCount : c.totalProCount}/${mode === 'free' ? 5 : 8})`);
    }
  }

  let strategyBankComplete: boolean;
  if (mode === 'pro') {
    strategyBankComplete = true;
    for (const id of STRATEGY_PATTERN_IDS) {
      const c = coverage[id];
      if (!c.proComplete) {
        strategyBankComplete = false;
        missing.push(`strategy:${id} pro incomplete (${c.totalProCount}/${STRATEGY_PRO_TARGET})`);
      }
    }
  } else {
    strategyBankComplete = false;
    missing.push('strategy pro bank not required for free mode');
  }

  let universalStrategyScreenComplete = true;
  for (const id of STRATEGY_PATTERN_IDS) {
    const c = coverage[id];
    if (!c.universalComplete) {
      universalStrategyScreenComplete = false;
      missing.push(`strategy:${id} universal screeners incomplete (${c.universalScreenerCount}/${UNIVERSAL_SCREENER_TARGET})`);
    }
  }
  if (universalStrategyScreenComplete) {
    missing.push('universal strategy screen complete');
  }

  const adaptiveConfigComplete = typeof STRATEGY_ROUTING_CONFIG !== 'undefined';
  if (!adaptiveConfigComplete) {
    missing.push('adaptive configuration not yet defined');
  }

  const groupingValidation = validateExpressionScreeningGroups(
    EXPRESSION_SCREENING_GROUPS,
    EXPRESSION_REGISTRY,
    CORE_PATTERN_IDS,
    STRATEGY_PATTERN_IDS,
  );
  const expressionGroupingComplete = groupingValidation.valid;
  if (!expressionGroupingComplete) {
    missing.push(`expression grouping incomplete: ${groupingValidation.omittedExpressionIds.length} expressions unassigned, ${groupingValidation.parentsWithoutGroups.length} parents without groups`);
  }

  const groupScreeningReadiness = getExpressionGroupScreeningReadiness();
  const expressionGroupScreeningComplete = groupScreeningReadiness.ready;
  if (!expressionGroupScreeningComplete) {
    missing.push(`expression group screening incomplete: ${groupScreeningReadiness.totalItemCount} items`);
  }

  const individualScreeningReadiness = getExpressionScreeningReadiness();
  const expressionScreeningComplete = individualScreeningReadiness.ready;
  if (!expressionScreeningComplete) {
    missing.push(`expression screening incomplete: ${individualScreeningReadiness.totalItemCount} items / ${individualScreeningReadiness.missingRequirements.join(', ')}`);
  }

  const confirmationReadiness = getExpressionConfirmationReadiness();
  const expressionConfirmationComplete = confirmationReadiness.ready;
  if (!expressionConfirmationComplete) {
    missing.push(`expression confirmation incomplete: ${confirmationReadiness.totalItemCount} items / ${confirmationReadiness.missingRequirements.join(', ')}`);
  }
  const ready = coreBankComplete && strategyBankComplete && universalStrategyScreenComplete && adaptiveConfigComplete && expressionScreeningComplete && expressionConfirmationComplete;
  return {
    ready,
    coreBankComplete,
    strategyBankComplete,
    universalStrategyScreenComplete,
    adaptiveConfigComplete,
    expressionGroupingComplete,
    expressionGroupScreeningComplete,
    expressionScreeningComplete,
    expressionConfirmationComplete,
    missingRequirements: missing,
  };
}

export function isAssessmentModeReady(mode: QuizAccess): boolean {
  return getAssessmentReadiness(mode).ready;
}

export function scoreApprovedItemResponse(
  item: ApprovedQuizItem,
  selectedValue: number,
): number {
  const clamped = Math.max(1, Math.min(5, Math.round(selectedValue)));
  if (item.reverseScored) {
    return 6 - clamped;
  }
  return clamped;
}
