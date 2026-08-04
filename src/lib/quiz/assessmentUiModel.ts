import type {
  AssessmentMode,
  AssessmentSession,
  AssessmentStage,
} from '../../types/assessmentSession';
import { APPROVED_QUIZ_ITEMS } from '../../data/quiz/approvedQuestions';
import { EXPRESSION_GROUP_SCREENING_ITEMS } from '../../data/quiz/expressionGroupScreeningItems';
import { EXPRESSION_SCREENING_ITEMS } from '../../data/quiz/expressionScreeningItems';
import { EXPRESSION_CONFIRMATION_ITEMS } from '../../data/quiz/expressionConfirmationItems';

export type AssessmentRenderableItem =
  | { bank: 'approved'; id: string; text: string }
  | { bank: 'expression-group'; id: string; prompt: string }
  | { bank: 'expression-screening'; id: string; prompt: string }
  | { bank: 'expression-confirmation'; id: string; prompt: string };

const APPROVED_PREFIXES = ['core-', 'strategy-'];

export function resolveAssessmentItem(itemId: string): AssessmentRenderableItem | null {
  if (!itemId) return null;

  let found: AssessmentRenderableItem | null = null;

  if (APPROVED_PREFIXES.some(prefix => itemId.startsWith(prefix))) {
    const item = APPROVED_QUIZ_ITEMS.find(entry => entry.id === itemId);
    if (item) {
      found = { bank: 'approved', id: item.id, text: item.text };
    }
  } else if (itemId.startsWith('expression-group-screen-')) {
    const item = EXPRESSION_GROUP_SCREENING_ITEMS.find(entry => entry.id === itemId);
    if (item) {
      found = { bank: 'expression-group', id: item.id, prompt: item.prompt };
    }
  } else if (itemId.startsWith('expression-screen-')) {
    const item = EXPRESSION_SCREENING_ITEMS.find(entry => entry.id === itemId);
    if (item) {
      found = { bank: 'expression-screening', id: item.id, prompt: item.prompt };
    }
  } else if (itemId.startsWith('expression-confirm-')) {
    const item = EXPRESSION_CONFIRMATION_ITEMS.find(entry => entry.id === itemId);
    if (item) {
      found = { bank: 'expression-confirmation', id: item.id, prompt: item.prompt };
    }
  }

  if (found) return found;

  const approved = APPROVED_QUIZ_ITEMS.find(entry => entry.id === itemId);
  if (approved) return { bank: 'approved', id: approved.id, text: approved.text };

  const group = EXPRESSION_GROUP_SCREENING_ITEMS.find(entry => entry.id === itemId);
  if (group) return { bank: 'expression-group', id: group.id, prompt: group.prompt };

  const screening = EXPRESSION_SCREENING_ITEMS.find(entry => entry.id === itemId);
  if (screening) return { bank: 'expression-screening', id: screening.id, prompt: screening.prompt };

  const confirmation = EXPRESSION_CONFIRMATION_ITEMS.find(entry => entry.id === itemId);
  if (confirmation) {
    return { bank: 'expression-confirmation', id: confirmation.id, prompt: confirmation.prompt };
  }

  return null;
}

const STAGE_LABELS: Record<AssessmentStage, string> = {
  'not-started': 'Preparing',
  core: 'Core Patterns',
  'strategy-universal': 'Strategy Screen',
  'strategy-follow-up-first': 'Strategy Focus',
  'strategy-follow-up-second': 'Strategy Focus',
  'expression-group-screening': 'Expression Groups',
  'expression-screening': 'Expression Screening',
  'expression-confirmation': 'Expression Confirmation',
  results: 'Results',
};

export function getAssessmentStageLabel(stage: AssessmentStage): string {
  return STAGE_LABELS[stage] ?? 'Assessment';
}

export interface AssessmentStageProgress {
  remaining: number;
  hasItems: boolean;
}

export function getAssessmentStageProgress(
  session: AssessmentSession,
): AssessmentStageProgress {
  const remaining = session.currentItemIds.length;
  return {
    remaining,
    hasItems: remaining > 0,
  };
}

export function isAssessmentRetryItem(session: AssessmentSession, itemId: string): boolean {
  return session.retryState.skippedItemIds.includes(itemId);
}

export type AssessmentLaunchDecision =
  | { type: 'start'; mode: AssessmentMode }
  | { type: 'resume'; session: AssessmentSession }
  | { type: 'blocked-pro-session'; session: AssessmentSession };

export function decideAssessmentLaunch(
  savedSession: AssessmentSession | null,
  isPremium: boolean,
): AssessmentLaunchDecision {
  if (savedSession === null) {
    return { type: 'start', mode: isPremium ? 'pro' : 'free' };
  }
  if (savedSession.mode === 'free') {
    return { type: 'resume', session: savedSession };
  }
  if (isPremium) {
    return { type: 'resume', session: savedSession };
  }
  return { type: 'blocked-pro-session', session: savedSession };
}

export const ASSESSMENT_PRIVACY_DISCLOSURE =
  'Your progress and answers are stored only in this browser on this device. ' +
  'They are not sent to our servers. Another person using this same browser profile may be ' +
  'able to resume your saved assessment. Clearing your browser data, or using the clear or ' +
  'start-over control, removes the saved assessment. Closing the assessment does not ' +
  'automatically remove it, so completed results may still be here when you reopen it. ' +
  'A saved Pro assessment may be blocked if Pro access is no longer available.';

export const ASSESSMENT_RESUME_REMINDER =
  'Saved progress belongs to this browser on this device. Another person using this browser ' +
  'profile may be able to resume it.';

export const ASSESSMENT_RESULTS_REMINDER =
  'Your results stay stored in this browser until you clear them.';

export const ASSESSMENT_BLOCKED_REMINDER =
  'Your saved Pro assessment remains stored in this browser until cleared or resumed after ' +
  'Pro access returns.';

export const ASSESSMENT_CLEAR_LABEL = 'Clear saved assessment';

export const ASSESSMENT_CLEAR_CONFIRM_TITLE = 'Clear saved assessment?';

export const ASSESSMENT_CLEAR_CONFIRM_BODY =
  'Your saved answers and results will be removed from this browser.';

export const ASSESSMENT_CLEAR_CONFIRM_ACTION = 'Clear assessment';

export const ASSESSMENT_CLEAR_CANCEL_ACTION = 'Cancel';

export const ASSESSMENT_CLEAR_FAILURE_NOTICE =
  'Saved assessment could not be cleared. You can continue using the current session.';
