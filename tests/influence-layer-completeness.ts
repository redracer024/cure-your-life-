import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { getStructuredInfluenceText } from '../src/lib/ailments/contentSelectors';
import { getEnrichedAilment } from '../src/lib/ailments/enrichment';
import type { Ailment } from '../src/types';

function assert(condition: unknown, message: string) {
  if (condition) {
    console.log('  ok  -', message);
  } else {
    throw new Error(message);
  }
}

const DETAIL_DIR = join(process.cwd(), 'src/data/ailments');

function getAllDetailRecords(): Map<string, any> {
  const records = new Map<string, any>();
  const dirFiles = readdirSync(DETAIL_DIR).filter((f: string) => f.endsWith('-detail.json'));
  for (const f of dirFiles) {
    const text = readFileSync(join(DETAIL_DIR, f), 'utf8');
    const data = JSON.parse(text);
    for (const record of data) {
      records.set(record.id, record);
    }
  }
  return records;
}

console.log('--- Influence Layer Completeness Tests ---\n');

const allRecords = getAllDetailRecords();

// 1. allergies-hay-fever location
console.log('Detail record location:');
assert(
  allRecords.has('allergies-hay-fever'),
  'allergies-hay-fever exists in detail files'
);
assert(
  allRecords.get('allergies-hay-fever')?.structuredContent?.influenceLayers?.length === 5,
  'allergies-hay-fever has 5 influence layers'
);

// 2. Verify it is NOT in chest-and-breathing
const chestRaw = readFileSync(join(DETAIL_DIR, 'chest-and-breathing-detail.json'), 'utf8');
assert(!chestRaw.includes('"id": "allergies-hay-fever"'), 'allergies-hay-fever absent from chest-and-breathing-detail.json');

// 3. Verify it IS in head-and-neck
const headRaw = readFileSync(join(DETAIL_DIR, 'head-and-neck-detail.json'), 'utf8');
assert(headRaw.includes('"id": "allergies-hay-fever"'), 'allergies-hay-fever present in head-and-neck-detail.json');

// 4. Count total occurrences
const chestData = JSON.parse(chestRaw);
const headData = JSON.parse(headRaw);
const chestCount = chestData.filter((r: any) => r.id === 'allergies-hay-fever').length;
const headCount = headData.filter((r: any) => r.id === 'allergies-hay-fever').length;
assert(chestCount === 0, 'allergies-hay-fever count in chest is 0');
assert(headCount === 1, 'allergies-hay-fever count in head is 1');

// 5. 5-layer records preservation through enrichment
console.log('\n5-layer record preservation:');
const fiveLayerRecords = Array.from(allRecords.values()).filter(
  (r: any) => r.structuredContent?.influenceLayers?.length === 5
);
assert(fiveLayerRecords.length >= 1, `found ${fiveLayerRecords.length} records with 5 influence layers`);

let failures = 0;
function fail(message: string) {
  failures++;
  console.error('  FAIL -', message);
}

for (const record of fiveLayerRecords) {
  const enriched = getEnrichedAilment(record as Ailment);
  const layers = enriched.structuredContent?.influenceLayers;
  assert(Array.isArray(layers), `${record.id}: influenceLayers is array after enrichment`);
  assert(layers.length === 5, `${record.id}: retains 5 layers after enrichment (got ${layers.length})`);

  for (let i = 1; i <= 5; i++) {
    const text = getStructuredInfluenceText(enriched, i, '');
    assert(typeof text === 'string' && text.length > 0, `${record.id}: layer ${i} has non-empty text through selector`);
  }
}

// 6. Verify no positional truncation in panel source
console.log('\nPanel source inspection:');
const panelSource = readFileSync(join(process.cwd(), 'src/components/ailments/panels/AilmentInfluencePanel.tsx'), 'utf8');
assert(panelSource.includes('slice(2, 4)'), 'panel source still uses slice(2, 4) for second group');
assert(panelSource.includes('slice(4)'), 'panel source includes slice(4) for additional layers beyond 4');

console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
