import { readFile } from 'node:fs/promises';
import {
  BODYSIGNAL_ANALYSIS_SYSTEM_INSTRUCTION,
  JOURNAL_AI_TRANSMISSION_DISCLOSURE,
  SAFE_JOURNAL_AI_UNAVAILABLE_CONNECTION,
  SAFE_JOURNAL_FALLBACK_CONNECTION,
  buildJournalAnalysisRequest,
} from '../src/lib/analysis/symptomAnalysisContract';
import { LEGAL_DOCS } from '../src/lib/legal/legalDocs';

let failures = 0;

function assert(condition: unknown, message: string) {
  if (condition) {
    console.log('  ok  -', message);
  } else {
    failures++;
    console.error('  FAIL -', message);
  }
}

const prompt = BODYSIGNAL_ANALYSIS_SYSTEM_INSTRUCTION;

assert(prompt.includes('medical: Discuss possible medical context'), 'AI prompt defines a medical layer');
assert(prompt.includes('mindBody: Discuss evidence-supported or plausible contributors only when appropriate'), 'AI prompt separates plausible mind-body contributors');
assert(prompt.includes('reflection: Offer questions and optional practices'), 'AI prompt separates reflection from causation');
assert(prompt.includes('traditional: Include traditional, energetic, spiritual, symbolic, or metaphysical material'), 'AI prompt separates traditional/metaphysical frameworks');
assert(prompt.includes('there is no credible evidence for a mental or emotional cause'), 'AI prompt permits no known emotional cause');
assert(prompt.includes('medical cause is unknown'), 'AI prompt permits uncertainty');
assert(prompt.includes('Put medical safety and red flags before reflective interpretation'), 'AI prompt prioritizes red flags before reflection');
assert(prompt.includes('not established biomedical fact'), 'traditional frameworks are not presented as biomedical fact');
assert(prompt.includes('Attribute the framework clearly'), 'traditional frameworks require attribution');

for (const protectedTerm of ['infection', 'cancer', 'congenital disease', 'genetic disease', 'pregnancy complications']) {
  assert(prompt.includes(protectedTerm), `AI prompt protects ${protectedTerm} from unsupported emotional-cause claims`);
}
assert(prompt.includes('not as the biomedical cause'), 'protected examples allow modifiers but not emotional biomedical causation');

const journalRequest = buildJournalAnalysisRequest({
  physicalSymptom: 'Fever and sore throat',
  emotionalState: 'Anxious about work',
  descriptionOfDay: 'Slept poorly',
});
const serializedRequest = JSON.stringify(journalRequest);

assert(journalRequest.symptom === 'Fever and sore throat', 'journal AI request sends physical symptom as its own field');
assert(journalRequest.habits.includes('Emotional state: Anxious about work'), 'journal AI request includes emotional state');
assert(journalRequest.habits.includes('Daily context: Slept poorly'), 'journal AI request includes day/context text');
assert(journalRequest.includedFields.join(',') === 'physicalSymptom,emotionalState,descriptionOfDay', 'journal AI request declares intended fields');
assert(!serializedRequest.includes('reflectionResponse'), 'journal AI request excludes reflection response');
assert(!serializedRequest.includes('reflectionPrompt'), 'journal AI request excludes reflection prompt');
assert(!serializedRequest.includes('sourcePattern'), 'journal AI request excludes source pattern metadata');

const journalSource = await readFile('src/components/SomaticJournalPanel.tsx', 'utf8');
assert(journalSource.includes('sendJournalToAI'), 'journal UI has explicit AI-send state');
assert(journalSource.includes('Save Journal Entry'), 'journal UI supports local save without AI');
assert(journalSource.includes('Log & Send to AI'), 'journal UI labels AI transmission as an explicit action');
assert(journalSource.includes('if (sendJournalToAI)'), 'journal submit calls AI only when explicitly selected');
assert(journalSource.includes('saveJournalEntries(updated, startOwner)'), 'journal submit still saves locally');
assert(journalSource.includes('JOURNAL_AI_TRANSMISSION_DISCLOSURE'), 'journal UI includes field-level AI transmission disclosure');

const privacyText = LEGAL_DOCS.privacy.sections.map((s) => `${s.heading}\n${s.body}`).join('\n');
const cookieText = LEGAL_DOCS.cookies.sections.map((s) => `${s.heading}\n${s.body}`).join('\n');
assert(privacyText.includes('physical symptom, emotional state, and day/context text'), 'privacy policy discloses journal AI transmitted fields');
assert(privacyText.includes('third-party generative AI provider'), 'privacy policy discloses third-party AI processing');
assert(privacyText.includes('saved reflection responses are not included'), 'privacy policy discloses reflection responses are excluded');
assert(cookieText.includes('explicitly choose AI decoding for a journal entry'), 'cookie notice distinguishes local save from AI transmission');

const fallbackText = [SAFE_JOURNAL_FALLBACK_CONNECTION, SAFE_JOURNAL_AI_UNAVAILABLE_CONNECTION].join('\n');
const unsafeFallbackPatterns = [
  /trauma .* caused/i,
  /emotion(?:s|al)? .* caused/i,
  /metaphysical root/i,
  /subconscious .* caused/i,
  /ancestral .* caused/i,
  /energy blockage .* caused/i,
  /diagnos/i,
];
assert(!unsafeFallbackPatterns.some((pattern) => pattern.test(fallbackText)), 'non-AI fallback does not invent personalized emotional, metaphysical, or diagnostic causation');
assert(fallbackText.includes('seek medical care promptly') || fallbackText.includes('medical evaluation'), 'non-AI fallback preserves medical safety guidance');

console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
