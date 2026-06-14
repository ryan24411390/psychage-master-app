// Pure time helpers for the reminder setting (S43). Stored as 'HH:mm' 24h;
// displayed as a 12h string. Vitest-testable (no RN, no Date-now dependence on
// the wall clock for formatting — only the picker bridge constructs a Date).

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** '21:00' → '9:00 PM'. Invalid input falls back to the evening default label. */
export function formatReminderTime(hhmm: string): string {
  const m = hhmm.match(TIME_RE);
  if (!m) return '9:00 PM';
  const hour24 = Number(m[1]);
  const minute = m[2];
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${period}`;
}

/** 'HH:mm' → a Date today at that local time (for seeding the system picker). */
export function hhmmToDate(hhmm: string, base: Date): Date {
  const m = hhmm.match(TIME_RE);
  const d = new Date(base.getTime());
  if (m) {
    d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  } else {
    d.setHours(21, 0, 0, 0);
  }
  return d;
}

/** A Date → 'HH:mm' (zero-padded local time). */
export function dateToHhmm(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
