import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronDown, Shield, RotateCcw, BookOpen, Zap, Link2, AlertTriangle, Network, List, RefreshCw, Calendar, MessageCircle, Star, Users, Activity, Sparkles, Map, ArrowUp } from 'lucide-react';
import type { PatternEntry } from '../../types/patterns';
import { PatternMindMap } from './PatternMindMap';
import { PatternLoopFlow } from './PatternLoopFlow';
import { DayInLifeTimeline } from './DayInLifeTimeline';
import { InnerMonologuePanel } from './InnerMonologuePanel';
import { StrengthsPanel } from './StrengthsPanel';
import { RelationshipLensTabs } from './RelationshipLensTabs';
import { NervousSystemDashboard } from './NervousSystemDashboard';
import { WisdomPerspectiveTabs } from './WisdomPerspectiveTabs';
import { RecoveryRoadmap } from './RecoveryRoadmap';

interface PatternDetailPanelProps {
  pattern: PatternEntry;
  onClose: () => void;
}

type Section = 'overview' | 'profiles' | 'loop' | 'dayInLife' | 'innerWorld' | 'origins' | 'strengths' | 'relationships' | 'bodyNS' | 'perspectives' | 'recovery' | 'body' | 'reset' | 'boundaries' | 'journal' | 'pairings' | 'safety';
type ViewMode = 'sections' | 'mindmap';

const SECTIONS: { key: Section; label: string; icon: React.ReactNode; extendedOnly?: boolean }[] = [
  { key: 'overview', label: 'Overview', icon: <Zap className="w-3.5 h-3.5" /> },
  { key: 'profiles', label: 'Tone Profiles', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { key: 'loop', label: 'Pattern Loop', icon: <RefreshCw className="w-3.5 h-3.5" />, extendedOnly: true },
  { key: 'dayInLife', label: 'A Day in the Life', icon: <Calendar className="w-3.5 h-3.5" />, extendedOnly: true },
  { key: 'innerWorld', label: 'Inside Their Head', icon: <MessageCircle className="w-3.5 h-3.5" />, extendedOnly: true },
  { key: 'origins', label: 'Origins', icon: <ChevronDown className="w-3.5 h-3.5" /> },
  { key: 'strengths', label: 'Strengths', icon: <Star className="w-3.5 h-3.5" />, extendedOnly: true },
  { key: 'relationships', label: 'Relationships', icon: <Users className="w-3.5 h-3.5" />, extendedOnly: true },
  { key: 'bodyNS', label: 'Body & Nervous System', icon: <Activity className="w-3.5 h-3.5" />, extendedOnly: true },
  { key: 'perspectives', label: 'Perspectives', icon: <Sparkles className="w-3.5 h-3.5" />, extendedOnly: true },
  { key: 'recovery', label: 'Recovery Roadmap', icon: <Map className="w-3.5 h-3.5" />, extendedOnly: true },
  { key: 'body', label: 'Body Map', icon: <Zap className="w-3.5 h-3.5" /> },
  { key: 'reset', label: 'Reset Protocol', icon: <RotateCcw className="w-3.5 h-3.5" /> },
  { key: 'boundaries', label: 'Boundaries', icon: <Shield className="w-3.5 h-3.5" /> },
  { key: 'journal', label: 'Journal Prompts', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { key: 'pairings', label: 'Pattern Pairings', icon: <Link2 className="w-3.5 h-3.5" /> },
  { key: 'safety', label: 'Safety Note', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
];

const hasExtendedFields = (p: PatternEntry): boolean =>
  !!(p.patternLoop || p.strengths || p.dayInTheLife || p.innerMonologue || p.patternVoice || p.relationshipLenses || p.nervousSystemProfile || p.wisdomPerspectives || p.recoveryRoadmap);

export const PatternDetailPanel: React.FC<PatternDetailPanelProps> = ({ pattern, onClose }) => {
  const [expandedSections, setExpandedSections] = useState<Set<Section>>(new Set(['overview']));
  const [viewMode, setViewMode] = useState<ViewMode>('sections');
  const [showSectionNav, setShowSectionNav] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isExtended = hasExtendedFields(pattern);

  const activeSections = SECTIONS.filter(s => !s.extendedOnly || isExtended);

  const toggleSection = (section: Section) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(activeSections.map(s => s.key)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const scrollToSection = useCallback((key: Section) => {
    const el = document.getElementById(`section-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setExpandedSections(prev => new Set([...prev, key]));
      setShowSectionNav(false);
    }
  }, []);

  return (
    <main ref={scrollRef} className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto w-full">
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

        {/* Expand/Collapse controls + View Mode Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-300 border border-white/5 rounded-lg hover:border-white/10 transition-all cursor-pointer"
            >
              Expand All
            </button>
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
                  isExpanded={expandedSections.has(section.key)}
                  onToggle={() => toggleSection(section.key)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="mindmap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PatternMindMap pattern={pattern} />
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
}> = ({ section, pattern, isExpanded, onToggle }) => {
  return (
    <motion.div
      id={`section-${section.key}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/5 bg-black/40 overflow-hidden scroll-mt-4"
    >
      <button
        onClick={onToggle}
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

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
              {section.key === 'overview' && <OverviewContent pattern={pattern} />}
              {section.key === 'profiles' && <ProfilesContent pattern={pattern} />}
              {section.key === 'loop' && pattern.patternLoop && <PatternLoopFlow stages={pattern.patternLoop} color={pattern.color} />}
              {section.key === 'dayInLife' && pattern.dayInTheLife && <DayInLifeTimeline entries={pattern.dayInTheLife} color={pattern.color} />}
              {section.key === 'innerWorld' && pattern.innerMonologue && pattern.patternVoice && (
                <InnerMonologuePanel innerMonologue={pattern.innerMonologue} patternVoice={pattern.patternVoice} color={pattern.color} />
              )}
              {section.key === 'origins' && <OriginsContent pattern={pattern} />}
              {section.key === 'strengths' && pattern.strengths && (
                <StrengthsPanel strengths={pattern.strengths} whatItIsNot={pattern.whatItIsNot} color={pattern.color} />
              )}
              {section.key === 'relationships' && pattern.relationshipLenses && (
                <RelationshipLensTabs lenses={pattern.relationshipLenses} color={pattern.color} />
              )}
              {section.key === 'bodyNS' && pattern.nervousSystemProfile && (
                <NervousSystemDashboard profile={pattern.nervousSystemProfile} color={pattern.color} />
              )}
              {section.key === 'perspectives' && pattern.wisdomPerspectives && (
                <WisdomPerspectiveTabs perspectives={pattern.wisdomPerspectives} color={pattern.color} />
              )}
              {section.key === 'recovery' && pattern.recoveryRoadmap && (
                <RecoveryRoadmap stages={pattern.recoveryRoadmap} color={pattern.color} />
              )}
              {section.key === 'body' && <BodyContent pattern={pattern} />}
              {section.key === 'reset' && <ResetContent pattern={pattern} />}
              {section.key === 'boundaries' && <BoundariesContent pattern={pattern} />}
              {section.key === 'journal' && <JournalContent pattern={pattern} />}
              {section.key === 'pairings' && <PairingsContent pattern={pattern} />}
              {section.key === 'safety' && <SafetyContent pattern={pattern} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

const OriginsContent: React.FC<{ pattern: PatternEntry }> = ({ pattern }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">Where It Often Starts</h4>
      <div className="space-y-2">
        {pattern.whereItOftenStarts.map((origin, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
            <p className="text-sm text-slate-300 font-sans font-light leading-7">
              {origin}
            </p>
          </div>
        ))}
      </div>
    </div>
    {pattern.subPatterns.length > 0 && (
      <div className="space-y-2">
        <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">Sub-Patterns</h4>
        <div className="space-y-2">
          {pattern.subPatterns.map((sub, i) => (
            <div
              key={i}
              className="p-3 rounded-xl border border-white/5 bg-white/[0.02]"
            >
              <span className="text-xs font-black text-white font-display">{sub.name}</span>
              <p className="text-[11px] text-slate-400 font-sans font-light mt-0.5">{sub.description}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const BodyContent: React.FC<{ pattern: PatternEntry }> = ({ pattern }) => {
  const [bodyTab, setBodyTab] = useState<'stress' | 'symbolic'>('stress');

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
      <div className="flex items-center gap-1.5">
        {(['stress', 'symbolic'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setBodyTab(tab)}
            className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
              bodyTab === tab
                ? 'text-white border'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            style={bodyTab === tab ? {
              background: pattern.color + '15',
              borderColor: pattern.color + '30',
              color: pattern.color,
            } : undefined}
          >
            {tab === 'stress' ? 'Stress & Body' : 'Symbolic Map'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {bodyTab === 'stress' ? (
          <motion.div
            key="stress"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-4"
          >
            {stressItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black">Commonly Reported Experiences</h4>
                <div className="flex flex-wrap gap-2">
                  {stressItems.map((symptom, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-2.5 py-1 rounded-lg border border-white/5 bg-white/[0.03] text-slate-400"
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[9px] font-mono text-slate-600 italic">
              These are commonly reported experiences, not medical diagnoses. Persistent symptoms should be medically evaluated.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="symbolic"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3"
          >
            {symbolicEntries.length > 0 ? (
              <div className="space-y-2">
                {symbolicEntries.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl border bg-black/30"
                    style={{ borderColor: pattern.color + '15' }}
                  >
                    <span
                      className="text-[10px] font-mono font-black uppercase tracking-widest shrink-0 w-24"
                      style={{ color: pattern.color }}
                    >
                      {entry.area}
                    </span>
                    <p className="text-[11px] text-slate-400 font-sans font-light leading-5">
                      {entry.meaning}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 font-sans font-light italic">
                No symbolic body data available for this pattern yet.
              </p>
            )}
            <p className="text-[9px] font-mono text-slate-600 italic">
              Symbolic meanings are reflective perspectives, not medical explanations.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
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

const JournalContent: React.FC<{ pattern: PatternEntry }> = ({ pattern }) => (
  <div className="space-y-3">
    <div className="space-y-2">
      {pattern.journalPrompts.map((prompt, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-white/5 bg-white/[0.02]"
        >
          <p className="text-sm text-slate-300 font-sans font-light leading-7 italic">
            {prompt}
          </p>
        </div>
      ))}
    </div>
  </div>
);

const PairingsContent: React.FC<{ pattern: PatternEntry }> = ({ pattern }) => (
  <div className="space-y-3">
    {pattern.patternPairings.map((pairing, i) => (
      <div
        key={i}
        className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-1.5"
      >
        <div className="flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5" style={{ color: pattern.color }} />
          <span className="text-xs font-black text-white font-display">{pairing.pairsWith}</span>
        </div>
        <p className="text-[11px] text-slate-400 font-sans font-light leading-6">
          {pairing.looksLike}
        </p>
      </div>
    ))}
  </div>
);

const SafetyContent: React.FC<{ pattern: PatternEntry }> = ({ pattern }) => (
  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
      <p className="text-xs text-amber-200/80 font-sans font-light leading-7">
        {pattern.safetyGuardrail}
      </p>
    </div>
  </div>
);
