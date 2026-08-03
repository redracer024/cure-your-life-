import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronRight, Search } from 'lucide-react';
import { PATTERNS_DATA } from '../../data/patterns';
import type { PatternEntry } from '../../types/patterns';
import { PatternDetailPanel } from './PatternDetailPanel';

interface PatternDictionaryProps {
  onOpenQuiz: () => void;
  highlightPatternId?: string | null;
  onClearHighlight?: () => void;
  onOpenJournal?: (data: { sourcePatternId: string; sourcePatternName: string; prompt: string }) => void;
}

type CategoryFilter = 'all' | 'core' | 'sub';

export const PatternDictionary: React.FC<PatternDictionaryProps> = ({
  onOpenQuiz,
  highlightPatternId,
  onClearHighlight,
  onOpenJournal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedPattern, setSelectedPattern] = useState<PatternEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [restoreSection, setRestoreSection] = useState<string | null>(null);
  const navStackRef = useRef<{ fromPatternId: string; restoreSection: string }[]>([]);

  const filteredPatterns = useMemo(() => {
    let patterns = PATTERNS_DATA;
    if (selectedCategory !== 'all') {
      patterns = patterns.filter(p => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      patterns = patterns.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.coreBelief.toLowerCase().includes(q)
      );
    }
    return patterns;
  }, [selectedCategory, searchQuery]);

  const coreCount = PATTERNS_DATA.filter(p => p.category === 'core').length;
  const subCount = PATTERNS_DATA.filter(p => p.category === 'sub').length;

  // Auto-select highlighted pattern from quiz results
  useEffect(() => {
    if (highlightPatternId) {
      const found = PATTERNS_DATA.find(p => p.id === highlightPatternId);
      if (found) {
        setSelectedPattern(found);
        setSelectedCategory('all');
        setSearchQuery('');
      }
    }
  }, [highlightPatternId]);

  const handleNavigateToPattern = useCallback((patternId: string) => {
    const found = PATTERNS_DATA.find(p => p.id === patternId);
    if (!found) return;

    if (selectedPattern) {
      navStackRef.current.push({ fromPatternId: selectedPattern.id, restoreSection: 'pairings' });
      window.history.pushState(
        { patternNav: true, fromPatternId: selectedPattern.id, restoreSection: 'pairings' },
        ''
      );
    }

    setRestoreSection(null);
    setSelectedPattern(found);
  }, [selectedPattern]);

  const handleCloseDetail = useCallback(() => {
    setSelectedPattern(null);
    onClearHighlight?.();
  }, []);

  // Handle browser back/forward for pattern-to-pattern navigation
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      if (state?.patternNav && state?.fromPatternId) {
        const found = PATTERNS_DATA.find(p => p.id === state.fromPatternId);
        if (found) {
          setSelectedPattern(found);
          setRestoreSection(state.restoreSection || null);
          return;
        }
      }
      // If no managed state, close detail view
      setSelectedPattern(null);
      onClearHighlight?.();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigate back to previous pattern when browser back is pressed
  const handlePatternBack = useCallback(() => {
    if (navStackRef.current.length > 0) {
      const prev = navStackRef.current.pop()!;
      window.history.back();
    } else {
      handleCloseDetail();
    }
  }, [handleCloseDetail]);

  if (selectedPattern) {
    return (
      <PatternDetailPanel
        key={selectedPattern.id}
        pattern={selectedPattern}
        onClose={handlePatternBack}
        onNavigateToPattern={handleNavigateToPattern}
        onOpenJournal={onOpenJournal}
        restoreSection={restoreSection}
      />
    );
  }

  return (
    <main className="flex-1 min-h-0 flex flex-col p-6 md:p-10 overflow-y-auto w-full space-y-8">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-black">
            Somatic Pattern Archive
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
            Pattern<span className="text-indigo-500"> Dictionary</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-xl font-sans font-light leading-7">
            7 core patterns. 19 sub-patterns. Each one a learned survival strategy your body still carries.
          </p>
        </div>

        {/* Quiz CTA */}
        <button
          onClick={onOpenQuiz}
          className="w-full p-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-pink-950/20 hover:from-indigo-900/40 hover:via-purple-900/30 hover:to-pink-900/20 hover:border-indigo-500/40 transition-all cursor-pointer group flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black uppercase tracking-tight text-white group-hover:text-indigo-300 transition-colors font-display">
                Take the Pattern Quiz
              </h3>
              <p className="text-[11px] text-slate-500 font-sans font-light">
                Which hidden pattern is your body living?
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40 transition-all shrink-0">
            <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
          </div>
        </button>

        {/* Category Tabs */}
        <div className="flex items-center gap-2">
          {([
            { key: 'all' as CategoryFilter, label: 'All Patterns', count: PATTERNS_DATA.length },
            { key: 'core' as CategoryFilter, label: 'Core Patterns', count: coreCount },
            { key: 'sub' as CategoryFilter, label: 'Sub-Patterns', count: subCount },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key)}
              className={`px-4 py-2 rounded-xl text-[11px] font-mono font-black uppercase tracking-widest transition-all cursor-pointer ${
                selectedCategory === tab.key
                  ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                  : 'border border-white/5 bg-white/[0.03] text-slate-500 hover:text-slate-300 hover:border-white/10'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search patterns by name, description, or core belief..."
            className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-2xl text-sm text-white placeholder-slate-500 font-sans font-light focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        {/* Pattern List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredPatterns.map((pattern, idx) => (
              <motion.button
                key={pattern.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
                onClick={() => setSelectedPattern(pattern)}
                className="w-full text-left p-5 rounded-2xl border border-white/5 bg-black/40 hover:bg-black/55 hover:border-white/10 transition-all cursor-pointer group relative overflow-hidden"
                style={{
                  boxShadow: `inset 0 0 40px ${pattern.glowColor}`,
                }}
              >
                {/* Color accent glow */}
                <div
                  className="absolute inset-y-0 left-0 w-48 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(to right, ${pattern.color}15, transparent)`,
                  }}
                />

                <div className="flex items-start justify-between gap-4 relative z-10">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: pattern.color }}
                      />
                      <h3
                        className="text-sm font-black uppercase tracking-tight font-display group-hover:translate-x-0.5 transition-transform"
                        style={{ color: pattern.color }}
                      >
                        {pattern.name}
                      </h3>
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        pattern.category === 'core'
                          ? 'bg-white/5 text-slate-400 border border-white/5'
                          : 'bg-white/[0.03] text-slate-500 border border-white/[0.03]'
                      }`}>
                        {pattern.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans font-light leading-6 line-clamp-2">
                      {pattern.shortDescription}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {pattern.emotionalSignature.slice(0, 2).map((sig, i) => (
                        <span
                          key={i}
                          className="text-[9px] font-mono text-slate-500 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.03]"
                        >
                          {sig.length > 50 ? sig.slice(0, 50) + '...' : sig}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-white/5 text-slate-500 group-hover:text-white group-hover:bg-white/10 group-hover:border-white/10 transition-all shrink-0 mt-1">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>

          {filteredPatterns.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <p className="text-sm font-mono text-slate-500">No patterns match your search.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
