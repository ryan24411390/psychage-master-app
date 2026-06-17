import {
  type EngagementStore,
  type Moment,
  timestampToLocalCalendarDate,
} from '@psychage/shared/engagement';

// The day-rollup adapter — the bridge that lets the DAY-BASED surfaces (home view-
// model, history continuum, reflection, cross-tool insights, therapist export) read
// the EVENT-BASED Moments store without a redesign. It collapses the moment stream
// into one entry per local calendar day that carries the day's RANGE, not a single
// "representative" tap:
//
//   • low/high = lowest / highest valence among that day's moments, mapped 1..5 → 0..4
//   • state    = worst-of-day (== `low`) — the single scalar the grid/threshold/export
//                surfaces use. NEVER the latest tap, NEVER a mean: a rough evening can
//                never be hidden behind a later calm moment (the daily-collapse the
//                momentary model exists to avoid).
//   • count    = how many moments that day
//   • note     = the worst-of-day moment's note (so the surfaced state + note are the
//                SAME moment)
//   • date/id  = the local calendar day (id == date; one entry per day)
//
// `state` stays the ex-CheckInEntry scalar so the many `.state` consumers are unchanged;
// surfaces that can show a span (the terrain band) read `low`/`high`. Read-only: there
// is no per-day write here (capture appends a Moment; there is no daily edit).

/** A 0..4 ordinal — the day-level affect the day-based surfaces consume (ex-CheckInState). */
export type DailyState = 0 | 1 | 2 | 3 | 4;

/**
 * Day-level state labels (verbatim v5), indexed by DailyState 0..4. Single source for
 * the day-based surfaces (history a11y, home status). Lifted from the retired
 * lib/check-in-labels so those surfaces keep their wording after the check-in retire.
 */
export const DAILY_STATE_LABELS: readonly [string, string, string, string, string] = [
  'Very low',
  'Low',
  'Okay',
  'Good',
  'Very good',
];

/** One entry per local calendar day, carrying that day's affect RANGE. */
export interface DailyEntry {
  readonly id: string;
  /** Local calendar day `YYYY-MM-DD`. */
  readonly date: string;
  /** Worst-of-day scalar (== `low`) — the single value the grid/threshold/export surfaces use. */
  readonly state: DailyState;
  /** Lowest valence-state among the day's moments (worst-of-day). */
  readonly low: DailyState;
  /** Highest valence-state among the day's moments (best-of-day). */
  readonly high: DailyState;
  /** How many moments were captured that day (≥ 1). */
  readonly count: number;
  /** The worst-of-day moment's note, if any. */
  readonly note?: string;
}

/** The read surface the day-based consumers depend on (ex-CheckInRecordStore subset). */
export interface DailyRollupReader {
  getToday(): DailyEntry | undefined;
  getRecent(n: number): DailyEntry[];
  getRange(from: string, to: string): DailyEntry[];
  getEntry(id: string): DailyEntry | undefined;
}

function valenceToState(valence: number): DailyState {
  return Math.min(4, Math.max(0, valence - 1)) as DailyState;
}

function localDateNow(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Collapse moments into one DailyEntry per local calendar day, oldest first. Each day
 * carries its RANGE: `low`/`high` are the lowest/highest valence-state that day, `state`
 * is worst-of-day (== `low`), `count` is the number of moments, and `note` is the
 * worst-of-day moment's note. Never the latest tap, never a mean.
 */
export function momentsToDailyEntries(moments: readonly Moment[]): DailyEntry[] {
  const ascending = [...moments].sort((a, b) =>
    a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0,
  );
  // Group EVERY moment by its local calendar day (ascending within each day).
  const byDay = new Map<string, Moment[]>();
  for (const m of ascending) {
    const day = timestampToLocalCalendarDate(m.timestamp);
    const bucket = byDay.get(day);
    if (bucket) bucket.push(m);
    else byDay.set(day, [m]);
  }

  const entries: DailyEntry[] = [];
  for (const [date, dayMoments] of byDay) {
    // dayMoments is non-empty (a day exists only because a moment landed in it).
    let worst = dayMoments[0] as Moment;
    let low = valenceToState(worst.valence);
    let high = low;
    for (const m of dayMoments) {
      const s = valenceToState(m.valence);
      if (s < low) low = s;
      if (s > high) high = s;
      // `<=` keeps the LATEST moment among the lowest (ascending iteration), so `note`
      // is the most recent expression of the day's worst.
      if (s <= valenceToState(worst.valence)) worst = m;
    }
    const base = { id: date, date, state: low, low, high, count: dayMoments.length };
    const note = worst.note;
    entries.push(note !== undefined && note.length > 0 ? { ...base, note } : base);
  }
  return entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Wrap an EngagementStore in the day-based read surface. Each read derives entries
 * fresh from the store's current moments (cheap; the store caches in memory).
 */
export function dailyRollupReader(store: EngagementStore, now: () => Date = () => new Date()): DailyRollupReader {
  const all = () => momentsToDailyEntries(store.getAll());
  return {
    getToday() {
      const today = localDateNow(now());
      return all().find((e) => e.date === today);
    },
    getRecent(n) {
      if (!Number.isInteger(n) || n <= 0) return [];
      return all().reverse().slice(0, n);
    },
    getRange(from, to) {
      return all().filter((e) => e.date >= from && e.date <= to);
    },
    getEntry(id) {
      return all().find((e) => e.id === id);
    },
  };
}
