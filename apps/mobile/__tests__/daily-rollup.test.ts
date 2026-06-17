import type { Moment } from '@psychage/shared/engagement';
import { describe, expect, it } from 'vitest';

import { momentsToDailyEntries } from '@/lib/daily-rollup';

// The day-rollup adapter must carry a day's RANGE, not collapse it to the latest tap.
// Each Moment is stamped at local NOON on the given Y-M-D so the local calendar day is
// stable regardless of the runner's timezone.
let seq = 0;
function moment(
  y: number,
  mo: number,
  d: number,
  valence: Moment['valence'],
  note?: string,
): Moment {
  return {
    id: `m${seq++}`,
    timestamp: new Date(y, mo - 1, d, 12, 0, 0).toISOString(),
    valence,
    labels: [],
    context: [],
    routedToSupport: false,
    ...(note !== undefined ? { note } : {}),
  };
}

describe('momentsToDailyEntries (day rollup carries the RANGE)', () => {
  it('a multi-modal day → low/high span, count, worst-of-day scalar (never the latest tap)', () => {
    // Calm morning (valence 4 → state 3), rough evening (valence 1 → state 0), then a
    // LATER calm tap (valence 5 → state 4). The latest is the calmest — worst-of-day wins.
    const entries = momentsToDailyEntries([
      moment(2026, 6, 16, 4),
      moment(2026, 6, 16, 1, 'panic'),
      moment(2026, 6, 16, 5),
    ]);
    expect(entries).toHaveLength(1);
    const day = entries[0];
    expect(day?.date).toBe('2026-06-16');
    expect(day?.low).toBe(0); // valence 1 → state 0
    expect(day?.high).toBe(4); // valence 5 → state 4
    expect(day?.state).toBe(0); // worst-of-day == low, NOT the latest calm tap
    expect(day?.count).toBe(3);
    expect(day?.note).toBe('panic'); // the worst-of-day moment's note, not the latest
  });

  it('a single-moment day → low == high == state, count 1', () => {
    const entries = momentsToDailyEntries([moment(2026, 6, 17, 3, 'steady')]);
    expect(entries).toHaveLength(1);
    const day = entries[0];
    expect(day?.low).toBe(2);
    expect(day?.high).toBe(2);
    expect(day?.state).toBe(2);
    expect(day?.count).toBe(1);
    expect(day?.note).toBe('steady');
  });

  it('splits moments across local calendar days, oldest first', () => {
    const entries = momentsToDailyEntries([
      moment(2026, 6, 18, 2),
      moment(2026, 6, 16, 5),
      moment(2026, 6, 17, 3),
    ]);
    expect(entries.map((e) => e.date)).toEqual(['2026-06-16', '2026-06-17', '2026-06-18']);
    // Each single-moment day is its own low == high.
    expect(entries.every((e) => e.low === e.high && e.state === e.low)).toBe(true);
  });

  it('no moments → no entries', () => {
    expect(momentsToDailyEntries([])).toEqual([]);
  });
});
