import { describe, expect, it } from 'vitest';

import { assembleReport } from '../report';
import { emptyStore, type PersistedJournal } from '../migrate';
import type { LocalCalendarDate } from '../types';

const d = (s: string) => s as LocalCalendarDate;

function snapshot(partial: Partial<PersistedJournal>): PersistedJournal {
  return { ...emptyStore(), ...partial };
}

describe('assembleReport', () => {
  const today = d('2026-06-16');

  it('windows entries to the last periodDays', () => {
    const snap = snapshot({
      dailyCheckIns: [
        { id: 'recent', date: d('2026-06-15'), createdAt: 'x', mood: 7, energy: 5, sleptLastNight: true, tags: [] },
        { id: 'old', date: d('2026-04-01'), createdAt: 'x', mood: 2, energy: 5, sleptLastNight: true, tags: [] },
      ],
    });
    const report = assembleReport(snap, { today, periodDays: 30 });
    // only the recent check-in (within 30 days of 2026-06-16) is in the trend
    expect(report.mood.trend.map((p) => p.date)).toEqual([d('2026-06-15')]);
    expect(report.periodDays).toBe(30);
    expect(report.since).toBe('2026-05-17');
  });

  it('reports latest screening score + level per instrument', () => {
    const snap = snapshot({
      weeklyScreenings: [
        { id: 's1', weekStart: d('2026-06-08'), createdAt: 'x', phq2: [1, 1], gad2: [0, 0], pss4: [2, 2], who5: [4, 4] },
        { id: 's2', weekStart: d('2026-06-15'), createdAt: 'x', phq2: [3, 3], gad2: [0, 0], pss4: [4, 0], who5: [5, 5] },
      ],
    });
    const report = assembleReport(snap, { today, periodDays: 30 });
    // latest week 2026-06-15: phq2 = 6 → elevated; who5 = 10 → low concern
    expect(report.screeners.phq2.latest).toEqual({ score: 6, level: 'elevated' });
    expect(report.screeners.who5.latest).toEqual({ score: 10, level: 'low' });
    expect(report.screeners.phq2.trajectory.map((t) => t.score)).toEqual([2, 6]);
  });

  it('tallies safety flags in-window and yields empty report on no data', () => {
    const empty = assembleReport(emptyStore(), { today });
    expect(empty.mood.trend).toEqual([]);
    expect(empty.screeners.phq2.latest).toBeNull();
    expect(empty.safetyFlagCount).toBe(0);

    const withFlags = assembleReport(
      snapshot({ safetyFlags: [{ date: d('2026-06-15'), source: 'keyword', createdAt: 'x' }] }),
      { today, periodDays: 30 },
    );
    expect(withFlags.safetyFlagCount).toBe(1);
  });
});
