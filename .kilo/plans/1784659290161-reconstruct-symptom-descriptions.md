# Plan: Reconstruct Symptom Descriptions from influences.pdf

## Goal
Enrich the app's symptom descriptions by reintegrating comprehensive information from `public/influences.pdf` into the existing data layer, while preserving strict medical caution (no cures, treatments, or medical certainties).

## Current State
- `src/data/ailments-core.json` holds 130 `AilmentCore` records. The `physiologicalDescription` fields are short summaries (1–3 sentences).
- 8 category detail files (`src/data/ailments/*-detail.json`) hold extended `AilmentDetail` records. ~112 ailments already have `structuredContent` (biologyPathway, interpretations, influenceLayers, reset, hardware, etc.). ~18 ailments have **no structuredContent**.
- `influences.pdf` (1367 lines) provides deep content for each condition: haptic/UI configs, 4-stage translations (TCM framework, Jungian shadow, physiological loop, clinical cascade), and reset instructions.

## Scope
1. **Populate missing structuredContent** for the 18 ailments that currently have empty `structuredContent`.
2. **Expand `physiologicalDescription`** in `ailments-core.json` for all 130 ailments, using the PDF's Stage 4 Clinical Cascade detail while keeping the existing clinical-cautious tone.
3. **Align existing structuredContent** in detail files where it diverges from the PDF source.

## Design Decisions

### Medical Caution Rules
- **Never** claim a cure, treatment, or medical certainty.
- Use tentative language: "can involve", "may contribute to", "is associated with", "can be influenced by".
- Keep TCM/Jungian/mind-body content strictly in `influenceLayers`, `interpretations`, and `emotionalRoot`. Do not place speculative frameworks inside `physiologicalDescription`, `biologyPathway.detail`, or any safety-critical field.
- All red flags, emergency signs, and "seek care" guidance must be preserved verbatim from existing data or enhanced, never reduced.
- Every `naturalSupport.disclaimer` and `medical_safety.disclaimer` must remain or be inherited.

### Data Mapping (PDF → App Schema)
| PDF Section | App Field(s) | Notes |
|---|---|---|
| HARDWARE CONFIG (haptic, UI accent) | `structuredContent.hardware.*` | Directly mappable; some already exist |
| Stage 1 — TCM Framework | `influenceLayers[0-1]` | Label as TCM in title/tag |
| Stage 2 — Jungian Shadow | `influenceLayers[1-2]` | Label as shadow archetype in tag |
| Stage 3 — Physiological Loop | `biologyPathway[*]` entries | Rewrite in clinical tone |
| Stage 4 — Clinical Cascade | `physiologicalDescription` (core.json) + final `biologyPathway` step | This is the medically-grounded portion; safe to surface as primary description |
| Reset Title/Modality/Steps | `structuredContent.reset.*` | Directly mappable |
| `sarcasticAdvice` / `mindfulnessPrompts` | Already exist in core.json; match against PDF and update where too short |
| `physicalTherapyTip` | Already exist in core.json; update where overly brief vs PDF |

### Ailments Requiring New structuredContent (18 total)
- **Back & Shoulders**: `lower-back-pain`, `shoulder-tension`, `back-upper`, `back-middle`, `back-lower`
- **Chest & Breathing**: `heart-palpitations`, `lung-problems`, `pneumonia`
- **General & Energy**: `chronic-fatigue`, `balance-loss`, `stroke`
- **Head & Neck**: `headache`, `migraine-headache`, `wisdom-tooth-impacted`
- **Limbs & Joints**: `finger-thumb`, `finger-index`
- **Metabolic & Endocrine**: `appetite-loss`
- **Skin & Sleep**: `chronic-insomnia`
- **Stomach & Gut**: `bed-wetting` (childhood), `stomach-intestinal-problems`

### Align Existing Content
- For ailments already having `structuredContent`, compare `biologyPathway` and `influenceLayers` against the PDF. Where the PDF expands with additional clinical mechanisms (e.g., specific hormones, nerves, receptors), append those details as new `biologyPathway` entries or expand existing `detail` fields.
- Expand `physiologicalDescription` in core.json using the PDF's Stage 4 text, rewritten to be concise yet comprehensive (target: 2–4 sentences).

## Implementation Steps

1. **Parse PDF into structured JSON** (`/tmp/pdf-parsed.json`)
   - Extract ailment entries keyed by ID/slug.
   - Preserve haptic, Stage 1–4, reset, and any ad-hoc sections (e.g., "INFLUENCE — The Deeper Context").
   - Output a deterministic JSON file for consumption by the enrichment agent.

2. **Generate missing structuredContent**
   - For each of the 18 missing ailments, write a script/agent that reads the parsed PDF entry and produces a `structuredContent` object conforming to `src/types/dictionary.ts`.
   - Populate: `hardware`, `hero`, `biologyPathway`, `interpretations` (clinical/witty/brutal), `influenceLayers`, `reset`, `naturalSupport`, `brutalActions`.
   - Ensure medical-cautious language is applied (tentative phrasing, no cure claims).

3. **Expand core.json physiologicalDescription**
   - For all 130 ailments, read current `physiologicalDescription` and the corresponding PDF Stage 4 text.
   - Rewrite/expand so the description covers: possible causes/mechanisms, symptom range, and necessary red flags — without adding cure/treatment language.
   - Preserve existing safety phrasing.

4. **Enrich existing detail files**
   - Diff current `biologyPathway` and `influenceLayers` against parsed PDF.
   - Insert missing stages/entires where length or detail is lacking.
   - Do not overwrite tone-specific `interpretations` unless the existing text is clearly truncated relative to the PDF.

5. **Typecheck & lint**
   - Run `npx tsc --noEmit` (or repo-equivalent) to validate all new/updated JSON against TypeScript interfaces.
   - Re-run any existing JSON schema or lint checks.

6. **Validation**
   - Spot-check 10 ailments across categories for completeness: core description expanded, detail structuredContent present, medical caution preserved.
   - Ensure no PDF content was injected into `medical_safety` fields that would create liability.

## Risk Assessment
- **Speculative content leakage**: TCM/Jungian text must stay in `influenceLayers`/`emotionalRoot`/`interpretations`, never in `physiologicalDescription` or safety fields. Mitigation: code-review checklist + automated grep for TCM terms in core `physiologicalDescription`.
- **Over-expansion**: Expanded descriptions could bloat the UI. Mitigation: expand core descriptions by ~2x max; reserve full 4-stage depth for the detail panel (`AilmentTonePanel`, `AilmentInfluencePanel`, `ilmentSafetyPanel`).
- **PDF coverage mismatch**: Not all ailments in the app have PDF entries. Mitigation: leave those untouched except for minor tightening where possible.
- **Medical liability**: Any language that sounds like a prescription or guarantee must be caught. Mitigation: maintain the existing `medical_safety.disclaimer` and `naturalSupport.disclaimer` on every item.

## Out of Scope
- Changing the UI layout or component behavior (e.g., how detail panels render).
- Adding new ailments not present in `ailments-core.json`.
- Modifying search indexing or routing.
