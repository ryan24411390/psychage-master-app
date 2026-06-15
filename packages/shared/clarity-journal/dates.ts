// Local-calendar-date helpers for Clarity Journal. Mirrors check-in/sleep dates
// (kept independent so the subpath is self-contained). "Local" is load-bearing:
// an entry written at 00:30 belongs to that DEVICE day, not UTC's.

import { ClarityJournalValidationError, type LocalCalendarDate } from './types';

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

/** True when `value` is a well-formed `YYYY-MM-DD` with in-range month/day. */
export function isLocalCalendarDate(value: unknown): value is LocalCalendarDate {
  if (typeof value !== 'string' || !LOCAL_DATE_RE.test(value)) return false;
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

/** Narrow a string to a LocalCalendarDate, throwing if malformed. */
export function asLocalCalendarDate(value: string): LocalCalendarDate {
  if (!isLocalCalendarDate(value)) {
    throw new ClarityJournalValidationError(
      `"${value}" is not a YYYY-MM-DD local calendar date`,
    );
  }
  return value as LocalCalendarDate;
}

/**
 * A stable ordinal day number (days since the Unix epoch) for date arithmetic.
 * Uses `Date.UTC` as fixed calendar math — NOT a wall clock — so differencing is
 * exact and timezone-proof.
 */
export function dayNumber(date: LocalCalendarDate): number {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

/**
 * The Monday of the week containing `date`, as a LocalCalendarDate. Weekly
 * screening + reflection are keyed to this so a partial entry from a prior week
 * is distinguishable (EC-10). ISO weeks start Monday.
 */
export function weekStart(date: LocalCalendarDate): LocalCalendarDate {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  // getUTCDay: 0=Sun..6=Sat. Days to subtract to reach Monday.
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const back = (dow + 6) % 7; // Mon→0, Tue→1, … Sun→6
  const ms = Date.UTC(year, month - 1, day) - back * 86_400_000;
  const d = new Date(ms);
  return `${String(d.getUTCFullYear()).padStart(4, '0')}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}` as LocalCalendarDate;
}
