// Mood Journal — pure longitudinal aggregation. The core value: surface what's
// been coming up over time, from the tagged moments (and, descriptively, how they
// sat alongside the check-in record).
//
// PURE: no clock, no storage, no I/O. Callers window the input themselves (e.g.
// store.getRange(since, today)) and pass the moment set in. Deterministic ordering
// throughout so the UI and tests are stable.
//
// SAFETY (SR-1 / SR-3): these functions COUNT and GROUP. They never score, rank a
// person, infer a cause, or emit a label. `triggerMoodCoOccurrence` reports a plain
// descriptive distribution — "on N days you noted X, your check-ins were …" — with
// no causal claim. The consuming UI must frame it as a reflection of what the person
// noted, not a diagnosis, and that copy is clinically reviewed before it ships.

import { toLocalCalendarDate } from '../check-in/dates';
import type { CheckInEntry, CheckInState } from '../check-in/types';
import { compareByCreatedAt } from './migrate';
import {
  type EmotionTag,
  emotionIndex,
  type TriggerTag,
  triggerIndex,
} from './tags';
import type { LocalCalendarDate, MomentEntry } from './types';

export interface TagCount<T> {
  readonly tag: T;
  /** Number of moments that included this tag (deduped within a moment). */
  readonly count: number;
}

/** How often each emotion was noted, most-noted first (preset order breaks ties). */
export function emotionFrequency(moments: readonly MomentEntry[]): TagCount<EmotionTag>[] {
  const counts = new Map<EmotionTag, number>();
  for (const moment of moments) {
    for (const tag of new Set(moment.emotions)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || emotionIndex(a.tag) - emotionIndex(b.tag));
}

/** How often each trigger was noted, most-noted first (preset order breaks ties). */
export function triggerFrequency(moments: readonly MomentEntry[]): TagCount<TriggerTag>[] {
  const counts = new Map<TriggerTag, number>();
  for (const moment of moments) {
    for (const tag of new Set(moment.triggers)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || triggerIndex(a.tag) - triggerIndex(b.tag));
}

export interface DayGroup {
  readonly date: LocalCalendarDate;
  /** Moments on this day, newest first (by createdAt). */
  readonly moments: MomentEntry[];
}

/** Moments grouped by calendar day, newest day first; within a day, newest first. */
export function timeline(moments: readonly MomentEntry[]): DayGroup[] {
  const byDate = new Map<LocalCalendarDate, MomentEntry[]>();
  for (const moment of moments) {
    const list = byDate.get(moment.date);
    if (list) list.push(moment);
    else byDate.set(moment.date, [moment]);
  }

  const groups: DayGroup[] = [];
  for (const [date, list] of byDate) {
    groups.push({ date, moments: [...list].sort(compareByCreatedAt).reverse() });
  }
  // Newest day first (descending on YYYY-MM-DD).
  groups.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return groups;
}

/** A trigger's descriptive co-occurrence with check-in states on the days it was noted. */
export interface TriggerMoodCoOccurrence {
  readonly trigger: TriggerTag;
  /** Count of each check-in state (0..4) across the days this trigger was noted AND a check-in exists. */
  readonly stateCounts: Readonly<Record<CheckInState, number>>;
  /** Number of days the trigger was noted AND a check-in exists (the co-occurrence sample size). */
  readonly daysNoted: number;
}

/**
 * For each noted trigger, the DESCRIPTIVE distribution of check-in states on the
 * days that trigger appeared. Day-based (a trigger noted twice in one day counts
 * the day once), so it never double-counts. NO causal inference — purely "alongside
 * X, the record looked like this". Most-co-occurring first. Triggers noted only on
 * days without a check-in surface with `daysNoted: 0` (the UI can hide them).
 */
export function triggerMoodCoOccurrence(
  moments: readonly MomentEntry[],
  checkIns: readonly CheckInEntry[],
): TriggerMoodCoOccurrence[] {
  const stateByDate = new Map<LocalCalendarDate, CheckInState>();
  for (const entry of checkIns) stateByDate.set(entry.date, entry.state);

  const datesByTrigger = new Map<TriggerTag, Set<LocalCalendarDate>>();
  for (const moment of moments) {
    for (const trigger of new Set(moment.triggers)) {
      let dates = datesByTrigger.get(trigger);
      if (!dates) {
        dates = new Set();
        datesByTrigger.set(trigger, dates);
      }
      dates.add(moment.date);
    }
  }

  const result: TriggerMoodCoOccurrence[] = [];
  for (const [trigger, dates] of datesByTrigger) {
    const stateCounts: Record<CheckInState, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    let daysNoted = 0;
    for (const date of dates) {
      const state = stateByDate.get(date);
      if (state === undefined) continue;
      stateCounts[state] += 1;
      daysNoted += 1;
    }
    result.push({ trigger, stateCounts, daysNoted });
  }
  result.sort((a, b) => b.daysNoted - a.daysNoted || triggerIndex(a.trigger) - triggerIndex(b.trigger));
  return result;
}

// ── valence (the optional 1–10 pleasantness rating) ──────────────────────────
//
// These read the OPTIONAL `valence` field. A moment without valence simply does not
// contribute — the journal works fully whether or not a person rates moments. Like
// everything in patterns.ts these are descriptive only: a trend line and a streak
// count, never a score of the person, never a verdict, never a cause (SR-3).

/** A single day's mean valence, for plotting a trend over time. */
export interface ValenceDayAverage {
  readonly date: LocalCalendarDate;
  /** Mean of that day's rated moments (valence-bearing only). */
  readonly average: number;
  /** How many rated moments contributed (≥1). */
  readonly count: number;
}

/**
 * Daily-average valence, ascending by date, over the days that have ≥1 rated moment.
 * Unrated moments and unrated days are skipped (they leave no point) so the trend
 * reflects only what the person actually rated. Pure; caller pre-windows the input.
 */
export function valenceTrend(moments: readonly MomentEntry[]): ValenceDayAverage[] {
  const byDate = new Map<LocalCalendarDate, { sum: number; count: number }>();
  for (const moment of moments) {
    if (moment.valence === undefined) continue;
    const agg = byDate.get(moment.date);
    if (agg) {
      agg.sum += moment.valence;
      agg.count += 1;
    } else {
      byDate.set(moment.date, { sum: moment.valence, count: 1 });
    }
  }
  const out = [...byDate.entries()].map(([date, { sum, count }]) => ({
    date,
    average: sum / count,
    count,
  }));
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

/** Coarse direction of the valence trend. `null` when there are < 2 rated days. */
export type ValenceDirection = 'up' | 'down' | 'steady';

/** A small, descriptive summary for the insights header. No scoring, no labels. */
export interface StreakSummary {
  /** Total moments logged in the windowed set. */
  readonly momentsLogged: number;
  /** Distinct calendar days with ≥1 moment. */
  readonly daysLogged: number;
  /** Consecutive days (ending at the most recent logged day) that have ≥1 moment. */
  readonly latestStreak: number;
  /** Whether rated days have trended gentler/harder/steady. `null` when < 2 rated days. */
  readonly valenceDirection: ValenceDirection | null;
}

// The local calendar day before `date`. Built with the LOCAL-time Date constructor
// (no UTC accessors), so it never shifts across a timezone boundary — same rule as
// check-in/dates. Deterministic (no clock read), so patterns.ts stays pure.
function previousDay(date: LocalCalendarDate): LocalCalendarDate {
  const year = Number(date.slice(0, 4));
  const monthIndex = Number(date.slice(5, 7)) - 1;
  const day = Number(date.slice(8, 10));
  const prev = new Date(year, monthIndex, day);
  prev.setDate(prev.getDate() - 1);
  return toLocalCalendarDate(prev);
}

/** Direction threshold — a small change reads as "steady", not noise. */
const VALENCE_DIRECTION_EPSILON = 0.5;

/**
 * A streak/trend summary for the insights surface. `latestStreak` counts consecutive
 * days back from the most recent logged day (so it survives "user opens the app a few
 * days later" — it is anchored to their data, not to wall-clock today). Pure.
 */
export function streakSummary(moments: readonly MomentEntry[]): StreakSummary {
  const dateSet = new Set<LocalCalendarDate>(moments.map((m) => m.date));
  const dates = [...dateSet].sort();
  const daysLogged = dates.length;

  let latestStreak = 0;
  if (daysLogged > 0) {
    let cursor = dates[dates.length - 1] as LocalCalendarDate;
    while (dateSet.has(cursor)) {
      latestStreak += 1;
      cursor = previousDay(cursor);
    }
  }

  const trend = valenceTrend(moments);
  let valenceDirection: ValenceDirection | null = null;
  if (trend.length >= 2) {
    const mid = Math.floor(trend.length / 2);
    const mean = (points: readonly ValenceDayAverage[]) =>
      points.reduce((sum, p) => sum + p.average, 0) / points.length;
    const delta = mean(trend.slice(mid)) - mean(trend.slice(0, mid));
    valenceDirection =
      delta > VALENCE_DIRECTION_EPSILON ? 'up' : delta < -VALENCE_DIRECTION_EPSILON ? 'down' : 'steady';
  }

  return { momentsLogged: moments.length, daysLogged, latestStreak, valenceDirection };
}
