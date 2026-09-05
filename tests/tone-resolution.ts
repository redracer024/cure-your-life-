import { readFile } from 'node:fs/promises';
import { getEnrichedAilment } from '../src/lib/ailments/enrichment';
import { resolveAilmentTones } from '../src/lib/ailments/contentSelectors';

let failures = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log('  ok  -', message);
  } else {
    failures++;
    console.error('  FAIL -', message);
  }
}

function joined(value: unknown): string {
  return Array.isArray(value) ? value.join('\n') : String(value ?? '');
}

const asthmaLeakTerms = [
  'rescue inhaler',
  'asthma action plan',
  'wheeze',
];

const placeholderCitationTerms = [
  'Somatic Medicine & Biofeedback Journal',
  'Review of Psychosomatic Fascial Guarding Patterns',
];

const richStructured: any = {
  id: 'rich-structured',
  name: 'Rich Structured',
  category: 'Test',
  physiologicalDescription: 'Core medical mechanism.',
  metaphor: 'Core metaphor.',
  sarcasticAdvice: 'Core brutal.',
  physicalTherapyTip: 'Core protocol.',
  structuredContent: {
    interpretations: {
      clinical: {
        sections: [{ heading: 'Authored clinical heading', body: ['Authored clinical body.'] }],
      },
      witty: {
        paragraphs: ['Authored witty paragraph.'],
      },
      brutal: {
        paragraphs: ['Authored brutal paragraph.'],
      },
    },
  },
  tones: {
    clinical: {
      mechanism: 'Legacy clinical mechanism.',
      protocol: ['Legacy condition-specific protocol.'],
      citations: ['Legacy condition-specific citation.'],
    },
    witty: {
      metaphorTitle: 'Legacy witty title',
      metaphorText: 'Legacy witty text.',
      wittyAdvice: 'Legacy witty advice.',
    },
    brutal: {
      realityCheck: 'Legacy brutal reality.',
      protocolTitle: 'Legacy brutal title',
      protocolSteps: ['Legacy brutal protocol.'],
    },
  },
};

const richTones = resolveAilmentTones(richStructured);
assert(richTones.clinical.mechanism.includes('Authored clinical body'), 'rich authored structured Clinical content wins over fallback');
assert(richTones.witty.metaphorText === 'Authored witty paragraph.', 'rich authored structured Witty content wins over fallback');
assert(richTones.brutal.realityCheck === 'Authored brutal paragraph.', 'rich authored structured Brutal content wins over fallback');
assert(richTones.clinical.protocol[0] === 'Legacy condition-specific protocol.', 'legacy authored protocol remains available with structured text');
assert(richTones.clinical.citations[0] === 'Legacy condition-specific citation.', 'legacy authored citation remains available with structured text');

const legacyOnly: any = {
  id: 'legacy-only',
  name: 'Legacy Only',
  category: 'Test',
  tones: {
    clinical: {
      mechanism: 'Legacy-only mechanism.',
      protocol: ['Legacy-only protocol.'],
      citations: ['Legacy-only citation.'],
    },
    witty: {
      metaphorTitle: 'Legacy-only title',
      metaphorText: 'Legacy-only metaphor.',
      wittyAdvice: 'Legacy-only advice.',
    },
    brutal: {
      realityCheck: 'Legacy-only reality.',
      protocolTitle: 'Legacy-only protocol title',
      protocolSteps: ['Legacy-only brutal step.'],
    },
  },
};
const legacyTones = resolveAilmentTones(legacyOnly);
assert(legacyTones.clinical.mechanism === 'Legacy-only mechanism.', 'legacy authored Clinical tone resolves when structured content is absent');
assert(legacyTones.witty.metaphorText === 'Legacy-only metaphor.', 'legacy authored Witty tone resolves when structured content is absent');
assert(legacyTones.brutal.realityCheck === 'Legacy-only reality.', 'legacy authored Brutal tone resolves when structured content is absent');

const missingContent: any = {
  id: 'missing-content',
  name: 'Missing Content',
  category: 'Test',
};
const missingTones = resolveAilmentTones(missingContent);
assert(missingTones.clinical.protocol.length === 1, 'content-missing ailment receives only one generic Clinical fallback protocol');
assert(missingTones.brutal.protocolSteps.length === 1, 'content-missing ailment receives only one generic Brutal fallback protocol');
assert(missingTones.clinical.citations.length === 0, 'content-missing ailment receives no fallback citations');
assert(!asthmaLeakTerms.some((term) => joined(missingTones.clinical.protocol).includes(term)), 'asthma-specific protocols do not appear in generic Clinical fallback');
assert(!asthmaLeakTerms.some((term) => joined(missingTones.brutal.protocolSteps).includes(term)), 'asthma-specific protocols do not appear in generic Brutal fallback');
assert(!placeholderCitationTerms.some((term) => joined(missingTones.clinical.citations).includes(term)), 'placeholder citation metadata is not exposed as fallback content');

const directString: any = {
  id: 'direct-string',
  name: 'Direct String',
  category: 'Test',
  structuredContent: {
    interpretations: {
      clinical: 'Direct clinical interpretation.',
      witty: 'Direct witty interpretation.',
      brutal: 'Direct brutal interpretation.',
    },
  },
};
const directStringTones = resolveAilmentTones(directString);
assert(directStringTones.clinical.mechanism === 'Direct clinical interpretation.', 'direct-string Clinical interpretation resolves');
assert(directStringTones.witty.metaphorText === 'Direct witty interpretation.', 'direct-string Witty interpretation resolves');
assert(directStringTones.brutal.realityCheck === 'Direct brutal interpretation.', 'direct-string Brutal interpretation resolves');

const core = JSON.parse(await readFile('src/data/ailments-core.json', 'utf8'));
const detailFiles = [
  'src/data/ailments/back-and-shoulders-detail.json',
  'src/data/ailments/chest-and-breathing-detail.json',
  'src/data/ailments/general-and-energy-detail.json',
  'src/data/ailments/head-and-neck-detail.json',
  'src/data/ailments/limbs-and-joints-detail.json',
  'src/data/ailments/metabolic-and-endocrine-detail.json',
  'src/data/ailments/pelvic-urinary-and-reproductive-detail.json',
  'src/data/ailments/skin-and-sleep-detail.json',
  'src/data/ailments/stomach-and-gut-detail.json',
];
const detailsById = new Map<string, any>();
for (const file of detailFiles) {
  const details = JSON.parse(await readFile(file, 'utf8'));
  for (const detail of details) detailsById.set(detail.id, detail);
}

function currentAilment(id: string) {
  const coreItem = core.find((item: any) => item.id === id);
  const detail = detailsById.get(id);
  assert(!!coreItem, `current core record exists for ${id}`);
  return getEnrichedAilment({
    ...coreItem,
    structuredContent: detail?.structuredContent,
    tones: detail?.tones,
    biologyPath: detail?.biologyPath,
    medical_safety: detail?.medical_safety,
  } as any);
}

const asthma = currentAilment('asthma');
assert(joined(asthma.tones.clinical.protocol).includes('rescue inhaler'), 'asthma keeps authored asthma protocol');
assert(asthma.tones.clinical.citations.includes('Educational reflection only; not a substitute for medical care.'), 'asthma keeps authored citation text');

const chestTightness = currentAilment('chest-tightness');
assert(!joined(chestTightness.tones.brutal.protocolSteps).includes('rescue inhaler'), 'non-asthma respiratory condition does not receive asthma inhaler guidance');
assert(!joined(chestTightness.tones.clinical.citations).includes('Somatic Medicine & Biofeedback Journal'), 'non-asthma condition does not receive placeholder citations');

const tensionHeadaches = currentAilment('tension-headaches');
assert(tensionHeadaches.tones.clinical.protocol[0].includes('Track onset'), 'head/neck condition keeps authored legacy protocol');

const urinaryIncontinence = currentAilment('urinary-incontinence');
assert(urinaryIncontinence.tones.clinical.mechanism.includes('Urinary incontinence is involuntary leakage'), 'rich pelvic structured tone remains intact');
assert(urinaryIncontinence.tones.brutal.protocolTitle === 'MECHANICS FIRST, THEN MEANING', 'recent pelvic authored brutal tone remains intact');

const testicularPain = currentAilment('testicular-pain-problems');
assert(testicularPain.tones.clinical.mechanism.includes('Testicular and scrotal symptoms'), 'current direct-string pelvic interpretation remains intact');
assert(!joined(testicularPain.tones.brutal.protocolSteps).includes('rescue inhaler'), 'incomplete legacy record does not receive asthma guidance');

const prostate = currentAilment('prostate-problems-enlarged-prostate');
assert(prostate.tones.clinical.mechanism.includes('Prostate problems sit at the intersection'), 'recently repaired incomplete pelvic record initializes with authored clinical content');
assert(prostate.medical_safety === detailsById.get('prostate-problems-enlarged-prostate').medical_safety, 'medical_safety precedence is unchanged');

console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
