import { readFile } from 'node:fs/promises';
import {
  buildReflectionPromptId,
  flattenReflectionGroups,
  getDuplicateReflectionPromptIdentities,
  groupAilmentReflectionPrompts,
  normalizePromptText,
  restoreLegacyAnswers,
  stablePromptHash,
  type ReflectionQuestionRef,
} from '../src/lib/ailments/reflectionPrompts';

let failures = 0;

function assert(cond: boolean, msg: string) {
  if (cond) {
    console.log('  ok  -', msg);
  } else {
    failures++;
    console.error('  FAIL -', msg);
  }
}

function flatFor(ailment: any): ReflectionQuestionRef[] {
  return flattenReflectionGroups(ailment.id, groupAilmentReflectionPrompts(ailment));
}

const AILMENT = 'urinary-incontinence';
const sectionKey = 'subsection:childhood-developmental';

const baseAilment: any = {
  id: AILMENT,
  structuredContent: {
    subsections: {
      overview: 'o',
      label: 'Lenses',
      sections: [
        {
          key: 'childhood-developmental',
          label: 'CHILDHOOD / DEVELOPMENTAL',
          reflectionPrompts: [
            'What happened when I had an accident as a child?',
            'Was I comforted, ignored, teased, punished, or shamed?',
          ],
        },
        {
          key: 'somatic-perspective',
          label: 'SOMATIC PERSPECTIVE',
          reflectionPrompts: [
            'Do I scan for bathrooms, check pads, or restrict fluids out of anticipatory fear?',
            'After a public accident, did fear change how I move through the world?',
          ],
        },
      ],
    },
  },
};

const baseFlat = flatFor(baseAilment);
const childQ0 = baseFlat.find((q) => q.sectionKey === sectionKey && q.prompt.startsWith('What happened'))!;
const somaQ1 = baseFlat.find((q) => q.sectionKey === 'subsection:somatic-perspective' && q.prompt.startsWith('After a public'))!;

assert(baseFlat.length === 4, 'four questions flattened from two sections');
assert(!!childQ0 && !!somaQ1, 'located target questions in different sections');

const savedAnswers: Record<string, string> = {
  [childQ0.stableId]: 'I was shamed.',
  [somaQ1.stableId]: 'I avoided leaving the house.',
};

const reorderedAilment: any = {
  ...baseAilment,
  structuredContent: {
    subsections: {
      overview: 'o',
      label: 'Lenses',
      sections: [
        {
          key: 'childhood-developmental',
          label: 'CHILDHOOD / DEVELOPMENTAL',
          reflectionPrompts: [
            'Was I comforted, ignored, teased, punished, or shamed?',
            'What happened when I had an accident as a child?',
          ],
        },
        baseAilment.structuredContent.subsections.sections[1],
      ],
    },
  },
};
const reorderedFlat = flatFor(reorderedAilment);
const childAfterReorder = reorderedFlat.find((q) => q.prompt.startsWith('What happened'))!;
assert(savedAnswers[childAfterReorder.stableId] === 'I was shamed.', 'reorder preserves answers by prompt identity');

const insertedAilment: any = {
  ...baseAilment,
  structuredContent: {
    subsections: {
      overview: 'o',
      label: 'Lenses',
      sections: [
        {
          key: 'childhood-developmental',
          label: 'CHILDHOOD / DEVELOPMENTAL',
          reflectionPrompts: [
            'NEW: did adults decide when my bodily needs were acceptable?',
            'What happened when I had an accident as a child?',
            'Was I comforted, ignored, teased, punished, or shamed?',
          ],
        },
        baseAilment.structuredContent.subsections.sections[1],
      ],
    },
  },
};
const insertedFlat = flatFor(insertedAilment);
const childAfterInsert = insertedFlat.find((q) => q.prompt.startsWith('What happened'))!;
assert(savedAnswers[childAfterInsert.stableId] === 'I was shamed.', 'insertion preserves existing answer identity');
assert(insertedFlat.length === 5, 'insertion creates one additional prompt reference');

assert(
  buildReflectionPromptId(AILMENT, sectionKey, '  What happened when I had an accident as a child?! ') === childQ0.stableId,
  'punctuation-only edit preserves legacy text identity',
);
assert(normalizePromptText('What happened?!') === normalizePromptText('what happened'), 'normalization ignores case and punctuation');
assert(stablePromptHash('same input') === stablePromptHash('same input'), 'hash remains deterministic');

const oldPrompt = 'What do I need today?';
const revisedPrompt = 'What support do I need today?';
const oldTextId = buildReflectionPromptId('demo-ailment', 'worksheet:needs', oldPrompt);
const revisionFlat = flatFor({
  id: 'demo-ailment',
  structuredContent: {
    reflectionWorksheet: [
      {
        key: 'needs',
        label: 'Needs',
        prompts: [
          {
            id: 'support-needed',
            prompt: revisedPrompt,
            previousPrompts: [oldPrompt],
          },
        ],
      },
    ],
  },
});
const revisionRestored = restoreLegacyAnswers({
  recordAnswers: { [oldTextId]: 'I need direct help.' },
  recordPrompts: { [oldTextId]: oldPrompt },
  flatQuestions: revisionFlat,
});
assert(
  revisionRestored.answers[revisionFlat[0].stableId] === 'I need direct help.',
  'substantive wording revision of same conceptual prompt preserves answer through explicit previousPrompts alias',
);
assert(
  revisionRestored.answerMigrations[revisionFlat[0].stableId]?.[0]?.fromPrompt === oldPrompt,
  'successful wording revision keeps historical prompt wording with migration metadata',
);

const unrelatedFlat = flatFor({
  id: 'demo-ailment',
  structuredContent: {
    reflectionWorksheet: [
      {
        key: 'needs',
        label: 'Needs',
        prompts: [{ id: 'new-boundary-question', prompt: 'What boundary needs to be stated?' }],
      },
    ],
  },
});
const unrelatedRestored = restoreLegacyAnswers({
  recordAnswers: { [oldTextId]: 'I need direct help.' },
  recordPrompts: { [oldTextId]: oldPrompt },
  flatQuestions: unrelatedFlat,
});
assert(Object.keys(unrelatedRestored.answers).length === 0, 'genuinely new prompt does not inherit unrelated old answer');
assert(unrelatedRestored.unresolvedAnswers[0]?.reason === 'unmatched', 'unmatched historical answer remains recoverable');
assert(unrelatedRestored.unresolvedAnswers[0]?.answer === 'I need direct help.', 'unmatched historical answer preserves answer text');

const ambiguousFlat = flatFor({
  id: 'demo-ailment',
  structuredContent: {
    reflectionWorksheet: [
      {
        key: 'needs',
        label: 'Needs',
        prompts: [
          { id: 'support-needed', prompt: revisedPrompt, previousPrompts: [oldPrompt] },
          { id: 'rest-needed', prompt: 'What rest do I need today?', previousPrompts: [oldPrompt] },
        ],
      },
    ],
  },
});
const ambiguousRestored = restoreLegacyAnswers({
  recordAnswers: { [oldTextId]: 'I need direct help.' },
  recordPrompts: { [oldTextId]: oldPrompt },
  flatQuestions: ambiguousFlat,
});
assert(ambiguousRestored.ambiguous === true, 'ambiguous migration is flagged');
assert(Object.keys(ambiguousRestored.answers).length === 0, 'ambiguous migration does not choose a candidate');
assert(ambiguousRestored.unresolvedAnswers[0]?.candidateIds?.length === 2, 'ambiguous migration exposes candidate ids');

const idempotentRestored = restoreLegacyAnswers({
  recordAnswers: revisionRestored.answers,
  recordPrompts: { [revisionFlat[0].stableId]: revisedPrompt },
  flatQuestions: revisionFlat,
  historicalAnswers: revisionRestored.unresolvedAnswers,
  answerMigrations: revisionRestored.answerMigrations,
});
assert(
  JSON.stringify(idempotentRestored.answers) === JSON.stringify(revisionRestored.answers),
  'repeated migration keeps the same current answers',
);
assert(
  JSON.stringify(idempotentRestored.answerMigrations) === JSON.stringify(revisionRestored.answerMigrations),
  'repeated migration does not duplicate migration metadata',
);

const duplicateFlat = flatFor({
  id: 'demo-ailment',
  structuredContent: {
    reflectionWorksheet: [
      {
        key: 'dup',
        label: 'Duplicate',
        prompts: [
          { id: 'same-id', prompt: 'First version?' },
          { id: 'same-id', prompt: 'Second version?' },
        ],
      },
    ],
  },
});
assert(getDuplicateReflectionPromptIdentities(duplicateFlat).length === 1, 'duplicate current prompt identities are surfaced');

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
const core = JSON.parse(await readFile('src/data/ailments-core.json', 'utf8'));
const detailsById = new Map<string, any>();
for (const file of detailFiles) {
  const details = JSON.parse(await readFile(file, 'utf8'));
  for (const detail of details) detailsById.set(detail.id, detail);
}

let corpusPromptRefs = 0;
let corpusDuplicateIdentities = 0;
let duplicateGroupKeys = 0;
for (const item of core) {
  const detail = detailsById.get(item.id);
  const ailment = {
    ...item,
    structuredContent: detail?.structuredContent,
  };
  const groups = groupAilmentReflectionPrompts(ailment);
  const groupKeys = new Set<string>();
  for (const group of groups) {
    if (groupKeys.has(group.sectionKey)) duplicateGroupKeys += 1;
    groupKeys.add(group.sectionKey);
  }
  const flat = flattenReflectionGroups(item.id, groups);
  corpusPromptRefs += flat.length;
  corpusDuplicateIdentities += getDuplicateReflectionPromptIdentities(flat).length;
}

assert(corpusPromptRefs > 0, 'current corpus generates prompt references');
assert(corpusDuplicateIdentities === 0, 'current corpus has no duplicate prompt identities');
assert(duplicateGroupKeys === 0, 'current corpus has no duplicate group keys within an ailment');

console.log(JSON.stringify({
  corpusPromptRefs,
  corpusDuplicateIdentities,
  duplicateGroupKeys,
}, null, 2));

console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
