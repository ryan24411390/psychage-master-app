// Acute-handoff predicate tests (SR-2). The predicate is pure: lowest valence AND a
// crisis-adjacent label → route into the (ungated) crisis surface. Neither condition
// alone routes, so the signal stays meaningful and doesn't over-trigger.

import { describe, expect, it } from 'vitest';

import { CRISIS_ADJACENT_LABEL_KEYS, LOWEST_VALENCE, VALENCE_LABELS } from '@/features/moments/constants';
import { shouldRouteToSupport } from '@/features/moments/acute';

const crisisWord = [...CRISIS_ADJACENT_LABEL_KEYS][0] as string;

describe('shouldRouteToSupport', () => {
  it('routes at lowest valence WITH a crisis-adjacent label', () => {
    expect(shouldRouteToSupport({ valence: LOWEST_VALENCE, labels: [crisisWord] })).toBe(true);
  });

  it('does NOT route on lowest valence alone (no crisis label)', () => {
    expect(shouldRouteToSupport({ valence: LOWEST_VALENCE, labels: ['numb'] })).toBe(false);
    expect(shouldRouteToSupport({ valence: LOWEST_VALENCE, labels: [] })).toBe(false);
  });

  it('does NOT route on a crisis label at a higher valence', () => {
    expect(shouldRouteToSupport({ valence: 3, labels: [crisisWord] })).toBe(false);
    expect(shouldRouteToSupport({ valence: 5, labels: [crisisWord] })).toBe(false);
  });

  it('handles an undefined labels array (minimal capture)', () => {
    expect(shouldRouteToSupport({ valence: LOWEST_VALENCE })).toBe(false);
  });

  it('the crisis-adjacent keys are a subset of the lowest-valence vocabulary', () => {
    // Sanity: every crisis word must be a selectable label at the lowest band, else it
    // could never co-occur with LOWEST_VALENCE and the predicate would be dead.
    const lowestKeys = new Set(VALENCE_LABELS[LOWEST_VALENCE].map((l) => l.key));
    for (const key of CRISIS_ADJACENT_LABEL_KEYS) {
      expect(lowestKeys.has(key)).toBe(true);
    }
  });
});
