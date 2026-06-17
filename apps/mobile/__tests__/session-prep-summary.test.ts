import { asLocalCalendarDate, type Moment, type MomentValence } from '@psychage/shared/engagement';
import { describe, expect, it } from 'vitest';

import {
  bucketForHour,
  buildSessionPrepSummary,
} from '@/features/therapist/session-prep/summary';

// The aggregation is PURE — these prove the counts/ranges/buckets are correct, that
// EVERY note survives (hard moments included, no positive-filter), and that ordering is
// deterministic (so the document snapshot downstream is stable).

const WINDOW = { from: asLocalCalendarDate('2026-06-01'), to: asLocalCalendarDate('2026-06-30') };

// Build a moment with a LOCAL capture time. `new Date(y,mo,d,h).toISOString()` bakes in
// the machine offset, so re-reading local getHours() round-trips to `hour` on any TZ —
// keeping time-of-day bucketing deterministic in CI.
let seq = 0;
function moment(
  valence: MomentValence,
  opts: {
    hour?: number;
    day?: number;
    labels?: string[];
    context?: string[];
    note?: string;
  } = {},
): Moment {
  seq += 1;
  const iso = new Date(2026, 5, opts.day ?? 10, opts.hour ?? 9, 0, 0).toISOString();
  const base = {
    id: `m-${seq}`,
    timestamp: iso,
    valence,
    labels: opts.labels ?? [],
    context: opts.context ?? [],
    routedToSupport: false,
  };
  return opts.note !== undefined ? { ...base, note: opts.note } : base;
}

describe('buildSessionPrepSummary', () => {
  it('echoes the window and total count', () => {
    const s = buildSessionPrepSummary([moment(3), moment(4)], WINDOW);
    expect(s.window).toEqual(WINDOW);
    expect(s.totalCount).toBe(2);
  });

  it('counts feeling-label frequency, most-noted first (ties broken by key)', () => {
    const s = buildSessionPrepSummary(
      [
        moment(2, { labels: ['anxious', 'tense'] }),
        moment(2, { labels: ['anxious'] }),
        moment(4, { labels: ['calm'] }),
      ],
      WINDOW,
    );
    expect(s.feelingFrequency).toEqual([
      { key: 'anxious', count: 2 },
      // calm and tense both 1 → tie broken by key ascending (calm < tense).
      { key: 'calm', count: 1 },
      { key: 'tense', count: 1 },
    ]);
  });

  it('counts context-domain frequency, most-noted first', () => {
    const s = buildSessionPrepSummary(
      [
        moment(3, { context: ['work', 'sleep'] }),
        moment(2, { context: ['work'] }),
        moment(4, { context: ['family'] }),
      ],
      WINDOW,
    );
    expect(s.contextFrequency).toEqual([
      { key: 'work', count: 2 },
      { key: 'family', count: 1 },
      { key: 'sleep', count: 1 },
    ]);
  });

  it('reports the valence range and a zero-filled distribution', () => {
    const s = buildSessionPrepSummary(
      [moment(1), moment(3), moment(3), moment(5)],
      WINDOW,
    );
    expect(s.valence.min).toBe(1);
    expect(s.valence.max).toBe(5);
    expect(s.valence.distribution).toEqual({ 1: 1, 2: 0, 3: 2, 4: 0, 5: 1 });
  });

  it('breaks moments down by time of day (local capture hour)', () => {
    const s = buildSessionPrepSummary(
      [
        moment(3, { hour: 8 }), // morning
        moment(3, { hour: 9 }), // morning
        moment(3, { hour: 14 }), // afternoon
        moment(3, { hour: 19 }), // evening
        moment(3, { hour: 23 }), // night
        moment(3, { hour: 2 }), // night
      ],
      WINDOW,
    );
    expect(s.timeOfDay).toEqual({ morning: 2, afternoon: 1, evening: 1, night: 2 });
  });

  it('keeps EVERY note (hard moments included), oldest first, and skips blank notes', () => {
    const s = buildSessionPrepSummary(
      [
        moment(1, { day: 12, hour: 22, note: 'could not sleep, mind racing' }),
        moment(4, { day: 10, hour: 8, note: 'good walk this morning' }),
        moment(2, { day: 11, hour: 13, note: '   ' }), // whitespace-only → dropped
        moment(3, { day: 11, hour: 9 }), // no note → dropped
      ],
      WINDOW,
    );
    expect(s.notes.map((n) => n.note)).toEqual([
      'good walk this morning', // Jun 10 08:00
      'could not sleep, mind racing', // Jun 12 22:00
    ]);
    // The low-valence (hard) note is present — never positive-filtered.
    expect(s.notes.some((n) => n.valence === 1)).toBe(true);
    expect(s.notes[0]?.date).toBe('2026-06-10');
  });

  it('handles an empty window: zeros, null range, empty lists', () => {
    const s = buildSessionPrepSummary([], WINDOW);
    expect(s.totalCount).toBe(0);
    expect(s.feelingFrequency).toEqual([]);
    expect(s.contextFrequency).toEqual([]);
    expect(s.valence).toEqual({
      min: null,
      max: null,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
    expect(s.timeOfDay).toEqual({ morning: 0, afternoon: 0, evening: 0, night: 0 });
    expect(s.notes).toEqual([]);
  });
});

describe('bucketForHour', () => {
  it('maps hours to the four parts of the day at the boundaries', () => {
    expect(bucketForHour(5)).toBe('morning');
    expect(bucketForHour(11)).toBe('morning');
    expect(bucketForHour(12)).toBe('afternoon');
    expect(bucketForHour(16)).toBe('afternoon');
    expect(bucketForHour(17)).toBe('evening');
    expect(bucketForHour(20)).toBe('evening');
    expect(bucketForHour(21)).toBe('night');
    expect(bucketForHour(0)).toBe('night');
    expect(bucketForHour(4)).toBe('night');
  });
});
