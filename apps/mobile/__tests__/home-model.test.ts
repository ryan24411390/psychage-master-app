import {
  asLocalCalendarDate,
  type CheckInEntry,
  CheckInRecordStore,
  type Storage,
} from '@psychage/shared/check-in';
import { describe, expect, it } from 'vitest';

import {
  bridgeCardFor,
  buildTerrainDaysFromEntries,
  ctaLabel,
  deriveKind,
  greeting,
  isReflectionAvailable,
  lastNDayLabels,
  partOfDay,
  priorWeekBounds,
  readForHour,
  recordLabel,
  REFLECTION_MIN_ENTRIES,
  statusLine,
  toTerrainDays,
} from '@/lib/home-model';

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function entry(id: string, date: Date, state: 0 | 1 | 2 | 3 | 4): CheckInEntry {
  return { id, date: asLocalCalendarDate(ymd(date)), state };
}

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

/** A real store seeded with one check-in per date (saveToday keys to the clock — Date Rule 1). */
function storeSeededOn(dates: Date[]): CheckInRecordStore {
  let clock = new Date(2026, 0, 1);
  let n = 0;
  const store = new CheckInRecordStore({
    storage: memStorage(),
    now: () => clock,
    generateId: () => `id${n++}`,
  });
  for (const d of dates) {
    clock = d;
    store.saveToday(2);
  }
  return store;
}

describe('partOfDay', () => {
  it('splits morning / afternoon / evening on the v5 thresholds', () => {
    expect(partOfDay(0)).toBe('morning');
    expect(partOfDay(11)).toBe('morning');
    expect(partOfDay(12)).toBe('afternoon');
    expect(partOfDay(17)).toBe('afternoon');
    expect(partOfDay(18)).toBe('evening');
    expect(partOfDay(23)).toBe('evening');
  });
});

describe('greeting', () => {
  it('is time-dynamic for regular + checked-in, and anonymous drops the comma', () => {
    expect(greeting('regular', 9)).toBe('Good morning');
    expect(greeting('regular', 14)).toBe('Good afternoon');
    expect(greeting('checked-in', 20)).toBe('Good evening');
  });

  it('uses the welcome forms for first-run and away', () => {
    expect(greeting('first-run', 9)).toBe('Welcome');
    expect(greeting('away', 9)).toBe('Welcome back');
  });

  it('appends ", name" when a name is present', () => {
    expect(greeting('regular', 20, 'Amara')).toBe('Good evening, Amara');
    expect(greeting('away', 9, 'Amara')).toBe('Welcome back, Amara');
  });
});

describe('statusLine', () => {
  it('first-run', () => {
    expect(statusLine('first-run')).toBe('This is your space. It starts whenever you’re ready.');
  });
  it('away', () => {
    expect(statusLine('away')).toBe('Your record waited. Nothing was lost.');
  });
  it('regular with a prior entry', () => {
    expect(statusLine('regular', { yesterdayLabel: 'Good' })).toBe(
      'Not yet checked in today · Yesterday: Good.',
    );
  });
  it('regular without a prior entry', () => {
    expect(statusLine('regular')).toBe('Not yet checked in today.');
  });
  it('checked-in with note + prior entry', () => {
    expect(statusLine('checked-in', { todayLabel: 'Okay', todayNote: 'tired', hasPrior: true })).toBe(
      'Checked in · Okay · “tired”. It’s on your record.',
    );
  });
  it('checked-in without note, first ever entry', () => {
    expect(statusLine('checked-in', { todayLabel: 'Good', hasPrior: false })).toBe(
      'Checked in · Good. Your record has begun.',
    );
  });
});

describe('recordLabel', () => {
  it('is "Your record" until a 2nd recorded day, then "Your last 7 days"', () => {
    expect(recordLabel(0)).toBe('Your record');
    expect(recordLabel(1)).toBe('Your record');
    expect(recordLabel(2)).toBe('Your last 7 days');
    expect(recordLabel(5)).toBe('Your last 7 days');
  });
});

describe('ctaLabel', () => {
  it('switches on whether today is checked in', () => {
    expect(ctaLabel(false)).toBe('Check in — 30 seconds');
    expect(ctaLabel(true)).toBe('Update today’s check-in');
  });
});

describe('readForHour', () => {
  it('swaps to the sleep read from 21:00 to before 05:00', () => {
    expect(readForHour(14).tag).toBe('Anxiety & stress');
    expect(readForHour(20).tag).toBe('Anxiety & stress');
    expect(readForHour(21).tag).toBe('Sleep');
    expect(readForHour(3).tag).toBe('Sleep');
    expect(readForHour(5).tag).toBe('Anxiety & stress');
  });
});

describe('lastNDayLabels / toTerrainDays', () => {
  it('returns n consecutive labels ending today (oldest first)', () => {
    const today = new Date(2026, 5, 14);
    const labels = lastNDayLabels(today, 7);
    expect(labels).toHaveLength(7);
    expect(labels.every((l) => l.short.length === 2 && l.full.length > 2)).toBe(true);
  });

  it('maps a value array to terrain days with the today column last', () => {
    const today = new Date(2026, 5, 14);
    const days = toTerrainDays([1, 2, 3, null, 1, 2, 'today'], today);
    expect(days).toHaveLength(7);
    expect(days[6]?.value).toBe('today');
    expect(days[5]?.value).toBe(2);
    expect(days[0]?.value).toBe(1);
    expect(days[6]?.fullLabel).toBeTruthy();
  });
});

describe('deriveKind', () => {
  it('is first-run / checked-in / regular', () => {
    expect(deriveKind(false, false)).toBe('first-run');
    expect(deriveKind(true, true)).toBe('checked-in');
    expect(deriveKind(true, false)).toBe('regular');
  });
});

describe('bridgeCardFor', () => {
  it('shows the bridge only for Low/Very-low; very-low flags the crisis append', () => {
    expect(bridgeCardFor(0, 10)).toEqual({ kind: 'bridge', register: 'day', veryLow: true });
    expect(bridgeCardFor(1, 10)).toEqual({ kind: 'bridge', register: 'day', veryLow: false });
    expect(bridgeCardFor(2, 10)).toBeNull();
    expect(bridgeCardFor(4, 10)).toBeNull();
    expect(bridgeCardFor(undefined, 10)).toBeNull();
  });

  it('uses the night register after 21:00 and before 05:00', () => {
    expect(bridgeCardFor(1, 22)).toMatchObject({ register: 'night' });
    expect(bridgeCardFor(1, 3)).toMatchObject({ register: 'night' });
  });
});

describe('buildTerrainDaysFromEntries', () => {
  it('places entries by date — today entry fills the last slot, gaps stay null', () => {
    const today = new Date(2026, 5, 14);
    const yesterday = new Date(2026, 5, 13);
    const days = buildTerrainDaysFromEntries(
      [entry('a', today, 3), entry('b', yesterday, 1)],
      today,
    );
    expect(days).toHaveLength(7);
    expect(days[6]?.value).toBe(3); // today checked in
    expect(days[5]?.value).toBe(1); // yesterday
    expect(days[0]?.value).toBeNull(); // 6 days ago, no entry
  });

  it('marks an unchecked today as the today marker', () => {
    const today = new Date(2026, 5, 14);
    const days = buildTerrainDaysFromEntries([], today);
    expect(days[6]?.value).toBe('today');
    expect(days[0]?.value).toBeNull();
  });
});

describe('priorWeekBounds', () => {
  // 2026-06-15 is a Monday; 06-08 (Mon) .. 06-14 (Sun) is the week before it.
  it('returns the Monday–Sunday week before the week containing today', () => {
    expect(priorWeekBounds(new Date(2026, 5, 15))).toEqual({ from: '2026-06-08', to: '2026-06-14' });
  });

  it('returns the SAME prior week from any day mid-week (never the in-progress week)', () => {
    // Wed 06-17 is in the week 06-15..06-21; its candidate is still 06-08..06-14.
    expect(priorWeekBounds(new Date(2026, 5, 17))).toEqual({ from: '2026-06-08', to: '2026-06-14' });
    // Sun 06-21 (last day of that week) — still the prior week, not the current one.
    expect(priorWeekBounds(new Date(2026, 5, 21))).toEqual({ from: '2026-06-08', to: '2026-06-14' });
    // The following Monday 06-22 rolls the candidate forward to 06-15..06-21.
    expect(priorWeekBounds(new Date(2026, 5, 22))).toEqual({ from: '2026-06-15', to: '2026-06-21' });
  });
});

describe('isReflectionAvailable (Flow 12 following-Monday rule)', () => {
  const monday = new Date(2026, 5, 15); // prior week = 06-08 .. 06-14

  it('(a) a prior week with ≥3 entries is available the following Monday', () => {
    const store = storeSeededOn([new Date(2026, 5, 8), new Date(2026, 5, 9), new Date(2026, 5, 10)]);
    expect(isReflectionAvailable(store, monday)).toBe(true);
  });

  it('(b) a prior week with <3 entries is not available', () => {
    const store = storeSeededOn([new Date(2026, 5, 8), new Date(2026, 5, 9)]);
    expect(isReflectionAvailable(store, monday)).toBe(false);
  });

  it('(c) a mid-week third entry does not trigger before the following Monday', () => {
    // Three entries land in the CURRENT week (06-15..06-21); the prior week is empty.
    const store = storeSeededOn([
      new Date(2026, 5, 15),
      new Date(2026, 5, 16),
      new Date(2026, 5, 17),
    ]);
    expect(isReflectionAvailable(store, new Date(2026, 5, 17))).toBe(false); // candidate = empty prior week
    expect(isReflectionAvailable(store, new Date(2026, 5, 22))).toBe(true); // following Monday: that week is now prior
  });

  it('(e) the boundary is the single REFLECTION_MIN_ENTRIES constant', () => {
    expect(REFLECTION_MIN_ENTRIES).toBe(3);
    const three = storeSeededOn([new Date(2026, 5, 8), new Date(2026, 5, 9), new Date(2026, 5, 10)]);
    const two = storeSeededOn([new Date(2026, 5, 8), new Date(2026, 5, 9)]);
    // 3 → available, 2 → not. Lowering the constant to 2 flips the second assertion —
    // the single-source proof (the literal is never scattered through the logic).
    expect(isReflectionAvailable(three, monday)).toBe(true);
    expect(isReflectionAvailable(two, monday)).toBe(false);
  });
});
