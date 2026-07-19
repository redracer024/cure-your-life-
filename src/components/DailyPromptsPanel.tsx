import { useEffect, useMemo, useState } from 'react';

type SomaticPrompt = {
  title: string;
  category: string;
  bodyZone: string;
  prompt: string;
  quote: string;
};

type JournalResponseRule = {
  keywords: string[];
  response: string;
};

type ReflectionLog = {
  id: string;
  promptTitle: string;
  prompt: string;
  category: string;
  bodyZone: string;
  entry: string;
  response: string;
  timestamp: number;
};

const SOMATIC_REFLECTION_PROMPTS: SomaticPrompt[] = [
  {
    title: "The Unspoken Sentence",
    category: "Self-Censorship",
    bodyZone: "Throat & Neck",
    prompt: "What is one thing you wanted to say this week but swallowed instead? Write the sentence you did not let leave your mouth.",
    quote: "Your throat holds the words you did not say. They do not vanish. They wait."
  },
  {
    title: "The Weight You Are Carrying",
    category: "Responsibility",
    bodyZone: "Back & Shoulders",
    prompt: "What responsibility are you carrying that is not actually yours? Name the thing you picked up that you were never asked to carry.",
    quote: "You are not Atlas. The sky is not yours to hold."
  },
  {
    title: "Before the Knot",
    category: "Anger",
    bodyZone: "Stomach & Gut",
    prompt: "Think back to a situation you should have left earlier. What did you notice before the rest of you caught up?",
    quote: "Your stomach is not a psychic, but it does keep receipts."
  },
  {
    title: "What You Are Numbing",
    category: "Suppression",
    bodyZone: "Whole Body",
    prompt: "What feeling have you been trying to outrun with busyness? Name it without fixing it.",
    quote: "The feeling you are running from is tired too. Let it catch up."
  },
  {
    title: "Small Enough to Fit",
    category: "Shame",
    bodyZone: "Skin",
    prompt: "Where in your life are you still making yourself smaller than you need to be?",
    quote: "You are not too much. You are just too much for the people who wanted you small."
  },
  {
    title: "The Yes You Meant as No",
    category: "People-Pleasing",
    bodyZone: "Jaw / TMJ",
    prompt: "When did you say yes this week when you really meant no? Write the no you should have said.",
    quote: "Your jaw is not a lockbox. It is a hinge. Use it."
  },
  {
    title: "The Person You Are Exhausted By",
    category: "Boundaries",
    bodyZone: "Whole Body",
    prompt: "Who drains you the most, and what would one clear boundary with them look like?",
    quote: "You are not a hotel for other people’s problems."
  },
  {
    title: "The Forgotten Anger",
    category: "Anger",
    bodyZone: "Head / Eyes",
    prompt: "Who are you still angry at that you have not let yourself be angry at?",
    quote: "Anger is a compass. It points to where a boundary was crossed."
  },
  {
    title: "The Fear of Rest",
    category: "Rest",
    bodyZone: "Sleep / Nervous System",
    prompt: "What story do you tell yourself about why you cannot rest?",
    quote: "Rest is not a reward. It is maintenance. Revolutionary, apparently."
  },
  {
    title: "The Performance of Fine",
    category: "Suppression",
    bodyZone: "Skin",
    prompt: "When did you last pretend to be okay when you were not? What were you hiding?",
    quote: "You are a terrible liar. Your body has receipts."
  },
  {
    title: "The Helpless Observer",
    category: "Control",
    bodyZone: "Head / Eyes",
    prompt: "What situation are you trying to control that you cannot, and what is the cost of pretending you can?",
    quote: "You cannot steer a ship that is already docked. Put down the wheel."
  },
  {
    title: "The Refusal to Expand",
    category: "Fear",
    bodyZone: "Chest & Breathing",
    prompt: "What would you do if you were not afraid of being seen?",
    quote: "Your lungs do not ask permission to fill. Neither should you."
  },
  {
    title: "The Complaint You Never Made",
    category: "Self-Censorship",
    bodyZone: "Throat & Neck",
    prompt: "What are you tolerating in silence that deserves to be named clearly?",
    quote: "Silence is not a virtue when it is swallowing you."
  },
  {
    title: "The Hole You Are Trying to Fill",
    category: "Attachment",
    bodyZone: "Stomach & Gut",
    prompt: "What are you trying to get from others that you may need to learn how to hold for yourself?",
    quote: "No one can fill a hole you refuse to acknowledge."
  },
  {
    title: "The Door You Are Afraid to Open",
    category: "Avoidance",
    bodyZone: "Chest & Breathing",
    prompt: "What are you avoiding that you know you need to face in some smaller, less dramatic first step?",
    quote: "The door you are avoiding is probably not locked. Annoying."
  },
  {
    title: "The Frozen Part",
    category: "Grief",
    bodyZone: "Hips / Pelvis",
    prompt: "What loss are you still not letting yourself fully feel?",
    quote: "Grief does not disappear because your schedule got rude."
  },
  {
    title: "The Call You Are Not Making",
    category: "Responsibility",
    bodyZone: "Throat & Neck",
    prompt: "Who do you need to speak to that you have been avoiding?",
    quote: "Your voice is not a weapon. It is a tool. Stop leaving it in the drawer."
  },
  {
    title: "The Tense Morning",
    category: "Stress",
    bodyZone: "Jaw / TMJ",
    prompt: "What wakes up in your body before your alarm does?",
    quote: "Your body is a better alarm clock than your phone, which is frankly upsetting."
  },
  {
    title: "The Decision You Are Avoiding",
    category: "Decision-Making",
    bodyZone: "Head / Eyes",
    prompt: "What decision have you been putting off because making it feels like losing something?",
    quote: "Not deciding is deciding. It just wears a fake mustache."
  },
  {
    title: "The Boundary You Need Today",
    category: "Boundaries",
    bodyZone: "Whole Body",
    prompt: "What boundary did you cross with yourself this week?",
    quote: "You are the only person you cannot walk away from. Start acting like it."
  },
  {
    title: "The Grief You Cannot Name",
    category: "Grief",
    bodyZone: "Chest & Breathing",
    prompt: "What have you lost that you are still pretending you have not lost?",
    quote: "Grief is unspent love. Let it sit somewhere besides your chest."
  },
  {
    title: "The Person You Are Afraid to Disappoint",
    category: "People-Pleasing",
    bodyZone: "Stomach & Gut",
    prompt: "Who are you still trying to please, even though they are not in the room?",
    quote: "The person you are trying to please might not even exist anymore."
  },
  {
    title: "The Shape of Your Day",
    category: "Conflict Recovery",
    bodyZone: "Heart / Chest",
    prompt: "What conflict are you still replaying in your head? Write the resolution you wish had happened.",
    quote: "The argument in your head is the only one still running."
  },
  {
    title: "The Armor You Do Not Need",
    category: "Protection",
    bodyZone: "Back & Shoulders",
    prompt: "What armor are you still wearing from a battle that ended years ago?",
    quote: "You survived the war. You can take off the helmet."
  },
  {
    title: "The Hand You Are Clenching",
    category: "Control",
    bodyZone: "Jaw / TMJ",
    prompt: "What are you holding onto so tightly that your body is tired from the grip?",
    quote: "You are not holding a lifeline. You might be strangling your own hand."
  },
  {
    title: "The Quiet You Are Avoiding",
    category: "Avoidance",
    bodyZone: "Whole Body",
    prompt: "Why does quiet feel unsafe right now? What shows up when the noise stops?",
    quote: "Silence is not empty. It is full of things you have not faced."
  },
  {
    title: "The Weight of Should",
    category: "Control",
    bodyZone: "Head / Eyes",
    prompt: "What ‘should’ keeps bossing you around that you do not actually believe?",
    quote: "Should is the tyranny of dead expectations. Charming little dictatorship."
  },
  {
    title: "The Word You Did Not Say",
    category: "Self-Censorship",
    bodyZone: "Throat & Neck",
    prompt: "What one word did you swallow this week that needed to be said?",
    quote: "Your voice is not a bomb. Though yes, it may disturb the furniture."
  },
  {
    title: "The Fear of Disappointment",
    category: "Fear",
    bodyZone: "Stomach & Gut",
    prompt: "Who are you afraid of disappointing, and what would happen if you stopped organizing your life around that fear?",
    quote: "Disappointment is uncomfortable. It is not a meteor strike."
  },
  {
    title: "The Sadness You Are Sitting On",
    category: "Grief",
    bodyZone: "Hips / Pelvis",
    prompt: "What sadness are you sitting on that needs movement, breath, or witness?",
    quote: "Your hips are not a vault. Shake it loose."
  },
  {
    title: "The Loneliness You Are Not Naming",
    category: "Loneliness",
    bodyZone: "Heart / Chest",
    prompt: "What would it look like to let one safe person see your loneliness?",
    quote: "Loneliness does not get smaller when you isolate. It starts decorating."
  },
  {
    title: "The Shame That Is Not Yours",
    category: "Shame",
    bodyZone: "Skin",
    prompt: "What shame are you carrying that actually belongs to someone else?",
    quote: "Some shame is not yours. Hand it back. No gift receipt needed."
  },
  {
    title: "The Exhaustion You Earned",
    category: "Burnout",
    bodyZone: "Sleep / Nervous System",
    prompt: "What would it look like to give yourself permission to be tired without turning it into a moral trial?",
    quote: "Exhaustion is not a badge of honor. It is a warning light."
  },
  {
    title: "The Person You Are Disappointed In",
    category: "Anger",
    bodyZone: "Stomach & Gut",
    prompt: "Who disappointed you that you have not let yourself be angry at?",
    quote: "Anger is not the opposite of love. Sometimes it is love with standards."
  },
  {
    title: "The Work You Cannot Stop",
    category: "Burnout",
    bodyZone: "Whole Body",
    prompt: "What work are you doing that you do not actually need to be doing?",
    quote: "If you do not choose your work, your work will choose you. Rude arrangement."
  },
  {
    title: "The Decision You Are Dreading",
    category: "Decision-Making",
    bodyZone: "Whole Body",
    prompt: "What decision are you dreading that you probably already know the answer to?",
    quote: "The decision you are dreading may be the one your body already voted on."
  },
  {
    title: "The Relationship You Are Avoiding",
    category: "Avoidance",
    bodyZone: "Throat & Neck",
    prompt: "What relationship are you avoiding, and what truth would become unavoidable if you spoke?",
    quote: "Avoided conversations grow teeth. Extremely poor design."
  },
  {
    title: "The Person You Are Trying to Save",
    category: "Responsibility",
    bodyZone: "Back & Shoulders",
    prompt: "Who are you trying to save that may need to figure something out without you carrying them?",
    quote: "You are not a lifeguard for people who keep swimming toward drama."
  },
  {
    title: "The Burnout You Are Ignoring",
    category: "Burnout",
    bodyZone: "Sleep / Nervous System",
    prompt: "What would a real break look like, not a fake break where you still check everything?",
    quote: "If you do not choose rest, your body may eventually choose it for you."
  },
  {
    title: "The Control You Are Giving Away",
    category: "Control",
    bodyZone: "Head / Eyes",
    prompt: "What are you trying to control that you actually have no power over?",
    quote: "You cannot control the weather. Bring an umbrella and stop yelling at clouds."
  },
  {
    title: "The Shame You Are Holding",
    category: "Shame",
    bodyZone: "Skin",
    prompt: "What shame keeps returning even though it no longer matches who you are?",
    quote: "Shame is not a moral compass. It is a survival strategy that forgot to retire."
  },
  {
    title: "The Boundary You Keep Crossing",
    category: "Boundaries",
    bodyZone: "Whole Body",
    prompt: "What boundary do you keep crossing with yourself, and what would it take to stop?",
    quote: "Self-betrayal is still betrayal. Unpleasant little accounting fact."
  }
];

const JOURNAL_RESPONSE_RULES: JournalResponseRule[] = [
  {
    keywords: ["walk", "walked", "walking", "exercise", "outside", "fresh air", "hike", "movement"],
    response: "Good. Your nervous system requested movement instead of another appointment with the Doom Couch. A walk counts. Tiny rebellion, real data."
  },
  {
    keywords: ["sleep", "slept", "tired", "exhausted", "fatigue", "nap", "rest"],
    response: "Your body is requesting rest, which is rude because society scheduled you for pretending to be fine. Start with sleep, not martyrdom."
  },
  {
    keywords: ["angry", "mad", "furious", "pissed", "rage", "irritated"],
    response: "There it is. Anger. Not evil, not dramatic, just your boundary system throwing a chair because polite memos were ignored."
  },
  {
    keywords: ["sad", "cried", "crying", "tears", "heartbroken", "miss", "grief"],
    response: "That sounds like grief asking for a chair at the table instead of being shoved into the emotional junk drawer."
  },
  {
    keywords: ["anxious", "nervous", "panic", "worried", "fear", "scared"],
    response: "Your nervous system may be running emergency protocols again. Check the room, check the facts, then remind your body this is not automatically a tiger."
  },
  {
    keywords: ["boundary", "boundaries", "said no", "space", "leave", "done"],
    response: "A boundary has entered the chat. Terrifying, apparently, to anyone who benefited from you not having one."
  },
  {
    keywords: ["avoid", "avoiding", "procrastinate", "put off", "later"],
    response: "Avoidance is movement too. Tragically, it moves in circles. Name the thing. Shrink the first step."
  },
  {
    keywords: ["please", "pleasing", "people pleaser", "said yes", "agree", "agreed"],
    response: "A resentful yes is just a no wearing a cheap disguise. Your body noticed, because apparently someone had to."
  },
  {
    keywords: ["work", "job", "boss", "coworker", "colleague", "deadline"],
    response: "Work stress detected. Reminder: you are a mammal with limits, not a productivity appliance with anxiety firmware."
  },
  {
    keywords: ["relationship", "partner", "spouse", "boyfriend", "girlfriend", "fight", "argument"],
    response: "Relationship stress leaves fingerprints. What was unsaid, swallowed, exaggerated, or performed to keep the peace?"
  },
  {
    keywords: ["lonely", "alone", "isolated", "empty", "nobody"],
    response: "Loneliness is not a character flaw. It is a signal. Unfortunately, connection requires risk, because humans designed everything poorly."
  },
  {
    keywords: ["shame", "ashamed", "embarrassed", "wrong", "stupid"],
    response: "Shame is loud, but not always accurate. Before you believe it, ask whose voice it sounds like."
  },
  {
    keywords: ["numb", "shut down", "nothing", "disconnected", "blank"],
    response: "Numbness is not peace. It is the nervous system pulling the breaker because the lights got too hot."
  },
  {
    keywords: ["overthink", "overthinking", "obsess", "ruminate", "spiral"],
    response: "Your brain is trying to solve an emotional problem with a spreadsheet. Adorable. Ineffective, but adorable."
  },
  {
    keywords: ["drink", "drank", "beer", "wine", "whiskey", "liquor", "substance", "smoke"],
    response: "If something helped you feel less, ask what feeling it helped you avoid. No shame. Just data, which is less fun but more useful."
  },
  {
    keywords: ["pain", "hurts", "ache", "sore", "tight", "tension", "cramps"],
    response: "Pain is information, not a personality test. Track it, respect it, and do not turn self-reflection into medical denial."
  },
  {
    keywords: ["clean", "cleaned", "organize", "organized", "laundry", "dishes"],
    response: "External order can help internal chaos. Just do not confuse a clean counter with a processed feeling, the classic domestic magic trick."
  },
  {
    keywords: ["help", "asked", "need help", "support", "call"],
    response: "Asking for help is not weakness. It is what humans invented before deciding to pretend independence meant suffering quietly."
  },
  {
    keywords: ["idk", "don't know", "dont know", "unsure", "what to say", "blank"],
    response: "Not knowing is still an entry. Start there. The nervous system loves vague dread, so naturally we make it use words."
  },
  {
    keywords: ["walk away", "left", "garage", "car", "drive"],
    response: "You created distance instead of escalating. That counts. Space is not abandonment when it prevents emotional arson."
  }
];

const FALLBACK_RESPONSES = [
  "That sounds like a chapter. Good. Chapters are better than sentences.",
  "You said that. Thank you. The body heard you. Hard part done.",
  "No fireworks needed. You noticed. That counts as work.",
  "Some entries are progress even when they do not feel like it. This one is.",
  "You named it. That is the first step, sometimes the only step for today.",
  "Not every entry needs to be a breakthrough. Sometimes ‘I am tired’ is enough.",
  "The entry is vague, but vague is still data. Annoying, but useful.",
  "You put words on the page instead of letting the body carry the whole suitcase. Good."
];

const SYMPTOM_FALLBACKS: Record<string, string> = {
  back: "Your back may be asking what you are carrying. Also, if it is severe, spreading, numb, weak, or injury-related, let medicine do its actual job.",
  head: "Head tension can have a thousand causes. Reflection question: what thought keeps circling like a mosquito with student loans?",
  shoulder: "Shoulders are suspiciously good at collecting responsibility. What load did you accept without checking the price?",
  stomach: "Your stomach may be reacting to more than food. What did you have to digest emotionally today?",
  throat: "Your throat is the gatekeeper. What did not get said today?",
  chest: "Chest sensations deserve respect. If there is severe pain, shortness of breath, fainting, or spreading pain, get medical help. If mild and familiar, ask what has been pressing on you.",
  jaw: "Jaw tension loves unspoken sentences. What are you biting back?",
  neck: "Neck tension often shows up when you are trying to look everywhere at once. What are you bracing for?",
  tired: "Fatigue is not a personality flaw. What has been spending your energy without permission?"
};

const STORAGE_KEY = "cure-life-reflection-logs";

function getRandomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getJournalResponse(entry: string): string {
  const lower = entry.toLowerCase();

  for (const rule of JOURNAL_RESPONSE_RULES) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      return rule.response;
    }
  }

  for (const [key, response] of Object.entries(SYMPTOM_FALLBACKS)) {
    if (lower.includes(key)) {
      return response;
    }
  }

  return getRandomFrom(FALLBACK_RESPONSES);
}

function getBodyZoneIcon(zone: string): string {
  const icons: Record<string, string> = {
    "Throat & Neck": "🗣️",
    "Stomach & Gut": "🫃",
    "Back & Shoulders": "🏋️",
    "Head / Eyes": "👁️",
    "Whole Body": "🧘",
    "Jaw / TMJ": "🦷",
    "Chest & Breathing": "🫁",
    "Heart / Chest": "❤️",
    "Skin": "🧴",
    "Sleep / Nervous System": "🌙",
    "Hips / Pelvis": "🦵"
  };

  return icons[zone] || "📍";
}

export default function DailyPromptsPanel() {
  const [currentPrompt, setCurrentPrompt] = useState<SomaticPrompt>(() => getRandomFrom(SOMATIC_REFLECTION_PROMPTS));
  const [entryText, setEntryText] = useState("");
  const [doctorResponse, setDoctorResponse] = useState("");
  const [isInspecting, setIsInspecting] = useState(false);
  const [reflections, setReflections] = useState<ReflectionLog[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setReflections(JSON.parse(saved));
      }
    } catch {
      setReflections([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reflections.slice(0, 25)));
    } catch {
      // localStorage can fail in private mode. Naturally.
    }
  }, [reflections]);

  const promptCountLabel = useMemo(() => `${SOMATIC_REFLECTION_PROMPTS.length} reflection prompts loaded`, []);

  const getNewPrompt = () => {
    let next = getRandomFrom(SOMATIC_REFLECTION_PROMPTS);
    if (SOMATIC_REFLECTION_PROMPTS.length > 1) {
      while (next.title === currentPrompt.title) {
        next = getRandomFrom(SOMATIC_REFLECTION_PROMPTS);
      }
    }
    setCurrentPrompt(next);
    setDoctorResponse("");
  };

  const submitReflection = () => {
    const cleaned = entryText.trim();
    if (!cleaned) return;

    setIsInspecting(true);
    window.setTimeout(() => {
      const response = getJournalResponse(cleaned);
      const log: ReflectionLog = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        promptTitle: currentPrompt.title,
        prompt: currentPrompt.prompt,
        category: currentPrompt.category,
        bodyZone: currentPrompt.bodyZone,
        entry: cleaned,
        response,
        timestamp: Date.now()
      };

      setDoctorResponse(response);
      setReflections((prev) => [log, ...prev].slice(0, 25));
      setIsInspecting(false);
    }, 550);
  };

  const clearLogs = () => {
    setReflections([]);
    setDoctorResponse("");
  };

  return (
    <section className="w-full max-w-6xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-[2.4rem] border border-indigo-400/15 bg-gradient-to-br from-indigo-950/25 via-black/85 to-[#05070B] p-6 md:p-8 shadow-[0_0_55px_rgba(99,102,241,0.12)] backdrop-blur-xl premium-3d-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(168,85,247,0.12),transparent_32%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-950/30 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-indigo-300 animate-pulse shadow-[0_0_14px_rgba(129,140,248,0.8)]" />
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-indigo-300">
                Somatic Reflection of the Day
              </span>
            </div>

            <div>
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white">
                {currentPrompt.title}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-widest">
                <span className="rounded-full border border-indigo-400/20 bg-indigo-950/25 px-3 py-1 text-indigo-200">
                  {currentPrompt.category}
                </span>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-950/20 px-3 py-1 text-cyan-200">
                  {getBodyZoneIcon(currentPrompt.bodyZone)} {currentPrompt.bodyZone}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-slate-400">
                  {promptCountLabel}
                </span>
              </div>
            </div>

            <p className="text-base md:text-lg leading-8 text-slate-200 max-w-3xl">
              {currentPrompt.prompt}
            </p>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4 text-sm italic text-slate-300 shadow-[inset_0_0_22px_rgba(255,255,255,0.025)]">
              “{currentPrompt.quote}”
            </div>
          </div>

          <button
            type="button"
            onClick={getNewPrompt}
            className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[11px] font-mono font-black uppercase tracking-widest text-slate-300 transition-all hover:-translate-y-1 hover:border-indigo-300/35 hover:text-white hover:shadow-[0_0_28px_rgba(99,102,241,0.18)] cursor-pointer"
          >
            New Prompt
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 relative overflow-hidden rounded-[2.1rem] border border-white/10 bg-gradient-to-br from-white/[0.055] via-black/80 to-[#05070B] p-5 md:p-6 shadow-[0_0_45px_rgba(0,0,0,0.35)] backdrop-blur-xl premium-3d-card">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-mono font-black uppercase tracking-[0.18em] text-white">
                Write What Came Up
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-6">
                No diagnosis. No mystical certainty. Just noticing what your body and behavior are already hinting at, because apparently subtlety failed.
              </p>
            </div>

            <textarea
              value={entryText}
              onChange={(e) => setEntryText(e.target.value)}
              placeholder="Write the honest version here..."
              className="min-h-[180px] w-full resize-none rounded-[1.4rem] border border-white/10 bg-black/45 p-4 text-sm leading-7 text-white placeholder:text-slate-600 outline-none transition-all focus:border-indigo-400/40 focus:shadow-[0_0_28px_rgba(99,102,241,0.14)]"
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={submitReflection}
                disabled={!entryText.trim() || isInspecting}
                className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-[11px] font-mono font-black uppercase tracking-widest text-white shadow-[0_0_25px_rgba(99,102,241,0.24)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isInspecting ? "Dr. Sarcasticus is inspecting..." : "Submit to Doctor"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEntryText("");
                  setDoctorResponse("");
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3 text-[11px] font-mono font-black uppercase tracking-widest text-slate-400 transition-all hover:text-white hover:border-white/20 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-5 space-y-6">
          <div className="relative overflow-hidden rounded-[2.1rem] border border-amber-400/20 bg-gradient-to-br from-amber-950/22 via-black/85 to-[#05070B] p-5 md:p-6 shadow-[0_0_45px_rgba(245,158,11,0.12)] backdrop-blur-xl premium-3d-card">
            <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-400/10 pb-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-amber-300 font-black">
                  Dr. Sarcasticus’ Diagnosis
                </span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-amber-500/70">
                  Entry-aware
                </span>
              </div>

              {doctorResponse ? (
                <p className="text-sm leading-7 text-amber-100">
                  “{doctorResponse}”
                </p>
              ) : (
                <p className="text-sm leading-7 text-slate-400">
                  Submit a reflection and the doctor will respond to what you actually wrote, instead of assigning you random posture sins like a tiny judgmental chiropractor.
                </p>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.1rem] border border-white/10 bg-gradient-to-br from-white/[0.045] via-black/80 to-[#05070B] p-5 md:p-6 shadow-[0_0_45px_rgba(0,0,0,0.34)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-slate-300 font-black">
                Reflection Logs ({reflections.length})
              </span>

              {reflections.length > 0 && (
                <button
                  type="button"
                  onClick={clearLogs}
                  className="text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-red-300 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3 max-h-[430px] overflow-y-auto pr-1">
              {reflections.length === 0 ? (
                <p className="text-xs leading-6 text-slate-500">
                  No logs yet. Humanity survives another empty ledger.
                </p>
              ) : (
                reflections.map((log) => (
                  <article
                    key={log.id}
                    className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4 shadow-[inset_0_0_18px_rgba(255,255,255,0.02)] transition-all hover:-translate-y-0.5 hover:border-indigo-300/20 premium-3d-card"
                  >
                    <div className="flex flex-wrap gap-2 text-[9px] font-mono uppercase tracking-widest text-slate-500">
                      <span>{log.category}</span>
                      <span>•</span>
                      <span>{log.bodyZone}</span>
                    </div>
                    <h4 className="mt-2 text-sm font-black text-white">
                      {log.promptTitle}
                    </h4>
                    <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-400">
                      {log.entry}
                    </p>
                    <p className="mt-3 text-xs leading-6 text-amber-200/90">
                      ↳ {log.response}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
