// Tests for the Learn topic-index bucketing (groupCategories) and the card
// routing helper (categoryHrefBySlug). The bucketing is the invariant the 3-group
// switcher rests on: every populated category must appear under exactly one group.
// Zero-content exclusion is NOT tested here — it is an upstream guarantee
// (listBrowseCategories filters articleCount > 0; see browse-categories.test.ts).
import { describe, expect, it } from 'vitest';

import { categoryHrefBySlug } from '@/features/learn/category-route';
import { groupCategories, guideCount, LEARN_GROUP_ORDER } from '@/features/learn/group-buckets';
import type { BrowseCategory } from '@/lib/articles';

function cat(slug: string, group: string, articleCount = 3): BrowseCategory {
  return { slug, name: slug, icon: null, color: null, displayOrder: 0, articleCount, group };
}

describe('groupCategories — Learn topic-index partition', () => {
  const sample: BrowseCategory[] = [
    cat('anxiety-stress', 'Conditions & Disorders'),
    cat('emotional-regulation', 'Behavior & Wellness'),
    cat('relationships-social', 'Life & Society'),
    cat('depression-mood', 'Conditions & Disorders'),
    cat('digital-life', 'Behavior & Wellness'),
  ];

  it('covers every category exactly once (total partition — no drops, no duplicates)', () => {
    const { orderedGroups, byGroup } = groupCategories(sample);
    const flattened = orderedGroups.flatMap((g) => byGroup.get(g) ?? []);
    expect(flattened).toHaveLength(sample.length);
    expect(flattened.map((c) => c.slug).sort()).toEqual(sample.map((c) => c.slug).sort());
    const seen = new Set<string>();
    for (const c of flattened) {
      expect(seen.has(c.slug)).toBe(false);
      seen.add(c.slug);
    }
  });

  it('orders present groups by LEARN_GROUP_ORDER and omits empty groups', () => {
    expect(groupCategories(sample).orderedGroups).toEqual([...LEARN_GROUP_ORDER]);
    // A group with no categories never appears (so the switcher has no empty tab).
    expect(groupCategories([cat('x', 'Behavior & Wellness')]).orderedGroups).toEqual([
      'Behavior & Wellness',
    ]);
  });

  it('surfaces an unexpected group label (appended last) so nothing is dropped', () => {
    const withOrphan = [...sample, cat('mystery', 'Future Group')];
    const { orderedGroups, byGroup } = groupCategories(withOrphan);
    expect(orderedGroups.at(-1)).toBe('Future Group');
    expect(byGroup.get('Future Group')).toHaveLength(1);
    expect(orderedGroups.flatMap((g) => byGroup.get(g) ?? [])).toHaveLength(withOrphan.length);
  });

  it('returns no groups for an empty taxonomy', () => {
    expect(groupCategories([]).orderedGroups).toEqual([]);
  });
});

describe('categoryHrefBySlug — card routing', () => {
  it('condition-focused slug → /conditions/[slug]', () => {
    expect(categoryHrefBySlug('anxiety-stress')).toBe('/conditions/anxiety-stress');
  });

  it('wellness slug (no Navigator conditions) → /learn/[slug]', () => {
    expect(categoryHrefBySlug('emotional-regulation')).toBe('/learn/emotional-regulation');
  });

  it('orphan slug (absent from reviewed taxonomy) → /learn/[slug]', () => {
    expect(categoryHrefBySlug('eating-body')).toBe('/learn/eating-body');
  });
});

describe('guideCount', () => {
  it('pluralizes the live count', () => {
    expect(guideCount(1)).toBe('1 guide');
    expect(guideCount(2)).toBe('2 guides');
    expect(guideCount(12)).toBe('12 guides');
  });
});
