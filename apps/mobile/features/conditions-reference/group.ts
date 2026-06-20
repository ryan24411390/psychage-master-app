// Pure A–Z grouping + filtering for the Conditions index. No React, no RN — so the
// index logic (section order, scrubber jump targets, search, family filter) is unit
// testable in isolation. The view flattens conditions into a single list of header +
// row items so one FlashList renders sticky section headers AND the scrubber can
// scrollToIndex a letter's header (stack rule: FlashList for any list > 20 items).

import type { Condition } from './types';

export type IndexItem =
  | { readonly type: 'header'; readonly letter: string }
  | { readonly type: 'row'; readonly condition: Condition };

/** First letter A–Z, or '#' for anything not starting with a Latin letter. */
export function letterOf(name: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  return first >= 'A' && first <= 'Z' ? first : '#';
}

export interface BuiltIndex {
  /** Flattened header+row stream for the list. */
  readonly items: readonly IndexItem[];
  /** Letters that actually have rows, in display order (A–Z then '#'). */
  readonly letters: readonly string[];
  /** letter → index of its header in `items` (for scrubber scrollToIndex). */
  readonly letterToIndex: Readonly<Record<string, number>>;
  /** Indices of header items (for FlashList stickyHeaderIndices). */
  readonly stickyIndices: readonly number[];
}

/**
 * Group already-sorted conditions into an A–Z section stream. Input is expected sorted
 * by name (queries sort by name); a defensive localeCompare sort is applied anyway so
 * the helper is order-independent. '#' (non-letter) sorts last.
 */
export function buildIndex(conditions: readonly Condition[]): BuiltIndex {
  const sorted = [...conditions].sort((a, b) => a.name.localeCompare(b.name));

  const byLetter = new Map<string, Condition[]>();
  for (const c of sorted) {
    const l = letterOf(c.name);
    const bucket = byLetter.get(l);
    if (bucket) bucket.push(c);
    else byLetter.set(l, [c]);
  }

  const letters = [...byLetter.keys()].sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });

  const items: IndexItem[] = [];
  const letterToIndex: Record<string, number> = {};
  const stickyIndices: number[] = [];
  for (const letter of letters) {
    letterToIndex[letter] = items.length;
    stickyIndices.push(items.length);
    items.push({ type: 'header', letter });
    for (const condition of byLetter.get(letter) ?? []) {
      items.push({ type: 'row', condition });
    }
  }

  return { items, letters, letterToIndex, stickyIndices };
}

/** Distinct ICD-11 family groupings present, alphabetical — powers the family filter. */
export function extractFamilies(conditions: readonly Condition[]): string[] {
  const set = new Set<string>();
  for (const c of conditions) {
    const g = c.icd11_grouping?.trim();
    if (g) set.add(g);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Client-side filter over the fetched rows: free-text (name + ICD-11 code) and an
 * optional exact ICD-11 family. Both narrow; an empty query / null family is a no-op.
 */
export function filterConditions(
  conditions: readonly Condition[],
  query: string,
  family: string | null,
): Condition[] {
  const q = query.trim().toLowerCase();
  return conditions.filter((c) => {
    if (family && c.icd11_grouping !== family) return false;
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) || c.icd11_code.toLowerCase().includes(q)
    );
  });
}
