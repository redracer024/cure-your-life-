import React, { useMemo, useState } from 'react';
import {
  Activity,
  Brain,
  Compass,
  Flower2,
  Layers,
  Leaf,
  Search,
  Sparkles,
  Waves,
  X,
  type LucideIcon,
} from 'lucide-react';
import { lensGlossaryEntries, type LensGlossaryCategory } from '../data/lensGlossary';

interface LensTerm {
  term: string;
  definition: string;
}

interface LensNote {
  title: string;
  body: string[];
}

interface LensSection {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  icon: LucideIcon;
  terms: LensTerm[];
  note?: LensNote;
}

interface EvidenceItem {
  title: string;
  body: string;
  accent: string;
}

const HERO_PARAGRAPHS: string[] = [
  'BodySignal looks at one physical experience through several different maps. Modern biomedicine describes anatomy, chemistry, physiology, pathogens, genetics, and measurable mechanisms. Somatic and mind–body science examines interactions among the nervous system, behavior, stress, pain, sleep, learning, relationships, and the body. Traditional systems such as Chinese medicine and Ayurveda use their own models of organs, energy, constitution, movement, and imbalance. Metaphysical and symbolic traditions explore emotional, relational, developmental, spiritual, and archetypal root patterns. BodySignal does not require these maps to agree or pretend that one can simply be translated into another.',
  'Some traditional and metaphysical systems explicitly propose that unresolved emotional, relational, energetic, or spiritual patterns can contribute to physical illness. BodySignal presents those theories as those traditions actually propose them rather than weakening every claim into a decorative metaphor. At the same time, a traditional energetic explanation is not automatically an established biomedical mechanism. When modern evidence has not established a specific causal pathway, BodySignal says so. The goal is deeper investigation without either dismissing traditional knowledge or pretending uncertainty is proof.',
];

const ROOT_CAUSE_TITLE = 'What does “root cause” mean here?';

const ROOT_CAUSE_BODY: string[] = [
  'BodySignal uses “root pattern” broadly because human problems rarely fit inside one explanatory box. A root may be a documented medical cause, a physiological contributor, a learned nervous-system pattern, a behavior that repeatedly changes physical conditions, an unresolved relationship or developmental pattern, or a proposed energetic or metaphysical cause within a traditional system.',
  'Those categories are not interchangeable. If chronic muscle guarding is contributing to pelvic pain, that can be discussed as a physiological mind–body pathway. If Traditional Chinese Medicine proposes Liver Qi Stagnation or Damp-Heat, that should be explained inside the TCM model. If a disease-symbolism author proposes that resentment or fear contributes to a condition, BodySignal can present that theory faithfully while identifying it as metaphysical rather than pretending that biomedicine has established the same mechanism.',
  'The point is not to force every symptom into psychology. The point is to investigate the whole pattern instead of stopping wherever one discipline runs out of vocabulary.',
];

const EVIDENCE_TITLE = 'How BodySignal labels different kinds of claims';

const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    title: 'Established / Well-Supported',
    body: 'There is substantial modern evidence for the pathway or relationship being described. Example: chronic pain can produce protective muscle guarding, altered activity, disrupted sleep, and nervous-system sensitization.',
    accent: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  },
  {
    title: 'Plausible / Indirect',
    body: 'A reasonable pathway exists, but it may operate through behavior or several intermediate steps rather than being a direct cause. Example: work stress may contribute to poor hydration because someone repeatedly skips drinking or bathroom breaks; chronic low fluid intake can then affect kidney-stone risk.',
    accent: 'text-sky-300 border-sky-500/30 bg-sky-500/10',
  },
  {
    title: 'Uncertain / Emerging',
    body: 'There is research or biological plausibility, but the evidence is incomplete, mixed, or too early for a strong conclusion.',
    accent: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  },
  {
    title: 'Traditional / Metaphysical',
    body: 'A traditional, spiritual, energetic, historical psychosomatic, or disease-symbolism system proposes the connection. BodySignal describes the theory faithfully but does not silently convert it into established modern physiology.',
    accent: 'text-violet-300 border-violet-500/30 bg-violet-500/10',
  },
  {
    title: 'Not Supported as a Biomedical Cause',
    body: 'Modern evidence does not support the proposed factor as a demonstrated cause of the physical disease. This does not prevent BodySignal from exploring the same theme symbolically or presenting a traditional system that proposes a different model.',
    accent: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
  },
];

interface LensSectionConfig {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  icon: LucideIcon;
  category: LensGlossaryCategory;
  note?: LensNote;
}

const LENS_SECTION_CONFIG: LensSectionConfig[] = [
  {
    id: 'medical-mind-body',
    eyebrow: 'LENS 01',
    title: 'Modern Medical & Mind–Body Science',
    intro: 'This lens asks what is happening anatomically and physiologically, what medical causes must be considered, and where mind, behavior, environment, and nervous-system state can measurably interact with the body.',
    icon: Activity,
    category: 'Mind–Body Science',
  },
  {
    id: 'tcm',
    eyebrow: 'LENS 02',
    title: 'Traditional Chinese Medicine',
    intro: 'Traditional Chinese Medicine, or TCM, uses a functional system that developed independently from modern anatomy. Words such as Kidney, Liver, Blood, Dampness, Heat, and Essence often have meanings much broader than the modern organs or substances with the same English names. When BodySignal uses a TCM term, read it as part of that traditional system unless it explicitly says otherwise.',
    icon: Waves,
    category: 'Traditional Chinese Medicine',
    note: {
      title: 'Fear, the Kidney system, and “root” patterns',
      body: [
        'Within Chinese medicine, the Kidney system is traditionally associated with fear, survival, ancestry and Jing, reproduction, aging, Water, and Zhi or will. Some TCM and modern energetic interpretations therefore explore prolonged fear, shock, depletion, constraint, or loss of direction as meaningful contributors to Kidney-system imbalance.',
        'That is a stronger claim than simply saying fear is a metaphor. It should be understood inside the traditional model. It does not mean modern nephrology has established that fear directly creates kidney stones, kidney failure, or another specific renal disease through the same mechanism.',
      ],
    },
  },
  {
    id: 'ayurveda',
    eyebrow: 'LENS 03',
    title: 'Ayurveda',
    intro: 'Ayurveda is a traditional South Asian medical system with its own concepts of constitution, tissues, channels, digestion, movement, and imbalance. Its terminology should be understood within Ayurveda rather than converted into modern laboratory values.',
    icon: Leaf,
    category: 'Ayurveda',
  },
  {
    id: 'chakra',
    eyebrow: 'LENS 04',
    title: 'Chakra & Yogic Perspectives',
    intro: 'Chakra traditions describe centers used in yogic, tantric, meditative, and later energetic systems. Modern Western chakra psychology adds many detailed emotional and organ associations that are not uniformly found in older yogic texts. BodySignal distinguishes the broader historical tradition from later psychological interpretation when that difference matters.',
    icon: Flower2,
    category: 'Chakra & Yogic',
    note: {
      title: 'Does a “blocked chakra” cause disease?',
      body: [
        'Some modern energetic and metaphysical systems explicitly say that persistent energetic blockage can contribute to physical illness. BodySignal can present that claim when a source or tradition actually makes it. Modern biomedicine does not recognize chakra blockage as an established disease mechanism. Those two statements can coexist without BodySignal pretending either tradition said something it did not.',
      ],
    },
  },
  {
    id: 'metaphysical',
    eyebrow: 'LENS 05',
    title: 'Metaphysical Disease Symbolism',
    intro: 'Disease-symbolism authors ask whether the form, location, function, timing, or physical image of an illness expresses a deeper emotional or life pattern. Different authors make claims of very different strength. Some explicitly describe emotional patterns as contributing causes of physical disease; others use illness primarily as a route into meaning and self-examination.',
    icon: Sparkles,
    category: 'Metaphysical Symbolism',
    note: {
      title: 'Why BodySignal names authors',
      body: [
        'Metaphysical authors do not all teach the same system. Rüdiger Dahlke, Thorwald Dethlefsen, Jacques Martel, Lise Bourbeau, Deb Shapiro, Caroline Myss, Louise Hay, Georg Groddeck, Wilhelm Reich, Alexander Lowen, and depth-psychological writers may overlap in themes while disagreeing about why symptoms occur.',
        'When BodySignal can verify that a named author specifically associated a condition with a particular root pattern, it can attribute that idea directly. When only the author’s broader framework is known, BodySignal should say something like “within a Dahlke-style disease-symbolism lens” rather than inventing a condition-specific teaching.',
        'A catchy internet chart is not automatically ancient wisdom, and an AI confidently attaching Carl Jung’s name to an organ does not make Jung responsible for the sentence.',
      ],
    },
  },
  {
    id: 'depth-psychology',
    eyebrow: 'LENS 06',
    title: 'Depth Psychology & Archetypal Symbolism',
    intro: 'Depth psychology asks what an illness, body region, dream, fear, or recurring life pattern evokes psychologically and symbolically. It can explore meaning without claiming that the psyche mechanically manufactured a disease.',
    icon: Brain,
    category: 'Depth Psychology',
  },
  {
    id: 'body-psychotherapy',
    eyebrow: 'LENS 07',
    title: 'Body Psychotherapy & Somatic Traditions',
    intro: 'Body-oriented psychotherapy has a long history. Some early schools made broad claims about muscular tension, emotional repression, sexuality, and illness that are not accepted as modern biomedical mechanisms. Other observations overlap with phenomena that can now be described more directly through muscle activity, autonomic regulation, pain science, learning, and protective behavior.',
    icon: Layers,
    category: 'Somatic Traditions',
  },
];

const LENS_SECTIONS: LensSection[] = LENS_SECTION_CONFIG.map((config) => ({
  ...config,
  terms: lensGlossaryEntries.filter((entry) => entry.category === config.category),
}));

const READING_STEPS: { number: string; title: string; body: string }[] = [
  {
    number: '01',
    title: 'Medical Reality',
    body: 'What can physically cause the symptom or disease? What requires testing, treatment, monitoring, or urgent care?',
  },
  {
    number: '02',
    title: 'Mind–Body & Somatic Pathways',
    body: 'Could stress physiology, sleep, behavior, guarding, conditioning, relationships, environment, avoidance, or nervous-system learning influence the symptom, its severity, its recurrence, or how the person responds to it?',
  },
  {
    number: '03',
    title: 'Traditional & Metaphysical Root Patterns',
    body: 'What do Chinese medicine, Ayurveda, chakra traditions, historical psychosomatic systems, disease-symbolism authors, energetic medicine, or other traditions propose as deeper causes or imbalances?',
  },
  {
    number: '04',
    title: 'Symbolic & Personal Meaning',
    body: 'Regardless of cause, what themes does the physical experience bring into view about identity, relationships, fear, grief, sexuality, control, survival, boundaries, creativity, purpose, or change?',
  },
];

const FINAL_CARD_TITLE = 'Two mistakes BodySignal is designed to avoid';

const FINAL_CARD_BODY: string[] = [
  'Mistake one is reducing every illness to emotion: “You are sick because you failed to process something.” That can become inaccurate, cruel, and medically dangerous.',
  'Mistake two is pretending the only meaningful question is what can currently be measured in a laboratory. Human beings have spent thousands of years building different maps of suffering, vitality, meaning, relationship, emotion, and the body. Some contain useful observations, some contain disputed theories, and some make claims that modern science has not established.',
  'BodySignal keeps the categories visible, investigates them deeply, and lets you examine the whole pattern without requiring every map to become the same map.',
];

const SEARCH_PLACEHOLDER = 'Search terms like Jing, Damp-Heat, Vata, Sacral, Shadow...';

const TOTAL_TERM_COUNT = LENS_SECTIONS.reduce((total, section) => total + section.terms.length, 0);

export const UnderstandingLenses: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const visibleSections = useMemo(() => {
    if (!isSearching) {
      return LENS_SECTIONS.map(section => ({ section, terms: section.terms }));
    }

    return LENS_SECTIONS
      .map(section => ({
        section,
        terms: section.terms.filter(
          entry =>
            entry.term.toLowerCase().includes(normalizedQuery) ||
            entry.definition.toLowerCase().includes(normalizedQuery)
        ),
      }))
      .filter(group => group.terms.length > 0);
  }, [isSearching, normalizedQuery]);

  const matchCount = visibleSections.reduce((total, group) => total + group.terms.length, 0);

  return (
    <main className="flex-1 min-h-0 flex flex-col p-6 md:p-10 overflow-y-auto w-full">
      <div className="w-full max-w-6xl mx-auto space-y-10 pb-16">

        {/* HERO */}
        <header className="space-y-5">
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-black">
            BODYSIGNAL FIELD GUIDE
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-display">
            Understanding<br />
            <span className="text-indigo-500">the Lenses</span>
          </h1>
          <div className="space-y-4 max-w-4xl">
            {HERO_PARAGRAPHS.map(paragraph => (
              <p key={paragraph.slice(0, 40)} className="text-sm md:text-base text-slate-300 leading-8 font-sans font-light">
                {paragraph}
              </p>
            ))}
          </div>
        </header>

        {/* ROOT CAUSE */}
        <section
          aria-labelledby="lenses-root-cause"
          className="glass-panel rounded-3xl border border-white/5 p-6 md:p-8 space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 shrink-0">
              <Compass className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 id="lenses-root-cause" className="text-xl md:text-2xl font-black tracking-tight text-white font-display pt-1.5">
              {ROOT_CAUSE_TITLE}
            </h2>
          </div>
          <div className="space-y-4">
            {ROOT_CAUSE_BODY.map(paragraph => (
              <p key={paragraph.slice(0, 40)} className="text-sm text-slate-300 leading-7 font-sans font-light">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* EVIDENCE MAP */}
        <section
          aria-labelledby="lenses-evidence-map"
          className="glass-panel rounded-3xl border border-white/5 p-6 md:p-8 space-y-5"
        >
          <h2 id="lenses-evidence-map" className="text-xl md:text-2xl font-black tracking-tight text-white font-display">
            {EVIDENCE_TITLE}
          </h2>
          <ol className="space-y-3">
            {EVIDENCE_ITEMS.map(item => (
              <li key={item.title} className="rounded-2xl border border-white/5 bg-black/40 p-5 space-y-2">
                <span className={`inline-block px-3 py-1 rounded-full border text-[11px] font-mono font-black uppercase tracking-widest ${item.accent}`}>
                  {item.title}
                </span>
                <p className="text-sm text-slate-300 leading-7 font-sans font-light">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* SEARCH */}
        <section aria-labelledby="lenses-search-label" className="space-y-3">
          <label
            id="lenses-search-label"
            htmlFor="lenses-search"
            className="block text-xs font-mono text-indigo-400 uppercase tracking-widest font-black"
          >
            Search the lens glossary
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" aria-hidden="true" />
            <input
              id="lenses-search"
              type="text"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder={SEARCH_PLACEHOLDER}
              className="w-full pl-11 pr-12 py-3 bg-black/40 border border-white/5 rounded-2xl text-sm text-white placeholder-slate-500 font-sans font-light focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
            {isSearching && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear lens glossary search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:border-indigo-500/40 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500" aria-live="polite">
            {isSearching
              ? `${matchCount} of ${TOTAL_TERM_COUNT} terms matching`
              : `${TOTAL_TERM_COUNT} terms across ${LENS_SECTIONS.length} lenses`}
          </p>
        </section>

        {/* LENS SECTIONS */}
        {isSearching && matchCount === 0 ? (
          <div className="rounded-3xl border border-white/10 border-dashed bg-black/40 p-10 md:p-12 space-y-3">
            <h3 className="text-sm font-mono text-slate-300 uppercase tracking-widest font-black">
              No matching lens terms found.
            </h3>
            <p className="text-sm text-slate-400 leading-7 font-sans font-light">
              Try a broader word such as fear, flow, kidney, energy, or pain.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {visibleSections.map(({ section, terms }) => {
              const Icon = section.icon;
              return (
                <section
                  key={section.id}
                  aria-labelledby={`lens-${section.id}-title`}
                  className="space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                        <Icon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-black">
                        {section.eyebrow}
                      </span>
                    </div>
                    <h2
                      id={`lens-${section.id}-title`}
                      className="text-2xl md:text-3xl font-black tracking-tight text-white font-display"
                    >
                      {section.title}
                    </h2>
                    <p className="text-sm text-slate-300 leading-7 font-sans font-light max-w-4xl">
                      {section.intro}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {terms.map(entry => (
                      <article
                        key={entry.term}
                        className="rounded-2xl border border-white/5 bg-black/40 p-5 space-y-2 hover:border-indigo-500/30 transition-colors"
                      >
                        <h3 className="text-sm font-black uppercase tracking-tight text-white font-display">
                          {entry.term}
                        </h3>
                        <p className="text-sm text-slate-300 leading-7 font-sans font-light">
                          {entry.definition}
                        </p>
                      </article>
                    ))}
                  </div>

                  {section.note && (
                    <div className="glass-panel rounded-3xl border border-indigo-500/10 p-6 md:p-7 space-y-3">
                      <h3 className="text-base md:text-lg font-black tracking-tight text-indigo-200 font-display">
                        {section.note.title}
                      </h3>
                      {section.note.body.map(paragraph => (
                        <p key={paragraph.slice(0, 40)} className="text-sm text-slate-300 leading-7 font-sans font-light">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* HOW TO READ A SYMPTOM PAGE */}
        <section aria-labelledby="lenses-how-to-read" className="space-y-5">
          <div className="space-y-3">
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-black">
              HOW TO READ A SYMPTOM PAGE
            </span>
            <h2 id="lenses-how-to-read" className="text-2xl md:text-3xl font-black tracking-tight text-white font-display">
              One condition can have several root maps
            </h2>
          </div>
          <ol className="grid gap-4 md:grid-cols-2">
            {READING_STEPS.map(step => (
              <li key={step.number} className="rounded-2xl border border-white/5 bg-black/40 p-5 space-y-2">
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-black">
                  {step.number}
                </span>
                <h3 className="text-sm font-black uppercase tracking-tight text-white font-display">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-300 leading-7 font-sans font-light">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* FINAL CARD */}
        <section
          aria-labelledby="lenses-final-card"
          className="glass-panel rounded-3xl border border-white/5 p-6 md:p-8 space-y-4"
        >
          <h2 id="lenses-final-card" className="text-xl md:text-2xl font-black tracking-tight text-white font-display">
            {FINAL_CARD_TITLE}
          </h2>
          {FINAL_CARD_BODY.map(paragraph => (
            <p key={paragraph.slice(0, 40)} className="text-sm text-slate-300 leading-7 font-sans font-light">
              {paragraph}
            </p>
          ))}
          <p className="text-sm font-mono text-indigo-300 uppercase tracking-widest font-black pt-2">
            Explore the whole pattern.
          </p>
        </section>

      </div>
    </main>
  );
};

export default UnderstandingLenses;
