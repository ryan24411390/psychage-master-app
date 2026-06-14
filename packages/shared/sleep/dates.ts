// Local-calendar-date helpers — the single conversion point between a wall-clock
// `Date` and the `YYYY-MM-DD` string the store keys entries by. Mirrors
// @psychage/shared/check-in/dates.ts (kept independent so the subpath is
// self-contained).
//
// "Local" is load-bearing: a night logged at 00:30 belongs to that local day, not
// to UTC's day. We read the local-time accessors (getFullYear/getMonth/getDate),
// never the UTC ones, so the calendar day is the DEVICE's day.

import { SleepValidationError, type LocalCalendarDate } from './types';

const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** The local calendar day of `date`, as `YYYY-MM-DD` (local-time accessors). */
export function toLocalCalendarDate(date: Date): LocalCalendarDate {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}` as LocalCalendarDate;
}

/**
 * True when `value` is a well-formed `YYYY-MM-DD` with an in-range month (01–12)
 * and day (01–31). Cheap structural validation — guards hand-edited / corrupt
 * persisted blobs; the only producer (`toLocalCalendarDate`) is correct by
 * construction.
 */
export function isLocalCalendarDate(value: unknown): value is LocalCalendarDate {
  if (typeof value !== 'string' || !LOCAL_DATE_RE.test(value)) return false;
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

/** Narrow an arbitrary string to a `LocalCalendarDate`, throwing if malformed. */
export function asLocalCalendarDate(value: string): LocalCalendarDate {
  if (!isLocalCalendarDate(value)) {
    throw new SleepValidationError(`"${value}" is not a YYYY-MM-DD local calendar date`);
  }
  return value as LocalCalendarDate;
}

/**
 * A stable ordinal day number for a LocalCalendarDate (days since the Unix epoch).
 * Uses `Date.UTC` purely as fixed calendar arithmetic — NOT a wall clock — so
 * day-to-day differencing (streaks, "within 7 days") is exact and timezone-proof.
 */
export function dayNumber(date: LocalCalendarDate): number {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}
