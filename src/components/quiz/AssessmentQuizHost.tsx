import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { X, RotateCcw, Lock, Sparkles, Loader2, ChevronRight, Trash2 } from 'lucide-react';
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
  type AssessmentSessionLoadResult,
  type AssessmentSessionClearResult,
} from '../../lib/quiz/assessmentSessionStorage';
import {
  resolveAssessmentItem,
  getAssessmentStageLabel,
  getAssessmentStageProgress,
  isAssessmentRetryItem,
  decideAssessmentLaunch,
  ASSESSMENT_PRIVACY_DISCLOSURE,
  ASSESSMENT_RESUME_REMINDER,
  ASSESSMENT_RESULTS_REMINDER,
  ASSESSMENT_BLOCKED_REMINDER,
  ASSESSMENT_CLEAR_LABEL,
  ASSESSMENT_CLEAR_CONFIRM_TITLE,
  ASSESSMENT_CLEAR_CONFIRM_BODY,
  ASSESSMENT_CLEAR_CONFIRM_ACTION,
  ASSESSMENT_CLEAR_CANCEL_ACTION,
  ASSESSMENT_CLEAR_FAILURE_NOTICE,
  ASSESSMENT_CONSENT_LABEL,
  ASSESSMENT_CONSENT_LEGAL_LINK_LABEL,
  ASSESSMENT_CONSENT_REQUIRED_NOTICE,
} from '../../lib/quiz/assessmentUiModel';
import { openLegalDoc } from '../../lib/legal/legalPagesStore';
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
  | 'intro'
  | 'resume'
  | 'question'
  | 'results'
  | 'blocked';

function uiPhaseForStage(stage: AssessmentStage): AssessmentQuizUiPhase {
  return stage === 'results' ? 'results' : 'question';
}

const MAX_STAGE_TRANSITIONS = 10;

const PREMIUM_LOAD_TIMEOUT_MS = 8000;

function storageNoticeForSave(status: AssessmentSessionSaveResult['status']): string | null {
  switch (status) {
    case 'saved':
      return null;
    case 'unavailable':
      return 'You can continue, but progress may not survive closing or reloading in this browser.';
    case 'invalid-session':
    case 'serialization-failed':
      return 'The latest progress could not be saved in this browser.';
    case 'write-failed':
      return 'The latest progress could not be saved — you can continue, but it may not survive closing or reloading.';
  }
}

function storageNoticeForLoad(status: AssessmentSessionLoadResult['status']): string | null {
  switch (status) {
    case 'loaded':
    case 'missing':
      return null;
    case 'unavailable':
    case 'read-failed':
      return 'You can continue, but progress may not survive closing or reloading in this browser.';
    case 'invalid-session':
      return 'The latest progress could not be restored — starting a new assessment.';
  }
}

function storageNoticeForClear(status: AssessmentSessionClearResult['status']): string | null {
  switch (status) {
    case 'cleared':
    case 'unavailable':
      return null;
    case 'remove-failed':
      return 'Old saved progress could not be cleared — continuing with a new assessment.';
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
  const [notice, setNotice] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [blockedSession, setBlockedSession] = useState<AssessmentSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clearConfirming, setClearConfirming] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const consentAcceptedRef = useRef(false);
  const clearOpenerRef = useRef<HTMLElement | null>(null);
  const clearConfirmingRef = useRef(false);
  const cancelClearRef = useRef<() => void>(() => {});
  const cancelRestoreFocusRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const launchGenerationRef = useRef(0);
  const premiumTimeoutRef = useRef<number | null>(null);
  const didTimeoutLaunchRef = useRef(false);
  const navigationIntentRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const clearPremiumTimeout = useCallback(() => {
    if (premiumTimeoutRef.current !== null) {
      window.clearTimeout(premiumTimeoutRef.current);
      premiumTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      launchGenerationRef.current++;
      didTimeoutLaunchRef.current = false;
      setClearConfirming(false);
      clearConfirmingRef.current = false;
      setConsentAccepted(false);
      consentAcceptedRef.current = false;
      return;
    }
    if (didTimeoutLaunchRef.current) return;
    const generation = ++launchGenerationRef.current;
    setSession(null);
    setBlockedSession(null);
    setNotice(null);
    setMessage('Preparing your assessment');
    setUiPhase('preparing');

    if (premium.isPremiumLoading) {
      premiumTimeoutRef.current = window.setTimeout(() => {
        if (launchGenerationRef.current !== generation) return;
        premiumTimeoutRef.current = null;
        didTimeoutLaunchRef.current = true;
        const loaded = loadAssessmentSession();
        if (loaded.status === 'loaded' && loaded.session) {
          const decision = decideAssessmentLaunch(loaded.session, false);
          if (decision.type === 'blocked-pro-session') {
            setBlockedSession(decision.session);
            setUiPhase('blocked');
            setMessage('Your saved assessment requires Pro access');
            return;
          }
          if (decision.type === 'resume') {
            setSession(decision.session);
            setUiPhase('resume');
            setMessage('A saved assessment is available');
            return;
          }
        }
        const freshSession = startAssessmentSession('free');
        setSession(freshSession);
        setUiPhase('intro');
        setMessage('Your assessment is ready to start');
        setNotice('Pro access could not be verified — continuing with free access.');
        const saveResult = saveAssessmentSession(freshSession);
        if (saveResult.status !== 'saved') {
          setNotice(storageNoticeForSave(saveResult.status));
        }
      }, PREMIUM_LOAD_TIMEOUT_MS);
      return () => clearPremiumTimeout();
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
    setUiPhase('intro');
    setMessage('Your assessment is ready to start');
    setNotice(
      storageNoticeForLoad(loaded.status) ??
        storageNoticeForSave(saveAssessmentSession(freshSession).status),
    );
    return () => clearPremiumTimeout();
  }, [isOpen, premium.isPremiumLoading, clearPremiumTimeout]);

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
        if (clearConfirmingRef.current) {
          cancelClearRef.current();
          return;
        }
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      if (focusable.length === 1) {
        event.preventDefault();
        focusable[0].focus();
        return;
      }
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
      if (!navigationIntentRef.current) {
        previouslyFocusedRef.current?.focus?.();
      }
      navigationIntentRef.current = false;
      previouslyFocusedRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      dialog.focus?.();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen, uiPhase]);

  useEffect(() => {
    if (!isOpen || uiPhase !== 'intro') return;
    const focusTimer = window.setTimeout(() => {
      const title = dialogRef.current?.querySelector<HTMLElement>('#assessment-dialog-title');
      title?.focus?.();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen, uiPhase]);

  useEffect(() => {
    if (!isOpen || !clearConfirming) return;
    const focusTimer = window.setTimeout(() => {
      const title = dialogRef.current?.querySelector<HTMLElement>('#assessment-clear-confirm-title');
      title?.focus?.();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen, clearConfirming]);

  useEffect(() => {
    if (!isOpen || clearConfirming) return;
    if (!cancelRestoreFocusRef.current) return;
    cancelRestoreFocusRef.current = false;
    const focusTimer = window.setTimeout(() => {
      const opener = dialogRef.current?.querySelector<HTMLElement>('[data-clear-opener]');
      opener?.focus?.();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen, clearConfirming]);

  useEffect(() => {
    consentAcceptedRef.current = consentAccepted;
  }, [consentAccepted]);

  useEffect(() => {
    if (!clearConfirmingRef.current) return;
    setClearConfirming(false);
    clearConfirmingRef.current = false;
  }, [uiPhase]);

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
      setNotice(storageNoticeForSave(saveResult.status));
      return result;
    },
    [session],
  );

  const handleAnswer = useCallback(
    (value: AssessmentResponseValue) => {
      if (!session || isSubmitting) return;
      setIsSubmitting(true);
      try {
        const currentItemId = getCurrentStageItems(session)[0];
        if (currentItemId) {
          applySessionUpdate(prev => recordAssessmentResponse(prev, currentItemId, value));
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [session, isSubmitting, applySessionUpdate],
  );

  const handleSkip = useCallback(() => {
    if (!session || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const currentItemId = getCurrentStageItems(session)[0];
      if (!currentItemId) return;
      const nextSession = applySessionUpdate(prev => skipAssessmentItem(prev, currentItemId));
      const nextCurrentItem = nextSession ? (nextSession.currentItemIds[0] ?? null) : null;
      if (nextSession && nextCurrentItem !== null && isAssessmentRetryItem(nextSession, nextCurrentItem)) {
        setMessage('Question skipped — one more chance to answer it later');
      } else {
        setMessage('Question skipped');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [session, isSubmitting, applySessionUpdate]);

  const handleResume = useCallback(() => {
    if (!session) return;
    setClearConfirming(false);
    clearConfirmingRef.current = false;
    setUiPhase(uiPhaseForStage(session.stage));
    setMessage('Continuing your assessment');
  }, [session]);

  const handleRestart = useCallback(() => {
    setClearConfirming(false);
    clearConfirmingRef.current = false;
    const clearResult = clearAssessmentSession();
    const mode: AssessmentMode = premium.isPremium ? 'pro' : 'free';
    const freshSession = startAssessmentSession(mode);
    setSession(freshSession);
    setBlockedSession(null);
    setUiPhase('question');
    setMessage('Started a new assessment');
    setNotice(storageNoticeForClear(clearResult.status));
    const saveResult = saveAssessmentSession(freshSession);
    if (saveResult.status !== 'saved') {
      setNotice(storageNoticeForSave(saveResult.status));
    }
  }, [premium.isPremium]);

  const handleNavigateToPattern = useCallback(
    (patternId: string) => {
      navigationIntentRef.current = true;
      onNavigateToPattern(patternId);
    },
    [onNavigateToPattern],
  );

  const handleClose = useCallback(() => {
    onCloseRef.current();
  }, []);

  const handleStartIntro = useCallback(() => {
    if (!session) return;
    if (!consentAcceptedRef.current) {
      setNotice(ASSESSMENT_CONSENT_REQUIRED_NOTICE);
      return;
    }
    setClearConfirming(false);
    clearConfirmingRef.current = false;
    setUiPhase(uiPhaseForStage(session.stage));
    setMessage('Assessment started');
  }, [session]);

  const handleClearAssessmentClick = useCallback(() => {
    if (clearConfirming) return;
    clearOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setClearConfirming(true);
    clearConfirmingRef.current = true;
  }, [clearConfirming]);

  const handleClearCancel = useCallback(() => {
    setClearConfirming(false);
    clearConfirmingRef.current = false;
    const opener = clearOpenerRef.current;
    clearOpenerRef.current = null;
    opener?.focus?.();
    cancelRestoreFocusRef.current = true;
  }, []);

  const handleClearConfirm = useCallback(() => {
    const clearResult = clearAssessmentSession();
    const opener = clearOpenerRef.current;
    clearOpenerRef.current = null;
    setClearConfirming(false);
    clearConfirmingRef.current = false;
    if (clearResult.status === 'remove-failed') {
      setNotice(ASSESSMENT_CLEAR_FAILURE_NOTICE);
      opener?.focus?.();
      cancelRestoreFocusRef.current = true;
      return;
    }
    setNotice(null);
    setConsentAccepted(false);
    consentAcceptedRef.current = false;
    const mode: AssessmentMode = premium.isPremium ? 'pro' : 'free';
    const freshSession = startAssessmentSession(mode);
    setSession(freshSession);
    setBlockedSession(null);
    setUiPhase('intro');
    setMessage('Your assessment is ready to start');
  }, [premium.isPremium]);

  useEffect(() => {
    cancelClearRef.current = handleClearCancel;
  }, [handleClearCancel]);

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
              tabIndex={-1}
              className="relative w-full max-w-2xl mx-4 my-8 bg-[#07090E] border border-indigo-500/20 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(99,102,241,0.12)] outline-none"
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
              {notice && (
                <div role="status" className="px-8 pt-6 -mb-2 text-[11px] font-mono text-amber-400/90">
                  {notice}
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
                {uiPhase === 'intro' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-8 md:p-10 flex flex-col items-center gap-5 text-center"
                  >
                    <h2 id="assessment-dialog-title" tabIndex={-1} className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none outline-none">
                      Somatic Pattern Assessment
                    </h2>
                    <p className="text-sm text-slate-400 max-w-lg mx-auto font-sans font-light leading-7">
                      {ASSESSMENT_PRIVACY_DISCLOSURE}
                    </p>
                    <div className="w-full max-w-lg mx-auto flex flex-col items-start gap-3 text-left">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={consentAccepted}
                          onChange={(e) => setConsentAccepted(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-indigo-500 cursor-pointer"
                        />
                        <span className="text-xs text-slate-400 font-sans font-light leading-6">
                          {ASSESSMENT_CONSENT_LABEL}
                        </span>
                      </label>
                      <button
                        onClick={() => openLegalDoc('privacy')}
                        className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 uppercase tracking-widest underline underline-offset-4 transition-colors cursor-pointer"
                      >
                        {ASSESSMENT_CONSENT_LEGAL_LINK_LABEL}
                      </button>
                    </div>
                    <button
                      onClick={handleStartIntro}
                      disabled={!consentAccepted}
                      className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Start Assessment
                      <ChevronRight className="w-4 h-4" />
                    </button>
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
                    {clearConfirming ? (
                      <ClearAssessmentConfirmation onConfirm={handleClearConfirm} onCancel={handleClearCancel} />
                    ) : (
                      <div className="space-y-5">
                        <p className="text-xs text-slate-500 font-sans font-light leading-6 max-w-md mx-auto">
                          {ASSESSMENT_RESUME_REMINDER}
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
                          <button
                            onClick={handleClearAssessmentClick}
                            data-clear-opener
                            className="px-5 py-2.5 border border-red-500/30 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 text-red-300 font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {ASSESSMENT_CLEAR_LABEL}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                {uiPhase === 'question' && session && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <QuestionStageBody session={session} onAnswer={handleAnswer} onSkip={handleSkip} disabled={isSubmitting} />
                  </motion.div>
                )}
                {uiPhase === 'results' && session && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {clearConfirming ? (
                      <div className="p-8 md:p-10">
                        <ClearAssessmentConfirmation onConfirm={handleClearConfirm} onCancel={handleClearCancel} />
                      </div>
                    ) : (
                      <div>
                        <AssessmentResultsPanel
                          session={session}
                          onNavigateToPattern={handleNavigateToPattern}
                          onRestart={handleRestart}
                          onClose={handleClose}
                        />
                        <div className="px-8 pb-8 -mt-4 flex flex-col items-center gap-3">
                          <p className="text-xs text-slate-500 font-sans font-light leading-6 text-center max-w-md mx-auto">
                            {ASSESSMENT_RESULTS_REMINDER}
                          </p>
                          <button
                            onClick={handleClearAssessmentClick}
                            data-clear-opener
                            className="px-5 py-2.5 border border-red-500/30 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 text-red-300 font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {ASSESSMENT_CLEAR_LABEL}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                {uiPhase === 'blocked' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-8 md:p-10 space-y-6 text-center"
                  >
                    {clearConfirming ? (
                      <ClearAssessmentConfirmation onConfirm={handleClearConfirm} onCancel={handleClearCancel} />
                    ) : (
                      <div className="space-y-6">
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
                          <p className="text-xs text-slate-500 font-sans font-light leading-6 max-w-md mx-auto">
                            {ASSESSMENT_BLOCKED_REMINDER}
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
                          <button
                            onClick={handleClearAssessmentClick}
                            data-clear-opener
                            className="px-5 py-2.5 border border-red-500/30 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 text-red-300 font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {ASSESSMENT_CLEAR_LABEL}
                          </button>
                        </div>
                      </div>)}
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
  disabled: boolean;
}

const QuestionStageBody: React.FC<QuestionStageBodyProps> = ({ session, onAnswer, onSkip, disabled }) => {
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
          disabled={disabled}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
      remaining={progress.remaining}
      disabled={disabled}
      onAnswer={onAnswer}
      onSkip={onSkip}
    />
  );
};

interface ClearAssessmentConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ClearAssessmentConfirmation: React.FC<ClearAssessmentConfirmationProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="flex flex-col items-center gap-4 text-center pt-2">
      <h3 id="assessment-clear-confirm-title" tabIndex={-1} className="text-xl font-black uppercase tracking-tight text-white leading-none outline-none">
        {ASSESSMENT_CLEAR_CONFIRM_TITLE}
      </h3>
      <p className="text-sm text-slate-400 max-w-md mx-auto font-sans font-light leading-7">
        {ASSESSMENT_CLEAR_CONFIRM_BODY}
      </p>
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all cursor-pointer"
        >
          {ASSESSMENT_CLEAR_CANCEL_ACTION}
        </button>
        <button
          onClick={onConfirm}
          className="px-5 py-2.5 bg-red-500/15 border border-red-500/40 hover:bg-red-500/25 text-red-300 font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all cursor-pointer"
        >
          {ASSESSMENT_CLEAR_CONFIRM_ACTION}
        </button>
      </div>
    </div>
  );
};
