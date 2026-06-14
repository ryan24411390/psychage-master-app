import { describe, expect, it } from 'vitest';

import { dateToHhmm, formatReminderTime, hhmmToDate } from '@/features/settings/format-time';

describe('formatReminderTime', () => {
  it('formats 24h → 12h with period', () => {
    expect(formatReminderTime('21:00')).toBe('9:00 PM');
    expect(formatReminderTime('00:00')).toBe('12:00 AM');
    expect(formatReminderTime('12:00')).toBe('12:00 PM');
    expect(formatReminderTime('09:05')).toBe('9:05 AM');
    expect(formatReminderTime('13:30')).toBe('1:30 PM');
  });

  it('falls back to the evening default on invalid input', () => {
    expect(formatReminderTime('99:99')).toBe('9:00 PM');
    expect(formatReminderTime('')).toBe('9:00 PM');
  });
});

describe('hhmmToDate / dateToHhmm', () => {
  it('round-trips a time through a Date', () => {
    const base = new Date(2026, 5, 14, 0, 0, 0, 0);
    const d = hhmmToDate('07:45', base);
    expect(d.getHours()).toBe(7);
    expect(d.getMinutes()).toBe(45);
    expect(dateToHhmm(d)).toBe('07:45');
  });

  it('zero-pads single-digit hours and minutes', () => {
    const base = new Date(2026, 5, 14, 0, 0, 0, 0);
    const d = hhmmToDate('03:05', base);
    expect(dateToHhmm(d)).toBe('03:05');
  });
});
