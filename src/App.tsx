import React, { useCallback, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PremiumProvider, usePremium } from './context/PremiumContext';
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

function AppInner() {
  const auth = useAuth();
  const premium = usePremium();
  const decoder = useDecoderState(premium.isPremium, premium.setShowPaywall);
  const dict = useDictionaryNavigation();
  const [showQuiz, setShowQuiz] = useState(false);

  const openDecoder = useCallback(() => {
    if (!premium.isPremium) {
      premium.setShowPaywall(true);
      premium.setBillingMessage('AI Somatic Decoder is Premium. The free version keeps the dictionary, symptom cards, safety info, reflections, and basic journal open.');
      return;
    }
    dict.setActiveTab('decoder');
  }, [premium.isPremium, premium.setShowPaywall, premium.setBillingMessage, dict.setActiveTab]);

  const handleOpenJournal = useCallback((data: { sourcePatternId: string; sourcePatternName: string; prompt: string }) => {
    const journalData: JournalPromptData = {
      sourceType: 'pattern-journal-prompt',
      sourcePatternId: data.sourcePatternId,
      sourcePatternName: data.sourcePatternName,
      prompt: data.prompt,
    };
    dict.setJournalPromptData(journalData);
    dict.setActiveTab('journal');
  }, [dict]);

  return (
    <AppLayout>
      <Navigation
        activeTab={dict.activeTab}
        setActiveTab={dict.setActiveTab}
        openDecoder={openDecoder}
      />
      <AuthSection />
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative z-10">
        <TabContentRouter
          activeTab={dict.activeTab}
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
          onOpenQuiz={() => setShowQuiz(true)}
          highlightPatternId={dict.highlightPatternId}
          onClearHighlightPattern={() => dict.setHighlightPatternId(null)}
          onOpenJournal={handleOpenJournal}
          journalPromptData={dict.journalPromptData}
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
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PremiumProvider>
        <AppErrorBoundary>
          <AppInner />
        </AppErrorBoundary>
      </PremiumProvider>
    </AuthProvider>
  );
}
