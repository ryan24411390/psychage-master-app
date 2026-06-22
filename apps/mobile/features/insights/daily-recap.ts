// Pure aggregation for the gentle daily recap at the top of the Insights screen.
// React-free and store-free (takes already-read records as input) so it is fully
// Vitest-testable. LOCAL-ONLY by construction (SR-4): it only ever receives data the
// caller read from on-device stores; it never reaches the network.
//
// DESCRIPTIVE ONLY (SR-1/SR-3): everything here is a count, a presence flag, or a
// factual note. No composite/wellness/mood SCORE, no percentages, no verdicts, and no
// direction words ("improving"/"declining") — those would read as interpretation. The
// clarity-journal `moodDirection`/`moodTrend` helpers are deliberately NOT used here.

import type { DailyEntry } from '@/lib/daily-rollup';

/** Already-read records the recap is built from. Caller reads the singletons. */
export interface DailyRecapInput {
  readonly checkins: readonly DailyEntry[];
}

/** One cell of the presence calendar — whether a moment was recorded that day. */
export interface PresenceDay {
  readonly date: string; // YYYY-MM-DD
  readonly label: string; // short weekday, e.g. "Mo"
  readonly present: boolean; // a moment was recorded that day
  readonly isToday: boolean;
}

export interface DailyRecap {
  /** Last `windowDays` days, oldest → newest, flagged present where a moment was recorded. */
  readonly presence: readonly PresenceDay[];
  /** Factual weekly line, e.g. "You recorded on 5 of 7 days this week." */
  readonly weeklyRecap: string;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const PRESENCE_WINDOW_DAYS = 7;
const WEEK_DAYS = 7;

/** Local `YYYY-MM-DD` for a Date, using its local (not UTC) calendar fields. */
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Short weekday label for a `YYYY-MM-DD` string, parsed as a local date. */
function weekdayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const idx = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getDay();
  return WEEKDAY_LABELS[idx] ?? '';
}

/**
 * The last `windowDays` calendar days ending today (oldest → newest), each flagged
 * present iff a moment was recorded that day. Presence only — NOT a mood-intensity
 * heatmap: the day's feeling level is never read here.
 */
export function presenceWindow(
  checkins: readonly DailyEntry[],
  today: Date,
  windowDays: number = PRESENCE_WINDOW_DAYS,
): PresenceDay[] {
  const have = new Set(checkins.map((e) => e.date));
  const todayStr = ymd(today);
  const out: PresenceDay[] = [];
  for (let back = windowDays - 1; back >= 0; back--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
    const date = ymd(d);
    out.push({ date, label: weekdayLabel(date), present: have.has(date), isToday: date === todayStr });
  }
  return out;
}

/** Count of distinct check-in days within the last 7 days, inclusive of today. */
export function weeklyCheckInCount(checkins: readonly DailyEntry[], today: Date): number {
  const have = new Set(checkins.map((e) => e.date));
  let count = 0;
  for (let back = 0; back < WEEK_DAYS; back++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
    if (have.has(ymd(d))) count++;
  }
  return count;
}

/** Factual weekly recap line. Descriptive only — no encouragement, no judgement. */
export function weeklyRecapLine(checkins: readonly DailyEntry[], today: Date): string {
  const n = weeklyCheckInCount(checkins, today);
  if (n === 0) return 'No moments recorded this week yet.';
  return `You recorded on ${n} of ${WEEK_DAYS} days this week.`;
}

/** Assemble the recap view-model from already-read records. */
export function buildDailyRecap(input: DailyRecapInput, today: Date): DailyRecap {
  return {
    presence: presenceWindow(input.checkins, today),
    weeklyRecap: weeklyRecapLine(input.checkins, today),
  };
}
