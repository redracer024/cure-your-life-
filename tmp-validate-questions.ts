import { APPROVED_QUIZ_ITEMS } from './src/data/quiz/approvedQuestions';
import { getApprovedItemsForMode, getAssessmentReadiness, isAssessmentModeReady, getQuestionBankCoverage, scoreApprovedItemResponse, getUniversalStrategyScreenItems, getApprovedStrategyItemsForPattern, type AssessmentReadiness } from './src/data/quiz/questionBank';
import { CORE_PATTERN_IDS, STRATEGY_PATTERN_IDS } from './src/data/quiz/patternTaxonomy';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function check(condition: boolean, message: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(message);
  }
}

function verifyCorePattern(patternId: string, label: string) {
  const items = APPROVED_QUIZ_ITEMS.filter(i => i.patternId === patternId);
  check(items.length === 8, `${label} should have 8 items, got ${items.length}`);
  check(items.filter(i => i.access === 'free').length === 5, `${label} should have 5 free items`);
  check(items.filter(i => i.access === 'pro').length === 3, `${label} should have 3 pro-only items`);

  const proFiltered = getApprovedItemsForMode('pro').filter(i => i.patternId === patternId);
  check(proFiltered.length === 8, `${label} Pro selector should return 8, got ${proFiltered.length}`);

  const freeFiltered = getApprovedItemsForMode('free').filter(i => i.patternId === patternId);
  check(freeFiltered.length === 5, `${label} Free selector should return 5, got ${freeFiltered.length}`);

  for (const item of items) {
    check(item.patternId === patternId, `Item ${item.id} should have patternId ${patternId}`);
  }
}

const CORE_PATTERNS = ['silenced-one', 'unheld-one', 'invisible-one', 'shame-bearer', 'controller', 'avoidant-one', 'hypervigilant-one', 'entangled-one', 'grief-bearer'] as const;
const CORE_LABELS: Record<string, string> = {
  'silenced-one': 'Silenced One', 'unheld-one': 'Unheld One', 'invisible-one': 'Invisible One',
  'shame-bearer': 'Shame-Bearer', 'controller': 'Controller', 'avoidant-one': 'Avoidant One',
  'hypervigilant-one': 'Hypervigilant One', 'entangled-one': 'Entangled One', 'grief-bearer': 'Grief-Bearer',
};

const STRATEGY_LABELS: Record<string, string> = {
  martyr: 'Martyr', 'overloaded-one': 'Overloaded One', perfectionist: 'Perfectionist',
  'over-responsible-one': 'Over-Responsible One', 'anger-shield': 'Anger Shield', rescuer: 'Rescuer',
};

let n = 1;

/* ========== BANK TOTALS ========== */

console.log(`${n}. Verifying total count...`);
const totalItems = APPROVED_QUIZ_ITEMS.length;
const coreItems = APPROVED_QUIZ_ITEMS.filter(i => i.layer === 'core');
const strategyItems = APPROVED_QUIZ_ITEMS.filter(i => i.layer === 'strategy');
const expressionItems = APPROVED_QUIZ_ITEMS.filter(i => i.layer === 'expression');
check(totalItems === 120, `Expected 120 approved items, got ${totalItems}`);
check(coreItems.length === 72, `Expected 72 core items, got ${coreItems.length}`);
check(strategyItems.length === 48, `Expected 48 strategy items, got ${strategyItems.length}`);
check(expressionItems.length === 0, `Expected 0 expression items, got ${expressionItems.length}`);
n++;

console.log(`${n}. Verifying free count...`);
const freeItems = APPROVED_QUIZ_ITEMS.filter(i => i.access === 'free');
check(freeItems.length === 75, `Expected 75 free items, got ${freeItems.length}`);
const freeCore = freeItems.filter(i => i.layer === 'core');
const freeStrategy = freeItems.filter(i => i.layer === 'strategy');
check(freeCore.length === 45, `Expected 45 free core items, got ${freeCore.length}`);
check(freeStrategy.length === 30, `Expected 30 free strategy items, got ${freeStrategy.length}`);
n++;

console.log(`${n}. Verifying pro-only count...`);
const proOnly = APPROVED_QUIZ_ITEMS.filter(i => i.access === 'pro');
check(proOnly.length === 45, `Expected 45 pro-only items, got ${proOnly.length}`);
const proOnlyCore = proOnly.filter(i => i.layer === 'core');
const proOnlyStrategy = proOnly.filter(i => i.layer === 'strategy');
check(proOnlyCore.length === 27, `Expected 27 pro-only core items, got ${proOnlyCore.length}`);
check(proOnlyStrategy.length === 18, `Expected 18 pro-only strategy items, got ${proOnlyStrategy.length}`);
n++;

console.log(`${n}. Verifying Pro selector...`);
check(getApprovedItemsForMode('pro').length === 120, `Expected Pro selector to return 120`);
n++;

console.log(`${n}. Verifying Free selector...`);
check(getApprovedItemsForMode('free').length === 75, `Expected Free selector to return 75`);
n++;

/* ========== CORE PATTERN VERIFICATION ========== */

for (const pid of CORE_PATTERNS) {
  console.log(`${n}. Verifying ${CORE_LABELS[pid]} counts...`);
  verifyCorePattern(pid, CORE_LABELS[pid]);
  n++;
}

/* ========== UNIQUE IDS AND TEXTS ========== */

console.log(`${n}. Verifying unique IDs...`);
const ids = APPROVED_QUIZ_ITEMS.map(i => i.id);
check(new Set(ids).size === ids.length, `IDs not unique`);
n++;

console.log(`${n}. Verifying unique texts...`);
const texts = APPROVED_QUIZ_ITEMS.map(i => i.text);
check(new Set(texts).size === texts.length, `Texts not unique`);
n++;

/* ========== LAYER ========== */

console.log(`${n}. Verifying layer...`);
const isCoreId = (id: string) => (CORE_PATTERN_IDS as readonly string[]).includes(id);
for (const item of APPROVED_QUIZ_ITEMS) {
  if (isCoreId(item.patternId)) {
    check(item.layer === 'core', `Core item ${item.id} should have layer 'core'`);
  } else {
    check(item.layer === 'strategy', `Strategy item ${item.id} should have layer 'strategy'`);
  }
}
n++;

/* ========== SCALE ========== */

console.log(`${n}. Verifying scale...`);
for (const item of APPROVED_QUIZ_ITEMS) check(item.scale === 'frequency', `Item ${item.id} scale not frequency`);
n++;

/* ========== REVERSE SCORING ========== */

console.log(`${n}. Verifying reverse-scored items...`);
const revItems = APPROVED_QUIZ_ITEMS.filter(i => i.reverseScored === true);
check(revItems.length === 12, `Expected 12 reverse-scored items, got ${revItems.length}`);
n++;

console.log(`${n}. Verifying specific reverse-scored items...`);
const revChecks = [
  { id: 'core-shame-bearer-05', text: 'I can mess up without feeling like a failure as a person.' },
  { id: 'core-controller-08', text: 'I can let other people lead without needing to direct how they do it.' },
  { id: 'core-avoidant-one-05', text: 'I take a pause and then return to difficult topics I have postponed.' },
  { id: 'core-hypervigilant-one-05', text: 'Once a situation feels safe, I stop scanning for trouble.' },
  { id: 'core-entangled-one-05', text: 'I can care about someone\u2019s feelings without taking them on as my own.' },
  { id: 'core-grief-bearer-05', text: 'I can hold my sadness about the past while still opening to new things.' },
  { id: 'strategy-martyr-05', text: 'I set limits on what I give before it begins to wear me down.' },
  { id: 'strategy-rescuer-05', text: 'I can support someone without protecting them from the results of their own decisions.' },
  { id: 'strategy-over-responsible-one-05', text: 'I can tell the difference between my responsibility and what belongs to others.' },
  { id: 'strategy-overloaded-one-05', text: 'I notice when I am approaching my limit and adjust my commitments accordingly.' },
  { id: 'strategy-perfectionist-05', text: 'I can finish something on time even when it is not perfect.' },
  { id: 'strategy-anger-shield-05', text: 'I can express hurt without turning it into anger.' },
];
for (const { id, text } of revChecks) {
  const item = APPROVED_QUIZ_ITEMS.find(i => i.id === id);
  check(item !== undefined, `${id} not found`);
  check(item?.reverseScored === true, `${id} should be reverse-scored`);
  check(item?.text === text, `${id} text mismatch`);
}
n++;

/* ========== STATUS ========== */

console.log(`${n}. Verifying status...`);
for (const item of APPROVED_QUIZ_ITEMS) check(item.status === 'approved', `Item ${item.id} status not approved`);
n++;

/* ========== TAXONOMY RESOLUTION ========== */

console.log(`${n}. Verifying patternId taxonomy resolution...`);
const allTaxonomyIds = new Set([...CORE_PATTERN_IDS, ...STRATEGY_PATTERN_IDS]);
for (const item of APPROVED_QUIZ_ITEMS) check(allTaxonomyIds.has(item.patternId), `Item ${item.id} has unresolvable patternId`);
n++;

/* ========== NO A-G KEYS ========== */

console.log(`${n}. Verifying no A-G keys...`);
for (const item of APPROVED_QUIZ_ITEMS) check(!/^[A-G]$/.test(item.patternId), `Item ${item.id} uses A-G key`);
n++;

/* ========== NO DISPLAY NAMES ========== */

console.log(`${n}. Verifying no display names...`);
const displayNames = new Set((await import('./src/data/patterns')).PATTERNS_DATA.map(p => p.name));
for (const item of APPROVED_QUIZ_ITEMS) check(!displayNames.has(item.patternId), `Item ${item.id} uses display name`);
n++;

/* ========== REVERSE-SCORING HELPER ========== */

console.log(`${n}. Testing reverse-scoring helper...`);
const normal = APPROVED_QUIZ_ITEMS.find(i => i.id === 'core-silenced-one-01')!;
check(scoreApprovedItemResponse(normal, 1) === 1, 'Normal 1');
check(scoreApprovedItemResponse(normal, 5) === 5, 'Normal 5');
check(scoreApprovedItemResponse(normal, 0) === 1, 'Clamp 0');
check(scoreApprovedItemResponse(normal, 6) === 5, 'Clamp 6');
for (const revId of revChecks.map(r => r.id)) {
  const rev = APPROVED_QUIZ_ITEMS.find(i => i.id === revId)!;
  check(scoreApprovedItemResponse(rev, 1) === 5, `${revId} rev 1->5`);
  check(scoreApprovedItemResponse(rev, 2) === 4, `${revId} rev 2->4`);
  check(scoreApprovedItemResponse(rev, 3) === 3, `${revId} rev 3->3`);
  check(scoreApprovedItemResponse(rev, 4) === 2, `${revId} rev 4->2`);
  check(scoreApprovedItemResponse(rev, 5) === 1, `${revId} rev 5->1`);
}
n++;

/* ========== READINESS CHECKS ========== */

console.log(`${n}. Verifying Free readiness...`);
check(isAssessmentModeReady('free') === false, 'Free readiness should be false');
const freeReadiness = getAssessmentReadiness('free');
check(freeReadiness.coreBankComplete === true, 'Free core bank should be complete');
check(freeReadiness.ready === false, 'Free readiness should be false');
n++;

console.log(`${n}. Verifying Pro readiness...`);
check(isAssessmentModeReady('pro') === true, 'Pro readiness should be true');
const proReadiness = getAssessmentReadiness('pro');
check(proReadiness.coreBankComplete === true, 'Pro core bank should be complete');
check(proReadiness.ready === true, 'Pro readiness should be true');
n++;

/* ========== COVERAGE REPORT ========== */

console.log(`${n}. Generating coverage report...`);
const coverage = getQuestionBankCoverage();
for (const [id, c] of Object.entries(coverage)) {
  console.log(`  ${id}: Free ${c.freeCount}/5  Pro ${c.totalProCount}/8  Universal ${c.universalScreenerCount}/2`);
}
n++;

/* ========== CORE WORDING PRESERVATION ========== */

const coreTexts: Record<string, string[]> = {
  'silenced-one': [
    'When I disagree with someone close to me, I hold back what I really think.',
    'I stay in the room but say nothing when I disagree with what is happening.',
    'When someone asks what I want, I say I do not care even when I do.',
    'After a difficult conversation, I often regret not saying what I really thought or needed.',
    'When I finally speak up, I give more explanation than I intended.',
    'When I am pressured to explain what I think or feel, my mind sometimes goes blank.',
    'In group decisions, I keep my preference to myself even when the choice matters to me.',
    'I stay quiet during tense moments because speaking honestly feels likely to make things worse.',
  ],
  'unheld-one': [
    'When I need emotional support, I expect it will not really be there.',
    'When someone offers to help me, I feel awkward accepting it.',
    'I handle things myself rather than let anyone see what I need.',
    'I keep my needs small so they do not become a problem for anyone.',
    'I brace myself for disappointment when I count on someone.',
    'I feel more certain of my place in a relationship when the other person relies on me.',
    'After I ask for help, I worry that I have asked for too much.',
    'Even around people I know well, I can still feel emotionally on my own.',
  ],
  'invisible-one': [
    'When I contribute to a group discussion, I expect my input to be overlooked.',
    'I downplay what I have achieved when someone asks about my work or efforts.',
    'I pass up visible roles even when I know I could handle them.',
    'I feel uncomfortable when other people openly recognize something I did well.',
    'I minimize my role in something even when I contributed a lot.',
    'I let other people take credit for work or effort I contributed.',
    'I keep my successes private because being noticed feels uncomfortable.',
    'In close relationships, I make my own needs and contributions seem less important than they are.',
  ],
  'shame-bearer': [
    'When I make a mistake, I see it as proof of something wrong with me.',
    'I worry that if people knew me fully, they would see something wrong with me.',
    'I hide parts of myself because I fear what people would think if they saw them.',
    'When I am rejected, I take it as a sign of my flaws.',
    'I can mess up without feeling like a failure as a person.',
    'After criticism, I keep thinking about what it says about me as a person.',
    'When someone is kind to me, part of me feels I have not earned it.',
    'I assume other people notice my flaws as much as I do.',
  ],
  'controller': [
    'I feel uncomfortable when decisions that affect me are made without my input.',
    'I find it hard to hand over important tasks without continuing to monitor how they are done.',
    'When someone handles a task differently than I would, I often step in and take over.',
    'I get irritated when plans change at the last minute.',
    'I feel safer when I am the one overseeing the outcome.',
    'I feel more settled when I can influence how an uncertain situation will unfold.',
    'I take responsibility for outcomes even when other people should be allowed to handle them.',
    'I can let other people lead without needing to direct how they do it.',
  ],
  'avoidant-one': [
    'I put off important conversations even when I know they need to happen.',
    'I keep myself busy to avoid paying attention to uncomfortable feelings.',
    'When tension builds in a close relationship, I reduce contact or emotionally pull away.',
    'I delay making decisions to avoid the discomfort of choosing.',
    'I take a pause and then return to difficult topics I have postponed.',
    'I tell myself a problem is not that serious so I can avoid dealing with it.',
    'I change the subject or create distance when a conversation becomes emotionally personal.',
    'I avoid manageable situations when I expect them to bring up uncomfortable emotions.',
  ],
  'entangled-one': [
    'When someone close to me is upset, their mood quickly becomes my mood too.',
    'I change personal plans I want to keep because someone close to me might feel disappointed.',
    'I feel guilty when I take reasonable time or space for myself.',
    'When someone close to me is distressed, I struggle to remember that their feelings are not mine to manage.',
    'I can care about someone\u2019s feelings without taking them on as my own.',
    'I feel responsible for keeping people I care about from becoming upset.',
    'I lose track of what I want when someone close to me wants something different.',
    'I feel uneasy making an independent choice when someone close to me may disagree.',
  ],
  'hypervigilant-one': [
    'I watch people\u2019s expressions closely for signs that tension or trouble may be building.',
    'Even in familiar places, I scan my surroundings for things that could go wrong.',
    'I have a hard time relaxing even when I cannot identify a current problem.',
    'I expect calm situations to change suddenly.',
    'Once a situation feels safe, I stop scanning for trouble.',
    'I prepare for possible problems even when there is little evidence they are likely.',
    'I feel responsible for spotting warning signs before other people notice them.',
    'After a stressful moment has passed, my mind keeps watching for what might happen next.',
  ],
  'grief-bearer': [
    'I compare present experiences with what I lost, even when the situations are different.',
    'It is hard for me to let new experiences matter alongside what I lost.',
    'I hold onto a version of the future that did not happen.',
    'I struggle to understand how what I lost fits into the life I have now.',
    'I can hold my sadness about the past while still opening to new things.',
    'After certain reminders, it takes me a long time to reconnect with the present.',
    'Parts of my life feel emotionally paused while the rest of life continues.',
    'What I lost often becomes the reference point for how I understand my life now.',
  ],
};

for (const [pid, expected] of Object.entries(coreTexts)) {
  console.log(`${n}. Verifying ${CORE_LABELS[pid]} wording preserved...`);
  const actual = APPROVED_QUIZ_ITEMS.filter(i => i.patternId === pid).map(i => i.text);
  for (const exp of expected) {
    check(actual.includes(exp), `Missing ${pid} text: "${exp}"`);
  }
  check(actual.length === expected.length, `${pid}: expected ${expected.length} texts, got ${actual.length}`);
  n++;
}

/* ========== CORE ITEM PRESERVATION ========== */

console.log(`${n}. Verifying all 72 core item IDs unchanged...`);
const coreIdSet = new Set(APPROVED_QUIZ_ITEMS.filter(i => i.layer === 'core').map(i => i.id));
const expectedCoreIds = [
  'core-silenced-one-01','core-silenced-one-02','core-silenced-one-03','core-silenced-one-04',
  'core-silenced-one-05','core-silenced-one-06','core-silenced-one-07','core-silenced-one-08',
  'core-unheld-one-01','core-unheld-one-02','core-unheld-one-03','core-unheld-one-04',
  'core-unheld-one-05','core-unheld-one-06','core-unheld-one-07','core-unheld-one-08',
  'core-invisible-one-01','core-invisible-one-02','core-invisible-one-03','core-invisible-one-04',
  'core-invisible-one-05','core-invisible-one-06','core-invisible-one-07','core-invisible-one-08',
  'core-shame-bearer-01','core-shame-bearer-02','core-shame-bearer-03','core-shame-bearer-04',
  'core-shame-bearer-05','core-shame-bearer-06','core-shame-bearer-07','core-shame-bearer-08',
  'core-controller-01','core-controller-02','core-controller-03','core-controller-04',
  'core-controller-05','core-controller-06','core-controller-07','core-controller-08',
  'core-avoidant-one-01','core-avoidant-one-02','core-avoidant-one-03','core-avoidant-one-04',
  'core-avoidant-one-05','core-avoidant-one-06','core-avoidant-one-07','core-avoidant-one-08',
  'core-hypervigilant-one-01','core-hypervigilant-one-02','core-hypervigilant-one-03',
  'core-hypervigilant-one-04','core-hypervigilant-one-05','core-hypervigilant-one-06',
  'core-hypervigilant-one-07','core-hypervigilant-one-08',
  'core-entangled-one-01','core-entangled-one-02','core-entangled-one-03','core-entangled-one-04',
  'core-entangled-one-05','core-entangled-one-06','core-entangled-one-07','core-entangled-one-08',
  'core-grief-bearer-01','core-grief-bearer-02','core-grief-bearer-03','core-grief-bearer-04',
  'core-grief-bearer-05','core-grief-bearer-06','core-grief-bearer-07','core-grief-bearer-08',
];
check(coreIdSet.size === 72, `Expected 72 core IDs, got ${coreIdSet.size}`);
for (const eid of expectedCoreIds) {
  check(coreIdSet.has(eid), `Missing core ID: ${eid}`);
}
n++;

console.log(`${n}. Verifying core counts unchanged...`);
check(APPROVED_QUIZ_ITEMS.filter(i => i.layer === 'core' && i.access === 'free').length === 45, 'Core free count changed');
check(APPROVED_QUIZ_ITEMS.filter(i => i.layer === 'core' && i.access === 'pro').length === 27, 'Core pro-only count changed');
n++;

/* ========== MARTYR STRUCTURE ========== */

console.log(`${n}. Verifying Martyr counts...`);
const martyrItems = APPROVED_QUIZ_ITEMS.filter(i => i.patternId === 'martyr');
check(martyrItems.length === 8, `Martyr should have 8 items, got ${martyrItems.length}`);
check(martyrItems.filter(i => i.access === 'free').length === 5, 'Martyr should have 5 free items');
check(martyrItems.filter(i => i.access === 'pro').length === 3, 'Martyr should have 3 pro-only items');
const martyrUniversal = martyrItems.filter(i => i.strategyScreen === 'universal');
check(martyrUniversal.length === 2, `Martyr should have 2 universal screeners, got ${martyrUniversal.length}`);
const martyrUniversalIds = martyrUniversal.map(i => i.id).sort();
check(martyrUniversalIds[0] === 'strategy-martyr-01' && martyrUniversalIds[1] === 'strategy-martyr-02',
  `Martyr universal screeners should be strategy-martyr-01 and strategy-martyr-02, got ${martyrUniversalIds.join(', ')}`);

const proFiltered = getApprovedItemsForMode('pro').filter(i => i.patternId === 'martyr');
check(proFiltered.length === 8, 'Pro selector should return 8 martyr items');
const freeFiltered = getApprovedItemsForMode('free').filter(i => i.patternId === 'martyr');
check(freeFiltered.length === 5, 'Free selector should return 5 martyr items');

const strategySelectorFree = getApprovedStrategyItemsForPattern('martyr', 'free');
check(strategySelectorFree.length === 5, `Strategy Free selector should return 5, got ${strategySelectorFree.length}`);
const strategySelectorPro = getApprovedStrategyItemsForPattern('martyr', 'pro');
check(strategySelectorPro.length === 8, `Strategy Pro selector should return 8, got ${strategySelectorPro.length}`);
n++;

console.log(`${n}. Verifying Martyr structure...`);
for (const item of martyrItems) {
  check(item.patternId === 'martyr', `${item.id} should have patternId martyr`);
  check(item.layer === 'strategy', `${item.id} should have layer strategy`);
  check(item.scale === 'frequency', `${item.id} scale not frequency`);
  check(item.status === 'approved', `${item.id} status not approved`);
  check(STRATEGY_PATTERN_IDS.includes('martyr'), 'martyr should be in STRATEGY_PATTERN_IDS');
  check(!(CORE_PATTERN_IDS as readonly string[]).includes('martyr'), 'martyr should not be in CORE_PATTERN_IDS');
}
check(martyrItems.filter(i => i.reverseScored).length === 1, `Expected 1 reverse-scored martyr item`);
const martyrRev = martyrItems.find(i => i.reverseScored);
check(martyrRev?.id === 'strategy-martyr-05', `Reverse-scored martyr item should be strategy-martyr-05, got ${martyrRev?.id}`);
n++;

/* ========== MARTYR WORDING ========== */

console.log(`${n}. Verifying Martyr wording...`);
const martyrTexts = [
  'I keep giving to others even after I have nothing left for myself.',
  'I say yes when I want to say no and then feel drained afterward.',
  'I turn down help even when I am overwhelmed.',
  'I expect people to notice what I give without me having to say it.',
  'I set limits on what I give before it begins to wear me down.',
  'I take on more than people actually asked me to do.',
  'I feel guilty resting while other people still want something from me.',
  'I feel more worthy when I endure more for others than they asked of me.',
];
const actualMartyrTexts = martyrItems.map(i => i.text);
for (const exp of martyrTexts) {
  check(actualMartyrTexts.includes(exp), `Missing martyr text: "${exp}"`);
}
check(actualMartyrTexts.length === martyrTexts.length, `Martyr: expected ${martyrTexts.length} texts, got ${actualMartyrTexts.length}`);
n++;

/* ========== UNIVERSAL STRATEGY SCREEN ========== */

console.log(`${n}. Verifying universal strategy screen totals...`);
const allUniversal = APPROVED_QUIZ_ITEMS.filter(i => i.strategyScreen === 'universal');
check(allUniversal.length === 12, `Expected 12 universal screeners, got ${allUniversal.length}`);
const martyrScreeners = allUniversal.filter(i => i.patternId === 'martyr');
check(martyrScreeners.length === 2, `Expected 2 martyr screeners, got ${martyrScreeners.length}`);
const rescuerScreeners = allUniversal.filter(i => i.patternId === 'rescuer');
check(rescuerScreeners.length === 2, `Expected 2 rescuer screeners, got ${rescuerScreeners.length}`);
const orScreeners = allUniversal.filter(i => i.patternId === 'over-responsible-one');
check(orScreeners.length === 2, `Expected 2 over-responsible-one screeners, got ${orScreeners.length}`);
const olScreeners = allUniversal.filter(i => i.patternId === 'overloaded-one');
check(olScreeners.length === 2, `Expected 2 overloaded-one screeners, got ${olScreeners.length}`);
const pfScreeners = allUniversal.filter(i => i.patternId === 'perfectionist');
check(pfScreeners.length === 2, `Expected 2 perfectionist screeners, got ${pfScreeners.length}`);
const asScreeners = allUniversal.filter(i => i.patternId === 'anger-shield');
check(asScreeners.length === 2, `Expected 2 anger-shield screeners, got ${asScreeners.length}`);
check(allUniversal.every(i => i.strategyScreen === 'universal' && i.layer === 'strategy' && i.access === 'free'),
  'All universal screeners should have strategyScreen universal, layer strategy, access free');
const universalFree = getUniversalStrategyScreenItems('free');
check(universalFree.length === 12, `Free universal selector should return 12, got ${universalFree.length}`);
check(universalFree.every(i => i.strategyScreen === 'universal'), 'Free universal screen should only return universal items');
const universalPro = getUniversalStrategyScreenItems('pro');
check(universalPro.length === 12, `Pro universal selector should return 12, got ${universalPro.length}`);
check(universalPro.every(i => i.strategyScreen === 'universal'), 'Pro universal screen should only return universal items');
const universalIds = allUniversal.map(i => i.id).sort();
const expectedUniversal = [
  'strategy-martyr-01','strategy-martyr-02',
  'strategy-overloaded-one-01','strategy-overloaded-one-02',
  'strategy-perfectionist-01','strategy-perfectionist-02',
  'strategy-anger-shield-01','strategy-anger-shield-02',
  'strategy-over-responsible-one-01','strategy-over-responsible-one-02',
  'strategy-rescuer-01','strategy-rescuer-02',
].sort().join(',');
check(universalIds.join(',') === expectedUniversal,
  `Unexpected universal screener IDs: ${universalIds.join(',')}`);
n++;

/* ========== INCOMPLETE STRATEGIES (ZERO ITEMS) ========== */

const zeroItemStrategies: string[] = [];
for (const sid of zeroItemStrategies) {
  console.log(`${n}. Verifying ${STRATEGY_LABELS[sid]} has zero items...`);
  check(APPROVED_QUIZ_ITEMS.filter(i => i.patternId === sid).length === 0, `${STRATEGY_LABELS[sid]} should have 0 items`);
  n++;
}

/* ========== COVERAGE: MARTYR ========== */

console.log(`${n}. Verifying Martyr coverage...`);
const martyrCoverage = coverage['martyr'];
check(martyrCoverage.universalScreenerCount === 2, `Martyr universal screeners: expected 2, got ${martyrCoverage.universalScreenerCount}`);
check(martyrCoverage.freeCount === 5, `Martyr free: expected 5, got ${martyrCoverage.freeCount}`);
check(martyrCoverage.proOnlyCount === 3, `Martyr pro-only: expected 3, got ${martyrCoverage.proOnlyCount}`);
check(martyrCoverage.totalProCount === 8, `Martyr total pro: expected 8, got ${martyrCoverage.totalProCount}`);
check(martyrCoverage.freeComplete === true, 'Martyr freeComplete should be true');
check(martyrCoverage.proComplete === true, 'Martyr proComplete should be true');
check(martyrCoverage.universalComplete === true, 'Martyr universalComplete should be true');
n++;

/* ========== READINESS DETAIL ========== */

console.log(`${n}. Verifying readiness details...`);
check(proReadiness.coreBankComplete === true, 'Pro coreBankComplete should be true');
check(proReadiness.strategyBankComplete === true, 'Pro strategyBankComplete should be true (all 6 strategies complete)');
check(proReadiness.universalStrategyScreenComplete === true, 'universalStrategyScreenComplete should be true (all 6 strategies have screeners)');
check(proReadiness.adaptiveConfigComplete === true, 'adaptiveConfigComplete should be true (routing config and functions exist)');
check(proReadiness.expressionGroupingComplete === true, 'expressionGroupingComplete should be true (all 145 expressions grouped)');
check(proReadiness.expressionScreeningComplete === true, 'expressionScreeningComplete should be true (all 145 expressions have 2 items)');
check(proReadiness.expressionConfirmationComplete === true, 'expressionConfirmationComplete should be true (all 145 expressions confirmed)');
n++;

/* ========== MISSING STRATEGIES ========== */

console.log(`${n}. Verifying missing strategy list...`);
const missingStrategies = zeroItemStrategies.filter(
  sid => !coverage[sid] || coverage[sid].totalProCount < 8
);
check(missingStrategies.length === 0, `Expected 0 missing strategies, got ${missingStrategies.length}`);
n++;

/* ========== RESCUER STRUCTURE ========== */

console.log(`${n}. Verifying Rescuer counts...`);
const rescuerItems = APPROVED_QUIZ_ITEMS.filter(i => i.patternId === 'rescuer');
check(rescuerItems.length === 8, `Rescuer should have 8 items, got ${rescuerItems.length}`);
check(rescuerItems.filter(i => i.access === 'free').length === 5, 'Rescuer should have 5 free items');
check(rescuerItems.filter(i => i.access === 'pro').length === 3, 'Rescuer should have 3 pro-only items');
const rescuerUniversal = rescuerItems.filter(i => i.strategyScreen === 'universal');
check(rescuerUniversal.length === 2, `Rescuer should have 2 universal screeners, got ${rescuerUniversal.length}`);
const rescuerUniversalIds = rescuerUniversal.map(i => i.id).sort();
check(rescuerUniversalIds[0] === 'strategy-rescuer-01' && rescuerUniversalIds[1] === 'strategy-rescuer-02',
  `Rescuer universal screeners should be strategy-rescuer-01 and strategy-rescuer-02, got ${rescuerUniversalIds.join(', ')}`);

const rescuerProFiltered = getApprovedItemsForMode('pro').filter(i => i.patternId === 'rescuer');
check(rescuerProFiltered.length === 8, 'Pro selector should return 8 rescuer items');
const rescuerFreeFiltered = getApprovedItemsForMode('free').filter(i => i.patternId === 'rescuer');
check(rescuerFreeFiltered.length === 5, 'Free selector should return 5 rescuer items');

const rescuerStrategyFree = getApprovedStrategyItemsForPattern('rescuer', 'free');
check(rescuerStrategyFree.length === 5, `Strategy Free selector should return 5, got ${rescuerStrategyFree.length}`);
const rescuerStrategyPro = getApprovedStrategyItemsForPattern('rescuer', 'pro');
check(rescuerStrategyPro.length === 8, `Strategy Pro selector should return 8, got ${rescuerStrategyPro.length}`);
n++;

console.log(`${n}. Verifying Rescuer structure...`);
for (const item of rescuerItems) {
  check(item.patternId === 'rescuer', `${item.id} should have patternId rescuer`);
  check(item.layer === 'strategy', `${item.id} should have layer strategy`);
  check(item.scale === 'frequency', `${item.id} scale not frequency`);
  check(item.status === 'approved', `${item.id} status not approved`);
  check(STRATEGY_PATTERN_IDS.includes('rescuer'), 'rescuer should be in STRATEGY_PATTERN_IDS');
  check(!(CORE_PATTERN_IDS as readonly string[]).includes('rescuer'), 'rescuer should not be in CORE_PATTERN_IDS');
}
check(rescuerItems.filter(i => i.reverseScored).length === 1, `Expected 1 reverse-scored rescuer item`);
const rescuerRev = rescuerItems.find(i => i.reverseScored);
check(rescuerRev?.id === 'strategy-rescuer-05', `Reverse-scored rescuer item should be strategy-rescuer-05, got ${rescuerRev?.id}`);
n++;

/* ========== RESCUER WORDING ========== */

console.log(`${n}. Verifying Rescuer wording...`);
const rescuerTexts = [
  'I offer solutions to people before they have asked for my advice.',
  'I do things for people that they could reasonably do themselves.',
  'I step in to prevent people from dealing with the consequences of their choices.',
  'I feel compelled to step in when someone is upset, even when they have not asked for help.',
  'I can support someone without protecting them from the results of their own decisions.',
  'I repeatedly help people solve problems they are not taking responsibility for.',
  'I get frustrated when people do not follow the advice I gave them.',
  'I sometimes take over while believing I am only being supportive.',
];
const actualRescuerTexts = rescuerItems.map(i => i.text);
for (const exp of rescuerTexts) {
  check(actualRescuerTexts.includes(exp), `Missing rescuer text: "${exp}"`);
}
check(actualRescuerTexts.length === rescuerTexts.length, `Rescuer: expected ${rescuerTexts.length} texts, got ${actualRescuerTexts.length}`);
n++;

/* ========== COVERAGE: RESCUER ========== */

console.log(`${n}. Verifying Rescuer coverage...`);
const rescuerCoverage = coverage['rescuer'];
check(rescuerCoverage.universalScreenerCount === 2, `Rescuer universal screeners: expected 2, got ${rescuerCoverage.universalScreenerCount}`);
check(rescuerCoverage.freeCount === 5, `Rescuer free: expected 5, got ${rescuerCoverage.freeCount}`);
check(rescuerCoverage.proOnlyCount === 3, `Rescuer pro-only: expected 3, got ${rescuerCoverage.proOnlyCount}`);
check(rescuerCoverage.totalProCount === 8, `Rescuer total pro: expected 8, got ${rescuerCoverage.totalProCount}`);
check(rescuerCoverage.freeComplete === true, 'Rescuer freeComplete should be true');
check(rescuerCoverage.proComplete === true, 'Rescuer proComplete should be true');
check(rescuerCoverage.universalComplete === true, 'Rescuer universalComplete should be true');
n++;

/* ========== REVERSE-SCORING RESCUER-05 ========== */

console.log(`${n}. Testing strategy-rescuer-05 reverse scoring...`);
const rescuerRevItem = APPROVED_QUIZ_ITEMS.find(i => i.id === 'strategy-rescuer-05')!;
check(scoreApprovedItemResponse(rescuerRevItem, 1) === 5, 'rescuer-05 rev 1->5');
check(scoreApprovedItemResponse(rescuerRevItem, 2) === 4, 'rescuer-05 rev 2->4');
check(scoreApprovedItemResponse(rescuerRevItem, 3) === 3, 'rescuer-05 rev 3->3');
check(scoreApprovedItemResponse(rescuerRevItem, 4) === 2, 'rescuer-05 rev 4->2');
check(scoreApprovedItemResponse(rescuerRevItem, 5) === 1, 'rescuer-05 rev 5->1');
n++;

/* ========== OVER-RESPONSIBLE ONE STRUCTURE ========== */

console.log(`${n}. Verifying Over-Responsible One counts...`);
const orItems = APPROVED_QUIZ_ITEMS.filter(i => i.patternId === 'over-responsible-one');
check(orItems.length === 8, `Over-Responsible One should have 8 items, got ${orItems.length}`);
check(orItems.filter(i => i.access === 'free').length === 5, 'Over-Responsible One should have 5 free items');
check(orItems.filter(i => i.access === 'pro').length === 3, 'Over-Responsible One should have 3 pro-only items');
const orUniversal = orItems.filter(i => i.strategyScreen === 'universal');
check(orUniversal.length === 2, `Over-Responsible One should have 2 universal screeners, got ${orUniversal.length}`);
const orUniversalIds = orUniversal.map(i => i.id).sort();
check(orUniversalIds[0] === 'strategy-over-responsible-one-01' && orUniversalIds[1] === 'strategy-over-responsible-one-02',
  `Over-Responsible One universal screeners should be -01 and -02, got ${orUniversalIds.join(', ')}`);

const orProFiltered = getApprovedItemsForMode('pro').filter(i => i.patternId === 'over-responsible-one');
check(orProFiltered.length === 8, 'Pro selector should return 8 over-responsible-one items');
const orFreeFiltered = getApprovedItemsForMode('free').filter(i => i.patternId === 'over-responsible-one');
check(orFreeFiltered.length === 5, 'Free selector should return 5 over-responsible-one items');

const orStrategyFree = getApprovedStrategyItemsForPattern('over-responsible-one', 'free');
check(orStrategyFree.length === 5, `Strategy Free selector should return 5, got ${orStrategyFree.length}`);
const orStrategyPro = getApprovedStrategyItemsForPattern('over-responsible-one', 'pro');
check(orStrategyPro.length === 8, `Strategy Pro selector should return 8, got ${orStrategyPro.length}`);
n++;

console.log(`${n}. Verifying Over-Responsible One structure...`);
for (const item of orItems) {
  check(item.patternId === 'over-responsible-one', `${item.id} should have patternId over-responsible-one`);
  check(item.layer === 'strategy', `${item.id} should have layer strategy`);
  check(item.scale === 'frequency', `${item.id} scale not frequency`);
  check(item.status === 'approved', `${item.id} status not approved`);
  check(STRATEGY_PATTERN_IDS.includes('over-responsible-one'), 'over-responsible-one should be in STRATEGY_PATTERN_IDS');
  check(!(CORE_PATTERN_IDS as readonly string[]).includes('over-responsible-one'), 'over-responsible-one should not be in CORE_PATTERN_IDS');
}
check(orItems.filter(i => i.reverseScored).length === 1, `Expected 1 reverse-scored over-responsible-one item`);
const orRev = orItems.find(i => i.reverseScored);
check(orRev?.id === 'strategy-over-responsible-one-05', `Reverse-scored item should be -05, got ${orRev?.id}`);
n++;

/* ========== OVER-RESPONSIBLE ONE WORDING ========== */

console.log(`${n}. Verifying Over-Responsible One wording...`);
const orTexts = [
  'I take blame for things that go wrong even when several people were involved.',
  'I carry responsibilities that should really belong to other people.',
  'I feel responsible for preventing problems that I cannot actually control.',
  'I feel guilty when someone I care about is disappointed, even when the outcome was not mine to control.',
  'I can tell the difference between my responsibility and what belongs to others.',
  'I fix mistakes that were not mine to correct.',
  'I feel at fault when someone close to me struggles, even when I did not cause the problem.',
  'I treat shared outcomes as if they are my personal obligation.',
];
const actualOrTexts = orItems.map(i => i.text);
for (const exp of orTexts) {
  check(actualOrTexts.includes(exp), `Missing over-responsible-one text: "${exp}"`);
}
check(actualOrTexts.length === orTexts.length, `Over-Responsible One: expected ${orTexts.length} texts, got ${actualOrTexts.length}`);
n++;

/* ========== COVERAGE: OVER-RESPONSIBLE ONE ========== */

console.log(`${n}. Verifying Over-Responsible One coverage...`);
const orCoverage = coverage['over-responsible-one'];
check(orCoverage.universalScreenerCount === 2, `Universal screeners: expected 2, got ${orCoverage.universalScreenerCount}`);
check(orCoverage.freeCount === 5, `Free: expected 5, got ${orCoverage.freeCount}`);
check(orCoverage.proOnlyCount === 3, `Pro-only: expected 3, got ${orCoverage.proOnlyCount}`);
check(orCoverage.totalProCount === 8, `Total Pro: expected 8, got ${orCoverage.totalProCount}`);
check(orCoverage.freeComplete === true, 'freeComplete should be true');
check(orCoverage.proComplete === true, 'proComplete should be true');
check(orCoverage.universalComplete === true, 'universalComplete should be true');
n++;

/* ========== REVERSE-SCORING OVER-RESPONSIBLE-ONE-05 ========== */

console.log(`${n}. Testing strategy-over-responsible-one-05 reverse scoring...`);
const orRevItem = APPROVED_QUIZ_ITEMS.find(i => i.id === 'strategy-over-responsible-one-05')!;
check(scoreApprovedItemResponse(orRevItem, 1) === 5, 'over-responsible-one-05 rev 1->5');
check(scoreApprovedItemResponse(orRevItem, 2) === 4, 'over-responsible-one-05 rev 2->4');
check(scoreApprovedItemResponse(orRevItem, 3) === 3, 'over-responsible-one-05 rev 3->3');
check(scoreApprovedItemResponse(orRevItem, 4) === 2, 'over-responsible-one-05 rev 4->2');
check(scoreApprovedItemResponse(orRevItem, 5) === 1, 'over-responsible-one-05 rev 5->1');
n++;

/* ========== OVERLOADED ONE STRUCTURE ========== */

console.log(`${n}. Verifying Overloaded One counts...`);
const olItems = APPROVED_QUIZ_ITEMS.filter(i => i.patternId === 'overloaded-one');
check(olItems.length === 8, `Overloaded One should have 8 items, got ${olItems.length}`);
check(olItems.filter(i => i.access === 'free').length === 5, 'Overloaded One should have 5 free items');
check(olItems.filter(i => i.access === 'pro').length === 3, 'Overloaded One should have 3 pro-only items');
const olUniversal = olItems.filter(i => i.strategyScreen === 'universal');
check(olUniversal.length === 2, `Overloaded One should have 2 universal screeners, got ${olUniversal.length}`);
const olUniversalIds = olUniversal.map(i => i.id).sort();
check(olUniversalIds[0] === 'strategy-overloaded-one-01' && olUniversalIds[1] === 'strategy-overloaded-one-02',
  `Overloaded One universal screeners should be -01 and -02, got ${olUniversalIds.join(', ')}`);

const olProFiltered = getApprovedItemsForMode('pro').filter(i => i.patternId === 'overloaded-one');
check(olProFiltered.length === 8, 'Pro selector should return 8 overloaded-one items');
const olFreeFiltered = getApprovedItemsForMode('free').filter(i => i.patternId === 'overloaded-one');
check(olFreeFiltered.length === 5, 'Free selector should return 5 overloaded-one items');

const olStrategyFree = getApprovedStrategyItemsForPattern('overloaded-one', 'free');
check(olStrategyFree.length === 5, `Strategy Free selector should return 5, got ${olStrategyFree.length}`);
const olStrategyPro = getApprovedStrategyItemsForPattern('overloaded-one', 'pro');
check(olStrategyPro.length === 8, `Strategy Pro selector should return 8, got ${olStrategyPro.length}`);
n++;

console.log(`${n}. Verifying Overloaded One structure...`);
for (const item of olItems) {
  check(item.patternId === 'overloaded-one', `${item.id} should have patternId overloaded-one`);
  check(item.layer === 'strategy', `${item.id} should have layer strategy`);
  check(item.scale === 'frequency', `${item.id} scale not frequency`);
  check(item.status === 'approved', `${item.id} status not approved`);
  check(STRATEGY_PATTERN_IDS.includes('overloaded-one'), 'overloaded-one should be in STRATEGY_PATTERN_IDS');
  check(!(CORE_PATTERN_IDS as readonly string[]).includes('overloaded-one'), 'overloaded-one should not be in CORE_PATTERN_IDS');
}
check(olItems.filter(i => i.reverseScored).length === 1, `Expected 1 reverse-scored overloaded-one item`);
const olRev = olItems.find(i => i.reverseScored);
check(olRev?.id === 'strategy-overloaded-one-05', `Reverse-scored item should be -05, got ${olRev?.id}`);
n++;

/* ========== OVERLOADED ONE WORDING ========== */

console.log(`${n}. Verifying Overloaded One wording...`);
const olTexts = [
  'I say yes to new commitments even when I am already stretched thin.',
  'I struggle to figure out what I can postpone or drop from my list.',
  'I keep going at the same pace even after I notice I am reaching my limit.',
  'I spend much of my available time catching up on commitments I accepted.',
  'I notice when I am approaching my limit and adjust my commitments accordingly.',
  'I allow myself to become the default person for more tasks than I can manage sustainably.',
  'I wait until I am completely drained before reducing how much I have agreed to do.',
  'I leave too little recovery time between commitments when I have some choice in scheduling them.',
];
const actualOlTexts = olItems.map(i => i.text);
for (const exp of olTexts) {
  check(actualOlTexts.includes(exp), `Missing overloaded-one text: "${exp}"`);
}
check(actualOlTexts.length === olTexts.length, `Overloaded One: expected ${olTexts.length} texts, got ${actualOlTexts.length}`);
n++;

/* ========== COVERAGE: OVERLOADED ONE ========== */

console.log(`${n}. Verifying Overloaded One coverage...`);
const olCoverage = coverage['overloaded-one'];
check(olCoverage.universalScreenerCount === 2, `Universal screeners: expected 2, got ${olCoverage.universalScreenerCount}`);
check(olCoverage.freeCount === 5, `Free: expected 5, got ${olCoverage.freeCount}`);
check(olCoverage.proOnlyCount === 3, `Pro-only: expected 3, got ${olCoverage.proOnlyCount}`);
check(olCoverage.totalProCount === 8, `Total Pro: expected 8, got ${olCoverage.totalProCount}`);
check(olCoverage.freeComplete === true, 'freeComplete should be true');
check(olCoverage.proComplete === true, 'proComplete should be true');
check(olCoverage.universalComplete === true, 'universalComplete should be true');
n++;

/* ========== REVERSE-SCORING OVERLOADED-ONE-05 ========== */

console.log(`${n}. Testing strategy-overloaded-one-05 reverse scoring...`);
const olRevItem = APPROVED_QUIZ_ITEMS.find(i => i.id === 'strategy-overloaded-one-05')!;
check(scoreApprovedItemResponse(olRevItem, 1) === 5, 'overloaded-one-05 rev 1->5');
check(scoreApprovedItemResponse(olRevItem, 2) === 4, 'overloaded-one-05 rev 2->4');
check(scoreApprovedItemResponse(olRevItem, 3) === 3, 'overloaded-one-05 rev 3->3');
check(scoreApprovedItemResponse(olRevItem, 4) === 2, 'overloaded-one-05 rev 4->2');
check(scoreApprovedItemResponse(olRevItem, 5) === 1, 'overloaded-one-05 rev 5->1');
n++;

/* ========== PERFECTIONIST STRUCTURE ========== */

console.log(`${n}. Verifying Perfectionist counts...`);
const pfItems = APPROVED_QUIZ_ITEMS.filter(i => i.patternId === 'perfectionist');
check(pfItems.length === 8, `Perfectionist should have 8 items, got ${pfItems.length}`);
check(pfItems.filter(i => i.access === 'free').length === 5, 'Perfectionist should have 5 free items');
check(pfItems.filter(i => i.access === 'pro').length === 3, 'Perfectionist should have 3 pro-only items');
const pfUniversal = pfItems.filter(i => i.strategyScreen === 'universal');
check(pfUniversal.length === 2, `Perfectionist should have 2 universal screeners, got ${pfUniversal.length}`);
const pfUniversalIds = pfUniversal.map(i => i.id).sort();
check(pfUniversalIds[0] === 'strategy-perfectionist-01' && pfUniversalIds[1] === 'strategy-perfectionist-02',
  `Perfectionist universal screeners should be -01 and -02, got ${pfUniversalIds.join(', ')}`);

const pfProFiltered = getApprovedItemsForMode('pro').filter(i => i.patternId === 'perfectionist');
check(pfProFiltered.length === 8, 'Pro selector should return 8 perfectionist items');
const pfFreeFiltered = getApprovedItemsForMode('free').filter(i => i.patternId === 'perfectionist');
check(pfFreeFiltered.length === 5, 'Free selector should return 5 perfectionist items');

const pfStrategyFree = getApprovedStrategyItemsForPattern('perfectionist', 'free');
check(pfStrategyFree.length === 5, `Strategy Free selector should return 5, got ${pfStrategyFree.length}`);
const pfStrategyPro = getApprovedStrategyItemsForPattern('perfectionist', 'pro');
check(pfStrategyPro.length === 8, `Strategy Pro selector should return 8, got ${pfStrategyPro.length}`);
n++;

console.log(`${n}. Verifying Perfectionist structure...`);
for (const item of pfItems) {
  check(item.patternId === 'perfectionist', `${item.id} should have patternId perfectionist`);
  check(item.layer === 'strategy', `${item.id} should have layer strategy`);
  check(item.scale === 'frequency', `${item.id} scale not frequency`);
  check(item.status === 'approved', `${item.id} status not approved`);
  check(STRATEGY_PATTERN_IDS.includes('perfectionist'), 'perfectionist should be in STRATEGY_PATTERN_IDS');
  check(!(CORE_PATTERN_IDS as readonly string[]).includes('perfectionist'), 'perfectionist should not be in CORE_PATTERN_IDS');
}
check(pfItems.filter(i => i.reverseScored).length === 1, `Expected 1 reverse-scored perfectionist item`);
const pfRev = pfItems.find(i => i.reverseScored);
check(pfRev?.id === 'strategy-perfectionist-05', `Reverse-scored item should be -05, got ${pfRev?.id}`);
n++;

/* ========== PERFECTIONIST WORDING ========== */

console.log(`${n}. Verifying Perfectionist wording...`);
const pfTexts = [
  'I keep improving things long after they are good enough.',
  'I check my work multiple times for mistakes that are unlikely to be there.',
  'I delay finishing things because they still do not feel ready.',
  'I feel dissatisfied with results that meet what the situation actually requires.',
  'I can finish something on time even when it is not perfect.',
  'I treat small mistakes as if they are major problems.',
  'I use nearly the same high standard for minor tasks as I do for important ones.',
  'I focus on imperfections even when other people respond positively to what I did.',
];
const actualPfTexts = pfItems.map(i => i.text);
for (const exp of pfTexts) {
  check(actualPfTexts.includes(exp), `Missing perfectionist text: "${exp}"`);
}
check(actualPfTexts.length === pfTexts.length, `Perfectionist: expected ${pfTexts.length} texts, got ${actualPfTexts.length}`);
n++;

/* ========== COVERAGE: PERFECTIONIST ========== */

console.log(`${n}. Verifying Perfectionist coverage...`);
const pfCoverage = coverage['perfectionist'];
check(pfCoverage.universalScreenerCount === 2, `Universal screeners: expected 2, got ${pfCoverage.universalScreenerCount}`);
check(pfCoverage.freeCount === 5, `Free: expected 5, got ${pfCoverage.freeCount}`);
check(pfCoverage.proOnlyCount === 3, `Pro-only: expected 3, got ${pfCoverage.proOnlyCount}`);
check(pfCoverage.totalProCount === 8, `Total Pro: expected 8, got ${pfCoverage.totalProCount}`);
check(pfCoverage.freeComplete === true, 'freeComplete should be true');
check(pfCoverage.proComplete === true, 'proComplete should be true');
check(pfCoverage.universalComplete === true, 'universalComplete should be true');
n++;

/* ========== REVERSE-SCORING PERFECTIONIST-05 ========== */

console.log(`${n}. Testing strategy-perfectionist-05 reverse scoring...`);
const pfRevItem = APPROVED_QUIZ_ITEMS.find(i => i.id === 'strategy-perfectionist-05')!;
check(scoreApprovedItemResponse(pfRevItem, 1) === 5, 'perfectionist-05 rev 1->5');
check(scoreApprovedItemResponse(pfRevItem, 2) === 4, 'perfectionist-05 rev 2->4');
check(scoreApprovedItemResponse(pfRevItem, 3) === 3, 'perfectionist-05 rev 3->3');
check(scoreApprovedItemResponse(pfRevItem, 4) === 2, 'perfectionist-05 rev 4->2');
check(scoreApprovedItemResponse(pfRevItem, 5) === 1, 'perfectionist-05 rev 5->1');
n++;

/* ========== OVERLOADED ONE PRESERVATION ========== */

console.log(`${n}. Verifying Overloaded One preservation...`);
check(olItems.length === 8, 'Overloaded One should still have 8 items');
check(olItems.filter(i => i.strategyScreen === 'universal').length === 2, 'Overloaded One should still have 2 universal screeners');
check(olItems.filter(i => i.access === 'free').length === 5, 'Overloaded One should still have 5 free items');
check(olItems.filter(i => i.access === 'pro').length === 3, 'Overloaded One should still have 3 pro-only items');
check(olItems.filter(i => i.reverseScored).length === 1, 'Overloaded One should still have 1 reverse-scored item');
check(scoreApprovedItemResponse(olRevItem, 1) === 5, 'overloaded-one-05 rev 1->5 (preserved)');
check(scoreApprovedItemResponse(olRevItem, 2) === 4, 'overloaded-one-05 rev 2->4 (preserved)');
check(scoreApprovedItemResponse(olRevItem, 3) === 3, 'overloaded-one-05 rev 3->3 (preserved)');
check(scoreApprovedItemResponse(olRevItem, 4) === 2, 'overloaded-one-05 rev 4->2 (preserved)');
check(scoreApprovedItemResponse(olRevItem, 5) === 1, 'overloaded-one-05 rev 5->1 (preserved)');
n++;

/* ========== OVER-RESPONSIBLE ONE PRESERVATION ========== */

console.log(`${n}. Verifying Over-Responsible One preservation...`);
check(orItems.length === 8, 'Over-Responsible One should still have 8 items');
check(orItems.filter(i => i.strategyScreen === 'universal').length === 2, 'Over-Responsible One should still have 2 universal screeners');
check(orItems.filter(i => i.access === 'free').length === 5, 'Over-Responsible One should still have 5 free items');
check(orItems.filter(i => i.access === 'pro').length === 3, 'Over-Responsible One should still have 3 pro-only items');
check(orItems.filter(i => i.reverseScored).length === 1, 'Over-Responsible One should still have 1 reverse-scored item');
check(scoreApprovedItemResponse(orRevItem, 1) === 5, 'over-responsible-one-05 rev 1->5 (preserved)');
check(scoreApprovedItemResponse(orRevItem, 2) === 4, 'over-responsible-one-05 rev 2->4 (preserved)');
check(scoreApprovedItemResponse(orRevItem, 3) === 3, 'over-responsible-one-05 rev 3->3 (preserved)');
check(scoreApprovedItemResponse(orRevItem, 4) === 2, 'over-responsible-one-05 rev 4->2 (preserved)');
check(scoreApprovedItemResponse(orRevItem, 5) === 1, 'over-responsible-one-05 rev 5->1 (preserved)');
n++;

/* ========== PERFECTIONIST PRESERVATION ========== */

console.log(`${n}. Verifying Perfectionist preservation...`);
check(pfItems.length === 8, 'Perfectionist should still have 8 items');
check(pfItems.filter(i => i.strategyScreen === 'universal').length === 2, 'Perfectionist should still have 2 universal screeners');
check(pfItems.filter(i => i.access === 'free').length === 5, 'Perfectionist should still have 5 free items');
check(pfItems.filter(i => i.access === 'pro').length === 3, 'Perfectionist should still have 3 pro-only items');
check(pfItems.filter(i => i.reverseScored).length === 1, 'Perfectionist should still have 1 reverse-scored item');
check(scoreApprovedItemResponse(pfRevItem, 1) === 5, 'perfectionist-05 rev 1->5 (preserved)');
check(scoreApprovedItemResponse(pfRevItem, 2) === 4, 'perfectionist-05 rev 2->4 (preserved)');
check(scoreApprovedItemResponse(pfRevItem, 3) === 3, 'perfectionist-05 rev 3->3 (preserved)');
check(scoreApprovedItemResponse(pfRevItem, 4) === 2, 'perfectionist-05 rev 4->2 (preserved)');
check(scoreApprovedItemResponse(pfRevItem, 5) === 1, 'perfectionist-05 rev 5->1 (preserved)');
n++;

/* ========== ANGER SHIELD STRUCTURE ========== */

console.log(`${n}. Verifying Anger Shield counts...`);
const asItems = APPROVED_QUIZ_ITEMS.filter(i => i.patternId === 'anger-shield');
check(asItems.length === 8, `Anger Shield should have 8 items, got ${asItems.length}`);
check(asItems.filter(i => i.access === 'free').length === 5, 'Anger Shield should have 5 free items');
check(asItems.filter(i => i.access === 'pro').length === 3, 'Anger Shield should have 3 pro-only items');
const asUniversal = asItems.filter(i => i.strategyScreen === 'universal');
check(asUniversal.length === 2, `Anger Shield should have 2 universal screeners, got ${asUniversal.length}`);
const asUniversalIds = asUniversal.map(i => i.id).sort();
check(asUniversalIds[0] === 'strategy-anger-shield-01' && asUniversalIds[1] === 'strategy-anger-shield-02',
  `Anger Shield universal screeners should be -01 and -02, got ${asUniversalIds.join(', ')}`);

const asProFiltered = getApprovedItemsForMode('pro').filter(i => i.patternId === 'anger-shield');
check(asProFiltered.length === 8, 'Pro selector should return 8 anger-shield items');
const asFreeFiltered = getApprovedItemsForMode('free').filter(i => i.patternId === 'anger-shield');
check(asFreeFiltered.length === 5, 'Free selector should return 5 anger-shield items');

const asStrategyFree = getApprovedStrategyItemsForPattern('anger-shield', 'free');
check(asStrategyFree.length === 5, `Strategy Free selector should return 5, got ${asStrategyFree.length}`);
const asStrategyPro = getApprovedStrategyItemsForPattern('anger-shield', 'pro');
check(asStrategyPro.length === 8, `Strategy Pro selector should return 8, got ${asStrategyPro.length}`);
n++;

console.log(`${n}. Verifying Anger Shield structure...`);
for (const item of asItems) {
  check(item.patternId === 'anger-shield', `${item.id} should have patternId anger-shield`);
  check(item.layer === 'strategy', `${item.id} should have layer strategy`);
  check(item.scale === 'frequency', `${item.id} scale not frequency`);
  check(item.status === 'approved', `${item.id} status not approved`);
  check(STRATEGY_PATTERN_IDS.includes('anger-shield'), 'anger-shield should be in STRATEGY_PATTERN_IDS');
  check(!(CORE_PATTERN_IDS as readonly string[]).includes('anger-shield'), 'anger-shield should not be in CORE_PATTERN_IDS');
}
check(asItems.filter(i => i.reverseScored).length === 1, `Expected 1 reverse-scored anger-shield item`);
const asRev = asItems.find(i => i.reverseScored);
check(asRev?.id === 'strategy-anger-shield-05', `Reverse-scored item should be -05, got ${asRev?.id}`);
n++;

/* ========== ANGER SHIELD WORDING ========== */

console.log(`${n}. Verifying Anger Shield wording...`);
const asTexts = [
  'When I feel hurt, I get angry instead of showing the hurt.',
  'I use irritation to end conversations that feel uncomfortable.',
  'I become defensive when someone gives me reasonable feedback.',
  'I treat ordinary disagreement as if it is a personal attack.',
  'I can express hurt without turning it into anger.',
  'During ordinary conflict, I blame others before considering what I contributed.',
  'I show anger when directly asking for reassurance or support feels difficult.',
  'I raise the emotional intensity of a conversation when I feel I am losing control of it.',
];
const actualAsTexts = asItems.map(i => i.text);
for (const exp of asTexts) {
  check(actualAsTexts.includes(exp), `Missing anger-shield text: "${exp}"`);
}
check(actualAsTexts.length === asTexts.length, `Anger Shield: expected ${asTexts.length} texts, got ${actualAsTexts.length}`);
n++;

/* ========== COVERAGE: ANGER SHIELD ========== */

console.log(`${n}. Verifying Anger Shield coverage...`);
const asCoverage = coverage['anger-shield'];
check(asCoverage.universalScreenerCount === 2, `Universal screeners: expected 2, got ${asCoverage.universalScreenerCount}`);
check(asCoverage.freeCount === 5, `Free: expected 5, got ${asCoverage.freeCount}`);
check(asCoverage.proOnlyCount === 3, `Pro-only: expected 3, got ${asCoverage.proOnlyCount}`);
check(asCoverage.totalProCount === 8, `Total Pro: expected 8, got ${asCoverage.totalProCount}`);
check(asCoverage.freeComplete === true, 'freeComplete should be true');
check(asCoverage.proComplete === true, 'proComplete should be true');
check(asCoverage.universalComplete === true, 'universalComplete should be true');
n++;

/* ========== REVERSE-SCORING ANGER-SHIELD-05 ========== */

console.log(`${n}. Testing strategy-anger-shield-05 reverse scoring...`);
const asRevItem = APPROVED_QUIZ_ITEMS.find(i => i.id === 'strategy-anger-shield-05')!;
check(scoreApprovedItemResponse(asRevItem, 1) === 5, 'anger-shield-05 rev 1->5');
check(scoreApprovedItemResponse(asRevItem, 2) === 4, 'anger-shield-05 rev 2->4');
check(scoreApprovedItemResponse(asRevItem, 3) === 3, 'anger-shield-05 rev 3->3');
check(scoreApprovedItemResponse(asRevItem, 4) === 2, 'anger-shield-05 rev 4->2');
check(scoreApprovedItemResponse(asRevItem, 5) === 1, 'anger-shield-05 rev 5->1');
n++;

/* ========== STRATEGY BANK COMPLETENESS ========== */

console.log(`${n}. Verifying strategy bank completeness...`);
const allStratIds = ['martyr', 'rescuer', 'over-responsible-one', 'overloaded-one', 'perfectionist', 'anger-shield'];
for (const sid of allStratIds) {
  const items = APPROVED_QUIZ_ITEMS.filter(i => i.patternId === sid);
  check(items.length === 8, `${sid} should have 8 items, got ${items.length}`);
  check(items.filter(i => i.access === 'free').length === 5, `${sid} should have 5 free items`);
  check(items.filter(i => i.access === 'pro').length === 3, `${sid} should have 3 pro-only items`);
  check(items.filter(i => i.strategyScreen === 'universal').length === 2, `${sid} should have 2 universal screeners`);
}
n++;

/* ========== MARTYR PRESERVATION ========== */

console.log(`${n}. Verifying Martyr preservation...`);
check(martyrItems.length === 8, 'Martyr should still have 8 items');
check(martyrItems.filter(i => i.strategyScreen === 'universal').length === 2, 'Martyr should still have 2 universal screeners');
check(martyrItems.filter(i => i.access === 'free').length === 5, 'Martyr should still have 5 free items');
check(martyrItems.filter(i => i.access === 'pro').length === 3, 'Martyr should still have 3 pro-only items');
check(martyrItems.filter(i => i.reverseScored).length === 1, 'Martyr should still have 1 reverse-scored item');
const martyrRevItem = APPROVED_QUIZ_ITEMS.find(i => i.id === 'strategy-martyr-05')!;
check(scoreApprovedItemResponse(martyrRevItem, 1) === 5, 'martyr-05 rev 1->5 (preserved)');
check(scoreApprovedItemResponse(martyrRevItem, 2) === 4, 'martyr-05 rev 2->4 (preserved)');
check(scoreApprovedItemResponse(martyrRevItem, 3) === 3, 'martyr-05 rev 3->3 (preserved)');
check(scoreApprovedItemResponse(martyrRevItem, 4) === 2, 'martyr-05 rev 4->2 (preserved)');
check(scoreApprovedItemResponse(martyrRevItem, 5) === 1, 'martyr-05 rev 5->1 (preserved)');
n++;

/* ========== RESCUER PRESERVATION ========== */

console.log(`${n}. Verifying Rescuer preservation...`);
check(rescuerItems.length === 8, 'Rescuer should still have 8 items');
check(rescuerItems.filter(i => i.strategyScreen === 'universal').length === 2, 'Rescuer should still have 2 universal screeners');
check(rescuerItems.filter(i => i.access === 'free').length === 5, 'Rescuer should still have 5 free items');
check(rescuerItems.filter(i => i.access === 'pro').length === 3, 'Rescuer should still have 3 pro-only items');
check(rescuerItems.filter(i => i.reverseScored).length === 1, 'Rescuer should still have 1 reverse-scored item');
check(scoreApprovedItemResponse(rescuerRevItem, 1) === 5, 'rescuer-05 rev 1->5 (preserved)');
check(scoreApprovedItemResponse(rescuerRevItem, 2) === 4, 'rescuer-05 rev 2->4 (preserved)');
check(scoreApprovedItemResponse(rescuerRevItem, 3) === 3, 'rescuer-05 rev 3->3 (preserved)');
check(scoreApprovedItemResponse(rescuerRevItem, 4) === 2, 'rescuer-05 rev 4->2 (preserved)');
check(scoreApprovedItemResponse(rescuerRevItem, 5) === 1, 'rescuer-05 rev 5->1 (preserved)');
n++;

/* ========== AUDIT DECISION RECORD ==========
 *
 * 2026-07-29 — Cross-strategy content audit final decisions:
 *   47 KEEP   (all 42 non-revised strategy items + rescuer-05 retained)
 *    1 REVISE (strategy-martyr-05)
 *    0 MOVE
 *    0 DROP
 *
 * Revised item:   strategy-martyr-05
 *   OLD: "I give what I can and stop when I am running low."
 *   NEW: "I set limits on what I give before it begins to wear me down."
 *
 * strategy-rescuer-05 retained unchanged:
 *   "I can support someone without protecting them from the results of their own decisions."
 *
 * All 12 universal screeners retained.
 * Thematic overlap among martyr, over-responsible-one, and overloaded-one
 * is intentional but should be re-evaluated after live data collection.
 */

console.log(`\n=== QUESTION VALIDATION RESULTS ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (errors.length > 0) {
  console.log(`\nFailures:`);
  errors.forEach(e => console.log(`  ❌ ${e}`));
  process.exit(1);
} else {
  console.log(`\n✅ ALL ${passed} CHECKS PASSED`);
}
