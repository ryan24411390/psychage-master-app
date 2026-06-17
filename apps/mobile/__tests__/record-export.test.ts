import type { DailyEntry as CheckInEntry, DailyState as CheckInState } from '@/lib/daily-rollup';
import type { LocalCalendarDate } from '@psychage/shared/engagement';
import { describe, expect, it } from 'vitest';

import { EXPORT_FORMAT_VERSION, readAllEntries, toCSV, toJSON } from '@/lib/export/record-export';

const entry = (date: string, state: number, note?: string): CheckInEntry => ({
  id: date,
  date: date as LocalCalendarDate,
  state: state as CheckInState,
  ...(note !== undefined ? { note } : {}),
});

const ENTRIES = [entry('2026-06-13', 2), entry('2026-06-14', 4, 'felt, "ok", today\nyes')];

describe('toJSON', () => {
  it('serializes entries under the export format version', () => {
    const parsed = JSON.parse(toJSON(ENTRIES));
    expect(parsed.exportFormatVersion).toBe(EXPORT_FORMAT_VERSION);
    expect(parsed.entries).toHaveLength(2);
  });

  it('empty record → empty entries array', () => {
    expect(JSON.parse(toJSON([])).entries).toEqual([]);
  });
});

describe('toCSV', () => {
  it('emits the header and RFC4180-escapes a note with commas/quotes/newlines', () => {
    const csv = toCSV(ENTRIES);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('date,state,stateLabel,note');
    expect(csv).toContain('2026-06-13,2,Okay,');
    // comma + doubled quotes + embedded newline, all inside one quoted field
    expect(csv).toContain('"felt, ""ok"", today\nyes"');
  });

  it('empty record → header only', () => {
    expect(toCSV([])).toBe('date,state,stateLabel,note');
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
