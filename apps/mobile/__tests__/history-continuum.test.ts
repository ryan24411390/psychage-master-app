import type { CheckInEntry, CheckInState } from '@psychage/shared/check-in';
import { describe, expect, it } from 'vitest';

import { buildContinuum } from '@/features/history/continuum';

// S7 continuum derivation — pure logic. Buckets the local record into Mon–Sun week rows,
// newest first; honest hollows for no-entry days; verbatim VoiceOver labels for entries.

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function entry(date: string, state: CheckInState, note?: string): CheckInEntry {
  return (note === undefined ? { id: date, date, state } : { id: date, date, state, note }) as CheckInEntry;
}

// A fixed Wednesday so the current week is unambiguous.
const TODAY = new Date(2026, 5, 10); // 2026-06-10

describe('buildContinuum', () => {
  it('empty record → the current week alone, today dashed, the rest hollow (no unlock copy)', () => {
    const weeks = buildContinuum([], TODAY);
    expect(weeks).toHaveLength(1);
    const values = weeks[0]?.days.map((d) => d.day.value);
    expect(values).toContain('today');
    expect(values?.filter((v) => v === null)).toHaveLength(6);
    expect(weeks[0]?.days.every((d) => d.entry === null)).toBe(true);
  });

  it("today's entry sits on the today column with its state + verbatim label", () => {
    const weeks = buildContinuum([entry(ymd(TODAY), 3, 'tired')], TODAY);
    const today = weeks[0]?.days.find((d) => d.entry !== null);
    expect(today?.day.value).toBe(3);
    expect(today?.entry?.note).toBe('tired');
    // "<Weekday> 10 June: Good, with a note: tired."
    expect(today?.a11yLabel).toContain('10 June: Good, with a note: tired.');
  });

  it('an entry with no note omits the note clause', () => {
    const weeks = buildContinuum([entry(ymd(TODAY), 2)], TODAY);
    const today = weeks[0]?.days.find((d) => d.entry !== null);
    expect(today?.a11yLabel).toContain('10 June: Okay.');
    expect(today?.a11yLabel).not.toContain('with a note');
  });

  it('no-entry days narrate honestly; today-not-yet is tonally flat', () => {
    const weeks = buildContinuum([], TODAY);
    const labels = weeks[0]?.days.map((d) => d.a11yLabel) ?? [];
    expect(labels.some((l) => l.endsWith(': no entry.'))).toBe(true);
    expect(labels).toContain('Today: not yet.');
  });

  it('spans from the earliest entry to the current week, newest week first', () => {
    const priorWeek = new Date(2026, 5, 7); // 2026-06-07, the immediately-prior Mon–Sun week
    const weeks = buildContinuum([entry(ymd(priorWeek), 1), entry(ymd(TODAY), 4)], TODAY);
    expect(weeks).toHaveLength(2);
    // Newest first: weeks[0] is the current week, strictly after weeks[1].
    expect(
      (weeks[0]?.weekStartIso ?? '').localeCompare(weeks[1]?.weekStartIso ?? ''),
    ).toBeGreaterThan(0);
    // The older entry lives in the second row.
    expect(weeks[1]?.days.some((d) => d.entry !== null)).toBe(true);
  });
});
