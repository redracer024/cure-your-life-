import React, { useState, useEffect } from 'react';
import { SomaticJournalEntry } from '../types';
import { AILMENTS } from '../data/dictionary';
import { 
  Plus, 
  BookOpen, 
  Activity, 
  Smile, 
  Calendar, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  AlertCircle,
  Clock,
  Heart,
  ChevronRight,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend, 
  Tooltip 
} from 'recharts';

export default function SomaticJournalPanel() {
  const [entries, setEntries] = useState<SomaticJournalEntry[]>([]);
  const [physicalSymptom, setPhysicalSymptom] = useState('');
  const [emotionalState, setEmotionalState] = useState('');
  const [descriptionOfDay, setDescriptionOfDay] = useState('');
  const [intensity, setIntensity] = useState<number>(5);
  const [radarMode, setRadarMode] = useState<'profile' | 'progress'>('profile');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmotion, setFilterEmotion] = useState('All');
  
  // Suggested emotions for quick selection
  const suggestedEmotions = [
    "Overwhelmed", "Anxious", "Suppressing Anger", "Insecure", 
    "Micro-managing", "Stubborn", "Guilty", "Grieving", "Numb"
  ];

  // Load entries from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('somatic_journal_logs');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse journal logs", e);
      }
    } else {
      // Preseed with more than 8 (9 entries) beautiful, humorous records
      const preseeded: SomaticJournalEntry[] = [
        {
          id: "sje-pre-1",
          date: "Jul 3, 2026, 05:45 PM",
          physicalSymptom: "Stiff right shoulder and upper trapezius tightness",
          emotionalState: "Atlas Complex / Over-responsibility",
          descriptionOfDay: "Had to finish three group project slides completely alone because the team vanished. Answered 40 Slack messages while eating dry toast.",
          potentialConnection: "Frozen Shoulder / Upper Back - Loaded with family or social obligations, refusal to delegate or ask for help. Carrying other people's emotional or professional weight.",
          sarcasticReview: "Atlas himself is weeping for you. We are all deeply grateful you are saving the universe one PowerPoint slide at a time. Now, please delegate a single task or prepare to have your ears permanently fuse with your collarbones.",
          intensity: 4
        },
        {
          id: "sje-pre-2",
          date: "Jul 2, 2026, 09:12 PM",
          physicalSymptom: "Persistent jaw ache & popping TMJ",
          emotionalState: "Suppressed Rage & Forced Politeness",
          descriptionOfDay: "My partner commented on my housekeeping skills while doing absolutely nothing themselves. I smiled and said 'okay' while clenching my teeth.",
          potentialConnection: "TMJ Clenching - Biting your tongue to prevent speaking raw, unfiltered truths. Biting down on resentment rather than expressing a healthy boundary.",
          sarcasticReview: "Fabulous job keeping that smile plastered on. Who needs a functioning jaw joint when you can grind your molars into fine porcelain powder? Your dentist is already picking out their next vacation home using your future crown replacement funds.",
          intensity: 5
        },
        {
          id: "sje-pre-3",
          date: "Jul 1, 2026, 01:22 PM",
          physicalSymptom: "Acid burn rising up my throat / Reflux",
          emotionalState: "Swallowing Unacceptable Demands",
          descriptionOfDay: "Boss handed me a massive stack of paperwork due by 5 PM, right as I was heading out for lunch. Said yes immediately.",
          potentialConnection: "GERD & Acid Reflux - Slowed gastric motility under intense 'fight or flight' strain. Swallowing bitter comments that are literally trying to bubble back up.",
          sarcasticReview: "That 'corporate growth opportunity' sure has a high acidity level. Meditation on your inner power won't neutralize that stomach acid. Drink actual water and try saying 'No, that is impossible' next time.",
          intensity: 4
        },
        {
          id: "sje-pre-4",
          date: "Jun 30, 2026, 11:45 PM",
          physicalSymptom: "Vice-like band pressure around my forehead",
          emotionalState: "Intellectual Over-analysis & Hyper-control",
          descriptionOfDay: "Spent 4 hours trying to interpret a brief three-word email from my boss. Drafted 12 alternative responses.",
          potentialConnection: "Tension Headaches - Over-intellectualization, trigeminal nerve hyper-sensitivity caused by chronic mental projection and anxiety.",
          sarcasticReview: "Incredible. I'm sure running those 14 worst-case simulation programs in your head has successfully altered the timeline. Let's keep dehydrating ourselves on double espressos and hope the headache clears right up.",
          intensity: 5
        },
        {
          id: "sje-pre-5",
          date: "Jun 29, 2026, 04:30 PM",
          physicalSymptom: "Itchy red eczema skin patches on forearms",
          emotionalState: "Breached Boundaries & Feeling Thin-Skinned",
          descriptionOfDay: "Let my friend borrow my car again even though they returned it empty last time. Felt incredibly used but pretended everything was fine.",
          potentialConnection: "Eczema Flare - Skin mast cell degranulation triggered by elevated cortisol. Representing physical irritation from personal boundary violations.",
          sarcasticReview: "Your skin is literally screaming 'DO NOT ENTER' because your mouth refuses to. Keep acting like a free charging station for toxic friends and enjoy the scratching.",
          intensity: 6
        },
        {
          id: "sje-pre-6",
          date: "Jun 28, 2026, 08:15 AM",
          physicalSymptom: "Heavy chest restriction and shallow breathing",
          emotionalState: "Suppressed Grief / Avoided Sorrow",
          descriptionOfDay: "Found some old letters from a past friendship that ended abruptly. Instantly felt a heavy wave of sadness but forced myself to ignore it and clean.",
          potentialConnection: "Chest Constriction - Hyper-tonicity of intercostal muscles due to shallow chest-only panic breathing. Withholding natural emotional releases (crying).",
          sarcasticReview: "Your lungs are not file cabinets for old emotional bills. Take a full diaphragmatic breath and cry for 30 seconds. It's significantly cheaper than premium chest compress massage sessions.",
          intensity: 8
        },
        {
          id: "sje-pre-7",
          date: "Jun 27, 2026, 06:10 PM",
          physicalSymptom: "Sudden thumping heart palpitations",
          emotionalState: "Hyper-impatience & Time Anxiety",
          descriptionOfDay: "Stuck in a minor traffic delay on the highway. Felt like my heart was sprinting. Kept checking the GPS every 20 seconds.",
          potentialConnection: "Somatic Heart Palpitations - Norepinephrine spike caused by artificial urgency and the perception of losing precious minutes.",
          sarcasticReview: "Oh absolutely, because honking and checking your phone every 12 seconds alters the physical laws of traffic flow. Take a deep breath, you aren't a high-performance race car.",
          intensity: 7
        },
        {
          id: "sje-pre-8",
          date: "Jun 26, 2026, 10:05 AM",
          physicalSymptom: "Sharp, stabbing muscle spasm in lower back",
          emotionalState: "Financial Insecurity & Lack of Base Support",
          descriptionOfDay: "Checked my credit card balance after booking travel flights. Instantly felt a sharp pull above my hip bone.",
          potentialConnection: "Lower Back Spasms - Psoas muscle contraction triggered by survival stress and perceived threat to material or financial stability.",
          sarcasticReview: "Yes, it must be an 'unaligned root chakra' and certainly has nothing to do with you sitting slumped like a cooked noodle in a folding chair while panic-calculating compound interest.",
          intensity: 9
        },
        {
          id: "sje-pre-9",
          date: "Jun 25, 2026, 03:40 PM",
          physicalSymptom: "Absolute full-body fatigue & leaden eyelids",
          emotionalState: "Subconscious Resistance & Exhausted Spirit",
          descriptionOfDay: "Sat through a six-hour compliance training seminar on spreadsheet protocols. Drank three energy drinks but still felt ready to collapse.",
          potentialConnection: "Somatic Chronic Fatigue - Brain-gut axis shutting down cellular energy pathways because you are forcing yourself through a soul-crushing routine.",
          sarcasticReview: "Your nervous system literally pulled the main breaker to save you from spreadsheet boredom. No amount of synthetic caffeine will revive a spirit forced to endure six hours of cell-formatting instructions.",
          intensity: 8
        }
      ];
      setEntries(preseeded);
      localStorage.setItem('somatic_journal_logs', JSON.stringify(preseeded));
    }
  }, []);

  const handleLogSymptom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!physicalSymptom.trim() || !emotionalState.trim()) return;

    setIsAnalyzing(true);

    let connectionText = "No clear correlation found in immediate records.";
    let roastText = "You didn't specify enough bad habits, but I'm sure you have plenty. Drink water.";

    // Step 1: Look for local dictionary keyword match
    const symptomLower = physicalSymptom.toLowerCase();
    const matchedAilment = AILMENTS.find(a => 
      symptomLower.includes(a.name.toLowerCase().split(' ')[0]) || 
      symptomLower.includes(a.id.split('-')[0]) ||
      (a.category && symptomLower.includes(a.category.toLowerCase().split(' ')[0]))
    );

    if (matchedAilment) {
      connectionText = `Correlation match with [${matchedAilment.name}]: ${matchedAilment.emotionalRoot}`;
      roastText = matchedAilment.sarcasticAdvice;
    } else {
      // General fallbacks based on emotional state
      const emo = emotionalState.toLowerCase();
      if (emo.includes('anxious') || emo.includes('worry') || emo.includes('overwhelm')) {
        connectionText = "High adrenaline/cortisol response. Your body is preparing for a survival threat (likely an email or a normal social interaction) by tightening your muscles and slowing digestion.";
        roastText = "Ah, anxiety. The classic 'I think therefore I panic' syndrome. Keep thinking 10 steps ahead, I'm sure your shoulders will love carrying that heavy, non-existent future.";
      } else if (emo.includes('anger') || emo.includes('mad') || emo.includes('frustrat')) {
        connectionText = "Suppressed frustration triggers constant jaw-clenching and elevated blood pressure, leading to localized inflammation and somatic muscle guarding.";
        roastText = "Fascinating how you choose to bite down on your jaw until your molars turn to dust instead of speaking up. Truly a masterclass in silent martyrdom.";
      } else {
        connectionText = "Unresolved stress pattern. The mind registers cognitive conflict and somaticizes it into regional muscular tension to divert your attention from emotional processing.";
        roastText = "Well, something is clearly bothering you, but sure, let's keep scrolling social media and hope the pain disappears like magic.";
      }
    }

    // Step 2: Try to get real-time customized AI analysis from our endpoint
    try {
      const response = await fetch('/api/analyze-symptom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptom: `Physical sensation: ${physicalSymptom}. Emotional state: ${emotionalState}`,
          habits: `Daily context: ${descriptionOfDay}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.emotionalRoot) connectionText = data.emotionalRoot;
        if (data.sarcasticReview) roastText = data.sarcasticReview;
      }
    } catch (err) {
      console.warn("AI analysis endpoint failed, falling back to local heuristic matches.", err);
    }

    const newEntry: SomaticJournalEntry = {
      id: `sje-${Date.now()}`,
      date: new Date().toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      physicalSymptom: physicalSymptom.trim(),
      emotionalState: emotionalState.trim(),
      descriptionOfDay: descriptionOfDay.trim() || "No specific daily notes provided.",
      potentialConnection: connectionText,
      sarcasticReview: roastText,
      intensity: intensity
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    localStorage.setItem('somatic_journal_logs', JSON.stringify(updated));

    // Reset inputs
    setPhysicalSymptom('');
    setEmotionalState('');
    setDescriptionOfDay('');
    setIntensity(5);
    setIsAnalyzing(false);
  };

  const deleteEntry = (id: string) => {
    if (confirm("Are you sure you want to delete this somatic record? Your physical tissues will remember, but this interface will forget.")) {
      const updated = entries.filter(e => e.id !== id);
      setEntries(updated);
      localStorage.setItem('somatic_journal_logs', JSON.stringify(updated));
    }
  };

  // Extract all unique logged emotions for filtering
  const uniqueEmotions = ['All', ...Array.from(new Set(entries.map(e => e.emotionalState)))];

  // Filter entries
  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.physicalSymptom.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.descriptionOfDay.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.potentialConnection?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEmotion = filterEmotion === 'All' || e.emotionalState === filterEmotion;
    return matchesSearch && matchesEmotion;
  });

  // Calculate some fun connection insights
  const totalLogs = entries.length;
  const mostCommonEmotion = entries.reduce((acc, current) => {
    acc[current.emotionalState] = (acc[current.emotionalState] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedEmotions = Object.entries(mostCommonEmotion).sort((a, b) => {
    const countA = Number(a[1]) || 0;
    const countB = Number(b[1]) || 0;
    return countB - countA;
  });
  const primaryCulprit = sortedEmotions.length > 0 ? sortedEmotions[0][0] : "None yet";

  // Helper to categorize any physical symptom text into our 5 core somatic domains
  const getSymptomCategory = (symptom: string): string => {
    const sym = symptom.toLowerCase();
    if (
      sym.includes('jaw') || 
      sym.includes('head') || 
      sym.includes('neck') || 
      sym.includes('face') || 
      sym.includes('tmj') || 
      sym.includes('migraine') || 
      sym.includes('teeth') || 
      sym.includes('tooth') || 
      sym.includes('ear') || 
      sym.includes('temple') || 
      sym.includes('clench')
    ) {
      return "Head & Neck";
    }
    if (
      sym.includes('shoulder') || 
      sym.includes('back') || 
      sym.includes('trapezius') || 
      sym.includes('scapula') || 
      sym.includes('spine') || 
      sym.includes('hip') || 
      sym.includes('joint') || 
      sym.includes('arm') || 
      sym.includes('wrist') || 
      sym.includes('hand') || 
      sym.includes('leg') || 
      sym.includes('knee') || 
      sym.includes('foot') || 
      sym.includes('muscle') || 
      sym.includes('spasm') || 
      sym.includes('stiff')
    ) {
      return "Back & Shoulders";
    }
    if (
      sym.includes('stomach') || 
      sym.includes('gut') || 
      sym.includes('digest') || 
      sym.includes('bowel') || 
      sym.includes('acid') || 
      sym.includes('reflux') || 
      sym.includes('bloat') || 
      sym.includes('ibs') || 
      sym.includes('gastro') || 
      sym.includes('abdomen') || 
      sym.includes('belly')
    ) {
      return "Stomach & Gut";
    }
    if (
      sym.includes('chest') || 
      sym.includes('heart') || 
      sym.includes('breath') || 
      sym.includes('palpit') || 
      sym.includes('lung') || 
      sym.includes('rib') || 
      sym.includes('throat') || 
      sym.includes('cardiac')
    ) {
      return "Chest & Breathing";
    }
    
    // Default fallback
    return "General & Energy";
  };

  // Core somatic domains for radar axes
  const SOMATIC_DOMAINS = [
    { subject: "Head & Neck", description: "Polite silence, unspoken anger, suppressed complaints" },
    { subject: "Back & Shoulders", description: "Over-responsibility, Atlas complex, carrying others" },
    { subject: "Stomach & Gut", description: "Security fears, control habits, micro-management" },
    { subject: "Chest & Breathing", description: "Time anxiety, ignored sorrow, suppressed panic" },
    { subject: "General & Energy", description: "Subconscious resistance, soul-crushing routine" }
  ];

  // Calculate radar data
  const radarData = SOMATIC_DOMAINS.map(domain => {
    // Filter entries by this domain's category
    const domainEntries = entries.filter(e => getSymptomCategory(e.physicalSymptom) === domain.subject);
    const frequency = domainEntries.length;
    
    // Handle intensity (default to 5 if not set or legacy record)
    const avgIntensity = frequency > 0 
      ? Number((domainEntries.reduce((sum, e) => sum + (e.intensity !== undefined ? e.intensity : 5), 0) / frequency).toFixed(1))
      : 0;

    // For Progress Over Time, we split into "Recent" and "Baseline"
    // Chronologically, the entries state is sorted newest first.
    // So entries[0..3] are recent (newest 4), and entries[4..] are baseline.
    const recentLogs = entries.slice(0, 4);
    const baselineLogs = entries.slice(4);

    const recentDomainEntries = recentLogs.filter(e => getSymptomCategory(e.physicalSymptom) === domain.subject);
    const baselineDomainEntries = baselineLogs.filter(e => getSymptomCategory(e.physicalSymptom) === domain.subject);

    const recentIntensity = recentDomainEntries.length > 0
      ? Number((recentDomainEntries.reduce((sum, e) => sum + (e.intensity !== undefined ? e.intensity : 5), 0) / recentDomainEntries.length).toFixed(1))
      : 0;

    const baselineIntensity = baselineDomainEntries.length > 0
      ? Number((baselineDomainEntries.reduce((sum, e) => sum + (e.intensity !== undefined ? e.intensity : 5), 0) / baselineDomainEntries.length).toFixed(1))
      : 0;

    return {
      subject: domain.subject,
      description: domain.description,
      "Log Frequency": frequency,
      "Average Severity": avgIntensity,
      "Recent Tension": recentIntensity,
      "Baseline Tension": baselineIntensity
    };
  });

  // Generate active diagnostic report based on radar data
  const getRadarInsights = () => {
    if (entries.length === 0) {
      return {
        title: "Somatic Signal Missing",
        text: "Please log a physical symptom in the panel to begin charting your tension profile.",
        tip: "Practice dropping your shoulders and taking a slow diaphragmatic breath right now."
      };
    }

    if (radarMode === 'profile') {
      const activeData = [...radarData].sort((a, b) => b["Average Severity"] - a["Average Severity"]);
      const topCategory = activeData[0];
      
      if (!topCategory || topCategory["Average Severity"] === 0) {
        return {
          title: "Calm Biosphere",
          text: "No high-intensity physical discomfort logged. Your nervous system is in parasympathetic homeostasis.",
          tip: "Enjoy this momentary balance before another email notification triggers you."
        };
      }

      let insightText = "";
      let tipText = "";

      if (topCategory.subject === "Head & Neck") {
        insightText = "Your neck, jaw, and teeth are bearing the strain of unspoken truths and polite compliance. You are literally biting down on resentment.";
        tipText = "Doctor Sarcasticus says: Try uttering a clear, polite 'No' to an unreasonable request and watch your masseter muscle celebrate.";
      } else if (topCategory.subject === "Back & Shoulders") {
        insightText = "Classic Atlas pattern. You are physically hoisting expectations and responsibilities that aren't actually your job to solve.";
        tipText = "Doctor Sarcasticus says: Allow a minor task to remain unsolved today. Letting go of visual perfection does wonders for the trapezius.";
      } else if (topCategory.subject === "Stomach & Gut") {
        insightText = "Your gut is responding to security and control fears. Sticking stubbornly to old mental scripts is causing visceral hyper-sensitivity.";
        tipText = "Doctor Sarcasticus says: Swap that expensive herbal stomach tea for 5 minutes of mindful slow belly breathing. Your vagus nerve is free.";
      } else if (topCategory.subject === "Chest & Breathing") {
        insightText = "Time urgency and ignored sorrow have constricted your intercostal breathing. Stethoscopes find no structural flaws, only rushed adrenaline.";
        tipText = "Doctor Sarcasticus says: Stop rushing. Checking your phone 30 times a minute won't speed up traffic, but it will raise your heart rate.";
      } else {
        insightText = "Existential energy depletion. Your body has pulled the main fuse box because you are over-allocating force to an unaligned path.";
        tipText = "Doctor Sarcasticus says: Unplug your headphones, step away from the screen, and walk in nature for 15 minutes without calculating metrics.";
      }

      return {
        title: `Primary Hotspot: ${topCategory.subject}`,
        text: insightText,
        tip: tipText
      };
    } else {
      const totalBaseline = radarData.reduce((sum, d) => sum + d["Baseline Tension"], 0);
      const totalRecent = radarData.reduce((sum, d) => sum + d["Recent Tension"], 0);

      if (entries.length < 5) {
        return {
          title: "Calibrating History Map...",
          text: `You have logged ${entries.length}/5 entries. We need at least 5 logs to establish a reliable baseline comparison profile.`,
          tip: "Continue logging daily physical complaints to map your progress chronologically."
        };
      }

      if (totalRecent < totalBaseline) {
        const percentImprovement = Math.round(((totalBaseline - totalRecent) / (totalBaseline || 1)) * 100);
        return {
          title: "Somatic Release Detected!",
          text: `Your overall somatic discomfort has shrunk by ${percentImprovement}% compared to your baseline. You are successfully unclenching.`,
          tip: "Your shoulders are currently further from your ears. Keep practicing somatic release before you turn back into a statue."
        };
      } else if (totalRecent > totalBaseline) {
        return {
          title: "Reactive Tension Flare",
          text: "Recent physical discomfort exceeds your historical baseline. A boundary breach or hidden stress is breaking through.",
          tip: "Ask yourself: Whom or what did I say yes to this week when my body wanted to shout 'absolutely not'?"
        };
      } else {
        return {
          title: "Static Homeostasis",
          text: "Your baseline and recent tension are in equilibrium. You are maintaining a stable, albeit tight, level of physical alert.",
          tip: "Stability is good, but let's see if we can shrink the radar polygon even further by softening your jaw."
        };
      }
    }
  };

  const currentInsight = getRadarInsights();

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full">
      {/* Visual Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-950 p-5 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Total Somatic Logs</div>
            <div className="text-2xl font-black">{totalLogs} entries</div>
          </div>
        </div>

        <div className="bg-zinc-950 p-5 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Primary Emotional Culprit</div>
            <div className="text-xl font-black text-amber-400 truncate max-w-[200px]" title={primaryCulprit}>
              {primaryCulprit}
            </div>
          </div>
        </div>

        <div className="bg-zinc-950 p-5 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Postural Alert</div>
            <div className="text-xs font-mono text-rose-300 leading-normal">
              Your shoulders are up. Drop them.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form to log new day */}
        <div className="lg:col-span-5 bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Plus className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-mono text-slate-300 uppercase tracking-widest">
              Log Today's Discomfort
            </h3>
          </div>

          <form onSubmit={handleLogSymptom} className="space-y-5">
            {/* Symptom Input */}
            <div className="space-y-1.5">
              <label htmlFor="journal-physical-symptom" className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
                What physically hurts or feels tight? *
              </label>
              <input
                id="journal-physical-symptom"
                required
                type="text"
                value={physicalSymptom}
                onChange={(e) => setPhysicalSymptom(e.target.value)}
                placeholder="e.g. Throbbing lower back, stiff right wrist..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-sans"
              />
            </div>

            {/* Emotional State Input */}
            <div className="space-y-1.5">
              <label htmlFor="journal-emotional-state" className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
                What emotion is lurking in the background? *
              </label>
              <input
                id="journal-emotional-state"
                required
                type="text"
                value={emotionalState}
                onChange={(e) => setEmotionalState(e.target.value)}
                placeholder="e.g. Underappreciated, terrified of failure..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-sans"
              />

              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap gap-1 pt-1.5">
                {suggestedEmotions.map((emo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEmotionalState(emo)}
                    className="text-[9px] font-mono bg-white/5 border border-white/5 hover:border-indigo-500/40 text-slate-400 hover:text-white px-2 py-0.5 rounded transition-all"
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </div>

            {/* Somatic Intensity Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
                Symptom Intensity (1-10)
              </label>
              <div className="grid grid-cols-10 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setIntensity(num)}
                    className={`h-8 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      intensity === num
                        ? 'bg-amber-500 text-black border border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-mono text-slate-500 flex justify-between px-1">
                <span>1: Mild Tension</span>
                <span>10: Structural Emergency</span>
              </p>
            </div>

            {/* Day Description */}
            <div className="space-y-1.5">
              <label htmlFor="journal-description-of-day" className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
                Briefly describe your day / bad habits
              </label>
              <textarea
                id="journal-description-of-day"
                rows={3}
                value={descriptionOfDay}
                onChange={(e) => setDescriptionOfDay(e.target.value)}
                placeholder="e.g. Argued with boss, sat staring at the screen for 6 hours straight, drank 3 energy drinks..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-sans resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isAnalyzing || !physicalSymptom.trim() || !emotionalState.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase text-xs tracking-widest py-3 px-4 rounded-xl transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                  <span>Decoding Somatic Link...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Log & Decode Connection</span>
                </>
              )}
            </button>
          </form>

          <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/20">
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] mb-1">
              <Brain className="w-3.5 h-3.5" />
              <span>HOW IT WORKS</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Logging a symptom links your emotional state to biological reflexes. The decoder automatically maps your inputs to psychosomatic nerve triggers, giving you a customized diagnostic verdict.
            </p>
          </div>
        </div>

        {/* Right Column: Historical Logs and Trends */}
        <div className="lg:col-span-7 space-y-6">
          {/* Somatic Tension Profile Radar Card */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div>
                <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block mb-0.5">BIO-FEEDBACK TELEMETRY</span>
                <h3 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span>Somatic Tension Profile</span>
                </h3>
              </div>
              
              {/* Toggle Buttons */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setRadarMode('profile')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                    radarMode === 'profile' 
                      ? 'bg-indigo-600 text-white font-bold shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Symptom Hotspots
                </button>
                <button
                  type="button"
                  onClick={() => setRadarMode('progress')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                    radarMode === 'progress' 
                      ? 'bg-indigo-600 text-white font-bold shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mindfulness Progress
                </button>
              </div>
            </div>

            {/* Radar layout grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Recharts Chart */}
              <div className="md:col-span-7 h-[260px] w-full flex items-center justify-center relative">
                {entries.length === 0 ? (
                  <div className="text-center text-slate-600 font-mono text-xs">
                    No data logged yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }} 
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 10]} 
                        tick={{ fill: '#64748b', fontSize: 8 }}
                        stroke="rgba(255, 255, 255, 0.04)"
                      />
                      
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#09090b', 
                          border: '1px solid rgba(255, 255, 255, 0.1)', 
                          borderRadius: '8px',
                          fontFamily: 'monospace',
                          fontSize: '11px'
                        }}
                      />
                      
                      {radarMode === 'profile' ? (
                        <>
                          <Radar 
                            name="Avg Severity (1-10)" 
                            dataKey="Average Severity" 
                            stroke="#f59e0b" 
                            fill="#f59e0b" 
                            fillOpacity={0.15} 
                          />
                          <Radar 
                            name="Log Frequency" 
                            dataKey="Log Frequency" 
                            stroke="#6366f1" 
                            fill="#6366f1" 
                            fillOpacity={0.15} 
                          />
                        </>
                      ) : (
                        <>
                          <Radar 
                            name="Baseline Tension" 
                            dataKey="Baseline Tension" 
                            stroke="#f43f5e" 
                            fill="#f43f5e" 
                            fillOpacity={0.12} 
                          />
                          <Radar 
                            name="Recent Tension" 
                            dataKey="Recent Tension" 
                            stroke="#10b981" 
                            fill="#10b981" 
                            fillOpacity={0.18} 
                          />
                        </>
                      )}
                      <Legend 
                        wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '10px' }} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Humorous / Bio-feedback text */}
              <div className="md:col-span-5 space-y-4">
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[9px] uppercase tracking-wider">
                    <Brain className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Diagnostics Decoder</span>
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase font-mono tracking-tight leading-tight">
                    {currentInsight.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    {currentInsight.text}
                  </p>
                </div>

                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1">
                  <span className="text-[9px] font-mono text-indigo-300 uppercase tracking-wider block">Bio-Mindfulness Prescription</span>
                  <p className="text-[11px] text-slate-300 italic font-sans leading-relaxed">
                    "{currentInsight.tip}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Header & Filter workspace */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Your Somatic History Ledger ({filteredEntries.length})</span>
              </h4>
              
              {/* Search Bar */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter logs by keyword..."
                className="bg-white/5 border border-white/15 px-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
              />
            </div>

            {/* Filter by Emotion tags */}
            {uniqueEmotions.length > 2 && (
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Filter by logged emotion:</span>
                <div className="flex flex-wrap gap-1">
                  {uniqueEmotions.map(emo => (
                    <button
                      key={emo}
                      onClick={() => setFilterEmotion(emo)}
                      className={`text-[9px] font-mono px-2 py-0.5 rounded transition-all ${
                        filterEmotion === emo
                          ? 'bg-indigo-500 text-white font-bold'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* List of Entries */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredEntries.length === 0 ? (
                <div className="bg-zinc-950/40 border border-white/10 border-dashed p-12 rounded-2xl text-center space-y-2">
                  <Activity className="w-8 h-8 mx-auto text-slate-700" />
                  <p className="text-xs font-mono text-slate-500 uppercase">No somatic logs match your filters</p>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    Start by typing your current muscle tightness or physical complaint in the left panel to begin your somatic journey.
                  </p>
                </div>
              ) : (
                filteredEntries.map((entry, idx) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.3) }}
                    className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4 relative hover:border-indigo-500/30 transition-all shadow-lg"
                  >
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-2 py-0.5 rounded uppercase font-mono">
                            Symptom: {entry.physicalSymptom}
                          </span>
                          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded uppercase">
                            Emotion: {entry.emotionalState}
                          </span>
                          <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/15 px-2 py-0.5 rounded uppercase">
                            Intensity: {entry.intensity || 5}/10
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                          <Calendar className="w-3 h-3 text-slate-600" />
                          <span>{entry.date}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                        title="Delete log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Day description */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Daily Context & Habits</span>
                      <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.01] p-3 rounded-lg border border-white/5 font-sans italic">
                        "{entry.descriptionOfDay}"
                      </p>
                    </div>

                    {/* Potential connection block */}
                    {entry.potentialConnection && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-indigo-400 uppercase tracking-wider">
                          <Brain className="w-3 h-3" />
                          <span>Somatic Correlation Analysis</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans pl-3 border-l-2 border-indigo-500/50">
                          {entry.potentialConnection}
                        </p>
                      </div>
                    )}

                    {/* Sarcastic review block */}
                    {entry.sarcasticReview && (
                      <div className="p-4 bg-amber-500 text-black rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-black/70">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Doctor Sarcasticus Verdict</span>
                        </div>
                        <p className="text-xs font-semibold leading-relaxed font-sans">
                          {entry.sarcasticReview}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
