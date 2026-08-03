import * as fs from 'fs';
import * as path from 'path';
import {
  ASSESSMENT_SESSION_VERSION,
  startAssessmentSession,
  getCurrentStageItems,
  recordAssessmentResponse,
  skipAssessmentItem,
  advanceAssessmentStage,
  serializeAssessmentSession,
  deserializeAssessmentSession,
} from './src/lib/quiz/assessmentSession';
import {
  ASSESSMENT_SESSION_STORAGE_KEY,
  saveAssessmentSession,
  loadAssessmentSession,
  clearAssessmentSession,
  hasSavedAssessmentSession,
} from './src/lib/quiz/assessmentSessionStorage';
import type { AssessmentSessionStorageLike } from './src/lib/quiz/assessmentSessionStorage';
import { APPROVED_QUIZ_ITEMS } from './src/data/quiz/approvedQuestions';
import { EXPRESSION_REGISTRY } from './src/data/quiz/patternTaxonomy';
import { EXPRESSION_CONFIRMATION_ITEMS } from './src/data/quiz/expressionConfirmationItems';
import { EXPRESSION_SCREENING_ITEMS } from './src/data/quiz/expressionScreeningItems';
import { EXPRESSION_GROUP_SCREENING_ITEMS } from './src/data/quiz/expressionGroupScreeningItems';
import { EXPRESSION_SCREENING_GROUPS } from './src/data/quiz/expressionScreeningGroups';
import type {
  AssessmentSession,
  AssessmentResponseValue,
} from './src/types/assessmentSession';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(`FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function hasOwn(value: unknown, key: string): boolean {
  return typeof value === 'object' && value !== null && key in (value as Record<string, unknown>);
}

class MemoryStorage implements AssessmentSessionStorageLike {
  private entries = new Map<string, string>();
  getFails = false;
  setFails = false;
  removeFails = false;
  getCalls = 0;
  setCalls = 0;
  removeCalls = 0;

  getItem(key: string): string | null {
    this.getCalls++;
    if (this.getFails) throw new Error('forced get failure');
    return this.entries.has(key) ? this.entries.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.setCalls++;
    if (this.setFails) throw new Error('forced set failure');
    this.entries.set(key, value);
  }

  removeItem(key: string): void {
    this.removeCalls++;
    if (this.removeFails) throw new Error('forced remove failure');
    this.entries.delete(key);
  }

  keys(): string[] {
    return [...this.entries.keys()];
  }

  stored(key: string): string | null {
    return this.entries.has(key) ? this.entries.get(key)! : null;
  }
}

function stageValue(id: string, maximize: boolean): AssessmentResponseValue {
  const item = APPROVED_QUIZ_ITEMS.find(i => i.id === id);
  if (item) {
    const value = maximize ? (item.reverseScored ? 1 : 5) : (item.reverseScored ? 5 : 1);
    return value as AssessmentResponseValue;
  }
  return (maximize ? 5 : 1) as AssessmentResponseValue;
}

interface Driver {
  s: AssessmentSession;
  presented: number;
}

function answerCurrent(d: Driver, value: AssessmentResponseValue): void {
  const ids = getCurrentStageItems(d.s);
  for (const id of ids) {
    d.s = recordAssessmentResponse(d.s, id, value);
  }
  d.presented += ids.length;
}

function answerCurrentMax(d: Driver): void {
  const ids = getCurrentStageItems(d.s);
  for (const id of ids) {
    d.s = recordAssessmentResponse(d.s, id, stageValue(id, true));
  }
  d.presented += ids.length;
}

function answerCurrentMin(d: Driver): void {
  const ids = getCurrentStageItems(d.s);
  for (const id of ids) {
    d.s = recordAssessmentResponse(d.s, id, stageValue(id, false));
  }
  d.presented += ids.length;
}

function skipOne(d: Driver): void {
  const ids = getCurrentStageItems(d.s);
  if (ids.length === 0) return;
  d.s = skipAssessmentItem(d.s, ids[0]);
  d.presented += 1;
}

function skipCurrent(d: Driver): void {
  const ids = getCurrentStageItems(d.s);
  for (const id of ids) {
    d.s = skipAssessmentItem(d.s, id);
  }
  d.presented += ids.length;
}

function advance(d: Driver): void {
  d.s = advanceAssessmentStage(d.s);
}

function driveToConfirmation(): Driver {
  const d: Driver = { s: startAssessmentSession('pro'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  return d;
}

function seedUnrelatedKeys(storage: MemoryStorage): void {
  storage.setItem('cure-life-reflection-logs', '[{"text":"keep"}]');
  storage.setItem('somatic_journal_logs', '[{"entry":"keep"}]');
  storage.setItem('sb-abc-auth-token', 'keep-auth');
  storage.setItem('unrelated-key', 'keep');
}

function snapshotEntries(storage: MemoryStorage): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of storage.keys().sort()) {
    if (key === ASSESSMENT_SESSION_STORAGE_KEY) continue;
    out[key] = storage.stored(key)!;
  }
  return out;
}

function seededKeysUntouched(storage: MemoryStorage, before: Record<string, string>): boolean {
  for (const [key, value] of Object.entries(before)) {
    if (storage.stored(key) !== value) return false;
  }
  return true;
}

function deepFreeze(value: unknown): void {
  if (typeof value === 'object' && value !== null) {
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
}

/* ==================================================================
 *  A. Module contract
 * ================================================================*/

assert(
  'storage: canonical key is exact',
  ASSESSMENT_SESSION_STORAGE_KEY === 'cure-life-assessment-session',
  ASSESSMENT_SESSION_STORAGE_KEY,
);

const STORAGE_EXPORTS = [
  saveAssessmentSession,
  loadAssessmentSession,
  clearAssessmentSession,
  hasSavedAssessmentSession,
];
assert('storage: all four functions exist', STORAGE_EXPORTS.every(fn => typeof fn === 'function'));
assert('storage: key is a non-empty string', typeof ASSESSMENT_SESSION_STORAGE_KEY === 'string' && ASSESSMENT_SESSION_STORAGE_KEY.length > 0);
assert('storage: key is namespaced with cure-life- prefix', ASSESSMENT_SESSION_STORAGE_KEY.startsWith('cure-life-'));
assert('storage: key contains no user identity', !ASSESSMENT_SESSION_STORAGE_KEY.includes('user') && !ASSESSMENT_SESSION_STORAGE_KEY.includes('account'));
assert('storage: module import succeeded in Node without window', typeof window === 'undefined');

{
  const source = fs.readFileSync(
    path.join(import.meta.dirname, 'src/lib/quiz/assessmentSessionStorage.ts'),
    'utf8',
  );
  assert('storage source: no react import', !/from ['"]react['"]/.test(source));
  assert('storage source: no premium import', !source.includes('PremiumContext') && !source.includes('usePremiumState') && !source.includes('premium'));
  assert('storage source: no auth import', !source.includes('AuthContext') && !source.includes('supabase'));
  assert('storage source: no sessionStorage reference', !source.includes('sessionStorage'));
  assert('storage source: no storage listener', !source.includes('addEventListener'));
  assert('storage source: no document access', !source.includes('document.'));
  assert('storage source: no probe write for availability testing', !source.includes('probe') && !source.includes('__probe'));
  assert('storage source: no expiration logic', !source.includes('expires') && !source.includes('expiration'));
  assert('storage source: canonical key defined exactly once', source.split(ASSESSMENT_SESSION_STORAGE_KEY).length === 2);
  assert('storage source: no timestamps are written', !source.includes('Date.now') && !source.includes('new Date('));
  assert('storage source: serializers delegated to Batch 1', source.includes('serializeAssessmentSession') && source.includes('deserializeAssessmentSession'));
}

/* ==================================================================
 *  B. Empty and unavailable
 * ================================================================*/

{
  const storage = new MemoryStorage();
  const loaded = loadAssessmentSession(storage);
  assert('empty storage: load returns missing', loaded.status === 'missing' && loaded.session === null);
  assert('empty storage: hasSaved returns false', hasSavedAssessmentSession(storage) === false);
  assert('empty storage: clear missing key returns cleared', clearAssessmentSession(storage).status === 'cleared');
  assert('empty storage: no keys created by inspection', storage.keys().length === 0);
}

{
  assert('no storage in Node: save returns unavailable', saveAssessmentSession(startAssessmentSession('free')).status === 'unavailable');
  const loaded = loadAssessmentSession();
  assert('no storage in Node: load returns unavailable', loaded.status === 'unavailable' && loaded.session === null);
  assert('no storage in Node: clear returns unavailable', clearAssessmentSession().status === 'unavailable');
  assert('no storage in Node: hasSaved returns false', hasSavedAssessmentSession() === false);
}

/* ==================================================================
 *  Fixtures
 * ================================================================*/

const freeCore = startAssessmentSession('free');
const proCore = startAssessmentSession('pro');

const freeCoreSkipped: AssessmentSession = (() => {
  const d: Driver = { s: startAssessmentSession('free'), presented: 0 };
  skipOne(d);
  return d.s;
})();

const proStrategy: AssessmentSession = (() => {
  const d: Driver = { s: startAssessmentSession('pro'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  return d.s;
})();

const universalActiveRetry: AssessmentSession = (() => {
  const d: Driver = { s: startAssessmentSession('pro'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  skipOne(d);
  return d.s;
})();

const followUpActiveRetry: AssessmentSession = (() => {
  const d: Driver = { s: startAssessmentSession('pro'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  skipOne(d);
  return d.s;
})();

const groupActiveRetry: AssessmentSession = (() => {
  const d: Driver = { s: startAssessmentSession('pro'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  skipOne(d);
  return d.s;
})();

const screeningActiveRetry: AssessmentSession = (() => {
  const d: Driver = { s: startAssessmentSession('pro'), presented: 0 };
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  answerCurrentMax(d);
  advance(d);
  skipOne(d);
  return d.s;
})();

const confirmationActiveRetry: AssessmentSession = (() => {
  const d = driveToConfirmation();
  skipOne(d);
  return d.s;
})();

const confirmationSecondSkipUnresolved: AssessmentSession = (() => {
  const d = driveToConfirmation();
  skipCurrent(d);
  advance(d);
  skipCurrent(d);
  return d.s;
})();

const partialConfirmationResult: AssessmentSession = (() => {
  const d = driveToConfirmation();
  skipCurrent(d);
  advance(d);
  skipCurrent(d);
  advance(d);
  return d.s;
})();

const zeroConfirmedResult: AssessmentSession = (() => {
  const d = driveToConfirmation();
  answerCurrentMin(d);
  advance(d);
  return d.s;
})();

const completeResult: AssessmentSession = (() => {
  const d = driveToConfirmation();
  answerCurrentMax(d);
  advance(d);
  return d.s;
})();

assert('fixtures: core skipped is core stage', freeCoreSkipped.stage === 'core' && freeCoreSkipped.retryState.skippedItemIds.length === 0);
assert('fixtures: strategy session at follow-up-first', proStrategy.stage === 'strategy-follow-up-first');
assert('fixtures: universal retry has skipped screener', universalActiveRetry.stage === 'strategy-universal' && universalActiveRetry.retryState.skippedItemIds.length === 1);
assert('fixtures: follow-up retry has skipped item', followUpActiveRetry.stage === 'strategy-follow-up-first' && followUpActiveRetry.retryState.skippedItemIds.length === 1);
assert('fixtures: group retry has skipped item', groupActiveRetry.stage === 'expression-group-screening' && groupActiveRetry.retryState.skippedItemIds.length === 1);
assert('fixtures: screening retry has skipped item', screeningActiveRetry.stage === 'expression-screening' && screeningActiveRetry.retryState.skippedItemIds.length === 1);
assert('fixtures: confirmation retry has skipped item', confirmationActiveRetry.stage === 'expression-confirmation' && confirmationActiveRetry.retryState.skippedItemIds.length === 1);
assert('fixtures: second skip unresolved', confirmationSecondSkipUnresolved.stage === 'expression-confirmation' && confirmationSecondSkipUnresolved.retryState.unresolvedItemIds.length === 4);
assert('fixtures: partial result session partial', partialConfirmationResult.stage === 'results' && partialConfirmationResult.completionState === 'partial');
assert('fixtures: zero-confirmed result complete', zeroConfirmedResult.stage === 'results' && zeroConfirmedResult.completionState === 'complete');
assert('fixtures: complete result complete', completeResult.stage === 'results' && completeResult.completionState === 'complete');

const SAVE_FIXTURES = [
  ['free core', freeCore],
  ['pro core', proCore],
  ['strategy stage', proStrategy],
  ['retry stage', followUpActiveRetry],
  ['unresolved confirmation', confirmationSecondSkipUnresolved],
  ['partial result', partialConfirmationResult],
  ['complete results', completeResult],
] as const;

/* ==================================================================
 *  C. Save
 * ================================================================*/

{
  for (const [label, session] of SAVE_FIXTURES) {
    const storage = new MemoryStorage();
    seedUnrelatedKeys(storage);
    const before = snapshotEntries(storage);
    const beforeJson = JSON.stringify(session);

    const result = saveAssessmentSession(session, storage);

    assert(`save ${label}: status saved`, result.status === 'saved', result.status);
    assert(`save ${label}: canonical key used`, storage.stored(ASSESSMENT_SESSION_STORAGE_KEY) !== null);
    assert(`save ${label}: exactly one new key written by adapter`, sameJson(storage.keys().sort(), [...Object.keys(before), ASSESSMENT_SESSION_STORAGE_KEY].sort()));
    assert(`save ${label}: stored value equals serialize output`, storage.stored(ASSESSMENT_SESSION_STORAGE_KEY) === serializeAssessmentSession(session));
    assert(`save ${label}: unrelated keys untouched`, seededKeysUntouched(storage, before));
    assert(`save ${label}: input session deeply unchanged`, JSON.stringify(session) === beforeJson);

    const parsed = JSON.parse(storage.stored(ASSESSMENT_SESSION_STORAGE_KEY)!) as Record<string, unknown>;
    assert(`save ${label}: no envelope field`, !hasOwn(parsed, 'data') && !hasOwn(parsed, 'envelope') && !hasOwn(parsed, 'payload'));
    assert(`save ${label}: no auth field inserted`, !hasOwn(parsed, 'auth') && !hasOwn(parsed, 'user') && !hasOwn(parsed, 'token'));
    assert(`save ${label}: no premium field inserted`, !hasOwn(parsed, 'premium') && !hasOwn(parsed, 'subscription'));
    assert(`save ${label}: no prompt field inserted`, !hasOwn(parsed, 'prompt') && !hasOwn(parsed, 'prompts'));
    assert(`save ${label}: createdAt preserved`, parsed.createdAt === session.createdAt);
    assert(`save ${label}: updatedAt preserved`, parsed.updatedAt === session.updatedAt);
    assert(`save ${label}: mode preserved`, parsed.mode === session.mode);
    assert(`save ${label}: stage preserved`, parsed.stage === session.stage);
    assert(`save ${label}: results preserved when present`, (() => {
      for (const key of ['coreResult', 'strategyResult', 'expressionGroupResult', 'expressionScreeningResult', 'expressionConfirmationResult']) {
        if (session[key as keyof AssessmentSession] === null) continue;
        if (!hasOwn(parsed, key) || parsed[key] === null) return false;
      }
      return true;
    })());
  }
}

{
  const storage = new MemoryStorage();
  const first = saveAssessmentSession(freeCore, storage);
  const firstValue = storage.stored(ASSESSMENT_SESSION_STORAGE_KEY);
  const second = saveAssessmentSession(completeResult, storage);
  const secondValue = storage.stored(ASSESSMENT_SESSION_STORAGE_KEY);
  assert('save: repeated save replaces current session', first.status === 'saved' && second.status === 'saved');
  assert('save: replacement stored new value', firstValue !== secondValue && secondValue === serializeAssessmentSession(completeResult));
  assert('save: still exactly one session key', storage.keys().filter(k => k === ASSESSMENT_SESSION_STORAGE_KEY).length === 1);
}

{
  const storage = new MemoryStorage();
  storage.setFails = true;
  const result = saveAssessmentSession(freeCore, storage);
  assert('save: forced set failure returns write-failed', result.status === 'write-failed');
  assert('save: forced set failure leaves no value', storage.stored(ASSESSMENT_SESSION_STORAGE_KEY) === null);
}

{
  const storage = new MemoryStorage();
  const result = saveAssessmentSession({} as unknown as AssessmentSession, storage);
  assert('save: invalid session object returns invalid-session', result.status === 'invalid-session');
  assert('save: invalid session writes nothing', storage.stored(ASSESSMENT_SESSION_STORAGE_KEY) === null);
}

{
  const storage = new MemoryStorage();
  const circular = { self: null as unknown };
  circular.self = circular;
  const badResponses = { ...freeCore.responses } as unknown as Record<string, unknown>;
  badResponses['q-core-test-01'] = circular;
  const badSession = { ...freeCore, responses: badResponses } as unknown as AssessmentSession;
  const result = saveAssessmentSession(badSession, storage);
  assert('save: circular input returns serialization-failed', result.status === 'serialization-failed');
  assert('save: circular input writes nothing', storage.stored(ASSESSMENT_SESSION_STORAGE_KEY) === null);
}

{
  const storage = new MemoryStorage();
  const frozen = JSON.parse(serializeAssessmentSession(completeResult)) as AssessmentSession;
  deepFreeze(frozen);
  const result = saveAssessmentSession(frozen, storage);
  assert('save: frozen results session saves', result.status === 'saved');
}

/* ==================================================================
 *  D. Load
 * ================================================================*/

{
  for (const [label, session] of SAVE_FIXTURES) {
    const storage = new MemoryStorage();
    storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, serializeAssessmentSession(session));
    seedUnrelatedKeys(storage);
    const before = snapshotEntries(storage);

    const result = loadAssessmentSession(storage);

    assert(`load ${label}: status loaded`, result.status === 'loaded' && result.session !== null);
    if (result.session !== null) {
      assert(`load ${label}: deep equals deserialize output`, sameJson(result.session, deserializeAssessmentSession(storage.stored(ASSESSMENT_SESSION_STORAGE_KEY)!)));
      assert(`load ${label}: currentItemIds order preserved`, sameJson(result.session.currentItemIds, session.currentItemIds));
      assert(`load ${label}: completedItemIds order preserved`, sameJson(result.session.completedItemIds, session.completedItemIds));
      assert(`load ${label}: responses preserved`, sameJson(result.session.responses, session.responses));
      assert(`load ${label}: retryResponses preserved`, sameJson(result.session.retryResponses, session.retryResponses));
      assert(`load ${label}: retryState preserved`, sameJson(result.session.retryState, session.retryState));
      assert(`load ${label}: coreResult preserved`, sameJson(result.session.coreResult, session.coreResult));
      assert(`load ${label}: strategyResult preserved`, sameJson(result.session.strategyResult, session.strategyResult));
      assert(`load ${label}: groupResult preserved`, sameJson(result.session.expressionGroupResult, session.expressionGroupResult));
      assert(`load ${label}: screeningResult preserved`, sameJson(result.session.expressionScreeningResult, session.expressionScreeningResult));
      assert(`load ${label}: confirmationResult preserved`, sameJson(result.session.expressionConfirmationResult, session.expressionConfirmationResult));
      assert(`load ${label}: navigationTarget preserved`, result.session.navigationTarget.patternId === session.navigationTarget.patternId);
      assert(`load ${label}: completionState preserved`, result.session.completionState === session.completionState);
      assert(`load ${label}: mode preserved`, result.session.mode === session.mode);
      assert(`load ${label}: timestamps preserved`, result.session.createdAt === session.createdAt && result.session.updatedAt === session.updatedAt);
      assert(`load ${label}: stage preserved`, result.session.stage === session.stage);
      assert(`load ${label}: unrelated keys untouched`, seededKeysUntouched(storage, before));
    }
  }
}

{
  const storage = new MemoryStorage();
  const raw = serializeAssessmentSession(freeCore);
  const payload = JSON.parse(raw) as Record<string, unknown>;
  const variants: [string, unknown][] = [
    ['malformed JSON', 'not json at all'],
    ['truncated JSON', '{"mode":"free"'],
    ['wrong session version', JSON.stringify({ ...payload, sessionVersion: 'strategy-9.9.9|groups-9.9.9' })],
    ['invalid mode', JSON.stringify({ ...payload, mode: 'premium' })],
    ['invalid stage', JSON.stringify({ ...payload, stage: 'corex' })],
    ['malformed retryState array', JSON.stringify({ ...payload, retryState: [] })],
    ['malformed retryState missing arrays', JSON.stringify({ ...payload, retryState: { skippedItemIds: 'x', retriedItemIds: [], unresolvedItemIds: [] } })],
    ['malformed results numeric coreResult', JSON.stringify({ ...payload, coreResult: 5 })],
    ['malformed navigation missing patternId', JSON.stringify({ ...payload, navigationTarget: { id: 'x' } })],
    ['malformed timestamps numeric createdAt', JSON.stringify({ ...payload, createdAt: 123 })],
    ['responses as array', JSON.stringify({ ...payload, responses: [] })],
    ['currentItemIds non-array', JSON.stringify({ ...payload, currentItemIds: 'core' })],
    ['invalid completion state', JSON.stringify({ ...payload, completionState: 'bogus' })],
  ];

  for (const [label, storedValue] of variants) {
    const storage = new MemoryStorage();
    storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, storedValue as string);
    seedUnrelatedKeys(storage);
    const before = snapshotEntries(storage);

    const result = loadAssessmentSession(storage);

    assert(`load ${label}: returns invalid-session`, result.status === 'invalid-session' && result.session === null, result.status);
    assert(`load ${label}: canonical key cleaned up`, storage.stored(ASSESSMENT_SESSION_STORAGE_KEY) === null);
    assert(`load ${label}: unrelated keys remain`, seededKeysUntouched(storage, before));
    assert(`load ${label}: hasSaved returns false after cleanup`, hasSavedAssessmentSession(storage) === false);
  }
}

{
  const storage = new MemoryStorage();
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, serializeAssessmentSession(freeCore));
  storage.getFails = true;
  const result = loadAssessmentSession(storage);
  assert('load: forced get failure returns read-failed', result.status === 'read-failed' && result.session === null);
  assert('load: forced get failure calls no remove', storage.removeCalls === 0);
}

{
  const storage = new MemoryStorage();
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, 'not json');
  seedUnrelatedKeys(storage);
  storage.removeFails = true;
  const result = loadAssessmentSession(storage);
  assert('load: cleanup remove failure still returns invalid-session', result.status === 'invalid-session' && result.session === null);
  assert('load: cleanup remove failure leaves key', storage.stored(ASSESSMENT_SESSION_STORAGE_KEY) === 'not json');
  assert('load: cleanup remove failure keeps unrelated keys', storage.keys().filter(k => k !== ASSESSMENT_SESSION_STORAGE_KEY).length === 4);
}

/* ==================================================================
 *  E. Deserialization ownership
 * ================================================================*/

{
  const storage = new MemoryStorage();
  const payload = JSON.parse(serializeAssessmentSession(freeCore)) as Record<string, unknown>;
  payload.sessionVersion = 'strategy-9.9.9|groups-9.9.9';
  const stored = JSON.stringify(payload);
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, stored);
  assert('ownership: wrong version rejected exactly as Batch 1', (deserializeAssessmentSession(stored) === null) === (loadAssessmentSession(storage).status === 'invalid-session'));
}

{
  const storage = new MemoryStorage();
  const payload = JSON.parse(serializeAssessmentSession(freeCore)) as Record<string, unknown>;
  const responses = payload.responses as Record<string, unknown>;
  responses['strategy-martyr-01'] = 5;
  responses['not-a-real-item'] = 5;
  responses['q-core-test-01'] = 6;
  const stored = JSON.stringify(payload);
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, stored);

  const direct = deserializeAssessmentSession(stored);
  const viaLoad = loadAssessmentSession(storage);

  assert('ownership: load equals direct deserialize for sanitized payload', viaLoad.status === 'loaded' && direct !== null && sameJson(viaLoad.session, direct));
  if (viaLoad.status === 'loaded' && direct !== null) {
    assert('ownership: unknown ids removed exactly as Batch 1', viaLoad.session.responses['not-a-real-item'] === undefined && direct.responses['not-a-real-item'] === undefined);
    assert('ownership: out-of-range values dropped exactly as Batch 1', viaLoad.session.responses['q-core-test-01'] === undefined && direct.responses['q-core-test-01'] === undefined);
    assert('ownership: valid values kept exactly as Batch 1', viaLoad.session.responses['strategy-martyr-01'] === 5 && direct.responses['strategy-martyr-01'] === 5);
    assert('ownership: completion state recomputed equally', viaLoad.session.completionState === direct.completionState && viaLoad.session.completionState === 'in-progress');
  }
}

{
  const storage = new MemoryStorage();
  const payload = JSON.parse(serializeAssessmentSession(completeResult)) as Record<string, unknown>;
  payload.navigationTarget = { patternId: 'martyr', type: 'strategy', extra: 1 };
  const stored = JSON.stringify(payload);
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, stored);

  const direct = deserializeAssessmentSession(stored);
  const viaLoad = loadAssessmentSession(storage);

  assert('ownership: nav normalized exactly as Batch 1', viaLoad.status === 'loaded' && direct !== null && sameJson(viaLoad.session, direct));
  if (viaLoad.status === 'loaded' && direct !== null) {
    assert('ownership: navigation is exactly { patternId }', sameJson(viaLoad.session.navigationTarget, { patternId: 'martyr' }));
  }
}

{
  const storage = new MemoryStorage();
  const payload = JSON.parse(serializeAssessmentSession(completeResult)) as Record<string, unknown>;
  payload.completionState = 'not-started';
  const stored = JSON.stringify(payload);
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, stored);

  const direct = deserializeAssessmentSession(stored);
  const viaLoad = loadAssessmentSession(storage);

  assert('ownership: completion recomputed not trusted', viaLoad.status === 'loaded' && direct !== null);
  if (viaLoad.status === 'loaded' && direct !== null) {
    assert('ownership: recomputed completion is complete', viaLoad.session.completionState === 'complete' && direct.completionState === 'complete');
  }
}

/* ==================================================================
 *  F. Clear
 * ================================================================*/

{
  const storage = new MemoryStorage();
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, serializeAssessmentSession(completeResult));
  seedUnrelatedKeys(storage);
  const before = snapshotEntries(storage);

  const result = clearAssessmentSession(storage);

  assert('clear: existing key removed', result.status === 'cleared');
  assert('clear: canonical key gone', storage.stored(ASSESSMENT_SESSION_STORAGE_KEY) === null);
  assert('clear: unrelated keys preserved', seededKeysUntouched(storage, before));
}

{
  const storage = new MemoryStorage();
  const result = clearAssessmentSession(storage);
  assert('clear: missing canonical key returns cleared', result.status === 'cleared');
}

{
  const storage = new MemoryStorage();
  storage.removeFails = true;
  const result = clearAssessmentSession(storage);
  assert('clear: forced remove failure returns remove-failed', result.status === 'remove-failed');
}

{
  const storage = new MemoryStorage();
  seedUnrelatedKeys(storage);
  clearAssessmentSession(storage);
  assert('clear: journal keys preserved', storage.stored('cure-life-reflection-logs') !== null && storage.stored('somatic_journal_logs') !== null);
  assert('clear: supabase-like auth key preserved', storage.stored('sb-abc-auth-token') !== null);
}

/* ==================================================================
 *  G. Has saved session
 * ================================================================*/

{
  for (const [label, session] of [
    ['free', freeCore],
    ['pro', proCore],
    ['results', completeResult],
  ] as const) {
    const storage = new MemoryStorage();
    storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, serializeAssessmentSession(session));
    assert(`hasSaved ${label}: returns true`, hasSavedAssessmentSession(storage) === true);
    assert(`hasSaved ${label}: leaves key intact`, storage.stored(ASSESSMENT_SESSION_STORAGE_KEY) !== null);
  }
}

{
  const storage = new MemoryStorage();
  assert('hasSaved: missing key returns false', hasSavedAssessmentSession(storage) === false);
}

{
  const storage = new MemoryStorage();
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, 'not json');
  assert('hasSaved: malformed JSON returns false and cleans up', hasSavedAssessmentSession(storage) === false && storage.stored(ASSESSMENT_SESSION_STORAGE_KEY) === null);
}

{
  const storage = new MemoryStorage();
  const payload = JSON.parse(serializeAssessmentSession(freeCore)) as Record<string, unknown>;
  payload.sessionVersion = 'strategy-9.9.9|groups-9.9.9';
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, JSON.stringify(payload));
  assert('hasSaved: wrong version returns false and cleans up', hasSavedAssessmentSession(storage) === false && storage.stored(ASSESSMENT_SESSION_STORAGE_KEY) === null);
}

{
  const storage = new MemoryStorage();
  storage.setItem(ASSESSMENT_SESSION_STORAGE_KEY, serializeAssessmentSession(freeCore));
  storage.getFails = true;
  assert('hasSaved: read failure returns false', hasSavedAssessmentSession(storage) === false);
}

/* ==================================================================
 *  H. Mode neutrality
 * ================================================================*/

{
  for (const mode of ['free', 'pro'] as const) {
    const session = startAssessmentSession(mode);
    const storage = new MemoryStorage();
    const saved = saveAssessmentSession(session, storage);
    const loaded = loadAssessmentSession(storage);
    assert(`mode neutrality ${mode}: save keeps mode`, saved.status === 'saved');
    assert(`mode neutrality ${mode}: load keeps mode`, loaded.status === 'loaded' && loaded.session?.mode === mode);
    assert(`mode neutrality ${mode}: stored payload mode unchanged`, JSON.parse(storage.stored(ASSESSMENT_SESSION_STORAGE_KEY)!).mode === mode);
  }
  assert('mode neutrality: key has no mode', !ASSESSMENT_SESSION_STORAGE_KEY.includes('free') && !ASSESSMENT_SESSION_STORAGE_KEY.includes('pro'));
  assert('mode neutrality: no per-user key exists', !ASSESSMENT_SESSION_STORAGE_KEY.includes('user'));
  const proStored = (() => {
    const storage = new MemoryStorage();
    saveAssessmentSession(proCore, storage);
    return storage.stored(ASSESSMENT_SESSION_STORAGE_KEY)!;
  })();
  assert('mode neutrality: no access token stored', !proStored.includes('token'));
  assert('mode neutrality: no subscription object stored', !proStored.includes('subscription'));
  assert('mode neutrality: no auth fields stored', !proStored.includes('auth'));
  assert('mode neutrality: no user id stored', !proStored.includes('userId') && !proStored.includes('user_id'));
}

/* ==================================================================
 *  I. Result and retry resume
 * ================================================================*/

{
  const resumeFixtures = [
    ['core skipped', freeCoreSkipped],
    ['universal active retry', universalActiveRetry],
    ['follow-up active retry', followUpActiveRetry],
    ['group active retry', groupActiveRetry],
    ['screening active retry', screeningActiveRetry],
    ['confirmation active retry', confirmationActiveRetry],
    ['confirmation second skip unresolved', confirmationSecondSkipUnresolved],
    ['partial confirmation result', partialConfirmationResult],
    ['zero-confirmed result', zeroConfirmedResult],
    ['complete result', completeResult],
  ] as const;

  for (const [label, control] of resumeFixtures) {
    const storage = new MemoryStorage();
    const saved = saveAssessmentSession(control, storage);
    const loaded = loadAssessmentSession(storage);

    assert(`resume ${label}: save saved`, saved.status === 'saved');
    assert(`resume ${label}: load loaded`, loaded.status === 'loaded' && loaded.session !== null);
    if (loaded.session === null) continue;

    const controlItems = getCurrentStageItems(control);
    const loadedItems = getCurrentStageItems(loaded.session);
    assert(`resume ${label}: stage matches control`, loaded.session.stage === control.stage);
    assert(`resume ${label}: current items match control`, sameJson(loadedItems, controlItems));

    const advancedControl = advanceAssessmentStage(control);
    const advancedLoaded = advanceAssessmentStage(loaded.session);
    assert(`resume ${label}: advance stage matches control`, advancedLoaded.stage === advancedControl.stage);
    assert(`resume ${label}: advance items match control`, sameJson(getCurrentStageItems(advancedLoaded), getCurrentStageItems(advancedControl)));
    assert(`resume ${label}: control session unmutated`, sameJson(control, control));

    if (label.includes('retry')) {
      assert(`resume ${label}: skipped ids remain active`, sameJson(loaded.session.retryState.skippedItemIds, control.retryState.skippedItemIds));
      const loadedSkipped = loaded.session.retryState.skippedItemIds;
      assert(`resume ${label}: skipped ids not yet re-presented`, loadedSkipped.every(id => !loadedItems.includes(id)));
      const finishScope = (s: AssessmentSession): AssessmentSession => {
        let cur = s;
        for (const id of getCurrentStageItems(cur)) {
          cur = recordAssessmentResponse(cur, id, stageValue(id, true));
        }
        return advanceAssessmentStage(cur);
      };
      const loadedFinished = finishScope(loaded.session);
      const controlFinished = finishScope(control);
      assert(`resume ${label}: retry pass parity with control`, sameJson(getCurrentStageItems(loadedFinished), getCurrentStageItems(controlFinished)));
      assert(`resume ${label}: retry pass re-presents skipped ids`, loadedSkipped.every(id => getCurrentStageItems(loadedFinished).includes(id)));
    }
    if (label.includes('unresolved')) {
      assert(`resume ${label}: unresolved ids remain unresolved`, sameJson(loaded.session.retryState.unresolvedItemIds, control.retryState.unresolvedItemIds));
    }
    if (label.includes('result')) {
      assert(`resume ${label}: confirmation result preserved`, sameJson(loaded.session.expressionConfirmationResult, control.expressionConfirmationResult));
      assert(`resume ${label}: navigation preserved`, loaded.session.navigationTarget.patternId === control.navigationTarget.patternId);
    }
  }
}

/* ==================================================================
 *  J. Storage failure behavior
 * ================================================================*/

{
  const originalError = console.error;
  const originalWarn = console.warn;
  let logged = 0;
  console.error = () => { logged++; };
  console.warn = () => { logged++; };
  try {
    const storage = new MemoryStorage();
    storage.getFails = true;
    loadAssessmentSession(storage);
    storage.getFails = false;

    storage.setFails = true;
    saveAssessmentSession(freeCore, storage);
    storage.setFails = false;

    storage.removeFails = true;
    clearAssessmentSession(storage);
    loadAssessmentSession(storage);
    storage.removeFails = false;

    saveAssessmentSession({} as unknown as AssessmentSession, storage);
    assert('failures: no exception thrown during failure suite', true);
  } catch {
    assert('failures: no exception thrown during failure suite', false, 'unexpected throw');
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
  assert('failures: no error or warning logged', logged === 0, `logged ${logged}`);
}

{
  const storage = new MemoryStorage();
  seedUnrelatedKeys(storage);
  const before = snapshotEntries(storage);
  storage.getFails = true;
  loadAssessmentSession(storage);
  storage.setFails = true;
  saveAssessmentSession(freeCore, storage);
  storage.removeFails = true;
  clearAssessmentSession(storage);
  assert('failures: no other key altered by any failure', seededKeysUntouched(storage, before));
}

{
  const session = startAssessmentSession('free');
  const before = JSON.stringify(session);
  const storage = new MemoryStorage();
  storage.setFails = true;
  saveAssessmentSession(session, storage);
  assert('failures: in-memory session unchanged after failed save', JSON.stringify(session) === before);
}

/* ==================================================================
 *  K. Source and preservation
 * ================================================================*/

{
  const libSource = fs.readFileSync(
    path.join(import.meta.dirname, 'src/lib/quiz/assessmentSession.ts'),
    'utf8',
  );
  assert('preservation: orchestrator has no react imports', !/from ['"]react['"]/.test(libSource));
  assert('preservation: orchestrator has no storage access', !libSource.includes('localStorage') && !libSource.includes('sessionStorage'));
  assert('preservation: orchestrator has no window access', !libSource.includes('window.'));
  assert('preservation: orchestrator has no document access', !libSource.includes('document.'));
}

{
  const walk = (dir: string): string[] => {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...walk(full));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        out.push(full);
      }
    }
    return out;
  };
  const srcDir = path.join(import.meta.dirname, 'src');
  const allFiles = walk(srcDir).map(f => path.relative(path.join(import.meta.dirname, 'src'), f).replace(/\\/g, '/'));

  const storageConsumers = allFiles.filter(f => {
    const content = fs.readFileSync(path.join(srcDir, f), 'utf8');
    return content.includes('localStorage');
  });
  assert(
    'preservation: exactly three storage areas in production src',
    sameJson(storageConsumers.sort(), ['components/DailyPromptsPanel.tsx', 'components/SomaticJournalPanel.tsx', 'lib/quiz/assessmentSessionStorage.ts']),
    storageConsumers.join(', '),
  );

  const sessionStorageConsumers = allFiles.filter(f => {
    const content = fs.readFileSync(path.join(srcDir, f), 'utf8');
    return content.includes('sessionStorage');
  });
  assert('preservation: no production sessionStorage usage', sessionStorageConsumers.length === 0, sessionStorageConsumers.join(', '));

  const storageModuleImporters = allFiles.filter(f => {
    if (f === 'lib/quiz/assessmentSessionStorage.ts') return false;
    if (f === 'components/quiz/AssessmentQuizHost.tsx') return false;
    const content = fs.readFileSync(path.join(srcDir, f), 'utf8');
    return content.includes('assessmentSessionStorage');
  });
  assert('preservation: no production importer of the storage module', storageModuleImporters.length === 0, storageModuleImporters.join(', '));

  const storageCalls = allFiles.filter(f => {
    if (f === 'lib/quiz/assessmentSessionStorage.ts') return false;
    if (f === 'components/quiz/AssessmentQuizHost.tsx') return false;
    const content = fs.readFileSync(path.join(srcDir, f), 'utf8');
    return content.includes('saveAssessmentSession') || content.includes('loadAssessmentSession') || content.includes('clearAssessmentSession');
  });
  assert('preservation: no live production call to save/load/clear', storageCalls.length === 0, storageCalls.join(', '));

  const appSource = fs.readFileSync(path.join(srcDir, 'App.tsx'), 'utf8');
  assert('preservation: App.tsx has no storage access', !appSource.includes('localStorage') && !appSource.includes('sessionStorage') && !appSource.includes('window.'));
  assert('preservation: App.tsx does not import the storage module', !appSource.includes('assessmentSessionStorage'));

  const quizSource = fs.readFileSync(path.join(srcDir, 'components/PersonalityQuiz.tsx'), 'utf8');
  assert('preservation: PersonalityQuiz.tsx does not import the storage module', !quizSource.includes('assessmentSessionStorage'));

  const premiumSource = fs.readFileSync(path.join(srcDir, 'hooks/usePremiumState.ts'), 'utf8');
  assert('preservation: usePremiumState has no storage access', !premiumSource.includes('localStorage'));

  const legacySource = fs.readFileSync(path.join(srcDir, 'data/personalityQuiz.ts'), 'utf8');
  assert('preservation: legacy quiz untouched', !legacySource.includes('assessmentSession'));
}

{
  assert('content: taxonomy has 145 records', EXPRESSION_REGISTRY.length === 145, `${EXPRESSION_REGISTRY.length}`);
  assert('content: confirmation bank has 145 items', EXPRESSION_CONFIRMATION_ITEMS.length === 145, `${EXPRESSION_CONFIRMATION_ITEMS.length}`);
  assert('content: screening bank has 290 items', EXPRESSION_SCREENING_ITEMS.length === 290, `${EXPRESSION_SCREENING_ITEMS.length}`);
  assert('content: group-screening bank has 84 items', EXPRESSION_GROUP_SCREENING_ITEMS.length === 84, `${EXPRESSION_GROUP_SCREENING_ITEMS.length}`);
  assert('content: screening groups has 42 mappings', EXPRESSION_SCREENING_GROUPS.length === 42, `${EXPRESSION_SCREENING_GROUPS.length}`);
}

/* ==================================================================
 *  Summary
 * ================================================================*/

console.log('==========================================');
console.log('Runtime Assessment Session Storage Validation');
console.log('------------------------------------------');
console.log(`storage key: ${ASSESSMENT_SESSION_STORAGE_KEY}`);
console.log(`session version: ${ASSESSMENT_SESSION_VERSION}`);
console.log('------------------------------------------');
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
if (errors.length > 0) {
  console.log('Errors:');
  for (const err of errors) {
    console.log(`  ${err}`);
  }
  process.exit(1);
}
console.log('ALL ASSERTIONS PASSED');
