import React from 'react';
import { BookOpen, ChevronRight, RotateCcw } from 'lucide-react';
import { PATTERNS_DATA } from '../../data/patterns';
import { EXPRESSION_REGISTRY, getPatternDisplayName } from '../../data/quiz/patternTaxonomy';
import type { AssessmentSession } from '../../types/assessmentSession';

interface AssessmentResultsPanelProps {
  session: AssessmentSession;
  onNavigateToPattern: (patternId: string) => void;
  onRestart: () => void;
  onClose: () => void;
}

interface TerminalCategoryCopy {
  title: string;
  body: string;
}

const TERMINAL_CATEGORY_COPY: Record<string, TerminalCategoryCopy> = {
  'no-clear-strategy': {
    title: 'No clear strategy pattern',
    body: 'Your answers did not point to one strategy pattern with enough certainty. Your core pattern result is still shown above.',
  },
  'insufficient-evidence': {
    title: 'Insufficient evidence',
    body: 'Not enough questions were answered for a confident result in this layer.',
  },
  'no-eligible-expression-parent': {
    title: 'No eligible pattern branch',
    body: 'No eligible pattern branch could be established for the expression layer.',
  },
  'no-clear-group': {
    title: 'No clear expression group',
    body: 'No expression group met the threshold for further assessment.',
  },
  'insufficient-group-evidence': {
    title: 'Insufficient group evidence',
    body: 'There was not enough answered evidence to select an expression group.',
  },
  'no-advancing-expression-group': {
    title: 'No advancing expression group',
    body: 'No expression group advanced to individual expression screening.',
  },
  'no-clear-expression': {
    title: 'No clear expression',
    body: 'No individual expression met the threshold for confirmation.',
  },
  'insufficient-expression-evidence': {
    title: 'Insufficient expression evidence',
    body: 'There was not enough answered evidence to select an individual expression.',
  },
  'expression-not-assessed': {
    title: 'Expression layer not assessed',
    body: 'This layer was not reached in this assessment.',
  },
};

const TERMINAL_STRATEGY_OUTCOMES = ['no-clear-strategy', 'insufficient-evidence'];
const TERMINAL_GROUP_CATEGORIES = [
  'no-clear-group',
  'insufficient-group-evidence',
  'no-eligible-expression-parent',
  'expression-not-assessed',
];
const TERMINAL_SCREENING_CATEGORIES = [
  'no-clear-expression',
  'insufficient-expression-evidence',
  'no-advancing-expression-group',
  'expression-not-assessed',
];

function terminalCategoryFor(session: AssessmentSession): TerminalCategoryCopy | null {
  const confirmation = session.expressionConfirmationResult;
  if (confirmation && confirmation.resultCategory !== 'confirmed') {
    const copy = TERMINAL_CATEGORY_COPY[confirmation.resultCategory];
    if (copy) return copy;
  }

  const screening = session.expressionScreeningResult;
  if (screening && TERMINAL_SCREENING_CATEGORIES.includes(screening.category)) {
    const copy = TERMINAL_CATEGORY_COPY[screening.category];
    if (copy) return copy;
  }

  const group = session.expressionGroupResult;
  if (group && TERMINAL_GROUP_CATEGORIES.includes(group.category)) {
    const copy = TERMINAL_CATEGORY_COPY[group.category];
    if (copy) return copy;
  }

  const strategy = session.strategyResult;
  if (strategy && TERMINAL_STRATEGY_OUTCOMES.includes(strategy.outcome)) {
    const copy = TERMINAL_CATEGORY_COPY[strategy.outcome];
    if (copy) return copy;
  }

  return null;
}

export const AssessmentResultsPanel: React.FC<AssessmentResultsPanelProps> = ({
  session,
  onNavigateToPattern,
  onRestart,
  onClose,
}) => {
  const primaryPatternId = session.navigationTarget.patternId;
  const primaryEntry = primaryPatternId
    ? PATTERNS_DATA.find(pattern => pattern.id === primaryPatternId) ?? null
    : null;

  const strategyResult = session.strategyResult;
  const strategyPrimary = strategyResult?.primary ?? null;
  const strategySecondaries = strategyResult?.secondaries ?? [];
  const coreResult = session.coreResult;
  const corePrimaryId = coreResult?.core?.id ?? null;

  const hasStrategySecondaries = strategyResult !== null && strategySecondaries.length > 0;

  const secondaries: { id: string; name: string; color: string; shortDescription: string }[] = [];
  if (hasStrategySecondaries) {
    for (const secondary of strategySecondaries) {
      if (secondary.patternId === strategyPrimary) continue;
      const entry = PATTERNS_DATA.find(pattern => pattern.id === secondary.patternId);
      if (entry) {
        secondaries.push({
          id: entry.id,
          name: entry.name,
          color: entry.color,
          shortDescription: entry.shortDescription,
        });
      }
    }
  } else if (coreResult) {
    for (const secondary of coreResult.secondaryCores) {
      if (secondary.id === corePrimaryId) continue;
      const entry = PATTERNS_DATA.find(pattern => pattern.id === secondary.id);
      if (entry) {
        secondaries.push({
          id: entry.id,
          name: entry.name,
          color: entry.color,
          shortDescription: entry.shortDescription,
        });
      }
    }
  }

  const confirmation = session.expressionConfirmationResult;
  const confirmedExpressions = confirmation
    ? confirmation.confirmedExpressions.map(entry => {
        const registryEntry = EXPRESSION_REGISTRY.find(reg => reg.id === entry.expressionId);
        if (!registryEntry) return null;
        return {
          name: registryEntry.name,
          parentName: getPatternDisplayName(registryEntry.parentPatternId) ?? null,
        };
      }).filter((entry): entry is { name: string; parentName: string | null } => entry !== null)
    : [];

  const isPartial =
    session.completionState === 'partial' ||
    (confirmation !== null && confirmation.completionState === 'partial');
  const unresolvedCount = confirmation ? confirmation.totalUnresolved : 0;

  const terminalCopy = terminalCategoryFor(session);

  return (
    <div className="p-8 md:p-10 space-y-6">
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Your Results</span>
        </div>
        {primaryEntry ? (
          <>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none">
              Your Pattern Is The{' '}
              <span style={{ color: primaryEntry.color }}>{primaryEntry.name}</span>
            </h2>
            <p
              className="text-sm italic max-w-md mx-auto font-sans"
              style={{ color: primaryEntry.color + 'CC' }}
            >
              {primaryEntry.shortDescription}
            </p>
          </>
        ) : (
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none">
            Assessment Complete
          </h2>
        )}
      </div>

      {primaryEntry && (
        <div
          className="p-5 rounded-2xl border space-y-3"
          style={{
            borderColor: primaryEntry.color + '30',
            background: primaryEntry.color + '08',
          }}
        >
          <p className="text-sm text-slate-300 leading-7 font-sans font-light">
            {primaryEntry.coreBelief}
          </p>
        </div>
      )}

      {primaryEntry && onNavigateToPattern && (
        <button
          onClick={() => onNavigateToPattern(primaryEntry.id)}
          className="w-full p-4 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between gap-3"
          style={{
            borderColor: primaryEntry.color + '30',
            background: primaryEntry.color + '08',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors shrink-0"
              style={{
                background: primaryEntry.color + '15',
                borderColor: primaryEntry.color + '25',
              }}
            >
              <BookOpen className="w-5 h-5" style={{ color: primaryEntry.color }} />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black uppercase tracking-tight text-white group-hover:translate-x-0.5 transition-transform font-display">
                View Full Pattern Profile
              </h3>
              <p className="text-[11px] text-slate-500 font-sans font-light">
                Reset protocols, body map, journal prompts, and more
              </p>
            </div>
          </div>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center border transition-all shrink-0 group-hover:translate-x-1"
            style={{
              background: primaryEntry.color + '15',
              borderColor: primaryEntry.color + '25',
            }}
          >
            <ChevronRight className="w-3.5 h-3.5" style={{ color: primaryEntry.color }} />
          </div>
        </button>
      )}

      {secondaries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">
            Also Present
          </h3>
          <div className="space-y-2">
            {secondaries.map(secondary => (
              <div
                key={secondary.id}
                className="w-full flex items-start gap-3 p-3 rounded-2xl bg-black/30 border border-white/5"
              >
                <span
                  className="shrink-0 w-2.5 h-2.5 rounded-full mt-2"
                  style={{ background: secondary.color }}
                />
                <div>
                  <span className="text-sm font-bold text-white">{secondary.name}</span>
                  <p className="text-[11px] text-slate-500 font-sans font-light leading-5">
                    {secondary.shortDescription}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmedExpressions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">
            Confirmed Expressions
          </h3>
          <div className="space-y-2">
            {confirmedExpressions.map(entry => (
              <div
                key={entry.name}
                className="w-full p-4 rounded-2xl bg-black/30 border border-white/5"
              >
                <span className="text-sm font-bold text-white">{entry.name}</span>
                {entry.parentName && (
                  <p className="text-[11px] text-slate-500 font-sans font-light">
                    Part of the {entry.parentName} pattern
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {terminalCopy && (
        <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-2">
          <h3 className="text-xs font-mono text-slate-300 uppercase tracking-widest font-bold">
            {terminalCopy.title}
          </h3>
          <p className="text-sm text-slate-400 leading-7 font-sans font-light">
            {terminalCopy.body}
          </p>
        </div>
      )}

      {isPartial && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-center space-y-1">
          <p className="text-[11px] font-mono text-amber-400">
            Some questions were skipped and left unanswered. Results reflect only what you
            completed.
          </p>
          {unresolvedCount > 0 && (
            <p className="text-[11px] font-mono text-amber-400">
              {unresolvedCount} {unresolvedCount === 1 ? 'expression was' : 'expressions were'} left
              unresolved and not counted as confirmed.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={onRestart}
          className="px-5 py-2.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retake
        </button>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all cursor-pointer"
        >
          Back to Dictionary
        </button>
      </div>
    </div>
  );
};
