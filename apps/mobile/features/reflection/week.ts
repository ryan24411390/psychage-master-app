import type { DailyEntry, DailyState } from '@/lib/daily-rollup';

import type { TerrainDay } from '@/components/terrain/terrain-geometry';
import { priorWeekBounds, REFLECTION_MIN_ENTRIES } from '@/lib/home-model';

import { REFLECTION_LINES, type ReflectionLineKey, selectReflectionLine } from './reflection-line';

// Reflection week derivation — computed ON-DEVICE from the local RecordStore via the
// getRange injection seam (no network, offline-complete). Pure (no React) → Vitest.
// Local-day arithmetic throughout (matches the RecordStore's date rules + priorWeekBounds).

// [abbreviation, full name], Monday-first. Iterated (not index-accessed) so each label
// is a definite string under noUncheckedIndexedAccess.
const DAYS = [
  ['Mon', 'Monday'],
  ['Tue', 'Tuesday'],
  ['Wed', 'Wednesday'],
  ['Thu', 'Thursday'],
  ['Fri', 'Friday'],
  ['Sat', 'Saturday'],
  ['Sun', 'Sunday'],
] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The minimal store surface S9/S10 consume — just the inclusive range read. */
export interface RangeStore {
  getRange(from: string, to: string): DailyEntry[];
}

export interface ReflectionNote {
  readonly day: string;
  readonly note: string;
}

export interface WeekReflection {
  readonly weekStartIso: string;
  readonly weekEndIso: string;
  readonly rangeLabel: string;
  readonly days: TerrainDay[];
  readonly notes: ReflectionNote[];
  readonly lineKey: ReflectionLineKey;
  readonly line: string;
  readonly entryCount: number;
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

function shortDate(iso: string): string {
  const d = parseIso(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Build one week's reflection from its inclusive Mon–Sun ISO bounds. */
export function buildWeekReflection(
  store: RangeStore,
  weekStartIso: string,
  weekEndIso: string,
): WeekReflection {
  const byDate = new Map<string, DailyEntry>();
  for (const e of store.getRange(weekStartIso, weekEndIso)) {
    byDate.set(e.date as string, e);
  }

  const start = parseIso(weekStartIso);
  const days: TerrainDay[] = [];
  const notes: ReflectionNote[] = [];
  const states: DailyState[] = [];

  DAYS.forEach(([abbr, full], i) => {
    const iso = toIso(addDays(start, i));
    const entry = byDate.get(iso);
    const high = entry && entry.high > entry.state ? entry.high : undefined;
    days.push({
      label: abbr,
      fullLabel: full,
      value: entry ? entry.state : null,
      ...(high !== undefined ? { high } : {}),
    });
    if (entry) {
      states.push(entry.state);
      if (entry.note) notes.push({ day: full, note: entry.note });
    }
  });

  const lineKey = selectReflectionLine(states);
  return {
    weekStartIso,
    weekEndIso,
    rangeLabel: `${shortDate(weekStartIso)} – ${shortDate(weekEndIso)}`,
    days,
    notes,
    lineKey,
    line: REFLECTION_LINES[lineKey],
    entryCount: states.length,
  };
}

/** The prior completed Mon–Sun week — the one S9 reflects on. */
export function buildPriorWeekReflection(store: RangeStore, today: Date): WeekReflection {
  const { from, to } = priorWeekBounds(today);
  return buildWeekReflection(store, from, to);
}

/**
 * Earlier weeks (S10): the weeks BEFORE the prior one that hold a reflection
 * (≥ REFLECTION_MIN_ENTRIES entries), newest first. Scans back `maxWeeks`.
 */
export function buildEarlierWeeks(store: RangeStore, today: Date, maxWeeks = 12): WeekReflection[] {
  const { from } = priorWeekBounds(today);
  let monday = parseIso(from);
  const out: WeekReflection[] = [];
  for (let w = 0; w < maxWeeks; w++) {
    monday = addDays(monday, -7);
    const startIso = toIso(monday);
    const endIso = toIso(addDays(monday, 6));
    const week = buildWeekReflection(store, startIso, endIso);
    if (week.entryCount >= REFLECTION_MIN_ENTRIES) out.push(week);
  }
  return out;
}
