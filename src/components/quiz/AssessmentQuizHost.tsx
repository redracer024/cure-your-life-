import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { X, RotateCcw, Lock, Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { usePremium } from '../../context/PremiumContext';
import {
  startAssessmentSession,
  recordAssessmentResponse,
  skipAssessmentItem,
  advanceAssessmentStage,
  getCurrentStageItems,
} from '../../lib/quiz/assessmentSession';
import {
  loadAssessmentSession,
  saveAssessmentSession,
  clearAssessmentSession,
  type AssessmentSessionSaveResult,
  type AssessmentSessionClearResult,
} from '../../lib/quiz/assessmentSessionStorage';
import {
  resolveAssessmentItem,
  getAssessmentStageLabel,
  getAssessmentStageProgress,
  isAssessmentRetryItem,
  decideAssessmentLaunch,
} from '../../lib/quiz/assessmentUiModel';
import { AssessmentQuestionPanel } from './AssessmentQuestionPanel';
import { AssessmentResultsPanel } from './AssessmentResultsPanel';
import type {
  AssessmentMode,
  AssessmentResponseValue,
  AssessmentSession,
  AssessmentStage,
} from '../../types/assessmentSession';

export interface AssessmentQuizHostProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPattern: (patternId: string) => void;
}

type AssessmentQuizUiPhase =
  | 'preparing'
  | 'resume'
  | 'question'
  | 'results'
  | 'blocked';

function uiPhaseForStage(stage: AssessmentStage): AssessmentQuizUiPhase {
  return stage === 'results' ? 'results' : 'question';
}

const MAX_STAGE_TRANSITIONS = 10;

function storageNoticeForSave(status: AssessmentSessionSaveResult['status']): string | null {
  switch (status) {
    case 'saved':
      return null;
    case 'unavailable':
      return 'Progress cannot be saved in this browser — results will be lost when you close.';
    case 'invalid-session':
    case 'serialization-failed':
      return 'Progress could not be saved in this browser.';
    case 'write-failed':
      return 'Progress could not be saved in this browser — results will be lost when you close.';
  }
}

function storageNoticeForClear(status: AssessmentSessionClearResult['status']): string | null {
  switch (status) {
    case 'cleared':
    case 'unavailable':
      return null;
    case 'remove-failed':
      return 'Your previous assessment could not be cleared, but a new assessment is ready.';
  }
}

export const AssessmentQuizHost: React.FC<AssessmentQuizHostProps> = ({
  isOpen,
  onClose,
  onNavigateToPattern,
}) => {
  const premium = usePremium();
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [uiPhase, setUiPhase] = useState<AssessmentQuizUiPhase>('preparing');
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [blockedSession, setBlockedSession] = useState<AssessmentSession | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (
      !isOpen ||
      (setUiPhase('preparing'),
      setSession(null),
      setBlockedSession(null),
      setStorageNotice(null),
      setMessage('Preparing your assessment'),
      premium.isPremiumLoading)
    ) {
      return;
    }

    const loaded = loadAssessmentSession();
    if (loaded.status === 'loaded' && loaded.session) {
      const decision = decideAssessmentLaunch(loaded.session, premium.isPremium);
      if (decision.type === 'blocked-pro-session') {
        setBlockedSession(decision.session);
        setUiPhase('blocked');
        setMessage('Your saved assessment requires Pro access');
        return;
      }
      if (decision.type === 'resume') {
        const resumedSession = decision.session;
        setSession(resumedSession);
        setUiPhase('resume');
        setMessage('A saved assessment is available');
        return;
      }
    }

    const mode: AssessmentMode = premium.isPremium ? 'pro' : 'free';
    const freshSession = startAssessmentSession(mode);
    setSession(freshSession);
    setUiPhase('question');
    setMessage('Assessment started');
    const saveResult = saveAssessmentSession(freshSession);
    setStorageNotice(storageNoticeForSave(saveResult.status));
  }, [isOpen, premium.isPremiumLoading]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    previouslyFocusedRef.current = previouslyFocused;
    const getFocusable = (): HTMLElement[] => {
      const dialog = dialogRef.current;
      if (!dialog) return [];
      const focusable: HTMLElement[] = [];
      dialog
        .querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
        .forEach(el => {
          if (el instanceof HTMLElement) focusable.push(el);
        });
      return focusable.filter(el => el.offsetParent !== null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const dialog = dialogRef.current;
    dialog?.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog?.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
      previouslyFocusedRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable: HTMLElement[] = [];
      dialog
        .querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
        .forEach(el => {
          if (el instanceof HTMLElement) focusable.push(el);
        });
      const firstFocusable = focusable.find(el => el.offsetParent !== null) ?? dialog;
      firstFocusable?.focus?.();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen, uiPhase]);

  useEffect(() => {
    if (!isOpen || uiPhase !== 'question' || !session) return;
    const currentItemId = getCurrentStageItems(session)[0];
    if (currentItemId && !resolveAssessmentItem(currentItemId)) {
      setMessage('A question is unavailable in this build and will be skipped');
    }
  }, [isOpen, uiPhase, session]);

  const applySessionUpdate = useCallback(
    (updater: (current: AssessmentSession) => AssessmentSession): AssessmentSession | null => {
      if (!session) return null;
      const prevStage = session.stage;
      const prevCurrentItem = getCurrentStageItems(session)[0] ?? null;
      const nextSession = updater(session);
      if (nextSession === session) return null;
      let result = nextSession;
      let guard = 0;
      while (result.stage !== 'results' && result.currentItemIds.length === 0 && guard < MAX_STAGE_TRANSITIONS) {
        const advanced = advanceAssessmentStage(result);
        if (
          advanced === result ||
          (advanced.stage === result.stage && advanced.currentItemIds.length === result.currentItemIds.length)
        ) {
          break;
        }
        result = advanced;
        guard++;
      }
      setSession(result);
      setUiPhase(uiPhaseForStage(result.stage));
      if (result.stage === 'results') {
        setMessage('Your results are ready');
      } else if (result.stage !== prevStage) {
        setMessage(`Now assessing: ${getAssessmentStageLabel(result.stage)}`);
      }
      const currentItemId = result.currentItemIds[0] ?? null;
      if (currentItemId !== null && currentItemId !== prevCurrentItem && isAssessmentRetryItem(result, currentItemId)) {
        setMessage('One more chance to answer a previously skipped question');
      }
      const saveResult = saveAssessmentSession(result);
      setStorageNotice(storageNoticeForSave(saveResult.status));
      return result;
    },
    [session],
  );

  const handleAnswer = useCallback(
    (value: AssessmentResponseValue) => {
      if (!session) return;
      const currentItemId = getCurrentStageItems(session)[0];
      if (currentItemId) {
        applySessionUpdate(prev => recordAssessmentResponse(prev, currentItemId, value));
      }
    },
    [session, applySessionUpdate],
  );

  const handleSkip = useCallback(() => {
    if (!session) return;
    const currentItemId = getCurrentStageItems(session)[0];
    if (!currentItemId) return;
    const nextSession = applySessionUpdate(prev => skipAssessmentItem(prev, currentItemId));
    const nextCurrentItem = nextSession ? (nextSession.currentItemIds[0] ?? null) : null;
    if (nextSession && nextCurrentItem !== null && isAssessmentRetryItem(nextSession, nextCurrentItem)) {
      setMessage('Question skipped — one more chance to answer it later');
    } else {
      setMessage('Question skipped');
    }
  }, [session, applySessionUpdate]);

  const handleResume = useCallback(() => {
    if (!session) return;
    setUiPhase(uiPhaseForStage(session.stage));
    setMessage('Continuing your assessment');
  }, [session]);

  const handleRestart = useCallback(() => {
    const clearResult = clearAssessmentSession();
    const mode: AssessmentMode = premium.isPremium ? 'pro' : 'free';
    const freshSession = startAssessmentSession(mode);
    setSession(freshSession);
    setBlockedSession(null);
    setUiPhase('question');
    setMessage('Started a new assessment');
    setStorageNotice(storageNoticeForClear(clearResult.status));
    const saveResult = saveAssessmentSession(freshSession);
    if (saveResult.status !== 'saved') {
      setStorageNotice(storageNoticeForSave(saveResult.status));
    }
  }, [premium.isPremium]);

  const handleClose = useCallback(() => {
    onCloseRef.current();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              ref={dialogRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="assessment-dialog-title"
              className="relative w-full max-w-2xl mx-4 my-8 bg-[#07090E] border border-indigo-500/20 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(99,102,241,0.12)]"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500" />
              <button
                onClick={handleClose}
                aria-label="Close"
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <div aria-live="polite" className="sr-only">
                {message}
              </div>
              {storageNotice && (
                <div role="status" className="px-8 pt-6 -mb-2 text-[11px] font-mono text-amber-400/90">
                  {storageNotice}
                </div>
              )}
              <AnimatePresence mode="wait">
                {uiPhase === 'preparing' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-8 md:p-10 flex flex-col items-center gap-4 text-center"
                  >
                    <h2 id="assessment-dialog-title" className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none">
                      Somatic Pattern Assessment
                    </h2>
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    <p className="text-sm text-slate-400 font-sans font-light">Preparing your assessment…</p>
                  </motion.div>
                )}
                {uiPhase === 'resume' && session && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-8 md:p-10 space-y-6 text-center"
                  >
                    <h2 id="assessment-dialog-title" className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none">
                      Continue Your Assessment
                    </h2>
                    <p className="text-sm text-slate-400 max-w-md mx-auto font-sans font-light leading-7">
                      You have a saved assessment in progress. Pick up where you left off, or start over with a fresh assessment.
                    </p>
                    <div className="flex flex-col items-center gap-3 pt-2">
                      <button
                        onClick={handleResume}
                        className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] cursor-pointer flex items-center gap-2"
                      >
                        Resume
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleRestart}
                        className="px-5 py-2.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Start Over
                      </button>
                    </div>
                  </motion.div>
                )}
                {uiPhase === 'question' && session && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <QuestionStageBody session={session} onAnswer={handleAnswer} onSkip={handleSkip} />
                  </motion.div>
                )}
                {uiPhase === 'results' && session && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <AssessmentResultsPanel
                      session={session}
                      onNavigateToPattern={onNavigateToPattern}
                      onRestart={handleRestart}
                      onClose={handleClose}
                    />
                  </motion.div>
                )}
                {uiPhase === 'blocked' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-8 md:p-10 space-y-6 text-center"
                  >
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] font-mono text-amber-400 uppercase tracking-widest font-black">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Premium Assessment</span>
                      </div>
                      <h2 id="assessment-dialog-title" className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none">
                        Your Saved Assessment Requires Pro Access
                      </h2>
                      <p className="text-sm text-slate-400 max-w-md mx-auto font-sans font-light leading-7">
                        This assessment was created with Pro access. Upgrade to continue it, or start a new free assessment.
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-3 pt-2">
                      <button
                        onClick={() => premium.setShowPaywall(true)}
                        className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-black uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Upgrade to Pro
                      </button>
                      <button
                        onClick={handleRestart}
                        className="px-5 py-2.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Start a Free Assessment
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
};

interface QuestionStageBodyProps {
  session: AssessmentSession;
  onAnswer: (value: AssessmentResponseValue) => void;
  onSkip: () => void;
}

const QuestionStageBody: React.FC<QuestionStageBodyProps> = ({ session, onAnswer, onSkip }) => {
  const itemId = getCurrentStageItems(session)[0];
  const item = itemId ? resolveAssessmentItem(itemId) : null;

  if (itemId && !item) {
    return (
      <div className="p-8 md:p-10 space-y-6 text-center">
        <h2 id="assessment-dialog-title" className="text-xl font-black uppercase tracking-tight text-white leading-none">
          Question Unavailable
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto font-sans font-light leading-7">
          This question is not available in this build. You can skip it and continue with the rest of the assessment.
        </p>
        <button
          onClick={onSkip}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all cursor-pointer"
        >
          Skip this question
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8 md:p-10 flex flex-col items-center gap-4 text-center">
        <h2 id="assessment-dialog-title" className="text-2xl font-black uppercase tracking-tight text-white leading-none">
          Somatic Pattern Assessment
        </h2>
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        <p className="text-sm text-slate-400 font-sans font-light">Preparing the next question…</p>
      </div>
    );
  }

  const progress = getAssessmentStageProgress(session);
  return (
    <AssessmentQuestionPanel
      item={item}
      stageLabel={getAssessmentStageLabel(session.stage)}
      isRetry={isAssessmentRetryItem(session, item.id)}
      current={progress.current}
      total={progress.total}
      onAnswer={onAnswer}
      onSkip={onSkip}
    />
  );
};
