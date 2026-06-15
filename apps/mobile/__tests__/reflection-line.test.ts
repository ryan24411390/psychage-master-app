import type { CheckInState } from '@psychage/shared/check-in';
import { describe, expect, it } from 'vitest';

import { selectReflectionLine } from '@/features/reflection/reflection-line';

const s = (arr: number[]) => arr as CheckInState[];

// All six outcomes are reachable and deterministic. The selector's only input is one
// week's state multiset, so the banned shapes (cross-week comparison, causes, advice,
// numbers-as-judgment) are structurally impossible — there is no other-week or
// day-of-week input to key off.
describe('selectReflectionLine — shape rules', () => {
  it('seven days noted → every_day', () => {
    expect(selectReflectionLine(s([0, 1, 2, 3, 4, 2, 3]))).toBe('every_day');
  });
  it('exactly three days → quieter_three', () => {
    expect(selectReflectionLine(s([2, 3, 2]))).toBe('quieter_three');
  });
  it('low spread (≤1) → mostly_steady', () => {
    expect(selectReflectionLine(s([2, 2, 3, 2]))).toBe('mostly_steady');
  });
  it('majority low → more_low', () => {
    expect(selectReflectionLine(s([0, 1, 1, 4]))).toBe('more_low');
  });
  it('majority good → more_good', () => {
    expect(selectReflectionLine(s([3, 4, 4, 0]))).toBe('more_good');
  });
  it('no majority, wide spread → mixed', () => {
    expect(selectReflectionLine(s([0, 2, 4, 1]))).toBe('mixed');
  });
  it('empty input falls through to mixed (never throws on min/max)', () => {
    expect(selectReflectionLine([])).toBe('mixed');
  });
});
