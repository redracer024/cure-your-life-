# Refactor Plan: Modularize App.tsx

## Current State
- `src/App.tsx` is ~358 lines containing 4 tab routes, ~15 state variables, business logic (auth, premium, decoder), search/filter derivation, and JSX composition.
- No existing React Context or custom hooks.
- Components already exist in `src/components/` with some subdirectory organization (`ailments/`, `breathing/`, `visuals/`, `panels/`).

## Goal
Reduce `App.tsx` to a lean orchestrator (~60–80 lines) by extracting state + logic into custom hooks, sharing cross-cutting state (auth/premium) via Context, and extracting layout structure into dedicated layout components.

## Proposed Folder Structure
```
src/
  App.tsx                          # Lean orchestrator (providers + layout composition)
  types.ts                         # Shared types (already exists)
  hooks/
    useAuthState.ts                # Auth state, login/signup/logout, session listener
    usePremiumState.ts             # Premium state + refreshPremiumStatus
    useDecoderState.ts             # Decoder form state + handleDecodeSymptom
    useDictionaryNavigation.ts     # activeTab, search, category selection, filteredAilments
  context/
    AuthContext.tsx                 # AuthContext + AuthProvider
    PremiumContext.tsx              # PremiumContext + PremiumProvider
  components/
    layout/
      AppLayout.tsx                # Root div, background effects, z-index layering
      TabContentRouter.tsx         # activeTab conditional rendering
      Navigation.tsx               # Already exists, stays
      AppHeader.tsx                # Already exists, stays
      AppFooter.tsx                # Already exists, stays
    AuthSection.tsx                # Already exists, consumes context instead of props
    PremiumPaywall.tsx             # Already exists, consumes context instead of props
    SymptomDecoder.tsx             # Already exists
    DailyPromptsPanel.tsx          # Already exists
    SomaticJournalPanel.tsx        # Already exists
    ailments/...                   # Already exists
    breathing/...                  # Already exists
    visuals/...                    # Already exists
  lib/
    supabaseClient.ts              # Already exists
    ailments/...                   # Already exists
```

## Implementation Steps

### Step 1: Create `src/hooks/useAuthState.ts`
Extract all auth state and handlers into a custom hook.

```ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface AuthState {
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  authUser: any;
  authMessage: string | null;
  authLoading: boolean;
  handleAuthSubmit: (e: React.FormEvent) => Promise<void>;
  handleLogout: () => Promise<void>;
}

export function useAuthState(): AuthState {
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUser, setAuthUser] = useState<any>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthMessage('Supabase frontend env is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
      return;
    }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setAuthUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthMessage('Supabase is not configured on the frontend.');
      return;
    }
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthMessage('Enter an email and password first.');
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
      setAuthMessage('Signed out.');
    } catch (error: any) {
      setAuthMessage(error.message || 'Logout failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    authEmail, setAuthEmail,
    authPassword, setAuthPassword,
    authUser, authMessage, authLoading,
    handleAuthSubmit, handleLogout,
  };
}
```

### Step 2: Create `src/hooks/usePremiumState.ts`
Extract premium state and the `refreshPremiumStatus` side effect.

```ts
import { useState, useEffect } from 'react';
import { authFetch } from '../lib/supabaseClient';

export interface PremiumState {
  isPremium: boolean;
  premiumStatus: any;
  isPremiumLoading: boolean;
  billingMessage: string | null;
  showPaywall: boolean;
  showBillingInfo: boolean;
  setShowPaywall: (show: boolean) => void;
  setShowBillingInfo: (show: boolean) => void;
  setBillingMessage: (msg: string | null) => void;
  refreshPremiumStatus: () => Promise<void>;
}

export function usePremiumState(authUser: any): PremiumState {
  const [isPremium, setIsPremium] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<any>(null);
  const [isPremiumLoading, setIsPremiumLoading] = useState(true);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showBillingInfo, setShowBillingInfo] = useState(false);

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
    refreshPremiumStatus();
  }, [authUser]);

  return {
    isPremium, premiumStatus, isPremiumLoading,
    billingMessage, showPaywall, showBillingInfo,
    setShowPaywall, setBillingInfo: setShowBillingInfo, setBillingMessage,
    refreshPremiumStatus,
  };
}
```

### Step 3: Create `src/hooks/useDecoderState.ts`
Extract decoder form state and the symptom analysis handler.

```ts
import { useState } from 'react';
import { SymptomAnalysisResponse } from '../types';
import { authFetch } from '../lib/supabaseClient';

export interface DecoderState {
  customSymptom: string;
  setCustomSymptom: (val: string) => void;
  customHabits: string;
  setCustomHabits: (val: string) => void;
  isDecoding: boolean;
  decodedResult: SymptomAnalysisResponse | null;
  decodeError: string | null;
  setDecodedResult: (result: SymptomAnalysisResponse | null) => void;
  handleDecodeSymptom: (e: React.FormEvent) => Promise<void>;
}

export function useDecoderState(isPremium: boolean, setShowPaywall: (show: boolean) => void): DecoderState {
  const [customSymptom, setCustomSymptom] = useState('');
  const [customHabits, setCustomHabits] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedResult, setDecodedResult] = useState<SymptomAnalysisResponse | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  const handleDecodeSymptom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSymptom.trim()) return;
    if (!isPremium) {
      setShowPaywall(true);
      setDecodeError('AI Somatic Decoder is a premium feature.');
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
      setDecodeError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsDecoding(false);
    }
  };

  return {
    customSymptom, setCustomSymptom,
    customHabits, setCustomHabits,
    isDecoding, decodedResult, decodeError, setDecodedResult,
    handleDecodeSymptom,
  };
}
```

### Step 4: Create `src/hooks/useDictionaryNavigation.ts`
Extract tab routing, search/filter, and category selection.

```ts
import { useState, useMemo } from 'react';
import { AILMENTS } from '../data/dictionary';
import { Ailment } from '../types';

export interface DictionaryNavigation {
  activeTab: 'dictionary' | 'decoder' | 'daily' | 'journal';
  setActiveTab: (tab: 'dictionary' | 'decoder' | 'daily' | 'journal') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedAilment: Ailment | null;
  setSelectedAilment: (ailment: Ailment | null) => void;
  filteredAilments: Ailment[];
  categories: string[];
  openDecoder: (setActiveTab: (tab: any) => void, setShowPaywall: (show: boolean) => void, isPremium: boolean) => void;
}

export function useDictionaryNavigation(): DictionaryNavigation {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'decoder' | 'daily' | 'journal'>('dictionary');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAilment, setSelectedAilment] = useState<Ailment | null>(null);

  const categories = useMemo(() => {
    const browsable = AILMENTS.filter((a: any) => !SEARCH_ONLY_AILMENT_IDS.has(a.id));
    return ['All', ...Array.from(new Set(browsable.map((a: any) => a.category)))];
  }, []);

  const filteredAilments = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    const isSearching = normalized.length > 0;
    return AILMENTS.filter(ailment => {
      const searchOnly = SEARCH_ONLY_AILMENT_IDS.has(ailment.id);
      if (searchOnly && !isSearching) return false;
      const matchesSearch = ailment.name.toLowerCase().includes(normalized) ||
        ailment.emotionalRoot.toLowerCase().includes(normalized) ||
        ailment.physiologicalDescription.toLowerCase().includes(normalized);
      const matchesCategory = isSearching || selectedCategory === 'All' || ailment.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [searchQuery, selectedCategory]);

  const openDecoder = (setActiveTab: (tab: any) => void, setShowPaywall: (show: boolean) => void, isPremium: boolean) => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }
    setActiveTab('decoder');
  };

  return {
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    selectedAilment, setSelectedAilment,
    filteredAilments, categories,
    openDecoder,
  };
}
```

> **Note:** Move `SEARCH_ONLY_AILMENT_IDS` and `isSearchOnlyAilment` into this hook or a shared constant file (`src/lib/ailments/constants.ts`).

### Step 5: Create Context Providers
Use Context for `authUser` and `premium` state to eliminate prop drilling for deeply nested consumers.

`src/context/AuthContext.tsx`:
```tsx
import React, { createContext, useContext } from 'react';
import { useAuthState } from '../hooks/useAuthState';

interface AuthContextValue extends ReturnType<typeof useAuthState> {}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

`src/context/PremiumContext.tsx`:
```tsx
import React, { createContext, useContext } from 'react';
import { usePremiumState } from '../hooks/usePremiumState';

interface PremiumContextValue extends ReturnType<typeof usePremiumState> {}

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

export function PremiumProvider({ children, authUser }: { children: React.ReactNode; authUser: any }) {
  const premium = usePremiumState(authUser);
  return <PremiumContext.Provider value={premium}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}
```

### Step 6: Extract Layout Components

`src/components/layout/AppLayout.tsx`:
```tsx
import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen premium-bg text-white font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      <div className="absolute inset-0 glowing-bg-grid opacity-100 pointer-events-none z-0" />
      {children}
    </div>
  );
};
```

`src/components/layout/TabContentRouter.tsx`:
```tsx
import React from 'react';
import { AppHeader, SearchCommandBar } from '../AppHeader';
import CategoryGrid from '../ailments/CategoryGrid';
import { CategoryDetailHeader } from '../ailments/CategoryDetailHeader';
import { DictionarySearchHeader } from '../ailments/DictionarySearchHeader';
import { AilmentAccordionItem } from '../ailments/AilmentAccordionItem';
import SymptomDecoder from '../SymptomDecoder';
import DailyPromptsPanel from '../DailyPromptsPanel';
import SomaticJournalPanel from '../SomaticJournalPanel';

interface TabContentRouterProps {
  activeTab: 'dictionary' | 'decoder' | 'daily' | 'journal';
  // dictionary tab props
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  selectedAilment: any;
  setSelectedAilment: (a: any) => void;
  filteredAilments: any[];
  categories: string[];
  globalTone: 'clinical' | 'witty' | 'brutal';
  // decoder tab props
  customSymptom: string;
  setCustomSymptom: (s: string) => void;
  customHabits: string;
  setCustomHabits: (h: string) => void;
  isDecoding: boolean;
  decodedResult: any;
  decodeError: string | null;
  handleDecodeSymptom: (e: React.FormEvent) => Promise<void>;
  setDecodedResult: (r: any) => void;
  onJournalRedirect: () => void;
  openDecoder: () => void;
}

export const TabContentRouter: React.FC<TabContentRouterProps> = ({
  activeTab, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory,
  selectedAilment, setSelectedAilment, filteredAilments, categories, globalTone,
  customSymptom, setCustomSymptom, customHabits, setCustomHabits,
  isDecoding, decodedResult, decodeError, handleDecodeSymptom, setDecodedResult,
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
            <div className="glass-panel p-10 md:p-12 rounded-[2.5rem] ...">
              {/* empty state */}
            </div>
          ) : (
            <div className="space-y-6">
              <CategoryDetailHeader selectedCategory={selectedCategory} filteredCount={filteredAilments.length} />
              <DictionarySearchHeader selectedCategory={selectedCategory} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              <div className="space-y-4">
                {filteredAilments.length === 0 ? (
                  <div className="bg-zinc-950/40 p-12 ...">No matching ailments found</div>
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
        {/* header */}
        <div className="pt-4"><DailyPromptsPanel /></div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto w-full space-y-6">
      {/* header */}
      <div className="pt-4"><SomaticJournalPanel /></div>
    </main>
  );
};
```

### Step 7: Rewrite `App.tsx` as Lean Orchestrator

```tsx
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PremiumProvider, usePremium } from './context/PremiumContext';
import { AppLayout } from './components/layout/AppLayout';
import { Navigation } from './components/Navigation';
import { AuthSection } from './components/AuthSection';
import { PremiumPaywall } from './components/PremiumPaywall';
import { AppFooter } from './components/AppFooter';
import { TabContentRouter } from './components/layout/TabContentRouter';
import { useAuthState } from './hooks/useAuthState';
import { usePremiumState } from './hooks/usePremiumState';
import { useDecoderState } from './hooks/useDecoderState';
import { useDictionaryNavigation } from './hooks/useDictionaryNavigation';

function AppInner() {
  const auth = useAuth();
  const premium = usePremium();
  const decoder = useDecoderState(premium.isPremium, premium.setShowPaywall);
  const dict = useDictionaryNavigation();

  return (
    <AppLayout>
      <Navigation
        activeTab={dict.activeTab}
        setActiveTab={dict.setActiveTab}
        openDecoder={() => dict.openDecoder(dict.setActiveTab, premium.setShowPaywall, premium.isPremium)}
        isPremium={premium.isPremium}
        setShowPaywall={premium.setShowPaywall}
      />
      <AuthSection
        authUser={auth.authUser}
        authEmail={auth.authEmail}
        setAuthEmail={auth.setAuthEmail}
        authPassword={auth.authPassword}
        setAuthPassword={auth.setAuthPassword}
        authLoading={auth.authLoading}
        authMessage={auth.authMessage}
        handleAuthSubmit={auth.handleAuthSubmit}
        handleLogout={auth.handleLogout}
        premiumStatus={premium.premiumStatus}
      />
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
          openDecoder={() => dict.openDecoder(dict.setActiveTab, premium.setShowPaywall, premium.isPremium)}
        />
      </div>
      <PremiumPaywall
        showPaywall={premium.showPaywall}
        setShowPaywall={premium.setShowPaywall}
        isPremium={premium.isPremium}
        billingMessage={premium.billingMessage}
        setBillingMessage={premium.setBillingMessage}
        showBillingInfo={premium.showBillingInfo}
        setShowBillingInfo={premium.setShowBillingInfo}
        authFetch={authFetch}
      />
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
```

> **Note:** `authFetch` is imported from `lib/supabaseClient.ts` and remains available globally.

## Validation Plan
1. **Typecheck**: Run `npx tsc --noEmit` (or project-equivalent) after each hook extraction.
2. **Lint**: Run project linter (`npm run lint` or `bun run lint`) after App.tsx rewrite.
3. **Visual regression**: Run dev server and verify all 4 tabs render correctly (Dictionary, Decoder, Reflections, Journal).
4. **Auth flow**: Verify login/logout/signup still works and `refreshPremiumStatus` triggers on auth state change.
5. **Premium gate**: Verify decoder and paywall still enforce premium correctly.
6. **Search/filter**: Verify category selection, search query, and accordion selection still work.

## Props vs Context Decision Matrix

| State | Scope | Recommendation | Rationale |
|-------|-------|----------------|-----------|
| `activeTab`, `searchQuery`, `selectedCategory` | App-wide, many consumers | Custom hook + prop drilling acceptable for now; migrate to `TabContext` if >3 levels deep | Keeps router explicit; context adds indirection without clear benefit for 1-2 levels |
| `authUser`, `authLoading`, `authMessage` | Deep (AuthSection, PremiumPaywall, Navigation) | **Context** (`AuthContext`) | Eliminates prop drilling through 2-3 intermediate components |
| `isPremium`, `premiumStatus`, `showPaywall` | Deep (Navigation, PremiumPaywall, Decoder, AuthSection) | **Context** (`PremiumContext`) | Cross-cutting concern; avoids threading through multiple layers |
| `customSymptom`, `decodedResult`, `isDecoding` | Local to decoder tab + SearchCommandBar | Custom hook + props | Tab-scoped; no need for global context |
| `billingMessage`, `showBillingInfo` | Deep (PremiumPaywall) | **Context** (`PremiumContext`) | Paywall is a portal/modal at the root; context avoids prop drilling through layout |

## Risks & Mitigations
- **Risk**: Context re-renders on every state change.  
  **Mitigation**: Split contexts by domain (Auth, Premium) rather than one mega-context. Keep hook return values stable.
- **Risk**: Over-abstraction makes data flow hard to trace.  
  **Mitigation**: Keep App.tsx as the single source of truth for wiring; document hook dependencies clearly.
- **Risk**: `useMemo`/`useCallback` proliferation.  
  **Mitigation**: Only memoize `filteredAilments` and handler callbacks passed to deeply memoized children.
