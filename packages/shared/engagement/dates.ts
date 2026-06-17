// Local-calendar-date helpers — the single conversion point between a moment's
// wall-clock `timestamp` and the `YYYY-MM-DD` string the day-rollup groups by.
//
// "Local" is load-bearing: a moment captured at 00:30 belongs to that local day,
// not to UTC's day. We read the local-time accessors (getFullYear/getMonth/getDate),
// never the UTC ones, so the calendar day is the DEVICE's day.

import { type LocalCalendarDate, MomentValidationError } from './types';

const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * The local calendar day of `date`, as `YYYY-MM-DD`. Uses local-time accessors,
 * so 2026-06-17T00:30 (local) → "2026-06-17" regardless of UTC offset.
 */
export function toLocalCalendarDate(date: Date): LocalCalendarDate {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}` as LocalCalendarDate;
}

/**
 * The local calendar day of an ISO-8601 timestamp string. Parses to a `Date` and
 * reads local accessors — the moment's stored `timestamp` is a full instant; this
 * is how a many-per-day stream collapses onto calendar days for the rollup.
 */
export function timestampToLocalCalendarDate(timestamp: string): LocalCalendarDate {
  return toLocalCalendarDate(new Date(timestamp));
}

/**
 * True when `value` is a well-formed `YYYY-MM-DD` with an in-range month (01–12)
 * and day (01–31). Cheap structural validation — guards hand-edited / corrupt blobs.
 */
export function isLocalCalendarDate(value: unknown): value is LocalCalendarDate {
  if (typeof value !== 'string' || !LOCAL_DATE_RE.test(value)) return false;
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

/**
 * Narrow an arbitrary string to a `LocalCalendarDate`, throwing if malformed.
 * Use at the API boundary when a consumer (e.g. a history range) hands in a string.
 */
export function asLocalCalendarDate(value: string): LocalCalendarDate {
  if (!isLocalCalendarDate(value)) {
    throw new MomentValidationError(`"${value}" is not a YYYY-MM-DD local calendar date`);
  }
  return value;
}
