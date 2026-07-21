# Dictionary Refactor Plan

## Problem
`src/data/dictionary.ts` is 30,815 lines (~1.7 MB) containing 135 `AILMENTS` entries and 37 `DAILY_PROMPTS`. It is imported by only 2 direct files (`useDictionaryNavigation.ts`, `SomaticJournalPanel.tsx`) but cascades through `TabContentRouter` → `AilmentAccordionItem` → detail panels. The file causes:
- **Bundle bloat**: Every entry carries ~13 KB of nested `structuredContent`, `tones`, `biologyPath`, and `medical_safety` even for list views that only need core fields.
- **Painful diffs/merge conflicts**: 40+ `.bak` files and a single 30k-line TS file.
- **Slow search**: Linear `.filter()` + `.find()` over the full dataset on every keystroke.

## Goal
Reduce bundle size, improve runtime search performance, and improve maintainability.

## Current Usage Map
| File | Fields Used |
|---|---|
| `useDictionaryNavigation.ts` | `id`, `name`, `category`, `emotionalRoot`, `physiologicalDescription`, `tags` |
| `SomaticJournalPanel.tsx` | `id`, `name`, `category`, `emotionalRoot`, `sarcasticAdvice` |
| `AilmentAccordionItem` → `getEnrichedAilment` | All fields. `structuredContent` is primary source for panels; `tones`/`biologyPath`/`medical_safety` are fallbacks. |
| `contentSelectors.ts` | `structuredContent.biologyPathway`, `structuredContent.interpretations.*`, `structuredContent.reset`, `structuredContent.influenceLayers` |

## Strategy

### 1. Core / Detail Data Split
- **Core** (`ailments-core.json`): a single file (~80-120 KB) containing lightweight fields needed for list/search across **all** 135 items: `id`, `name`, `category`, `emotionalRoot`, `metaphor`, `physiologicalDescription`, `sarcasticAdvice`, `mindfulnessPrompts`, `physicalTherapyTip`, `riskLevel`, `tags`.
- **Detail** (`ailments/{category-slug}-detail.json`): heavy fields only loaded when an accordion expands (`structuredContent`, `tones`, `biologyPath`, `medical_safety`).
- **Rationale**: 135 items × ~600-800 bytes/core ≈ 80-120 KB total. Eagerly bundling core data makes search/indexing 100% synchronous with zero UI delay. Detail data (~1.6 MB) is lazy-loaded on demand.

### 2. Format Migration (JSON)
- Eager single file: `src/data/ailments-core.json`.
- Lazy detail files: `src/data/ailments/{category-slug}-detail.json` (9 categories).
- Eager small file: `src/data/daily-prompts.json` (37 entries).
- Keep a thin barrel `src/data/dictionary.ts` with typed accessor functions.
- Rationale: JSON diffs cleanly, avoids TS syntax noise on content edits, Vite imports JSON natively.

### 3. Module Splitting & Lazy Loading (Vite-native)
- `src/data/index.ts` barrel exposing:
  - `getCoreAilments(): AilmentCore[]` — synchronous, eager-loaded
  - `getCoreAilmentsByCategory(category: string): AilmentCore[]`
  - `searchCoreAilments(query: string): AilmentCore[]`
  - `getDailyPrompts(): DailyPrompt[]` — synchronous, eager-loaded
  - `getDetailForAilment(id: string, categorySlug: string): Promise<AilmentDetail | null>` — async, cached
  - `CATEGORY_SLUGS: Record<string, string>` — maps human category names to file slugs (e.g. `"Head & Neck" → "head-and-neck"`)
  - `mergeCoreAndDetail(core: AilmentCore, detail: AilmentDetail | null): Ailment` — combines core + detail into a full `Ailment` for downstream consumers like `getEnrichedAilment`
- **Use `import.meta.glob` for detail loading**. Do **not** use `@vite-ignore` with template literals — that breaks Rollup bundling and causes 404s in production.
- Barrel implementation pattern:
  ```ts
  const detailModules = import.meta.glob<{ default: AilmentDetail[] }>(
    './ailments/*-detail.json'
  );
  const detailCache = new Map<string, AilmentDetail>();

  export async function getDetailForAilment(
    id: string,
    categorySlug: string
  ): Promise<AilmentDetail | null> {
    if (detailCache.has(id)) return detailCache.get(id)!;
    const key = `./ailments/${categorySlug}-detail.json`;
    const loader = detailModules[key];
    if (!loader) return null;
    try {
      const module = await loader();
      module.default.forEach(item => detailCache.set(item.id, item));
      return detailCache.get(id) || null;
    } catch (error) {
      console.error(`Failed to load detail chunk for ${categorySlug}:`, error);
      return null;
    }
  }
  ```

### 4. Runtime Indexes
- Build lightweight indexes on first load (in-memory module singleton, synchronous because core data is eager):
  - `coreByName: Map<string, AilmentCore>` — exact ID lookup
  - `coreByCategory: Map<string, AilmentCore[]>` — category filter
  - `searchIndex: Map<string, Set<AilmentCore>>` — inverted index tokenized on `name`, `emotionalRoot`, `physiologicalDescription`, `tags` (lowercase, split on spaces/punctuation).
- Replace `AILMENTS.filter(...).sort(...)` in `useDictionaryNavigation.ts` with index-based lookups + merge.
- Replace `.find()` in `SomaticJournalPanel.tsx` with `searchIndex` lookup.

### 5. Type Safety
- Define `AilmentCore` and `AilmentDetail` interfaces in `src/types/dictionary.ts`.
- Barrel module validates JSON shape at runtime using a hand-rolled validator on first load. Fail closed with a descriptive error if data is corrupted.

### 6. Data Integrity & Rollback Safety
- Snapshot current state before migration:
  - `AILMENTS.length` (135), unique IDs, category distribution, field presence counts.
- Validation script at `scripts/validate-dictionary.ts` (repo root).
  - Reads legacy `dictionary.ts`, emits snapshot.
  - Reads refactored JSON, compares parity.
  - Run: `npx tsx scripts/validate-dictionary.ts`
- Keep original file as `src/data/dictionary.legacy.ts` during transition for rollback.

### 7. Accordion UX Guardrails
- `AilmentAccordionItem` must handle async detail loading:
  - On expand, call `getDetailForAilment(id, CATEGORY_SLUGS[ailment.category])`.
  - Merge result with core via `mergeCoreAndDetail(core, detail)` before passing to `getEnrichedAilment`.
  - Show skeleton/placeholder while detail loads.
  - Use the global `detailCache` in barrel — each ailment detail fetched exactly once.
  - Race condition safe: cache is populated before any await resolves to UI.
- Detail panels (`AilmentTonePanel`, `AilmentInfluencePanel`, `AilmentSafetyPanel`, `AilmentResetPanel`) already use optional chaining on `enriched.tones` / `enriched.structuredContent` and fall back to core fields, so they render gracefully even if detail is still loading or missing.

### 8. Cleanup
- Remove 40+ `.bak` files from `src/data/` after successful validation.
- Remove `AILMENTS[]` and `DAILY_PROMPTS[]` from `src/data/dictionary.ts` after cutover.

## Implementation Steps

1. **Add types** — `src/types/dictionary.ts` with `AilmentCore`, `AilmentDetail`.
2. **Create validation script** — `scripts/validate-dictionary.ts`
   - Snapshot legacy data.
   - Validate refactored JSON matches snapshot.
3. **Extract JSON files** — `scripts/extract-dictionary.ts`
   - Read `AILMENTS`, split into `src/data/ailments-core.json` and `src/data/ailments/{slug}-detail.json`.
   - Category slugs derived by lowercasing, replacing `&` with `and`, replacing spaces/slashes with hyphens.
   - Write `src/data/daily-prompts.json`.
4. **Build barrel + indexes** — `src/data/index.ts`
   - Eager core import + synchronous index build.
   - `import.meta.glob` detail loaders + `detailCache`.
   - Export `CATEGORY_SLUGS` map and `mergeCoreAndDetail()` helper.
   - Runtime validation.
5. **Update importers**
   - `useDictionaryNavigation.ts` → barrel sync functions + indexes. Change `filteredAilments` return type to `AilmentCore[]`.
   - `SomaticJournalPanel.tsx` → barrel search.
   - `AilmentAccordionItem.tsx` → on expand, call `getDetailForAilment(id, CATEGORY_SLUGS[ailment.category])`, merge via `mergeCoreAndDetail()`, set local state, pass merged `Ailment` to `getEnrichedAilment`.
   - `TabContentRouter.tsx` / `CategoryGrid.tsx` → accept `AilmentCore[]` for list props.
6. **Run validation** — 0 discrepancies.
7. **Cleanup** — remove `.bak` files, remove legacy array from `dictionary.ts`.

## Risks
- **JSON type safety**: Vite JSON imports are untyped. Mitigate with runtime validation in barrel + explicit TypeScript interfaces.
- **Detail lazy-load flash**: `AilmentAccordionItem` must show loading state while detail JSON loads. Mitigate with skeleton/placeholder + global `detailCache`.
- **Core bundle size**: Core data is ~80-120 KB. Verify with `vite build --analyze` to ensure it stays under budget.

## Validation
- `npm run lint` passes.
- `npm run build` succeeds.
- Validation script reports 0 discrepancies.
- Manual smoke test: dictionary search, category filter, journal symptom match, accordion expand loads detail.

## Rollback
- `dictionary.legacy.ts` remains until validation passes.
- Revert barrel imports to legacy imports if needed.
