import { MomentStore, type Storage } from '@psychage/shared/engagement';
import { describe, expect, it } from 'vitest';

import { dailyRollupReader, type DailyEntry } from '@/lib/daily-rollup';
import {
  buildDailyRecap,
  presenceWindow,
  weeklyCheckInCount,
  weeklyRecapLine,
} from '@/features/insights/daily-recap';

// Pure recap aggregation + a round-trip of the EXISTING Moments records through this read
// model. The recap is presence + a factual weekly count only (energy was dropped from the
// Insights path in the P45–P48 rebuild). Vitest only — no RN, no network.

const TODAY = new Date(2026, 5, 17); // 2026-06-17, local
const entry = (date: string, state: 0 | 1 | 2 | 3 | 4 = 2): DailyEntry => ({
  id: date,
  date,
  state,
  low: state,
  high: state,
  count: 1,
});

function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => {
      m.set(k, v);
    },
    remove: (k) => {
      m.delete(k);
    },
  };
}

describe('presenceWindow', () => {
  it('returns the last 7 days oldest→newest with today flagged', () => {
    const out = presenceWindow([], TODAY);
    expect(out).toHaveLength(7);
    expect(out[0]?.date).toBe('2026-06-11');
    expect(out[6]?.date).toBe('2026-06-17');
    expect(out[6]?.isToday).toBe(true);
    expect(out.every((d) => d.present === false)).toBe(true);
  });

  it('flags only days that have a recorded moment (presence, not intensity)', () => {
    // 2026-06-10 falls outside the 7-day window (06-11..06-17) and is excluded.
    const out = presenceWindow([entry('2026-06-17'), entry('2026-06-15'), entry('2026-06-10')], TODAY);
    const present = out.filter((d) => d.present).map((d) => d.date);
    expect(present).toEqual(['2026-06-15', '2026-06-17']);
  });

  it('does not vary by the day state (no mood-intensity leak)', () => {
    const low = presenceWindow([entry('2026-06-17', 0)], TODAY);
    const high = presenceWindow([entry('2026-06-17', 4)], TODAY);
    expect(low).toEqual(high);
  });
});

describe('weeklyCheckInCount / weeklyRecapLine', () => {
  it('counts distinct recorded days within the last 7 days inclusive of today', () => {
    const checkins = [entry('2026-06-17'), entry('2026-06-15'), entry('2026-06-10')];
    expect(weeklyCheckInCount(checkins, TODAY)).toBe(2); // 06-10 falls outside the 7-day window
  });

  it('phrases the recap factually in Moments framing', () => {
    const checkins = [entry('2026-06-17'), entry('2026-06-15')];
    expect(weeklyRecapLine(checkins, TODAY)).toBe('You recorded on 2 of 7 days this week.');
  });

  it('uses a gentle empty line when nothing was recorded this week', () => {
    expect(weeklyRecapLine([], TODAY)).toBe('No moments recorded this week yet.');
  });
});

describe('buildDailyRecap', () => {
  it('assembles presence + the factual weekly recap line', () => {
    const recap = buildDailyRecap({ checkins: [entry('2026-06-17'), entry('2026-06-16')] }, TODAY);
    expect(recap.weeklyRecap).toBe('You recorded on 2 of 7 days this week.');
    expect(recap.presence.filter((d) => d.present).map((d) => d.date)).toEqual(['2026-06-16', '2026-06-17']);
  });
});

describe('round-trip: existing Moments → dailyRollup → recap', () => {
  it('reads real Moment records through the unified model into presence', () => {
    let clock = new Date(2026, 5, 15, 12, 0, 0);
    let n = 0;
    const store = new MomentStore({ storage: memStorage(), now: () => clock, generateId: () => `m${n++}` });
    store.append({ valence: 3 });
    clock = new Date(2026, 5, 17, 12, 0, 0);
    store.append({ valence: 4 });

    const checkins = dailyRollupReader(store).getRecent(30);
    const recap = buildDailyRecap({ checkins }, TODAY);
    expect(recap.presence.filter((d) => d.present).map((d) => d.date)).toEqual(['2026-06-15', '2026-06-17']);
    expect(recap.weeklyRecap).toBe('You recorded on 2 of 7 days this week.');
  });
});
