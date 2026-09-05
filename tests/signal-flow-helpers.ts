import {
  isMeaningfulSignal,
  deriveResumeSummary,
  isSignalReadyToExplore,
  getFlowStartingStep,
} from '../src/lib/signalFlowHelpers';
import type { CurrentSignal } from '../src/types/currentSignal';

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

console.log('--- Signal Flow Helper Tests ---\n');

const emptySignal: CurrentSignal = {
  id: 'sig-1',
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  symptomText: '',
};

const partialSignal: CurrentSignal = {
  id: 'sig-2',
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  symptomText: 'Tension headache',
  bodyRegion: 'Head & Neck',
  intensity: 6,
  duration: 'hours',
  onset: 'gradual',
  userNotes: 'Poor sleep last night.',
  medicalSafetyStatus: 'none',
};

const urgentSignal: CurrentSignal = {
  ...partialSignal,
  id: 'sig-3',
  medicalSafetyStatus: 'urgent',
  userNotes: 'Chest pressure',
  symptomText: 'Chest pressure',
};

const noNotesSignal: CurrentSignal = {
  ...partialSignal,
  id: 'sig-4',
  userNotes: '',
  medicalSafetyStatus: 'none',
};

const noSafetySignal: CurrentSignal = {
  ...partialSignal,
  id: 'sig-5',
  medicalSafetyStatus: undefined as any,
  userNotes: '',
};

const contextWithSafetyMissing: CurrentSignal = {
  ...partialSignal,
  id: 'sig-5b',
  medicalSafetyStatus: undefined as any,
  userNotes: 'Had a long day at work.',
};

const experienceOnlySignal: CurrentSignal = {
  ...emptySignal,
  id: 'sig-6',
  symptomText: 'Headache',
  bodyRegion: 'Head & Neck',
  intensity: 4,
};

// 1. isMeaningfulSignal
console.log('Meaningful signal detection:');
assert(!isMeaningfulSignal(null), 'null signal is not meaningful');
assert(!isMeaningfulSignal(emptySignal), 'signal with empty symptomText is not meaningful');
assert(isMeaningfulSignal(partialSignal), 'signal with symptomText is meaningful');
assert(isMeaningfulSignal(urgentSignal), 'urgent signal with symptomText is meaningful');

// 2. deriveResumeSummary
console.log('\nResume summary:');
const summaryEmpty = deriveResumeSummary(emptySignal);
assert(summaryEmpty === '', 'empty signal produces empty summary');

const summaryPartial = deriveResumeSummary(partialSignal);
assert(summaryPartial.includes('Tension headache'), 'summary includes symptomText');
assert(summaryPartial.includes('Head & Neck'), 'summary includes bodyRegion');
assert(summaryPartial.includes('Intensity 6/10'), 'summary includes intensity');
assert(summaryPartial.includes('Duration: hours'), 'summary includes duration');
assert(summaryPartial.includes('Onset: gradual'), 'summary includes onset');

const summaryUrgent = deriveResumeSummary(urgentSignal);
assert(summaryUrgent.includes('Chest pressure'), 'summary includes urgent symptom');

// 3. isSignalReadyToExplore
console.log('\nReady-to-explore detection:');
assert(!isSignalReadyToExplore(null), 'null signal is not ready');
assert(!isSignalReadyToExplore(emptySignal), 'signal without symptom is not ready');
assert(!isSignalReadyToExplore({ ...emptySignal, symptomText: 'Headache' }), 'symptom-only is not ready');
assert(!isSignalReadyToExplore({ ...emptySignal, symptomText: 'Headache', bodyRegion: 'Head & Neck' }), 'symptom+region without safety is not ready');
assert(isSignalReadyToExplore(partialSignal), 'symptom+region+safety is ready');
assert(isSignalReadyToExplore(urgentSignal), 'urgent signal with symptom+region+safety is ready');
assert(isSignalReadyToExplore(noNotesSignal), 'ready without optional context');
assert(!isSignalReadyToExplore(noSafetySignal), 'missing safety blocks readiness');

// 4. getFlowStartingStep
console.log('\nFlow starting step:');
assert(getFlowStartingStep(null) === 1, 'null signal starts at step 1');
assert(getFlowStartingStep(emptySignal) === 1, 'empty signal starts at step 1');
assert(getFlowStartingStep({ ...emptySignal, symptomText: 'Headache' }) === 2, 'symptom-only starts at step 2');
assert(getFlowStartingStep({ ...emptySignal, symptomText: 'Headache', bodyRegion: 'Head & Neck' }) === 3, 'with region starts at step 3');
assert(getFlowStartingStep(experienceOnlySignal) === 4, 'experience-only without context or safety starts at context');
assert(getFlowStartingStep(noSafetySignal) === 4, 'experience+blank context without safety starts at context');
assert(getFlowStartingStep(contextWithSafetyMissing) === 5, 'experience+context without safety starts at safety');
assert(getFlowStartingStep(noNotesSignal) === 6, 'safety-complete with blank optional context resumes at summary');
assert(getFlowStartingStep(partialSignal) === 6, 'complete signal starts at summary');

console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
