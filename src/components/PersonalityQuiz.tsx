import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Lock, Sparkles, RotateCcw, BookOpen } from 'lucide-react';
import { usePremium } from '../context/PremiumContext';
import {
  QUIZ_QUESTIONS,
  PATTERNS,
  FREE_QUESTION_COUNT,
  calculateScores,
  getRankedPatterns,
  type PatternKey,
  type PatternScores,
} from '../data/personalityQuiz';
import { PATTERNS_DATA } from '../data/patterns';

interface PersonalityQuizProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPattern?: (patternId: string) => void;
}

type QuizPhase = 'intro' | 'question' | 'paywall' | 'results';

export const PersonalityQuiz: React.FC<PersonalityQuizProps> = ({ isOpen, onClose, onNavigateToPattern }) => {
  const premium = usePremium();
  const [phase, setPhase] = useState<QuizPhase>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<PatternKey[]>([]);
  const [scores, setScores] = useState<PatternScores | null>(null);

  const totalQuestions = QUIZ_QUESTIONS.length;
  const freeQuestions = QUIZ_QUESTIONS.filter(q => q.isFree);

  const handleStart = useCallback(() => {
    setPhase('question');
    setCurrentQ(0);
    setAnswers([]);
  }, []);

  const handleAnswer = useCallback(
    (key: PatternKey) => {
      const newAnswers = [...answers, key];
      setAnswers(newAnswers);

      const nextQ = currentQ + 1;

      if (nextQ >= totalQuestions) {
        const finalScores = calculateScores(newAnswers);
        setScores(finalScores);
        setPhase('results');
        return;
      }

      const nextQuestion = QUIZ_QUESTIONS[nextQ];
      if (!nextQuestion.isFree && !premium.isPremium) {
        setPhase('paywall');
        return;
      }

      setCurrentQ(nextQ);
    },
    [answers, currentQ, totalQuestions, premium.isPremium]
  );

  const handleContinuePaid = useCallback(() => {
    premium.setShowPaywall(true);
  }, [premium]);

  const handleUnlock = useCallback(() => {
    setPhase('question');
    const nextQ = currentQ + 1;
    if (nextQ < totalQuestions) {
      setCurrentQ(nextQ);
    }
  }, [currentQ, totalQuestions]);

  const handleBack = useCallback(() => {
    if (currentQ > 0) {
      const newAnswers = answers.slice(0, -1);
      setAnswers(newAnswers);
      setCurrentQ(currentQ - 1);
    }
  }, [currentQ, answers]);

  const handleRestart = useCallback(() => {
    setPhase('intro');
    setCurrentQ(0);
    setAnswers([]);
    setScores(null);
  }, []);

  const handleClose = useCallback(() => {
    setPhase('intro');
    setCurrentQ(0);
    setAnswers([]);
    setScores(null);
    onClose();
  }, [onClose]);

  const progress = phase === 'question' ? ((currentQ + 1) / totalQuestions) * 100 : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl mx-4 my-8 bg-[#07090E] border border-indigo-500/20 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(99,102,241,0.12)]"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500" />

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              {phase === 'intro' && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-8 md:p-10 space-y-6"
                >
                  <div className="space-y-3 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Somatic Pattern Assessment</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none">
                      Which <span className="text-indigo-400">Pattern</span> Is Your Body Living?
                    </h2>
                    <p className="text-sm text-slate-400 max-w-md mx-auto font-sans font-light leading-7">
                      30 questions. 7 hidden patterns. Your body already knows the answer — this quiz helps you name it.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4 pt-2">
                    <button
                      onClick={handleStart}
                      className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] cursor-pointer flex items-center gap-2"
                    >
                      Begin Assessment
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {FREE_QUESTION_COUNT} free questions · {totalQuestions - FREE_QUESTION_COUNT} with Premium
                    </p>
                  </div>
                </motion.div>
              )}

              {phase === 'question' && (
                <motion.div
                  key={`q-${currentQ}`}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="p-8 md:p-10 space-y-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                        Question {currentQ + 1} / {totalQuestions}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {QUIZ_QUESTIONS[currentQ].isFree ? 'Free' : 'Premium'}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  <h3 className="text-lg md:text-xl font-bold text-white leading-7">
                    {QUIZ_QUESTIONS[currentQ].question}
                  </h3>

                  <div className="space-y-2.5">
                    {QUIZ_QUESTIONS[currentQ].answers.map((answer) => (
                      <button
                        key={answer.key}
                        onClick={() => handleAnswer(answer.key)}
                        className="w-full text-left p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-bold border transition-colors"
                            style={{
                              borderColor: PATTERNS[answer.key].color + '40',
                              color: PATTERNS[answer.key].color,
                            }}
                          >
                            {answer.key}
                          </span>
                          <span className="text-sm text-slate-300 group-hover:text-white transition-colors leading-7 font-sans font-light">
                            {answer.text}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {currentQ > 0 && (
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Previous question
                    </button>
                  )}
                </motion.div>
              )}

              {phase === 'paywall' && (
                <motion.div
                  key="paywall"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-8 md:p-10 space-y-6"
                >
                  <div className="space-y-3 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] font-mono text-amber-400 uppercase tracking-widest font-black">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Premium Questions</span>
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-none">
                      Unlock The <span className="text-amber-400">Full Pattern</span>
                    </h2>
                    <p className="text-sm text-slate-400 max-w-md mx-auto font-sans font-light leading-7">
                      You have completed {FREE_QUESTION_COUNT} free questions. The remaining {totalQuestions - FREE_QUESTION_COUNT} questions reveal the deeper layers of your somatic pattern.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-3 pt-2">
                    {premium.isPremium ? (
                      <button
                        onClick={handleUnlock}
                        className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-black uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer flex items-center gap-2"
                      >
                        Continue Assessment
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleContinuePaid}
                        className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-black uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Unlock Premium
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const freeScores = calculateScores(answers);
                        setScores(freeScores);
                        setPhase('results');
                      }}
                      className="text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      See free results instead
                    </button>
                  </div>
                </motion.div>
              )}

              {phase === 'results' && scores && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-8 md:p-10 space-y-6"
                >
                  {(() => {
                    const ranked = getRankedPatterns(scores);
                    const dominant = ranked[0];
                    const totalAnswered = answers.length;
                    const dominantPatternEntry = PATTERNS_DATA.find(p => p.quizKey === dominant.key);

                    return (
                      <>
                        <div className="space-y-3 text-center">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Your Pattern</span>
                          </div>
                          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none">
                            You Are The{' '}
                            <span style={{ color: dominant.pattern.color }}>
                              {dominant.pattern.name}
                            </span>
                          </h2>
                          <p className="text-sm italic max-w-md mx-auto font-sans" style={{ color: dominant.pattern.color + 'CC' }}>
                            {dominant.pattern.tagline}
                          </p>
                        </div>

                        <div
                          className="p-5 rounded-2xl border space-y-3"
                          style={{
                            borderColor: dominant.pattern.color + '30',
                            background: dominant.pattern.color + '08',
                          }}
                        >
                          <p className="text-sm text-slate-300 leading-7 font-sans font-light">
                            {dominant.pattern.description}
                          </p>
                        </div>

                        {dominantPatternEntry && onNavigateToPattern && (
                          <button
                            onClick={() => onNavigateToPattern(dominantPatternEntry.id)}
                            className="w-full p-4 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between gap-3"
                            style={{
                              borderColor: dominant.pattern.color + '30',
                              background: dominant.pattern.color + '08',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors shrink-0"
                                style={{
                                  background: dominant.pattern.color + '15',
                                  borderColor: dominant.pattern.color + '25',
                                }}
                              >
                                <BookOpen className="w-5 h-5" style={{ color: dominant.pattern.color }} />
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
                                background: dominant.pattern.color + '15',
                                borderColor: dominant.pattern.color + '25',
                              }}
                            >
                              <ChevronRight className="w-3.5 h-3.5" style={{ color: dominant.pattern.color }} />
                            </div>
                          </button>
                        )}

                        <div className="space-y-3">
                          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">
                            All Pattern Scores ({totalAnswered} {totalAnswered === 1 ? 'answer' : 'answers'})
                          </h3>
                          <div className="space-y-2">
                            {ranked.map(({ key, score, pattern }) => {
                              const pct = totalAnswered > 0 ? (score / totalAnswered) * 100 : 0;
                              const isDominant = key === dominant.key;
                              const patternEntry = PATTERNS_DATA.find(p => p.quizKey === key);
                              return (
                                <button
                                  key={key}
                                  onClick={() => patternEntry && onNavigateToPattern?.(patternEntry.id)}
                                  className="w-full flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer text-left"
                                >
                                  <span
                                    className="w-7 text-center text-[11px] font-mono font-bold shrink-0"
                                    style={{ color: pattern.color }}
                                  >
                                    {key}
                                  </span>
                                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full rounded-full"
                                      style={{ background: pattern.color }}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pct}%` }}
                                      transition={{ duration: 0.5, delay: 0.1 }}
                                    />
                                  </div>
                                  <span className="text-[11px] font-mono text-slate-400 w-16 text-right shrink-0">
                                    {score} {score === 1 ? 'pt' : 'pts'}
                                  </span>
                                  <span
                                    className={`text-[11px] font-mono shrink-0 ${isDominant ? 'font-bold' : 'text-slate-500'}`}
                                    style={isDominant ? { color: pattern.color } : undefined}
                                  >
                                    {pattern.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {!premium.isPremium && (
                          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-center space-y-2">
                            <p className="text-[11px] font-mono text-amber-400">
                              These are partial results from {FREE_QUESTION_COUNT} questions.
                            </p>
                            <button
                              onClick={() => premium.setShowPaywall(true)}
                              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-black uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer inline-flex items-center gap-2"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Unlock Full 30-Question Results
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            onClick={handleRestart}
                            className="px-5 py-2.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Retake
                          </button>
                          <button
                            onClick={handleClose}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all cursor-pointer"
                          >
                            Back to Dictionary
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
