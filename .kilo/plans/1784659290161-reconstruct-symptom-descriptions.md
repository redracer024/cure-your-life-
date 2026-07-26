# Plan: Fix Influence Tab & Reconstruct Symptom Descriptions from influences.pdf

## Goal
Fix the Influence tab rendering to display full PDF text verbatim across 2 cards, then populate all 130 ailments with comprehensive descriptions from `influences.pdf` while preserving strict medical caution.

## Current State
- `influences.pdf`: 1367 lines, 4-stage content per condition (TCM Framework, Jungian Shadow, Physiological Loop, Clinical Cascade) plus reset instructions.
- `AilmentInfluencePanel.tsx:46`: falls back to core fields (`physiologicalDescription`, `emotionalRoot`, `sarcasticAdvice`, `metaphor`) when `influenceLayers` is missing — creates mismatched content.
- 108/130 ailments have 5 abbreviated `influenceLayers` (~100–250 chars each). 22 ailments have 0 layers.
- `physiologicalDescription` in `ailments-core.json` is short (1–3 sentences) for all 130 ailments.

## Render Decision (User Confirmed: Option A)
- **2-section items** (TCM + Jungian only): render **1 card** titled *"The Deeper Context"* with subheadings.
- **4-section items**: render **2 cards**:
  - Card 1: *"Mind & Symbolism"* (TCM Framework + Jungian Shadow)
  - Card 2: *"Somatic Mechanics"* (Physiological Loop + Clinical Cascade)
- **No fallback padding**: display actual PDF text verbatim; if layers are missing, show nothing or a single placeholder. Do not append core fields.

## Implementation Steps

### Step 1: Fix Influence Tab Rendering
**File:** `src/components/ailments/panels/AilmentInfluencePanel.tsx`

1. Replace the `[1,2,3,4,5].map(...)` loop with conditional rendering based on `influenceLayers` length:
   - If 2 layers: render 1 card with both sections and subheadings.
   - If 4+ layers: render 2 cards as specified above.
   - If 0 layers: render nothing or placeholder text.
2. Remove the core-field fallback mapping from line 46. Pass only `enriched` to `getStructuredInfluenceText`.

### Step 2: Populate influenceLayers in Detail JSONs
**Files:** All 8 files under `src/data/ailments/*-detail.json`

For each of the 130 ailments:

1. Extract PDF text by matching condition title/ID (case-insensitive).
2. Parse into 4 `influenceLayers` entries with title, tag, and full multi-paragraph text from the PDF.
3. For 22 ailments missing `influenceLayers`: add `structuredContent` with `influenceLayers` + `reset`, preserving existing `tones`, `biologyPath`, and `medical_safety`.
4. For 108 ailments with abbreviated layers: replace short paragraphs with full PDF text verbatim.

Data mapping:
- PDF Stage 1 → `influenceLayers[0]` (TCM Framework)
- PDF Stage 2 → `influenceLayers[1]` (Jungian Shadow)
- PDF Stage 3 → `influenceLayers[2]` (Physiological Loop)
- PDF Stage 4 → `influenceLayers[3]` (Clinical Cascade)

### Step 3: Expand physiologicalDescription in core.json
**File:** `src/data/ailments-core.json`

- Expand each `physiologicalDescription` to 2–4 sentences using existing core text + PDF Stage 4 mechanisms.
- Use cautious phrasing: "can involve", "may contribute to", "can be influenced by".
- **Boundary**: Do not inject TCM, Jungian, or symbolic content into `physiologicalDescription`.

### Step 4: Expand biologyPathway and interpretations.clinical
**Files:** All 8 detail JSONs

- Expand `biologyPathway[*].detail` with Stage 3 mechanisms (nerves, receptors, hormones) where currently too brief.
- Append missing Stage 4 associations to `interpretations.clinical.sections[*].body` as additional bullets.
- Preserve `interpretations.witty` and `interpretations.brutal` unchanged.

### Step 5: Validation
1. Typecheck: `npx tsc --noEmit`.
2. Spot-check 10 ailments across categories:
   - `influenceLayers` renders as 1–2 cards with full verbatim text.
   - No core field fallbacks appear in Influence tab.
   - `physiologicalDescription` is expanded and contains no speculative/TCM content.
   - `medical_safety` and `naturalSupport` are untouched.
3. Grep `influenceLayers` JSON to confirm TCM/Jungian terms are not in `physiologicalDescription` or `medical_safety`.

## Out of Scope
- Changing tab navigation or component layout beyond `AilmentInfluencePanel.tsx`.
- Adding new ailments or categories.
- Modifying `hapticProfile` or `uiBackgroundAccent` (not rendered in UI).
