import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Sparkles, 
  Activity, 
  Flame, 
  HelpCircle, 
  Check, 
  RotateCcw, 
  AlertCircle, 
  ChevronRight, 
  User, 
  BookOpen, 
  Compass, 
  Feather,
  Dumbbell,
  Heart,
  Brain,
  AlertOctagon,
  Dna,
  X,
  Shield,
  CreditCard,
  Lock,
  Moon,
  Play,
  Pause,
  Layers,
  Timer,
  TrendingUp,
  Apple,
  Eye,
  Users
} from 'lucide-react';
import { AILMENTS } from './data/dictionary';
import { Ailment, SymptomAnalysisResponse } from './types';
import { getEnrichedAilment, getHeroPrimaryPattern, getHeroCascade, getHeroTags, shouldShowSafetyBadges, getTonePreviews, triggerHapticPattern, getSymptomHapticPattern, formatParagraphText, getStructuredMedicalMechanismText, getStructuredClinicalText, getStructuredWittyText, getStructuredBrutalText, getStructuredResetText, getStructuredInfluenceText, getStructuredBiologyPath, getCardPatterns } from './lib/ailmentHelpers';
import DailyPromptsPanel from './components/DailyPromptsPanel';
import SomaticJournalPanel from './components/SomaticJournalPanel';
import AilmentAccordionItem, { CATEGORY_META, renderCategoryIcon } from './components/ailments/AilmentAccordionItem';
import { CategoryBackground } from './components/CategoryBackground';
import { authFetch, isSupabaseConfigured, supabase } from './lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { renderOrganIllustration } from './components/visuals/OrganIllustration';
import SomaticBreathingRegulator from './components/breathing/SomaticBreathingRegulator';
import {
  renderClinicalAvatar,
  renderWittyAvatar,
  renderBrutalAvatar,
  renderHolographicFace,
  renderSarcasticusAvatar
} from './components/visuals/HolographicAvatars';


// Helper to render beautiful glowing 3D-effect organ vector illustrations
const SEARCH_ONLY_AILMENT_IDS = new Set<string>([]);

const isSearchOnlyAilment = (ailment: Ailment) => SEARCH_ONLY_AILMENT_IDS.has(ailment.id);

// Compact High-tech Avatars for Three Tones
// Helper to soften aggressive/uncontrolled medical claims with cautious wording

function TruncatedText({ text, maxLen = 520 }: { text: string; maxLen?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const normalizedText = formatParagraphText(text);
  const shouldTruncate = normalizedText.length > maxLen;

  const displayText = isExpanded || !shouldTruncate
    ? normalizedText
    : normalizedText.slice(0, maxLen).trimEnd() + '...';

  const paragraphs = displayText
    .split(/\n\s*\n/g)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4 leading-7 whitespace-pre-line">
      {paragraphs.map((part, index) => (
        <p key={index}>{part}</p>
      ))}

      {shouldTruncate && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-[10px] font-mono font-black text-indigo-300 hover:text-indigo-200 underline underline-offset-4 uppercase tracking-widest"
        >
          {isExpanded ? 'Show Less' : 'Read Full Interpretation'}
        </button>
      )}
    </div>
  );
}

const renderAnatomicalSilhouette = (category: string, color: string) => {
  const strokeColor = color;
  
  if (category === "Back & Shoulders") {
    return (
      <svg className="absolute right-0 bottom-0 w-80 h-80 opacity-15 pointer-events-none select-none z-0 translate-x-12 translate-y-12" viewBox="0 0 100 100" fill="none">
        <path d="M50 5 V95" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="3 3" />
        {[15, 25, 35, 45, 55, 65, 75, 85].map((y, i) => (
          <g key={i}>
            <path d={`M35 ${y} C42 ${y-4} 58 ${y-4} 65 ${y}`} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            <path d={`M40 ${y+3} C45 ${y+1} 55 ${y+1} 60 ${y+3}`} stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />
            <circle cx="50" cy={y} r="3" fill="#000" stroke={strokeColor} strokeWidth="1.5" />
          </g>
        ))}
      </svg>
    );
  }

  if (category === "Head & Neck") {
    return (
      <svg className="absolute right-0 bottom-0 w-80 h-80 opacity-15 pointer-events-none select-none z-0 translate-x-12 translate-y-12" viewBox="0 0 100 100" fill="none">
        <path d="M50 50 C40 30, 40 10, 60 10 C80 10, 90 25, 80 45 C75 55, 65 60, 60 70 C55 80, 50 90, 50 95" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M50 50 C60 30, 60 10, 40 10 C20 10, 10 25, 20 45 C25 55, 35 60, 40 70 C45 80, 50 90, 50 95" stroke={strokeColor} strokeWidth="1.5" />
        <circle cx="50" cy="30" r="15" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="50" cy="30" r="5" stroke={strokeColor} strokeWidth="1.5" />
      </svg>
    );
  }

  if (category === "Chest & Breathing") {
    return (
      <svg className="absolute right-0 bottom-0 w-80 h-80 opacity-15 pointer-events-none select-none z-0 translate-x-12 translate-y-12" viewBox="0 0 100 100" fill="none">
        <path d="M45 25 C30 20, 15 35, 20 60 C25 80, 40 85, 45 75 Z" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M55 25 C70 20, 85 35, 80 60 C75 80, 60 85, 55 75 Z" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M50 10 V30" stroke={strokeColor} strokeWidth="2" />
        <path d="M50 55 C46 50, 42 55, 50 65 C58 55, 54 50, 50 55 Z" fill={strokeColor} opacity="0.4" />
      </svg>
    );
  }

  if (category === "Stomach & Gut") {
    return (
      <svg className="absolute right-0 bottom-0 w-80 h-80 opacity-15 pointer-events-none select-none z-0 translate-x-12 translate-y-12" viewBox="0 0 100 100" fill="none">
        <path d="M30 35 H70 V45 H30 V55 H70 V65 H30 V75 H70" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50 20 V35" stroke={strokeColor} strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg className="absolute right-0 bottom-0 w-80 h-80 opacity-15 pointer-events-none select-none z-0 translate-x-12 translate-y-12" viewBox="0 0 100 100" fill="none">
      <path d="M10 50 Q30 30 50 50 T90 50" stroke={strokeColor} strokeWidth="1" />
      <path d="M10 60 Q30 40 50 60 T90 60" stroke={strokeColor} strokeWidth="1" />
      <path d="M10 40 Q30 20 50 40 T90 40" stroke={strokeColor} strokeWidth="1.5" />
    </svg>
  );
};



export default function App() {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'decoder' | 'daily' | 'journal'>('dictionary');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAilment, setSelectedAilment] = useState<Ailment | null>(null);
  const [globalTone, setGlobalTone] = useState<'clinical' | 'witty' | 'brutal'>('witty');
  const [isDisclaimerExpanded, setIsDisclaimerExpanded] = useState(false);
  
  // Premium & Monetization State
  // Server is the source of truth. localStorage is not trusted for premium access.
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

  // Fetch server-side premium status. Backend is the source of truth.
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

  // Supabase login/session watcher.
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

  // List of unique categories for filtering
  const browsableAilments = AILMENTS.filter(a => !isSearchOnlyAilment(a));
  const categories = ['All', ...Array.from(new Set(browsableAilments.map(a => a.category)))];

  // Filtered ailments based on search query and category, alphabetized by symptom name
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedSearchQuery.length > 0;

  const filteredAilments = AILMENTS.filter(ailment => {
    const searchOnly = isSearchOnlyAilment(ailment);

    if (searchOnly && !isSearching) {
      return false;
    }

    const matchesSearch = ailment.name.toLowerCase().includes(normalizedSearchQuery) ||
                          ailment.emotionalRoot.toLowerCase().includes(normalizedSearchQuery) ||
                          ailment.physiologicalDescription.toLowerCase().includes(normalizedSearchQuery);

    const matchesCategory = isSearching || selectedCategory === 'All' || ailment.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Handle custom symptom analysis submission
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptom: customSymptom,
          habits: customHabits,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 402 || data.requiresPremium) {
          setShowPaywall(true);
        }
        throw new Error(data.error || 'Failed to analyze symptom');
      }

      setDecodedResult(data);
    } catch (err: any) {
      console.error(err);
      setDecodeError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsDecoding(false);
    }
  };

  const cleanLongText = (value: unknown) => {
    return String(value ?? '')
      .replace(/\\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };


  const getPrimaryPattern = (ailment: any) => {
    if (ailment?.id === 'asthma') {
      return 'Airway inflammation, bronchospasm, mucus, air trapping, and panic feedback.';
    }


return ailment?.primaryPattern || ailment?.pattern || ailment?.metaphor || ailment?.emotionalRoot || '';
  };

  const LongTextBlock = ({ value, className = '' }: { value: unknown; className?: string }) => {
    const text = cleanLongText(value);
    return (
      <div className={`whitespace-pre-line leading-7 ${className}`}>
        {text}
      </div>
    );
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

      // Try login first.
      const login = await supabase.auth.signInWithPassword({
        email,
        password: authPassword,
      });

      if (!login.error) {
        setAuthUser(login.data.user);
        setAuthMessage('Signed in.');
        await refreshPremiumStatus();
        return;
      }

      // If no account exists yet, create one.
      const signup = await supabase.auth.signUp({
        email,
        password: authPassword,
        options: {
          data: {
            display_name: email.split('@')[0],
          },
        },
      });

      if (signup.error) {
        throw signup.error;
      }

      setAuthUser(signup.data.user);
      setAuthMessage(
        signup.data.session
          ? 'Account created and signed in.'
          : 'Account created. Check email confirmation settings in Supabase if it does not sign in immediately.'
      );
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
    setAuthMessage(null);

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

  // Split title for styling (e.g. "Lower Back Pain" -> "Lower" and "Back Pain")
  const formatBigTitle = (title: string) => {
    const words = title.split(' ');
    if (words.length <= 1) {
      return (
        <span className="text-white">
          {title}
        </span>
      );
    }
    const firstWord = words[0];
    const restOfTitle = words.slice(1).join(' ');
    return (
      <>
        {firstWord}<br />
        <span className="text-indigo-500">{restOfTitle}</span>
      </>
    );
  };

  return (
    <div className="min-h-screen premium-bg text-white font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Premium High-Fidelity Background Layering */}
      <div className="absolute inset-0 glowing-bg-grid opacity-100 pointer-events-none z-0" />

      {/* Header Navigation with Real Glassmorphism */}
      <nav className="h-20 border-b border-white/10 flex items-center justify-between px-6 md:px-10 flex-shrink-0 bg-[#07080d]/60 backdrop-blur-xl sticky top-0 z-50 relative">
        <div 
          onClick={() => setActiveTab('dictionary')} 
          className="text-2xl font-black tracking-tighter not-italic cursor-pointer hover:opacity-95 transition-opacity flex items-center gap-2 font-display"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">Cure Your Life</span>
          <span className="bg-gradient-to-br from-red-500 to-rose-600 border border-red-400/30 text-white text-[11px] font-mono tracking-widest font-black uppercase px-2 py-0.5 rounded shadow-[0_0_15px_rgba(239,68,68,0.6)]">
            +
          </span>
        </div>
        
        <div className="hidden md:flex space-x-8 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 font-display">
          <button 
            onClick={() => setActiveTab('dictionary')}
            className={`cursor-pointer hover:text-white transition-all pb-1 ${activeTab === 'dictionary' ? 'text-indigo-400 border-b-2 border-indigo-500' : ''}`}
          >
            Psychosomatic Dictionary
          </button>
          <button 
            onClick={openDecoder}
            className={`cursor-pointer hover:text-white transition-all pb-1 ${activeTab === 'decoder' ? 'text-indigo-400 border-b-2 border-indigo-500' : ''}`}
          >
            AI Somatic Decoder
          </button>
          <button 
            onClick={() => setActiveTab('daily')}
            className={`cursor-pointer hover:text-white transition-all pb-1 ${activeTab === 'daily' ? 'text-indigo-400 border-b-2 border-indigo-500' : ''}`}
          >
            Somatic Reflections
          </button>
          <button 
            onClick={() => setActiveTab('journal')}
            className={`cursor-pointer hover:text-white transition-all pb-1 ${activeTab === 'journal' ? 'text-indigo-400 border-b-2 border-indigo-500' : ''}`}
          >
            Somatic Journal
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPaywall(true)}
            className={`px-4 py-2 font-bold uppercase text-[11px] tracking-widest transition-all rounded-xl cursor-pointer ${
              isPremium 
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105'
                : 'border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.08)] backdrop-blur-md'
            }`}
          >
            {isPremium ? '✦ Premium Active' : '✦ Unlock Premium'}
          </button>

          <button
            onClick={openDecoder}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold uppercase text-[11px] tracking-widest transition-all rounded-xl cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.25)]"
          >
            Analyze Symptom
          </button>
        </div>
      </nav>

      {/* Supabase Auth Strip */}
      <div className="border-b border-white/10 bg-black/45 backdrop-blur-xl px-6 md:px-10 py-3 relative z-40">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-400 font-black">
              Supabase Account Link
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {isSupabaseConfigured
                ? authUser
                  ? `Signed in as ${authUser.email || 'Supabase user'}`
                  : 'Not signed in. Premium can still run in DEV_PREMIUM mode.'
                : 'Frontend Supabase env missing.'}
            </span>
            {premiumStatus?.message && (
              <span className="text-[11px] text-slate-500 font-mono">
                Premium: {premiumStatus.source || 'unknown'} • {premiumStatus.isPremium ? 'active' : 'locked'}
              </span>
            )}
          </div>

          {authUser ? (
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="px-3 py-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-200 text-[11px] font-mono">
                <User className="inline w-3.5 h-3.5 mr-1" />
                {authUser.email}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={authLoading}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-[11px] uppercase tracking-widest font-black font-mono disabled:opacity-50"
              >
                Logout
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="email"
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 min-w-[190px]"
              />
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="password"
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 min-w-[160px]"
              />
              <button
                type="submit"
                disabled={authLoading || !isSupabaseConfigured}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] uppercase tracking-widest font-black font-mono disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? 'Working...' : 'Login / Create'}
              </button>
            </form>
          )}
        </div>

        {authMessage && (
          <div className="max-w-7xl mx-auto mt-2 text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
            {authMessage}
          </div>
        )}
      </div>

      {/* Mobile Nav Bar with Glassmorphism */}
      <div className="md:hidden flex border-b border-white/10 bg-[#07080d]/80 backdrop-blur-xl justify-around py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 relative z-40 font-display">
        <button 
          onClick={() => setActiveTab('dictionary')}
          className={`${activeTab === 'dictionary' ? 'text-indigo-400 font-extrabold' : ''}`}
        >
          Dictionary
        </button>
        <button 
          onClick={openDecoder}
          className={`${activeTab === 'decoder' ? 'text-indigo-400 font-extrabold' : ''}`}
        >
          AI Decoder
        </button>
        <button 
          onClick={() => setActiveTab('daily')}
          className={`${activeTab === 'daily' ? 'text-indigo-400 font-extrabold' : ''}`}
        >
          Reflections
        </button>
        <button 
          onClick={() => setActiveTab('journal')}
          className={`${activeTab === 'journal' ? 'text-indigo-400 font-extrabold' : ''}`}
        >
          Journal
        </button>
      </div>

      {/* Main Framework Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* Dictionary Tab: Contains side-by-side Body Map and glowing Symptom Explorer */}
        {activeTab === 'dictionary' && (
          <main className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto w-full space-y-8">
            
            {/* Global Disclaimer Banner */}
            <div className="bg-red-950/20 border border-red-500/25 p-5 md:px-6 rounded-2xl text-xs text-red-200 shadow-lg relative overflow-hidden backdrop-blur-md mb-2 shrink-0 w-full">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />
              <div className="flex gap-4.5 items-start">
                <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-red-400 block font-black">
                    CRITICAL MEDICAL STANDARDS & PHARMACEUTICAL REASSURANCE
                  </span>
                  <p className="leading-7 font-sans text-slate-300">
                    This psychosomatic map is for <strong>educational reflection and stress-pattern awareness only</strong>. It is not diagnostic and does not replace medical treatment. <strong>Under no circumstances should you discontinue, alter, or delay any prescribed medicine</strong> (including insulin, metformin, thyroid replacement, cardiovascular, or blood sugar therapies). Somatic healing complements physical medicine; it does not replace it.
                  </p>
                </div>
              </div>
            </div>

            {/* Intro Header with Gorgeous Gradient Text */}
            <div className="space-y-2 relative">
              <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest block font-black">
                PSYCHOSOMATIC INTUITIVE EXPLORER & CLINICAL DECODER ENCYCLOPEDIA
              </span>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-display leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                CURE YOUR LIFE<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">SYMPTOM EXPLORER+</span>
              </h1>
              <p className="text-sm md:text-base text-slate-400 max-w-2xl font-light leading-7">
                Discover the deep emotional truths, somatic metaphors, and physical warnings hidden behind your chronic aches, pains, and micro-malfunctions.
              </p>
            </div>

            {/* Big Central Command Bar */}
            <div className={`${selectedCategory ? "hidden" : ""} w-full max-w-4xl mx-auto mt-4 mb-6`}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setActiveTab('decoder');
                }}
                className="relative flex items-center p-1.5 rounded-full border border-indigo-500/35 bg-black/60 backdrop-blur-xl shadow-[0_0_30px_rgba(99,102,241,0.15)] group focus-within:border-indigo-400 focus-within:shadow-[0_0_40px_rgba(99,102,241,0.25)] transition-all duration-300"
              >
                {/* Background ambient pulse glow behind the command bar */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/5 to-purple-500/5 -z-10  group-hover:opacity-100 opacity-60 transition-opacity duration-500" />
                
                {/* Glowing Sparkles Icon */}
                <div className="flex items-center justify-center pl-4 pr-2.5 shrink-0">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-[pulse_2s_infinite]" />
                </div>

                {/* Input Field */}
                <input 
                  type="text"
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  placeholder="Enter your custom symptom to decode (e.g., sharp pain under right rib, tight jaw when stressed)..."
                  className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-[11px] md:text-xs py-3 focus:outline-none focus:ring-0 font-mono"
                />

                {/* Big Glowing Action Button */}
                <button
                  type="submit"
                  className="px-5 py-3 md:px-7 md:py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-mono text-[11px] md:text-xs font-black uppercase tracking-widest rounded-full cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] shrink-0"
                >
                  <span>Analyze Symptom</span>
                  <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/90 shrink-0" />
                </button>
              </form>
            </div>

            {/* Main Interactive Grid Layout */}
            <div className="w-full max-w-4xl mx-auto space-y-6">

              {/* Visual Somatic Grouping / Category Cards Grid */}
              <div className="space-y-3.5 relative">
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-indigo-400 uppercase tracking-wider font-black">
                  <Compass className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span>1. Choose Somatic Region Grouping</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  {categories.map(cat => {
                    const meta = CATEGORY_META[cat] || {
                      iconName: "Activity",
                      desc: "Explore psychosomatic connections for this system.",
                      color: "#6366f1",
                      glowColor: "rgba(99, 102, 241, 0.15)",
                      textClass: "text-indigo-400",
                      bgClass: "from-indigo-950/20 to-transparent",
                      borderClass: "border-indigo-500/20",
                      motif: "somatic connection pathways",
                      badge: "Priority"
                    };
                    const isSelected = selectedCategory === cat;
                    const count = cat === 'All' 
                      ? browsableAilments.length 
                      : browsableAilments.filter(a => a.category === cat).length;

                    // Get top 3 example symptoms in this category
                    const topSymptoms = cat === 'All'
                      ? browsableAilments.slice(0, 3)
                      : browsableAilments.filter(a => a.category === cat).slice(0, 3);

                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          if (selectedAilment && cat !== 'All' && selectedAilment.category !== cat) {
                            setSelectedAilment(null);
                          }
                        }}
                        className={`category-card text-left p-5 rounded-[1.6rem] transition-all duration-500 relative overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[220px] ${
                          isSelected 
                            ? '-translate-y-1.5 border-[var(--system-color)] bg-black/75 shadow-[0_0_50px_var(--system-glow),inset_0_0_20px_rgba(255,255,255,0.02)] scale-[1.03]' 
                            : 'border-white/5 bg-black/40 hover:bg-black/50 hover:-translate-y-1 hover:border-[var(--system-color)]/40'
                        }`}
                        style={{
                          '--system-color': meta.color,
                          '--system-glow': meta.glowColor,
                        } as React.CSSProperties}
                      >
                        {/* Premium Cinematic Sci-Fi Category Background Artwork */}
                        <CategoryBackground category={cat} isSelected={isSelected} color={meta.color} />

                        {/* Animated pulse line */}
                        <div className="absolute left-0 right-0 h-[1.5px] top-[40%] -translate-y-1/2 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div 
                            className="w-full h-full animate-pulse" 
                            style={{
                              background: `linear-gradient(90deg, transparent, ${meta.color}60, transparent)`
                            }}
                          />
                        </div>

                        {/* Card Header: Icon Shell & Symptoms Count */}
                        <div className="flex items-start justify-between w-full relative z-10">
                          {/* Big glowing icon shell */}
                          <div className="icon-shell flex items-center justify-center shrink-0">
                            {renderCategoryIcon(meta.iconName, "w-6 h-6", meta.color)}
                          </div>

                          {/* Symptom Count */}
                          <div className="flex flex-col items-end justify-center">
                            <span className="text-[11px] font-mono text-slate-500 font-bold tracking-wider group-hover:text-slate-400 transition-colors">
                              {count} {count === 1 ? 'SYMPTOM' : 'SYMPTOMS'}
                            </span>
                          </div>
                        </div>

                        {/* Card Body: Title & Description */}
                        <div className="space-y-3 relative z-10 w-full mt-4">
                          <div>
                            <h3 className={`text-base font-black uppercase tracking-tight font-display transition-colors ${
                              isSelected ? 'text-[var(--system-color)]' : 'text-white group-hover:text-[var(--system-color)]'
                            }`}>
                              {cat}
                            </h3>
                            <p className="text-[11px] text-[#8A94A6] line-clamp-3 leading-7 font-sans font-light mt-1.5 group-hover:text-slate-300 transition-colors">
                              {meta.desc}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Bar: Action/Enter Arrow */}
                        <div className="flex items-center justify-end w-full relative z-10 mt-3 pt-2.5 border-t border-white/[0.03]">
                          <div 
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                              isSelected 
                                ? 'bg-[var(--system-color)]/20 text-[var(--system-color)] border border-[var(--system-color)]/30 shadow-[0_0_12px_var(--system-glow)]' 
                                : 'bg-white/5 border border-white/5 text-slate-500 group-hover:text-white group-hover:bg-[var(--system-color)]/20 group-hover:border-[var(--system-color)]/40 group-hover:shadow-[0_0_12px_var(--system-glow)] group-hover:translate-x-1'
                            }`}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Symptom Explorer (glowing black glass cards & search) */}
              {selectedCategory === null ? (
                <div className="glass-panel p-10 md:p-12 rounded-[2.5rem] text-left space-y-4 relative z-10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.05)] border border-white/5 bg-black/40">
                  <Compass className="w-10 h-10 mx-auto text-indigo-400 animate-pulse mb-2" />
                  <h3 className="text-sm font-mono text-indigo-300 uppercase tracking-widest font-black">Select a somatic region center</h3>
                  <p className="text-xs text-[#8A94A6] max-w-md mx-auto leading-7 font-light font-sans">
                    Choose one of the somatic groupings above (such as <strong>Stomach & Gut</strong> or <strong>Chest & Breathing</strong>) to start decoding its psychosomatic mechanisms, or select <strong>All</strong> to explore the complete clinical dictionary.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">

                  {/* Selected Category Premium Header */}
                  {selectedCategory && (() => {
                    const meta = CATEGORY_META[selectedCategory] || { color: '#7C7CFF', desc: '' };
                    const activeColor = meta.color;
                    return (
                      <div 
                        className="relative rounded-[2.5rem] p-6 mb-4 overflow-hidden border transition-all duration-500 backdrop-blur-xl"
                        style={{ 
                          backgroundColor: 'rgba(5, 7, 11, 0.55)',
                          borderColor: `${activeColor}25`,
                          boxShadow: `0 0 35px ${activeColor}12`
                        }}
                      >
                        {/* High-intensity centered radial gradient glow that fades into the dark glass panel */}
                        <div 
                          className="absolute inset-0 pointer-events-none opacity-20 z-0"
                          style={{
                            background: `radial-gradient(circle at 50% 50%, ${activeColor} 0%, transparent 60%)`
                          }}
                        />

                        {/* Extra subtle overall ambient soft backdrop */}
                        <div 
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-[0.15] pointer-events-none"
                          style={{ backgroundColor: activeColor }}
                        />

                        <div className="relative z-10 flex flex-col items-center justify-center gap-6 text-center w-full">
                          <div className="space-y-3.5 flex flex-col items-center w-full">
                            <div className="flex items-center justify-center gap-3">
                              <span 
                                className="text-[11px] font-mono tracking-widest uppercase px-3 py-1 rounded-full font-black border transition-all duration-300"
                                style={{ 
                                  color: activeColor,
                                  borderColor: `${activeColor}40`,
                                  backgroundColor: `${activeColor}15`
                                }}
                              >
                                Somatic System
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                {filteredAilments.length} {filteredAilments.length === 1 ? 'Symptom' : 'Symptoms'} Found
                              </span>
                            </div>
                            <h2 
                              className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-display bg-clip-text text-transparent drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                              style={{ 
                                backgroundImage: `linear-gradient(to top, transparent -20%, #ffffff 80%)`,
                                WebkitTextStroke: `1.5px ${activeColor}80`
                              }}
                            >
                              {selectedCategory}
                            </h2>
                            <p className="text-xs md:text-sm text-slate-300 font-sans font-light leading-7 max-w-xl mx-auto">
                              {meta.desc}
                            </p>
                          </div>
                          
                          {/* Current Active Lens indicator */}
                          

                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Search, Global Tone, Category Toggles Header Bar */}
                  <div className={`${selectedCategory ? "hidden" : ""} glass-panel p-6 md:p-8 rounded-[2.5rem] space-y-6 relative z-10`}>
                    
                    {/* Search Input */}
                    <div className="relative font-mono">
                      <Search className="w-4 h-4 text-indigo-400 absolute left-4 top-4" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search symptoms (e.g. diabetes, fatigue, IBS, tightness, headaches, eczema)..." 
                        className="w-full bg-black/40 text-white placeholder-slate-500 text-xs px-11 py-4 rounded-xl border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono shadow-inner"
                      />
                      {searchQuery && (
                        <button 
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-4 top-3.5 text-slate-500 hover:text-white text-[11px] font-bold"
                        >
                          CLEAR
                        </button>
                      )}
                    </div>

                    {/* Viewing Lens selector removed */}


                    {/* Category Filter Chips */}
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`text-[10px] font-mono tracking-widest uppercase px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                            selectedCategory === cat 
                              ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/50 text-indigo-200 font-extrabold shadow-[0_0_15px_rgba(99,102,241,0.25)]' 
                              : 'bg-black/30 border-white/5 text-slate-400 hover:text-white hover:border-white/15'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Symptom Accordion List container */}
                  <div className="space-y-4">
                    {filteredAilments.length === 0 ? (
                      <div className="bg-zinc-950/40 p-12 text-left rounded-3xl border border-white/10 border-dashed space-y-3">
                        <AlertCircle className="w-12 h-12 mx-auto text-indigo-500/50" />
                        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest">No matching ailments found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          We are constantly expanding the database. Try selecting another category or check your spelling.
                        </p>
                      </div>
                    ) : (
                      filteredAilments.map(ailment => {
                        const isSelected = selectedAilment?.id === ailment.id;
                        return (
                          <AilmentAccordionItem
                            key={ailment.id}
                            ailment={ailment}
                            isSelected={isSelected}
                            onSelect={() => setSelectedAilment(isSelected ? null : ailment)}
                            globalTone={globalTone}
                            onJournalRedirect={() => setActiveTab('journal')}
                          />
                        );
                      })
                    )}
                  </div>

                </div>
              )}

            </div>
          </main>
        )}

        {/* Decoder Tab: Custom AI Symptom Input */}
        {activeTab === 'decoder' && (
          <main className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto max-w-5xl mx-auto w-full space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs tracking-widest uppercase">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>AI Somatic Diagnostic Lab</span>
              </div>
              <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter">
                Symptom<br />
                <span className="text-indigo-500">Decoder</span>
              </h1>
              <p className="text-base text-slate-400 max-w-2xl leading-7 font-light">
                Can't find your specific aches in our dictionary? Enter your customized physical misery and let Dr. Sarcasticus diagnose your subconscious fears and poor ergonomic life choices in real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form */}
              <div className="lg:col-span-5 bg-[#07090E] p-6 rounded-[2rem] border border-white/10 relative overflow-hidden shadow-2xl space-y-6">
                <div className="absolute top-0 left-1/4 w-48 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest pb-3 border-b border-[#1E2430] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Input Lab Specimen</span>
                </h3>
                
                <form onSubmit={handleDecodeSymptom} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="custom-symptom-input" className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      1. Describe your physical ailment *
                    </label>
                    <textarea
                      id="custom-symptom-input"
                      required
                      rows={3}
                      value={customSymptom}
                      onChange={(e) => setCustomSymptom(e.target.value)}
                      placeholder="e.g. Sharp throbbing pain behind my right eyeball, or unexplained clicking in my left pinky finger..."
                      className="w-full bg-[#040609] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all font-sans resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="custom-habits-input" className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      2. Honestly describe your bad habits (optional)
                    </label>
                    <textarea
                      id="custom-habits-input"
                      rows={3}
                      value={customHabits}
                      onChange={(e) => setCustomHabits(e.target.value)}
                      placeholder="e.g. Sitting cross-legged for 9 hours without moving, drank 4 coffees and 0 waters today, obsessively checking my ex's Instagram..."
                      className="w-full bg-[#040609] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all font-sans resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isDecoding || !customSymptom.trim()}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold uppercase text-xs tracking-widest py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isDecoding ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                        <span>Consulting Dr. Sarcasticus...</span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4 text-amber-300" />
                        <span>Run Psychosomatic Decode</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 flex gap-3 items-start">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-[11px] text-amber-400/90 leading-7 font-mono">
                    DISCLAIMER: Dr. Sarcasticus is an AI assistant model. His insights are psychosomatically deep and medically accurate, but do not replace your actual real-life doctor if your body is actively complaining of emergency malfunctions.
                  </p>
                </div>
              </div>

              {/* Right Column: Decoded Output Result */}
              <div className="lg:col-span-7">
                <AnimatePresence mode="wait">
                  {isDecoding && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-[#07090E] p-8 rounded-[2rem] border border-white/10 relative overflow-hidden flex flex-col items-center text-left space-y-6 shadow-2xl min-h-[420px] justify-center"
                    >
                      {/* Interactive MRI-like scanner visual */}
                      <div className="relative w-40 h-40 border border-indigo-500/20 rounded-2xl bg-black/40 p-4 flex items-center justify-center overflow-hidden">
                        {/* Laser line moving up and down */}
                        <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] animate-[bounce_2.5s_infinite] top-0 z-20" />
                        
                        {/* Dynamic Grid Background */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00d2ff08_1px,transparent_1px),linear-gradient(to_bottom,#00d2ff08_1px,transparent_1px)] bg-[size:10px_10px]" />
                        
                        {/* Wireframe Silhouette */}
                        <svg viewBox="0 0 100 100" className="w-24 h-24 opacity-30 text-indigo-400">
                          <circle cx="50" cy="22" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
                          <line x1="50" y1="32" x2="50" y2="70" stroke="currentColor" strokeWidth="1" />
                          <line x1="50" y1="42" x2="30" y2="35" stroke="currentColor" strokeWidth="1" />
                          <line x1="50" y1="42" x2="70" y2="35" stroke="currentColor" strokeWidth="1" />
                          <line x1="50" y1="70" x2="38" y2="92" stroke="currentColor" strokeWidth="1" />
                          <line x1="50" y1="70" x2="62" y2="92" stroke="currentColor" strokeWidth="1" />
                        </svg>
                        
                        {/* Pulsing Core */}
                        <div className="absolute w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400 animate-ping" />
                      </div>

                      <div className="space-y-2">
                        <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-black block animate-pulse">
                          🔬 CONNECTING SUBCONSCIOUS TRACE PROBES...
                        </span>
                        <p className="text-xs text-slate-400 not-italic max-w-sm mx-auto font-sans font-light">
                          "Analyzing the exact physiological intersection of your modern emotional suppression and sitting folded up like a raw lasagna sheet."
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {decodeError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-red-500/10 p-6 rounded-2xl border border-red-500/30 space-y-3"
                    >
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <h4 className="font-mono text-sm font-bold uppercase tracking-wider">Diagnostic Interrupted</h4>
                      </div>
                      <p className="text-xs text-red-300 leading-7 font-mono">
                        {decodeError}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Note: Make sure your GEMINI_API_KEY environment variable is configured in the AI Studio platform Secrets dashboard.
                      </p>
                    </motion.div>
                  )}

                  {!isDecoding && !decodedResult && !decodeError && (
                    <div className="bg-[#07090E] border border-white/5 p-12 rounded-[2.5rem] text-left space-y-4 shadow-2xl min-h-[420px] flex flex-col justify-center items-center">
                      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <HelpCircle className="w-8 h-8 text-slate-600" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest font-bold">Awaiting Lab Specimen</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans font-light">
                          Your somatic scan report will generate here once you enter your physical ailment and current lifestyle habits in the scanner console on the left.
                        </p>
                      </div>
                    </div>
                  )}

                  {!isDecoding && decodedResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-6"
                    >
                      {/* High-fidelity lab-report-style banner */}
                      <div className="p-6 bg-gradient-to-b from-[#0A0D14] to-[#040609] border border-indigo-500/20 rounded-[2rem] space-y-4 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-[11px] font-mono text-cyan-400 tracking-widest uppercase font-black">
                              SOMATIC LAB REPORT COMPLETED
                            </span>
                          </div>
                          
                          {/* Biometric Stats bar */}
                          <div className="flex gap-4 font-mono text-[8px] text-slate-500 uppercase tracking-wider">
                            <span>COEFF: 0.96</span>
                            <span>DENIAL: CRITICAL</span>
                            <span>DEC-ID: #{Math.floor(Math.random() * 9000 + 1000)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-start gap-4 pt-1">
                          {renderHolographicFace()}
                          
                          <div className="space-y-1.5 flex-1">
                            <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider block font-black">
                              CORE SUBCONSCIOUS EMOTIONAL MATRIX
                            </span>
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white leading-none">
                              The Metaphorical Root Cause
                            </h2>
                            <p className="text-xs text-slate-200 leading-7 not-italic font-light">
                              "{decodedResult.emotionalRoot}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Side-by-side Technical and Sarcastic results */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Clinical */}
                        <div className="bg-[#07090E] p-5 border border-indigo-500/20 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[180px] space-y-3">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                          
                          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-400 font-black">PHYSIOLOGICAL MECHANISM</span>
                          </div>
                          
                          <p className="text-xs text-slate-300 leading-7 font-sans font-light flex-1">
                            {decodedResult.physiologicalDescription}
                          </p>
                          
                          <div className="text-[8px] font-mono text-slate-500 uppercase">
                            DIAGNOSTICS: PROFESSIONAL / MEDICAL TRUTH
                          </div>
                        </div>

                        {/* Dr. Sarcasticus verdict speech bubble card */}
                        <div className="bg-gradient-to-br from-[#110B03] to-[#040609] p-5 border border-amber-500/20 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[180px] space-y-3">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                          
                          <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-black">DR. SARCASTICUS VERDICT</span>
                            </div>
                            <span className="text-[8px] font-mono text-amber-500/70 uppercase">Cynical Mode</span>
                          </div>

                          <div className="flex gap-3 items-start flex-1 py-1">
                            {renderSarcasticusAvatar()}
                            <div className="p-3 bg-[#040609] border border-amber-500/10 rounded-xl flex-1 text-xs text-amber-300 leading-7 font-sans not-italic relative">
                              <div className="absolute left-[-5px] top-6 w-2.5 h-2.5 bg-[#040609] border-l border-b border-amber-500/10 transform rotate-45" />
                              "{decodedResult.sarcasticReview}"
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recommendations block */}
                      <div className="p-6 bg-[#07090E] border border-white/5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6 shadow-xl">
                        {/* Prompt reflection */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] font-mono uppercase tracking-wider font-black">
                            <Compass className="w-4 h-4 text-indigo-400" />
                            <span>Recommended Reflections</span>
                          </div>
                          <ul className="space-y-2.5">
                            {decodedResult.mindfulnessPrompts.map((p, idx) => (
                              <li key={idx} className="text-xs text-slate-300 pl-3 border-l border-indigo-500/30 not-italic font-sans font-light leading-7">
                                "{p}"
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Somatic exercises */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 text-amber-500 text-[11px] font-mono uppercase tracking-wider font-black">
                            <Dumbbell className="w-4 h-4 text-amber-500" />
                            <span>Somatic Recovery Exercises</span>
                          </div>
                          <ul className="space-y-2">
                            {decodedResult.practicalTips.map((t, idx) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-7 font-sans font-light">
                                <span className="text-indigo-400 font-mono font-bold shrink-0">[{idx+1}]</span>
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] font-mono text-slate-500">
                          CYL-SCANNER VERSION: v4.12 | CALIBRATION SECURE
                        </span>
                        
                        <button
                          onClick={() => {
                            setDecodedResult(null);
                            setCustomSymptom('');
                            setCustomHabits('');
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 border border-white/10 text-[10px] text-slate-400 hover:text-white hover:border-white font-mono tracking-widest uppercase rounded-lg bg-white/5 transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Decoder</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </main>
        )}

        {/* Reflections / Daily Prompt tab */}
        {activeTab === 'daily' && (
          <main className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto max-w-5xl mx-auto w-full space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">
                SUBCONSCIOUS TRACE RECORDS
              </span>
              <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter">
                Somatic<br />
                <span className="text-indigo-500">Reflections</span>
              </h1>
              <p className="text-base text-slate-400 max-w-xl font-light">
                Write, process, and release the tension. Every symptom is a message your body is tired of whispering.
              </p>
            </div>
            
            <div className="pt-4">
              <DailyPromptsPanel />
            </div>
          </main>
        )}

        {/* Somatic Journaling Tab */}
        {activeTab === 'journal' && (
          <main className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto w-full space-y-6">
            <div className="space-y-2 max-w-6xl mx-auto w-full">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">
                SOMATIC TRACE LEDGER
              </span>
              <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter">
                Somatic<br />
                <span className="text-indigo-500">Journal</span>
              </h1>
              <p className="text-base text-slate-400 max-w-xl font-light">
                Log physical symptoms, note down daily stressors, and instantly decode your psychosomatic connections.
              </p>
            </div>
            
            <div className="pt-4">
              <SomaticJournalPanel />
            </div>
          </main>
        )}

      </div>

      {/* Monetization & Premium Access Paywall Modal */}
      <AnimatePresence>
        {showPaywall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#07090E] border border-amber-500/30 rounded-3xl w-full max-w-2xl overflow-hidden relative shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col"
            >
              {/* Gold Top Light bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
              
              {/* Close Button */}
              <button
                onClick={() => setShowPaywall(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 md:p-8 space-y-6">
                
                {/* Header */}
                <div className="space-y-1.5 text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] font-mono text-amber-400 uppercase tracking-widest font-black mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cure Your Life+ Premium Elite</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none">
                    Unlock Premium <span className="text-amber-400">Homeostasis</span>
                  </h2>
                  <p className="text-xs text-slate-400 max-w-md mx-auto font-sans font-light">
                    Connect unrestricted AI somatic decoding, deep stress reflection logs, and secure symptom pattern analysis.
                  </p>
                </div>

                {/* Features list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex gap-3">
                    <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono text-white font-bold block">Unlimited AI Decodes</span>
                      <p className="text-[11px] text-slate-400 leading-7 font-sans font-light">Deep AI cellular analysis with unlimited customized symptom decoding.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex gap-3">
                    <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono text-white font-bold block">Bi-Lateral Bio-Resets</span>
                      <p className="text-[11px] text-slate-400 leading-7 font-sans font-light">Comprehensive paced breathing regulator and somatic coping exercises.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex gap-3">
                    <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono text-white font-bold block">Premium AI Somatic Logs</span>
                      <p className="text-[11px] text-slate-400 leading-7 font-sans font-light">Comprehensive somatic trace ledger and health metrics tracking.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex gap-3">
                    <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono text-white font-bold block">Bi-Lateral Tone Models</span>
                      <p className="text-[11px] text-slate-400 leading-7 font-sans font-light">Compare Clinical, Sarcastic, and Brutal tone perspectives instantly.</p>
                    </div>
                  </div>
                </div>

                {/* Architecture & Monetization Realities Explanation */}
                <div className="p-4 bg-[#110B03] border border-amber-500/20 rounded-2xl space-y-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-amber-500 font-mono font-bold uppercase">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Monetization & billing Integration</span>
                  </div>
                  <p className="text-slate-300 leading-7 font-sans font-light">
                    For production apps, monetization is handled based on deployment targets:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400 font-sans font-light">
                    <li>
                      <strong>Google Play Store Apps (Android)</strong>: Purchases use the <code>com.android.billingclient</code> Play Billing Library API. Users pay securely via credit cards or Google Play balance synced with the OS layer.
                    </li>
                    <li>
                      <strong>Web Applications (SaaS)</strong>: Stripe API integration with secure server-side webhook listener proxies (using <code>stripe.webhooks.constructEvent</code>) safely manages subscriber lifetimes.
                    </li>
                  </ul>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  {/* SIMULATION ACCESS TRIGGERS */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={async () => {
                        setBillingMessage(null);
                        try {
                          const response = await authFetch('/api/billing/create-checkout-session', { method: 'POST' });
                          const data = await response.json();
                          setBillingMessage(data.message || data.error || 'Checkout endpoint responded.');
                          if (data.checkoutUrl && response.ok) {
                            window.location.href = data.checkoutUrl;
                          }
                        } catch (error: any) {
                          setBillingMessage(error.message || 'Checkout request failed.');
                        }
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-black uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-black" />
                      <span>{isPremium ? 'Open Checkout / Manage Premium' : 'Start Checkout'}</span>
                    </button>

                    <button
                      onClick={async () => {
                        setShowBillingInfo(!showBillingInfo);
                        setBillingMessage(null);
                        try {
                          const response = await authFetch('/api/billing/create-portal-session', { method: 'POST' });
                          const data = await response.json();
                          setBillingMessage(data.message || data.error || 'Billing portal endpoint responded.');
                        } catch (error: any) {
                          setBillingMessage(error.message || 'Billing portal request failed.');
                        }
                      }}
                      className="px-5 py-3 border border-amber-500/30 hover:border-amber-500/60 bg-white/5 hover:bg-white/10 text-amber-400 font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{showBillingInfo ? 'Hide Pay Info' : 'Live Pay Info'}</span>
                    </button>
                  </div>

                  {billingMessage && (
                    <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-[11px] text-cyan-200/90 leading-7 font-mono">
                      {billingMessage}
                    </div>
                  )}

                  {showBillingInfo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-[11px] text-amber-200/90 leading-7 font-mono"
                    >
                      <p className="font-bold">🔒 LIVE BILLING INTEGRATION SPECIFICATIONS:</p>
                      <p>
                        For production SaaS deployments, this component integrates with server-side endpoints processing Stripe checkout tokens. For Android packaging, it maps to the Google Play Billing Library (<code>billingclient</code>) triggering local operating-system payment dialogs securely.
                      </p>
                    </motion.div>
                  )}

                  <p className="text-left text-[10px] text-slate-500 font-mono">
                    Secured by AES-256 and SHA-256 protocols. Cancel anytime instantly.
                  </p>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Safety & Legal Disclaimer Footer */}
      <footer className="border-t border-white/10 bg-black/60 py-6 px-6 md:px-10 text-[11px] text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-4xl">
            <span className="text-red-400 font-black uppercase tracking-wider block">
              ⚠ CRITICAL EDUCATIONAL & MEDICAL DISCLOSURE
            </span>
            <p className="leading-7">
              This app does not diagnose, treat, or cure disease. It explains possible mind-body patterns and lifestyle-related mechanisms for educational reflection. Always consult a licensed medical professional for diagnosis, medication, labs, and treatment.
            </p>
            <p className="text-red-400/80 font-bold">
              Do not stop insulin, metformin, GLP-1 medication, or any prescribed treatment based on this app.
            </p>
          </div>
          <div className="shrink-0 text-slate-600 text-[10px] md:text-right">
            <span>© {new Date().getFullYear()} Cure Your Life+. Educational Reflection Protocol.</span>
            <br />
            <span>Not a substitute for medical diagnostics or therapeutics.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
