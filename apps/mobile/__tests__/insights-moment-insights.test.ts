import type { Moment } from '@psychage/shared/engagement';
import { describe, expect, it } from 'vitest';

import { descriptorCounts, impactCounts, valenceSeries } from '@/features/insights/moment-insights';

// Pure projections of raw Moments into the shared chart primitives. Uses keys NOT in the
// curated vocab so the resolved display label falls back to the key — keeping assertions
// independent of the vocabulary.

const m = (
  timestamp: string,
  valence: 1 | 2 | 3 | 4 | 5,
  labels: string[] = [],
  context: string[] = [],
): Moment => ({ id: timestamp, timestamp, valence, labels, context, routedToSupport: false }) as Moment;

describe('valenceSeries', () => {
  it('maps moments oldest→newest to {x: timestamp, y: valence}', () => {
    const out = valenceSeries([
      m('2026-06-16T10:00:00.000Z', 4),
      m('2026-06-14T10:00:00.000Z', 2),
    ]);
    expect(out).toEqual([
      { x: '2026-06-14T10:00:00.000Z', y: 2 },
      { x: '2026-06-16T10:00:00.000Z', y: 4 },
    ]);
  });

  it('applies the cutoff (range filter)', () => {
    const cutoff = Date.parse('2026-06-15T00:00:00.000Z');
    const out = valenceSeries(
      [m('2026-06-14T10:00:00.000Z', 2), m('2026-06-16T10:00:00.000Z', 4)],
      cutoff,
    );
    expect(out).toEqual([{ x: '2026-06-16T10:00:00.000Z', y: 4 }]);
  });
});

describe('descriptorCounts / impactCounts', () => {
  it('tallies feeling words by frequency, most-noted first', () => {
    const out = descriptorCounts([
      m('2026-06-16T10:00:00.000Z', 3, ['k_calm', 'k_tired']),
      m('2026-06-15T10:00:00.000Z', 3, ['k_calm']),
    ]);
    expect(out).toEqual([
      { label: 'k_calm', value: 2 },
      { label: 'k_tired', value: 1 },
    ]);
  });

  it('tallies impacts (context) the same way', () => {
    const out = impactCounts([
      m('2026-06-16T10:00:00.000Z', 3, [], ['k_work', 'k_sleep']),
      m('2026-06-15T10:00:00.000Z', 3, [], ['k_work']),
    ]);
    expect(out[0]).toEqual({ label: 'k_work', value: 2 });
  });

  it('honors the top-N limit', () => {
    const out = descriptorCounts([m('2026-06-16T10:00:00.000Z', 3, ['a', 'b', 'c'])], 0, 2);
    expect(out).toHaveLength(2);
  });
});
