import type { BrowseCategory } from '@/lib/articles';

// Fixed presentation order for the three category groups — the classifier in
// @psychage/shared/peaf (getCategoryGroup) emits exactly these strings. Kept as a
// pure module (no React/RN imports) so the partition invariant is unit-testable.
export const LEARN_GROUP_ORDER = [
  'Conditions & Disorders',
  'Behavior & Wellness',
  'Life & Society',
] as const;

const ORDER_SET = new Set<string>(LEARN_GROUP_ORDER);

export type GroupedCategories = {
  /** Groups that actually hold categories — LEARN_GROUP_ORDER first, any
   * unexpected group appended last. Empty groups are omitted. */
  orderedGroups: string[];
  byGroup: Map<string, BrowseCategory[]>;
};

// Bucket the live categories by their group label. The partition is TOTAL: every
// input category lands under exactly one group (no drops, no duplicates), input
// order is preserved within a group, and an unexpected group string — which should
// never occur, the classifier is closed over the three labels — is still surfaced,
// appended after the known order. Empty groups are omitted from `orderedGroups`, so
// the switcher never shows an empty tab.
export function groupCategories(categories: readonly BrowseCategory[]): GroupedCategories {
  const byGroup = new Map<string, BrowseCategory[]>();
  for (const c of categories) {
    const bucket = byGroup.get(c.group);
    if (bucket) bucket.push(c);
    else byGroup.set(c.group, [c]);
  }
  const present = [...byGroup.keys()];
  const orderedGroups = [
    ...LEARN_GROUP_ORDER.filter((g) => byGroup.has(g)),
    ...present.filter((g) => !ORDER_SET.has(g)),
  ];
  return { orderedGroups, byGroup };
}

// Live guide count for a category card. Counts are always > 0 here (zero-content
// categories are filtered upstream in listBrowseCategories); the singular form is
// handled for correctness.
export function guideCount(n: number): string {
  return `${n} ${n === 1 ? 'guide' : 'guides'}`;
}
