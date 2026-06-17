import type { Moment } from '@psychage/shared/engagement';
import { describe, expect, it } from 'vitest';

import { momentsToDailyEntries } from '@/lib/daily-rollup';

// The day-rollup adapter must carry a day's RANGE, not collapse it to the latest tap. Each
// day's band comes from each moment's primary WORD (the curated vocab), not a rating. Each
// Moment is stamped at local NOON on the given Y-M-D so the local calendar day is stable
// regardless of the runner's timezone.
//
// Word → band → state (0..4): 'hopeless'=1→0, 'anxious'=2→1, 'steady'=3→2, 'calm'=4→3,
// 'joyful'=5→4.
let seq = 0;
function moment(y: number, mo: number, d: number, labelPrimary: string, note?: string): Moment {
  return {
    id: `m${seq++}`,
    timestamp: new Date(y, mo - 1, d, 12, 0, 0).toISOString(),
    labelPrimary,
    routedToSupport: false,
    ...(note !== undefined ? { note } : {}),
  };
}

describe('momentsToDailyEntries (day rollup carries the RANGE, band from the word)', () => {
  it('a multi-word day → low/high span, count, worst-of-day scalar (never the latest tap)', () => {
    // Calm morning ('calm'→state 3), rough evening ('hopeless'→state 0), then a LATER bright
    // tap ('joyful'→state 4). The latest is the brightest — worst-of-day still wins.
    const entries = momentsToDailyEntries([
      moment(2026, 6, 16, 'calm'),
      moment(2026, 6, 16, 'hopeless', 'panic'),
      moment(2026, 6, 16, 'joyful'),
    ]);
    expect(entries).toHaveLength(1);
    const day = entries[0];
    expect(day?.date).toBe('2026-06-16');
    expect(day?.low).toBe(0); // 'hopeless' band 1 → state 0
    expect(day?.high).toBe(4); // 'joyful' band 5 → state 4
    expect(day?.state).toBe(0); // worst-of-day == low, NOT the latest bright tap
    expect(day?.count).toBe(3);
    expect(day?.note).toBe('panic'); // the worst-of-day moment's note, not the latest
  });

  it('a single-moment day → low == high == state, count 1', () => {
    const entries = momentsToDailyEntries([moment(2026, 6, 17, 'steady', 'ok')]);
    expect(entries).toHaveLength(1);
    const day = entries[0];
    expect(day?.low).toBe(2);
    expect(day?.high).toBe(2);
    expect(day?.state).toBe(2);
    expect(day?.count).toBe(1);
    expect(day?.note).toBe('ok');
  });

  it('splits moments across local calendar days, oldest first', () => {
    const entries = momentsToDailyEntries([
      moment(2026, 6, 18, 'anxious'),
      moment(2026, 6, 16, 'joyful'),
      moment(2026, 6, 17, 'steady'),
    ]);
    expect(entries.map((e) => e.date)).toEqual(['2026-06-16', '2026-06-17', '2026-06-18']);
    // Each single-moment day is its own low == high.
    expect(entries.every((e) => e.low === e.high && e.state === e.low)).toBe(true);
  });

  it('an unknown word falls back to the neutral band (rollup never breaks)', () => {
    const entries = momentsToDailyEntries([moment(2026, 6, 19, 'not-a-real-word')]);
    expect(entries[0]?.state).toBe(2); // unknown → band 3 → state 2
  });

  it('no moments → no entries', () => {
    expect(momentsToDailyEntries([])).toEqual([]);
  });
});
