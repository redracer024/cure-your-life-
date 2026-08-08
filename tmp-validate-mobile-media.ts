import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

interface AssertionResult {
  name: string;
  passed: boolean;
  detail?: string;
}

const results: AssertionResult[] = [];

function assert(name: string, condition: boolean, detail?: string) {
  results.push({ name, passed: condition, detail });
}

function readFile(relPath: string): string {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return '';
  return fs.readFileSync(abs, 'utf-8');
}

function fileContains(relPath: string, search: string): boolean {
  const content = readFile(relPath);
  return content.includes(search);
}

// 1. No newly introduced fixed desktop-only widths in key layout components
const layoutFiles = [
  'src/components/Navigation.tsx',
  'src/components/AppHeader.tsx',
  'src/components/AuthSection.tsx',
  'src/components/quiz/AssessmentQuizHost.tsx',
  'src/components/quiz/AssessmentQuestionPanel.tsx',
  'src/components/quiz/AssessmentResultsPanel.tsx',
  'src/components/SomaticJournalPanel.tsx',
  'src/components/patterns/PatternDetailPanel.tsx',
  'src/components/PremiumPaywall.tsx',
];

let hasFixedWidth = false;
for (const file of layoutFiles) {
  const content = readFile(file);
  if (/\bw-\[\d+px\]\b/.test(content) && !/w-full|w-auto|min-w|max-w/.test(content)) {
    assert(`No fixed pixel widths in ${file}`, false, 'Found w-[Npx] without responsive fallback');
    hasFixedWidth = true;
  }
}
if (!hasFixedWidth) {
  assert('No fixed desktop-only pixel widths in layout files', true);
}

// 2. Media uses external URLs
const mediaTypes = readFile('src/lib/media/types.ts');
assert('MediaResource type supports external URLs', mediaTypes.includes('url: string'));

const mediaCatalog = readFile('src/data/mediaCatalog.ts');
assert('mediaCatalog exports catalog array', mediaCatalog.includes('export const mediaCatalog'));

// 3. No MP3/MP4/PDF binaries added to src/public
const publicDir = path.join(SRC, 'public');
if (fs.existsSync(publicDir)) {
  const publicFiles = fs.readdirSync(publicDir, { recursive: true }) as string[];
  const badMedia = publicFiles.filter(f => /\.(mp3|mp4|pdf|mov|wav|ogg|webm)$/i.test(f));
  assert('No media binaries in src/public', badMedia.length === 0, badMedia.join(', ') || 'OK');
} else {
  assert('src/public exists or no public dir', true);
}

// 4. R2 origin included narrowly in CSP
const securityHeaders = readFile('src/lib/server/securityHeaders.ts');
assert(
  'CSP media-src includes exact R2 origin',
  securityHeaders.includes("https://pub-61a6f2a3fc254836a9d34227d4473a6c.r2.dev")
);

// 5. Video has playsInline
const videoPlayer = readFile('src/components/media/VideoPlayer.tsx');
assert('VideoPlayer uses playsInline', videoPlayer.includes('playsInline'));

// 6. No autoplay on video
assert('VideoPlayer no autoplay', !videoPlayer.includes('autoPlay') && !videoPlayer.includes('autoplay'));

// 7. Audio no autoplay
const audioPlayer = readFile('src/components/media/AudioPlayer.tsx');
assert('AudioPlayer no autoplay', !audioPlayer.includes('autoPlay') && !audioPlayer.includes('autoplay'));

// 8. Slide viewer has accessible controls
const slideViewer = readFile('src/components/media/SlideViewer.tsx');
assert(
  'Slide viewer has aria-labels',
  slideViewer.includes('aria-label="Previous slide"') && slideViewer.includes('aria-label="Next slide"')
);

// 9. Media catalog centralized
assert('Media catalog centralized in src/data/mediaCatalog.ts', fs.existsSync(path.join(SRC, 'data', 'mediaCatalog.ts')));

// 10. Test R2 resource URL present exactly once in catalog/data layer
const r2Url = 'https://pub-61a6f2a3fc254836a9d34227d4473a6c.r2.dev/video/invisible%20one/Pain_Reflects_Emotions.mp4';
const catalogMatches = (mediaCatalog.match(new RegExp(r2Url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
assert('Test R2 URL present exactly once in catalog', catalogMatches === 1, `Found ${catalogMatches} occurrences`);

// 11. User media files not tracked
const gitignore = readFile('.gitignore');
assert('PDFs excluded in .gitignore', gitignore.includes('*.pdf'));
assert('MP4s excluded in .gitignore', gitignore.includes('*.mp4'));
assert('MP3s excluded in .gitignore', gitignore.includes('*.mp3'));

// 12. No server secret introduced in media layer
const mediaFiles = [
  'src/lib/media/types.ts',
  'src/data/mediaCatalog.ts',
  'src/components/media/VideoPlayer.tsx',
  'src/components/media/AudioPlayer.tsx',
  'src/components/media/SlideViewer.tsx',
  'src/components/media/MediaResourceCard.tsx',
  'src/components/media/MediaResourceViewer.tsx',
];
let hasSecret = false;
for (const file of mediaFiles) {
  const content = readFile(file);
  if (/process\.env\.[A-Z_]+KEY|SECRET|TOKEN|PASSWORD/i.test(content)) {
    assert(`No secrets in ${file}`, false, 'Found env var or secret reference');
    hasSecret = true;
  }
}
if (!hasSecret) {
  assert('No server secrets in media layer', true);
}

// Print summary
console.log('\n=== Mobile Media Validation Summary ===\n');
let passed = 0;
let failed = 0;
for (const r of results) {
  const status = r.passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`${status} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  if (r.passed) passed++;
  else failed++;
}
console.log(`\nTotal: ${passed} passed, ${failed} failed out of ${results.length} assertions\n`);

if (failed > 0) {
  process.exit(1);
}
