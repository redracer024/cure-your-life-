import React, { useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PremiumProvider, usePremium } from './context/PremiumContext';
import { AppLayout } from './components/layout/AppLayout';
import { Navigation } from './components/Navigation';
import { AuthSection } from './components/AuthSection';
import { PremiumPaywall } from './components/PremiumPaywall';
import { AppFooter } from './components/AppFooter';
import { TabContentRouter } from './components/layout/TabContentRouter';
import { useDecoderState } from './hooks/useDecoderState';
import { useDictionaryNavigation } from './hooks/useDictionaryNavigation';
import { authFetch } from './lib/supabaseClient';

function AppInner() {
  const auth = useAuth();
  const premium = usePremium();
  const decoder = useDecoderState(premium.isPremium, premium.setShowPaywall);
  const dict = useDictionaryNavigation();

  const openDecoder = useCallback(() => {
    if (!premium.isPremium) {
      premium.setShowPaywall(true);
      premium.setBillingMessage('AI Somatic Decoder is Premium. The free version keeps the dictionary, symptom cards, safety info, reflections, and basic journal open.');
      return;
    }
    dict.setActiveTab('decoder');
  }, [premium.isPremium, premium.setShowPaywall, premium.setBillingMessage, dict.setActiveTab]);

  return (
    <AppLayout>
      <Navigation
        activeTab={dict.activeTab}
        setActiveTab={dict.setActiveTab}
        openDecoder={openDecoder}
      />
      <AuthSection />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
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
        />
      </div>
      <PremiumPaywall authFetch={authFetch} />
      <AppFooter />
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PremiumProvider>
        <AppInner />
      </PremiumProvider>
    </AuthProvider>
  );
}
