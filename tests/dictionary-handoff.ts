import {
  getDictionaryCategoryForSignal,
  KNOWN_BODY_REGIONS,
} from '../src/lib/signalFlowHelpers';
import { navigateToDictionaryForSignal } from '../src/lib/dictionaryHandoff';
import type { CurrentSignal } from '../src/types/currentSignal';
import type { DictionaryNavigation } from '../src/hooks/useDictionaryNavigation';
import type { Ailment } from '../src/types';

function assert(condition: unknown, message: string) {
  if (condition) {
    console.log('  ok  -', message);
  } else {
    throw new Error(message);
  }
}

let failures = 0;
function fail(message: string) {
  failures++;
  console.error('  FAIL -', message);
}

function makeSignal(bodyRegion: string | undefined, overrides: Partial<CurrentSignal> = {}): CurrentSignal {
  return {
    id: 'sig-test',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    symptomText: 'something',
    bodyRegion,
    medicalSafetyStatus: 'none',
    ...overrides,
  };
}

function makeNav(overrides: Partial<DictionaryNavigation> = {}) {
  const calls: { method: string; args: unknown[] }[] = [];
  const wrap = (method: string) => (...args: unknown[]) => {
    calls.push({ method, args });
  };
  const nav: DictionaryNavigation = {
    activeTab: 'home',
    setActiveTab: wrap('setActiveTab'),
    searchQuery: '',
    setSearchQuery: wrap('setSearchQuery'),
    selectedCategory: null,
    setSelectedCategory: wrap('setSelectedCategory'),
    selectedAilment: null,
    setSelectedAilment: wrap('setSelectedAilment'),
    filteredAilments: [],
    categories: ['All', ...KNOWN_BODY_REGIONS],
    highlightPatternId: null,
    setHighlightPatternId: wrap('setHighlightPatternId'),
    journalPromptData: null,
    setJournalPromptData: wrap('setJournalPromptData'),
    ...overrides,
  };
  return { nav, calls };
}

function wasCalledWith(calls: { method: string; args: unknown[] }[], method: string, arg: unknown): boolean {
  return calls.some(c => c.method === method && c.args[0] === arg);
}

console.log('--- Dictionary Handoff Tests ---\n');

// 1. Each canonical bodyRegion maps to the correct dictionary category.
console.log('Canonical bodyRegion mapping:');
for (const region of KNOWN_BODY_REGIONS) {
  const result = getDictionaryCategoryForSignal(makeSignal(region));
  assert(result === region, `bodyRegion "${region}" maps to "${region}"`);
}

// 2. Missing bodyRegion returns null.
console.log('\nMissing bodyRegion:');
assert(getDictionaryCategoryForSignal(null) === null, 'null signal returns null');
assert(getDictionaryCategoryForSignal(undefined) === null, 'undefined signal returns null');
assert(getDictionaryCategoryForSignal(makeSignal(undefined)) === null, 'signal without bodyRegion returns null');
assert(getDictionaryCategoryForSignal(makeSignal('')) === null, 'empty bodyRegion returns null');
assert(getDictionaryCategoryForSignal(makeSignal('   ')) === null, 'whitespace bodyRegion returns null');

// 3. Unknown bodyRegion returns null (no symptom-based inference).
console.log('\nUnknown bodyRegion:');
assert(getDictionaryCategoryForSignal(makeSignal('Toe')) === null, 'arbitrary region returns null');
assert(getDictionaryCategoryForSignal(makeSignal('Head & Necks')) === null, 'near-miss region returns null');
assert(getDictionaryCategoryForSignal(makeSignal('migraine')) === null, 'symptom text is not used as region');
assert(getDictionaryCategoryForSignal(makeSignal('headache')) === null, 'lowercase symptom is not a category');

// 4. Symptom text does not influence the mapping.
console.log('\nNo symptom-based inference:');
const headacheAsRegion = makeSignal('Head & Neck', { symptomText: 'Sharp stabbing pain behind right eye' });
assert(
  getDictionaryCategoryForSignal(headacheAsRegion) === 'Head & Neck',
  'region wins; symptom text never influences category'
);
const emptyRegionButSymptom = makeSignal(undefined, { symptomText: 'migraine aura flashing lights' });
assert(
  getDictionaryCategoryForSignal(emptyRegionButSymptom) === null,
  'missing region returns null even when symptom text suggests a category'
);

// 5. Urgent status does not alter mapping behavior.
console.log('\nUrgent status:');
const urgent = makeSignal('Chest & Breathing', {
  symptomText: 'Crushing chest pressure radiating to left arm',
  medicalSafetyStatus: 'urgent',
});
assert(
  getDictionaryCategoryForSignal(urgent) === 'Chest & Breathing',
  'urgent status does not change category mapping'
);

// 6. navigateToDictionaryForSignal: matching category sets state and ALWAYS clears stale state.
console.log('\nHandoff with matching category:');
{
  const staleAilment = { id: 'x', category: 'Head & Neck', name: 'Old' } as unknown as Ailment;
  const { nav, calls } = makeNav({
    selectedAilment: staleAilment,
    searchQuery: 'old query',
    selectedCategory: 'Stomach & Gut',
  });
  const result = navigateToDictionaryForSignal(urgent, nav);
  assert(result.category === 'Chest & Breathing', 'result reports matched category');
  assert(result.fallback === false, 'result reports not fallback');
  assert(
    wasCalledWith(calls, 'setSelectedCategory', 'Chest & Breathing'),
    'selectedCategory is set to matched category'
  );
  assert(
    wasCalledWith(calls, 'setSelectedAilment', null),
    'selectedAilment is ALWAYS cleared on matching handoff'
  );
  assert(
    wasCalledWith(calls, 'setSearchQuery', ''),
    'searchQuery is ALWAYS cleared on matching handoff'
  );
  assert(
    wasCalledWith(calls, 'setActiveTab', 'dictionary'),
    'activeTab switches to dictionary'
  );
}

// 7. Handoff ALWAYS clears selectedAilment even when its category matches the new region.
console.log('\nHandoff always clears ailment, even same-category:');
{
  const matchingAilment = { id: 'y', category: 'Head & Neck', name: 'Tension headache' } as unknown as Ailment;
  const { nav, calls } = makeNav({
    selectedAilment: matchingAilment,
  });
  const signal = makeSignal('Head & Neck');
  navigateToDictionaryForSignal(signal, nav);
  assert(
    wasCalledWith(calls, 'setSelectedAilment', null),
    'same-category selectedAilment is STILL cleared (no false diagnosis implication)'
  );
}

// 8. Handoff with missing region falls back to the normal Dictionary landing.
console.log('\nHandoff with missing region:');
{
  const { nav, calls } = makeNav({
    selectedAilment: { id: 'z', category: 'Stomach & Gut', name: 'Reflux' } as unknown as Ailment,
    searchQuery: 'reflux',
    selectedCategory: 'Stomach & Gut',
  });
  const result = navigateToDictionaryForSignal(null, nav);
  assert(result.category === null, 'missing signal returns null category');
  assert(result.fallback === true, 'missing signal reports fallback');
  assert(
    wasCalledWith(calls, 'setSelectedCategory', null),
    'missing region CLEARS selectedCategory (true normal landing)'
  );
  assert(
    wasCalledWith(calls, 'setSelectedAilment', null),
    'fallback CLEARS selectedAilment'
  );
  assert(
    wasCalledWith(calls, 'setSearchQuery', ''),
    'fallback CLEARS searchQuery'
  );
  assert(
    wasCalledWith(calls, 'setActiveTab', 'dictionary'),
    'fallback still switches activeTab to dictionary'
  );
}

// 9. Handoff with unknown region clears selectedCategory as well.
console.log('\nHandoff with unknown region:');
{
  const { nav, calls } = makeNav({
    selectedCategory: 'Back & Shoulders',
    selectedAilment: { id: 'a', category: 'Back & Shoulders', name: 'Old back' } as unknown as Ailment,
    searchQuery: 'old',
  });
  const result = navigateToDictionaryForSignal(makeSignal('Somewhere New'), nav);
  assert(result.category === null, 'unknown region yields null category');
  assert(result.fallback === true, 'unknown region yields fallback');
  assert(
    wasCalledWith(calls, 'setSelectedCategory', null),
    'unknown region CLEARS selectedCategory (true normal landing)'
  );
  assert(
    wasCalledWith(calls, 'setSelectedAilment', null),
    'unknown region CLEARS selectedAilment'
  );
  assert(
    wasCalledWith(calls, 'setSearchQuery', ''),
    'unknown region CLEARS searchQuery'
  );
  assert(
    wasCalledWith(calls, 'setActiveTab', 'dictionary'),
    'unknown region still switches activeTab to dictionary'
  );
}

// 10. Symptom text never affects category mapping inside the handoff either.
console.log('\nHandoff never inspects symptomText:');
{
  const signalWithMigraineText = makeSignal(undefined, {
    symptomText: 'throbbing migraine aura flashing lights',
    ailmentId: 'migraine',
  });
  const { nav, calls } = makeNav();
  const result = navigateToDictionaryForSignal(signalWithMigraineText, nav);
  assert(result.category === null, 'symptom/ailmentId do not produce a category');
  assert(
    wasCalledWith(calls, 'setSelectedCategory', null),
    'no category is selected based on symptom text or ailmentId'
  );
  assert(
    !wasCalledWith(calls, 'setSelectedAilment', signalWithMigraineText.ailmentId),
    'ailmentId is NEVER auto-selected'
  );
}

// 11. Urgent handoff still clears all stale state identically.
console.log('\nUrgent handoff cleanup parity:');
{
  const staleAilment = { id: 'q', category: 'Chest & Breathing', name: 'Asthma' } as unknown as Ailment;
  const { nav, calls } = makeNav({
    selectedAilment: staleAilment,
    searchQuery: 'breathing',
    selectedCategory: 'General & Energy',
  });
  const urgentSignal = makeSignal('Chest & Breathing', { medicalSafetyStatus: 'urgent' });
  navigateToDictionaryForSignal(urgentSignal, nav);
  assert(
    wasCalledWith(calls, 'setSelectedCategory', 'Chest & Breathing'),
    'urgent still selects matched category'
  );
  assert(
    wasCalledWith(calls, 'setSelectedAilment', null),
    'urgent STILL clears selectedAilment'
  );
  assert(
    wasCalledWith(calls, 'setSearchQuery', ''),
    'urgent STILL clears searchQuery'
  );
}

console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
