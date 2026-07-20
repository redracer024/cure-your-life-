function AilmentAccordionItem({ ailment, isSelected, onSelect, globalTone, onJournalRedirect }: AilmentAccordionItemProps) {
  const enriched = getEnrichedAilment(ailment);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(0);
  const [innerTab, setInnerTab] = useState<'biology' | 'tones' | 'influence' | 'reset' | 'safety'>('safety');
  const [localTone, setLocalTone] = useState<'clinical' | 'witty' | 'brutal'>(globalTone);
  const [isDisclaimerExpanded, setIsDisclaimerExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardData = getCardPatterns(enriched.name, enriched.id, enriched);
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
      className={`scroll-mt-36 rounded-2xl transition-all duration-500 overflow-hidden relative z-10 border group ${
        isSelected 
          ? 'glass-panel-heavy -translate-y-1' 
          : 'glass-panel-interactive border-transparent'
      }`}
      style={{
        borderColor: isSelected ? `${categoryMeta.color}70` : undefined,
        boxShadow: isSelected ? `0 0 30px ${categoryMeta.color}15` : undefined,
        '--symptom-card-image': `url(${getCategoryImage(enriched.category)})`,
      } as React.CSSProperties}
    >
      {/* Dynamic soft left category color fade/glow overlay */}
      <div 
        className={`absolute inset-y-0 left-0 w-64 pointer-events-none transition-all duration-500 z-0 ${
          isSelected ? 'opacity-[0.24]' : 'opacity-[0.18] group-hover:opacity-[0.24]'
        }`}
        style={{
          background: `linear-gradient(to right, ${categoryMeta.color}35, transparent)`
        }}
      />
      {/* Accordion Trigger Header */}
      <button
        type="button"
        onClick={() => { triggerHapticPattern(getSymptomHapticPattern(enriched)); onSelect(); }}
        className="w-full text-left py-4 md:py-5 px-5 md:px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.02] transition-all duration-300 cursor-pointer group relative overflow-hidden"
      >
        {/* Real category image layers for symptom result cards */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <img
            src={getCategoryImage(enriched.category)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-90 blur-[6px] scale-[1.12] saturate-150 contrast-125 brightness-125 transition-all duration-700 group-hover:opacity-100 group-hover:scale-[1.16]"
          />
          <img
            src={getCategoryImage(enriched.category)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-70 saturate-125 contrast-110 brightness-110 transition-all duration-700 group-hover:opacity-90"
            style={{
              WebkitMaskImage: "radial-gradient(circle at 58% 48%, rgba(0,0,0,1) 0%, rgba(0,0,0,.75) 34%, rgba(0,0,0,.22) 68%, rgba(0,0,0,0) 100%)",
              maskImage: "radial-gradient(circle at 58% 48%, rgba(0,0,0,1) 0%, rgba(0,0,0,.75) 34%, rgba(0,0,0,.22) 68%, rgba(0,0,0,0) 100%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05070b]/72 via-[#05070b]/24 to-[#05070b]/32" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/24 via-transparent to-black/5" />
        </div>

        {/* Subtle decorative background glow to make the entry feel cinematic */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />

        <div className="space-y-1 flex-1 w-full relative z-10">
          {/* Symptom Name */}
          <h3 
            className={`text-2xl md:text-4xl font-black uppercase tracking-tight transition-all leading-tight bg-clip-text text-transparent ${
              isSelected ? '' : 'group-hover:opacity-100 opacity-90'
            }`}
            style={{ 
              backgroundImage: `linear-gradient(90deg, ${categoryMeta.color} 0%, transparent 120%)` 
            }}
          >
            {enriched.name}
          </h3>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {enriched.tags?.slice(0, 3).map(t => (
              <span key={t} className="text-[8px] font-mono text-[#8A94A6]/80 bg-white/[0.03] border border-white/5 px-1.5 py-0.5 rounded-md">
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Right column with clear "Decode" button */}
        <div className="flex items-center gap-4 md:gap-5 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0 relative z-10">

          {/* Clear "Decode Signal" Pill Button */}
          <div className="flex flex-col items-center gap-1 select-none shrink-0 min-w-[125px]">
            <div className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 border text-[11px] font-mono font-black uppercase tracking-widest ${
              isSelected 
                ? 'bg-gradient-to-r from-slate-950 to-black border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:bg-white/10' 
                : 'bg-black/40 border-white/10 text-slate-400 group-hover:border-white/25 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98]'
            }`}>
              <span>{isSelected ? 'Close Panel' : 'Decode Signal'}</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-500 ${
                isSelected ? 'transform rotate-180' : 'group-hover:translate-x-0.5'
              }`} />
            </div>
          </div>
        </div>
      </button>

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
            {renderAnatomicalSilhouette(enriched.category, categoryMeta.color)}

            <div className="p-6 md:p-8 space-y-6 relative z-10">
              {/* Option Cards */}
              <div ref={optionsRef} className="scroll-mt-28 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {([
                  {
                    key: 'safety',
                    image: '/tab-art/safety.png',
                    label: 'Safety',
                    sub: 'Red flags first',
                    tone: 'from-red-950/45 via-black/70 to-black/80',
                    border: 'border-red-500/25',
                    glow: 'shadow-[0_0_28px_rgba(239,68,68,0.14)]',
                  },
                  {
                    key: 'tones',
                    image: '/tab-art/interpretations.png',
                    label: 'Interpretations',
                    sub: 'Clinical, witty, brutal',
                    tone: 'from-purple-950/35 via-black/70 to-black/80',
                    border: 'border-purple-500/25',
                    glow: 'shadow-[0_0_28px_rgba(168,85,247,0.14)]',
                  },
                  {
                    key: 'influence',
                    image: '/tab-art/influence.png',
                    label: 'Influence',
                    sub: 'Eastern + symbolic map',
                    tone: 'from-amber-950/35 via-black/70 to-black/80',
                    border: 'border-amber-500/25',
                    glow: 'shadow-[0_0_28px_rgba(245,158,11,0.14)]',
                  },
                  {
                    key: 'reset',
                    image: '/tab-art/reset.png',
                    label: 'Reset',
                    sub: '2-minute practice',
                    tone: 'from-emerald-950/35 via-black/70 to-black/80',
                    border: 'border-emerald-500/25',
                    glow: 'shadow-[0_0_28px_rgba(16,185,129,0.14)]',
                  },
                ] as const).map((option) => {
                  const active = innerTab === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => goToTab(option.key)}
                      className={`group relative overflow-hidden text-left rounded-[1.6rem] border h-[190px] md:h-[215px] transition-all duration-300 cursor-pointer bg-black/70 ${
                        active
                          ? `${option.border} ${option.glow} -translate-y-1 scale-[1.015]`
                          : 'border-white/10 hover:border-white/25 hover:-translate-y-0.5'
                      }`}
                    >
                      <img
                        src={option.image}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover opacity-95 saturate-125 contrast-110 brightness-95 transition-transform duration-700 group-hover:scale-110"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/0" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.12),transparent_28%)] pointer-events-none" />
                      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[1.6rem] pointer-events-none" />

                      {option.key === 'safety' && enriched.medical_safety?.critical_alerts?.length > 0 && (
                        <span className="absolute top-4 right-4 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500" />
                        </span>
                      )}

                      <div className="absolute inset-x-0 bottom-0 z-10 p-4 md:p-5">
                        <div className="text-sm md:text-base font-mono font-black uppercase tracking-[0.18em] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]">
                          {option.label}
                        </div>
                        <div className="text-[10px] md:text-[11px] text-slate-200/90 mt-1 font-mono uppercase tracking-wider">
                          {option.sub}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div className="min-h-[120px]">
                <AnimatePresence mode="wait">
                  {false && innerTab === 'biology' && (
                    <motion.div
                      key="biology"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="bg-black/30 border border-white/10 p-6 rounded-3xl space-y-5">
                        <div className="flex items-center justify-between font-mono pb-2 border-b border-white/10">
                          <div className="flex items-center gap-1.5 text-[11px] text-[#00D2FF] uppercase font-black">
                            <Activity className="w-4 h-4 text-[#00D2FF]" />
                            <span>Biological Breakdown Pathway</span>
                          </div>
                          <span className="text-[8px] text-[#8A94A6] font-bold">TAP ANY STAGE TO ISOLATE MECHANISM</span>
                        </div>

                        <div className="relative flex flex-col lg:flex-row items-stretch justify-between gap-4 py-4 px-2">
                          <div className="absolute top-[34px] left-[5%] right-[5%] h-[1px] bg-indigo-500/20 border-t border-dashed border-indigo-500/30 hidden lg:block pointer-events-none" />

                          {enriched.biologyPath.map((node, index) => {
                            const isActive = activeNodeIndex === index;
                            return (
                              <button
                                type="button"
                                key={index}
                                onClick={() => setActiveNodeIndex(index)}
                                className={`flex flex-col items-center text-left p-5 rounded-2xl border transition-all duration-500 flex-1 relative z-10 group cursor-pointer focus:outline-none ${
                                  isActive 
                                    ? 'bg-gradient-to-b from-[#00D2FF]/10 to-transparent border-[#00D2FF]/50 shadow-[0_0_20px_rgba(0,210,255,0.15)] scale-[1.02]' 
                                    : 'bg-white/[0.02] border-white/5 hover:border-indigo-500/30'
                                }`}
                              >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-black border transition-all duration-300 mb-3 ${
                                  isActive 
                                    ? 'bg-[#00D2FF] text-black border-white shadow-[0_0_15px_rgba(0,210,255,0.5)]' 
                                    : 'bg-black text-[#8A94A6] border-white/10 group-hover:border-indigo-400 group-hover:text-white'
                                }`}>
                                  {index + 1}
                                </div>
                                
                                <div className="space-y-1">
                                  <span className={`text-xs font-mono tracking-wide uppercase font-black block transition-colors ${
                                    isActive ? 'text-[#00D2FF]' : 'text-[#E6ECF3] group-hover:text-white'
                                  }`}>
                                    {node.title}
                                  </span>
                                  <span className="text-[11px] text-[#8A94A6] block leading-7 font-sans font-light">
                                    {node.description}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeNodeIndex}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="p-5 md:p-6 bg-gradient-to-br from-white/[0.055] via-black/55 to-black/75 border border-white/10 rounded-[1.45rem] space-y-3 shadow-[inset_0_0_24px_rgba(255,255,255,0.025),0_0_30px_rgba(0,0,0,0.35)] backdrop-blur-sm"
                          >
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#00D2FF] uppercase font-bold">
                              <span className="w-2 h-2 rounded-full bg-[#00D2FF] animate-pulse" />
                              <span>STEP {activeNodeIndex + 1} DEEP CELLULAR INSIGHT: {enriched.biologyPath[activeNodeIndex]?.title}</span>
                            </div>
                            <div className="text-sm text-[#E6ECF3] leading-7 font-sans font-light">
                              <TruncatedText text={softenMedicalClaims(enriched.biologyPath[activeNodeIndex]?.expandedDetails)} maxLen={1200} />
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}

                  {innerTab === 'tones' && (
                    <motion.div
                      key="tones"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between font-mono pb-2 border-b border-white/10">
                        <div className="flex items-center gap-1.5 text-[11px] text-purple-400 uppercase font-black">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span>Somatic Tone Perspectives</span>
                        </div>
                        <span className="text-[8px] text-[#8A94A6] font-bold hidden sm:block">ALL THREE TONES AVAILABLE FOR COMPARISON</span>
                      </div>

                      <div className="grid grid-cols-1 gap-6 items-stretch">
                        {/* Card 1: Clinical (Blue theme) */}
                        <div className="bg-gradient-to-br from-blue-950/35 via-black/80 to-[#05070B] border border-blue-400/25 hover:border-blue-300/45 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-6 shadow-[0_0_45px_rgba(59,130,246,0.13)] transition-all duration-300 premium-3d-card hover:scale-[1.018] hover:shadow-[0_0_55px_rgba(59,130,246,0.18)] group relative overflow-hidden backdrop-blur-xl">
                          <div className="absolute -right-12 -top-12 w-28 h-28 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                          
                          <div className="space-y-4 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono tracking-widest text-[#00D2FF] bg-blue-950/40 border border-blue-500/20 px-3 py-1 rounded-full uppercase font-black shadow-[0_0_18px_rgba(255,255,255,0.05)]">
                                  
                                </span>
                              </div>
                              <span className="text-[8px] font-mono text-slate-500">BIOLOGY & SCIENCE</span>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-sm font-black text-white uppercase tracking-tight font-display">Anatomical System Mechanism</h4>
                              <div className="text-sm text-[#E6ECF3] bg-white/[0.035] border border-white/10 p-5 md:p-6 rounded-[1.35rem] font-mono shadow-[inset_0_0_22px_rgba(255,255,255,0.025)] backdrop-blur-sm">
                                <TruncatedText text={softenMedicalClaims(enriched.tones?.clinical.mechanism || enriched.physiologicalDescription)} maxLen={720} />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] font-mono text-[#00D2FF] uppercase font-bold block">Intervention Checklist</span>
                              <ul className="space-y-2">
                                {(enriched.tones?.clinical.protocol || [enriched.physicalTherapyTip]).map((step, idx) => (
                                  <li key={idx} className="text-sm text-[#E6ECF3] leading-7 flex items-start gap-2 pl-1 font-sans font-light">
                                    <span className="text-[#00D2FF] font-bold mt-0.5">✔</span>
                                    <span className="block flex-1"><TruncatedText text={softenMedicalClaims(step)} maxLen={900} /></span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-white/10 space-y-2 shrink-0">
                            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                              MEDICAL SOURCE CITATIONS
                            </span>
                            <div className="space-y-1">
                              {(enriched.tones?.clinical.citations || [
                                 "Somatic Medicine & Biofeedback Journal (Vol 14, Issue 2)",
                                 "Review of Psychosomatic Fascial Guarding Patterns (2023)"
                              ]).map((citation, idx) => (
                                <div key={idx} className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 truncate">
                                  <BookOpen className="w-3 h-3 text-slate-600 shrink-0" />
                                  <span className="truncate">{citation}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Card 2: Witty (Purple/Indigo theme) */}
                        <div className="bg-gradient-to-br from-purple-950/35 via-black/80 to-[#05070B] border border-purple-400/25 hover:border-purple-300/45 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-6 shadow-[0_0_45px_rgba(168,85,247,0.13)] transition-all duration-300 premium-3d-card hover:scale-[1.018] hover:shadow-[0_0_55px_rgba(168,85,247,0.18)] group relative overflow-hidden backdrop-blur-xl">
                          <div className="absolute -right-12 -top-12 w-28 h-28 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />

                          <div className="space-y-4 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono tracking-widest text-[#B15CFF] bg-indigo-950/40 border border-indigo-500/20 px-3 py-1 rounded-full uppercase font-black shadow-[0_0_18px_rgba(255,255,255,0.05)]">
                                  
                                </span>
                              </div>
                              <span className="text-[8px] font-mono text-slate-500">CHAOS WAREHOUSE</span>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-sm font-black text-white uppercase tracking-tight font-display">
                                {enriched.tones?.witty.metaphorTitle || "The Internal Defense Guard"}
                              </h4>
                              <div className="text-sm text-[#E6ECF3] not-italic bg-black/40 border border-white/5 p-5 md:p-6 rounded-2xl font-sans">
                                <TruncatedText text={softenMedicalClaims(enriched.tones?.witty.metaphorText || enriched.metaphor)} maxLen={720} />
                              </div>
                            </div>

                            {enriched.tones?.witty.visualWarehouseDescription && (
                              <div className="p-4 bg-black/40 rounded-xl border border-indigo-500/10 text-[11px] text-[#B15CFF] leading-7 font-mono">
                                <span className="text-[8px] text-[#8A94A6] font-bold block mb-1">SYSTEM SCHEMATIC:</span>
                                <TruncatedText text={softenMedicalClaims(enriched.tones.witty.visualWarehouseDescription)} maxLen={900} />
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t border-white/10 flex gap-3 items-start shrink-0 font-sans">
                            <Sparkles className="w-5 h-5 text-[#B15CFF] shrink-0 mt-0.5 animate-pulse" />
                            <div className="space-y-1 w-full overflow-hidden">
                              <span className="text-[8px] font-mono text-slate-500 uppercase font-bold">DR. SARCASTICUS REVELATION</span>
                              <div className="text-[11px] text-[#E6ECF3] leading-7 font-sans font-light">
                                <TruncatedText text={softenMedicalClaims(enriched.tones?.witty.wittyAdvice || enriched.sarcasticAdvice)} maxLen={520} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card 3: Brutal (Red theme) */}
                        <div className="bg-gradient-to-br from-red-950/35 via-black/80 to-[#05070B] border border-red-400/25 hover:border-red-300/45 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-6 shadow-[0_0_45px_rgba(239,68,68,0.13)] transition-all duration-300 premium-3d-card hover:scale-[1.018] hover:shadow-[0_0_55px_rgba(239,68,68,0.18)] group relative overflow-hidden backdrop-blur-xl">
                          <div className="absolute -right-12 -top-12 w-28 h-28 bg-red-500/5 rounded-full blur-xl pointer-events-none" />

                          <div className="space-y-4 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono tracking-widest text-[#FF3B3B] bg-red-950/40 border border-red-500/20 px-3 py-1 rounded-full uppercase font-black shadow-[0_0_18px_rgba(255,255,255,0.05)]">
                                  
                                </span>
                              </div>
                              <span className="text-[8px] font-mono text-slate-500">THE REALITY NEEDED</span>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-sm font-black text-white uppercase tracking-tight font-display">The Reality Check</h4>
                              <div className="bg-red-500/10 border border-red-500/20 p-5 md:p-6 rounded-2xl relative overflow-hidden">
                                <div className="text-xs text-red-100 font-mono">
                                  <TruncatedText text={softenMedicalClaims(enriched.tones?.brutal.realityCheck || enriched.sarcasticAdvice || 'You are actively pacing yourself toward exhaustion.')} maxLen={720} />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] font-mono text-[#FF3B3B] uppercase font-bold block">
                                {enriched.tones?.brutal.protocolTitle || "THE UNCOMPROMISING PROTOCOL"}
                              </span>
                              <ol className="space-y-2 font-sans">
                                {(enriched.tones?.brutal.protocolSteps || [
                                  enriched.physicalTherapyTip,
                                  "Stop checking emails in the middle of the night. It is a false fire alarm.",
                                  "Drink a massive glass of water. Unclench your jaw. Go rest your nervous system."
                                ]).map((step, idx) => (
                                  <li key={idx} className="flex gap-2 items-start bg-black/40 p-2.5 border border-red-500/10 rounded-xl">
                                    <span className="flex items-center justify-center shrink-0 w-4 h-4 rounded bg-red-950 border border-red-500/20 text-[8px] font-mono text-red-400 font-bold font-display">
                                      0{idx + 1}
                                    </span>
                                    <div className="text-xs text-red-200 leading-7 font-sans font-light flex-1">
                                      <TruncatedText text={softenMedicalClaims(step)} maxLen={900} />
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-white/10 shrink-0">
                            <div className="text-[8px] font-mono text-[#FF3B3B] tracking-widest font-black uppercase text-left font-bold">
                              🚨 ACTION PROTOCOL LIVE
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {innerTab === 'influence' && (
                    <motion.div
                      key="influence"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between font-mono pb-2 border-b border-white/10">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#FF8A00] uppercase font-black">
                          <Layers className="w-4 h-4 text-[#FF8A00]" />
                          <span>Influence Layers</span>
                        </div>
                        <span className="text-[8px] text-[#8A94A6] font-bold hidden sm:block">TCM BREATH / QI HIERARCHY</span>
                      </div>

                      <div className="grid grid-cols-1 gap-6 items-stretch">
                        {/* Layer 1 */}
                        <div className="bg-gradient-to-br from-blue-950/35 via-black/80 to-[#05070B] border border-blue-400/25 hover:border-blue-300/45 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-5 shadow-[0_0_45px_rgba(59,130,246,0.13)] transition-all duration-300 premium-3d-card hover:scale-[1.018] hover:shadow-[0_0_55px_rgba(59,130,246,0.18)] group relative overflow-hidden backdrop-blur-xl">
                          <div className="absolute -right-12 -top-12 w-28 h-28 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center shrink-0 w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/30 text-[11px] font-mono text-[#00D2FF] font-black">L1</span>
                              <span className="text-xs font-mono text-[#00D2FF] uppercase tracking-wide font-black">{enriched.structuredContent?.influenceLayers?.[0]?.title || 'Layer 1'}</span>
                            </div>
                            <span className="text-[8px] font-mono bg-blue-500/10 text-[#00D2FF] border border-blue-500/20 px-2.5 py-1 rounded-full uppercase shrink-0 font-bold">{enriched.structuredContent?.influenceLayers?.[0]?.tag || 'Metal Element'}</span>
                          </div>
                          <div className="text-sm text-[#E6ECF3] bg-white/[0.035] border border-white/10 p-5 rounded-[1.35rem] font-sans font-light leading-7 shadow-[inset_0_0_22px_rgba(255,255,255,0.025)] backdrop-blur-sm">
                            <TruncatedText text={softenMedicalClaims(getStructuredInfluenceText(enriched, 1, enriched.physiologicalDescription))} maxLen={1200} />
                          </div>
                        </div>

                        {/* Layer 2 */}
                        <div className="bg-gradient-to-br from-purple-950/35 via-black/80 to-[#05070B] border border-purple-400/25 hover:border-purple-300/45 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-5 shadow-[0_0_45px_rgba(168,85,247,0.13)] transition-all duration-300 premium-3d-card hover:scale-[1.018] hover:shadow-[0_0_55px_rgba(168,85,247,0.18)] group relative overflow-hidden backdrop-blur-xl">
                          <div className="absolute -right-12 -top-12 w-28 h-28 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center shrink-0 w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/30 text-[11px] font-mono text-purple-400 font-black">L2</span>
                              <span className="text-xs font-mono text-purple-400 uppercase tracking-wide font-black">{enriched.structuredContent?.influenceLayers?.[1]?.title || 'Layer 2'}</span>
                            </div>
                            <span className="text-[8px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full uppercase shrink-0 font-bold">{enriched.structuredContent?.influenceLayers?.[1]?.tag || 'Qi Descent'}</span>
                          </div>
                          <div className="text-sm text-[#E6ECF3] bg-white/[0.035] border border-white/10 p-5 rounded-[1.35rem] font-sans font-light leading-7 shadow-[inset_0_0_22px_rgba(255,255,255,0.025)] backdrop-blur-sm">
                            <TruncatedText text={softenMedicalClaims(getStructuredInfluenceText(enriched, 2, enriched.emotionalRoot))} maxLen={1200} />
                          </div>
                        </div>

                        {/* Layer 3 */}
                        <div className="bg-gradient-to-br from-amber-950/35 via-black/80 to-[#05070B] border border-amber-400/25 hover:border-amber-300/45 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-5 shadow-[0_0_45px_rgba(245,158,11,0.13)] transition-all duration-300 premium-3d-card hover:scale-[1.018] hover:shadow-[0_0_55px_rgba(245,158,11,0.18)] group relative overflow-hidden backdrop-blur-xl">
                          <div className="absolute -right-12 -top-12 w-28 h-28 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center shrink-0 w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-[#FF8A00] font-black">L3</span>
                              <span className="text-xs font-mono text-[#FF8A00] uppercase tracking-wide font-black">{enriched.structuredContent?.influenceLayers?.[2]?.title || 'Layer 3'}</span>
                            </div>
                            <span className="text-[8px] font-mono bg-amber-500/10 text-[#FF8A00] border border-amber-500/20 px-2.5 py-1 rounded-full uppercase shrink-0 font-bold">{enriched.structuredContent?.influenceLayers?.[2]?.tag || 'Root Breath'}</span>
                          </div>
                          <div className="text-sm text-[#E6ECF3] bg-white/[0.035] border border-white/10 p-5 rounded-[1.35rem] font-sans font-light leading-7 shadow-[inset_0_0_22px_rgba(255,255,255,0.025)] backdrop-blur-sm">
                            <TruncatedText text={softenMedicalClaims(getStructuredInfluenceText(enriched, 3, enriched.sarcasticAdvice))} maxLen={1200} />
                          </div>
                        </div>

                        {/* Layer 4 */}
                        <div className="bg-gradient-to-br from-red-950/35 via-black/80 to-[#05070B] border border-red-400/25 hover:border-red-300/45 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-5 shadow-[0_0_45px_rgba(239,68,68,0.13)] transition-all duration-300 premium-3d-card hover:scale-[1.018] hover:shadow-[0_0_55px_rgba(239,68,68,0.18)] group relative overflow-hidden backdrop-blur-xl">
                          <div className="absolute -right-12 -top-12 w-28 h-28 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center shrink-0 w-9 h-9 rounded-full bg-red-500/10 border border-red-500/30 text-[11px] font-mono text-red-400 font-black">L4</span>
                              <span className="text-xs font-mono text-red-400 uppercase tracking-wide font-black">{enriched.structuredContent?.influenceLayers?.[3]?.title || 'Layer 4'}</span>
                            </div>
                            <span className="text-[8px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full uppercase shrink-0 font-bold">{enriched.structuredContent?.influenceLayers?.[3]?.tag || 'Lung Emotion'}</span>
                          </div>
                          <div className="text-sm text-[#E6ECF3] bg-white/[0.035] border border-white/10 p-5 rounded-[1.35rem] font-sans font-light leading-7 shadow-[inset_0_0_22px_rgba(255,255,255,0.025)] backdrop-blur-sm">
                            <TruncatedText text={softenMedicalClaims(getStructuredInfluenceText(enriched, 4, enriched.metaphor))} maxLen={1200} />
                          </div>
                        </div>

                        {/* Layer 5 */}
                        <div className="bg-gradient-to-br from-emerald-950/35 via-black/80 to-[#05070B] border border-emerald-400/25 hover:border-emerald-300/45 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-5 shadow-[0_0_45px_rgba(16,185,129,0.13)] transition-all duration-300 premium-3d-card hover:scale-[1.018] hover:shadow-[0_0_55px_rgba(16,185,129,0.18)] group relative overflow-hidden backdrop-blur-xl">
                          <div className="absolute -right-12 -top-12 w-28 h-28 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center shrink-0 w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 font-black">L5</span>
                              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wide font-black">{enriched.structuredContent?.influenceLayers?.[4]?.title || 'Layer 5'}</span>
                            </div>
                            <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase shrink-0 font-bold">{enriched.structuredContent?.influenceLayers?.[4]?.tag || 'Reset Practice'}</span>
                          </div>
                          <div className="text-sm text-[#E6ECF3] bg-white/[0.035] border border-white/10 p-5 rounded-[1.35rem] font-sans font-light leading-7 shadow-[inset_0_0_22px_rgba(255,255,255,0.025)] backdrop-blur-sm">
                            <TruncatedText text={softenMedicalClaims(getStructuredInfluenceText(enriched, 5, getStructuredResetText(enriched)))} maxLen={1200} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {innerTab === 'reset' && (
                    <motion.div
                      key="reset"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >

                      <SomaticBreathingRegulator />

                      <div className="bg-gradient-to-br from-emerald-950/35 via-black/80 to-[#05070B] border border-emerald-400/25 hover:border-emerald-300/45 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-4 shadow-[0_0_45px_rgba(16,185,129,0.13)] transition-all duration-300 premium-3d-card hover:scale-[1.018] hover:shadow-[0_0_55px_rgba(16,185,129,0.18)] group relative overflow-hidden backdrop-blur-xl">
                        <div className="absolute -right-12 -top-12 w-28 h-28 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 uppercase font-bold border-b border-emerald-500/10 pb-3 relative z-10">
                          <Feather className="w-4 h-4 text-emerald-400" />
                          <span>Additional Reset Protocols</span>
                        </div>
                        <div className="text-xs text-slate-300 font-sans font-light leading-7 relative z-10">
                          <strong>Therapeutic Release:</strong>
                          <TruncatedText text={softenMedicalClaims(getStructuredResetText(enriched))} maxLen={1200} />
                        </div>
                      </div>

                      {/* Expanded Card Footer Action Bar */}
                      <div className="pt-6 border-t border-[#1E2430] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
                        <button
                          type="button"
                          onClick={onJournalRedirect}
                          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold uppercase tracking-widest text-[11px] rounded-2xl shadow-lg shadow-indigo-500/10 flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Feather className="w-4 h-4 text-amber-300" />
                          <span>Log in Somatic Journal Ledger</span>
                        </button>
                        
                        <span className="text-slate-500 text-[11px]">Active Calibration: CYL-{enriched.id} | System Homeostasis Ok</span>
                      </div>
                    </motion.div>
                  )}

                  {innerTab === 'safety' && (
                    <motion.div
                      key="safety"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Serious integrated medical warning for high-risk symptoms */}
                      {(enriched.id === 'diabetes' || (enriched.riskLevel && (enriched.riskLevel.toLowerCase().includes('medical') || enriched.riskLevel.toLowerCase().includes('high')))) && (
                        <div className="bg-red-950/15 border border-red-500/15 p-4 md:px-6 rounded-2xl flex flex-col gap-3 text-xs text-red-200 shadow-lg backdrop-blur-md relative overflow-hidden shrink-0 w-full transition-all duration-300">
                          <div className="absolute inset-x-0 top-0 h-[1px] bg-red-500/30" />
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                            <div className="flex gap-3 items-center">
                              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
                              <div className="flex flex-wrap items-center gap-x-2.5">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-red-400 font-black">
                                  ⚠ Safety Protocol Active
                                </span>
                                <span className="text-slate-300 text-[11px] font-sans">
                                  This app does not diagnose, treat, or cure disease.
                                </span>
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => setIsDisclaimerExpanded(!isDisclaimerExpanded)}
                              className="text-[11px] font-mono font-black text-red-400 hover:text-red-300 underline underline-offset-4 cursor-pointer transition-all self-start sm:self-auto"
                            >
                              {isDisclaimerExpanded ? '[Hide full disclaimer]' : '[View full disclaimer]'}
                            </button>
                          </div>

                          {/* Collapsible Content */}
                          <AnimatePresence initial={false}>
                            {isDisclaimerExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                animate={{ height: 'auto', opacity: 1, marginTop: 4 }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden space-y-2 border-t border-red-500/10 pt-3"
                              >
                                <p className="leading-7 text-slate-300 font-sans">
                                  It explains possible mind-body patterns and lifestyle-related mechanisms for educational reflection. Always consult a licensed medical professional for diagnosis, medication, labs, and treatment.
                                </p>
                                <p className="text-[11px] text-red-300/85 leading-7 font-mono font-bold">
                                  <strong>DIABETES PROTOCOL:</strong> Do not stop insulin, metformin, GLP-1 medication, or any prescribed treatment based on this app.
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Medical Safety Protocols */}
                      <div className="bg-gradient-to-br from-red-950/35 via-black/80 to-[#05070B] border border-red-400/25 hover:border-red-300/45 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-6 shadow-[0_0_45px_rgba(239,68,68,0.13)] transition-all duration-300 premium-3d-card hover:scale-[1.018] hover:shadow-[0_0_55px_rgba(239,68,68,0.18)] group relative overflow-hidden backdrop-blur-xl">
                        <div className="absolute -right-12 -top-12 w-28 h-28 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
                        <div className="flex items-center gap-2 border-b border-red-500/10 pb-3 relative z-10">
                          <Shield className="w-5 h-5 text-red-400" />
                          <div>
                            <h4 className="text-sm font-black font-mono text-white uppercase tracking-wider"> Standards</h4>
                            <p className="text-[11px] text-slate-500 font-mono lowercase">Risk Level: {enriched.riskLevel}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                          {/* Left Column: Alerts */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <span className="text-[10px] font-mono text-red-400 uppercase font-black block">🚨 CRITICAL RED FLAG ALERTS</span>
                              <ul className="space-y-2 list-disc pl-4 text-slate-300 font-sans font-light leading-7">
                                {(enriched.medical_safety?.critical_alerts || [
                                  "Sudden, severe, or excruciating pain with no obvious cause",
                                  "Pain that begins after a major physical injury or trauma",
                                  "Pain accompanied by fever, chills, night sweats, or unexplained weight loss"
                                ]).map((alert, idx) => (
                                  <li key={idx}>{alert}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl space-y-1">
                              <span className="text-[10px] font-mono text-red-400 font-bold block">SEEK IMMEDIATE EMERGENCY CARE IF:</span>
                              <ul className="space-y-1 list-disc pl-4 text-slate-300 text-[11px] font-sans font-light leading-7">
                                {(enriched.medical_safety?.seek_immediate_care_if || [
                                  "You experience sudden, unbearable pain or pain following a major injury"
                                ]).map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Right Column: Guidance */}
                          <div className="space-y-4">
                            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl space-y-1">
                              <span className="text-[10px] font-mono text-amber-400 font-bold block">SCHEDULE AN APPOINTMENT IF:</span>
                              <ul className="space-y-1 list-disc pl-4 text-slate-300 text-[11px] font-sans font-light leading-7">
                                {(enriched.medical_safety?.schedule_care_if || [
                                  "Your pain is persistent, gradually worsening, or lasts longer than 2-3 weeks"
                                ]).map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-1.5 font-sans font-light leading-7 text-[#8A94A6]">
                              <span className="text-[10px] font-mono text-[#8A94A6] uppercase font-bold block">Self-Care Threshold</span>
                              <p className="text-[11px]">
                                {enriched.medical_safety?.self_care_allowed_if || "Gentle movement and temperature therapy are appropriate for transient tension."}
                              </p>
                              <p className="text-[11px] not-italic pt-1 text-slate-500">
                                {enriched.medical_safety?.do_not_ignore}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-[11px] text-slate-500 font-mono border-t border-white/5 pt-4">
                          <strong>Disclaimer:</strong> {enriched.medical_safety?.disclaimer || "This content is for reference only. Please seek medical guidance."}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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

// Category aesthetic metadata mapping
export interface CategoryMeta {
  iconName: string;
  desc: string;
  color: string;      // main color e.g. '#f97316'
  glowColor: string;  // glow color e.g. 'rgba(249, 115, 22, 0.15)'
  textClass: string;  // e.g. 'text-orange-400'
  bgClass: string;    // e.g. 'from-orange-950/20 to-transparent'
  borderClass: string;// e.g. 'border-orange-500/25'
  motif: string;      // visual motif description
  badge: string;      // severity/coverage badge label
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  "All": {
    iconName: "Layers",
    desc: "Complete library of mind-body symptom patterns, warning signs, and reset tools.",
    color: "#7C7CFF",
    glowColor: "rgba(124, 124, 255, 0.15)",
    textClass: "text-[#7C7CFF]",
    bgClass: "from-indigo-950/20 to-transparent",
    borderClass: "border-indigo-500/25",
    motif: "universal somatic field, dual pathways",
    badge: "System-Wide"
  },
  "Metabolic & Endocrine": {
    iconName: "Dna",
    desc: "Blood sugar, thyroid, appetite, hormones, weight, and cellular energy.",
    color: "#FF8A00",
    glowColor: "rgba(255, 138, 0, 0.15)",
    textClass: "text-[#FF8A00]",
    bgClass: "from-orange-950/20 to-transparent",
    borderClass: "border-orange-500/25",
    motif: "pancreas, glucose rings, fuel circuitry",
    badge: "Fuel Priority"
  },
  "Head & Neck": {
    iconName: "Brain",
    desc: "Headaches, jaw tension, eye strain, throat tightness, and nerve pressure.",
    color: "#B15CFF",
    glowColor: "rgba(177, 92, 255, 0.15)",
    textClass: "text-[#B15CFF]",
    bgClass: "from-purple-950/20 to-transparent",
    borderClass: "border-purple-500/25",
    motif: "neural storm, skull silhouette, nerve arcs",
    badge: "Neural Load"
  },
  "General & Energy": {
    iconName: "Flame",
    desc: "Fatigue, burnout, fibromyalgia, recovery strain, and low resilience.",
    color: "#FFD000",
    glowColor: "rgba(255, 208, 0, 0.15)",
    textClass: "text-[#FFD000]",
    bgClass: "from-yellow-950/20 to-transparent",
    borderClass: "border-yellow-500/25",
    motif: "battery core, power grid, solar pulse",
    badge: "Power Core"
  },
  "Stomach & Gut": {
    iconName: "Apple",
    desc: "IBS, reflux, bloating, nausea, gut-brain stress, and digestion strain.",
    color: "#00E676",
    glowColor: "rgba(0, 230, 118, 0.15)",
    textClass: "text-[#00E676]",
    bgClass: "from-emerald-950/20 to-transparent",
    borderClass: "border-emerald-500/25",
    motif: "gut alarm, pipes, digestion reactor",
    badge: "Enteric Alert"
  },
  "Chest & Breathing": {
    iconName: "Heart",
    desc: "Chest tightness, breath restriction, heart signals, and pressure patterns.",
    color: "#FF4D4D",
    glowColor: "rgba(255, 77, 77, 0.15)",
    textClass: "text-[#FF4D4D]",
    bgClass: "from-red-950/20 to-transparent",
    borderClass: "border-red-500/25",
    motif: "heart/lung pulse, airflow tunnel",
    badge: "Vital Rhythm"
  },
  "Skin & Sleep": {
    iconName: "Moon",
    desc: "Skin flares, sleep disruption, itch stress, boundaries, and recovery.",
    color: "#FF5CD6",
    glowColor: "rgba(255, 92, 214, 0.15)",
    textClass: "text-[#FF5CD6]",
    bgClass: "from-pink-950/20 to-transparent",
    borderClass: "border-pink-500/25",
    motif: "barrier shield, moon/sleep waves",
    badge: "Dermal Shield"
  },
  "Back & Shoulders": {
    iconName: "Shield",
    desc: "Spine tension, shoulder guarding, posture strain, and carrying stress.",
    color: "#FF6B2C",
    glowColor: "rgba(255, 107, 44, 0.15)",
    textClass: "text-[#FF6B2C]",
    bgClass: "from-orange-950/20 to-transparent",
    borderClass: "border-orange-500/25",
    motif: "load stack, spine glow, armor plates",
    badge: "Load Stack"
  },
  "Limbs & Joints": {
    iconName: "Dumbbell",
    desc: "Joint stiffness, movement restriction, posture patterns, and control tension.",
    color: "#FFD000",
    glowColor: "rgba(255, 208, 0, 0.15)",
    textClass: "text-[#FFD000]",
    bgClass: "from-yellow-950/20 to-transparent",
    borderClass: "border-yellow-500/25",
    motif: "joint mechanics, hinges, tension lines",
    badge: "Kinetic Guard"
  },
  "Skin & General": {
    iconName: "Moon",
    desc: "Skin flares, sleep disruption, itch stress, boundaries, and recovery.",
    color: "#FF5CD6",
    glowColor: "rgba(255, 92, 214, 0.15)",
    textClass: "text-[#FF5CD6]",
    bgClass: "from-pink-950/20 to-transparent",
    borderClass: "border-pink-500/25",
    motif: "barrier shield, moon/sleep waves",
    badge: "Dermal Shield"
  }
};

const renderCategoryIcon = (iconName: string, className: string, customColor?: string) => {
  const inlineStyle = customColor ? { color: customColor } : undefined;
  switch (iconName) {
    case 'Layers': return <Layers className={className} style={inlineStyle} />;
    case 'Dna': return <Dna className={className} style={inlineStyle} />;
    case 'Brain': return <Brain className={className} style={inlineStyle} />;
    case 'Apple': return <Apple className={className} style={inlineStyle} />;
    case 'Heart': return <Heart className={className} style={inlineStyle} />;
    case 'Dumbbell': return <Dumbbell className={className} style={inlineStyle} />;
    case 'Moon': return <Moon className={className} style={inlineStyle} />;
    case 'Flame': return <Flame className={className} style={inlineStyle} />;
    case 'Shield': return <Shield className={className} style={inlineStyle} />;
    default: return <Activity className={className} style={inlineStyle} />;
  }
};


const SYMPTOM_CARD_IMAGES: Record<string, string> = {
  "All": "/all.png",
  "Metabolic & Endocrine": "/metabolic-endocrine.png",
  "Head & Neck": "/head-neck.png",
  "General & Energy": "/general-energy.png",
  "Stomach & Gut": "/stomach-gut.png",
  "Chest & Breathing": "/chest-breathing.png",
  "Skin & Sleep": "/skin-sleep.png",
  "Skin & General": "/skin-sleep.png",
  "Back & Shoulders": "/back-shoulders.png",
  "Limbs & Joints": "/limbs-joints.png",
};

const getCategoryImage = (category: string) => {
  return SYMPTOM_CARD_IMAGES[category] || SYMPTOM_CARD_IMAGES["All"];
};


const SEARCH_ONLY_AILMENT_IDS = new Set([
  'heart-attack',
  'myocardial-infarction',
  'stroke',
  'seizures',
  'seizure',
  'appendicitis',
  'anaphylaxis',
  'tetanus',
  'pulmonary-embolism',
  'sepsis',
  'meningitis',
  'cystic-fibrosis',
]);

const isSearchOnlyAilment = (ailment: Ailment) => SEARCH_ONLY_AILMENT_IDS.has(ailment.id);

export default AilmentAccordionItem;
