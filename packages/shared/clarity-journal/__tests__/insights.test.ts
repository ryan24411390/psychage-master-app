import { describe, expect, it } from 'vitest';

import {
  behavioralSuccessRate,
  checkInStreak,
  copingEffectiveness,
  moodDirection,
  recurringTriggers,
  screenerDirection,
  screenerTrajectory,
  topDistortions,
} from '../insights';
import type {
  BehavioralActivation,
  DailyJournalCheckIn,
  LocalCalendarDate,
  ThoughtRecord,
  TriggerLog,
  WeeklyScreening,
} from '../types';

const d = (s: string) => s as LocalCalendarDate;

function checkIn(date: string, mood: number): DailyJournalCheckIn {
  return {
    id: `c-${date}`, date: d(date), createdAt: `${date}T12:00:00Z`,
    mood, energy: 5, sleptLastNight: true, tags: [],
  };
}
function screening(weekStart: string, phq: [number, number], who: [number, number]): WeeklyScreening {
  return {
    id: `s-${weekStart}`, weekStart: d(weekStart), createdAt: `${weekStart}T12:00:00Z`,
    phq2: phq as WeeklyScreening['phq2'], gad2: [0, 0], pss4: [0, 0], who5: who as WeeklyScreening['who5'],
  };
}

describe('moodDirection', () => {
  it('improving when mood rises over time', () => {
    const series = [checkIn('2026-06-01', 3), checkIn('2026-06-02', 4), checkIn('2026-06-03', 7), checkIn('2026-06-04', 8)];
    expect(moodDirection(series)).toBe('improving');
  });
  it('declining when mood falls', () => {
    const series = [checkIn('2026-06-01', 8), checkIn('2026-06-02', 7), checkIn('2026-06-03', 3), checkIn('2026-06-04', 2)];
    expect(moodDirection(series)).toBe('declining');
  });
  it('steady with <2 points', () => {
    expect(moodDirection([checkIn('2026-06-01', 5)])).toBe('steady');
  });
});

describe('screenerDirection polarity', () => {
  it('PHQ-2 falling scores = improving (lower is better)', () => {
    const s = [screening('2026-06-01', [6, 0], [5, 5]), screening('2026-06-08', [4, 0], [5, 5]), screening('2026-06-15', [1, 0], [5, 5])];
    // phq2 scores 6 → 4 → 1 (falling) → improving
    expect(screenerTrajectory(s, 'phq2').map((t) => t.score)).toEqual([6, 4, 1]);
    expect(screenerDirection(s, 'phq2')).toBe('improving');
  });
  it('WHO-5 rising scores = improving (higher is better)', () => {
    const s = [screening('2026-06-01', [0, 0], [2, 2]), screening('2026-06-08', [0, 0], [4, 4]), screening('2026-06-15', [0, 0], [5, 5])];
    // who5 scores 4 → 8 → 10 (rising) → improving
    expect(screenerDirection(s, 'who5')).toBe('improving');
  });
});

describe('topDistortions', () => {
  it('counts distortion ids, most frequent first', () => {
    const tr = (id: string, distortions: string[]): ThoughtRecord => ({
      id, date: d('2026-06-10'), createdAt: '2026-06-10T12:00:00Z',
      situation: '', automaticThought: '', distortions, evidenceFor: '', evidenceAgainst: '',
      balancedThought: '', emotionBefore: 5, emotionAfter: 5,
    });
    const result = topDistortions([
      tr('1', ['catastrophizing', 'labeling']),
      tr('2', ['catastrophizing']),
    ]);
    expect(result[0]).toEqual({ key: 'catastrophizing', count: 2 });
    expect(result[1]).toEqual({ key: 'labeling', count: 1 });
  });
});

describe('behavioralSuccessRate', () => {
  it('counts rated activities where actual >= predicted', () => {
    const a = (predicted: number, actual?: number): BehavioralActivation => ({
      id: Math.random().toString(), date: d('2026-06-10'), createdAt: '2026-06-10T12:00:00Z',
      activity: 'x', type: 'both', predictedMood: predicted, actualMood: actual,
    });
    const r = behavioralSuccessRate([a(5, 7), a(6, 4), a(5)]); // 1 success of 2 rated
    expect(r).toEqual({ ratedCount: 2, successCount: 1, rate: 0.5 });
  });
  it('rate is 0 when nothing rated', () => {
    expect(behavioralSuccessRate([]).rate).toBe(0);
  });
});

describe('copingEffectiveness + recurringTriggers', () => {
  const t = (trigger: string, effectiveness?: number): TriggerLog => ({
    id: Math.random().toString(), date: d('2026-06-10'), createdAt: '2026-06-10T12:00:00Z',
    trigger, severity: 3, category: 'People', effectiveness,
  });
  it('averages effectiveness across rated triggers', () => {
    expect(copingEffectiveness([t('a', 4), t('b', 2), t('c')])).toEqual({ count: 2, average: 3 });
  });
  it('counts recurring triggers case-insensitively', () => {
    const r = recurringTriggers([t('Work'), t('work'), t('Sleep')]);
    expect(r[0]).toEqual({ key: 'work', count: 2 });
  });
});

describe('checkInStreak', () => {
  it('counts consecutive days back from the latest, 0 if stale', () => {
    const today = d('2026-06-16');
    const streak = [checkIn('2026-06-16', 5), checkIn('2026-06-15', 5), checkIn('2026-06-14', 5), checkIn('2026-06-12', 5)];
    expect(checkInStreak(streak, today)).toBe(3); // 16,15,14 then gap at 13
    expect(checkInStreak([checkIn('2026-06-10', 5)], today)).toBe(0); // stale
    expect(checkInStreak([], today)).toBe(0);
  });
});
