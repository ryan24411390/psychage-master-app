import { describe, expect, it } from 'vitest';

import { getCategoryLabel, scoreChronotype } from '../chronotype';

describe('scoreChronotype — rMEQ', () => {
  it('throws unless exactly 5 answers are given (no partial scoring)', () => {
    expect(() => scoreChronotype([5, 5, 4, 5])).toThrow();
    expect(() => scoreChronotype([5, 5, 4, 5, 6, 1])).toThrow();
  });

  it('maps a high total to definitely-morning → lion', () => {
    const r = scoreChronotype([5, 5, 4, 5, 6]); // 25
    expect(r.score).toBe(25);
    expect(r.category).toBe('definitely_morning');
    expect(r.animal).toBe('lion');
    expect(r.ideal_bedtime).toBe('21:30');
  });

  it('maps a moderate-morning total to lion', () => {
    const r = scoreChronotype([4, 4, 4, 4, 4]); // 20 → moderately_morning
    expect(r.category).toBe('moderately_morning');
    expect(r.animal).toBe('lion');
  });

  it('"neither" with decent morning alertness maps to bear', () => {
    const r = scoreChronotype([3, 3, 4, 2, 2]); // 14, Q3=4 → bear
    expect(r.category).toBe('neither');
    expect(r.animal).toBe('bear');
  });

  it('"neither" with poor morning alertness (Q3 ≤ 2) maps to dolphin', () => {
    const r = scoreChronotype([3, 3, 2, 3, 3]); // 14, Q3=2 → dolphin
    expect(r.category).toBe('neither');
    expect(r.animal).toBe('dolphin');
  });

  it('maps low totals to evening categories → wolf', () => {
    expect(scoreChronotype([2, 2, 2, 2, 2]).animal).toBe('wolf'); // 10 moderately_evening
    expect(scoreChronotype([1, 1, 1, 1, 0]).category).toBe('definitely_evening'); // 4
    expect(scoreChronotype([1, 1, 1, 1, 0]).animal).toBe('wolf');
  });
});

describe('getCategoryLabel', () => {
  it('returns human labels', () => {
    expect(getCategoryLabel('definitely_morning')).toBe('Definitely Morning');
    expect(getCategoryLabel('neither')).toBe('Neither');
  });
});
