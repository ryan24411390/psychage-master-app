import type { TerrainDay } from '@/components/terrain/terrain-geometry';
import { DAILY_STATE_LABELS as STATE_LABELS, type DailyEntry, type DailyState } from '@/lib/daily-rollup';

// S7 History continuum derivation — pure (no React) → Vitest/Jest. Buckets the local
// record into Monday–Sunday week rows, NEWEST WEEK FIRST, from the current week back to
// the week of the earliest entry (no entries ⇒ just the current week). Each week reuses
// the terrain's TerrainDay shape so S7 can render one C0.3 Terrain per row (read-only).
// Local-day arithmetic throughout (matches the RecordStore date rules). NO aggregates —
// the terrain is the only voice (Flow 11). The per-day `entry` + verbatim VoiceOver
// `a11yLabel` drive S7's dot→S8 overlay targets.

// Mon-first [abbreviation, full name]. Iterated (not index-accessed) so each label is a
// definite string under noUncheckedIndexedAccess.
const DAYS = [
  ['Mon', 'Monday'],
  ['Tue', 'Tuesday'],
  ['Wed', 'Wednesday'],
  ['Thu', 'Thursday'],
  ['Fri', 'Friday'],
  ['Sat', 'Saturday'],
  ['Sun', 'Sunday'],
] as const;

const MONTHS_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** One day cell in a continuum week. `entry` non-null ⇒ a tappable dot (→ S8). */
export interface ContinuumDay {
  readonly day: TerrainDay;
  readonly entry: DailyEntry | null;
  /** Verbatim VoiceOver template, e.g. "Tuesday 4 June: Good, with a note: tired." */
  readonly a11yLabel: string;
}

/** One Monday–Sunday week row (7 days, Mon→Sun). */
export interface ContinuumWeek {
  readonly weekStartIso: string;
  readonly days: ContinuumDay[];
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** The local Monday of the week containing `d` (getDay: 0=Sun…6=Sat). */
function mondayOf(d: Date): Date {
  const dow = d.getDay();
  const backToMonday = dow === 0 ? 6 : dow - 1;
  return addDays(d, -backToMonday);
}

/** Human date for S8's detail header, e.g. "Tuesday 4 June 2026" (data, not copy). */
export function formatEntryDate(iso: string): string {
  const dt = parseIso(iso);
  // getDay: 0=Sun…6=Sat → Mon-first index into DAYS.
  const full = DAYS[(dt.getDay() + 6) % 7]?.[1] ?? '';
  return `${full} ${dt.getDate()} ${MONTHS_FULL[dt.getMonth()]} ${dt.getFullYear()}`;
}

/** Verbatim VoiceOver label for an entry day, e.g. "Tuesday 4 June: Good, with a note: tired." */
function entryA11yLabel(fullDay: string, iso: string, state: DailyState, note?: string): string {
  const dt = parseIso(iso);
  const dateLabel = `${fullDay} ${dt.getDate()} ${MONTHS_FULL[dt.getMonth()]}`;
  const base = `${dateLabel}: ${STATE_LABELS[state]}`;
  return note ? `${base}, with a note: ${note}.` : `${base}.`;
}

/**
 * Build the continuum — newest week first. Future days in the current week render as
 * `null` (hollow); today with no entry renders as `'today'` (dashed). Empty record ⇒
 * the current week alone (honest hollows, no "add more to unlock" copy — Flow 11).
 */
export function buildContinuum(
  entries: readonly DailyEntry[],
  today: Date,
): ContinuumWeek[] {
  const byDate = new Map<string, DailyEntry>();
  for (const e of entries) byDate.set(e.date as string, e);

  const todayIso = toIso(today);
  const currentMonday = mondayOf(today);

  // Earliest entry's Monday (entries are local-day ISO strings → lexical min = chronological).
  let earliestMonday = currentMonday;
  for (const e of entries) {
    const m = mondayOf(parseIso(e.date as string));
    if (m < earliestMonday) earliestMonday = m;
  }

  const weeks: ContinuumWeek[] = [];
  for (
    let monday = currentMonday;
    monday >= earliestMonday;
    monday = addDays(monday, -7)
  ) {
    const days: ContinuumDay[] = DAYS.map(([abbr, full], i) => {
      const iso = toIso(addDays(monday, i));
      const entry = byDate.get(iso) ?? null;
      const value = entry ? entry.state : iso === todayIso ? 'today' : null;
      const a11yLabel = entry
        ? entryA11yLabel(full, iso, entry.state, entry.note)
        : value === 'today'
          ? 'Today: not yet.'
          : `${full}: no entry.`;
      return { day: { label: abbr, fullLabel: full, value }, entry, a11yLabel };
    });
    weeks.push({ weekStartIso: toIso(monday), days });
  }

  return weeks;
}
