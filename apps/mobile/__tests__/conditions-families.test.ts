import { describe, expect, it } from 'vitest';

import {
  filterConditions,
  groupByFamily,
  ICD11_FAMILY_ORDER,
} from '@/lib/conditions/families';
import type { ConditionRef } from '@/lib/conditions/types';

// The Conditions accordion is driven by groupByFamily over the live taxonomy. Its
// contract: families in canonical ICD-11 order, member count = group count, members
// alpha-sorted, unknown families appended last, total partition (no drops/dupes).

const ref = (slug: string, name: string, family: string): ConditionRef => ({
  slug,
  name,
  icd11Code: '6X00',
  family,
  crisisFlag: false,
});

describe('conditions families', () => {
  it('orders families by canonical ICD-11 order, not input order', () => {
    const input = [
      ref('mdd', 'Major depressive', 'Mood disorders'),
      ref('asd', 'Autism', 'Neurodevelopmental disorders'),
      ref('gad', 'GAD', 'Anxiety or fear-related disorders'),
    ];
    const groups = groupByFamily(input);
    expect(groups.map((g) => g.family)).toEqual([
      'Neurodevelopmental disorders',
      'Mood disorders',
      'Anxiety or fear-related disorders',
    ]);
  });

  it('counts members and sorts members alphabetically by name', () => {
    const groups = groupByFamily([
      ref('b', 'Bulimia nervosa', 'Feeding or eating disorders'),
      ref('a', 'Anorexia nervosa', 'Feeding or eating disorders'),
      ref('p', 'Pica', 'Feeding or eating disorders'),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.count).toBe(3);
    expect(groups[0]?.members.map((m) => m.name)).toEqual([
      'Anorexia nervosa',
      'Bulimia nervosa',
      'Pica',
    ]);
  });

  it('partitions totally — every input lands in exactly one family', () => {
    const input = [
      ref('a', 'A', 'Mood disorders'),
      ref('b', 'B', 'Mood disorders'),
      ref('c', 'C', 'Catatonia'),
    ];
    const total = groupByFamily(input).reduce((n, g) => n + g.count, 0);
    expect(total).toBe(input.length);
  });

  it('appends an unknown family after the canonical set', () => {
    const groups = groupByFamily([
      ref('x', 'X', 'Some unlisted grouping'),
      ref('m', 'M', 'Mood disorders'),
    ]);
    expect(groups[0]?.family).toBe('Mood disorders');
    expect(groups[groups.length - 1]?.family).toBe('Some unlisted grouping');
  });

  it('every canonical family string is unique', () => {
    expect(new Set(ICD11_FAMILY_ORDER).size).toBe(ICD11_FAMILY_ORDER.length);
  });

  it('filters by family name OR member name, narrowing members to the hits', () => {
    const groups = groupByFamily([
      ref('panic', 'Panic disorder', 'Anxiety or fear-related disorders'),
      ref('gad', 'Generalised anxiety disorder', 'Anxiety or fear-related disorders'),
      ref('mdd', 'Major depressive disorder', 'Mood disorders'),
    ]);
    // member-name match → only the matching member kept
    const byMember = filterConditions(groups, 'panic');
    expect(byMember).toHaveLength(1);
    expect(byMember[0]?.members.map((m) => m.slug)).toEqual(['panic']);
    // family-name match → whole family kept
    const byFamily = filterConditions(groups, 'mood');
    expect(byFamily.map((g) => g.family)).toEqual(['Mood disorders']);
    // blank → unchanged
    expect(filterConditions(groups, '   ')).toHaveLength(groups.length);
    // no match
    expect(filterConditions(groups, 'zzz')).toHaveLength(0);
  });
});
