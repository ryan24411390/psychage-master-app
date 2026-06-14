import { describe, expect, it } from 'vitest';

import {
  connectingSegments,
  dayA11yLabel,
  entryDotY,
  TERRAIN_BASELINE_Y,
  TERRAIN_MIDLINE_Y,
  type TerrainDay,
  xFor,
} from '@/components/terrain/terrain-geometry';

const STATES = [0, 1, 2, 3, 4] as const;
const day = (value: TerrainDay['value']): TerrainDay => ({ label: 'x', value });

describe('xFor', () => {
  it('centers each column in its slot and scales with width + count', () => {
    expect(xFor(0, 7, 318)).toBeCloseTo((0.5 / 7) * 318, 5);
    expect(xFor(6, 7, 318)).toBeCloseTo((6.5 / 7) * 318, 5);
    expect(xFor(0, 14, 318)).toBeCloseTo((0.5 / 14) * 318, 5);
  });
});

describe('entryDotY', () => {
  it('rises monotonically with state (higher state = smaller y)', () => {
    const ys = STATES.map((s) => entryDotY(s));
    const strictlyDescending = [...ys].sort((a, b) => b - a);
    expect(ys).toEqual(strictlyDescending);
    expect(new Set(ys).size).toBe(ys.length); // strictly (no ties)
  });

  it('keeps every dot above the baseline and within the canvas', () => {
    for (const s of STATES) {
      const y = entryDotY(s);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(TERRAIN_BASELINE_Y);
    }
  });

  it('places the okay state (52% fill) near the midline', () => {
    // 52% fill lands at ~33.3 (≈ v5's yFor(2)=33), just below the 32 midline.
    expect(entryDotY(2)).toBeGreaterThan(TERRAIN_MIDLINE_Y - 3);
    expect(entryDotY(2)).toBeLessThan(TERRAIN_MIDLINE_Y + 3);
  });
});

describe('connectingSegments', () => {
  it('breaks the line at every gap and drops isolated single entries', () => {
    // v5 weekNormal shape: 3, 2, 1, gap, 2, 3, today
    const days = [day(3), day(2), day(1), day(null), day(2), day(3), day('today')];
    expect(connectingSegments(days, 318).map((s) => s.length)).toEqual([3, 2]);
  });

  it('returns no segments when every entry is isolated', () => {
    const days = [day(2), day(null), day(3), day(null), day('today')];
    expect(connectingSegments(days, 318)).toEqual([]);
  });

  it('returns no segments for an empty (first-run) week', () => {
    const days = [...Array(6)].map(() => day(null)).concat(day('today'));
    expect(connectingSegments(days, 318)).toEqual([]);
  });
});

describe('dayA11yLabel', () => {
  it('is tonally flat per day kind', () => {
    expect(dayA11yLabel({ label: 'Tu', fullLabel: 'Tuesday', value: 3 })).toBe('Tuesday: Good.');
    expect(dayA11yLabel({ label: 'Su', fullLabel: 'Sunday', value: null })).toBe('Sunday: no entry.');
    expect(dayA11yLabel({ label: 'We', fullLabel: 'Wednesday', value: 'today' })).toBe(
      'Today: not yet.',
    );
  });

  it('falls back to the short label when no full name is given', () => {
    expect(dayA11yLabel({ label: 'Mo', value: 2 })).toBe('Mo: Okay.');
  });
});
