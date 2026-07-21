import React from 'react';
import { Compass, AlertCircle } from 'lucide-react';
import { AppHeader, SearchCommandBar } from '../AppHeader';
import { CategoryGrid } from '../ailments/CategoryGrid';
import { CategoryDetailHeader } from '../ailments/CategoryDetailHeader';
import { DictionarySearchHeader } from '../ailments/DictionarySearchHeader';
import AilmentAccordionItem from '../ailments/AilmentAccordionItem';
import { SymptomDecoder } from '../SymptomDecoder';
import DailyPromptsPanel from '../DailyPromptsPanel';
import SomaticJournalPanel from '../SomaticJournalPanel';
import type { Ailment } from '../../types';
import type { AilmentCore } from '../../types/dictionary';

interface TabContentRouterProps {
  activeTab: 'dictionary' | 'decoder' | 'daily' | 'journal';
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedAilment: Ailment | null;
  setSelectedAilment: (ailment: Ailment | null) => void;
  filteredAilments: AilmentCore[];
  categories: string[];
  globalTone: 'clinical' | 'witty' | 'brutal';
  customSymptom: string;
  setCustomSymptom: (val: string) => void;
  customHabits: string;
  setCustomHabits: (val: string) => void;
  isDecoding: boolean;
  decodedResult: any;
  decodeError: string | null;
  handleDecodeSymptom: (e: React.FormEvent) => Promise<void>;
  setDecodedResult: (result: any) => void;
  onJournalRedirect: () => void;
  openDecoder: () => void;
}

export const TabContentRouter: React.FC<TabContentRouterProps> = ({
  activeTab,
  searchQuery, setSearchQuery,
  selectedCategory, setSelectedCategory,
  selectedAilment, setSelectedAilment,
  filteredAilments, categories,
  globalTone,
  customSymptom, setCustomSymptom,
  customHabits, setCustomHabits,
  isDecoding, decodedResult, decodeError,
  handleDecodeSymptom, setDecodedResult,
  onJournalRedirect, openDecoder,
}) => {
  if (activeTab === 'dictionary') {
    return (
      <main className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto w-full space-y-8">
        <AppHeader />
        <SearchCommandBar
          customSymptom={customSymptom}
          setCustomSymptom={setCustomSymptom}
          onAnalyze={openDecoder}
          selectedCategory={selectedCategory}
        />

        <div className="w-full max-w-4xl mx-auto space-y-6">
          <CategoryGrid
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            browsableAilments={filteredAilments}
            selectedAilment={selectedAilment}
            setSelectedAilment={setSelectedAilment}
          />

          {selectedCategory === null ? (
            <div className="glass-panel p-10 md:p-12 rounded-[2.5rem] text-left space-y-4 relative z-10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.05)] border border-white/5 bg-black/40">
              <Compass className="w-10 h-10 mx-auto text-indigo-400 animate-pulse mb-2" />
              <h3 className="text-sm font-mono text-indigo-300 uppercase tracking-widest font-black">Select a somatic region center</h3>
              <p className="text-xs text-[#8A94A6] max-w-md mx-auto leading-7 font-light font-sans">
                Choose one of the somatic groupings above to start decoding its psychosomatic mechanisms.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <CategoryDetailHeader
                selectedCategory={selectedCategory}
                filteredCount={filteredAilments.length}
              />

              <DictionarySearchHeader
                selectedCategory={selectedCategory}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />

              <div className="space-y-4">
                {filteredAilments.length === 0 ? (
                  <div className="bg-zinc-950/40 p-12 text-left rounded-3xl border border-white/10 border-dashed space-y-3">
                    <AlertCircle className="w-12 h-12 mx-auto text-indigo-500/50" />
                    <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest">No matching ailments found</h3>
                  </div>
                ) : (
                  filteredAilments.map(ailment => (
                    <AilmentAccordionItem
                      key={ailment.id}
                      ailment={ailment}
                      isSelected={selectedAilment?.id === ailment.id}
                      onSelect={() => setSelectedAilment(selectedAilment?.id === ailment.id ? null : ailment)}
                      globalTone={globalTone}
                      onJournalRedirect={onJournalRedirect}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (activeTab === 'decoder') {
    return (
      <SymptomDecoder
        customSymptom={customSymptom}
        setCustomSymptom={setCustomSymptom}
        customHabits={customHabits}
        setCustomHabits={setCustomHabits}
        isDecoding={isDecoding}
        decodedResult={decodedResult}
        decodeError={decodeError}
        handleDecodeSymptom={handleDecodeSymptom}
        setDecodedResult={setDecodedResult}
      />
    );
  }

  if (activeTab === 'daily') {
    return (
      <main className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto max-w-5xl mx-auto w-full space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">SUBCONSCIOUS TRACE RECORDS</span>
          <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter">Somatic<br /><span className="text-indigo-500">Reflections</span></h1>
          <p className="text-base text-slate-400 max-w-xl font-light">Write, process, and release the tension.</p>
        </div>
        <div className="pt-4"><DailyPromptsPanel /></div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto w-full space-y-6">
      <div className="space-y-2 max-w-6xl mx-auto w-full">
        <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">SOMATIC TRACE LEDGER</span>
        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter">Somatic<br /><span className="text-indigo-500">Journal</span></h1>
        <p className="text-base text-slate-400 max-w-xl font-light">Log physical symptoms and decode connections.</p>
      </div>
      <div className="pt-4"><SomaticJournalPanel /></div>
    </main>
  );
};
