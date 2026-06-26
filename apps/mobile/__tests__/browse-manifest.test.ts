import { describe, expect, it } from 'vitest';

import {
  BROWSE_CARDS,
  BROWSE_GROUP_ORDER,
  filterBrowseCards,
  groupBrowseCards,
} from '@/features/learn/browse-manifest';

// The Browse grid is driven by this curated manifest (not the live taxonomy), so its
// shape is the contract the screen relies on: a total partition into the three fixed
// groups, unique slugs, and the reference-locked Conditions order.

describe('browse-manifest', () => {
  it('has unique slugs', () => {
    const slugs = BROWSE_CARDS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('assigns every card to one of the three known groups', () => {
    for (const c of BROWSE_CARDS) {
      expect(BROWSE_GROUP_ORDER).toContain(c.group);
    }
  });

  it('partitions totally — grouped counts sum back to the manifest, no drops', () => {
    const { orderedGroups, byGroup } = groupBrowseCards();
    expect(orderedGroups).toEqual([...BROWSE_GROUP_ORDER]);
    const total = orderedGroups.reduce((n, g) => n + (byGroup.get(g)?.length ?? 0), 0);
    expect(total).toBe(BROWSE_CARDS.length);
  });

  it('locks the Conditions & Disorders order to the reference', () => {
    const { byGroup } = groupBrowseCards();
    const conditions = byGroup.get('Conditions & Disorders')?.map((c) => c.slug);
    expect(conditions).toEqual([
      'anxiety-stress',
      'depression-grief',
      'trauma-healing',
      'mental-health-conditions',
      'psychosis-schizophrenia',
      'neurodivergence-adhd-autism',
      'eating-body',
      'chronic-illness-pain',
      'aging-dementia-late-life',
      'ocd-related',
      'substance-addiction',
    ]);
  });

  it('filters by title case-insensitively and returns all on empty query', () => {
    expect(filterBrowseCards(BROWSE_CARDS, '')).toHaveLength(BROWSE_CARDS.length);
    expect(filterBrowseCards(BROWSE_CARDS, '   ')).toHaveLength(BROWSE_CARDS.length);
    const ocd = filterBrowseCards(BROWSE_CARDS, 'ocd');
    expect(ocd.map((c) => c.slug)).toContain('ocd-related');
    expect(filterBrowseCards(BROWSE_CARDS, 'ANXIETY').map((c) => c.slug)).toContain('anxiety-stress');
    expect(filterBrowseCards(BROWSE_CARDS, 'zzzz')).toHaveLength(0);
  });
});
