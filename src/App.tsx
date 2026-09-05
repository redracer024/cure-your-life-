import React, { useCallback, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PremiumProvider, usePremium } from './context/PremiumContext';
import { CurrentSignalProvider, useCurrentSignal } from './context/CurrentSignalContext';
import { AppLayout } from './components/layout/AppLayout';
import { Navigation } from './components/Navigation';
import { AuthSection } from './components/AuthSection';
import { PremiumPaywall } from './components/PremiumPaywall';
import { AssessmentQuizHost } from './components/quiz/AssessmentQuizHost';
import { AppFooter } from './components/AppFooter';
import { TabContentRouter } from './components/layout/TabContentRouter';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { useDecoderState } from './hooks/useDecoderState';
import { useDictionaryNavigation } from './hooks/useDictionaryNavigation';
import type { JournalPromptData } from './hooks/useDictionaryNavigation';
import { authFetch } from './lib/supabaseClient';
import { MedicalDisclosureModal, hasDisclosureAcknowledged, MEDICAL_DISCLOSURE_VERSION } from './components/legal/MedicalDisclosureModal';

function AppInner() {
  const auth = useAuth();
  const premium = usePremium();
  const decoder = useDecoderState(premium.isPremium, premium.setShowPaywall);
  const dict = useDictionaryNavigation();
  const [showQuiz, setShowQuiz] = useState(false);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [disclosureAcknowledged, setDisclosureAcknowledged] = useState(() => hasDisclosureAcknowledged());

  useState(() => {
    if (!hasDisclosureAcknowledged()) {
      setDisclosureOpen(true);
    }
  });

  const requireDisclosure = useCallback((action: () => void) => {
    if (disclosureAcknowledged || hasDisclosureAcknowledged()) {
      action();
    } else {
      setPendingAction(() => action);
      setDisclosureOpen(true);
    }
  }, [disclosureAcknowledged]);

  const handleDisclosureAcknowledge = useCallback(() => {
    setDisclosureAcknowledged(true);
    setDisclosureOpen(false);
    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      action();
    }
  }, [pendingAction]);

  const openDecoder = useCallback(() => {
    if (!premium.isPremium) {
      premium.setShowPaywall(true);
      premium.setBillingMessage('AI Somatic Decoder is Premium. The free version keeps the dictionary, symptom cards, safety info, reflections, and basic journal open.');
      return;
    }
    requireDisclosure(() => dict.setActiveTab('decoder'));
  }, [premium.isPremium, premium.setShowPaywall, premium.setBillingMessage, dict.setActiveTab, requireDisclosure]);

  const handleOpenJournal = useCallback((data: { sourcePatternId: string; sourcePatternName: string; prompt: string }) => {
    const journalData: JournalPromptData = {
      sourceType: 'pattern-journal-prompt',
      sourcePatternId: data.sourcePatternId,
      sourcePatternName: data.sourcePatternName,
      prompt: data.prompt,
    };
    dict.setJournalPromptData(journalData);
    requireDisclosure(() => dict.setActiveTab('journal'));
  }, [dict, requireDisclosure]);

  const handleOpenQuiz = useCallback(() => {
    requireDisclosure(() => setShowQuiz(true));
  }, [requireDisclosure]);

  const handleSetActiveTab = useCallback((tab: 'dictionary' | 'decoder' | 'daily' | 'journal' | 'patterns' | 'lenses') => {
    if (tab === 'decoder') {
      openDecoder();
    } else if (tab === 'journal') {
      requireDisclosure(() => dict.setActiveTab('journal'));
    } else {
      dict.setActiveTab(tab);
    }
  }, [openDecoder, requireDisclosure, dict]);

  const handleOpenLenses = useCallback(() => {
    dict.setActiveTab('lenses');
  }, [dict]);

  return (
    <AppLayout>
      <Navigation
        activeTab={dict.activeTab}
        setActiveTab={handleSetActiveTab}
        openDecoder={openDecoder}
      />
      <AuthSection />
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative z-10">
        <TabContentRouter
          activeTab={dict.activeTab}
          setActiveTab={handleSetActiveTab}
          searchQuery={dict.searchQuery}
          setSearchQuery={dict.setSearchQuery}
          selectedCategory={dict.selectedCategory}
          setSelectedCategory={dict.setSelectedCategory}
          selectedAilment={dict.selectedAilment}
          setSelectedAilment={dict.setSelectedAilment}
          filteredAilments={dict.filteredAilments}
          categories={dict.categories}
          globalTone="witty"
          customSymptom={decoder.customSymptom}
          setCustomSymptom={decoder.setCustomSymptom}
          customHabits={decoder.customHabits}
          setCustomHabits={decoder.setCustomHabits}
          isDecoding={decoder.isDecoding}
          decodedResult={decoder.decodedResult}
          decodeError={decoder.decodeError}
          handleDecodeSymptom={decoder.handleDecodeSymptom}
          setDecodedResult={decoder.setDecodedResult}
          onJournalRedirect={() => dict.setActiveTab('journal')}
          openDecoder={openDecoder}
          onOpenQuiz={handleOpenQuiz}
          highlightPatternId={dict.highlightPatternId}
          onClearHighlightPattern={() => dict.setHighlightPatternId(null)}
          onOpenJournal={handleOpenJournal}
          journalPromptData={dict.journalPromptData}
          onOpenLenses={handleOpenLenses}
        />
      </div>
      <AssessmentQuizHost
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
        onNavigateToPattern={(patternId) => {
          setShowQuiz(false);
          dict.setHighlightPatternId(patternId);
          dict.setActiveTab('patterns');
        }}
      />
      <PremiumPaywall authFetch={authFetch} />
      <AppFooter />
      <MedicalDisclosureModal
        open={disclosureOpen}
        onAcknowledge={handleDisclosureAcknowledge}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PremiumProvider>
        <CurrentSignalProvider>
          <AppErrorBoundary>
            <AppInner />
          </AppErrorBoundary>
        </CurrentSignalProvider>
      </PremiumProvider>
    </AuthProvider>
  );
}
