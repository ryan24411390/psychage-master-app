import type { DailyEntry as CheckInEntry, DailyState as CheckInState } from '@/lib/daily-rollup';
import type { LocalCalendarDate } from '@psychage/shared/engagement';
import { describe, expect, it } from 'vitest';

import { EXPORT_FORMAT_VERSION, readAllEntries, toCSV, toJSON } from '@/lib/export/record-export';

const entry = (
  date: string,
  state: number,
  note?: string,
  high: number = state,
): CheckInEntry => ({
  id: date,
  date: date as LocalCalendarDate,
  state: state as CheckInState,
  low: state as CheckInState,
  high: high as CheckInState,
  count: high > state ? 2 : 1,
  ...(note !== undefined ? { note } : {}),
});

const ENTRIES = [entry('2026-06-13', 2), entry('2026-06-14', 4, 'felt, "ok", today\nyes')];

describe('toJSON', () => {
  it('serializes entries under the export format version, carrying the day range', () => {
    const parsed = JSON.parse(toJSON([entry('2026-06-15', 1, undefined, 4)]));
    // v3: the export subsystem gained the session-prep document; the record's JSON
    // shape is unchanged (state/low/high/count), only the reported version moves.
    expect(EXPORT_FORMAT_VERSION).toBe(3);
    expect(parsed.exportFormatVersion).toBe(3);
    expect(parsed.entries[0]).toMatchObject({ state: 1, low: 1, high: 4, count: 2 });
  });

  it('empty record → empty entries array', () => {
    expect(JSON.parse(toJSON([])).entries).toEqual([]);
  });
});

describe('toCSV', () => {
  it('emits the header and RFC4180-escapes a note with commas/quotes/newlines', () => {
    const csv = toCSV(ENTRIES);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('date,state,stateLabel,high,highLabel,count,note');
    // single-state day: state == high, count 1, empty note
    expect(csv).toContain('2026-06-13,2,Okay,2,Okay,1,');
    // comma + doubled quotes + embedded newline, all inside one quoted field
    expect(csv).toContain('"felt, ""ok"", today\nyes"');
  });

  it('a multi-modal day exports the worst→best span and the count', () => {
    // state = worst-of-day (Very low), high = best-of-day (Good), 3 moments
    const csv = toCSV([{ ...entry('2026-06-15', 0, undefined, 3), count: 3 }]);
    expect(csv).toContain('2026-06-15,0,Very low,3,Good,3,');
  });

  it('empty record → header only', () => {
    expect(toCSV([])).toBe('date,state,stateLabel,high,highLabel,count,note');
  });
});

describe('readAllEntries', () => {
  it('reads through a wide getRange bound (captures every entry)', () => {
    const captured: string[] = [];
    const store = {
      getRange: (from: LocalCalendarDate, to: LocalCalendarDate) => {
        captured.push(from, to);
        return ENTRIES;
      },
    };
    expect(readAllEntries(store)).toHaveLength(2);
    // a wide bound that lexically brackets every real YYYY-MM-DD date
    expect(captured[0]).toBe('0000-01-01');
    expect(captured[1]).toBe('9999-12-31');
  });
});
