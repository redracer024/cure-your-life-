import { lensGlossaryEntries, type LensGlossaryEntry } from '../../data/lensGlossary';

export interface LensGlossaryMatch {
  start: number;
  end: number;
  displayedText: string;
  entry: LensGlossaryEntry;
}

interface Variant {
  text: string;
  entryIndex: number;
  caseSensitive: boolean;
}

const ALL_VARIANTS: Variant[] = (() => {
  const variants: Variant[] = [];
  lensGlossaryEntries.forEach((entry, index) => {
    variants.push({ text: entry.term, entryIndex: index, caseSensitive: true });
    for (const alias of entry.aliases ?? []) {
      variants.push({ text: alias, entryIndex: index, caseSensitive: false });
    }
  });
  return variants;
})();

const ENTRY_INDEX_BY_LOWER_TEXT: Map<string, number> = (() => {
  const map = new Map<string, number>();
  for (const variant of ALL_VARIANTS) {
    map.set(variant.text.toLowerCase(), variant.entryIndex);
  }
  return map;
})();

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

function buildRegex(variants: Variant[], flags: string): RegExp | null {
  if (variants.length === 0) return null;
  const ordered = [...variants].sort((a, b) => b.text.length - a.text.length);
  const pattern = `\\b(?:${ordered.map((v) => escapeRegex(v.text)).join('|')})\\b`;
  return new RegExp(pattern, flags);
}

const CASE_SENSITIVE_REGEX = buildRegex(
  ALL_VARIANTS.filter((v) => v.caseSensitive),
  'g'
);

const CASE_INSENSITIVE_REGEX = buildRegex(
  ALL_VARIANTS.filter((v) => !v.caseSensitive),
  'gi'
);

interface ProtectedRange {
  start: number;
  end: number;
}

function getProtectedRanges(text: string): ProtectedRange[] {
  const ranges: ProtectedRange[] = [];
  const urlRegex = /(?:https?:\/\/|www\.)[^\s]+/gi;
  const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  while ((match = emailRegex.exec(text)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  return ranges;
}

function isProtected(index: number, ranges: ProtectedRange[]): boolean {
  return ranges.some((range) => index >= range.start && index < range.end);
}

interface RawMatch {
  start: number;
  end: number;
  entryIndex: number;
  text: string;
}

function collectMatches(regex: RegExp | null, text: string): RawMatch[] {
  if (!regex) return [];
  const matches: RawMatch[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const entryIndex = ENTRY_INDEX_BY_LOWER_TEXT.get(match[0].toLowerCase());
    if (entryIndex === undefined) {
      if (match[0].length === 0) regex.lastIndex++;
      continue;
    }
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      entryIndex,
      text: match[0],
    });
    if (match[0].length === 0) regex.lastIndex++;
  }
  return matches;
}

/**
 * Returns every glossary candidate found in the text, before overlap
 * resolution. Useful for ambiguity audits.
 */
export function collectRawGlossaryMatches(text: string): RawMatch[] {
  const protectedRanges = getProtectedRanges(text);
  const raw = [
    ...collectMatches(CASE_SENSITIVE_REGEX, text),
    ...collectMatches(CASE_INSENSITIVE_REGEX, text),
  ].filter((m) => !isProtected(m.start, protectedRanges));

  return raw.sort((a, b) => a.start - b.start);
}

/**
 * Resolve overlapping candidates so that the longest match wins and no two
 * triggers overlap the same character range.
 */
function resolveMatches(raw: RawMatch[]): RawMatch[] {
  const sorted = [...raw].sort(
    (a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start
  );

  const accepted: RawMatch[] = [];
  for (const candidate of sorted) {
    const overlaps = accepted.some(
      (acceptedMatch) =>
        candidate.start < acceptedMatch.end && candidate.end > acceptedMatch.start
    );
    if (!overlaps) accepted.push(candidate);
  }

  return accepted.sort((a, b) => a.start - b.start);
}

/**
 * Return the resolved, non-overlapping glossary matches for a text string.
 * Longest match wins; matches inside URLs/emails are excluded; the original
 * text is never modified.
 */
export function findLensGlossaryMatches(text: string): LensGlossaryMatch[] {
  const raw = collectRawGlossaryMatches(text);
  const resolved = resolveMatches(raw);

  return resolved.map((match) => ({
    start: match.start,
    end: match.end,
    displayedText: text.slice(match.start, match.end),
    entry: lensGlossaryEntries[match.entryIndex],
  }));
}
