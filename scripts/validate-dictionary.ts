import { readFileSync, readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
}

interface DailyPrompt {
  id: string;
  prompt: string;
  category: string;
  reflectionQuestion: string;
  sarcasticQuote: string;
}

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    legacyAilments: number;
    legacyPrompts: number;
    coreAilments: number;
    detailFiles: number;
    totalDetailAilments: number;
    categories: string[];
  };
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

function validate() {
  const REPO_ROOT = join(__dirname, '..');
  const DATA_DIR = join(REPO_ROOT, 'src', 'data');
  const LEGACY_FILE = join(DATA_DIR, 'dictionary.legacy.ts');
  const CORE_FILE = join(DATA_DIR, 'ailments-core.json');
  const DAILY_PROMPTS_FILE = join(DATA_DIR, 'daily-prompts.json');
  const AILMENTS_DIR = join(DATA_DIR, 'ailments');

  const result: ValidationResult = {
    passed: false,
    errors: [],
    warnings: [],
    stats: {
      legacyAilments: 0,
      legacyPrompts: 0,
      coreAilments: 0,
      detailFiles: 0,
      totalDetailAilments: 0,
      categories: [],
    },
  };

  console.log('=== Dictionary Validation ===\n');

  if (!existsSync(LEGACY_FILE)) {
    result.errors.push(`Legacy file not found: ${LEGACY_FILE}`);
    console.error(result.errors[result.errors.length - 1]);
    return result;
  }

  console.log('Reading legacy data...');
  const legacyAilments = extractArray(LEGACY_FILE, 'AILMENTS');
  const legacyPrompts = extractArray(LEGACY_FILE, 'DAILY_PROMPTS');

  result.stats.legacyAilments = legacyAilments.length;
  result.stats.legacyPrompts = legacyPrompts.length;

  console.log(`Legacy: ${legacyAilments.length} ailments, ${legacyPrompts.length} prompts`);

  const legacyIds = new Set(legacyAilments.map(a => a.id));
  const legacyCategories = new Set(legacyAilments.map(a => a.category));

  if (legacyIds.size !== legacyAilments.length) {
    result.errors.push(`Duplicate IDs found in legacy data: ${legacyAilments.length - legacyIds.size} duplicates`);
  }

  if (!existsSync(CORE_FILE)) {
    result.errors.push(`Core file not found: ${CORE_FILE}`);
    console.error(result.errors[result.errors.length - 1]);
    return result;
  }

  console.log('Reading core JSON...');
  const coreData = JSON.parse(readFileSync(CORE_FILE, 'utf-8')) as LegacyAilment[];
  result.stats.coreAilments = coreData.length;
  console.log(`Core JSON: ${coreData.length} items`);

  if (coreData.length !== legacyAilments.length) {
    result.errors.push(`Core count mismatch: ${coreData.length} vs legacy ${legacyAilments.length}`);
  }

  const coreIds = new Set(coreData.map(a => a.id));
  if (coreIds.size !== coreData.length) {
    result.errors.push(`Duplicate IDs in core JSON: ${coreData.length - coreIds.size} duplicates`);
  }

  const missingInCore = [...legacyIds].filter(id => !coreIds.has(id));
  if (missingInCore.length > 0) {
    result.errors.push(`IDs missing in core: ${missingInCore.join(', ')}`);
  }

  const extraInCore = [...coreIds].filter(id => !legacyIds.has(id));
  if (extraInCore.length > 0) {
    result.errors.push(`Extra IDs in core: ${extraInCore.join(', ')}`);
  }

  for (const coreItem of coreData) {
    const legacy = legacyAilments.find(a => a.id === coreItem.id);
    if (!legacy) continue;

    const coreFields = ['name', 'category', 'emotionalRoot', 'metaphor', 'physiologicalDescription', 'sarcasticAdvice', 'physicalTherapyTip'];
    for (const field of coreFields) {
      if (coreItem[field] !== legacy[field]) {
        result.errors.push(`Field mismatch for ${coreItem.id}.${field}`);
      }
    }

    const corePrompts = JSON.stringify(coreItem.mindfulnessPrompts || []);
    const legacyPrompts = JSON.stringify(legacy.mindfulnessPrompts || []);
    if (corePrompts !== legacyPrompts) {
      result.errors.push(`mindfulnessPrompts mismatch for ${coreItem.id}`);
    }

    const coreTags = JSON.stringify(coreItem.tags || []);
    const legacyTags = JSON.stringify(legacy.tags || []);
    if (coreTags !== legacyTags) {
      result.errors.push(`tags mismatch for ${coreItem.id}`);
    }

    const coreRisk = coreItem.riskLevel || 'Moderate';
    const legacyRisk = legacy.riskLevel || 'Moderate';
    if (coreRisk !== legacyRisk) {
      result.warnings.push(`riskLevel mismatch for ${coreItem.id}: core="${coreRisk}" legacy="${legacyRisk}"`);
    }
  }

  if (!existsSync(DAILY_PROMPTS_FILE)) {
    result.errors.push(`Daily prompts file not found: ${DAILY_PROMPTS_FILE}`);
  } else {
    const corePrompts = JSON.parse(readFileSync(DAILY_PROMPTS_FILE, 'utf-8')) as DailyPrompt[];
    if (corePrompts.length !== legacyPrompts.length) {
      result.errors.push(`Daily prompts count mismatch: ${corePrompts.length} vs legacy ${legacyPrompts.length}`);
    }

    const corePromptIds = new Set(corePrompts.map(p => p.id));
    const legacyPromptIds = new Set(legacyPrompts.map(p => p.id));
    const missingPrompts = [...legacyPromptIds].filter(id => !corePromptIds.has(id));
    if (missingPrompts.length > 0) {
      result.errors.push(`Missing prompts in core: ${missingPrompts.join(', ')}`);
    }
  }

  if (!existsSync(AILMENTS_DIR)) {
    result.warnings.push(`Detail directory not found: ${AILMENTS_DIR} (detail lazy-load not required for validation)`);
  } else {
    const entries = readdirSync(AILMENTS_DIR).filter(f => f.endsWith('.json'));
    result.stats.detailFiles = entries.length;

    let totalDetail = 0;
    const detailIds = new Set<string>();

    for (const entry of entries) {
      const detailPath = join(AILMENTS_DIR, entry);
      const items = JSON.parse(readFileSync(detailPath, 'utf-8')) as any[];
      totalDetail += items.length;

      for (const item of items) {
        detailIds.add(item.id);
        if (!legacyIds.has(item.id)) {
          result.errors.push(`Detail file contains unknown ID: ${item.id}`);
        }
      }
    }

    result.stats.totalDetailAilments = totalDetail;

    const detailOnly = [...detailIds].filter(id => !legacyIds.has(id));
    if (detailOnly.length > 0) {
      result.errors.push(`IDs in detail but not legacy: ${detailOnly.join(', ')}`);
    }

    const legacyInDetail = [...legacyIds].filter(id => !detailIds.has(id));
    if (legacyInDetail.length > 0) {
      result.warnings.push(`${legacyInDetail.length} legacy IDs have no detail data (${legacyInDetail.slice(0, 5).join(', ')}...)`);
    }
  }

  result.stats.categories = Array.from(legacyCategories).sort();
  result.passed = result.errors.length === 0;

  console.log('\n=== Results ===');
  console.log(`Errors: ${result.errors.length}`);
  if (result.errors.length > 0) {
    for (const err of result.errors.slice(0, 10)) {
      console.error(`  ERROR: ${err}`);
    }
    if (result.errors.length > 10) {
      console.error(`  ... and ${result.errors.length - 10} more`);
    }
  }

  console.log(`Warnings: ${result.warnings.length}`);
  for (const warn of result.warnings.slice(0, 10)) {
    console.warn(`  WARN: ${warn}`);
  }

  console.log(`\nStats:`);
  console.log(`  Legacy ailments: ${result.stats.legacyAilments}`);
  console.log(`  Legacy prompts: ${result.stats.legacyPrompts}`);
  console.log(`  Core items: ${result.stats.coreAilments}`);
  console.log(`  Detail files: ${result.stats.detailFiles}`);
  console.log(`  Total detail items: ${result.stats.totalDetailAilments}`);
  console.log(`  Categories: ${result.stats.categories.length}`);
  console.log(`\nValidation: ${result.passed ? 'PASSED' : 'FAILED'}`);

  return result;
}

const result = validate();
process.exit(result.passed ? 0 : 1);
