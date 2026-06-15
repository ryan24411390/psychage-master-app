// Clarity Journal — report-engine data assembly. Ports the OUTPUT SHAPE of web
// reportEngine.ts: mood + screener trajectories, distortion frequency, behavioral
// success, coping effectiveness, recurring triggers, safety-flag tally. Pure +
// on-device (SR-4). Returns DATA only — the session-prep prose, headings, and
// screener level words are the app's Dr. Dobson-gated fixture (SR-3); the PDF
// builder renders this structure with that copy.

import { dayNumber } from './dates';
import {
  type BehavioralSuccess,
  behavioralSuccessRate,
  type CopingEffectiveness,
  copingEffectiveness,
  type CountItem,
  moodDirection,
  moodTrend,
  recurringTriggers,
  type ScreenerKey,
  type ScreenerTrajectory,
  screenerDirection,
  screenerTrajectory,
  topDistortions,
  type TrendDirection,
  type TrendPoint,
} from './insights';
import { scoreScreening } from './scoring';
import type { LocalCalendarDate, ScoreLevel } from './types';
import type { PersistedJournal } from './migrate';

export interface ScreenerReport {
  readonly trajectory: ScreenerTrajectory[];
  readonly direction: TrendDirection;
  /** Most recent week's score+level, or null when no screening in the window. */
  readonly latest: { readonly score: number; readonly level: ScoreLevel } | null;
}

export interface ReportData {
  readonly periodDays: number;
  /** Inclusive lower bound of the window (a LocalCalendarDate). */
  readonly since: LocalCalendarDate;
  readonly mood: { readonly trend: TrendPoint[]; readonly direction: TrendDirection };
  readonly screeners: Readonly<Record<ScreenerKey, ScreenerReport>>;
  readonly distortions: CountItem[];
  readonly behavioral: BehavioralSuccess;
  readonly coping: CopingEffectiveness;
  readonly recurringTriggers: CountItem[];
  readonly safetyFlagCount: number;
}

export interface ReportOptions {
  /** Device's local "today" — the window anchor (injected; no hidden clock). */
  readonly today: LocalCalendarDate;
  /** Look-back window in days (default 30). */
  readonly periodDays?: number;
}

function sinceDate(today: LocalCalendarDate, periodDays: number): LocalCalendarDate {
  const cutoff = dayNumber(today) - periodDays;
  const ms = cutoff * 86_400_000;
  const d = new Date(ms);
  const p2 = (n: number): string => String(n).padStart(2, '0');
  return `${String(d.getUTCFullYear()).padStart(4, '0')}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}` as LocalCalendarDate;
}

/** Assemble the therapist-report data from an on-device snapshot, windowed to the
 *  last `periodDays` calendar days (default 30). */
export function assembleReport(snapshot: PersistedJournal, opts: ReportOptions): ReportData {
  const periodDays = opts.periodDays ?? 30;
  const cutoff = dayNumber(opts.today) - periodDays;
  const inWindowDate = <T extends { date: LocalCalendarDate }>(e: T): boolean =>
    dayNumber(e.date) >= cutoff;
  const inWindowWeek = <T extends { weekStart: LocalCalendarDate }>(e: T): boolean =>
    dayNumber(e.weekStart) >= cutoff;

  const checkIns = snapshot.dailyCheckIns.filter(inWindowDate);
  const screenings = snapshot.weeklyScreenings.filter(inWindowWeek);
  const thoughtRecords = snapshot.thoughtRecords.filter(inWindowDate);
  const activations = snapshot.behavioralActivations.filter(inWindowDate);
  const triggers = snapshot.triggerLogs.filter(inWindowDate);
  const safetyFlags = snapshot.safetyFlags.filter(inWindowDate);

  const keys: ScreenerKey[] = ['phq2', 'gad2', 'pss4', 'who5'];
  const screeners = {} as Record<ScreenerKey, ScreenerReport>;
  // latest screening (by weekStart) feeds the per-instrument latest score+level
  const latestScreening = [...screenings].sort((a, b) =>
    a.weekStart < b.weekStart ? 1 : a.weekStart > b.weekStart ? -1 : 0,
  )[0];
  const latestResults = latestScreening
    ? scoreScreening({
        phq2: latestScreening.phq2,
        gad2: latestScreening.gad2,
        pss4: latestScreening.pss4,
        who5: latestScreening.who5,
      })
    : null;
  for (const key of keys) {
    screeners[key] = {
      trajectory: screenerTrajectory(screenings, key),
      direction: screenerDirection(screenings, key),
      latest: latestResults ? { score: latestResults[key].score, level: latestResults[key].level } : null,
    };
  }

  return {
    periodDays,
    since: sinceDate(opts.today, periodDays),
    mood: { trend: moodTrend(checkIns), direction: moodDirection(checkIns) },
    screeners,
    distortions: topDistortions(thoughtRecords),
    behavioral: behavioralSuccessRate(activations),
    coping: copingEffectiveness(triggers),
    recurringTriggers: recurringTriggers(triggers),
    safetyFlagCount: safetyFlags.length,
  };
}
