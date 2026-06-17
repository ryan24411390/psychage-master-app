import { DAILY_STATE_LABELS as STATE_LABELS, type DailyEntry as CheckInEntry } from '@/lib/daily-rollup';

// S46 export serialization — pure, Vitest-testable. TYPE-ONLY import of the shared
// types (erased at compile) so this module loads in a Jest render path without
// pulling the shared package's runtime in.
//
// SR-4 note: a user-initiated export to a file the user controls (the OS share
// sheet) is NOT the silent backend/telemetry exfiltration SR-4 forbids. This
// module must never additionally log entries to Sentry/analytics.

// The export subsystem's format version — independent of the store's schema version,
// so this module needs no runtime import from the shared package. Monotonic across
// every export artifact (JSON/CSV record + the therapist PDFs), bumped when any of them
// gains structure. v2 added the day's RANGE to the record: `state` is worst-of-day
// (== `low`), and `high`/`highLabel`/`count` are added (CSV columns + JSON fields) so a
// multi-modal day exports its span, not just one tap. v3 adds the session-prep document
// (a new PDF artifact stamped with this version); the JSON/CSV record shape is unchanged
// at v3.
export const EXPORT_FORMAT_VERSION = 3 as const;

// Wide lexical bounds: the day key is fixed-width YYYY-MM-DD, so lexical order ==
// chronological. getRange is inclusive, so this captures every day entry.
const MIN_DATE = '0000-01-01';
const MAX_DATE = '9999-12-31';

interface ReadableStore {
  getRange(from: string, to: string): CheckInEntry[];
}

/** Read every entry (oldest first) — the sanctioned all-entries read path. */
export function readAllEntries(store: ReadableStore): CheckInEntry[] {
  return store.getRange(MIN_DATE, MAX_DATE);
}

export function toJSON(entries: readonly CheckInEntry[]): string {
  return JSON.stringify(
    {
      exportFormatVersion: EXPORT_FORMAT_VERSION,
      kind: 'psychage-check-in-record',
      entries,
    },
    null,
    2,
  );
}

// RFC4180: wrap a field in quotes and double any embedded quote when it contains
// a comma, quote, or newline.
function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCSV(entries: readonly CheckInEntry[]): string {
  // `state`/`stateLabel` stay worst-of-day (unchanged columns); `high`/`highLabel`/`count`
  // append the day's span so the export is honest about a multi-modal day.
  const header = 'date,state,stateLabel,high,highLabel,count,note';
  const rows = entries.map((e) => {
    const note = e.note ?? '';
    return [
      csvField(e.date),
      String(e.state),
      csvField(STATE_LABELS[e.state]),
      String(e.high),
      csvField(STATE_LABELS[e.high]),
      String(e.count),
      csvField(note),
    ].join(',');
  });
  return [header, ...rows].join('\n');
}
