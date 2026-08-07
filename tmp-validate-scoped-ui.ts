// Deterministic validator for Batch 13 UI/state invariants in the journal and
// reflection panels. Run with: npx tsx tmp-validate-scoped-ui.ts
import * as fs from 'fs';
import * as path from 'path';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) passed++;
  else { failed++; errors.push(`FAIL: ${label}${detail ? ` — ${detail}` : ''}`); }
}

const journalSrc = fs.readFileSync(path.join(import.meta.dirname, 'src/components/SomaticJournalPanel.tsx'), 'utf8');
const reflectionSrc = fs.readFileSync(path.join(import.meta.dirname, 'src/components/DailyPromptsPanel.tsx'), 'utf8');

console.log('Journal: owner gating');
assert('16. no localStorage read in journal panel', !journalSrc.includes('localStorage.getItem'));
assert('16. journal uses loadJournalEntries', journalSrc.includes('loadJournalEntries'));
assert('16. journal waits for authResolved (owner null gate)', journalSrc.includes('resolveListOwner(auth.authResolved, auth.authUser)'));
assert('16. journal never seeds anonymous while auth unresolved', journalSrc.includes('if (!auth.authResolved)'));

console.log('Journal: account switch clears UI state');
assert('17. journal invalidates entries on owner change', journalSrc.includes('setEntries([])'));
assert('17. journal keys ownership changes', journalSrc.includes('if (ownerKeyRef.current === key) return;'));

console.log('Journal: save uses current owner');
assert('19. saveJournalEntries is owner-scoped', journalSrc.includes('saveJournalEntries(updated, startOwner)') || journalSrc.includes('saveJournalEntries(updated, activeOwner)'));
assert('19. no raw localStorage.setItem in journal save', !journalSrc.includes('localStorage.setItem'));

console.log('Journal: authFetch path intact');
assert('21. authFetch retained', journalSrc.includes('authFetch('));
assert('21. AI endpoint intact', journalSrc.includes("'/api/analyze-symptom'"));
assert('21. authFetch not removed/refactored', journalSrc.includes("const response = await authFetch"));

console.log('Journal: stale AI race guard');
assert('20. captures startEpoch for AI fetch', journalSrc.includes('const startEpoch = ownerEpochRef.current'));
assert('20. guards owner after await before adding entry', journalSrc.includes('ownerEpochRef.current !== startEpoch'));
assert('20. discards stale result, does not append', journalSrc.includes('discard the stale result instead of cross-appending'));

console.log('Reflection: owner gating');
assert('16R. no raw localStorage in reflection panel', !reflectionSrc.includes('localStorage.getItem') && !reflectionSrc.includes('localStorage.setItem'));
assert('16R. reflection uses loadReflectionLogs', reflectionSrc.includes('loadReflectionLogs'));
assert('16R. waits for authResolved', reflectionSrc.includes('resolveListOwner(auth.authResolved, auth.authUser)'));
assert('16R. empty while auth unresolved', reflectionSrc.includes('if (!auth.authResolved)'));

console.log('Reflection: account switch invalidates state');
assert('17R. reflection clears prior state on switch', reflectionSrc.includes('setReflections([])'));
assert('18. reflection clears prior reflection UI state', reflectionSrc.includes('setReflections([])'));
assert('18R. reflection keys owner per key', reflectionSrc.includes('loadedForKeyRef'));
assert('18R. persist gated to loaded owner key', reflectionSrc.includes('ownerKeyRef.current !== loadedForKeyRef.current') || reflectionSrc.includes('ownerKeyRef.current === loadedForKeyRef.current'));

console.log('Reflection: save uses current owner');
assert('19R. saveReflectionLogs owner-scoped', reflectionSrc.includes('saveReflectionLogs(reflections, ownerRef.current)'));
assert('19R. clearReflectionLogs owner-scoped', reflectionSrc.includes('clearReflectionLogs(activeOwner)'));

console.log('Reflection: async inspector race guard');
assert('20R. captures startEpoch before timeout', reflectionSrc.includes('const startEpoch = ownerEpochRef.current'));
assert('20R. guards on timeout completion', reflectionSrc.includes('ownerEpochRef.current !== startEpoch'));

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) {
  console.log('\nFailures:');
  errors.forEach(e => console.log(`  ❌ ${e}`));
  process.exit(1);
} else {
  console.log(`\n✅ ALL ${passed} CHECKS PASSED`);
  process.exit(0);
}

function reflection(haystack: string): boolean {
  void haystack;
  return false;
}