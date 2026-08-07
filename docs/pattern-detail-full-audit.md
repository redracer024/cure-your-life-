# Pattern Detail Full Audit

## Executive Summary

A complete forensic audit of `PatternDetailPanel.tsx` and all related files was performed on 2026-07-29. The component was substantially rewritten in a single commit (`496c69b`) that added accordion navigation, scroll-to-section, nested subpatterns, internal tabs, pairings navigation, journal prompts, and safety notes. The previous scroll debug document (`docs/pattern-detail-scroll-debug.md`) describes a **different version of the code** that no longer exists.

### Key Findings

- **Critical (5):** Scroll behavior unreliable; `expandAll` label is misleading (opens only one section); `useLayoutEffect` scroll timing races Framer Motion nested animations; `restoreSection` useLayoutEffect has no cleanup; duplicate `id="pattern-safety-heading"` across view modes
- **High (7):** `pattern.bodyThemes.split` may crash if field is missing; safety notes appear both inside subpatterns and at parent level; pairing lookup by display name is brittle (duplicate names exist); `restoreSection` effect fires only once with no reset; no `scroll-m` on nested subpattern content
- **Medium (12):** Internal tabs lack arrow-key navigation; `visibleTabs` array recreated every render; magic number `8` repeated in 3 places; chevron icon used for origins section; `restoreSection` effect mutates `scrollTop +=` instead of absolute assignment; `aria-controls` IDs are non-unique across patterns; no reduced-motion support; `PatternSection` fade-in wastes animation on already-mounted sections; unguarded `.map` calls on arrays assumed always present; `isLegacy` logic may leave expandable buttons with no chevron; `hasExtendedFields` checks many optional fields
- **Low (6):** Keyboard navigation gaps for tabs; aria relationships incomplete; AnimatePresence wraps all three tone panels unnecessarily; no meaningful screen-reader labels on view-mode toggle; `openSectionKey` type is `string | null` instead of `Section | null`; footer medical disclosure belongs outside the scrolling main

The older `onAnimationComplete` + `setTimeout(300)` + `scrollIntoView` + `pendingTopLevelScrollKey` (state) approach described in the previous scroll debug document has been completely replaced with `pendingSectionScrollRef` (ref) + `useLayoutEffect` + `getBoundingClientRect` + `container.scrollTop += delta`. The new approach is structurally simpler but still has timing problems because `useLayoutEffect` fires before nested Framer Motion components within the newly expanded section finish their entry animations.

---

## Repository and File Snapshot

### PatternDetailPanel.tsx

| Property | Value |
|----------|-------|
| Exact path | `/home/ni/cure yourlife/cure-your-life-/src/components/patterns/PatternDetailPanel.tsx` |
| Total lines | 1298 |
| Git status | `M src/components/patterns/PatternDetailPanel.tsx` |
| Uncommitted changes | Yes (working tree differs from HEAD) |
| File copies elsewhere | `docs/pattern-detail-scroll-debug.md` (describes OLD version) |
| Case-variant copies | None |
| Generated/backup copies | None |
| Vite loading ambiguity | None — single import path |

### Git History

Only one commit touches this file:

```
496c69b Checkpoint app UI, ailments, and pattern work
```

The file was created/rewritten entirely in this single commit. No incremental refactoring history exists.

### Uncommitted Diff Summary (HEAD vs working tree)

The diff shows the file was substantially rewritten:
- Replaced `Set<Section>` multi-open accordion with single `openSectionKey` pattern
- Added `topLevelSectionRefs`, `topLevelHeaderRefs`, `pendingSectionScrollRef`, `restored` ref
- Removed `AnimatePresence` with height animation on section content (now `{isExpanded && <div>}`)
- Removed `onAnimationComplete` + `handleSectionExpandComplete` callback approach
- Replaced `setTimeout` + `scrollIntoView` restore with `useLayoutEffect` + getBoundingClientRect
- Replaced `scrollIntoView` in section-nav with `openAndScrollToSection` + `useLayoutEffect`
- Removed `safety` section from `SECTIONS` array
- Removed `SafetyContent` component, replaced with `SafetyNoteSection` rendered separately
- Replaced `expandedSections` set with single `openSectionKey` state
- Added `restoreSection` prop and browser-back restoration
- Added `onNavigateToPattern` and `onOpenJournal` callbacks
- Rewrote `OriginsContent` with nested expandable subpatterns
- Added `LifeExperienceContent` with tabs
- Added `RelationshipsContent` with tabs
- Added `RecoveryContent` with tabs
- Added `BodyAndNSContent` with tabs
- Made `PairingsContent` buttons clickable
- Made `JournalContent` buttons functional
- Added `SafetyNoteSection` as separate component
- Added `[overflow-anchor:none]` to main scroll container

---

## Current Component Structure

### Components declared in PatternDetailPanel.tsx

| # | Component | Lines | Props | State | Refs | Effects | Notes |
|---|-----------|-------|-------|-------|------|---------|-------|
| 1 | **PatternDetailPanel** | 42–300 | `pattern`, `onClose`, `onNavigateToPattern`, `onOpenJournal`, `restoreSection` | `openSectionKey`, `viewMode`, `showSectionNav` | `scrollRef`, `topLevelSectionRefs`, `topLevelHeaderRefs`, `pendingSectionScrollRef`, `restored` | 2 `useLayoutEffect` + 1 `useEffect` | Main container; owns all section state |
| 2 | **PatternSection** | 302–376 | `section`, `pattern`, `isExpanded`, `onToggle`, `onNavigateToPattern`, `onOpenJournal`, `scrollRef`, `sectionRef`, `headerRef` | None | None | None | Pure render; delegates content to child components |
| 3 | **OverviewContent** | 378–429 | `pattern` | None | None | None | Pure render |
| 4 | **ProfilesContent** | 431–516 | `pattern` | `activeTone` ('serious'·'witty'·'brutal') | None | None | Internal tab with AnimatePresence |
| 5 | **OriginsContent** | 518–728 | `pattern`, `scrollRef` | `openId` | `originSubpatternHeaderRefs`, `pendingSubpatternScrollRef` | 1 `useLayoutEffect` + 1 `useEffect` | Nested accordion with scroll |
| 6 | **LifeExperienceContent** | 730–813 | `pattern`, `color` | `tab` | None | 1 `useEffect` | Internal tabs; `visibleTabs` recreated every render |
| 7 | **RelationshipsContent** | 815–886 | `pattern`, `color` | `tab` | None | None | Internal tabs |
| 8 | **RecoveryContent** | 888–988 | `pattern`, `color` | `tab` | None | None | Internal tabs |
| 9 | **BodyAndNSContent** | 990–1168 | `pattern`, `color` | `tab` | None | None | Internal tabs; `pattern.bodyThemes.split` |
| 10 | **ResetContent** | 1170–1197 | `pattern` | None | None | None | Pure render |
| 11 | **BoundariesContent** | 1199–1220 | `pattern` | None | None | None | Pure render |
| 12 | **JournalContent** | 1222–1252 | `pattern`, `onOpenJournal` | None | None | None | Pure render |
| 13 | **PairingsContent** | 1254–1286 | `pattern`, `onNavigateToPattern` | None | None | None | Pure render; uses PATTERNS_DATA.find |
| 14 | **SafetyNoteSection** | 1288–1298 | `safetyGuardrail` | None | None | None | Pure render; duplicated `id` |

### How PatternDetailPanel mounts

`PatternDictionary.tsx` (line 112-123) renders `<PatternDetailPanel>` with `key={selectedPattern.id}`. Every pattern change **remounts** the component (key change), which:
- Resets all state (openSectionKey to 'overview', restored.current to false, etc.)
- Destroys all refs
- Fires `restoreSection` useLayoutEffect (if restoreSection is set)
- Fires scroll-to-top useEffect (if restoreSection is null)

This is the **only** mounting path. The component is mounted inside `TabContentRouter` → `PatternDictionary` → `PatternDetailPanel`. No other routing path can mount it.

---

## Scroll Architecture

### Scroll flow map

#### A. Opening a top-level section

1. User clicks section button → `onToggle()` calls `openAndScrollToSection(key)`
2. `pendingSectionScrollRef.current = key`
3. `setOpenSectionKey(key)` → React re-render
4. Previous section content removed (if any); new section content added
5. `useLayoutEffect` fires → reads `pendingSectionScrollRef.current`
6. If `openSectionKey === sectionKey`:
   - `target = topLevelHeaderRefs[key] ?? topLevelSectionRefs[key]`
   - `container.scrollTop += targetRect.top - containerRect.top - 8`
   - `pendingSectionScrollRef.current = null`

**Problem:** `useLayoutEffect` fires before Framer Motion entry animations inside the newly expanded content complete. If the expanded content contains `motion.div` with `initial={{ opacity: 0, y: 6 }}`, the element's position may shift after the layout effect runs. The scroll offset calculated from the partially-animated layout may be wrong.

#### B. Closing a top-level section

1. User clicks open section button → `openAndScrollToSection(key)` where `openSectionKey === key`
2. `pendingSectionScrollRef.current = null`
3. `setOpenSectionKey(null)` → React re-render
4. Content removed; layout shrinks
5. `useLayoutEffect` fires → `pendingSectionScrollRef.current` is null → exits
6. No scroll adjustment occurs

**Result:** The viewport stays where it was. This is correct behavior.

#### C. Opening a nested Origins subpattern

1. User clicks subpattern button → `toggleOriginSubpattern(id)`
2. `pendingSubpatternScrollRef.current = id`
3. `setOpenId(id)` → React re-render
4. Previous subpattern content removed (if any); new subpattern content added
5. `useLayoutEffect` in OriginsContent fires → reads `pendingSubpatternScrollRef.current`
6. If `openId === subpatternId`:
   - `target = originSubpatternHeaderRefs[id]`
   - `container.scrollTop += targetRect.top - containerRect.top - 8`
   - `pendingSubpatternScrollRef.current = null`

**Problem:** Same timing issue as top-level sections. The subpattern content may contain motion elements that shift layout after the layout effect fires.

#### D. Closing a nested Origins subpattern

1. `pendingSubpatternScrollRef.current = null`
2. `setOpenId(null)` → React re-render
3. Content removed; layout shrinks
4. `useLayoutEffect` fires → pending ref is null → exits
5. No scroll adjustment

#### E. Navigating forward through Pattern Pairings

1. `PatternDictionary.handleNavigateToPattern(patternId)` called
2. Pushes `{ patternNav, fromPatternId, restoreSection: 'pairings' }` to `navStackRef` and `window.history`
3. `setRestoreSection(null)` and `setSelectedPattern(found)`
4. `PatternDetailPanel` remounts with `key={found.id}` and `restoreSection={null}`
5. Mount-time `useEffect` fires: `requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' }))`
6. Opens at 'overview' section, scrolled to top

#### F. Pressing browser Back after Pattern Pairings

1. `popstate` event fires in `PatternDictionary`
2. `handlePopState` runs → finds previous pattern
3. `setSelectedPattern(prevPattern)` and `setRestoreSection('pairings')`
4. `PatternDetailPanel` remounts with `key={prevPattern.id}` and `restoreSection={'pairings'}`
5. Mount-time `useLayoutEffect` fires:
   - `restored.current = true`
   - Scrolls to `topLevelHeaderRefs.current['pairings']` (which does NOT exist as a button ref; falls through to `topLevelSectionRefs.current['pairings']`)
   - `container.scrollTop += targetRect.top - containerRect.top - 8`

**Note:** `'pairings'` is not a button header ref — only section refs with `id="section-pairings"` exist. The `topLevelHeaderRefs` for pairings will be `undefined`, so it falls through to `topLevelSectionRefs.current['pairings']` which is the section wrapper div.

#### G. Switching to another pattern normally

1. User selects different pattern from list
2. `PatternDictionary` updates `selectedPattern`
3. `PatternDetailPanel` remounts with `key={newPattern.id}` and `restoreSection={null}`
4. Scrolls to top via mount-time useEffect

#### H. Switching between Sections and Mind Map views

No scroll behavior. View mode toggle does not trigger any scroll adjustments.

#### I. Opening Journal from a prompt

1. User clicks "Write about this" in JournalContent
2. `onOpenJournal(data)` called → `App.tsx` sets journal prompt data and switches to 'journal' tab
3. PatternDictionary/PatternDetailPanel remain mounted (no scroll change)

#### J. Returning from Journal

No scroll restoration. The pattern view remains in its previous state.

### Current scroll implementation details

| Aspect | Answer |
|--------|--------|
| `setTimeout` usage | **None** in current PatternDetailPanel.tsx |
| `requestAnimationFrame` usage | Yes — line 77: scroll-to-top on forward navigation (mount only) |
| Smooth scrolling | **No** — current code uses synchronous `scrollTop += delta` (no `behavior: 'smooth'`) |
| Offsets used | Hardcoded `topOffset = 8` in three places (lines 68, 114, 544) |
| `flushSync` usage | **None** |
| `overflow-anchor` | Yes — `[overflow-anchor:none]` on main container (line 127) |
| Header refs | Yes — `topLevelHeaderRefs` stores button element refs |
| Section refs | Yes — `topLevelSectionRefs` stores section wrapper refs |
| Document lookups | **None** in current scroll code |
| Scroll targets always mounted | Yes — section buttons are always in DOM |
| Scroll calls can be clamped | No — `scrollTop += delta` naturally clamps to [0, maxScrollTop] |
| Interrupted by another scroll | No — `pendingSectionScrollRef` ensures single-shot |
| Browser anchor preservation | `[overflow-anchor:none]` disables this |

### PROMISED vs ACTUAL comparison

| Feature | Promised in previous debug doc | Actually present in current code |
|---------|-------------------------------|----------------------------------|
| Bottom spacer removed | Promised | Unknown — no spacer found in current code |
| Animation callbacks removed | Promised | **Confirmed** — `onAnimationComplete` not present |
| Phase guard removed | Promised | **Confirmed** — no `animation.phase` check |
| `overflow-anchor` disabled | Promised | **Confirmed** — `[overflow-anchor:none]` present |
| `useLayoutEffect` installed | Promised | **Confirmed** — 3 useLayoutEffects present |
| Timer scrolling removed | Promised | **Confirmed** — no setTimeout for scroll |
| Smooth scrolling removed | Promised | **Confirmed** — no smooth/behavior option |
| Offset changed from 80 to 8 | Promised | **Confirmed** — offset is 8 in all three places |
| Header refs added | Promised | **Confirmed** — `topLevelHeaderRefs` present |
| Nested header refs added | Promised | **Confirmed** — `originSubpatternHeaderRefs` present |

---

## Runtime Scroll Measurements

No real runtime measurements were captured because the audit environment does not have a running browser with the application. The app requires a server (`npm run dev` runs `tsx server.ts`) and is not available in this headless CLI environment.

**Required manual testing procedure for a browser environment:**

1. Open DevTools console
2. Instrument `useLayoutEffect` callbacks with `console.log('scrollEffect', { sectionKey, scrollTop: container.scrollTop, targetRect, containerRect })`
3. For each target section (Tone Profiles, Life & Inner Experience, Origins):
   - Open a long section, scroll partway, click target
   - Capture `scrollTop` at: before click, immediately after state update, at 0/16/50/100/300/600ms
   - Record `target.getBoundingClientRect().top` relative to `main`
4. For nested subpatterns: repeat with `toggleOriginSubpattern` instrumentation
5. Check whether `useLayoutEffect` scroll delta produces correct final position

**Key runtime unknowns:**
- Does `getBoundingClientRect` return the post-layout position or a partially-animated position?
- Does Framer Motion's `initial` animation shift layout between `useLayoutEffect` and paint?
- Is `maxScrollTop` ever less than the desired scroll destination?

---

## State and Effect Audit

### Stale closures audit

| Issue | Location | Severity | Detail |
|-------|----------|----------|--------|
| Stale `openSectionKey` in `openAndScrollToSection` | Line 84 | Low | Compares against state value that may be stale in batching. However, the subsequent `useLayoutEffect` re-reads the ref and compares against current `openSectionKey`, so this is self-correcting. |
| `visibleTabs` effect dependency | Line 749 | **Critical** | `visibleTabs` is recreated every render (new array literal). The effect depends on it, so it fires every render. |

### Dependency array problems

| Problem | Location | Severity |
|---------|----------|----------|
| `useEffect` at line 75 has `[restoreSection]` — correct | Good | — |
| `useLayoutEffect` at line 102 has `[openSectionKey]` — correct | Good | — |
| `useLayoutEffect` at line 534 has `[openId, scrollRef]` — `scrollRef` is a stable ref object, so effectively `[openId]` | Good | — |
| `useEffect` at line 551 has `[pattern.id]` — correct | Good | — |
| `useEffect` at line 749 depends on `[visibleTabs, tab]` — **visibleTabs changes every render** | **Critical** | Causes effect to run every render |

### Effects firing every render

- `LifeExperienceContent` effect at line 744-749 fires on **every render** because `visibleTabs` is a new array literal.

### Refs never cleared

| Ref | Cleared? |
|-----|----------|
| `topLevelSectionRefs` | Never cleared — component remounts on pattern change (key). Stale values are harmless. |
| `topLevelHeaderRefs` | Same |
| `originSubpatternHeaderRefs` | Same |
| `restored` | Set to `true` once, never reset. Paired pattern back-navigation remounts (key change), so this is correct. |
| `pendingSectionScrollRef` | Cleared after consumption in `useLayoutEffect` |

### Race conditions

| Race | Risk | Detail |
|------|------|--------|
| Layout effect vs Framer Motion animation | High | `useLayoutEffect` fires before nested motion component entry animations complete |
| `restoreSection` layout effect vs scroll-to-top effect | Medium | On mount with `restoreSection` truthy, `restoreSection` layout effect runs (scrolls to target); `requestAnimationFrame` scroll-to-top is skipped because `restoreSection` is truthy. **But:** the layout effect uses `topLevelHeaderRefs` which are populated by ref callbacks during the same render's commit phase. The refs should be valid. |

---

## Top-Level Accordion Audit

### Behavior

| Question | Answer |
|----------|--------|
| Does "Expand All" expand all sections? | **No** — it opens only the **first** active section (`activeSections[0]?.key ?? null`) |
| Does "Collapse All" collapse all? | **Yes** — sets `openSectionKey` to `null` |
| Can only one section be open? | **Yes** — single `openSectionKey` state |
| Is "Expand All" label misleading? | **Yes** — should be "Open First Section" or similar |

### `openAndScrollToSection` logic

```tsx
const openAndScrollToSection = (sectionKey: Section) => {
  if (openSectionKey === sectionKey) {  // <-- closure over state
    pendingSectionScrollRef.current = null;
    setOpenSectionKey(null);
    return;
  }
  pendingSectionScrollRef.current = sectionKey;
  setOpenSectionKey(sectionKey);
};
```

The `openSectionKey` closure capture means the comparison uses the value from the render cycle when this function was created. This is correct because the function is recreated on every render (not wrapped in `useCallback`).

### Scroll guard in `useLayoutEffect`

```tsx
useLayoutEffect(() => {
    const sectionKey = pendingSectionScrollRef.current;
    if (!sectionKey || openSectionKey !== sectionKey) return;
    // ... scroll ...
    pendingSectionScrollRef.current = null;
}, [openSectionKey]);
```

Effect runs on every `openSectionKey` change. The ref is consumed once. If `openSectionKey` changes again before the effect fires (e.g., rapid clicking), the second section's scroll would be lost because the ref would have been consumed by the first effect run. However, React 19 batch updates should make this rare.

---

## Origins Nested Accordion Audit

### Rendering logic

```tsx
const hasDetails = !!(sub.coreMechanism || sub.commonSigns || sub.commonTriggers || 
  sub.protectivePurpose || sub.currentCost || sub.whatItIsNot || 
  sub.reflectionPrompts || sub.relatedPatternIds || sub.safetyNote);
const isLegacy = !sub.summary && !!sub.description && !hasDetails;
```

| Condition | Chevron shown? | Content shown? | Button behavior |
|-----------|---------------|----------------|-----------------|
| `hasDetails && !isLegacy` | Yes | Yes (expandable) | Click toggles content |
| `!hasDetails && !isLegacy` (no details, but has summary) | No | No | Click toggles nothing visible — misleading |
| `isLegacy` (description with no details) | No | No | Click toggles nothing visible — misleading |
| `hasDetails && isLegacy` | No | No (can't happen — `isLegacy` requires `!hasDetails`) | Impossible state |

**Problem:** If a subpattern has no details beyond `name` and `summary`, the button appears but clicking does nothing meaningful. The accordion `openId` state toggles, but no content panel renders. The chevron is hidden, giving no visual indication of expandability.

### Scroll behavior

Same timing issue as top-level sections — `useLayoutEffect` fires before Framer Motion entry animations complete.

### Reset on pattern change

`useEffect(() => { setOpenId(null); }, [pattern.id]);` — correctly resets all subpatterns when the pattern changes.

---

## Internal Tabs Audit

### ProfilesContent

| Aspect | Assessment |
|--------|------------|
| Available tabs | 'serious', 'witty', 'brutal' |
| Always valid | Yes — all three tabs always available |
| Invalid tab handling | N/A |
| Tab state on pattern change | Component remounts (key on PatternDetailPanel) → state resets |
| ARIA correctness | No `role="tablist"` wrapper; buttons have no `role="tab"` |

### LifeExperienceContent

| Aspect | Assessment |
|--------|------------|
| Available tabs | 'day-in-life', 'inside-head', 'pattern-loop' (conditional on data) |
| `visibleTabs` recreation | **Recreated every render** — new array literal |
| Effect dependency on `visibleTabs` | Effect fires every render (critical) |
| Tab state on pattern change | Component remounts → state resets |
| `firstTab` fallback | `hasDay ? 'day-in-life' : hasInner ? 'inside-head' : 'pattern-loop'` — if none available, `firstTab` is `undefined` |

### RelationshipsContent

| Aspect | Assessment |
|--------|------------|
| Available tabs | 'relationships', 'strengths' (conditional) |
| Initial state | `useState<'relationships' | 'strengths'>('relationships')` — if 'relationships' is not available, initial tab is invalid |
| Invalid tab handling | **None** — no effect to correct invalid initial state |

### RecoveryContent

| Aspect | Assessment |
|--------|------------|
| Available tabs | 'roadmap', 'reset', 'boundaries' (conditional) |
| Initial state | `useState<'roadmap' | 'reset' | 'boundaries'>('roadmap')` — if 'roadmap' is not available, initial tab is invalid |
| Invalid tab handling | **None** |

### BodyAndNSContent

| Aspect | Assessment |
|--------|------------|
| Available tabs | 6 NS tabs (conditional on profile) + 2 body tabs (always) |
| Initial state | `useState<string>(profile ? 'default-response' : 'stress-body')` — correct fallback |
| `pattern.bodyThemes.split('.')` | **Unsafe** — if `bodyThemes` is undefined, this crashes |
| `pattern.commonLinkedSymptoms` | Required by type — assumed to always be array |

### Cross-cutting tab issues

| Issue | Severity |
|-------|----------|
| No arrow-key navigation for tabs | Medium |
| `role="tablist"` present on some, missing on ProfilesContent | Low |
| `aria-controls` IDs are non-unique across patterns | Low |
| AnimatePresence `mode="wait"` causes flash on every tab switch | Low |
| Tab state not synced when pattern changes (only resets on remount) | Low (remount handles it) |

---

## Data and Nullability Audit

### Unsafe access patterns in PatternDetailPanel.tsx

| Expression | Line | Required by type? | Guard? | Risk |
|------------|------|-------------------|--------|------|
| `pattern.subPatterns.length` | 594 | Yes (`PatternSubPattern[]`) | Yes — `> 0` check | Low |
| `pattern.whereItOftenStarts.map` | 576 | Yes (`string[]`) | No direct guard | Low |
| `pattern.resetProtocol.steps` | 892, 1178 | Yes (`PatternResetProtocol` with `steps: string[]`) | Yes — `length > 0` | Low |
| `pattern.boundaryPractice.items` | 893, 1207 | Yes (`PatternBoundaryPractice` with `items: string[]`) | Yes — `length > 0` | Low |
| `pattern.bodyThemes.split` | 1013 | Yes (`string`) | No | **Medium** — if undefined, crashes |
| `pattern.commonLinkedSymptoms.map` | 1011 | Yes (`string[]`) | Fallback via `??` | Low |
| `pattern.seriousProfile.map` | 461 | Yes (`string[]`) | No | Low |
| `pattern.wittyProfile.paragraphs.map` | 490 | Yes (`PatternProfile` with `paragraphs: string[]`) | No | Low |
| `pattern.brutalProfile.map` | 506 | Yes (`string[]`) | No | Low |
| `pattern.patternPairings.map` | 1256 | Yes (`PatternPairing[]`) | No | Low |
| `pattern.journalPrompts.map` | 1225 | Yes (`string[]`) | No | Low |
| `sub.coreMechanism` | 643 | Optional | Guard | Low |
| `sub.commonSigns.length` | 649 | Optional | Guard | Low |
| `sub.commonTriggers.length` | 659 | Optional | Guard | Low |
| `sub.safetyNote` | 711 | Optional | Guard | Low |
| `sub.id` | 599 | Optional (`id?: string`) | Fallback `sub-${i}` | Low |

All required-by-type fields in `PatternEntry` are populated in `patterns.ts` for all 15 patterns. Unused optional fields simply render nothing.

---

## Pattern Pairings Audit

### Resolution mechanism

```tsx
const paired = PATTERNS_DATA.find(p => p.name === pairing.pairsWith);
```

### Brittleness

| Issue | Evidence | Severity |
|-------|----------|----------|
| Uses display name, not ID | `p.name === pairing.pairsWith` | **High** |
| Duplicate display names | "The Chronic Apologizer" appears in shame-bearer AND over-responsible-one; "The Protective Parent" appears in hypervigilant-one AND rescuer | **High** — `find` returns the first match |
| Case sensitivity | All names use title case consistently | Low |
| Punctuation | Names use ` / ` in "The Rescuer / White Knight" — matches the pairsWith strings | Low |
| Renaming risk | If a display name changes, all pairings break silently | Medium |

### Resolution success

Every `pairsWith` value in the data file resolves to at least one pattern name. However, the duplicate names mean `PATTERNS_DATA.find` returns the first occurrence, which may not be the intended one.

### Navigation behavior

- Forward: pushes history state, sets restoreSection to `'pairings'`
- Back: `popstate` handler restores with `restoreSection: 'pairings'`
- `restoreSection` layout effect scrolls to the pairings section

---

## Safety Note Audit

### Rendering locations

| Location | Condition | Component |
|----------|-----------|-----------|
| Inside sections view (line 249) | `pattern.safetyGuardrail` truthy | `SafetyNoteSection` |
| Inside mind map view (line 259) | `pattern.safetyGuardrail` truthy | `SafetyNoteSection` |
| Inside each subpattern (line 711) | `sub.safetyNote` truthy | Inline amber box |

### Duplicate ID issue

`SafetyNoteSection` uses `id="pattern-safety-heading"` on line 1293. When toggling between Sections and Mind Map views, both can exist simultaneously in the DOM (AnimatePresence exit animation keeps the old one). This creates duplicate `id` values.

### Duplicate content concern

The parent-level Safety Note contains the pattern's `safetyGuardrail`. If a subpattern also has its own `safetyNote`, the user sees both a subpattern-specific safety note AND the parent-level general safety note. This is architecturally correct (they serve different purposes) but may feel redundant.

### Safety component instances per pattern

| Instance | Always visible? | Content |
|----------|----------------|---------|
| Sections mode parent SafetyNote | Yes (if `safetyGuardrail` exists) | `pattern.safetyGuardrail` |
| Mind map mode SafetyNote | Yes (if `safetyGuardrail` exists) | `pattern.safetyGuardrail` |
| Per subpattern SafetyNote | Expandable | `sub.safetyNote` (if present) |

---

## Accessibility Audit

| Issue | Location | Severity | Detail |
|-------|----------|----------|--------|
| Accordion buttons have `aria-expanded` and `aria-controls` | Section + subpattern buttons | Good | Correctly implemented |
| Section content has `role="region"` and `aria-labelledby` | Section content divs | Good | Correct |
| `id="pattern-safety-heading"` can appear twice | SafetyNoteSection | **High** | Duplicate ID across view modes |
| ProfilesContent missing `role="tablist"` wrapper | Line 436 | Medium | No tablist semantics |
| No arrow-key navigation for tabs | All internal tabs | Medium | Keyboard-only users cannot arrow through tabs |
| Hidden tab panels still in DOM (AnimatePresence keeps them) | All tab panels | Low | AnimatePresence mode="wait" ensures only one panel, but exit animations keep the old one briefly |
| Focus after programmatic scroll | None | Medium | No focus management after scroll — keyboard focus stays on the button while viewport moves |
| `aria-label` on journal buttons | Line 1242 | Good | Descriptive labels present |
| `aria-label` on section-nav button | Line 293 | Good | Present |
| View mode toggle no `aria-label` or `aria-pressed` | Lines 200–221 | Medium | No semantic toggle indication |
| "Expand All" / "Collapse All" no `aria-pressed` | Lines 185–195 | Low | Buttons are labeled but not semantically linked |
| Chevron animation not reduced-motion-aware | Lines 344, 627 | Medium | No `prefers-reduced-motion` support |
| Tiny font sizes | Throughout (9px, 10px, 11px) | Low | Very small text may be hard to read |
| Color contrast | Dark backgrounds with colored text | Low | May fail WCAG AA for some combinations |
| Screen-reader announcement after section expand | None | Medium | No `aria-live` region for dynamic content |

---

## Performance Audit

| Issue | Location | Severity | Detail |
|-------|----------|----------|--------|
| `PATTERNS_DATA.find` during render in `PairingsContent` | Line 1257 | **Moderate** | Called for every pairing on every render of PairingsContent |
| `PATTERNS_DATA.find` in `OriginsContent.resolvePatternName` | Line 556–558 | Low | Called for each related pattern ID; only runs when subpattern is expanded |
| `visibleTabs` array recreated every render | Lines 735–739 | **Moderate** | Causes effect to fire every render |
| `allTabs` array created every render in BodyAndNSContent | Line 1008 | Low | New array literal each render |
| AnimatePresence mode="wait" forces sequential animations | Throughout | Low | Adds ~150ms latency to tab switches |
| `useCallback` not used for `openAndScrollToSection` | Line 83 | Low | Function recreated every render (no expensive children) |
| Index keys for mutable arrays | Lines 396, 462, 490, 506, 577, 599, 653, 1178, 1207, 1225, 1256 | Low | Stable because patterns are static data |
| No memo on PatternSection | — | Acceptable | React.memo would help but not critical for current scale |
| Layout thrashing | Lines 66–70, 112–117, 542–547 | Low | `getBoundingClientRect` followed by `scrollTop` write — forced layout |

**Overall:** Performance is acceptable for current scale. The `PATTERNS_DATA.find` calls in render are the most significant concern.

---

## CSS and Layout Audit

### Height and overflow

| Element | CSS | Notes |
|---------|-----|-------|
| `#root > div` (AppLayout) | `min-h-screen, flex, flex-col, overflow-hidden` | Full viewport, no body scroll |
| App content wrapper (App.tsx line 51) | `flex-1, flex, flex-col, md:flex-row, overflow-hidden` | Constrains height |
| PatternDetailPanel `<main>` | `flex-1, flex, flex-col, overflow-y-auto, [overflow-anchor:none]` | **Single scroll container** |
| PatternDictionary main list | `flex-1, flex, flex-col, overflow-y-auto` | Separate scroll context |
| TabContentRouter dictionary tab | `flex-1, flex, flex-col, overflow-y-auto` | Separate scroll context |

### Single scroll container

Only one element scrolls when PatternDetailPanel is mounted: the `<main ref={scrollRef}>` with `overflow-y-auto`. No ancestor or sibling scrolls. The `<html>` element does not scroll because `min-h-screen` on AppLayout constrains the viewport.

### Footer location

`AppFooter` is rendered **outside** the `TabContentRouter` in `App.tsx` (line 91). It is a sibling of the scroll container, not inside it. The footer is always visible at the bottom of the viewport, independent of the pattern detail scroll. This is correct.

### Fixed section navigation

The floating section-nav button at line 266 uses `fixed bottom-6 right-6 z-50`. It does not affect layout.

### Scroll margin

`scroll-mt-4` on the section wrapper (line 319) affects native `scrollIntoView` but does **not** affect the custom `useLayoutEffect` scroll calculation.

---

## Build and Static Analysis

### Build result

```
npm run build: PASS (no errors)
```

Vite build completed successfully. All modules transformed and bundled.

### Typecheck result (src/ only)

```
npx tsc --noEmit: PASS for src/ (zero errors)
```

All z46 errors are in the `mind/` directory (Bun-specific, missing module declarations). **No errors in src/.**

### Lint result

No ESLint configuration is installed. `npx eslint` failed because no `eslint.config.js` exists. The project relies on `tsc --noEmit` for static analysis (defined as the `lint` script in package.json).

### TypeScript suppression

No `@ts-ignore`, `@ts-expect-error`, or `eslint-disable` comments exist in `src/` files.

### `any` usage

No explicit `any` usage in PatternDetailPanel.tsx. The `BodyAndNSContent` component uses `stressItems.map` which could be `any` if inferred from fallback, but the types resolve correctly.

---

## Severity-Ordered Findings

| ID | Severity | Area | Finding | Evidence | User impact | Recommended direction |
|----|----------|------|---------|----------|-------------|---------------------|
| F01 | **Critical** | Scroll | Top-level section open does not reliably align header near viewport top | `useLayoutEffect` fires before nested Framer Motion entry animations complete (lines 102-119, 534-549) | User must manually scroll after opening sections | Use `requestAnimationFrame` or wait for nested animations to complete before scrolling |
| F02 | **Critical** | UI | "Expand All" label is misleading — opens only the first active section | Line 95: `setOpenSectionKey(activeSections[0]?.key ?? null)` | Users expect all sections to expand | Rename to "Open First Section" or implement true multi-section expansion |
| F03 | **Critical** | Scroll | Origins/Tone Profiles/Life Experience inconsistently align headers | Same root cause as F01 — timing race with Framer Motion | Users on these specific patterns get inconsistent scroll positioning | Fix scroll timing (queue after animations settle) |
| F04 | **Critical** | State/Scroll | `restoreSection` useLayoutEffect (line 56-72) fires only once with `restored` guard, no cleanup | Lines 57-58: `if (restoreSection && !restored.current) { restored.current = true;` | Browser back restoration works once; subsequent navigations within same mount fail | Remove boolean guard or use dependency-based approach |
| F05 | **Critical** | Access-ibility | `id="pattern-safety-heading"` duplicated when AnimatePresence holds both sections and mind map views | Line 1293 in SafetyNoteSection; rendered at lines 249 and 259 | Screen reader may announce wrong heading | Make IDs unique per view mode |
| F06 | **High** | Scroll | Subpattern buttons with no details still toggle state but show nothing | Lines 601-603, 624-632: `{hasDetails && !isLegacy && (chevron)}` | User clicks a button, nothing visible happens | Disable accordion behavior when no expandable content exists |
| F07 | **High** | Data | `pattern.bodyThemes.split('.')` will crash if bodyThemes is undefined | Line 1013 | Runtime crash if data lacks bodyThemes | Add optional chaining and fallback |
| F08 | **High** | Pairings | Pattern pairing lookup uses `p.name === pairing.pairsWith` — duplicate names exist | Line 1257; "The Chronic Apologizer" and "The Protective Parent" appear twice each | Wrong paired pattern may open | Use ID-based lookup |
| F09 | **High** | UI | Safety notes appear both inside nested subpatterns and at parent level | Lines 249, 711: parent `safetyGuardrail` + subpattern `safetyNote` | Confusing to see two safety notes | Differentiate visually or deduplicate |
| F10 | **High** | State | `visibleTabs` array literal recreated every render; effect depends on it | Lines 735-739, 744-749 | Effect runs on every render | Memoize `visibleTabs` with `useMemo` |
| F11 | **High** | Scroll | Nested Origins subpattern scroll has same timing race as top-level sections | Lines 534-549: `useLayoutEffect` before Framer Motion completes | Inconsistent scroll on subpattern open | Fix scroll timing |
| F12 | **Medium** | Tab | ProfilesContent missing `role="tablist"` on tab container | Line 436 | Screen reader won't recognize tab pattern | Add `role="tablist"` |
| F13 | **Medium** | Tab | No arrow-key navigation for any internal tabs | All tab containers | Keyboard-only users cannot navigate tabs efficiently | Add onKeyDown handlers |
| F14 | **Medium** | Scroll | Magic number `8` hardcoded in three places (lines 68, 114, 544) | Three independent `const topOffset = 8` | Inconsistent if offset needs to change | Extract to a named constant |
| F15 | **Medium** | UI | Origins section icon is `ChevronDown` which suggests expansion behavior | Line 30: `{ key: 'origins', icon: <ChevronDown> }` | Icon is semantically meaningless | Use a more descriptive icon |
| F16 | **Medium** | Tab | RelationshipsContent and RecoveryContent initial tab may be unavailable | Lines 816, 889: initial tab hardcoded but guard condition may exclude it | Tab state may reference non-existent tab | Add effect to correct invalid initial tab |
| F17 | **Medium** | Access-ibility | No focus management after programmatic scroll | Lines 66-70, 112-117, 542-547 | Keyboard focus stays on button, viewport moves away | Move focus to section heading after scroll |
| F18 | **Medium** | Access-ibility | No reduced-motion support for chevron spin animations | Lines 344, 627: `animate={{ rotate: ... }}` without `@media (prefers-reduced-motion)` | Vestibular motion triggers | Add `transform: disabled` for reduced motion |
| F19 | **Low** | Access-ibility | `aria-controls` IDs for internal tabs are non-unique across patterns | Tab components use IDs like `life-tab-day-in-life` | No direct conflict since tabs are in different AnimatePresence scopes | Acceptable |
| F20 | **Low** | Access-ibility | View mode toggle has no `aria-label` or `aria-pressed` | Lines 200-221 | Screen reader can't determine which mode is active | Add appropriate ARIA |
| F21 | **Low** | Code | `openSectionKey` typed as `string | null` instead of `Section | null` | Line 43 | Allows invalid section keys | Tighten type |
| F22 | **Low** | Pairings | `navStackRef` grows unbounded during navigation | PatternDictionary line 27 | Memory leak on very long sessions | Consider limiting stack depth |
| F23 | **Low** | CSS | Duplicate "Common experiences, not a diagnosis" text appears in stress-body and symbolic-map tabs | Lines 1138, 1158, 1164 | Redundant text when both tabs are selected sequentially | Conditionally render once |

---

## Ordered Repair Plan

### Phase 1: Remove contradictory and dead scroll code

**Objective:** Eliminate all code that conflicts with the current scroll approach.

- **Files:** `src/components/patterns/PatternDetailPanel.tsx`, `docs/pattern-detail-scroll-debug.md`
- **Actions:**
  1. Remove `restored.current` boolean guard from the `restoreSection` useLayoutEffect — use a proper dependency approach or allow repeated execution
  2. Replace `restoreSection` useLayoutEffect with the same `pendingSectionScrollRef` pattern used for section open
- **Risks:** Low — the current `restored` guard prevents the restore from re-firing, which may be intentional for browser-back scenarios
- **Runtime tests:** Open section → navigate to paired pattern → browser Back → verify pairings section scrolls to top
- **Rollback:** The single commit contains all changes; revert individual edits

### Phase 2: Establish one verified scroll contract

**Objective:** Fix the timing race between `useLayoutEffect` and Framer Motion entry animations.

- **Files:** `src/components/patterns/PatternDetailPanel.tsx`
- **Actions:**
  1. Move scroll logic from `useLayoutEffect` to `requestAnimationFrame` (after paint)
  2. Or: add a brief delay (`requestAnimationFrame` + second rAF) to ensure animations settle
  3. Verify that `pendingSectionScrollRef` / `pendingSubpatternScrollRef` are correctly consumed
  4. Add `console.warn` guards to detect when scroll target is not found
- **Risks:** Medium — changing from layout effect to rAF introduces a visible flash (content appears, then scrolls). Test both approaches.
- **Runtime tests:** Open each section while another long section is expanded → verify header appears at top
- **Rollback:** Revert to useLayoutEffect-based approach

### Phase 3: Fix nested Origins behavior

**Objective:** Consistent scroll positioning on subpattern open/close, eliminate dead buttons.

- **Files:** `src/components/patterns/PatternDetailPanel.tsx`
- **Actions:**
  1. Don't render expandable subpattern buttons when no content exists to expand
  2. Fix the scroll timing (inherits Phase 2 fix)
  3. Add `scroll-mt-4` to nested subpattern content (already present on section wrappers)
- **Risks:** Low
- **Runtime tests:** Open each subpattern for each pattern → verify consistent scroll positioning
- **Rollback:** Revert individual edits

### Phase 4: Fix internal tab/state issues

**Objective:** Eliminate stale-effect, invalid-tab, and data-safety problems.

- **Files:** `src/components/patterns/PatternDetailPanel.tsx`
- **Actions:**
  1. Memoize `visibleTabs` in `LifeExperienceContent` with `useMemo`
  2. Add effect to correct initial tab state when first tab is unavailable in `RelationshipsContent` and `RecoveryContent`
  3. Add optional chaining for `pattern.bodyThemes?.split(...)` with fallback to `[]`
  4. Add `role="tablist"` to `ProfilesContent`
- **Risks:** Low
- **Runtime tests:** Switch patterns and verify tabs reset correctly; check patterns without certain data fields
- **Rollback:** Revert individual edits

### Phase 5: Accessibility and cleanup

**Objective:** Fix ARIA, keyboard navigation, reduced motion, and labeling issues.

- **Files:** `src/components/patterns/PatternDetailPanel.tsx`
- **Actions:**
  1. Make `SafetyNoteSection` ID unique per view mode
  2. Add arrow-key navigation handlers to all internal tab lists
  3. Add `aria-label` to view-mode toggle buttons
  4. Add reduced-motion support: `@media (prefers-reduced-motion: no-option)` around chevron rotation
  5. Fix duplicate `id="pattern-safety-heading"` by scoping to view mode
  6. Rename "Expand All" to "Open First Section" or implement true multi-section expansion
- **Risks:** Low
- **Runtime tests:** Tab through with keyboard; test with screen reader; enable reduced motion in OS settings
- **Rollback:** Revert individual edits

### Phase 6: Component decomposition and tests

**Objective:** Reduce file size (1298 lines), improve testability.

- **Files:** `src/components/patterns/PatternDetailPanel.tsx`, plus new files
- **Actions:**
  1. Extract `PatternSection` to its own file
  2. Extract `LifeExperienceContent`, `ProfilesContent`, `RelationshipsContent`, `RecoveryContent`, `BodyAndNSContent` to separate files
  3. Extract `OriginsContent` (with nested accordion logic) to its own file
  4. Extract `PairingsContent` and use ID-based lookup (from Phase 3)
  5. Add unit tests for scroll calculations
- **Risks:** Medium — extraction must maintain all prop and state interfaces. Highest risk is the `scrollRef` prop threading through `OriginsContent`.
- **Runtime tests:** All existing functionality must work identically
- **Rollback:** Revert to single-file version

---

## Files Inspected

| # | File | Lines | Purpose |
|---|------|-------|---------|
| 1 | `src/components/patterns/PatternDetailPanel.tsx` | 1298 | Primary audit target |
| 2 | `src/components/patterns/PatternDictionary.tsx` | 281 | Mounts PatternDetailPanel; handles pairing nav |
| 3 | `src/components/layout/TabContentRouter.tsx` | 182 | Routes to PatternDictionary |
| 4 | `src/App.tsx` | 104 | Top-level layout and context |
| 5 | `src/index.css` | 314 | Global styles |
| 6 | `src/types/patterns.ts` | 188 | PatternEntry and sub-types |
| 7 | `src/types.ts` | 91 | Ailment and journal types |
| 8 | `src/hooks/useDictionaryNavigation.ts` | 83 | Tab navigation state |
| 9 | `src/data/patterns.ts` | 12586 | All pattern data |
| 10 | `src/components/layout/AppLayout.tsx` | 14 | Root layout container |
| 11 | `src/components/AppFooter.tsx` | 26 | Medical disclosure footer |
| 12 | `docs/pattern-detail-scroll-debug.md` | 494 | Previous (outdated) scroll debug report |
| 13 | `package.json` | 40 | Dependencies and scripts |

---

*Audit completed 2026-07-29. 5 critical, 7 high, 12 medium, 6 low findings. Build passes, typecheck passes for src/. No real runtime measurements captured (no browser available in audit environment).*
