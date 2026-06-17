import {
  type LocalCalendarDate,
  type Moment,
  type MomentValence,
  timestampToLocalCalendarDate,
} from '@psychage/shared/engagement';

// Session-prep aggregation — PURE and deterministic. Turns a window of raw moments
// into the summary the on-demand session-prep document renders: per-feeling and
// per-context frequency, the valence range + distribution, a time-of-day breakdown,
// and EVERY note in the window. It is the person's own record of what they noticed —
// patterns stated plainly, no assessment/diagnosis/severity (Sacred Rule #2/#3).
//
// Why raw moments (not the day-rollup): the rollup collapses each day to one
// representative valence and unions the labels, discarding the intra-day detail this
// summary is about (how often a feeling recurred, when in the day, the spread of
// valence). So we read moments directly and never positive-filter — a complete,
// neutral picture, hard moments and all.
//
// Key-based by design: feeling/context KEYS are aggregated here; key→display wording
// is the document's concern (it owns the curated vocabulary). That keeps this module
// free of UI copy and trivially unit-testable.

/** A key with how many times it appeared across the window's moments. */
export interface FrequencyItem {
  readonly key: string;
  readonly count: number;
}

/** The four parts of the day a moment's local capture time falls into. */
export type TimeOfDayBucket = 'morning' | 'afternoon' | 'evening' | 'night';

/** One note, kept verbatim with the moment it belongs to (for chronological listing). */
export interface SessionPrepNote {
  /** Local calendar day of the capture. */
  readonly date: LocalCalendarDate;
  /** Full capture instant (ISO-8601) — the document formats the local clock time. */
  readonly timestamp: string;
  readonly valence: MomentValence;
  readonly note: string;
}

export interface SessionPrepSummary {
  readonly window: { readonly from: LocalCalendarDate; readonly to: LocalCalendarDate };
  /** Total moments in the window. */
  readonly totalCount: number;
  /** Feeling-label keys, most-noted first (ties broken by key, ascending). */
  readonly feelingFrequency: readonly FrequencyItem[];
  /** Context-domain keys, most-noted first (ties broken by key, ascending). */
  readonly contextFrequency: readonly FrequencyItem[];
  readonly valence: {
    /** Lowest / highest valence captured, or null when the window is empty. */
    readonly min: MomentValence | null;
    readonly max: MomentValence | null;
    /** Count per valence 1..5, always present (zero-filled). */
    readonly distribution: Readonly<Record<MomentValence, number>>;
  };
  /** How many moments fell in each part of the day. */
  readonly timeOfDay: Readonly<Record<TimeOfDayBucket, number>>;
  /** Every note in the window, oldest first. Never positive-filtered. */
  readonly notes: readonly SessionPrepNote[];
}

const VALENCES: readonly MomentValence[] = [1, 2, 3, 4, 5];

/** Local hour → part of day. Boundaries: morning 5–11, afternoon 12–16, evening 17–20, night 21–4. */
export function bucketForHour(hour: number): TimeOfDayBucket {
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 16) return 'afternoon';
  if (hour >= 17 && hour <= 20) return 'evening';
  return 'night';
}

// Tally a stream of keys into a count map.
function tally(keys: Iterable<string>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
  return counts;
}

// Count map → frequency items, most-noted first, ties broken by key ascending (stable
// and machine-independent, so the document snapshot is deterministic).
function toFrequency(counts: Map<string, number>): FrequencyItem[] {
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.key < b.key ? -1 : 1));
}

/**
 * Aggregate a window of moments into a `SessionPrepSummary`. `moments` are the
 * captures within `[window.from, window.to]` (the store's `getRange` already scopes
 * them by local calendar day); the window is echoed for the document header. The
 * input order does not matter — output ordering is fully determined here.
 */
export function buildSessionPrepSummary(
  moments: readonly Moment[],
  window: { readonly from: LocalCalendarDate; readonly to: LocalCalendarDate },
): SessionPrepSummary {
  const distribution: Record<MomentValence, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const timeOfDay: Record<TimeOfDayBucket, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };
  const labelKeys: string[] = [];
  const contextKeys: string[] = [];
  const notes: SessionPrepNote[] = [];
  let min: MomentValence | null = null;
  let max: MomentValence | null = null;

  for (const m of moments) {
    distribution[m.valence] += 1;
    if (min === null || m.valence < min) min = m.valence;
    if (max === null || m.valence > max) max = m.valence;

    // Local accessors — a moment belongs to the device's day/part-of-day, matching
    // the rollup's local-calendar convention (dates.ts).
    timeOfDay[bucketForHour(new Date(m.timestamp).getHours())] += 1;

    for (const key of m.labels) labelKeys.push(key);
    for (const key of m.context) contextKeys.push(key);

    if (m.note !== undefined && m.note.trim() !== '') {
      notes.push({
        date: timestampToLocalCalendarDate(m.timestamp),
        timestamp: m.timestamp,
        valence: m.valence,
        note: m.note,
      });
    }
  }

  notes.sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0));

  return {
    window,
    totalCount: moments.length,
    feelingFrequency: toFrequency(tally(labelKeys)),
    contextFrequency: toFrequency(tally(contextKeys)),
    valence: { min, max, distribution },
    timeOfDay,
    notes,
  };
}

// Re-export so the value list and any caller can iterate valences without re-declaring.
export { VALENCES };
