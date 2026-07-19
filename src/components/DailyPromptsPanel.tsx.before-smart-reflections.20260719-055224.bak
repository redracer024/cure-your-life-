import React, { useState, useEffect } from 'react';
import { DailyPrompt } from '../types';
import { DAILY_PROMPTS } from '../data/dictionary';
import { Sparkles, Brain, BookOpen, Quote, RefreshCw, Send, CheckCircle, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DailyPromptsPanel() {
  const [currentPrompt, setCurrentPrompt] = useState<DailyPrompt>(DAILY_PROMPTS[0]);
  const [journalText, setJournalText] = useState('');
  const [reflections, setReflections] = useState<{ date: string; promptTitle: string; text: string }[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [brutalFeedback, setBrutalFeedback] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load saved reflections
  useEffect(() => {
    const saved = localStorage.getItem('psychosomatic_reflections');
    if (saved) {
      try {
        setReflections(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    // Set a prompt based on the day of the month
    const day = new Date().getDate();
    const index = day % DAILY_PROMPTS.length;
    setCurrentPrompt(DAILY_PROMPTS[index]);
  }, []);

  const rotatePrompt = () => {
    const currentIndex = DAILY_PROMPTS.findIndex(p => p.id === currentPrompt.id);
    const nextIndex = (currentIndex + 1) % DAILY_PROMPTS.length;
    setCurrentPrompt(DAILY_PROMPTS[nextIndex]);
    setJournalText('');
    setBrutalFeedback('');
    setIsSaved(false);
  };

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalText.trim()) return;

    const newReflection = {
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      promptTitle: currentPrompt.prompt,
      text: journalText
    };

    const updated = [newReflection, ...reflections];
    setReflections(updated);
    localStorage.setItem('psychosomatic_reflections', JSON.stringify(updated));
    setIsSaved(true);

    // Generate fun brutal feedback
    setIsAnalyzing(true);
    setTimeout(() => {
      const responses = [
        "Fascinating. So you recognized the emotional pattern and wrote a lovely paragraph, yet I see no motion towards standing up or closing your laptop. 10/10 for poetic self-pity.",
        "Oh, a breakthrough! You realize you have a boundary problem. Now, will you actually say 'no' to that extra assignment, or will you accept it, complain silently, and let your shoulder muscles calcify into diamonds? We both know the answer.",
        "A highly intellectualized response. You are trying to 'solve' your feelings like a math equation. Your gut is literally pleading for you to stop calculating and just drink some lukewarm water.",
        "Beautifully written. I especially love how you blamed your posture on 'carrying survival burdens' instead of your literal refusal to adjust your monitor height. Truly, a mastermind of evasion.",
        "An exquisite display of awareness coupled with absolute physical paralysis. Identifying the stress is step one, yes, but step two is not scrolling social media for another 45 minutes to 'unwind.' Go do a stretch."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setBrutalFeedback(randomResponse);
      setIsAnalyzing(false);
    }, 1200);
  };

  const clearJournalHistory = () => {
    if (confirm("Are you sure you want to delete your entire reflection history? Your stiff joints won't forget, but this browser will.")) {
      setReflections([]);
      localStorage.removeItem('psychosomatic_reflections');
    }
  };

  return (
    <div className="bg-zinc-950 text-white rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Somatic Reflection of the Day</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
            {currentPrompt.prompt}
          </h2>
        </div>
        <button
          onClick={rotatePrompt}
          className="flex items-center justify-center gap-2 self-start md:self-auto px-4 py-2 border border-white/10 hover:border-white rounded-full text-xs font-mono text-slate-400 hover:text-white transition-colors bg-white/5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Next Prompt</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Prompt details and Journaling */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 bg-white/5 rounded-xl border border-white/10">
            <p className="text-slate-300 leading-relaxed font-sans text-sm">
              {currentPrompt.reflectionQuestion}
            </p>
          </div>

          <div className="bg-rose-950/30 p-4 rounded-xl border border-rose-900/30 flex items-start gap-3">
            <Quote className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-rose-300/90 text-xs italic font-serif leading-relaxed">
              {currentPrompt.sarcasticQuote}
            </p>
          </div>

          <form onSubmit={handleSaveJournal} className="space-y-4">
            <label htmlFor="journal-response" className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
              Your Honest Journal Response (Or lie to make yourself feel better)
            </label>
            <div className="relative">
              <textarea
                id="journal-response"
                rows={4}
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="Type your somatic thoughts here... What emotional truth is hiding under the ache?"
                className="w-full rounded-xl border border-white/10 focus:border-indigo-500 p-4 text-sm leading-relaxed focus:outline-none transition-colors bg-white/5 text-white resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-mono">
                {journalText.length} characters
              </span>
              <button
                type="submit"
                disabled={!journalText.trim() || isAnalyzing}
                className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-200 text-black rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-200 shadow disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit to Doctor</span>
              </button>
            </div>
          </form>

          {/* Brutal Feedback Area */}
          <AnimatePresence mode="wait">
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3"
              >
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-400 border-t-transparent" />
                <span className="text-xs font-mono text-slate-400">Dr. Sarcasticus is inspecting your mental gymnastics...</span>
              </motion.div>
            )}

            {!isAnalyzing && brutalFeedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-5 bg-amber-500 text-black rounded-xl space-y-2 relative"
              >
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-black/70">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Dr. Sarcasticus' Diagnosis</span>
                </div>
                <p className="text-sm text-black leading-relaxed font-sans italic font-bold">
                  "{brutalFeedback}"
                </p>
                <div className="flex items-center gap-1 text-[10px] text-black/50 font-mono mt-1 pt-1.5 border-t border-black/10">
                  <CheckCircle className="w-3 h-3 text-emerald-950" />
                  <span>Journal entry logged in browser cache. Your posture remains atrocious.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Past Reflections History */}
        <div className="lg:col-span-5 flex flex-col h-[400px] lg:h-auto border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-8 pt-6 lg:pt-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Reflection Logs ({reflections.length})</span>
            </h3>
            {reflections.length > 0 && (
              <button
                onClick={clearJournalHistory}
                className="text-[10px] font-mono text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
              >
                <Trash className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {reflections.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/[0.02] border border-dashed border-white/10 rounded-xl">
                <p className="text-xs font-mono text-slate-500 mb-1">Your journal is clean.</p>
                <p className="text-[11px] text-slate-600 max-w-[200px]">Reflect on a prompt above and submit to begin tracking your subconscious somatic blockages.</p>
              </div>
            ) : (
              reflections.map((ref, idx) => (
                <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/40 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.2)] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-sans font-bold text-slate-200 truncate">{ref.promptTitle}</span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">{ref.date}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans break-words">
                    {ref.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
