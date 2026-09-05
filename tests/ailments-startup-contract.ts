import { build } from 'esbuild';

type DataModule = {
  getCoreAilments: () => Array<{
    id?: unknown;
    name?: unknown;
    category?: unknown;
    emotionalRoot?: unknown;
    metaphor?: unknown;
    sarcasticAdvice?: unknown;
    mindfulnessPrompts?: unknown;
    physicalTherapyTip?: unknown;
  }>;
  searchCoreAilments: (query: string) => unknown[];
};

const EXPECTED_CORE_COUNT = 140;
const REQUIRED_IDENTITY_FIELDS = ['id', 'name', 'category'] as const;
const OPTIONAL_LEGACY_PROSE_FIELDS = [
  'emotionalRoot',
  'metaphor',
  'sarcasticAdvice',
  'mindfulnessPrompts',
  'physicalTherapyTip',
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function importDataModule(): Promise<DataModule> {
  const result = await build({
    entryPoints: ['src/data/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    logLevel: 'silent',
    loader: { '.json': 'json' },
    define: { 'import.meta.glob': '__testGlob' },
    banner: { js: 'const __testGlob = () => ({});' },
  });

  const code = result.outputFiles[0]?.text;
  assert(typeof code === 'string' && code.length > 0, 'Failed to bundle src/data/index.ts');

  const encoded = Buffer.from(code).toString('base64');
  return import(`data:text/javascript;base64,${encoded}`) as Promise<DataModule>;
}

const dataModule = await importDataModule();
const core = dataModule.getCoreAilments();

assert(core.length === EXPECTED_CORE_COUNT, `Expected ${EXPECTED_CORE_COUNT} core ailments, found ${core.length}`);

const duplicateIds = new Set<string>();
const seenIds = new Set<string>();
const missingOptionalRecords: Array<{ id: string; missing: string[] }> = [];

for (const item of core) {
  for (const field of REQUIRED_IDENTITY_FIELDS) {
    assert(
      typeof item[field] === 'string' && item[field].trim().length > 0,
      `Core ailment has invalid ${field}: ${JSON.stringify(item)}`
    );
  }

  const id = item.id;
  assert(typeof id === 'string', `Core ailment has invalid id: ${JSON.stringify(item)}`);

  if (seenIds.has(id)) duplicateIds.add(id);
  seenIds.add(id);

  const missing = OPTIONAL_LEGACY_PROSE_FIELDS.filter((field) => item[field] === undefined);
  if (missing.length > 0) {
    missingOptionalRecords.push({ id, missing: [...missing] });
  }
}

assert(duplicateIds.size === 0, `Duplicate core IDs found: ${Array.from(duplicateIds).join(', ')}`);
assert(
  missingOptionalRecords.some((record) => record.id === 'prostate-problems-enlarged-prostate'),
  'Expected regression fixture with missing optional prose fields was not present'
);

dataModule.searchCoreAilments('prostate');
dataModule.searchCoreAilments('hematuria');
dataModule.searchCoreAilments('testicular pain');

console.log(JSON.stringify({
  startupInitialization: 'PASS',
  coreCount: core.length,
  duplicateCoreIds: duplicateIds.size,
  recordsMissingOptionalLegacyProse: missingOptionalRecords,
}, null, 2));
