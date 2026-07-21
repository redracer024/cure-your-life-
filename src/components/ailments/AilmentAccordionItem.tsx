import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { AilmentCore } from '../../types/dictionary';
import { getDetailForAilment, mergeCoreAndDetail } from '../../data';
import type { Ailment } from '../../types';
import {
  getEnrichedAilment,
  getCardPatterns,
  triggerHapticPattern,
  getSymptomHapticPattern,
} from '../../lib/ailmentHelpers';
import { CATEGORY_META } from './ailmentCategoryMeta';
import { CATEGORY_SLUGS } from '../../data';
import { AnatomicalSilhouette } from '../visuals/AnatomicalSilhouette';
import { AilmentHeroCard } from './AilmentHeroCard';
import { AilmentTabNav } from './AilmentTabNav';
import { AilmentTonePanel } from './panels/AilmentTonePanel';
import { AilmentInfluencePanel } from './panels/AilmentInfluencePanel';
import { AilmentSafetyPanel } from './panels/AilmentSafetyPanel';
import { AilmentResetPanel } from './panels/AilmentResetPanel';

interface AilmentAccordionItemProps {
  key?: React.Key;
  ailment: AilmentCore;
  isSelected: boolean;
  onSelect: () => void;
  globalTone: 'clinical' | 'witty' | 'brutal';
  onJournalRedirect: () => void;
}

function AilmentAccordionItem({ ailment, isSelected, onSelect, globalTone, onJournalRedirect }: AilmentAccordionItemProps) {
  const [detail, setDetail] = useState<Ailment | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const enriched = getEnrichedAilment(mergeCoreAndDetail(ailment, detail) as Ailment);
  const [innerTab, setInnerTab] = useState<'tones' | 'influence' | 'reset' | 'safety'>('safety');
  const [localTone, setLocalTone] = useState<'clinical' | 'witty' | 'brutal'>(globalTone);
  const [isDisclaimerExpanded, setIsDisclaimerExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const categoryMeta = CATEGORY_META[enriched.category] || { color: '#6366f1' };
  const optionsRef = useRef<HTMLDivElement>(null);
  const visibleTabs = ['safety', 'tones', 'influence', 'reset'] as const;
  type VisibleInnerTab = typeof visibleTabs[number];

  const tabLabels: Record<VisibleInnerTab, string> = {
    safety: 'Safety',
    tones: 'Interpretations',
    influence: 'Influence',
    reset: 'Reset',
  };

  const goToTab = (tab: VisibleInnerTab) => {
    setInnerTab(tab);
    window.setTimeout(() => {
      optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const goNextTab = () => {
    const currentIndex = visibleTabs.indexOf(innerTab as VisibleInnerTab);
    const nextTab = visibleTabs[(currentIndex >= 0 ? currentIndex + 1 : 1) % visibleTabs.length];
    goToTab(nextTab);
  };

  const currentVisibleTab = visibleTabs.includes(innerTab as VisibleInnerTab)
    ? (innerTab as VisibleInnerTab)
    : 'safety';
  const nextVisibleTab = visibleTabs[(visibleTabs.indexOf(currentVisibleTab) + 1) % visibleTabs.length];

  // Sync with global tone when it changes
  useEffect(() => {
    setLocalTone(globalTone);
  }, [globalTone]);

  // Load detail data when accordion is selected
  useEffect(() => {
    if (!isSelected) return;

    const slug = CATEGORY_SLUGS[ailment.category];
    if (!slug) return;

    let cancelled = false;

    async function loadDetail() {
      setIsLoadingDetail(true);
      const found = await getDetailForAilment(ailment.id, slug);
      if (!cancelled && found) {
        setDetail(found);
      }
      setIsLoadingDetail(false);
    }

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [isSelected, ailment.id, ailment.category]);

  // Safety opens first every time a symptom panel is selected.
  useEffect(() => {
    if (isSelected) {
      setInnerTab('safety');
    }
  }, [isSelected, enriched.id]);

  const isFirstRender = useRef(true);

  // Scroll to the beginning of the symptom when it is selected, respecting the sticky header and layout changes
  useEffect(() => {
    if (isSelected) {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      const timer = setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 450); // Delay slightly to allow layout expansion to finish settling
      return () => clearTimeout(timer);
    } else {
      isFirstRender.current = false;
    }
  }, [isSelected]);

  return (
    <div
      ref={containerRef}
      className={`scroll-mt-36 rounded-2xl transition-all duration-500 overflow-hidden relative z-10 border group ${isSelected
        ? 'glass-panel-heavy -translate-y-1'
        : 'glass-panel-interactive border-transparent'
        }`}
      style={{
        borderColor: isSelected ? `${categoryMeta.color}70` : undefined,
        boxShadow: isSelected ? `0 0 30px ${categoryMeta.color}15` : undefined,
      } as React.CSSProperties}
    >
      {/* Dynamic soft left category color fade/glow overlay */}
      <div
        className={`absolute inset-y-0 left-0 w-64 pointer-events-none transition-all duration-500 z-0 ${isSelected ? 'opacity-[0.24]' : 'opacity-[0.18] group-hover:opacity-[0.24]'
          }`}
        style={{
          background: `linear-gradient(to right, ${categoryMeta.color}35, transparent)`
        }}
      />

      <AilmentHeroCard
        enriched={enriched}
        isSelected={isSelected}
        onSelect={onSelect}
        categoryMeta={categoryMeta}
        hexToRgbNormalized={hexToRgbNormalized}
      />

      {/* Accordion Expanded Content */}
      <AnimatePresence initial={false}>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="border-t border-white/5 bg-black/55 backdrop-blur-xl relative overflow-hidden"
          >
            {/* Ambient dynamic anatomical silhouette based on category */}
            <AnatomicalSilhouette category={enriched.category} color={categoryMeta.color} />

            <div className="p-6 md:p-8 space-y-6 relative z-10">
              {/* 3D Rotating Data Cube Options */}
              <div ref={optionsRef}>
                <AilmentTabNav
                  innerTab={innerTab}
                  goToTab={goToTab}
                  enriched={enriched}
                  hexToRgbNormalized={hexToRgbNormalized}
                />
              </div>

              {/* Tab Contents */}
              <div className="min-h-[120px]">
                {isLoadingDetail && !detail ? (
                  <div className="space-y-4">
                    <div className="text-xs font-mono text-slate-500 uppercase tracking-widest animate-pulse">
                      Loading detailed analysis...
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-white/5 rounded w-3/4" />
                      <div className="h-4 bg-white/5 rounded w-1/2" />
                      <div className="h-4 bg-white/5 rounded w-2/3" />
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {innerTab === 'tones' && (
                      <AilmentTonePanel enriched={enriched} />
                    )}

                    {innerTab === 'influence' && (
                      <AilmentInfluencePanel enriched={enriched} />
                    )}

                    {innerTab === 'reset' && (
                      <AilmentResetPanel
                        enriched={enriched}
                        onJournalRedirect={onJournalRedirect}
                      />
                    )}

                    {innerTab === 'safety' && (
                      <AilmentSafetyPanel
                        enriched={enriched}
                        isDisclaimerExpanded={isDisclaimerExpanded}
                        setIsDisclaimerExpanded={setIsDisclaimerExpanded}
                      />
                    )}
                  </AnimatePresence>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center pt-5 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 text-[10px] font-mono font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    ↑ Back to options
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={goNextTab}
                      className="px-4 py-3 rounded-xl border border-indigo-500/25 bg-indigo-950/25 hover:bg-indigo-900/35 text-indigo-200 text-[10px] font-mono font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Next: {tabLabels[nextVisibleTab]} →
                    </button>

                    <button
                      type="button"
                      onClick={onSelect}
                      className="px-4 py-3 rounded-xl border border-slate-700/40 bg-black/40 hover:bg-slate-900/70 text-slate-300 text-[10px] font-mono font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Close symptom
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to convert hex to normalized RGB for shaders
const hexToRgbNormalized = (hex: string, darken = 1.0): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r * darken, g * darken, b * darken];
};

export default AilmentAccordionItem;
