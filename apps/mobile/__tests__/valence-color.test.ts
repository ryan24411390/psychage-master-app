import { describe, expect, it } from 'vitest';

import { VALENCE_HEX, valenceColorAt } from '@/lib/colors';

// Pure interpolation twin of the Reanimated UI-thread colour the feeling shape
// uses. The 5 anchors are the navy→warm-neutral→teal valence ramp (exception #2).
describe('valenceColorAt', () => {
  it('returns the anchor colour at each integer valence', () => {
    expect(valenceColorAt(1)).toBe(VALENCE_HEX[0]?.toLowerCase());
    expect(valenceColorAt(3)).toBe(VALENCE_HEX[2]?.toLowerCase());
    expect(valenceColorAt(5)).toBe(VALENCE_HEX[4]?.toLowerCase());
  });

  it('clamps out-of-range positions to the end anchors', () => {
    expect(valenceColorAt(0)).toBe(VALENCE_HEX[0]?.toLowerCase());
    expect(valenceColorAt(-3)).toBe(VALENCE_HEX[0]?.toLowerCase());
    expect(valenceColorAt(9)).toBe(VALENCE_HEX[4]?.toLowerCase());
  });

  it('linearly interpolates between two anchors at the midpoint', () => {
    // mid of #22304A (34,48,74) and #42505E (66,80,94) = (50,64,84) = #324054
    expect(valenceColorAt(1.5)).toBe('#324054');
  });

  it('always returns a 6-digit lowercase hex', () => {
    for (let t = 1; t <= 5; t += 0.2) {
      expect(valenceColorAt(t)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
