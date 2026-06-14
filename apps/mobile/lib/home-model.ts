import type { CheckInEntry, CheckInState } from '@psychage/shared/check-in';

import type { HomeCard } from '@/components/home/home-card';
import type { TerrainDay, TerrainValue } from '@/components/terrain/terrain-geometry';

// Pure S3 view-model derivation — greeting, status line, record label, CTA label,
// the day/night read, and the 7-day terrain mapping. React-free so it is unit-
// testable under Vitest. All copy is verbatim v5 (see ~/Downloads/psychage-v5.html
// renderStatus / renderIdentity / reads). The anonymous greeting drops the comma +
// name (no name exists in A1 — auth deferred); the order's away greeting "Welcome
// back" (no comma) confirms this rendering.

export type HomeStateKind = 'first-run' | 'regular' | 'checked-in' | 'away';

export type Read = { readonly tag: string; readonly meta: string; readonly title: string };

export type HomeViewModel = {
  readonly greeting: string;
  readonly status: string;
  readonly recordLabel: string;
  readonly terrainDays: readonly TerrainDay[];
  readonly read: Read;
  readonly ctaLabel: string;
  readonly card: HomeCard | null;
};

export function partOfDay(hour: number): 'morning' | 'afternoon' | 'evening' {
  return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
}

export function greeting(kind: HomeStateKind, hour: number, name?: string): string {
  const phrase =
    kind === 'first-run'
      ? 'Welcome'
      : kind === 'away'
        ? 'Welcome back'
        : `Good ${partOfDay(hour)}`;
  return name ? `${phrase}, ${name}` : phrase;
}

export type StatusOptions = {
  /** Regular: the most recent prior entry's label, or undefined if none. */
  yesterdayLabel?: string;
  /** Checked-in: today's saved state label + optional note + whether a prior entry exists. */
  todayLabel?: string;
  todayNote?: string;
  hasPrior?: boolean;
};

export function statusLine(kind: HomeStateKind, opts: StatusOptions = {}): string {
  switch (kind) {
    case 'first-run':
      return 'This is your space. It starts whenever you’re ready.';
    case 'away':
      return 'Your record waited. Nothing was lost.';
    case 'regular':
      return opts.yesterdayLabel
        ? `Not yet checked in today · Yesterday: ${opts.yesterdayLabel}.`
        : 'Not yet checked in today.';
    case 'checked-in': {
      const note = opts.todayNote ? ` · “${opts.todayNote}”` : '';
      const tail = opts.hasPrior ? '. It’s on your record.' : '. Your record has begun.';
      return `Checked in · ${opts.todayLabel ?? ''}${note}${tail}`;
    }
  }
}

/** "Your record" until a 2nd recorded day exists, then "Your last 7 days". */
export function recordLabel(distinctRecordedDays: number): string {
  return distinctRecordedDays >= 2 ? 'Your last 7 days' : 'Your record';
}

export function ctaLabel(checkedInToday: boolean): string {
  return checkedInToday ? 'Update today’s check-in' : 'Check in — 30 seconds';
}

export const READS = {
  day: {
    tag: 'Anxiety & stress',
    meta: 'Today’s read · 4 min',
    title: 'Why your chest gets tight when you worry',
  },
  night: {
    tag: 'Sleep',
    meta: 'Tonight’s read · 4 min',
    title: 'Why worry gets louder at night',
  },
} as const;

/** Night read after 21:00 and before 05:00 (clock-only swap; theme unchanged). */
export function readForHour(hour: number): Read {
  return hour >= 21 || hour < 5 ? READS.night : READS.day;
}

export const READ_CREDIT = 'Reviewed by Dr. Lena Dobson, Ph.D. in Clinical Neuropsychology';

const WEEKDAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAY_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** Short + full weekday labels for the n days ending today (oldest first). */
export function lastNDayLabels(today: Date, n: number): { short: string; full: string }[] {
  const out: { short: string; full: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const day = d.getDay();
    out.push({ short: WEEKDAY_SHORT[day] ?? '', full: WEEKDAY_FULL[day] ?? '' });
  }
  return out;
}

/** Map a 7-slot value array (oldest first) to terrain days with real weekday labels. */
export function toTerrainDays(values: readonly TerrainValue[], today: Date): TerrainDay[] {
  const labels = lastNDayLabels(today, values.length);
  return values.map((value, i) => {
    const label = labels[i];
    return { label: label?.short ?? '', fullLabel: label?.full, value };
  });
}

// --- Live derivation from the RecordStore (sub-slice E) --------------------------

// The subset of CheckInRecordStore the home consumes. Declared structurally so the
// container can be render-tested with an in-memory double without importing the
// shared package's runtime (Jest does not transform the workspace TS package).
export interface HomeStore {
  getToday(): CheckInEntry | undefined;
  getRecent(n: number): CheckInEntry[];
  saveToday(state: CheckInState): CheckInEntry;
}

/** Local YYYY-MM-DD — must match the RecordStore's toLocalCalendarDate so dates compare. */
function localCalendarDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** first-run (no entries) · checked-in (entry today) · regular. (away is dev-only.) */
export function deriveKind(hasAnyEntry: boolean, hasTodayEntry: boolean): HomeStateKind {
  if (!hasAnyEntry) return 'first-run';
  if (hasTodayEntry) return 'checked-in';
  return 'regular';
}

/** Bridge card after a Low/Very-low check-in today; night register + very-low crisis append. */
export function bridgeCardFor(todayState: CheckInState | undefined, hour: number): HomeCard | null {
  if (todayState === undefined || todayState > 1) return null;
  return {
    kind: 'bridge',
    register: hour >= 21 || hour < 5 ? 'night' : 'day',
    veryLow: todayState === 0,
  };
}

/** Build the 7-day terrain from RecordStore entries: entry → state, today gap → 'today', else null. */
export function buildTerrainDaysFromEntries(
  entries: readonly CheckInEntry[],
  today: Date,
  n = 7,
): TerrainDay[] {
  const byDate = new Map<string, CheckInState>();
  for (const e of entries) byDate.set(e.date, e.state);
  const todayStr = localCalendarDate(today);
  const labels = lastNDayLabels(today, n);
  const days: TerrainDay[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (n - 1 - i));
    const dateStr = localCalendarDate(d);
    const state = byDate.get(dateStr);
    const value: TerrainValue = state !== undefined ? state : dateStr === todayStr ? 'today' : null;
    const label = labels[i];
    days.push({ label: label?.short ?? '', fullLabel: label?.full, value });
  }
  return days;
}
