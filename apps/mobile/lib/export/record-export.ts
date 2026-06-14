import type { CheckInEntry, LocalCalendarDate } from '@psychage/shared/check-in';

import { STATE_LABELS } from '@/lib/check-in-labels';

// S46 export serialization — pure, Vitest-testable. TYPE-ONLY import of the shared
// types (erased at compile) so this module loads in a Jest render path without
// pulling the shared package's runtime in.
//
// SR-4 note: a user-initiated export to a file the user controls (the OS share
// sheet) is NOT the silent backend/telemetry exfiltration SR-4 forbids. This
// module must never additionally log entries to Sentry/analytics.

// The export's own format version — independent of the store's schema version, so
// this module needs no runtime import from the shared package.
export const EXPORT_FORMAT_VERSION = 1 as const;

// Wide lexical bounds: LocalCalendarDate is fixed-width YYYY-MM-DD, so lexical
// order == chronological. getRange is inclusive, so this captures every entry.
// Cast (not asLocalCalendarDate) keeps the import type-only — both strings are
// valid calendar dates, and getRange only string-compares.
const MIN_DATE = '0000-01-01' as LocalCalendarDate;
const MAX_DATE = '9999-12-31' as LocalCalendarDate;

interface ReadableStore {
  getRange(from: LocalCalendarDate, to: LocalCalendarDate): CheckInEntry[];
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
  const header = 'date,state,stateLabel,note';
  const rows = entries.map((e) => {
    const label = STATE_LABELS[e.state];
    const note = e.note ?? '';
    return [csvField(e.date), String(e.state), csvField(label), csvField(note)].join(',');
  });
  return [header, ...rows].join('\n');
}
