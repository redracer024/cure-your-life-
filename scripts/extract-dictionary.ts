import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = join(__dirname, '..');
const SRC_DIR = join(REPO_ROOT, 'src');
const DATA_DIR = join(SRC_DIR, 'data');
const LEGACY_FILE = join(DATA_DIR, 'dictionary.legacy.ts');

interface LegacyAilment {
  id: string;
  name: string;
  category: string;
  emotionalRoot: string;
  metaphor: string;
  physiologicalDescription: string;
  sarcasticAdvice: string;
  mindfulnessPrompts: string[];
  physicalTherapyTip: string;
  riskLevel?: string;
  tags?: string[];
  biologyPath?: any[];
  tones?: any;
  medical_safety?: any;
  structuredContent?: any;
}

interface DailyPrompt {
  id: string;
  prompt: string;
  category: string;
  reflectionQuestion: string;
  sarcasticQuote: string;
}

function extractArray(filePath: string, exportName: string): any[] {
  const content = readFileSync(filePath, 'utf-8');
  const startMarker = `export const ${exportName}:`;
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) {
    throw new Error(`Could not find export ${exportName} in ${filePath}`);
  }

  const arrayStart = content.indexOf('= [', startIndex);
  if (arrayStart === -1) {
    throw new Error(`Could not find array start for ${exportName}`);
  }
  const actualStart = arrayStart + 2; // skip '= '

  let depth = 0;
  let inString = false;
  let stringChar = '';
  let escaped = false;

  for (let i = actualStart; i < content.length; i++) {
    const char = content[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }

    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
      continue;
    }

    if (inString && char === stringChar) {
      inString = false;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '[' || char === '{') {
      depth++;
    } else if (char === ']' || char === '}') {
      depth--;
      if (depth === 0 && char === ']') {
        const arrayText = content.substring(actualStart, i + 1);
        const cleanText = arrayText.replace(/,(\s*[}\]])/g, '$1');
        return JSON.parse(cleanText);
      }
    }
  }

  throw new Error(`Could not find array end for ${exportName}`);
}

function slugifyCategory(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function splitAilments(ailments: LegacyAilment[]) {
  const core: any[] = [];
  const detailsByCategory = new Map<string, any[]>();

  for (const ailment of ailments) {
    const { structuredContent, tones, biologyPath, medical_safety, ...coreFields } = ailment;

    core.push(coreFields);

    const detail: any = {};
    if (structuredContent !== undefined) detail.structuredContent = structuredContent;
    if (tones !== undefined) detail.tones = tones;
    if (biologyPath !== undefined) detail.biologyPath = biologyPath;
    if (medical_safety !== undefined) detail.medical_safety = medical_safety;

    if (Object.keys(detail).length > 0) {
      const slug = slugifyCategory(ailment.category);
      const list = detailsByCategory.get(slug) || [];
      list.push({ id: ailment.id, ...detail });
      detailsByCategory.set(slug, list);
    }
  }

  return { core, detailsByCategory };
}

function main() {
  console.log('Reading legacy dictionary.ts...');
  const ailments = extractArray(LEGACY_FILE, 'AILMENTS');
  const dailyPrompts = extractArray(LEGACY_FILE, 'DAILY_PROMPTS');

  console.log(`Found ${ailments.length} ailments and ${dailyPrompts.length} daily prompts`);

  const { core, detailsByCategory } = splitAilments(ailments);

  const corePath = join(DATA_DIR, 'ailments-core.json');
  writeFileSync(corePath, JSON.stringify(core, null, 2));
  console.log(`Wrote ${corePath} (${core.length} items)`);

  const ailmentsDir = join(DATA_DIR, 'ailments');
  mkdirSync(ailmentsDir, { recursive: true });

  for (const [slug, items] of detailsByCategory) {
    const detailPath = join(ailmentsDir, `${slug}-detail.json`);
    writeFileSync(detailPath, JSON.stringify(items, null, 2));
    console.log(`Wrote ${detailPath} (${items.length} items)`);
  }

  const promptsPath = join(DATA_DIR, 'daily-prompts.json');
  writeFileSync(promptsPath, JSON.stringify(dailyPrompts, null, 2));
  console.log(`Wrote ${promptsPath} (${dailyPrompts.length} items)`);

  const categories = Array.from(new Set(ailments.map(a => a.category))).sort();
  console.log('\nCategories found:');
  for (const cat of categories) {
    const slug = slugifyCategory(cat);
    const count = ailments.filter(a => a.category === cat).length;
    console.log(`  ${cat} (${count}) -> ${slug}`);
  }

  console.log('\nExtraction complete!');
}

main();
