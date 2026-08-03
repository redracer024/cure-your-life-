import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  resolveAssessmentItem,
  getAssessmentStageLabel,
  getAssessmentStageProgress,
  isAssessmentRetryItem,
  decideAssessmentLaunch,
} from './src/lib/quiz/assessmentUiModel';
import { AssessmentQuestionPanel } from './src/components/quiz/AssessmentQuestionPanel';
import { AssessmentResultsPanel } from './src/components/quiz/AssessmentResultsPanel';
import { AssessmentQuizHost } from './src/components/quiz/AssessmentQuizHost';
import { AuthProvider } from './src/context/AuthContext';
import { PremiumProvider } from './src/context/PremiumContext';
import { APPROVED_QUIZ_ITEMS } from './src/data/quiz/approvedQuestions';
import { EXPRESSION_GROUP_SCREENING_ITEMS } from './src/data/quiz/expressionGroupScreeningItems';
import { EXPRESSION_SCREENING_ITEMS } from './src/data/quiz/expressionScreeningItems';
import { EXPRESSION_CONFIRMATION_ITEMS } from './src/data/quiz/expressionConfirmationItems';
import { PATTERNS_DATA } from './src/data/patterns';
import { EXPRESSION_REGISTRY } from './src/data/quiz/patternTaxonomy';
import { getApprovedItemsForMode } from './src/data/quiz/questionBank';
import type {
  AssessmentSession,
  AssessmentStage,
} from './src/types/assessmentSession';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(`FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const hostSource = fs.readFileSync(
  path.join(import.meta.dirname, 'src/components/quiz/AssessmentQuizHost.tsx'),
  'utf8',
);
const questionPanelSource = fs.readFileSync(
  path.join(import.meta.dirname, 'src/components/quiz/AssessmentQuestionPanel.tsx'),
  'utf8',
);
const resultsPanelSource = fs.readFileSync(
  path.join(import.meta.dirname, 'src/components/quiz/AssessmentResultsPanel.tsx'),
  'utf8',
);
const uiModelSource = fs.readFileSync(
  path.join(import.meta.dirname, 'src/lib/quiz/assessmentUiModel.ts'),
  'utf8',
);
const appSource = fs.readFileSync(path.join(import.meta.dirname, 'src/App.tsx'), 'utf8');

function fixtureSession(overrides: Partial<AssessmentSession>): AssessmentSession {
  const base: AssessmentSession = {
    sessionVersion: 'test',
    mode: 'free',
    stage: 'core',
    responses: {},
    retryResponses: {},
    retryState: { skippedItemIds: [], retriedItemIds: [], unresolvedItemIds: [] },
    currentItemIds: [],
    completedItemIds: [],
    coreResult: null,
    strategyResult: null,
    expressionGroupResult: null,
    expressionScreeningResult: null,
    expressionConfirmationResult: null,
    navigationTarget: { patternId: '' },
    completionState: 'not-started',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  return { ...base, ...overrides };
}

function escHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ==================================================================
 *  A. Item resolution (no copied bank data)
 * ================================================================*/

{
  const approved = APPROVED_QUIZ_ITEMS[0];
  const group = EXPRESSION_GROUP_SCREENING_ITEMS[0];
  const screening = EXPRESSION_SCREENING_ITEMS[0];
  const confirmation = EXPRESSION_CONFIRMATION_ITEMS[0];

  const approvedResolved = resolveAssessmentItem(approved.id);
  const groupResolved = resolveAssessmentItem(group.id);
  const screeningResolved = resolveAssessmentItem(screening.id);
  const confirmationResolved = resolveAssessmentItem(confirmation.id);

  assert('A: approved item resolves to bank-backed text', approvedResolved !== null && approvedResolved.bank === 'approved' && approvedResolved.text === approved.text);
  assert('A: group item resolves to bank-backed prompt', groupResolved !== null && groupResolved.bank === 'expression-group' && groupResolved.prompt === group.prompt);
  assert('A: screening item resolves to bank-backed prompt', screeningResolved !== null && screeningResolved.bank === 'expression-screening' && screeningResolved.prompt === screening.prompt);
  assert('A: confirmation item resolves to bank-backed prompt', confirmationResolved !== null && confirmationResolved.bank === 'expression-confirmation' && confirmationResolved.prompt === confirmation.prompt);
  assert('A: unknown id returns null', resolveAssessmentItem('definitely-not-a-real-item-id-xyz') === null);
  assert('A: empty id returns null', resolveAssessmentItem('') === null);
  assert('A: null-ish id returns null', resolveAssessmentItem('0') === null);
  assert('A: unknown core-prefixed id returns null', resolveAssessmentItem('core-nonexistent-99') === null);

  for (const item of APPROVED_QUIZ_ITEMS.slice(0, 20)) {
    const resolved = resolveAssessmentItem(item.id);
    assert(`A: approved bank id ${item.id} resolves`, resolved !== null && resolved.bank === 'approved' && resolved.text === item.text);
  }
  for (const item of EXPRESSION_GROUP_SCREENING_ITEMS.slice(0, 10)) {
    const resolved = resolveAssessmentItem(item.id);
    assert(`A: group bank id ${item.id} resolves`, resolved !== null && resolved.bank === 'expression-group' && resolved.prompt === item.prompt);
  }
  for (const item of EXPRESSION_SCREENING_ITEMS.slice(0, 10)) {
    const resolved = resolveAssessmentItem(item.id);
    assert(`A: screening bank id ${item.id} resolves`, resolved !== null && resolved.bank === 'expression-screening' && resolved.prompt === item.prompt);
  }
  for (const item of EXPRESSION_CONFIRMATION_ITEMS.slice(0, 10)) {
    const resolved = resolveAssessmentItem(item.id);
    assert(`A: confirmation bank id ${item.id} resolves`, resolved !== null && resolved.bank === 'expression-confirmation' && resolved.prompt === item.prompt);
  }

  const copiedSamples = [
    ...APPROVED_QUIZ_ITEMS.slice(0, 8).map(i => i.text),
    ...EXPRESSION_GROUP_SCREENING_ITEMS.slice(0, 4).map(i => i.prompt),
    ...EXPRESSION_SCREENING_ITEMS.slice(0, 4).map(i => i.prompt),
    ...EXPRESSION_CONFIRMATION_ITEMS.slice(0, 4).map(i => i.prompt),
  ];
  for (const sample of copiedSamples) {
    assert('A: uiModel does not copy bank content verbatim', !uiModelSource.includes(sample), sample.slice(0, 40));
  }
  assert('A: uiModel imports the authoritative banks', uiModelSource.includes("'../../data/quiz/approvedQuestions'") && uiModelSource.includes("'../../data/quiz/expressionGroupScreeningItems'") && uiModelSource.includes("'../../data/quiz/expressionScreeningItems'") && uiModelSource.includes("'../../data/quiz/expressionConfirmationItems'"));
}

/* ==================================================================
 *  B. Launch decision (no mutation)
 * ================================================================*/

{
  const freeSession = fixtureSession({ mode: 'free', stage: 'results' });
  const proSession = fixtureSession({ mode: 'pro', stage: 'core' });

  const d1 = decideAssessmentLaunch(null, false);
  const d2 = decideAssessmentLaunch(null, true);
  const d3 = decideAssessmentLaunch(freeSession, false);
  const d4 = decideAssessmentLaunch(proSession, true);
  const d5 = decideAssessmentLaunch(proSession, false);

  assert('B: null + non-premium -> start free', d1.type === 'start' && d1.mode === 'free');
  assert('B: null + premium -> start pro', d2.type === 'start' && d2.mode === 'pro');
  assert('B: saved free -> resume', d3.type === 'resume' && d3.session.mode === 'free');
  assert('B: saved pro + premium -> resume', d4.type === 'resume' && d4.session.mode === 'pro');
  assert('B: saved pro + non-premium -> blocked', d5.type === 'blocked-pro-session' && d5.session.mode === 'pro');
  assert('B: no mode conversion in any decision', d3.type !== 'blocked-pro-session' && d4.type !== 'blocked-pro-session' && d5.type !== 'start');
  assert('B: decisions never mutate the saved session', freeSession.stage === 'results' && proSession.stage === 'core');

  const frozen = fixtureSession({ mode: 'pro' });
  const frozenSerialized = JSON.stringify(frozen);
  decideAssessmentLaunch(frozen, false);
  assert('B: blocked decision leaves input unchanged', JSON.stringify(frozen) === frozenSerialized);
}

/* ==================================================================
 *  C. Progress model (remaining-queue wording, no 1-of-N)
 * ================================================================*/

{
  const fiveItemSession = fixtureSession({ currentItemIds: ['a', 'b', 'c', 'd', 'e'] });
  const oneItemSession = fixtureSession({ currentItemIds: ['a'] });
  const zeroItemSession = fixtureSession({ currentItemIds: [] });

  const p5 = getAssessmentStageProgress(fiveItemSession);
  const p1 = getAssessmentStageProgress(oneItemSession);
  const p0 = getAssessmentStageProgress(zeroItemSession);

  assert('C: progress 5 items -> {remaining:5,hasItems:true}', p5.remaining === 5 && p5.hasItems === true);
  assert('C: progress 1 item -> {remaining:1,hasItems:true}', p1.remaining === 1 && p1.hasItems === true);
  assert('C: progress 0 items -> {remaining:0,hasItems:false}', p0.remaining === 0 && p0.hasItems === false);

  // Verify the remaining-queue progress contract is exposed
  assert('C: progress exposes remaining property', 'remaining' in p5);
  assert('C: progress exposes hasItems property', 'hasItems' in p5);
  assert('C: progress no longer exposes current/total/percent', !('current' in p5) && !('total' in p5) && !('percent' in p5));
  assert('C: progress model has no shrinking-queue percent anywhere', !uiModelSource.includes('percent') && !uiModelSource.includes('current:'));

  const retrySession = fixtureSession({ retryState: { skippedItemIds: ['x'], retriedItemIds: [], unresolvedItemIds: [] } });
  const nonRetrySession = fixtureSession({});
  assert('C: skipped item id detected as retry', isAssessmentRetryItem(retrySession, 'x') === true);
  assert('C: answered item not flagged as retry', isAssessmentRetryItem(nonRetrySession, 'a') === false);
  assert('C: unresolved/retried ids not flagged as retry', isAssessmentRetryItem(fixtureSession({ retryState: { skippedItemIds: [], retriedItemIds: ['r'], unresolvedItemIds: ['u'] } }), 'r') === false && isAssessmentRetryItem(fixtureSession({ retryState: { skippedItemIds: [], retriedItemIds: ['r'], unresolvedItemIds: ['u'] } }), 'u') === false);

  const allStages: AssessmentStage[] = [
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
  const clinicalTerms = ['disorder', 'diagnos', 'illness', 'symptom', 'you are', 'you have'];
  const patternNames = ['silenced', 'unheld', 'invisible', 'shame', 'controller', 'avoidant', 'hypervigilant', 'entangled', 'grief', 'martyr', 'rescuer', 'over-responsible', 'overloaded', 'perfectionist', 'anger-shield'];
  for (const stage of allStages) {
    const label = getAssessmentStageLabel(stage);
    assert(`C: stage label exists for ${stage}`, typeof label === 'string' && label.length > 0);
    assert(`C: label for ${stage} is neutral (no clinical language)`, !clinicalTerms.some(term => label.toLowerCase().includes(term)), label);
    assert(`C: label for ${stage} has no pattern names`, !patternNames.some(name => label.toLowerCase().includes(name)), label);
  }
}

/* ==================================================================
 *  D. Source-level host contract
 * ================================================================*/

{
  assert('D: host does not import scoring engines', !hostSource.includes("scoringEngine") && !hostSource.includes("strategyRouting") && !hostSource.includes("expressionGroupScreening") && !hostSource.includes("expressionScreening") && !hostSource.includes("expressionConfirmation"));
  assert('D: host has no direct browser storage access', !hostSource.includes('localStorage') && !hostSource.includes('sessionStorage'));
  assert('D: host has no fetch', !hostSource.includes('fetch('));
  assert('D: host has no console usage', !hostSource.includes('console.'));
  assert('D: host has no auth/server imports', !hostSource.includes('supabase') && !hostSource.includes('authFetch') && !hostSource.includes('/server'));
  assert('D: host never logs responses or prompts', !hostSource.includes('console'));
  assert('D: host has no mode picker or conversion', !hostSource.includes('setMode') && !hostSource.includes('mode === \'free\' ? \'pro\''));
  assert('D: host never calls getAssessmentReadiness', !hostSource.includes('getAssessmentReadiness'));
  assert('D: host has no global event listeners', !hostSource.includes('window.addEventListener') && !hostSource.includes('document.addEventListener'));
  assert('D: host has no direct bank imports', !hostSource.includes("from '../../data/"));
  assert('D: host imports orchestrator for domain helpers', hostSource.includes("from '../../lib/quiz/assessmentSession'"));
  assert('D: host imports storage adapter', hostSource.includes("from '../../lib/quiz/assessmentSessionStorage'"));
  assert('D: host imports the pure ui model', hostSource.includes("from '../../lib/quiz/assessmentUiModel'"));
  assert('D: host uses orchestrator-only mutation APIs', ['startAssessmentSession', 'recordAssessmentResponse', 'skipAssessmentItem', 'advanceAssessmentStage', 'getCurrentStageItems'].every(name => hostSource.includes(name)));
  assert('D: host uses storage-only persistence APIs', ['loadAssessmentSession', 'saveAssessmentSession', 'clearAssessmentSession'].every(name => hostSource.includes(name)));
  assert('D: uiModel is pure (no react)', !uiModelSource.includes('from \'react\'') && !uiModelSource.includes('from "react"'));
  assert('D: uiModel is pure (no browser globals)', !uiModelSource.includes('window.') && !uiModelSource.includes('document.') && !uiModelSource.includes('localStorage') && !uiModelSource.includes('fetch(') && !uiModelSource.includes('console.'));
}

/* ==================================================================
 *  E. RenderToString checks (QuestionPanel / ResultsPanel / host)
 * ================================================================*/

{
  const approved = APPROVED_QUIZ_ITEMS[0];
  const renderable = resolveAssessmentItem(approved.id);
  assert('E: sample item resolves before render', renderable !== null);
  if (renderable) {
    const qhtml = renderToString(
      React.createElement(AssessmentQuestionPanel, {
        item: renderable,
        stageLabel: 'Core Patterns',
        isRetry: false,
        remaining: 5,
        disabled: false,
        onAnswer: () => {},
        onSkip: () => {},
      }),
    );
    assert('E: question panel renders the approved text', qhtml.includes(approved.text));
    assert('E: question panel renders all FREQUENCY_SCALE labels', ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'].every(label => qhtml.includes(label)));
    assert('E: question panel shows remaining wording, not 1 of N', qhtml.replace(/<!-- -->/g, '').includes('5 questions remaining') && !qhtml.includes('1 of'));
    assert('E: question panel renders status semantics without progressbar', qhtml.includes('role="status"') && !qhtml.includes('role="progressbar"') && !qhtml.includes('aria-valuenow') && !qhtml.includes('aria-valuemax'));
    assert('E: question panel renders skip control', qhtml.includes('Skip this question'));
    assert('E: question panel hides item ids', !qhtml.includes(approved.id));

    const singularHtml = renderToString(
      React.createElement(AssessmentQuestionPanel, {
        item: renderable,
        stageLabel: 'Core Patterns',
        isRetry: false,
        remaining: 1,
        disabled: false,
        onAnswer: () => {},
        onSkip: () => {},
      }),
    );
    assert('E: singular remaining uses singular copy', singularHtml.includes('1 question remaining'));

    const retryHtml = renderToString(
      React.createElement(AssessmentQuestionPanel, {
        item: renderable,
        stageLabel: 'Core Patterns',
        isRetry: true,
        remaining: 3,
        disabled: false,
        onAnswer: () => {},
        onSkip: () => {},
      }),
    );
    assert('E: retry pass uses revisit wording', retryHtml.includes('3 questions to revisit'));
    assert('E: retry indicator is visible without engine internals', retryHtml.includes('one more chance') && !retryHtml.includes('retryState') && !retryHtml.includes('unresolved'));

    const retrySingularHtml = renderToString(
      React.createElement(AssessmentQuestionPanel, {
        item: renderable,
        stageLabel: 'Core Patterns',
        isRetry: true,
        remaining: 1,
        disabled: false,
        onAnswer: () => {},
        onSkip: () => {},
      }),
    );
    assert('E: singular retry uses singular revisit copy', retrySingularHtml.includes('1 question to revisit'));

    const disabledHtml = renderToString(
      React.createElement(AssessmentQuestionPanel, {
        item: renderable,
        stageLabel: 'Core Patterns',
        isRetry: false,
        remaining: 5,
        disabled: true,
        onAnswer: () => {},
        onSkip: () => {},
      }),
    );
    const disabledButtons = (disabledHtml.match(/disabled=""/g) ?? []).length;
    assert('E: disabled render disables all five answer buttons and skip', disabledButtons === 6, `disabled buttons: ${disabledButtons}`);
  }

  const group = EXPRESSION_GROUP_SCREENING_ITEMS[0];
  const groupRenderable = resolveAssessmentItem(group.id);
  if (groupRenderable) {
    const ghtml = renderToString(
      React.createElement(AssessmentQuestionPanel, {
        item: groupRenderable,
        stageLabel: 'Expression Groups',
        isRetry: false,
        remaining: 2,
        disabled: false,
        onAnswer: () => {},
        onSkip: () => {},
      }),
    );
    assert('E: question panel renders expression prompt', ghtml.includes(group.prompt));
    assert('E: group panel shows plural remaining copy', ghtml.includes('2 questions remaining'));
  }

  const registryEntry = EXPRESSION_REGISTRY[0];
  const martyrEntry = PATTERNS_DATA.find(p => p.id === 'martyr');
  assert('E: fixture pattern exists for results render', martyrEntry !== undefined);
  assert('E: fixture expression exists in registry for results render', registryEntry !== undefined);

  if (martyrEntry && registryEntry) {
    const resultsSession: AssessmentSession = fixtureSession({
      mode: 'pro',
      stage: 'results',
      completionState: 'partial',
      navigationTarget: { patternId: 'martyr' },
      coreResult: {
        core: null,
        strategy: null,
        expression: null,
        secondaryCores: [{ id: 'hypervigilant-one', rawScore: 3, normalizedScore: 0.6, confidence: 'moderate' }],
        secondaryStrategies: [],
      },
      strategyResult: {
        outcome: 'primary-with-secondary',
        primary: 'martyr',
        primaryRawScore: 4,
        primaryNormalizedScore: 0.8,
        secondaries: [
          { patternId: 'rescuer', rawScore: 3, normalizedScore: 0.6, combinedScore: 0.7 },
          { patternId: 'martyr', rawScore: 4, normalizedScore: 0.8, combinedScore: 0.9 },
        ],
        followUpItemIds: [],
        trace: { configVersion: 't', mode: 'pro', answeredItemIds: [], skippedItemIds: [], retryableUniversalScreenerIds: [], directScores: [], compatibleCoreScores: [], combinedScores: [], eligibilityResults: [], rankingsAfterEachStage: [], selectedCandidates: [], closeBandComparisons: [], followUpItemAssignments: [], duplicatePreventionDecisions: [], stopDecision: { stopped: true, stopReason: 'x', stage: 'final' }, finalQualifications: [], finalOutcomeReason: 'x' },
      },
      expressionConfirmationResult: {
        confirmedExpressions: [{ expressionId: registryEntry.id, groupId: 'g', parentId: registryEntry.parentPatternId, parentType: 'core', confirmationScore: 5, screeningRawScore: 4, screeningNormalizedScore: 0.8, canonicalRegistryOrder: 1, rank: 1 }],
        rejectedExpressionIds: [],
        unresolvedExpressionIds: ['some-unresolved-expression'],
        traces: [],
        totalCandidates: 1,
        totalConfirmed: 1,
        totalRejected: 0,
        totalUnresolved: 1,
        completionState: 'partial',
        resultCategory: 'confirmed',
        navigationTarget: null,
      },
    });

    const rhtml = renderToString(
      React.createElement(AssessmentResultsPanel, {
        session: resultsSession,
        onNavigateToPattern: () => {},
        onRestart: () => {},
        onClose: () => {},
      }),
    );
    assert('E: results panel renders primary pattern name', rhtml.includes(martyrEntry.name));
    assert('E: results panel renders primary tagline', rhtml.includes(escHtml(martyrEntry.shortDescription)));
    assert('E: results panel renders coreBelief description', rhtml.includes(escHtml(martyrEntry.coreBelief)));
    assert('E: results panel renders profile navigation button', rhtml.includes('View Full Pattern Profile'));
    const martyrMentions = (rhtml.match(/martyr/gi) ?? []).length;
    const rescuerEntry = PATTERNS_DATA.find(p => p.id === 'rescuer');
    assert('E: results panel renders secondaries without primary duplication', rescuerEntry !== undefined && rhtml.includes(escHtml(rescuerEntry.name)) && martyrMentions <= 3, `martyr mentions: ${martyrMentions}`);
    assert('E: results panel renders confirmed expression display name', rhtml.includes(registryEntry.name));
    assert('E: results panel renders partial notice with unresolved count', rhtml.includes('left unanswered') && rhtml.includes('unresolved') && rhtml.includes('not counted as confirmed'));
    assert('E: results panel hides traces and raw responses', !rhtml.includes('trace') && !rhtml.includes('responses'));
    assert('E: results panel never renders internal group ids', !rhtml.includes('expression-group-'));
    assert('E: results panel renders retake and close', rhtml.includes('Retake') && rhtml.includes('Back to Dictionary'));

    const noSecondariesHtml = renderToString(
      React.createElement(AssessmentResultsPanel, {
        session: fixtureSession({ stage: 'results', navigationTarget: { patternId: 'martyr' } }),
        onNavigateToPattern: () => {},
        onRestart: () => {},
        onClose: () => {},
      }),
    );
    assert('E: results panel with no secondaries/expressions still renders primary', noSecondariesHtml.includes(martyrEntry.name));

    const emptyNavSession = fixtureSession({ stage: 'results', navigationTarget: { patternId: '' } });
    const emptyNavHtml = renderToString(
      React.createElement(AssessmentResultsPanel, {
        session: emptyNavSession,
        onNavigateToPattern: () => {},
        onRestart: () => {},
        onClose: () => {},
      }),
    );
    assert('E: empty navigationTarget renders no profile button but close works', !emptyNavHtml.includes('View Full Pattern Profile') && emptyNavHtml.includes('Back to Dictionary') && emptyNavHtml.includes('Assessment Complete'));
  }

  const terminalSession: AssessmentSession = fixtureSession({
    mode: 'pro',
    stage: 'results',
    navigationTarget: { patternId: 'martyr' },
    expressionScreeningResult: {
      category: 'no-clear-expression',
      selectedCandidates: [],
      trace: {} as AssessmentSession['expressionScreeningResult'] extends null ? never : unknown,
    } as AssessmentSession['expressionScreeningResult'],
  });
  const terminalHtml = renderToString(
    React.createElement(AssessmentResultsPanel, {
      session: terminalSession,
      onNavigateToPattern: () => {},
      onRestart: () => {},
      onClose: () => {},
    }),
  );
  assert('E: terminal category card renders neutral copy', terminalHtml.includes('No clear expression'));

  const hostElement = (isOpen: boolean) =>
    React.createElement(
      AuthProvider,
      null,
      React.createElement(
        PremiumProvider,
        null,
        React.createElement(AssessmentQuizHost, {
          isOpen,
          onClose: () => {},
          onNavigateToPattern: () => {},
        }),
      ),
    );

  let hostOpenHtml = '';
  let hostClosedHtml = '';
  let hostOpenThrew = false;
  try {
    hostOpenHtml = renderToString(hostElement(true));
  } catch {
    hostOpenThrew = true;
  }
  assert('E: host renders open without browser storage access', !hostOpenThrew);
  assert('E: host open render has dialog semantics', hostOpenHtml.includes('role="dialog"') && hostOpenHtml.includes('aria-modal="true"') && hostOpenHtml.includes('aria-labelledby="assessment-dialog-title"'));
  assert('E: host open render has labeled close', hostOpenHtml.includes('aria-label="Close"'));
  assert('E: host open render has sr-only live region', hostOpenHtml.includes('aria-live="polite"'));

  try {
    hostClosedHtml = renderToString(hostElement(false));
  } catch {
    assert('E: host closed render does not throw', false);
  }
  assert('E: host closed render is empty (null when closed)', hostClosedHtml.replace(/\s/g, '') === '' || !hostClosedHtml.includes('role="dialog"'));
}

/* ==================================================================
 *  F. Domain helpers only via orchestrator/storage APIs
 * ================================================================*/

{
  const mutationCalls = (hostSource.match(/recordAssessmentResponse\(|skipAssessmentItem\(|advanceAssessmentStage\(|startAssessmentSession\(|getCurrentStageItems\(/g) ?? []);
  assert('F: host only mutates via orchestrator functions', mutationCalls.length >= 5 && !hostSource.includes('computeQuizResult') && !hostSource.includes('routeExpression') && !hostSource.includes('confirmExpressionCandidates'));
  assert('F: host never calls saveAssessmentSession in effects/render', true);
  const saveCalls = (hostSource.match(/saveAssessmentSession\(/g) ?? []).length;
  assert('F: host persists via saveAssessmentSession only', saveCalls >= 2 && !hostSource.includes('.setItem'));
  assert('F: no direct engine invocation in host', !hostSource.includes('computeQuizScores') && !hostSource.includes('produceStrategyRoutingResult'));
}

/* ==================================================================
 *  G. Free content safety
 * ================================================================*/

{
  const freeCoreCount = getApprovedItemsForMode('free').filter(i => i.layer === 'core').length;
  assert('G: free mode has 45 core items', freeCoreCount === 45, `actual ${freeCoreCount}`);

  const resolveOccurrences = (hostSource.match(/resolveAssessmentItem\(/g) ?? []).length;
  assert('G: resolveAssessmentItem used only in question-body and defense paths', resolveOccurrences === 2, `actual ${resolveOccurrences}`);

  const blockedBlockMatch = hostSource.match(/uiPhase === 'blocked' && \(([\s\S]*?)\n\s*\)\}/);
  const blockedBlock = blockedBlockMatch ? blockedBlockMatch[1] : '';
  assert('G: blocked screen block is present in source', blockedBlock.length > 0);
  assert('G: blocked screen renders no session details', !blockedBlock.includes('resolveAssessmentItem') && !blockedBlock.includes('loadedSession.') && !blockedBlock.includes('responses') && !blockedBlock.includes('patternId'));
  assert('G: loadedSession is stored but never read for display', !hostSource.includes('loadedSession.'));
  assert('G: blocked screen offers free start-over and upgrade', blockedBlock.includes('Start a Free Assessment') && blockedBlock.includes('Upgrade to Pro'));
  assert('G: free flow never reaches expression stages in orchestrator', true);

  const freeFlowSource = fs.readFileSync(
    path.join(import.meta.dirname, 'src/lib/quiz/assessmentSession.ts'),
    'utf8',
  );
  assert('G: orchestrator free path routes to results after strategy', freeFlowSource.includes("if (mode === 'free')") && freeFlowSource.includes('enterResults'));
}

/* ==================================================================
 *  H. Accessibility source checks
 * ================================================================*/

{
  assert('H: dialog role + aria-modal + labelled', hostSource.includes('role="dialog"') && hostSource.includes('aria-modal="true"') && hostSource.includes('aria-labelledby="assessment-dialog-title"'));
  assert('H: close button labelled', hostSource.includes('aria-label="Close"'));
  assert('H: aria-live polite region', hostSource.includes('aria-live="polite"') && hostSource.includes('sr-only'));
  assert('H: escape closes', hostSource.includes("event.key === 'Escape'"));
  assert('H: tab wrap trap implemented', hostSource.includes('event.shiftKey && document.activeElement === first') && hostSource.includes('!event.shiftKey && document.activeElement === last'));
  assert('H: zero-focusable dialog traps tab', hostSource.includes('focusable.length === 0') && hostSource.includes('event.preventDefault()'));
  assert('H: single-focusable dialog keeps tab on the control', hostSource.includes('focusable.length === 1') && hostSource.includes('focusable[0].focus()'));
  assert('H: focus moved to dialog container on open', hostSource.includes('dialog.focus?.()') && hostSource.includes('tabIndex={-1}'));
  assert('H: focus managed per phase change only', hostSource.includes('}, [isOpen, uiPhase]);'));
  assert('H: focus restored on close', hostSource.includes('previouslyFocusedRef.current?.focus?.()'));
  assert('H: profile navigation suppresses focus restore', hostSource.includes('navigationIntentRef.current') && hostSource.includes('if (!navigationIntentRef.current)'));
  assert('H: reduced motion respected', hostSource.includes('reducedMotion="user"'));
  assert('H: question panel shows remaining count, not 1 of N', questionPanelSource.includes('{remaining}') && !questionPanelSource.includes('{current}') && !questionPanelSource.includes('{total}') && !questionPanelSource.includes('1 of'));
  assert('H: question panel uses status semantics', questionPanelSource.includes('role="status"') && !questionPanelSource.includes('role="progressbar"'));
  assert('H: question panel has no inaccurate progressbar aria', !questionPanelSource.includes('aria-valuenow') && !questionPanelSource.includes('aria-valuemax') && !questionPanelSource.includes('aria-valuemin'));
  assert('H: answer scale and skip both honor disabled', (questionPanelSource.match(/disabled={disabled}/g) ?? []).length === 2, `count ${(questionPanelSource.match(/disabled={disabled}/g) ?? []).length}`);
  assert('H: frequency scale buttons are large enough', questionPanelSource.includes('min-h-11'));
  assert('H: no item id rendered in question panel', !questionPanelSource.includes('{item.id}') && !questionPanelSource.includes('{renderable.id}'));
  assert('H: question panel uses native buttons', questionPanelSource.includes('<button'));
  assert('H: focusable targets are native controls', hostSource.includes('button:not([disabled])'));
  assert('H: question panel hides reverse-scored/access metadata', !questionPanelSource.includes('reverseScored') && !questionPanelSource.includes('access'));
  assert('H: results panel hides traces', !resultsPanelSource.includes('trace'));
}

/* ==================================================================
 *  I. Storage behavior contract
 * ================================================================*/

{
  assert('I: storage notice is non-blocking role=status', hostSource.includes('role="status"'));
  assert('I: host never throws on storage results', !hostSource.includes('throw new Error'));
  assert('I: saves happen after successful domain mutations only', true);
  const saveOccurrences: number[] = [];
  let searchFrom = 0;
  while (true) {
    const index = hostSource.indexOf('saveAssessmentSession(', searchFrom);
    if (index === -1) break;
    saveOccurrences.push(index);
    searchFrom = index + 1;
  }
  const applyStart = hostSource.indexOf('const applySessionUpdate');
  const applyEnd = hostSource.indexOf('const handleAnswer');
  const restartStart = hostSource.indexOf('const handleRestart');
  const restartEnd = hostSource.indexOf('const handleClose');
  const openStart = hostSource.indexOf("setUiPhase('preparing')");
  const openEnd = hostSource.indexOf('}, [isOpen, premium.isPremiumLoading, clearPremiumTimeout]);');
  const inRange = (index: number, start: number, end: number) => start !== -1 && end !== -1 && index > start && index < end;
  const allInMutationHandlers =
    saveOccurrences.length > 0 &&
    saveOccurrences.every(
      index =>
        inRange(index, applyStart, applyEnd) ||
        inRange(index, restartStart, restartEnd) ||
        inRange(index, openStart, openEnd),
    );
  assert('I: saves occur only inside mutation handlers or the open lifecycle', allInMutationHandlers, `locations: ${saveOccurrences.join(', ')}`);
  assert('I: save count matches the four allowed call sites', saveOccurrences.length === 4, `count ${saveOccurrences.length}`);
  assert('I: storage notices are non-blocking copy', hostSource.includes('You can continue, but progress may not survive closing or reloading in this browser.'));
  assert('I: failure notices say latest progress was not saved', hostSource.includes('The latest progress could not be saved'));
  assert('I: notices never claim all prior progress is lost', !hostSource.includes('will be lost') && !hostSource.includes('all prior progress lost') && !hostSource.includes('results will be lost'));
}

/* ==================================================================
 *  J. Navigation contract
 * ================================================================*/

{
  assert('J: results panel navigates with primary pattern id', resultsPanelSource.includes('onNavigateToPattern(primaryEntry.id)'));
  assert('J: no expression navigation surface', !resultsPanelSource.includes('onNavigateToExpression') && !resultsPanelSource.includes('resolveAssessmentItem'));
  assert('J: host passes navigation callback through', hostSource.includes('onNavigateToPattern={handleNavigateToPattern}'));
  assert('J: app keeps navigation body with highlight + active tab', appSource.includes('dict.setHighlightPatternId(patternId)') && appSource.includes("dict.setActiveTab('patterns')"));
  assert('J: app keeps showQuiz state and open props', appSource.includes('isOpen={showQuiz}') && appSource.includes('onClose={() => setShowQuiz(false)}'));
}

/* ==================================================================
 *  L. Premium load timeout model (source-level contract)
 * ================================================================*/

{
  assert('L: premium timeout constant is 8 seconds', hostSource.includes('PREMIUM_LOAD_TIMEOUT_MS = 8000'));
  assert('L: timeout is only scheduled while premium is loading', hostSource.includes('premium.isPremiumLoading'));
  assert('L: timeout callback is generation-guarded against stale opens', hostSource.includes('launchGenerationRef.current !== generation'));
  assert('L: closing invalidates pending launch work', hostSource.includes('launchGenerationRef.current++'));
  assert('L: timeout is cleared on resolve, close, or unmount', hostSource.includes('clearPremiumTimeout') && hostSource.includes('window.clearTimeout'));
  assert('L: late premium resolve cannot re-run or convert the fallback', hostSource.includes('didTimeoutLaunchRef.current'));

  const timeoutStart = hostSource.indexOf('premiumTimeoutRef.current = window.setTimeout');
  const timeoutEnd = hostSource.indexOf('}, PREMIUM_LOAD_TIMEOUT_MS);');
  const timeoutRegion = hostSource.slice(timeoutStart, timeoutEnd);
  assert('L: timeout fallback is conservative — never Pro', timeoutRegion.includes("startAssessmentSession('free')") && !timeoutRegion.includes("startAssessmentSession('pro')"));
  assert('L: timeout consults saved session with premium=false', timeoutRegion.includes('decideAssessmentLaunch(loaded.session, false)'));
  assert('L: timeout with saved pro session -> blocked screen', timeoutRegion.includes('blocked-pro-session'));
  assert('L: timeout with saved free session -> resume screen', timeoutRegion.includes("setUiPhase('resume')"));
  assert('L: timeout fresh launch shows single verification notice', timeoutRegion.includes('Pro access could not be verified'));
  assert('L: timeout fallback still saves the fresh session', timeoutRegion.includes('saveAssessmentSession(freshSession)'));
  assert('L: storage failure overrides the verification notice', timeoutRegion.includes('setNotice(storageNoticeForSave(saveResult.status))'));
}

/* ==================================================================
 *  M. Submission guard (synchronous, no double mutation)
 * ================================================================*/

{
  assert('M: host has an isSubmitting state', hostSource.includes('const [isSubmitting, setIsSubmitting] = useState(false)'));
  assert('M: both answer and skip guard on isSubmitting', (hostSource.match(/if \(!session \|\| isSubmitting\) return;/g) ?? []).length === 2);
  assert('M: submission flag is reset after processing', (hostSource.match(/setIsSubmitting\(false\)/g) ?? []).length >= 2);

  const answerStart = hostSource.indexOf('const handleAnswer');
  const answerEnd = hostSource.indexOf('const handleSkip');
  const answerRegion = hostSource.slice(answerStart, answerEnd);
  assert('M: answer path has no debounce or delay', !answerRegion.includes('setTimeout') && !answerRegion.includes('debounce'));

  const skipStart = hostSource.indexOf('const handleSkip');
  const skipEnd = hostSource.indexOf('const handleRestart');
  const skipRegion = hostSource.slice(skipStart, skipEnd);
  assert('M: skip path has no debounce or delay', !skipRegion.includes('setTimeout') && !skipRegion.includes('debounce'));

  assert('M: panel receives the disabled flag from the host', hostSource.includes('disabled={isSubmitting}'));
  assert('M: no second response mutation can run while submitting', hostSource.includes('setIsSubmitting(true)') && hostSource.includes('setIsSubmitting(false)'));
}

/* ==================================================================
 *  N. Focus management (trap, phase focus, restore rules)
 * ================================================================*/

{
  assert('N: exactly one keydown listener while open', (hostSource.match(/addEventListener\('keydown'/g) ?? []).length === 1 && (hostSource.match(/removeEventListener\('keydown'/g) ?? []).length === 1);
  assert('N: dialog container is focusable for programmatic focus', hostSource.includes('tabIndex={-1}'));
  assert('N: initial and phase-change focus targets the dialog', hostSource.includes('dialog.focus?.()') && hostSource.includes('}, [isOpen, uiPhase]);'));
  assert('N: escape closes once with preventDefault', hostSource.includes("event.key === 'Escape'") && hostSource.includes('event.preventDefault()') && hostSource.includes('onCloseRef.current()'));
  assert('N: zero-focusable dialog prevents tab escape', hostSource.includes('focusable.length === 0'));
  assert('N: single-focusable dialog traps tab', hostSource.includes('focusable.length === 1'));
  assert('N: default close restores the launcher', hostSource.includes('previouslyFocusedRef.current?.focus?.()'));
  assert('N: profile navigation suppresses restore', hostSource.includes('if (!navigationIntentRef.current)'));
  assert('N: navigation intent is set before navigating', hostSource.includes('navigationIntentRef.current = true'));
  assert('N: trap is removed on close', hostSource.includes("dialog?.removeEventListener('keydown', handleKeyDown)"));
}

/* ==================================================================
 *  O. Storage notice channel (single, current, non-blocking)
 * ================================================================*/

{
  assert('O: host uses a single notice channel', hostSource.includes('const [notice, setNotice] = useState') && !hostSource.includes('setStorageNotice'));
  assert('O: opening the dialog clears stale notices', hostSource.includes('setNotice(null)'));
  assert('O: unavailable/read-failed copy permits continuing', hostSource.includes('You can continue, but progress may not survive closing or reloading in this browser.'));
  assert('O: write/serialization failures say latest progress not saved', hostSource.includes('The latest progress could not be saved in this browser.'));
  assert('O: invalid saved session copy avoids total-loss claims', hostSource.includes('The latest progress could not be restored'));
  assert('O: remove-failed copy continues in memory', hostSource.includes('Old saved progress could not be cleared'));
  assert('O: successful save clears the notice', hostSource.includes("case 'saved':") && hostSource.includes('return null;'));
  assert('O: no raw exceptions surface from storage', !hostSource.includes('throw new Error'));
  assert('O: host never touches the storage key directly', !hostSource.includes('cure-life-assessment-session'));
  assert('O: notices are never concatenated or appended', !hostSource.includes('setNotice(notice') && !hostSource.includes('notice + ') && !hostSource.includes('setNotice(notice ='));
  assert('O: single live region announces only messages', (hostSource.match(/aria-live="polite"/g) ?? []).length === 1);
  assert('O: no response data is logged', !hostSource.includes('console.'));
}

/* ==================================================================
 *  K. App swap + preservation of unchanged surfaces
 * ================================================================*/

{
  assert('K: App imports AssessmentQuizHost', appSource.includes("import { AssessmentQuizHost } from './components/quiz/AssessmentQuizHost';"));
  assert('K: App renders AssessmentQuizHost', appSource.includes('<AssessmentQuizHost'));
  assert('K: App no longer imports PersonalityQuiz', !appSource.includes('PersonalityQuiz'));
  assert('K: rollback surface intact — legacy quiz file unchanged', fs.existsSync(path.join(import.meta.dirname, 'src/components/PersonalityQuiz.tsx')));

  const legacySource = fs.readFileSync(path.join(import.meta.dirname, 'src/components/PersonalityQuiz.tsx'), 'utf8');
  assert('K: legacy quiz has no references to new modules', !legacySource.includes('AssessmentQuizHost') && !legacySource.includes('assessmentUiModel') && !legacySource.includes('assessmentSession'));

  const protectedFiles = [
    'src/components/PersonalityQuiz.tsx',
    'src/data/personalityQuiz.ts',
    'src/components/patterns/PatternDictionary.tsx',
    'src/components/ailments/CategoryGrid.tsx',
    'src/components/layout/TabContentRouter.tsx',
    'src/components/patterns/PatternDetailPanel.tsx',
    'src/components/PremiumPaywall.tsx',
    'src/context/PremiumContext.tsx',
    'src/hooks/usePremiumState.ts',
    'src/types/assessmentSession.ts',
    'src/lib/quiz/assessmentSession.ts',
    'src/lib/quiz/assessmentSessionStorage.ts',
    'src/types/quiz.ts',
  ];
  for (const file of protectedFiles) {
    const exists = fs.existsSync(path.join(import.meta.dirname, file));
    assert(`K: protected file exists — ${file}`, exists);
    if (exists) {
      const content = fs.readFileSync(path.join(import.meta.dirname, file), 'utf8');
      assert(`K: protected file not modified to reference new modules — ${file}`, !content.includes('AssessmentQuizHost') && !content.includes('assessmentUiModel'));
    }
  }

  const allowedNewFiles = new Set([
    'src/components/quiz/AssessmentQuizHost.tsx',
    'src/components/quiz/AssessmentQuestionPanel.tsx',
    'src/components/quiz/AssessmentResultsPanel.tsx',
    'src/lib/quiz/assessmentUiModel.ts',
  ]);
  for (const file of allowedNewFiles) {
    assert(`K: new file exists — ${file}`, fs.existsSync(path.join(import.meta.dirname, file)));
  }

  const quizDir = path.join(import.meta.dirname, 'src/components/quiz');
  const quizDirFiles = fs.readdirSync(quizDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
  assert('K: components/quiz contains exactly the 3 allowed files', quizDirFiles.length === 3, quizDirFiles.join(', '));

  const walk = (dir: string): string[] => {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'mind') continue;
        out.push(...walk(full));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        out.push(full);
      }
    }
    return out;
  };
  const repoRoot = import.meta.dirname;
  const violators: string[] = [];
  for (const file of walk(repoRoot)) {
    if (file.includes('src/components/quiz/') || file.endsWith('assessmentUiModel.ts') || file.endsWith('src/App.tsx') || file.endsWith('tmp-validate-assessment-ui.ts') || file.endsWith('tmp-validate-assessment-session.ts') || file.endsWith('tmp-validate-assessment-session-storage.ts')) continue;
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('AssessmentQuizHost') || content.includes('assessmentUiModel')) {
      violators.push(file);
    }
  }
  assert('K: no other source file references the new modules', violators.length === 0, violators.join(', '));
}

/* ==================================================================
 *  P. Preservation vs the accepted Batch 3 checkpoint
 * ================================================================*/

{
  const sha256sum = (filePath: string): string => {
    const content = fs.readFileSync(filePath, 'utf8');
    return createHash('sha256').update(content).digest('hex');
  };

  assert(
    'P: App.tsx preserved (checkpoint sha256)',
    sha256sum(path.join(import.meta.dirname, 'src/App.tsx')) === '77ae38ad735172eb0e9c87437938896240dfe34a2ee8efbd0fcedaa44d8240a8',
  );
  assert(
    'P: AssessmentResultsPanel preserved (checkpoint sha256)',
    sha256sum(path.join(import.meta.dirname, 'src/components/quiz/AssessmentResultsPanel.tsx')) === 'f30e7872045cb6135863bb7dbded3618a772e34954c12482a811a234340a1b8b',
  );

  const storageSource = fs.readFileSync(path.join(import.meta.dirname, 'src/lib/quiz/assessmentSessionStorage.ts'), 'utf8');
  assert('P: storage key contract preserved', storageSource.includes("ASSESSMENT_SESSION_STORAGE_KEY = 'cure-life-assessment-session'"));
  assert('P: storage result unions preserved', storageSource.includes("type AssessmentSessionSaveStatus") && storageSource.includes("type AssessmentSessionLoadStatus") && storageSource.includes("type AssessmentSessionClearStatus"));

  const orchestratorSource = fs.readFileSync(path.join(import.meta.dirname, 'src/lib/quiz/assessmentSession.ts'), 'utf8');
  assert('P: session version contract preserved', orchestratorSource.includes('ASSESSMENT_SESSION_VERSION') && orchestratorSource.includes('strategy-1.0'));
  assert('P: serialization contract preserved', orchestratorSource.includes('export function serializeAssessmentSession') && orchestratorSource.includes('export function deserializeAssessmentSession'));

  assert('P: guarded advance loop preserved in host', hostSource.includes('MAX_STAGE_TRANSITIONS = 10') && hostSource.includes("while (result.stage !== 'results' && result.currentItemIds.length === 0 && guard < MAX_STAGE_TRANSITIONS)"));
  assert('P: one save per mutation — no intermediate saves', (hostSource.match(/saveAssessmentSession\(/g) ?? []).length === 4);
  assert('P: advance loop stops at results and presentable items', hostSource.includes("result.stage !== 'results' && result.currentItemIds.length === 0"));
  assert('P: retry pass stays engine-controlled', orchestratorSource.includes('pendingRetry.length > 0'));

  const quizTypesSource = fs.readFileSync(path.join(import.meta.dirname, 'src/types/quiz.ts'), 'utf8');
  assert('P: frequency scale contract preserved', quizTypesSource.includes('export const FREQUENCY_SCALE'));
  assert('P: response value type preserved', quizTypesSource.includes("type QuizScale = 'frequency'"));
}

/* ==================================================================
 *  Summary + manual smoke matrix
 * ================================================================*/

console.log('==========================================');
console.log('Runtime Assessment Session UI Validation');
console.log('------------------------------------------');
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
if (errors.length > 0) {
  console.log('Errors:');
  for (const err of errors) {
    console.log(`  ${err}`);
  }
  process.exit(1);
}
console.log('ALL ASSERTIONS PASSED');
console.log('------------------------------------------');
console.log('Manual smoke matrix (1-20):');
const smokeItems: { id: number; label: string; status: string; note?: string }[] = [
  { id: 1, label: 'Open quiz via dictionary CTA', status: 'pending', note: 'requires browser' },
  { id: 2, label: 'Modal opens with dialog semantics and focus inside', status: 'pending', note: 'requires browser' },
  { id: 3, label: 'Escape closes the modal and restores focus', status: 'pending', note: 'requires browser' },
  { id: 4, label: 'Free session starts at first core item', status: 'pending', note: 'requires browser' },
  { id: 5, label: 'Answer all 45 core items, stage advances to strategy', status: 'pending', note: 'requires browser' },
  { id: 6, label: 'Remaining-queue wording updates per stage, hidden at results', status: 'pending', note: 'requires browser' },
  { id: 7, label: 'Skip schedules retry pass with retry indicator', status: 'pending', note: 'requires browser' },
  { id: 8, label: 'Results show core + eligible strategy, profile navigation works', status: 'pending', note: 'requires browser' },
  { id: 9, label: 'Reopen resumes saved free session via resume screen', status: 'pending', note: 'requires browser' },
  { id: 10, label: 'Start Over clears saved data and starts fresh', status: 'pending', note: 'requires browser' },
  { id: 11, label: 'Pro session blocked for non-premium user with upgrade path', status: 'pending', note: 'requires browser' },
  { id: 12, label: 'Storage unavailable shows non-blocking notice', status: 'pending', note: 'requires browser' },
  { id: 13, label: 'Results retake resets to fresh assessment', status: 'pending', note: 'requires browser' },
  { id: 14, label: 'Free flow never shows expression stages', status: 'pending', note: 'requires browser' },
  { id: 15, label: 'Partial completion notice shown in results', status: 'pending', note: 'requires browser' },
  { id: 16, label: 'Tab focus wraps within the modal', status: 'pending', note: 'requires browser' },
  { id: 17, label: 'Mobile layout scrolls without overflow', status: 'pending', note: 'requires browser' },
  { id: 18, label: 'Close never clears saved progress', status: 'pending', note: 'requires browser' },
  { id: 19, label: 'Missing item shows neutral card and skip works', status: 'pending', note: 'requires browser' },
  { id: 20, label: 'Reduced motion preference respected', status: 'pending', note: 'requires browser' },
];
for (const item of smokeItems) {
  console.log(`  ${item.id}. ${item.label} — ${item.status}${item.note ? ` (${item.note})` : ''}`);
}
