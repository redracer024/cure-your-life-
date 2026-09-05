import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourceFile = 'src/data/ailments-core.json';
const corePath = path.join(root, sourceFile);
const raw = JSON.parse(fs.readFileSync(corePath, 'utf-8'));

const symptoms = raw.map((item) => {
  const entry = { sourceFile };
  if (item.id !== undefined) entry.id = item.id;
  if (item.name !== undefined) entry.name = item.name;
  if (item.category !== undefined) entry.category = item.category;
  if (item.subcategory !== undefined) entry.subcategory = item.subcategory;
  if (item.aliases !== undefined) entry.aliases = item.aliases;
  if (item.description !== undefined) entry.description = item.description;
  if (item.emotionalRoot !== undefined) entry.emotionalRoot = item.emotionalRoot;
  if (item.metaphor !== undefined) entry.metaphor = item.metaphor;
  if (item.physiologicalDescription !== undefined) entry.physiologicalDescription = item.physiologicalDescription;
  if (item.sarcasticAdvice !== undefined) entry.sarcasticAdvice = item.sarcasticAdvice;
  if (item.mindfulnessPrompts !== undefined) entry.mindfulnessPrompts = item.mindfulnessPrompts;
  if (item.physicalTherapyTip !== undefined) entry.physicalTherapyTip = item.physicalTherapyTip;
  if (item.riskLevel !== undefined) entry.riskLevel = item.riskLevel;
  if (item.tags !== undefined) entry.tags = item.tags;
  return entry;
});

const categoryCounts = {};
for (const s of symptoms) {
  const cat = s.category ?? '(none)';
  categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
}

const exportObj = {
  generatedAt: new Date().toISOString(),
  totalSymptoms: symptoms.length,
  categoryCounts,
  symptoms,
};

const outPath = path.join(root, 'symptom-audit-export.json');
fs.writeFileSync(outPath, JSON.stringify(exportObj, null, 2) + '\n', 'utf-8');

const exactDupes = [];
const seen = new Map();
for (const s of symptoms) {
  const n = s.name;
  seen.set(n, (seen.get(n) || 0) + 1);
}
for (const [n, c] of seen) if (c > 1) exactDupes.push(`${n} (x${c})`);

const ciDupes = [];
const ciSeen = new Map();
for (const s of symptoms) {
  const n = String(s.name).toLowerCase();
  ciSeen.set(n, (ciSeen.get(n) || 0) + 1);
}
for (const [n, c] of ciSeen) if (c > 1) ciDupes.push(`${n} (x${c})`);

console.log('=== AUDIT EXPORT ===');
console.log('Written:', outPath);
console.log('Total symptoms:', symptoms.length);
console.log('Category counts:', JSON.stringify(categoryCounts, null, 2));
console.log('\nExact duplicate names:', exactDupes.length ? exactDupes : 'none');
console.log('Case-insensitive duplicate names:', ciDupes.length ? ciDupes : 'none');
