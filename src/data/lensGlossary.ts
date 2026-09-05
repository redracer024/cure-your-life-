export type LensGlossaryCategory =
  | 'Mind–Body Science'
  | 'Traditional Chinese Medicine'
  | 'Ayurveda'
  | 'Chakra & Yogic'
  | 'Metaphysical Symbolism'
  | 'Depth Psychology'
  | 'Somatic Traditions';

export interface LensGlossaryEntry {
  term: string;
  definition: string;
  category: LensGlossaryCategory;
  aliases?: string[];
}

export const lensGlossaryEntries: LensGlossaryEntry[] = [
  // ---------------------------------------------------------------
  // Mind–Body Science
  // ---------------------------------------------------------------
  {
    term: 'Autonomic nervous system',
    definition:
      'The body system that automatically helps regulate functions such as heart rate, blood pressure, digestion, sweating, bladder activity, sexual response, and threat physiology. Stress and perceived danger can change autonomic state without making a symptom imaginary.',
    category: 'Mind–Body Science',
  },
  {
    term: 'Guarding',
    definition:
      'Protective muscular tightening around an injured, painful, vulnerable, or anticipated-to-be-painful area. Guarding can be useful temporarily but may become part of a persistent pain cycle.',
    category: 'Mind–Body Science',
    aliases: [
      'muscle guarding',
      'muscular guarding',
      'pelvic-floor guarding',
      'pelvic floor guarding',
    ],
  },
  {
    term: 'Interoception',
    definition:
      'The brain and nervous system’s perception of signals coming from inside the body, such as heartbeat, bladder fullness, breathing, pain, temperature, nausea, or muscle tension.',
    category: 'Mind–Body Science',
  },
  {
    term: 'Hypervigilance',
    definition:
      'Intense monitoring for danger or symptoms. After frightening or recurrent illness, normal sensations may receive much more attention because the nervous system is trying not to miss another threat.',
    category: 'Mind–Body Science',
    aliases: ['hypervigilant'],
  },
  {
    term: 'Conditioned response',
    definition:
      'A learned body response in which a situation, sensation, movement, sexual activity, bathroom visit, food, place, or other cue begins triggering protection because it has repeatedly been associated with pain or danger.',
    category: 'Mind–Body Science',
  },
  {
    term: 'Sensitization',
    definition:
      'In some chronic pain conditions, pain-processing systems can become more responsive so that the same input produces a stronger experience. This does not mean the pain is imagined or that every chronic condition involves sensitization.',
    category: 'Mind–Body Science',
    aliases: ['pain sensitization', 'central sensitization'],
  },

  // ---------------------------------------------------------------
  // Traditional Chinese Medicine
  // ---------------------------------------------------------------
  {
    term: 'Qi',
    definition:
      'A foundational TCM concept describing functional vitality, activity, transformation, and movement. Qi is part of the internal language of Chinese medicine; it is not simply another name for electricity, oxygen, blood flow, or any single measurable substance.',
    category: 'Traditional Chinese Medicine',
  },
  {
    term: 'Qi Stagnation',
    definition:
      'A traditional pattern in which the normal movement or function of Qi is considered constrained. Depending on the system involved, it may be associated with tension, distension, frustration, emotional constraint, pain, or symptoms that seem stuck or variable.',
    category: 'Traditional Chinese Medicine',
    aliases: ['Qi stagnation'],
  },
  {
    term: 'Liver Qi Stagnation',
    definition:
      'A common TCM pattern involving impaired smooth movement associated with the Liver functional system. Traditional descriptions often connect it with frustration, irritability, constraint, tension, distension, and symptoms influenced by emotional stress. It does not mean biomedical liver disease.',
    category: 'Traditional Chinese Medicine',
    aliases: ['Liver Qi stagnation', 'liver qi stagnation'],
  },
  {
    term: 'Jing / Essence',
    definition:
      'A foundational TCM concept strongly associated with the Kidney system, constitution, ancestry, reproduction, development, maturation, aging, and deep reserves of vitality. Jing should not be translated as testosterone, DNA, sperm, or any one biomedical substance.',
    category: 'Traditional Chinese Medicine',
    aliases: ['Jing', 'Kidney Jing', 'Essence'],
  },
  {
    term: 'Kidney system',
    definition:
      'The TCM Kidney system is much broader than the anatomical kidneys. Traditional functions include storing Essence, reproduction, growth and development, aging, water regulation, bones and marrow, aspects of hearing, fear, and will. “Kidney deficiency” in TCM therefore does not automatically mean biomedical kidney disease.',
    category: 'Traditional Chinese Medicine',
    aliases: ['TCM Kidney', 'Kidney system'],
  },
  {
    term: 'Kidney Yin',
    definition:
      'The nourishing, cooling, moistening, and substance-oriented aspect of the Kidney system within TCM. A Kidney Yin pattern belongs to traditional pattern diagnosis and is not a laboratory diagnosis.',
    category: 'Traditional Chinese Medicine',
    aliases: ['Kidney Yin deficiency', 'Kidney yin', 'Kidney yin deficiency'],
  },
  {
    term: 'Kidney Yang',
    definition:
      'The warming, activating, transforming, and functional aspect of the Kidney system within TCM. Kidney Yang deficiency does not mean low testosterone or a specific endocrine disorder.',
    category: 'Traditional Chinese Medicine',
    aliases: ['Kidney Yang deficiency', 'Kidney yang', 'Kidney yang deficiency'],
  },
  {
    term: 'Zhi / Will',
    definition:
      'The traditional spirit or will aspect associated with the Kidney system. It concerns direction, perseverance, intention, survival drive, and the capacity to continue toward what matters.',
    category: 'Traditional Chinese Medicine',
  },
  {
    term: 'Dampness',
    definition:
      'A TCM pattern involving heaviness, sluggishness, accumulation, turbidity, or impaired transformation and movement of fluids or function. It is a traditional pattern concept, not literal moisture sitting inside an organ.',
    category: 'Traditional Chinese Medicine',
    aliases: ['Damp'],
  },
  {
    term: 'Heat',
    definition:
      'A TCM pattern quality associated with features such as warmth, redness, burning, agitation, thirst, rapidity, or inflammatory-looking symptoms. TCM Heat is not identical to biomedical inflammation or infection.',
    category: 'Traditional Chinese Medicine',
    aliases: ['Heat pattern'],
  },
  {
    term: 'Damp-Heat',
    definition:
      'A combined TCM pattern involving both accumulation or turbidity and Heat. In urinary conditions it may be used for patterns involving burning, urgency, dark or turbid urine, discomfort, or other features. Damp-Heat is not another word for bacteria.',
    category: 'Traditional Chinese Medicine',
    aliases: [
      'Damp Heat',
      'Damp-Heat',
      'Damp Heat in the Lower Jiao',
      'Damp-Heat in the Lower Jiao',
      'Damp Heat in the Bladder',
      'Damp-Heat in the Bladder',
    ],
  },
  {
    term: 'Blood Stasis',
    definition:
      'A traditional pattern describing impaired or obstructed movement of Blood within TCM. It may be associated with fixed, stabbing, persistent, dark-colored, or mass-like presentations depending on context. It does not automatically mean a biomedical blood clot.',
    category: 'Traditional Chinese Medicine',
    aliases: ['Blood stasis'],
  },
  {
    term: 'Lower Jiao',
    definition:
      'The lower functional region of the San Jiao system in TCM, broadly involving lower abdominal, urinary, reproductive, and bowel functions. It is not one anatomical organ.',
    category: 'Traditional Chinese Medicine',
    aliases: ['lower jiao', 'Lower Burner', 'lower burner'],
  },
  {
    term: 'Stone Lin / Shi Lin',
    definition:
      'A traditional Chinese medicine urinary pattern involving difficult or painful urination and stone-like material. Kidney and urinary stones may be discussed within this traditional category, often alongside patterns such as Damp-Heat, Qi constraint, or deficiency depending on the person’s overall presentation.',
    category: 'Traditional Chinese Medicine',
    aliases: ['Stone Lin', 'Shi Lin', 'Stone Strangury'],
  },

  // ---------------------------------------------------------------
  // Ayurveda
  // ---------------------------------------------------------------
  {
    term: 'Dosha',
    definition:
      'A major Ayurvedic organizing principle describing functional patterns in the body and mind. The three primary doshas are Vata, Pitta, and Kapha.',
    category: 'Ayurveda',
  },
  {
    term: 'Vata',
    definition:
      'The Ayurvedic principle associated with movement, change, dryness, lightness, variability, nerve-like activity, circulation, and elimination. Vata is not simply the nervous system.',
    category: 'Ayurveda',
  },
  {
    term: 'Pitta',
    definition:
      'The Ayurvedic principle associated with heat, transformation, digestion, intensity, metabolism, and discrimination. Pitta is not simply inflammation or stomach acid.',
    category: 'Ayurveda',
  },
  {
    term: 'Kapha',
    definition:
      'The Ayurvedic principle associated with structure, stability, cohesion, nourishment, heaviness, lubrication, and accumulation. Kapha is not simply body fat or mucus.',
    category: 'Ayurveda',
  },
  {
    term: 'Apana Vayu',
    definition:
      'The downward-moving subdivision of Vata traditionally associated with elimination, urination, menstruation, reproductive functions, childbirth, and movement through the pelvis.',
    category: 'Ayurveda',
    aliases: ['Apana vayu'],
  },
  {
    term: 'Agni',
    definition:
      'The Ayurvedic concept of transformative or digestive power. It includes digestion but is broader than stomach acid, enzymes, or metabolic rate.',
    category: 'Ayurveda',
  },
  {
    term: 'Ama',
    definition:
      'An Ayurvedic concept describing inadequately transformed or processed material that can accumulate and interfere with healthy function. It is often translated as “toxins,” but it is not equivalent to a specific biomedical toxin measured in blood.',
    category: 'Ayurveda',
  },
  {
    term: 'Dhatu',
    definition:
      'One of Ayurveda’s traditional tissue categories or supporting bodily structures.',
    category: 'Ayurveda',
  },
  {
    term: 'Shukra Dhatu',
    definition:
      'The reproductive-tissue principle within Ayurveda. It belongs to a larger system of tissue nourishment and reproductive vitality and should not be reduced to semen, sperm count, estrogen, or testosterone.',
    category: 'Ayurveda',
    aliases: ['Shukra dhatu'],
  },
  {
    term: 'Rakta Dhatu',
    definition:
      'The Ayurvedic blood-tissue category. It overlaps symbolically with blood but is part of Ayurveda’s own tissue model rather than a direct synonym for a complete blood count.',
    category: 'Ayurveda',
    aliases: ['Rakta dhatu'],
  },
  {
    term: 'Srotas',
    definition:
      'A traditional Ayurvedic concept of channels or pathways through which substances and functions move.',
    category: 'Ayurveda',
  },
  {
    term: 'Mutravaha Srotas',
    definition:
      'The Ayurvedic urinary-channel system involved in the formation, movement, and elimination of urine within the traditional model.',
    category: 'Ayurveda',
    aliases: ['Mutravaha srotas'],
  },
  {
    term: 'Ashmari',
    definition:
      'The classical Ayurvedic category associated with urinary stones. Different doshic patterns may be used to describe different presentations. Ashmari is a traditional disease concept, not proof that doshas are biomedical mechanisms of mineral crystallization.',
    category: 'Ayurveda',
  },
  {
    term: 'Ojas',
    definition:
      'A traditional Ayurvedic concept associated with deep vitality, resilience, nourishment, stability, and the refined result of healthy tissue support. It should not be reduced to immunity or any single biomarker.',
    category: 'Ayurveda',
  },

  // ---------------------------------------------------------------
  // Chakra & Yogic
  // ---------------------------------------------------------------
  {
    term: 'Muladhara / Root',
    definition:
      'Commonly associated with grounding, embodiment, physical existence, survival, stability, home, belonging, security, and the foundation from which other development occurs. Modern chakra psychology often extends these themes into money, housing, family, and basic safety.',
    category: 'Chakra & Yogic',
    aliases: ['Muladhara', 'Root chakra', 'Root Chakra'],
  },
  {
    term: 'Svadhisthana / Sacral',
    definition:
      'Commonly associated in modern chakra psychology with sexuality, pleasure, intimacy, emotional flow, desire, creativity, fertility, receptivity, relationship, and the Water element.',
    category: 'Chakra & Yogic',
    aliases: ['Svadhisthana', 'Sacral chakra', 'Sacral Chakra'],
  },
  {
    term: 'Manipura / Solar Plexus',
    definition:
      'Commonly associated with agency, will, personal power, action, self-definition, transformation, discipline, confidence, and control.',
    category: 'Chakra & Yogic',
    aliases: ['Manipura', 'Solar Plexus', 'Solar Plexus chakra', 'Solar Plexus Chakra'],
  },
  {
    term: 'Anahata / Heart',
    definition:
      'Commonly associated with love, compassion, attachment, grief, connection, receiving, giving, and relationship.',
    category: 'Chakra & Yogic',
    aliases: ['Anahata', 'Heart chakra', 'Heart Chakra'],
  },
  {
    term: 'Vishuddha / Throat',
    definition:
      'Commonly associated with expression, communication, truth, voice, restraint, and the tension between speaking and withholding.',
    category: 'Chakra & Yogic',
    aliases: ['Vishuddha', 'Throat chakra', 'Throat Chakra'],
  },
  {
    term: 'Ajna / Third Eye',
    definition:
      'Commonly associated with perception, interpretation, insight, imagination, intuition, and the stories through which experience is understood.',
    category: 'Chakra & Yogic',
    aliases: ['Ajna', 'Third Eye', 'Third Eye chakra', 'Third Eye Chakra'],
  },
  {
    term: 'Sahasrara / Crown',
    definition:
      'Commonly associated with meaning, transcendence, spiritual orientation, consciousness, and relationship to something larger than the individual self.',
    category: 'Chakra & Yogic',
    aliases: ['Sahasrara', 'Crown chakra', 'Crown Chakra'],
  },

  // ---------------------------------------------------------------
  // Metaphysical Disease Symbolism
  // ---------------------------------------------------------------
  {
    term: 'Symptom-symbol',
    definition:
      'The idea that a physical symptom can be examined for symbolic meaning based on what the affected body part does, where it is located, how the symptom behaves, or what image it evokes.',
    category: 'Metaphysical Symbolism',
  },
  {
    term: 'Crystallization',
    definition:
      'A recurring symbolic theme for conditions involving stones, deposits, or hardening: something once fluid becomes fixed, dense, rigid, or difficult to move. Some metaphysical authors go further and propose that unresolved emotional hardening contributes to the physical condition itself.',
    category: 'Metaphysical Symbolism',
  },
  {
    term: 'Holding / Letting go',
    definition:
      'A symbolic family built around retention, release, elimination, attachment, control, grief, resentment, or difficulty allowing a process to move on.',
    category: 'Metaphysical Symbolism',
  },
  {
    term: 'Flow / Stagnation',
    definition:
      'A symbolic contrast between movement and restriction. It appears in many unrelated systems, including metaphysical disease symbolism, chakra psychology, Chinese medicine, and body psychotherapy, but those systems do not necessarily mean the same thing by it.',
    category: 'Metaphysical Symbolism',
  },
  {
    term: 'Boundary',
    definition:
      'A symbolic theme involving what belongs inside or outside, who or what is allowed access, privacy, invasion, protection, closeness, separation, and the ability to say yes or no.',
    category: 'Metaphysical Symbolism',
  },
  {
    term: 'Generativity',
    definition:
      'The capacity to create, reproduce, build, mentor, teach, influence, nurture, or leave something behind. It is broader than biological fertility.',
    category: 'Metaphysical Symbolism',
  },

  // ---------------------------------------------------------------
  // Depth Psychology & Archetypal Symbolism
  // ---------------------------------------------------------------
  {
    term: 'Shadow',
    definition:
      'A depth-psychological term for parts of experience, personality, desire, vulnerability, anger, fear, grief, or identity that are difficult to acknowledge or have been pushed outside the conscious self-image.',
    category: 'Depth Psychology',
    aliases: ['the Shadow', 'Shadow material'],
  },
  {
    term: 'Archetype',
    definition:
      'A recurring symbolic pattern or human role such as Warrior, Mother, Child, Trickster, Lover, King, Queen, Healer, Elder, Exile, or Wounded Hero. BodySignal uses archetypes as reflective structures, not diagnoses.',
    category: 'Depth Psychology',
    aliases: ['archetypal', 'archetype'],
  },
  {
    term: 'Descent',
    definition:
      'A mythic pattern in which ordinary life is interrupted by loss, illness, grief, uncertainty, or confrontation with what cannot be controlled. Stories of descent and return can help organize experience without explaining pathology.',
    category: 'Depth Psychology',
  },
  {
    term: 'Initiation / Ordeal',
    definition:
      'The symbolic idea that a difficult passage changes identity or forces the person into knowledge they did not previously possess.',
    category: 'Depth Psychology',
  },
  {
    term: 'Jungian-style lens',
    definition:
      'A BodySignal interpretation inspired by depth-psychological concepts such as Shadow, archetype, symbol, or individuation when no verified source shows that Carl Jung himself made the specific disease association.',
    category: 'Depth Psychology',
  },

  // ---------------------------------------------------------------
  // Body Psychotherapy & Somatic Traditions
  // ---------------------------------------------------------------
  {
    term: 'Armor',
    definition:
      'A historical Reichian concept describing chronic bodily and muscular patterns understood as defenses against emotion, vulnerability, spontaneous expression, or sexuality. It is a body-psychotherapy theory, not a modern medical diagnosis.',
    category: 'Somatic Traditions',
    aliases: ['armoring', 'pelvic armor', 'muscular armor'],
  },
  {
    term: 'Grounding',
    definition:
      'A body-oriented practice or quality involving awareness of physical support, contact with the environment, present-moment sensation, and a sense of stability in the body.',
    category: 'Somatic Traditions',
  },
  {
    term: 'Protective bracing',
    definition:
      'A modern descriptive term for muscular tightening intended to protect a painful, injured, vulnerable, or threatened area.',
    category: 'Somatic Traditions',
  },
  {
    term: 'Freeze',
    definition:
      'A term used in trauma and somatic traditions for states involving inhibited action, immobility, shutdown, or defensive responses when fight or flight is not possible or effective. It should not be used to claim that every chronic symptom is unresolved trauma.',
    category: 'Somatic Traditions',
  },
];
