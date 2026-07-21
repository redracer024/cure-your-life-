import React, { useState, useEffect } from 'react';
import {
  Compass,
  AlertCircle
} from 'lucide-react';
import { AILMENTS } from './data/dictionary';
import { Ailment, SymptomAnalysisResponse } from './types';
import { authFetch, supabase } from './lib/supabaseClient';
import DailyPromptsPanel from './components/DailyPromptsPanel';
import SomaticJournalPanel from './components/SomaticJournalPanel';
import AilmentAccordionItem from './components/ailments/AilmentAccordionItem';
import { Navigation } from './components/Navigation';
import { AuthSection } from './components/AuthSection';
import { PremiumPaywall } from './components/PremiumPaywall';
import { SymptomDecoder } from './components/SymptomDecoder';
import { AppHeader, SearchCommandBar } from './components/AppHeader';
import { AppFooter } from './components/AppFooter';
import { CategoryGrid } from './components/ailments/CategoryGrid';
import { DictionarySearchHeader } from './components/ailments/DictionarySearchHeader';
import { CategoryDetailHeader } from './components/ailments/CategoryDetailHeader';

const SEARCH_ONLY_AILMENT_IDS = new Set<string>([]);
const isSearchOnlyAilment = (ailment: Ailment) => SEARCH_ONLY_AILMENT_IDS.has(ailment.id);

export default function App() {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'decoder' | 'daily' | 'journal'>('dictionary');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAilment, setSelectedAilment] = useState<Ailment | null>(null);
  const [globalTone] = useState<'clinical' | 'witty' | 'brutal'>('witty');

  // Premium & Monetization State
  const [isPremium, setIsPremium] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<any>(null);
  const [isPremiumLoading, setIsPremiumLoading] = useState(true);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showBillingInfo, setShowBillingInfo] = useState(false);

  // Supabase Auth State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUser, setAuthUser] = useState<any>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Custom Decoder State
  const [customSymptom, setCustomSymptom] = useState('');
  const [customHabits, setCustomHabits] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedResult, setDecodedResult] = useState<SymptomAnalysisResponse | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  const refreshPremiumStatus = async () => {
    setIsPremiumLoading(true);
    try {
      const response = await authFetch('/api/me/premium');
      const data = await response.json();
      setPremiumStatus(data);
      setIsPremium(Boolean(data.isPremium));
    } catch (error) {
      console.error('Failed to load premium status:', error);
      setPremiumStatus(null);
      setIsPremium(false);
    } finally {
      setIsPremiumLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setAuthMessage('Supabase frontend env is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
      refreshPremiumStatus();
      return;
    }

    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setAuthUser(data.session?.user ?? null);
      refreshPremiumStatus();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setTimeout(() => refreshPremiumStatus(), 0);
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const browsableAilments = AILMENTS.filter(a => !isSearchOnlyAilment(a));
  const categories = ['All', ...Array.from(new Set(browsableAilments.map(a => a.category)))];

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedSearchQuery.length > 0;

  const filteredAilments = AILMENTS.filter(ailment => {
    const searchOnly = isSearchOnlyAilment(ailment);
    if (searchOnly && !isSearching) return false;

    const matchesSearch = ailment.name.toLowerCase().includes(normalizedSearchQuery) ||
      ailment.emotionalRoot.toLowerCase().includes(normalizedSearchQuery) ||
      ailment.physiologicalDescription.toLowerCase().includes(normalizedSearchQuery);

    const matchesCategory = isSearching || selectedCategory === 'All' || ailment.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const handleDecodeSymptom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSymptom.trim()) return;

    if (!isPremium) {
      setShowPaywall(true);
      setDecodeError('AI Somatic Decoder is a premium feature. Backend says no. Rude, but financially coherent.');
      return;
    }

    setIsDecoding(true);
    setDecodeError(null);
    setDecodedResult(null);

    try {
      const response = await authFetch('/api/analyze-symptom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptom: customSymptom, habits: customHabits }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 402 || data.requiresPremium) setShowPaywall(true);
        throw new Error(data.error || 'Failed to analyze symptom');
      }
      setDecodedResult(data);
    } catch (err: any) {
      setDecodeError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsDecoding(false);
    }
  };

  const openDecoder = () => {
    if (!isPremium) {
      setShowPaywall(true);
      setBillingMessage('AI Somatic Decoder is Premium. The free version keeps the dictionary, symptom cards, safety info, reflections, and basic journal open.');
      return;
    }
    setActiveTab('decoder');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthMessage('Supabase is not configured on the frontend.');
      return;
    }
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthMessage('Enter an email and password first. Revolutionary, I know.');
      return;
    }

    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const email = authEmail.trim();
      const login = await supabase.auth.signInWithPassword({ email, password: authPassword });

      if (!login.error) {
        setAuthUser(login.data.user);
        setAuthMessage('Signed in.');
        await refreshPremiumStatus();
        return;
      }

      const signup = await supabase.auth.signUp({
        email,
        password: authPassword,
        options: { data: { display_name: email.split('@')[0] } },
      });

      if (signup.error) throw signup.error;

      setAuthUser(signup.data.user);
      setAuthMessage(signup.data.session ? 'Account created and signed in.' : 'Account created. Check email.');
      await refreshPremiumStatus();
    } catch (error: any) {
      setAuthMessage(error.message || 'Supabase auth failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    setAuthLoading(true);
    try {
      await supabase.auth.signOut();
      setAuthUser(null);
      setIsPremium(false);
      await refreshPremiumStatus();
      setAuthMessage('Signed out.');
    } catch (error: any) {
      setAuthMessage(error.message || 'Logout failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen premium-bg text-white font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      <div className="absolute inset-0 glowing-bg-grid opacity-100 pointer-events-none z-0" />

      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openDecoder={openDecoder}
        isPremium={isPremium}
        setShowPaywall={setShowPaywall}
      />

      <AuthSection
        authUser={authUser}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authLoading={authLoading}
        authMessage={authMessage}
        handleAuthSubmit={handleAuthSubmit}
        handleLogout={handleLogout}
        premiumStatus={premiumStatus}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        {activeTab === 'dictionary' && (
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
                browsableAilments={browsableAilments}
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
                          onJournalRedirect={() => setActiveTab('journal')}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        )}

        {activeTab === 'decoder' && (
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
        )}

        {activeTab === 'daily' && (
          <main className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto max-w-5xl mx-auto w-full space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">SUBCONSCIOUS TRACE RECORDS</span>
              <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter">Somatic<br /><span className="text-indigo-500">Reflections</span></h1>
              <p className="text-base text-slate-400 max-w-xl font-light">Write, process, and release the tension.</p>
            </div>
            <div className="pt-4"><DailyPromptsPanel /></div>
          </main>
        )}

        {activeTab === 'journal' && (
          <main className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto w-full space-y-6">
            <div className="space-y-2 max-w-6xl mx-auto w-full">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">SOMATIC TRACE LEDGER</span>
              <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter">Somatic<br /><span className="text-indigo-500">Journal</span></h1>
              <p className="text-base text-slate-400 max-w-xl font-light">Log physical symptoms and decode connections.</p>
            </div>
            <div className="pt-4"><SomaticJournalPanel /></div>
          </main>
        )}
      </div>

      <PremiumPaywall
        showPaywall={showPaywall}
        setShowPaywall={setShowPaywall}
        isPremium={isPremium}
        billingMessage={billingMessage}
        setBillingMessage={setBillingMessage}
        showBillingInfo={showBillingInfo}
        setShowBillingInfo={setShowBillingInfo}
        authFetch={authFetch}
      />

      <AppFooter />
    </div>
  );
}
