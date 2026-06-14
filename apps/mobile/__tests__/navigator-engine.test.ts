import { runSymptomNavigator } from '@psychage/shared/navigator';
import { describe, expect, it } from 'vitest';

import { NAVIGATOR_KB } from '@/features/navigator/kb.fixtures';

// Integration: the REAL shared engine against the fixture KB (Vitest transforms the
// shared package; mirrors __tests__/navigator-seam.test.ts). Pins the structural
// guarantees PR B depends on — the cap, the closed vocabulary, and the CRISIS halt.

const CLOSED_VOCAB = new Set(['Possible', 'Likely', 'Strong match']);

describe('navigator engine on the fixture KB', () => {
  it('SACRED CAP: no relevance_score ever exceeds 0.75', () => {
    const out = runSymptomNavigator(
      [
        { symptom_id: 'low_mood', duration: 'more_than_1_year', frequency: 'always' },
        { symptom_id: 'lost_interest', duration: 'more_than_1_year', frequency: 'always' },
        { symptom_id: 'low_energy', duration: 'more_than_1_year', frequency: 'always' },
      ],
      NAVIGATOR_KB,
      undefined,
      () => true,
    );
    expect(out.results.length).toBeGreaterThan(0);
    for (const r of out.results) {
      expect(r.relevance_score).toBeLessThanOrEqual(0.75);
    }
  });

  it('relevance labels stay inside the closed vocabulary (Possible · Likely · Strong match)', () => {
    const out = runSymptomNavigator(
      [
        { symptom_id: 'low_mood' },
        { symptom_id: 'lost_interest' },
      ],
      NAVIGATOR_KB,
      undefined,
      () => true,
    );
    for (const r of out.results) {
      expect(CLOSED_VOCAB.has(r.relevance_label)).toBe(true);
    }
  });

  it('a CRISIS-flagged selection halts the engine (should_halt, no results)', () => {
    const out = runSymptomNavigator(
      [{ symptom_id: 'low_mood' }, { symptom_id: 'unsafe_thoughts' }],
      NAVIGATOR_KB,
      undefined,
      () => true,
    );
    expect(out.safety.should_halt).toBe(true);
    expect(out.safety.has_crisis).toBe(true);
    expect(out.results).toEqual([]);
  });
});
