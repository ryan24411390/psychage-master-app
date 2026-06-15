import { describe, expect, it } from 'vitest';

import { rankBySharedTags } from '@/lib/articles/ranking';

type Row = { slug: string; tags: readonly string[] };
const row = (slug: string, tags: string[]): Row => ({ slug, tags });

describe('rankBySharedTags', () => {
  it('orders by descending shared-tag overlap', () => {
    const items: Row[] = [row('none', ['x', 'y']), row('one', ['a', 'z']), row('two', ['a', 'b'])];
    const ranked = rankBySharedTags(items, ['a', 'b']);
    expect(ranked.map((r) => r.slug)).toEqual(['two', 'one', 'none']);
  });

  it('is stable for equal overlap (keeps newest-first input order)', () => {
    const items: Row[] = [row('first', ['a']), row('second', ['a']), row('third', [])];
    const ranked = rankBySharedTags(items, ['a']);
    expect(ranked.map((r) => r.slug)).toEqual(['first', 'second', 'third']);
  });

  it('returns an unchanged shallow copy when no tags are given', () => {
    const items: Row[] = [row('a', ['x']), row('b', ['y'])];
    const ranked = rankBySharedTags(items, []);
    expect(ranked).toEqual(items);
    expect(ranked).not.toBe(items);
  });

  it('does not mutate the input array', () => {
    const items: Row[] = [row('a', ['x']), row('b', ['x', 'y'])];
    const snapshot = [...items];
    rankBySharedTags(items, ['x', 'y']);
    expect(items).toEqual(snapshot);
  });

  it('keeps zero-overlap items last, in their original order', () => {
    const items: Row[] = [row('hit', ['a']), row('miss1', []), row('miss2', [])];
    const ranked = rankBySharedTags(items, ['a']);
    expect(ranked.map((r) => r.slug)).toEqual(['hit', 'miss1', 'miss2']);
  });
});
