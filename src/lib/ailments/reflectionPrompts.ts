import type { Ailment } from '../../types';

export const REFLECTION_PROMPT_IDENTITY_VERSION = 2;

export type ReflectionGroupSource =
  | 'core'
  | 'subsection'
  | 'location'
  | 'laterality';

export type ReflectionPromptInput =
  | string
  | {
      id?: string;
      prompt?: string;
      text?: string;
      aliases?: string[];
      previousPrompts?: string[];
      previousTexts?: string[];
      migrationIds?: string[];
    };

export interface ReflectionPromptDefinition {
  text: string;
  authoredId?: string;
  aliases: string[];
  previousTexts: string[];
  migrationIds: string[];
}

export interface ReflectionGroup {
  /** Stable, source-namespaced key (e.g. "subsection:childhood"). */
  sectionKey: string;
  /** Human-visible heading, taken from the data when available. */
  label: string;
  source: ReflectionGroupSource;
  prompts: ReflectionPromptDefinition[];
}

export interface ReflectionQuestionRef {
  stableId: string;
  legacyTextId: string;
  legacyIndexId: string;
  migrationIds: string[];
  textFingerprint: string;
  sectionKey: string;
  label: string;
  prompt: string;
}

export interface AilmentReflectionSectionRecord {
  key: string;
  label: string;
  promptIds: string[];
}

export type HistoricalAnswerReason =
  | 'unmatched'
  | 'ambiguous'
  | 'multiple-source-answers';

export interface HistoricalPromptAnswer {
  id: string;
  answer: string;
  prompt?: string;
  sectionKey?: string;
  reason: HistoricalAnswerReason;
  candidateIds?: string[];
}

export interface PromptAnswerMigration {
  fromId: string;
  fromPrompt?: string;
  fromSectionKey?: string;
}

export interface AilmentReflectionRecord {
  schemaVersion?: 2;
  promptIdentityVersion?: 2;
  id: string;
  type: 'ailment-reflection';
  ailmentId: string;
  ailmentTitle: string;
  /** Stable prompt id -> answer text (only answered prompts are present). */
  answers: Record<string, string>;
  /** Stable prompt id -> question wording captured at save time (historical). */
  prompts: Record<string, string>;
  /** Current prompt id -> historical ids/prompts that were migrated into it. */
  answerMigrations?: Record<string, PromptAnswerMigration[]>;
  /** Historical answers that could not be safely assigned to a current prompt. */
  historicalAnswers?: HistoricalPromptAnswer[];
  /** Group ordering captured at save time for history rendering. */
  sections: AilmentReflectionSectionRecord[];
  totalPrompts: number;
  answeredCount: number;
  updatedAt: number;
  date: string;
}

export interface DuplicatePromptIdentity {
  stableId: string;
  prompts: ReflectionQuestionRef[];
}

export function normalizePromptText(text: string): string {
  return (text || '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '');
}

export function stablePromptHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

export function buildReflectionPromptId(
  ailmentId: string,
  sectionKey: string,
  prompt: string,
): string {
  const norm = normalizePromptText(prompt);
  const hash = stablePromptHash(`${ailmentId}|${sectionKey}|${norm}`);
  return `${ailmentId}::${sectionKey}::${hash}`;
}

function normalizeAuthoredId(id: string): string {
  return id
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildAuthoredReflectionPromptId(ailmentId: string, authoredId: string): string {
  const normalized = normalizeAuthoredId(authoredId);
  if (!normalized) {
    throw new Error(`Invalid reflection prompt id for ailment ${ailmentId}`);
  }
  return `${ailmentId}::prompt:${normalized}`;
}

export function buildLegacyIndexPromptId(
  ailmentId: string,
  sectionKey: string,
  index: number,
): string {
  return `${ailmentId}::${sectionKey}::${index}`;
}

function normalizePromptInput(input: ReflectionPromptInput): ReflectionPromptDefinition | null {
  if (typeof input === 'string') {
    const text = input.trim();
    return text ? { text, aliases: [], previousTexts: [], migrationIds: [] } : null;
  }

  if (!input || typeof input !== 'object') return null;

  const text = typeof input.prompt === 'string'
    ? input.prompt.trim()
    : typeof input.text === 'string'
      ? input.text.trim()
      : '';

  if (!text) return null;

  return {
    text,
    authoredId: typeof input.id === 'string' && input.id.trim() ? input.id.trim() : undefined,
    aliases: Array.isArray(input.aliases) ? input.aliases.filter((item) => typeof item === 'string' && item.trim()) : [],
    previousTexts: [
      ...(Array.isArray(input.previousPrompts) ? input.previousPrompts : []),
      ...(Array.isArray(input.previousTexts) ? input.previousTexts : []),
    ].filter((item) => typeof item === 'string' && item.trim()),
    migrationIds: Array.isArray(input.migrationIds)
      ? input.migrationIds.filter((item) => typeof item === 'string' && item.trim())
      : [],
  };
}

function normalizePromptList(inputs: unknown): ReflectionPromptDefinition[] {
  if (!Array.isArray(inputs)) return [];
  return inputs
    .map((input) => normalizePromptInput(input as ReflectionPromptInput))
    .filter((prompt): prompt is ReflectionPromptDefinition => prompt !== null);
}

function gatherCore(ailment: Ailment): ReflectionGroup[] {
  const prompts = normalizePromptList(ailment.mindfulnessPrompts);
  if (prompts.length === 0) return [];
  return [
    {
      sectionKey: 'core',
      label: 'General Reflection',
      source: 'core',
      prompts,
    },
  ];
}

function gatherSubsections(ailment: Ailment): ReflectionGroup[] {
  const subsections = ailment.structuredContent?.subsections;
  if (!subsections?.sections?.length) return [];
  return subsections.sections
    .map((s: any) => ({
      sectionKey: `subsection:${s.key}`,
      label: s.label || 'Reflection',
      source: 'subsection' as const,
      prompts: normalizePromptList(s.reflectionPrompts),
    }))
    .filter((group) => group.prompts.length > 0);
}

function gatherLocationSections(ailment: Ailment): ReflectionGroup[] {
  const locationSections = ailment.structuredContent?.locationSections;
  if (!locationSections?.sections?.length) return [];
  return locationSections.sections
    .map((s: any) => ({
      sectionKey: `location:${s.key}`,
      label: s.label || 'Reflection',
      source: 'location' as const,
      prompts: normalizePromptList(s.reflectionPrompts),
    }))
    .filter((group) => group.prompts.length > 0);
}

function gatherWorksheet(ailment: Ailment): ReflectionGroup[] {
  const ws = (ailment.structuredContent as any)?.reflectionWorksheet;
  if (!Array.isArray(ws) || ws.length === 0) return [];
  return ws
    .map((g: any) => ({
      sectionKey: `worksheet:${g.key ?? g.label ?? 'group'}`,
      label: g.label || 'Reflection',
      source: 'subsection' as const,
      prompts: normalizePromptList(g.prompts),
    }))
    .filter((group) => group.prompts.length > 0);
}

function gatherLaterality(ailment: Ailment): ReflectionGroup[] {
  const laterality = ailment.structuredContent?.laterality;
  if (!laterality) return [];
  const groups: ReflectionGroup[] = [];
  const leftPrompts = normalizePromptList(laterality.left?.prompts);
  if (leftPrompts.length > 0) {
    groups.push({
      sectionKey: 'laterality:left',
      label: laterality.left?.heading || 'Left Side',
      source: 'laterality',
      prompts: leftPrompts,
    });
  }
  const rightPrompts = normalizePromptList(laterality.right?.prompts);
  if (rightPrompts.length > 0) {
    groups.push({
      sectionKey: 'laterality:right',
      label: laterality.right?.heading || 'Right Side',
      prompts: rightPrompts,
      source: 'laterality',
    });
  }
  return groups;
}

export function groupAilmentReflectionPrompts(ailment: Ailment): ReflectionGroup[] {
  return [
    ...gatherCore(ailment),
    ...gatherSubsections(ailment),
    ...gatherWorksheet(ailment),
    ...gatherLocationSections(ailment),
    ...gatherLaterality(ailment),
  ];
}

export function flattenReflectionGroups(
  ailmentId: string,
  groups: ReflectionGroup[],
): ReflectionQuestionRef[] {
  const refs: ReflectionQuestionRef[] = [];
  for (const group of groups) {
    group.prompts.forEach((definition, index) => {
      const legacyTextId = buildReflectionPromptId(ailmentId, group.sectionKey, definition.text);
      const legacyIndexId = buildLegacyIndexPromptId(ailmentId, group.sectionKey, index);
      const stableId = definition.authoredId
        ? buildAuthoredReflectionPromptId(ailmentId, definition.authoredId)
        : legacyTextId;
      const migrationIds = new Set<string>([
        stableId,
        legacyTextId,
        legacyIndexId,
        ...definition.migrationIds,
      ]);

      for (const previousText of [...definition.previousTexts, ...definition.aliases]) {
        migrationIds.add(buildReflectionPromptId(ailmentId, group.sectionKey, previousText));
      }

      refs.push({
        stableId,
        legacyTextId,
        legacyIndexId,
        migrationIds: Array.from(migrationIds),
        textFingerprint: normalizePromptText(definition.text),
        sectionKey: group.sectionKey,
        label: group.label,
        prompt: definition.text,
      });
    });
  }
  return refs;
}

export function getDuplicateReflectionPromptIdentities(
  flatQuestions: ReflectionQuestionRef[],
): DuplicatePromptIdentity[] {
  const byId = new Map<string, ReflectionQuestionRef[]>();
  for (const question of flatQuestions) {
    byId.set(question.stableId, [...(byId.get(question.stableId) ?? []), question]);
  }
  return Array.from(byId.entries())
    .filter(([, prompts]) => prompts.length > 1)
    .map(([stableId, prompts]) => ({ stableId, prompts }));
}

export interface RestoreLegacyResult {
  /** Migrated answers keyed by the CURRENT stable prompt ids. */
  answers: Record<string, string>;
  /** True when at least one answer could not be assigned with one-to-one certainty. */
  ambiguous: boolean;
  /** Historical answers preserved because migration was unsafe or impossible. */
  unresolvedAnswers: HistoricalPromptAnswer[];
  /** Current prompt id -> historical ids/prompts that were migrated into it. */
  answerMigrations: Record<string, PromptAnswerMigration[]>;
}

function dedupeCandidates(candidates: ReflectionQuestionRef[]): ReflectionQuestionRef[] {
  const seen = new Set<string>();
  const deduped: ReflectionQuestionRef[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.stableId)) continue;
    seen.add(candidate.stableId);
    deduped.push(candidate);
  }
  return deduped;
}

function legacySectionKeyFromId(oldId: string): string | undefined {
  const parts = oldId.split('::');
  if (parts.length === 3) return parts[1];
  return undefined;
}

function addHistoricalAnswer(
  unresolvedAnswers: HistoricalPromptAnswer[],
  entry: HistoricalPromptAnswer,
) {
  const exists = unresolvedAnswers.some((item) =>
    item.id === entry.id &&
    item.answer === entry.answer &&
    item.prompt === entry.prompt &&
    item.reason === entry.reason
  );
  if (!exists) unresolvedAnswers.push(entry);
}

function addAnswerMigration(
  migrations: Record<string, PromptAnswerMigration[]>,
  currentId: string,
  migration: PromptAnswerMigration,
) {
  const list = migrations[currentId] ?? [];
  const exists = list.some((item) =>
    item.fromId === migration.fromId &&
    item.fromPrompt === migration.fromPrompt &&
    item.fromSectionKey === migration.fromSectionKey
  );
  if (!exists) migrations[currentId] = [...list, migration];
}

function indexCurrentQuestions(flatQuestions: ReflectionQuestionRef[]) {
  const byMigrationId = new Map<string, ReflectionQuestionRef[]>();
  const sameSectionByText = new Map<string, Map<string, ReflectionQuestionRef[]>>();
  const globalByText = new Map<string, ReflectionQuestionRef[]>();

  for (const q of flatQuestions) {
    for (const id of q.migrationIds) {
      byMigrationId.set(id, [...(byMigrationId.get(id) ?? []), q]);
    }

    const norm = q.textFingerprint;
    if (!sameSectionByText.has(q.sectionKey)) sameSectionByText.set(q.sectionKey, new Map());
    const sectionMap = sameSectionByText.get(q.sectionKey)!;
    sectionMap.set(norm, [...(sectionMap.get(norm) ?? []), q]);
    globalByText.set(norm, [...(globalByText.get(norm) ?? []), q]);
  }

  return { byMigrationId, sameSectionByText, globalByText };
}

export function mergeHistoricalAnswers(
  ...groups: Array<HistoricalPromptAnswer[] | undefined>
): HistoricalPromptAnswer[] {
  const merged: HistoricalPromptAnswer[] = [];
  for (const group of groups) {
    if (!Array.isArray(group)) continue;
    for (const item of group) {
      if (!item || typeof item.id !== 'string' || typeof item.answer !== 'string') continue;
      addHistoricalAnswer(merged, item);
    }
  }
  return merged;
}

export function mergeAnswerMigrations(
  ...groups: Array<Record<string, PromptAnswerMigration[]> | undefined>
): Record<string, PromptAnswerMigration[]> {
  const merged: Record<string, PromptAnswerMigration[]> = {};
  for (const group of groups) {
    if (!group) continue;
    for (const [currentId, migrations] of Object.entries(group)) {
      if (!Array.isArray(migrations)) continue;
      for (const migration of migrations) {
        if (!migration || typeof migration.fromId !== 'string') continue;
        addAnswerMigration(merged, currentId, migration);
      }
    }
  }
  return merged;
}

export function restoreLegacyAnswers(params: {
  recordAnswers: Record<string, string>;
  recordPrompts: Record<string, string>;
  flatQuestions: ReflectionQuestionRef[];
  historicalAnswers?: HistoricalPromptAnswer[];
  answerMigrations?: Record<string, PromptAnswerMigration[]>;
}): RestoreLegacyResult {
  const {
    recordAnswers,
    recordPrompts,
    flatQuestions,
    historicalAnswers,
    answerMigrations,
  } = params;
  const answers: Record<string, string> = {};
  const unresolvedAnswers = mergeHistoricalAnswers(historicalAnswers);
  const migrations = mergeAnswerMigrations(answerMigrations);
  let ambiguous = false;

  const { byMigrationId, sameSectionByText, globalByText } = indexCurrentQuestions(flatQuestions);
  const assignedSourceByCurrentId = new Map<string, string>();

  for (const [oldId, answer] of Object.entries(recordAnswers)) {
    if (!answer || !answer.trim()) continue;

    const oldPrompt = recordPrompts[oldId];
    const oldSection = legacySectionKeyFromId(oldId);
    let candidates = dedupeCandidates(byMigrationId.get(oldId) ?? []);

    if (candidates.length === 0 && oldPrompt) {
      const normOld = normalizePromptText(oldPrompt);
      if (oldSection) {
        candidates = dedupeCandidates(sameSectionByText.get(oldSection)?.get(normOld) ?? []);
      }
      if (candidates.length === 0) {
        candidates = dedupeCandidates(globalByText.get(normOld) ?? []);
      }
    }

    if (candidates.length === 1) {
      const currentId = candidates[0].stableId;
      const existingSource = assignedSourceByCurrentId.get(currentId);
      if (existingSource && existingSource !== oldId) {
        ambiguous = true;
        addHistoricalAnswer(unresolvedAnswers, {
          id: oldId,
          answer,
          prompt: oldPrompt,
          sectionKey: oldSection,
          reason: 'multiple-source-answers',
          candidateIds: [currentId],
        });
        continue;
      }

      answers[currentId] = answer;
      assignedSourceByCurrentId.set(currentId, oldId);
      if (
        oldId !== currentId ||
        (oldPrompt !== undefined && oldPrompt !== candidates[0].prompt) ||
        (oldSection !== undefined && oldSection !== candidates[0].sectionKey)
      ) {
        addAnswerMigration(migrations, currentId, {
          fromId: oldId,
          fromPrompt: oldPrompt,
          fromSectionKey: oldSection,
        });
      }
      continue;
    }

    ambiguous = ambiguous || candidates.length > 1;
    addHistoricalAnswer(unresolvedAnswers, {
      id: oldId,
      answer,
      prompt: oldPrompt,
      sectionKey: oldSection,
      reason: candidates.length > 1 ? 'ambiguous' : 'unmatched',
      candidateIds: candidates.map((candidate) => candidate.stableId),
    });
  }

  return {
    answers,
    ambiguous,
    unresolvedAnswers,
    answerMigrations: migrations,
  };
}
