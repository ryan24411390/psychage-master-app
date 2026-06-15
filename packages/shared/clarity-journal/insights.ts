// Clarity Journal — insights. Pure, on-device aggregations over the store's
// collections. Returns DATA + directional enums only (improving/steady/declining)
// — never a person-verdict scalar label (AC-9.2 / SR-3). The app renders the
// arrows/words; charts plot these series against date/week axes.

import { dayNumber } from './dates';
import { scoreGAD2, scorePHQ2, scorePSS4, scoreWHO5 } from './scoring';
import type {
  BehavioralActivation,
  DailyJournalCheckIn,
  LocalCalendarDate,
  ThoughtRecord,
  TriggerLog,
  WeeklyScreening,
} from './types';

export type TrendDirection = 'improving' | 'steady' | 'declining';

export interface TrendPoint {
  readonly date: LocalCalendarDate;
  readonly value: number;
}

export interface CountItem {
  readonly key: string;
  readonly count: number;
}

export interface ScreenerTrajectory {
  readonly weekStart: LocalCalendarDate;
  readonly score: number;
}

const MOOD_EPSILON = 0.5;

/** Split-half mean comparison → direction. `higherIsBetter` sets polarity. */
function directionFromSeries(values: readonly number[], higherIsBetter: boolean, epsilon: number): TrendDirection {
  if (values.length < 2) return 'steady';
  const mid = Math.floor(values.length / 2);
  const first = values.slice(0, mid);
  const second = values.slice(mid);
  const mean = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
  const delta = mean(second) - mean(first); // positive = rising over time
  if (Math.abs(delta) < epsilon) return 'steady';
  const rising = delta > 0;
  return rising === higherIsBetter ? 'improving' : 'declining';
}

const ascByDate = <T extends { date: LocalCalendarDate }>(a: T, b: T): number =>
  a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
const ascByWeek = <T extends { weekStart: LocalCalendarDate }>(a: T, b: T): number =>
  a.weekStart < b.weekStart ? -1 : a.weekStart > b.weekStart ? 1 : 0;

/** Mood line over time (chart series — date axis, mood value). */
export function moodTrend(checkIns: readonly DailyJournalCheckIn[]): TrendPoint[] {
  return [...checkIns].sort(ascByDate).map((e) => ({ date: e.date, value: e.mood }));
}

/** Mood movement (higher mood = better). */
export function moodDirection(checkIns: readonly DailyJournalCheckIn[]): TrendDirection {
  const series = moodTrend(checkIns).map((p) => p.value);
  return directionFromSeries(series, true, MOOD_EPSILON);
}

const SCORERS = {
  phq2: { fn: scorePHQ2, higherIsBetter: false },
  gad2: { fn: scoreGAD2, higherIsBetter: false },
  pss4: { fn: scorePSS4, higherIsBetter: false },
  who5: { fn: scoreWHO5, higherIsBetter: true },
} as const;

export type ScreenerKey = keyof typeof SCORERS;

/** Per-week score trajectory for one screener, oldest first. */
export function screenerTrajectory(
  screenings: readonly WeeklyScreening[],
  key: ScreenerKey,
): ScreenerTrajectory[] {
  const { fn } = SCORERS[key];
  return [...screenings].sort(ascByWeek).map((s) => ({
    weekStart: s.weekStart,
    score: fn(s[key][0], s[key][1]),
  }));
}

/** Direction of a screener over time, with correct better/worse polarity. */
export function screenerDirection(
  screenings: readonly WeeklyScreening[],
  key: ScreenerKey,
): TrendDirection {
  const series = screenerTrajectory(screenings, key).map((t) => t.score);
  // screener scores are integers; epsilon 0.5 = "any whole-point shift counts"
  return directionFromSeries(series, SCORERS[key].higherIsBetter, 0.5);
}

/** Distortion-id frequency across thought records, most frequent first. */
export function topDistortions(records: readonly ThoughtRecord[]): CountItem[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    for (const d of r.distortions) counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || (a.key < b.key ? -1 : 1));
}

export interface BehavioralSuccess {
  readonly ratedCount: number;
  readonly successCount: number;
  /** Fraction in [0,1] of rated activities where actual ≥ predicted mood. 0 when none rated. */
  readonly rate: number;
}

export function behavioralSuccessRate(activations: readonly BehavioralActivation[]): BehavioralSuccess {
  const rated = activations.filter((a) => a.actualMood !== undefined);
  const success = rated.filter((a) => (a.actualMood as number) >= a.predictedMood).length;
  return {
    ratedCount: rated.length,
    successCount: success,
    rate: rated.length === 0 ? 0 : success / rated.length,
  };
}

export interface CopingEffectiveness {
  readonly count: number;
  /** Mean effectiveness (1-5) across triggers that recorded one; 0 when none. */
  readonly average: number;
}

export function copingEffectiveness(triggers: readonly TriggerLog[]): CopingEffectiveness {
  const rated = triggers.filter((t) => t.effectiveness !== undefined);
  const sum = rated.reduce((acc, t) => acc + (t.effectiveness as number), 0);
  return { count: rated.length, average: rated.length === 0 ? 0 : sum / rated.length };
}

/** Recurring triggers by case-insensitive text, most frequent first. */
export function recurringTriggers(triggers: readonly TriggerLog[]): CountItem[] {
  const counts = new Map<string, number>();
  for (const t of triggers) {
    const key = t.trigger.trim().toLowerCase();
    if (key.length === 0) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || (a.key < b.key ? -1 : 1));
}

/**
 * Consecutive calendar days with a daily check-in, counting back from the most
 * recent logged day (mirrors mood-journal's streak). `today` is injected.
 */
export function checkInStreak(
  checkIns: readonly DailyJournalCheckIn[],
  today: LocalCalendarDate,
): number {
  if (checkIns.length === 0) return 0;
  const days = new Set(checkIns.map((e) => dayNumber(e.date)));
  const todayNum = dayNumber(today);
  const latest = Math.max(...days);
  if (todayNum - latest > 1) return 0; // most recent entry is stale
  let streak = 0;
  let cursor = latest;
  while (days.has(cursor)) {
    streak++;
    cursor -= 1;
  }
  return streak;
}
