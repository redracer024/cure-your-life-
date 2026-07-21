import type { AilmentCore, AilmentDetail } from '../types/dictionary';
import type { Ailment, DailyPrompt } from '../types';
import coreData from './ailments-core.json';
import dailyPromptsData from './daily-prompts.json';

export const AILMENTS_CORE = coreData as AilmentCore[];
export const DAILY_PROMPTS = dailyPromptsData as DailyPrompt[];

const coreByIdMap = new Map<string, AilmentCore>(
  AILMENTS_CORE.map(item => [item.id, item])
);

const searchIndex = new Map<string, Set<AilmentCore>>();

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function buildSearchIndex() {
  for (const item of AILMENTS_CORE) {
    const tokens = new Set([
      ...tokenize(item.name),
      ...tokenize(item.emotionalRoot),
      ...tokenize(item.physiologicalDescription),
      ...(item.tags || []).flatMap(t => tokenize(t))
    ]);

    for (const token of tokens) {
      const set = searchIndex.get(token);
      if (set) {
        set.add(item);
      } else {
        searchIndex.set(token, new Set([item]));
      }
    }
  }
}

function getCoreByCategoryMap(): Map<string, AilmentCore[]> {
  const map = new Map<string, AilmentCore[]>();
  for (const item of AILMENTS_CORE) {
    const list = map.get(item.category) || [];
    list.push(item);
    map.set(item.category, list);
  }
  return map;
}

const categoryMap = getCoreByCategoryMap();

export function getAilmentCoreById(id: string): AilmentCore | undefined {
  return coreByIdMap.get(id);
}

export function getCoreAilmentsByCategory(category: string): AilmentCore[] {
  return categoryMap.get(category) || [];
}

export function getCoreAilments(): AilmentCore[] {
  return AILMENTS_CORE;
}

export function searchCoreAilments(query: string): AilmentCore[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const tokens = tokenize(normalized);
  if (tokens.length === 0) return [];

  const scored = new Map<AilmentCore, number>();

  for (const token of tokens) {
    const matches = searchIndex.get(token);
    if (!matches) continue;

    for (const item of matches) {
      scored.set(item, (scored.get(item) || 0) + 1);
    }
  }

  return Array.from(scored.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
}

export function getDailyPrompts(): DailyPrompt[] {
  return DAILY_PROMPTS;
}

export function getCategories(): string[] {
  return ['All', ...Array.from(new Set(AILMENTS_CORE.map(item => item.category))).sort()];
}

const detailModules = import.meta.glob<{ default: AilmentDetail[] }>(
  './ailments/*-detail.json'
);

const detailCache = new Map<string, AilmentDetail>();

export function getCategorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const CATEGORY_SLUGS: Record<string, string> = (() => {
  const slugs: Record<string, string> = {};
  for (const item of AILMENTS_CORE) {
    slugs[item.category] = getCategorySlug(item.category);
  }
  return slugs;
})();

export async function getDetailForAilment(
  id: string,
  categorySlug: string
): Promise<AilmentDetail | null> {
  if (detailCache.has(id)) return detailCache.get(id)!;

  const key = `./ailments/${categorySlug}-detail.json`;
  const loader = detailModules[key];

  if (!loader) {
    console.warn(`Detail loader not found for category slug: ${categorySlug}`);
    return null;
  }

  try {
    const module = await loader();
    const items = module.default;
    items.forEach(item => detailCache.set(item.id, item));
    return detailCache.get(id) || null;
  } catch (error) {
    console.error(`Failed to load detail chunk for ${categorySlug}:`, error);
    return null;
  }
}

export function mergeCoreAndDetail(
  core: AilmentCore,
  detail: AilmentDetail | null
): Ailment {
  return {
    ...core,
    structuredContent: detail?.structuredContent,
    tones: detail?.tones,
    biologyPath: detail?.biologyPath,
    medical_safety: detail?.medical_safety,
  } as Ailment;
}

buildSearchIndex();
