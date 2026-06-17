import {
  type EngagementStore,
  type Moment,
  timestampToLocalCalendarDate,
} from '@psychage/shared/engagement';

// The day-rollup adapter — the bridge that lets the DAY-BASED surfaces (home view-
// model, history continuum, reflection, cross-tool insights, therapist export) read
// the EVENT-BASED Moments store without a redesign. It collapses the moment stream
// into one representative entry per local calendar day:
//
//   • state   = the latest moment of that day's valence, mapped 1..5 → 0..4
//   • note    = the latest moment of that day's note (if any)
//   • date/id = the local calendar day (id == date; one entry per day)
//
// This is the SAME shape (`{ id, date, state, note }`) the retired CheckInEntry had,
// so the downstream pure functions are unchanged — only their data source moved from
// the check-in store to the Moments store. Read-only: there is no per-day write here
// (capture appends a Moment; there is no daily edit).

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

/** One representative entry per local calendar day, derived from that day's moments. */
export interface DailyEntry {
  readonly id: string;
  /** Local calendar day `YYYY-MM-DD`. */
  readonly date: string;
  readonly state: DailyState;
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
 * Collapse moments into one DailyEntry per local calendar day, oldest first. The
 * latest-timestamp moment of each day is the representative (its valence → state, its
 * note → note) — matching the day-rollup's representative rule.
 */
export function momentsToDailyEntries(moments: readonly Moment[]): DailyEntry[] {
  const ascending = [...moments].sort((a, b) =>
    a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0,
  );
  // Iterating ascending and overwriting per day leaves the LATEST moment as the value.
  const latestByDay = new Map<string, Moment>();
  for (const m of ascending) latestByDay.set(timestampToLocalCalendarDate(m.timestamp), m);

  const entries: DailyEntry[] = [];
  for (const [date, m] of latestByDay) {
    const base = { id: date, date, state: valenceToState(m.valence) };
    entries.push(m.note !== undefined && m.note.length > 0 ? { ...base, note: m.note } : base);
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
