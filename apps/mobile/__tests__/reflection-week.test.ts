import type { DailyEntry as CheckInEntry } from '@/lib/daily-rollup';
import { describe, expect, it } from 'vitest';

import { buildEarlierWeeks, buildWeekReflection, type RangeStore } from '@/features/reflection/week';

function entry(date: string, state: number, note?: string): CheckInEntry {
  return {
    id: date,
    date: date as CheckInEntry['date'],
    state: state as CheckInEntry['state'],
    ...(note ? { note } : {}),
  };
}

function storeWith(entries: CheckInEntry[]): RangeStore {
  return {
    getRange: (from, to) =>
      entries.filter((e) => (e.date as string) >= from && (e.date as string) <= to),
  };
}

describe('buildWeekReflection', () => {
  it('builds 7 Mon–Sun days with notes-by-day, the count, and the line', () => {
    const wk = buildWeekReflection(
      storeWith([entry('2026-06-01', 1, 'tired'), entry('2026-06-03', 3), entry('2026-06-05', 2)]),
      '2026-06-01',
      '2026-06-07',
    );
    expect(wk.days).toHaveLength(7);
    expect(wk.entryCount).toBe(3);
    expect(wk.lineKey).toBe('quieter_three');
    expect(wk.days[0]?.label).toBe('Mon');
    expect(wk.days[0]?.value).toBe(1); // Mon 06-01
    expect(wk.days[1]?.value).toBeNull(); // Tue 06-02 — no entry
    expect(wk.notes).toEqual([{ day: 'Monday', note: 'tired' }]);
    expect(wk.rangeLabel).toBe('1 Jun – 7 Jun');
  });
});

describe('buildEarlierWeeks', () => {
  it('an empty store yields no earlier weeks', () => {
    expect(buildEarlierWeeks(storeWith([]), new Date(2026, 5, 14))).toEqual([]);
  });

  it('includes only weeks holding ≥ 3 entries', () => {
    // 14 consecutive May days (well before June) → every returned earlier week has ≥3.
    const dense: CheckInEntry[] = [];
    for (let d = 1; d <= 14; d++) {
      dense.push(entry(`2026-05-${String(d).padStart(2, '0')}`, 2));
    }
    const weeks = buildEarlierWeeks(storeWith(dense), new Date(2026, 5, 14));
    expect(weeks.length).toBeGreaterThanOrEqual(1);
    expect(weeks.every((w) => w.entryCount >= 3)).toBe(true);
  });
});
