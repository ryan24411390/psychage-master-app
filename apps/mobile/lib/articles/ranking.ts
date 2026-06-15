// Pure ranking helper for "related articles" — orders a candidate pool by how
// many tags each item shares with the source article. No I/O: the repo's network
// glue stays untested, this carries the testable logic (the same pure/glue split
// the mapper follows). The sort is stable — items with equal overlap keep their
// input order (callers pass newest-first) — made explicit with an original-index
// tiebreak so it never relies on the engine's Array.sort stability.

/**
 * Return `items` ordered by descending shared-tag count with `tags`. Pure: a new
 * array is returned and `items` is never mutated. With no `tags`, returns an
 * unchanged shallow copy (nothing to rank by).
 */
export function rankBySharedTags<T extends { readonly tags: readonly string[] }>(
  items: readonly T[],
  tags: readonly string[],
): T[] {
  if (tags.length === 0) return [...items];
  const wanted = new Set(tags);
  return items
    .map((item, index) => ({
      item,
      index,
      overlap: item.tags.reduce((count, tag) => (wanted.has(tag) ? count + 1 : count), 0),
    }))
    .sort((a, b) => b.overlap - a.overlap || a.index - b.index)
    .map((scored) => scored.item);
}
