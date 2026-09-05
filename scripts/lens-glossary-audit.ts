import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  findLensGlossaryMatches,
  collectRawGlossaryMatches,
} from '../src/lib/lenses/glossaryMatching';

const DETAIL_PATH = resolve(
  process.cwd(),
  'src/data/ailments/pelvic-urinary-and-reproductive-detail.json'
);

interface RawMatch {
  start: number;
  end: number;
  entryIndex: number;
  text: string;
}

function getProseUnits(ailment: any): string[] {
  const units: string[] = [];

  const subsections = ailment?.structuredContent?.subsections;
  if (subsections?.sections) {
    for (const section of subsections.sections) {
      if (Array.isArray(section?.medicalConsiderations)) {
        for (const item of section.medicalConsiderations) {
          if (typeof item === 'string') units.push(item);
        }
      }
    }
  }

  const layers = ailment?.structuredContent?.influenceLayers;
  if (Array.isArray(layers)) {
    for (const layer of layers) {
      const content = layer?.paragraphs || layer?.body || layer?.text || layer?.description;
      if (Array.isArray(content)) {
        for (const item of content) if (typeof item === 'string') units.push(item);
      } else if (typeof content === 'string') {
        units.push(content);
      }
    }
  }

  return units;
}

function findAmbiguities(text: string): string[] {
  const raw = collectRawGlossaryMatches(text) as RawMatch[];
  const ambiguities: string[] = [];

  // Cluster overlapping raw matches (before longest-match resolution).
  const sorted = [...raw].sort((a, b) => a.start - b.start);
  let cluster: RawMatch[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length > 1) {
      const distinctEntries = new Set(cluster.map((m) => m.entryIndex));
      const starts = cluster.map((m) => m.start).sort((a, b) => a - b)[0];
      const ends = cluster.map((m) => m.end).sort((a, b) => a - b).slice(-1)[0];
      if (distinctEntries.size > 1) {
        const entries = cluster
          .map((m) => `${JSON.stringify(text.slice(m.start, m.end))}@${m.start}`)
          .join(' , ');
        ambiguities.push(
          `range[${starts}-${ends}] overlapping distinct entries: ${entries}`
        );
      }
    }
  };

  for (const m of sorted) {
    if (cluster.length === 0) {
      cluster = [m];
      clusterEnd = m.end;
    } else if (m.start < clusterEnd) {
      cluster.push(m);
      clusterEnd = Math.max(clusterEnd, m.end);
    } else {
      flush();
      cluster = [m];
      clusterEnd = m.end;
    }
  }
  flush();

  return ambiguities;
}

function runAudit() {
  const data = JSON.parse(readFileSync(DETAIL_PATH, 'utf8')) as any[];

  const totalMatches: { ailment: string; text: string; matches: ReturnType<typeof findLensGlossaryMatches> }[] = [];
  const canonicalCounts = new Map<string, number>();
  const ambiguities: string[] = [];

  for (const ailment of data) {
    const units = getProseUnits(ailment);
    for (const unit of units) {
      const matches = findLensGlossaryMatches(unit);
      if (matches.length > 0) {
        totalMatches.push({ ailment: ailment.id, text: unit, matches });
        for (const m of matches) {
          canonicalCounts.set(m.entry.term, (canonicalCounts.get(m.entry.term) ?? 0) + 1);
        }
      }
      for (const amb of findAmbiguities(unit)) {
        ambiguities.push(`[${ailment.id}] ${amb}`);
      }
    }
  }

  let total = 0;
  for (const t of totalMatches) total += t.matches.length;

  console.log('=== PELVIC-URINARY-AND-REPRODUCTIVE DETAIL AUDIT ===');
  console.log(`Total matched terms: ${total}`);
  console.log(`Unique canonical glossary terms: ${canonicalCounts.size}`);
  console.log('Top 20 canonical matched terms:');
  const top = [...canonicalCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  top.forEach(([term, count], i) => console.log(`  ${i + 1}. ${term} — ${count}`));

  console.log('\nAmbiguity cases (multiple distinct entries overlapping before longest-match resolution):');
  if (ambiguities.length === 0) {
    console.log('  none');
  } else {
    ambiguities.forEach((a) => console.log(`  ${a}`));
  }
}

// ---------------------------------------------------------------------------
// FALSE-POSITIVE TEST CASES (PART 10)
// ---------------------------------------------------------------------------
function expectCanonicals(text: string, expected: string[]): boolean {
  const matches = findLensGlossaryMatches(text);
  const got = matches.map((m) => m.entry.term).sort();
  const exp = [...expected].sort();
  return JSON.stringify(got) === JSON.stringify(exp);
}

function runFalsePositiveTests() {
  const cases: { name: string; text: string; expected: string[]; note?: string }[] = [
    {
      name: 'A',
      text: 'TCM may describe Kidney Jing, Kidney Yin deficiency, and Liver Qi Stagnation.',
      expected: ['Jing / Essence', 'Kidney Yin', 'Liver Qi Stagnation'],
    },
    {
      name: 'B',
      text: 'Damp Heat in the Lower Jiao is not another word for bacteria.',
      expected: ['Damp-Heat'],
      note: 'Lower Jiao must not produce a second overlapping match.',
    },
    {
      name: 'C',
      text: 'Pain can involve pelvic-floor guarding and central sensitization.',
      expected: ['Guarding', 'Sensitization'],
    },
    {
      name: 'D',
      text: 'The theater was warm and the plant was rooted in soil.',
      expected: [],
    },
    {
      name: 'E',
      text: 'Fear is traditionally associated with the Kidney system.',
      expected: ['Kidney system'],
    },
    {
      name: 'F',
      text: 'Some people describe a shadow on the scan.',
      expected: [],
      note: 'Ordinary lowercase "shadow" must not match.',
    },
    {
      name: 'G',
      text: 'A Jungian Shadow lens might explore vulnerability.',
      expected: ['Shadow'],
    },
  ];

  console.log('\n=== FALSE-POSITIVE TEST CASES ===');
  const results: Record<string, boolean> = {};
  for (const c of cases) {
    const pass = expectCanonicals(c.text, c.expected);
    results[c.name] = pass;
    const got = findLensGlossaryMatches(c.text).map((m) => m.entry.term).join(', ');
    console.log(
      `Test ${c.name}: ${pass ? 'PASS' : 'FAIL'} (matched: [${got}])${c.note ? ` — ${c.note}` : ''}`
    );
  }
  return results;
}

runAudit();
runFalsePositiveTests();
