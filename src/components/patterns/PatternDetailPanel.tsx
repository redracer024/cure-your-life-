import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronDown, Shield, RotateCcw, BookOpen, Zap, Link2, AlertTriangle, Network, List, RefreshCw, Calendar, MessageCircle, Star, Users, Activity, Sparkles, Map, ArrowUp, ExternalLink, PenLine } from 'lucide-react';
import type { PatternEntry } from '../../types/patterns';
import { PATTERNS_DATA } from '../../data/patterns';
import { PatternMindMap } from './PatternMindMap';
import { PatternLoopFlow } from './PatternLoopFlow';
import { DayInLifeTimeline } from './DayInLifeTimeline';
import { InnerMonologuePanel } from './InnerMonologuePanel';
import { StrengthsPanel } from './StrengthsPanel';
import { RelationshipLensTabs } from './RelationshipLensTabs';
import { WisdomPerspectiveTabs } from './WisdomPerspectiveTabs';
import { RecoveryRoadmap } from './RecoveryRoadmap';
import { PatternVisualGallery } from './PatternVisualGallery';
import { PatternAudioPlayer } from './PatternAudioPlayer';
import { usePremium } from '../../context/PremiumContext';

interface PatternDetailPanelProps {
  pattern: PatternEntry;
  onClose: () => void;
  onNavigateToPattern?: (patternId: string) => void;
  onOpenJournal?: (data: { sourcePatternId: string; sourcePatternName: string; prompt: string }) => void;
  restoreSection?: string | null;
}

type Section = 'overview' | 'profiles' | 'lifeExperience' | 'origins' | 'relationships' | 'bodyNS' | 'perspectives' | 'visuals' | 'recovery' | 'journal' | 'pairings';
type ViewMode = 'sections' | 'mindmap';

const SECTIONS: { key: Section; label: string; icon: React.ReactNode; extendedOnly?: boolean }[] = [
  { key: 'overview', label: 'Overview', icon: <Zap className="w-3.5 h-3.5" /> },
  { key: 'profiles', label: 'Tone Profiles', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { key: 'lifeExperience', label: 'Life & Inner Experience', icon: <Calendar className="w-3.5 h-3.5" />, extendedOnly: true },
  { key: 'origins', label: 'Origins', icon: <ChevronDown className="w-3.5 h-3.5" /> },
  { key: 'relationships', label: 'Relationships', icon: <Users className="w-3.5 h-3.5" />, extendedOnly: true },
  { key: 'bodyNS', label: 'Body & Nervous System', icon: <Activity className="w-3.5 h-3.5" /> },
  { key: 'perspectives', label: 'Perspectives', icon: <Sparkles className="w-3.5 h-3.5" />, extendedOnly: true },
  { key: 'visuals', label: 'Visual Insights', icon: <span className="text-[14px]">&#9635;</span> },
  { key: 'recovery', label: 'Recovery Roadmap', icon: <Map className="w-3.5 h-3.5" /> },
  { key: 'journal', label: 'Journal Prompts', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { key: 'pairings', label: 'Pattern Pairings', icon: <Link2 className="w-3.5 h-3.5" /> },
];

const hasExtendedFields = (p: PatternEntry): boolean =>
  !!((p.patternLoop || p.dayInTheLife || p.innerMonologue || p.patternVoice) || p.relationshipLenses || p.strengths || p.whatItIsNot || p.wisdomPerspectives || p.nervousSystemProfile);

export const PatternDetailPanel: React.FC<PatternDetailPanelProps> = ({ pattern, onClose, onNavigateToPattern, onOpenJournal, restoreSection }) => {
  const [openSectionKey, setOpenSectionKey] = useState<string | null>(restoreSection ?? 'overview');
  const [viewMode, setViewMode] = useState<ViewMode>('sections');
  const [showSectionNav, setShowSectionNav] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topLevelSectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const topLevelHeaderRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pendingSectionScrollRef = useRef<Section | null>(null);
  const restored = useRef(false);
  const isExtended = hasExtendedFields(pattern);
  const premium = usePremium();

  const activeSections = SECTIONS.filter(s => {
    if (s.extendedOnly && !isExtended) return false;
    if (s.key === 'visuals' && !pattern.visualAssets?.length) return false;
    return true;
  });

  useLayoutEffect(() => {
    if (restoreSection && !restored.current) {
      restored.current = true;

      const container = scrollRef.current;
      const target =
        topLevelHeaderRefs.current[restoreSection] ??
        topLevelSectionRefs.current[restoreSection];
      if (!container || !target) return;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const topOffset = 8;

      container.scrollTop += targetRect.top - containerRect.top - topOffset;
    }
  }, [restoreSection]);

  // Ensure new pattern scrolls to top on forward navigation
  useEffect(() => {
    if (!restoreSection) {
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) {
          el.scrollTo({ top: 0, behavior: 'auto' });
        }
      });
    }
  }, [restoreSection]);

const openAndScrollToSection = (sectionKey: Section) => {
  if (openSectionKey === sectionKey) {
    pendingSectionScrollRef.current = null;
    setOpenSectionKey(null);
    return;
  }

  pendingSectionScrollRef.current = sectionKey;
  setOpenSectionKey(sectionKey);
};

  const collapseAll = () => {
    setOpenSectionKey(null);
  };

  useLayoutEffect(() => {
    const sectionKey = pendingSectionScrollRef.current;
    if (!sectionKey || openSectionKey !== sectionKey) return;

    const container = scrollRef.current;
    const target =
      topLevelHeaderRefs.current[sectionKey] ??
      topLevelSectionRefs.current[sectionKey];
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const topOffset = 8;
    const delta = targetRect.top - containerRect.top - topOffset;

    container.scrollTop += delta;
    pendingSectionScrollRef.current = null;
  }, [openSectionKey]);

  const scrollToSection = (key: Section) => {
    setShowSectionNav(false);
    openAndScrollToSection(key);
  };

  return (
    <main ref={scrollRef} className="flex-1 min-h-0 flex flex-col p-6 md:p-10 overflow-y-auto w-full [overflow-anchor:none]">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to all patterns
        </button>

        {/* Pattern Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 md:p-8 rounded-3xl border relative overflow-hidden"
          style={{
            borderColor: pattern.color + '30',
            background: `linear-gradient(135deg, ${pattern.color}08, transparent)`,
            boxShadow: `0 0 60px ${pattern.glowColor}`,
          }}
        >
          <div
            className="absolute inset-y-0 left-0 w-64 pointer-events-none opacity-20"
            style={{
              background: `linear-gradient(to right, ${pattern.color}, transparent)`,
            }}
          />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: pattern.color }}
              />
              <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                pattern.category === 'core'
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'bg-white/5 text-slate-300 border border-white/5'
              }`}>
                {pattern.category} pattern
              </span>
            </div>
            <h1
              className="text-3xl md:text-5xl font-black uppercase tracking-tighter"
              style={{ color: pattern.color }}
            >
              {pattern.name}
            </h1>
            <p className="text-sm text-slate-300 font-sans font-light leading-7 max-w-2xl">
              {pattern.shortDescription}
            </p>
        </div>
      </motion.div>

      {/* Audio Player - only show if audioOverviews exists */}
      {pattern.audioOverviews && (
        <PatternAudioPlayer
          audioOverviews={pattern.audioOverviews}
          patternName={pattern.name}
          color={pattern.color}
        />
      )}

      {/* Expand/Collapse controls + View Mode Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-300 border border-white/5 rounded-lg hover:border-white/10 transition-all cursor-pointer"
            >
              Collapse All
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-xl">
            <button
              onClick={() => setViewMode('sections')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                viewMode === 'sections'
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <List className="w-3 h-3" />
              Sections
            </button>
            <button
              onClick={() => setViewMode('mindmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                viewMode === 'mindmap'
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <Network className="w-3 h-3" />
              Mind Map
            </button>
          </div>
        </div>

        {/* Content View */}
        <AnimatePresence mode="wait">
          {viewMode === 'sections' ? (
            <motion.div
              key="sections"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {activeSections.map(section => (
                <PatternSection
                  key={section.key}
                  section={section}
                  pattern={pattern}
                  isExpanded={openSectionKey === section.key}
                  onToggle={() => openAndScrollToSection(section.key)}
                  onNavigateToPattern={onNavigateToPattern}
                  onOpenJournal={onOpenJournal}
                  scrollRef={scrollRef}
                  sectionRef={el => { topLevelSectionRefs.current[section.key] = el; }}
                  headerRef={el => { topLevelHeaderRefs.current[section.key] = el; }}
                />
              ))}
              {/* Always-visible Safety Note */}
              {pattern.safetyGuardrail && <SafetyNoteSection safetyGuardrail={pattern.safetyGuardrail} />}
            </motion.div>
          ) : (
            <motion.div
              key="mindmap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PatternMindMap pattern={pattern} />
              {pattern.safetyGuardrail && <div className="mt-6"><SafetyNoteSection safetyGuardrail={pattern.safetyGuardrail} /></div>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky section navigation */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {showSectionNav && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="mb-2 p-2 rounded-xl border border-white/10 bg-black/90 backdrop-blur-sm shadow-2xl max-h-64 overflow-y-auto"
              style={{ scrollbarWidth: 'thin' }}
            >
              {activeSections.map(s => (
                <button
                  key={s.key}
                  onClick={() => scrollToSection(s.key)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <span style={{ color: pattern.color }}>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setShowSectionNav(prev => !prev)}
          className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-black/80 backdrop-blur-sm shadow-lg hover:bg-white/10 transition-colors cursor-pointer"
          style={{ color: pattern.color }}
          aria-label="Navigate to section"
        >
          {showSectionNav ? <ChevronDown className="w-4 h-4 rotate-180" /> : <ArrowUp className="w-4 h-4" />}
        </button>
      </div>
    </main>
  );
};

const PatternSection: React.FC<{
  section: { key: Section; label: string; icon: React.ReactNode; extendedOnly?: boolean };
  pattern: PatternEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigateToPattern?: (patternId: string) => void;
  onOpenJournal?: (data: { sourcePatternId: string; sourcePatternName: string; prompt: string }) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  sectionRef?: (el: HTMLDivElement | null) => void;
  headerRef?: (el: HTMLButtonElement | null) => void;
}> = ({ section, pattern, isExpanded, onToggle, onNavigateToPattern, onOpenJournal, scrollRef, sectionRef, headerRef }) => {
  return (
    <motion.div
      id={`section-${section.key}`}
      ref={sectionRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-white/5 bg-black/40 overflow-hidden scroll-mt-4"
    >
      <button
        id={`section-btn-${section.key}`}
        ref={headerRef}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`section-content-${section.key}`}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: pattern.color + '15',
              color: pattern.color,
            }}
          >
            {section.icon}
          </div>
          <span className="text-sm font-black uppercase tracking-tight text-white font-display">
            {section.label}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </motion.div>
      </button>

      {isExpanded && (
        <div
          id={`section-content-${section.key}`}
          role="region"
          aria-labelledby={`section-btn-${section.key}`}
          className="overflow-hidden"
        >
          <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
            {section.key === 'overview' && <OverviewContent pattern={pattern} />}
            {section.key === 'profiles' && <ProfilesContent pattern={pattern} />}
            {section.key === 'lifeExperience' && <LifeExperienceContent pattern={pattern} color={pattern.color} />}
            {section.key === 'origins' && <OriginsContent pattern={pattern} scrollRef={scrollRef} />}
            {section.key === 'relationships' && <RelationshipsContent pattern={pattern} color={pattern.color} />}
            {section.key === 'bodyNS' && <BodyAndNSContent pattern={pattern} color={pattern.color} />}
            {section.key === 'perspectives' && pattern.wisdomPerspectives && (
              <WisdomPerspectiveTabs perspectives={pattern.wisdomPerspectives} color={pattern.color} />
            )}
            {section.key === 'visuals' && pattern.visualAssets && (
              <PatternVisualGallery assets={pattern.visualAssets} color={pattern.color} />
            )}
            {section.key === 'recovery' && <RecoveryContent pattern={pattern} color={pattern.color} />}
            {section.key === 'journal' && <JournalContent pattern={pattern} onOpenJournal={onOpenJournal} />}
            {section.key === 'pairings' && <PairingsContent pattern={pattern} onNavigateToPattern={onNavigateToPattern} />}
          </div>
          </div>
        )}
      </motion.div>
  );
};

const OverviewContent: React.FC<{ pattern: PatternEntry }> = ({ pattern }) => (
  <div className="space-y-5">
    <div className="space-y-2">
      <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">Core Belief</h4>
      <p className="text-sm text-slate-300 font-sans font-light leading-7 italic" style={{ color: pattern.color + 'DD' }}>
        {pattern.coreBelief}
      </p>
    </div>
    <div className="space-y-2">
      <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">Protective Strategy</h4>
      <p className="text-sm text-slate-300 font-sans font-light leading-7">
        {pattern.protectiveStrategy}
      </p>
    </div>
    <div className="space-y-2">
      <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">Emotional Signature</h4>
      <div className="flex flex-wrap gap-2">
        {pattern.emotionalSignature.map((sig, i) => (
          <span
            key={i}
            className="text-[10px] font-mono px-2.5 py-1 rounded-lg border"
            style={{
              borderColor: pattern.color + '20',
              background: pattern.color + '08',
              color: pattern.color,
            }}
          >
            {sig}
          </span>
        ))}
      </div>
    </div>
    <div className="space-y-2">
      <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">Relationship Pattern</h4>
      <p className="text-sm text-slate-300 font-sans font-light leading-7">
        {pattern.relationshipPattern}
      </p>
    </div>
    <div className="space-y-2">
      <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">How It Protects You</h4>
      <p className="text-sm text-slate-300 font-sans font-light leading-7">
        {pattern.howItProtectsYou}
      </p>
    </div>
    <div className="space-y-2">
      <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">How It Hurts You Now</h4>
      <p className="text-sm text-slate-300 font-sans font-light leading-7">
        {pattern.howItHurtsYouNow}
      </p>
    </div>
  </div>
);

const ProfilesContent: React.FC<{ pattern: PatternEntry }> = ({ pattern }) => {
  const [activeTone, setActiveTone] = useState<'serious' | 'witty' | 'brutal'>('witty');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(['serious', 'witty', 'brutal'] as const).map(tone => (
          <button
            key={tone}
            onClick={() => setActiveTone(tone)}
            className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
              activeTone === tone
                ? 'bg-white/10 text-white border border-white/10'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {tone}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTone === 'serious' && (
          <motion.div
            key="serious"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3"
          >
            {pattern.seriousProfile.map((para, i) => (
              <p key={i} className="text-sm text-slate-300 font-sans font-light leading-7">
                {para}
              </p>
            ))}
          </motion.div>
        )}

        {activeTone === 'witty' && (
          <motion.div
            key="witty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-4"
          >
            {pattern.wittyProfile.mainMetaphor && (
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Metaphor</span>
                <p className="text-lg font-black text-white font-display mt-1" style={{ color: pattern.color }}>
                  {pattern.wittyProfile.mainMetaphor}
                </p>
              </div>
            )}
            {pattern.wittyProfile.narrativeAnalogy && (
              <p className="text-sm text-slate-400 font-sans font-light leading-7 italic">
                {pattern.wittyProfile.narrativeAnalogy}
              </p>
            )}
            {pattern.wittyProfile.paragraphs.map((para, i) => (
              <p key={i} className="text-sm text-slate-300 font-sans font-light leading-7">
                {para}
              </p>
            ))}
          </motion.div>
        )}

        {activeTone === 'brutal' && (
          <motion.div
            key="brutal"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3"
          >
            {pattern.brutalProfile.map((para, i) => (
              <p key={i} className="text-sm text-slate-300 font-sans font-light leading-7">
                {para}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const OriginsContent: React.FC<{ pattern: PatternEntry; scrollRef: React.RefObject<HTMLDivElement> }> = ({ pattern, scrollRef }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const originSubpatternHeaderRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pendingSubpatternScrollRef = useRef<string | null>(null);

  const toggleOriginSubpattern = (subpatternId: string) => {
    if (openId === subpatternId) {
      pendingSubpatternScrollRef.current = null;
      setOpenId(null);
      return;
    }

    pendingSubpatternScrollRef.current = subpatternId;
    setOpenId(subpatternId);
  };

  useLayoutEffect(() => {
    const subpatternId = pendingSubpatternScrollRef.current;
    if (!subpatternId || openId !== subpatternId) return;

    const container = scrollRef.current;
    const target = originSubpatternHeaderRefs.current[subpatternId];
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const topOffset = 8;
    const delta = targetRect.top - containerRect.top - topOffset;

    container.scrollTop += delta;
    pendingSubpatternScrollRef.current = null;
  }, [openId, scrollRef]);

  useEffect(() => {
    setOpenId(null);
  }, [pattern.id]);

  const resolvePatternName = (relatedId: string): string => {
    const found = PATTERNS_DATA.find(p => p.id === relatedId);
    return found?.name ?? relatedId;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">Where This Pattern May Begin</h4>
        </div>

        <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
          <p className="text-[10px] text-slate-500 font-sans font-light leading-5 italic">
            These are possible contexts, not conclusions about your history.
            Similar patterns can develop for different reasons, and some may reflect
            present-day roles or circumstances rather than early experiences.
          </p>
        </div>

        <div className="space-y-2">
          {pattern.whereItOftenStarts.map((origin, i) => (
            <div
              key={i}
              className="p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-start gap-3">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                  style={{ background: pattern.color }}
                />
                <p className="text-sm text-slate-300 font-sans font-light leading-7">
                  {origin}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {pattern.subPatterns.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">Sub-Patterns</h4>
          <div className="space-y-2">
            {pattern.subPatterns.map((sub, i) => {
              const subId = sub.id ?? `sub-${i}`;
              const isOpen = openId === subId;
              const hasDetails = !!(sub.coreMechanism || sub.commonSigns || sub.commonTriggers || sub.protectivePurpose || sub.currentCost || sub.whatItIsNot || sub.reflectionPrompts || sub.relatedPatternIds || sub.safetyNote);
              const isLegacy = !sub.summary && !!sub.description && !hasDetails;

              return (
                <div
                  key={subId}
                  id={`origin-subpattern-${subId}`}
                  className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
                >
                  <button
                    id={`origin-sub-btn-${subId}`}
                    ref={el => { originSubpatternHeaderRefs.current[subId] = el; }}
                    onClick={() => toggleOriginSubpattern(subId)}
                    aria-expanded={isOpen}
                    aria-controls={`origin-sub-content-${subId}`}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/[0.03] transition-colors cursor-pointer text-left"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-black text-white font-display block">{sub.name}</span>
                      <p className="text-[11px] text-slate-400 font-sans font-light mt-0.5">
                        {sub.summary ?? sub.description}
                      </p>
                    </div>
                    {hasDetails && !isLegacy && (
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0 ml-2"
                      >
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      </motion.div>
                    )}
                  </button>

                   {isOpen && !isLegacy && hasDetails && (
                     <div
                       id={`origin-sub-content-${subId}`}
                       role="region"
                       aria-labelledby={`origin-sub-btn-${subId}`}
                       className="overflow-hidden"
                     >
                       <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3">
                          {sub.coreMechanism && (
                            <div>
                              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-black">What drives it</span>
                              <p className="text-[11px] text-slate-400 font-sans font-light leading-5 mt-0.5">{sub.coreMechanism}</p>
                            </div>
                          )}
                          {sub.commonSigns && sub.commonSigns.length > 0 && (
                            <div>
                              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-black">Common signs</span>
                              <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                                {sub.commonSigns.map((s, j) => (
                                  <li key={j} className="text-[11px] text-slate-400 font-sans font-light leading-5">{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {sub.commonTriggers && sub.commonTriggers.length > 0 && (
                            <div>
                              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-black">Common triggers</span>
                              <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                                {sub.commonTriggers.map((s, j) => (
                                  <li key={j} className="text-[11px] text-slate-400 font-sans font-light leading-5">{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {sub.protectivePurpose && (
                            <div>
                              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-black">How it protects</span>
                              <p className="text-[11px] text-slate-400 font-sans font-light leading-5 mt-0.5">{sub.protectivePurpose}</p>
                            </div>
                          )}
                          {sub.currentCost && (
                            <div>
                              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-black">What it costs</span>
                              <p className="text-[11px] text-slate-400 font-sans font-light leading-5 mt-0.5">{sub.currentCost}</p>
                            </div>
                          )}
                          {sub.whatItIsNot && sub.whatItIsNot.length > 0 && (
                            <div>
                              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-black">What it is not</span>
                              <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                                {sub.whatItIsNot.map((s, j) => (
                                  <li key={j} className="text-[11px] text-slate-400 font-sans font-light leading-5">{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {sub.reflectionPrompts && sub.reflectionPrompts.length > 0 && (
                            <div>
                              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-black">Questions to consider</span>
                              <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                                {sub.reflectionPrompts.map((s, j) => (
                                  <li key={j} className="text-[11px] text-slate-400 font-sans font-light leading-5 italic">{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {sub.relatedPatternIds && sub.relatedPatternIds.length > 0 && (
                            <div>
                              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-black">Related patterns</span>
                              <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                                {sub.relatedPatternIds.map((s, j) => (
                                  <li key={j} className="text-[11px] text-slate-400 font-sans font-light leading-5">{resolvePatternName(s)}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {sub.safetyNote && (
                            <div className="p-3 rounded-lg border border-amber-500/15 bg-amber-500/5">
                              <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-black">Safety note</span>
                              <p className="text-[11px] text-amber-200/70 font-sans font-light leading-5 mt-0.5">{sub.safetyNote}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

type LifeTabId = 'day-in-life' | 'inside-head' | 'pattern-loop';

const LifeExperienceContent: React.FC<{ pattern: PatternEntry; color: string }> = ({ pattern, color }) => {
  const hasDay = !!pattern.dayInTheLife;
  const hasInner = !!(pattern.innerMonologue && pattern.patternVoice);
  const hasLoop = !!pattern.patternLoop;

  const visibleTabs = useMemo(() => {
    const tabs: { id: LifeTabId; label: string }[] = [];
    if (hasDay) tabs.push({ id: 'day-in-life', label: 'A Day in the Life' });
    if (hasInner) tabs.push({ id: 'inside-head', label: 'Inside Their Head' });
    if (hasLoop) tabs.push({ id: 'pattern-loop', label: 'Pattern Loop' });
    return tabs;
  }, [hasDay, hasInner, hasLoop]);

  const [tab, setTab] = useState<LifeTabId>(() => visibleTabs[0]?.id ?? 'day-in-life');

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(t => t.id === tab)) {
      setTab(visibleTabs[0].id);
    }
  }, [visibleTabs, tab]);

  if (visibleTabs.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5" role="tablist" aria-label="Life and inner experience views">
        {visibleTabs.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`life-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
              tab === t.id
                ? 'text-white border'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            style={tab === t.id ? { background: color + '15', borderColor: color + '30', color } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'day-in-life' && hasDay && (
          <motion.div
            key="day-in-life"
            role="tabpanel"
            id="life-tab-day-in-life"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <DayInLifeTimeline entries={pattern.dayInTheLife!} color={color} />
          </motion.div>
        )}
        {tab === 'inside-head' && hasInner && (
          <motion.div
            key="inside-head"
            role="tabpanel"
            id="life-tab-inside-head"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <InnerMonologuePanel innerMonologue={pattern.innerMonologue!} patternVoice={pattern.patternVoice!} color={color} />
          </motion.div>
        )}
        {tab === 'pattern-loop' && hasLoop && (
          <motion.div
            key="pattern-loop"
            role="tabpanel"
            id="life-tab-pattern-loop"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <PatternLoopFlow stages={pattern.patternLoop!} color={color} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RelationshipsContent: React.FC<{ pattern: PatternEntry; color: string }> = ({ pattern, color }) => {
  const [tab, setTab] = useState<'relationships' | 'strengths'>('relationships');

  const hasRelationships = !!pattern.relationshipLenses;
  const hasStrengths = !!(pattern.strengths && pattern.strengths.length > 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5" role="tablist" aria-label="Relationships and strengths views">
        {hasRelationships && (
          <button
            role="tab"
            aria-selected={tab === 'relationships'}
            aria-controls="rel-tab-relationships"
            onClick={() => setTab('relationships')}
            className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
              tab === 'relationships'
                ? 'text-white border'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            style={tab === 'relationships' ? { background: color + '15', borderColor: color + '30', color } : undefined}
          >
            Relationship Patterns
          </button>
        )}
        {hasStrengths && (
          <button
            role="tab"
            aria-selected={tab === 'strengths'}
            aria-controls="rel-tab-strengths"
            onClick={() => setTab('strengths')}
            className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
              tab === 'strengths'
                ? 'text-white border'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            style={tab === 'strengths' ? { background: color + '15', borderColor: color + '30', color } : undefined}
          >
            Strengths
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'relationships' && hasRelationships && (
          <motion.div
            key="relationships"
            role="tabpanel"
            id="rel-tab-relationships"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <RelationshipLensTabs lenses={pattern.relationshipLenses!} color={color} />
          </motion.div>
        )}
        {tab === 'strengths' && hasStrengths && (
          <motion.div
            key="strengths"
            role="tabpanel"
            id="rel-tab-strengths"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <StrengthsPanel strengths={pattern.strengths!} whatItIsNot={pattern.whatItIsNot} color={color} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RecoveryContent: React.FC<{ pattern: PatternEntry; color: string }> = ({ pattern, color }) => {
  const [tab, setTab] = useState<'roadmap' | 'reset' | 'boundaries'>('roadmap');

  const hasRoadmap = !!pattern.recoveryRoadmap;
  const hasReset = pattern.resetProtocol.steps.length > 0;
  const hasBoundaries = pattern.boundaryPractice.items.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5" role="tablist" aria-label="Recovery views">
        {hasRoadmap && (
          <button
            role="tab"
            aria-selected={tab === 'roadmap'}
            aria-controls="rec-tab-roadmap"
            onClick={() => setTab('roadmap')}
            className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
              tab === 'roadmap'
                ? 'text-white border'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            style={tab === 'roadmap' ? { background: color + '15', borderColor: color + '30', color } : undefined}
          >
            Roadmap
          </button>
        )}
        {hasReset && (
          <button
            role="tab"
            aria-selected={tab === 'reset'}
            aria-controls="rec-tab-reset"
            onClick={() => setTab('reset')}
            className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
              tab === 'reset'
                ? 'text-white border'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            style={tab === 'reset' ? { background: color + '15', borderColor: color + '30', color } : undefined}
          >
            Reset Protocol
          </button>
        )}
        {hasBoundaries && (
          <button
            role="tab"
            aria-selected={tab === 'boundaries'}
            aria-controls="rec-tab-boundaries"
            onClick={() => setTab('boundaries')}
            className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
              tab === 'boundaries'
                ? 'text-white border'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            style={tab === 'boundaries' ? { background: color + '15', borderColor: color + '30', color } : undefined}
          >
            Boundaries
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'roadmap' && hasRoadmap && (
          <motion.div
            key="roadmap"
            role="tabpanel"
            id="rec-tab-roadmap"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <RecoveryRoadmap stages={pattern.recoveryRoadmap!} color={color} />
          </motion.div>
        )}
        {tab === 'reset' && hasReset && (
          <motion.div
            key="reset"
            role="tabpanel"
            id="rec-tab-reset"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <ResetContent pattern={pattern} />
          </motion.div>
        )}
        {tab === 'boundaries' && hasBoundaries && (
          <motion.div
            key="boundaries"
            role="tabpanel"
            id="rec-tab-boundaries"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <BoundariesContent pattern={pattern} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BodyAndNSContent: React.FC<{ pattern: PatternEntry; color: string }> = ({ pattern, color }) => {
  const profile = pattern.nervousSystemProfile;
  const [tab, setTab] = useState<string>(profile ? 'default-response' : 'stress-body');

  const nsTabs = profile ? [
    { key: 'default-response', label: 'Default Response' },
    { key: 'threat-scan', label: 'Threat Scan' },
    { key: 'activation-signs', label: 'Activation Signs' },
    { key: 'shutdown-signs', label: 'Shutdown Signs' },
    { key: 'body-holding-patterns', label: 'Body Holding Patterns' },
    { key: 'regulation-needs', label: 'Regulation Needs' },
  ] : [];

  const bodyTabs = [
    { key: 'stress-body', label: 'Stress & Body' },
    { key: 'symbolic-map', label: 'Symbolic Map' },
  ];

  const allTabs = [...nsTabs, ...bodyTabs];

  // Use explicit fields if present, else parse from bodyThemes
  const stressItems = pattern.stressAndBody ?? pattern.commonLinkedSymptoms;
  const symbolicEntries = pattern.symbolicBodyMap ?? pattern.bodyThemes
    .split(/\.\s*/)
    .filter(Boolean)
    .map(entry => {
      const colonIdx = entry.indexOf(':');
      if (colonIdx > 0) {
        return { area: entry.slice(0, colonIdx).trim(), meaning: entry.slice(colonIdx + 1).trim() };
      }
      return { area: '', meaning: entry.trim() };
    })
    .filter(e => e.area);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Body and nervous system views">
        {allTabs.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            aria-controls={`body-tab-${t.key}`}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
              tab === t.key
                ? 'text-white border'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            style={tab === t.key ? { background: color + '15', borderColor: color + '30', color } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'default-response' && profile && (
          <motion.div key="default-response" role="tabpanel" id="body-tab-default-response"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-xl border bg-black/30 space-y-2" style={{ borderColor: color + '15' }}
          >
            <p className="text-[11px] text-slate-300 font-sans font-light leading-5">{profile.defaultResponse}</p>
          </motion.div>
        )}
        {tab === 'threat-scan' && profile && (
          <motion.div key="threat-scan" role="tabpanel" id="body-tab-threat-scan"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-xl border bg-black/30 space-y-2" style={{ borderColor: color + '15' }}
          >
            <p className="text-[11px] text-slate-300 font-sans font-light leading-5">{profile.threatScan}</p>
          </motion.div>
        )}
        {tab === 'activation-signs' && profile && (
          <motion.div key="activation-signs" role="tabpanel" id="body-tab-activation-signs"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-xl border bg-black/30 space-y-2" style={{ borderColor: color + '15' }}
          >
            <ul className="space-y-1.5">
              {profile.activationSigns.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                  <span className="text-[11px] text-slate-300 font-sans font-light leading-5">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
        {tab === 'shutdown-signs' && profile && (
          <motion.div key="shutdown-signs" role="tabpanel" id="body-tab-shutdown-signs"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-xl border bg-black/30 space-y-2" style={{ borderColor: color + '15' }}
          >
            <ul className="space-y-1.5">
              {profile.shutdownSigns.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                  <span className="text-[11px] text-slate-300 font-sans font-light leading-5">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
        {tab === 'body-holding-patterns' && profile && (
          <motion.div key="body-holding-patterns" role="tabpanel" id="body-tab-body-holding-patterns"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-xl border bg-black/30 space-y-2" style={{ borderColor: color + '15' }}
          >
            <ul className="space-y-1.5">
              {profile.bodyHoldingPatterns.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                  <span className="text-[11px] text-slate-300 font-sans font-light leading-5">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
        {tab === 'regulation-needs' && profile && (
          <motion.div key="regulation-needs" role="tabpanel" id="body-tab-regulation-needs"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-xl border bg-black/30 space-y-2" style={{ borderColor: color + '15' }}
          >
            <ul className="space-y-1.5">
              {profile.regulationNeeds.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                  <span className="text-[11px] text-slate-300 font-sans font-light leading-5">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
        {tab === 'stress-body' && (
          <motion.div key="stress-body" role="tabpanel" id="body-tab-stress-body"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="space-y-4"
          >
            {stressItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">Commonly Reported Experiences</h4>
                <div className="flex flex-wrap gap-2">
                  {stressItems.map((symptom, i) => (
                    <span key={i} className="text-[10px] font-mono px-2.5 py-1 rounded-lg border border-white/5 bg-white/[0.03] text-slate-400">{symptom}</span>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[9px] font-mono text-slate-600 italic">These are commonly reported experiences, not medical diagnoses. Persistent symptoms should be medically evaluated.</p>
          </motion.div>
        )}
        {tab === 'symbolic-map' && (
          <motion.div key="symbolic-map" role="tabpanel" id="body-tab-symbolic-map"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="space-y-3"
          >
            {symbolicEntries.length > 0 ? (
              <div className="space-y-2">
                {symbolicEntries.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border bg-black/30" style={{ borderColor: color + '15' }}>
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest shrink-0 w-24" style={{ color }}>{entry.area}</span>
                    <p className="text-[11px] text-slate-400 font-sans font-light leading-5">{entry.meaning}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 font-sans font-light italic">No symbolic body data available for this pattern yet.</p>
            )}
            <p className="text-[9px] font-mono text-slate-600 italic">Symbolic meanings are reflective perspectives, not medical explanations.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {tab === 'stress-body' || tab === 'symbolic-map' ? null : (
        <p className="text-[9px] font-mono text-slate-600 italic">Common experiences, not a diagnosis.</p>
      )}
    </div>
  );
};

const ResetContent: React.FC<{ pattern: PatternEntry }> = ({ pattern }) => (
  <div className="space-y-3">
    {pattern.resetProtocol.title && (
      <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">
        {pattern.resetProtocol.title}
      </h4>
    )}
    <div className="space-y-2">
      {pattern.resetProtocol.steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <span
            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold"
            style={{
              background: pattern.color + '15',
              color: pattern.color,
              border: `1px solid ${pattern.color}30`,
            }}
          >
            {i + 1}
          </span>
          <p className="text-sm text-slate-300 font-sans font-light leading-7">
            {step}
          </p>
        </div>
      ))}
    </div>
  </div>
);

const BoundariesContent: React.FC<{ pattern: PatternEntry }> = ({ pattern }) => (
  <div className="space-y-3">
    {pattern.boundaryPractice.title && (
      <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">
        {pattern.boundaryPractice.title}
      </h4>
    )}
    <div className="space-y-2">
      {pattern.boundaryPractice.items.map((item, i) => (
        <div
          key={i}
          className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-3"
        >
          <Shield className="w-4 h-4 mt-0.5 shrink-0" style={{ color: pattern.color }} />
          <p className="text-sm text-slate-300 font-sans font-light leading-7">
            {item}
          </p>
        </div>
      ))}
    </div>
  </div>
);

const JournalContent: React.FC<{ pattern: PatternEntry; onOpenJournal?: (data: { sourcePatternId: string; sourcePatternName: string; prompt: string }) => void }> = ({ pattern, onOpenJournal }) => (
  <div className="space-y-3">
    <div className="space-y-2">
      {pattern.journalPrompts.map((prompt, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-2"
        >
          <p className="text-sm text-slate-300 font-sans font-light leading-7 italic">
            &ldquo;{prompt}&rdquo;
          </p>
          {onOpenJournal && (
            <button
              onClick={() => onOpenJournal({
                sourcePatternId: pattern.id,
                sourcePatternName: pattern.name,
                prompt,
              })}
              className="flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/10 hover:border-indigo-500/40 transition-all cursor-pointer"
              style={{ color: pattern.color }}
              aria-label={`Write in journal about: ${prompt}`}
            >
              <PenLine className="w-3 h-3" />
              Write about this
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

const PairingsContent: React.FC<{ pattern: PatternEntry; onNavigateToPattern?: (patternId: string) => void }> = ({ pattern, onNavigateToPattern }) => (
  <div className="space-y-3">
    {pattern.patternPairings.map((pairing, i) => {
      const paired = PATTERNS_DATA.find(p => p.id === pairing.pairedPatternId);
      return (
        <div
          key={i}
          className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-1.5"
        >
          <div className="flex items-center gap-2">
            <Link2 className="w-3.5 h-3.5 shrink-0" style={{ color: pattern.color }} />
            {paired && onNavigateToPattern ? (
              <button
                onClick={() => onNavigateToPattern(paired.id)}
                className="text-xs font-black text-white font-display hover:underline underline-offset-2 transition-colors cursor-pointer text-left flex items-center gap-1.5 group"
                style={{ color: paired.color }}
                aria-label={`Open paired pattern: ${pairing.pairsWith}`}
              >
                {pairing.pairsWith}
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ) : (
              <span className="text-xs font-black text-white font-display">{pairing.pairsWith}</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-sans font-light leading-6">
            {pairing.looksLike}
          </p>
        </div>
      );
    })}
  </div>
);

const SafetyNoteSection: React.FC<{ safetyGuardrail: string }> = ({ safetyGuardrail }) => (
  <section aria-labelledby="pattern-safety-heading" className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
      <div className="space-y-0.5">
        <h2 id="pattern-safety-heading" className="text-[11px] font-mono text-amber-400 uppercase tracking-widest font-black">Safety Note</h2>
        <p className="text-xs text-amber-200/80 font-sans font-light leading-7">{safetyGuardrail}</p>
      </div>
    </div>
  </section>
);
