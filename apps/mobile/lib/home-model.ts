import type { DailyEntry, DailyState } from '@/lib/daily-rollup';

import type { ToolSummary } from '@/features/insights/aggregate';
import type { HomeCard } from '@/components/home/home-card';
import type { TerrainDay, TerrainValue } from '@/components/terrain/terrain-geometry';
import { type Tool, TOOLS, toolUsageStore } from '@/lib/tool-usage-store';

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
  readonly dormantTool: { tool: Tool; sinceDays: number } | null;
  readonly insight: { headline: string; consistency: string } | null;
  readonly inProgressReads: { id: string; progress: number; lastAt: number }[];
  /** Cross-tool summary rows (newest-used first; empty tools omitted). */
  readonly tools: readonly ToolSummary[];
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

/** "Your record" until a 2nd recorded day exists, then "Your last 14 days". */
export function recordLabel(distinctRecordedDays: number): string {
  return distinctRecordedDays >= 2 ? 'Your last 14 days' : 'Your record';
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

// CT4 §0/§11 credit line — VERBATIM, trailing period included. Single source for
// ReviewedByCredit (the one enforcement point wherever reviewed content appears).
export const READ_CREDIT = 'Reviewed by Dr. Lena Dobson, Ph.D. in Clinical Neuropsychology.';

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

/** Map a 14-slot value array (oldest first) to terrain days with real weekday labels. */
export function toTerrainDays(values: readonly TerrainValue[], today: Date): TerrainDay[] {
  const labels = lastNDayLabels(today, values.length);
  return values.map((value, i) => {
    const label = labels[i];
    return { label: label?.short ?? '', fullLabel: label?.full, value };
  });
}

const DAY_MS = 86400000;

export function calculateDormantTool(): { tool: Tool; sinceDays: number } | null {
  const data = toolUsageStore.getUsage();
  const now = Date.now();
  const candidates = Object.values(TOOLS).filter((t) => t.reEngage);
  
  let best: { tool: Tool; sinceDays: number } | null = null;
  for (const t of candidates) {
    const last = data.usage[t.id];
    const since = Math.floor((now - (last ?? data.installedAt)) / DAY_MS);
    if (since >= (t.thresholdDays ?? 14) && (!best || since > best.sinceDays)) {
      best = { tool: t, sinceDays: since };
    }
  }
  return best;
}

const MOOD_LABELS = ["Very low", "Low", "Okay", "Good", "Very good"];

export function generateMoodInsight(days: TerrainDay[]): { headline: string; consistency: string } | null {
  // Extract logged days from the terrain days
  const logged = days.filter(d => typeof d.value === 'number') as { value: number; fullLabel?: string }[];
  if (logged.length === 0) return null;
  
  const consistency = `${logged.length} check-ins · 14 days`;
  if (logged.length < 3) return { headline: "Your record is just beginning.", consistency };

  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  // Terrain days are chronological, so the end of the array is "this week"
  const thisWeek = days.slice(-7).filter(d => typeof d.value === 'number').map(d => d.value as number);
  const lastWeek = days.slice(0, days.length - 7).filter(d => typeof d.value === 'number').map(d => d.value as number);
  
  const wknd = logged.filter(d => d.fullLabel === 'Sunday' || d.fullLabel === 'Saturday').map(d => d.value);
  const week = logged.filter(d => d.fullLabel !== 'Sunday' && d.fullLabel !== 'Saturday').map(d => d.value);

  if (thisWeek.length >= 2 && lastWeek.length >= 2) {
    const delta = avg(thisWeek) - avg(lastWeek);
    if (delta >= 0.6) return { headline: "Steadier this week than last.", consistency };
    if (delta <= -0.6) return { headline: "A little lower this week. That's allowed.", consistency };
  }
  if (wknd.length >= 2 && week.length >= 2 && avg(wknd) - avg(week) >= 0.7) {
    return { headline: "You tend to feel calmer on weekends.", consistency };
  }

  const counts = [0, 0, 0, 0, 0];
  for (const d of logged) counts[d.value] = (counts[d.value] ?? 0) + 1;
  const dom = counts.indexOf(Math.max(...counts));
  const domLabel = MOOD_LABELS[dom] ?? 'okay'; // dom is always a valid 0–4 index here
  return { headline: `Mostly ${domLabel.toLowerCase()} these two weeks.`, consistency };
}

// --- Live derivation from the RecordStore (sub-slice E) --------------------------

// The subset of the day-rollup reader the home consumes (READ-ONLY). The Moments
// engine replaced the check-in: capture appends a Moment via the capture sheet, so
// the home no longer writes through this surface. Declared structurally so the
// container can be render-tested with an in-memory double.
export interface HomeStore {
  getToday(): DailyEntry | undefined;
  getRecent(n: number): DailyEntry[];
  /**
   * Day entries within `[from, to]` inclusive (YYYY-MM-DD local-day strings), oldest
   * first. Mirrors the day-rollup reader's getRange.
   */
  getRange(from: string, to: string): DailyEntry[];
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
export function bridgeCardFor(todayState: DailyState | undefined, hour: number): HomeCard | null {
  if (todayState === undefined || todayState > 1) return null;
  return {
    kind: 'bridge',
    register: hour >= 21 || hour < 5 ? 'night' : 'day',
    veryLow: todayState === 0,
  };
}

/** Build the terrain from RecordStore entries: entry → state, today gap → 'today', else null. */
export function buildTerrainDaysFromEntries(
  entries: readonly DailyEntry[],
  today: Date,
  n = 14,
): TerrainDay[] {
  const byDate = new Map<string, DailyState>();
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

// --- Reflection availability (Flow 12) -------------------------------------------

/**
 * Minimum check-ins in a Monday–Sunday week for that week to have a reflection.
 * Founder-revisable open question (Flow 12 flags 2 / 1 / any-entry as alternatives):
 * THE single source — change here and every boundary moves. Never inline the literal.
 */
export const REFLECTION_MIN_ENTRIES = 3;

/**
 * The Monday–Sunday week IMMEDIATELY BEFORE the week containing `today`, as
 * inclusive YYYY-MM-DD local-day bounds. This is the only week a reflection can be
 * "available" for: a reflection for a completed week becomes available the FOLLOWING
 * Monday, so the candidate is always the prior completed week — never the in-progress
 * one. (Weeks are Monday–Sunday; LocalCalendarDate is device-local-day based, so all
 * arithmetic is local — no UTC, matching the RecordStore's date rules.)
 */
export function priorWeekBounds(today: Date): { from: string; to: string } {
  // JS getDay(): 0=Sun..6=Sat. Map to Mon=0..Sun=6 to find this week's Monday.
  const daysSinceMonday = (today.getDay() + 6) % 7;
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  const priorMonday = new Date(y, m, d - daysSinceMonday - 7);
  const priorSunday = new Date(y, m, d - daysSinceMonday - 1);
  return { from: localCalendarDate(priorMonday), to: localCalendarDate(priorSunday) };
}

/**
 * Is this week's reflection available? True iff the prior completed Monday–Sunday
 * week held ≥ REFLECTION_MIN_ENTRIES check-ins. A mid-week Nth entry in the CURRENT
 * week never triggers it — only the following Monday, when that week becomes the
 * prior one, can. Weeks below the threshold simply have no reflection (the user is
 * never told they "missed" one — the caller renders nothing). Dismissal is layered
 * on by the caller; this is the pure store-derived trigger.
 */
export function isReflectionAvailable(store: Pick<HomeStore, 'getRange'>, today: Date): boolean {
  const { from, to } = priorWeekBounds(today);
  return store.getRange(from, to).length >= REFLECTION_MIN_ENTRIES;
}
