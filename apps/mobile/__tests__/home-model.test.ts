import { describe, expect, it } from 'vitest';

import {
  ctaLabel,
  greeting,
  lastNDayLabels,
  partOfDay,
  readForHour,
  recordLabel,
  statusLine,
  toTerrainDays,
} from '@/lib/home-model';

describe('partOfDay', () => {
  it('splits morning / afternoon / evening on the v5 thresholds', () => {
    expect(partOfDay(0)).toBe('morning');
    expect(partOfDay(11)).toBe('morning');
    expect(partOfDay(12)).toBe('afternoon');
    expect(partOfDay(17)).toBe('afternoon');
    expect(partOfDay(18)).toBe('evening');
    expect(partOfDay(23)).toBe('evening');
  });
});

describe('greeting', () => {
  it('is time-dynamic for regular + checked-in, and anonymous drops the comma', () => {
    expect(greeting('regular', 9)).toBe('Good morning');
    expect(greeting('regular', 14)).toBe('Good afternoon');
    expect(greeting('checked-in', 20)).toBe('Good evening');
  });

  it('uses the welcome forms for first-run and away', () => {
    expect(greeting('first-run', 9)).toBe('Welcome');
    expect(greeting('away', 9)).toBe('Welcome back');
  });

  it('appends ", name" when a name is present', () => {
    expect(greeting('regular', 20, 'Amara')).toBe('Good evening, Amara');
    expect(greeting('away', 9, 'Amara')).toBe('Welcome back, Amara');
  });
});

describe('statusLine', () => {
  it('first-run', () => {
    expect(statusLine('first-run')).toBe('This is your space. It starts whenever you’re ready.');
  });
  it('away', () => {
    expect(statusLine('away')).toBe('Your record waited. Nothing was lost.');
  });
  it('regular with a prior entry', () => {
    expect(statusLine('regular', { yesterdayLabel: 'Good' })).toBe(
      'Not yet checked in today · Yesterday: Good.',
    );
  });
  it('regular without a prior entry', () => {
    expect(statusLine('regular')).toBe('Not yet checked in today.');
  });
  it('checked-in with note + prior entry', () => {
    expect(statusLine('checked-in', { todayLabel: 'Okay', todayNote: 'tired', hasPrior: true })).toBe(
      'Checked in · Okay · “tired”. It’s on your record.',
    );
  });
  it('checked-in without note, first ever entry', () => {
    expect(statusLine('checked-in', { todayLabel: 'Good', hasPrior: false })).toBe(
      'Checked in · Good. Your record has begun.',
    );
  });
});

describe('recordLabel', () => {
  it('is "Your record" until a 2nd recorded day, then "Your last 7 days"', () => {
    expect(recordLabel(0)).toBe('Your record');
    expect(recordLabel(1)).toBe('Your record');
    expect(recordLabel(2)).toBe('Your last 7 days');
    expect(recordLabel(5)).toBe('Your last 7 days');
  });
});

describe('ctaLabel', () => {
  it('switches on whether today is checked in', () => {
    expect(ctaLabel(false)).toBe('Check in — 30 seconds');
    expect(ctaLabel(true)).toBe('Update today’s check-in');
  });
});

describe('readForHour', () => {
  it('swaps to the sleep read from 21:00 to before 05:00', () => {
    expect(readForHour(14).tag).toBe('Anxiety & stress');
    expect(readForHour(20).tag).toBe('Anxiety & stress');
    expect(readForHour(21).tag).toBe('Sleep');
    expect(readForHour(3).tag).toBe('Sleep');
    expect(readForHour(5).tag).toBe('Anxiety & stress');
  });
});

describe('lastNDayLabels / toTerrainDays', () => {
  it('returns n consecutive labels ending today (oldest first)', () => {
    const today = new Date(2026, 5, 14);
    const labels = lastNDayLabels(today, 7);
    expect(labels).toHaveLength(7);
    expect(labels.every((l) => l.short.length === 2 && l.full.length > 2)).toBe(true);
  });

  it('maps a value array to terrain days with the today column last', () => {
    const today = new Date(2026, 5, 14);
    const days = toTerrainDays([1, 2, 3, null, 1, 2, 'today'], today);
    expect(days).toHaveLength(7);
    expect(days[6]?.value).toBe('today');
    expect(days[5]?.value).toBe(2);
    expect(days[0]?.value).toBe(1);
    expect(days[6]?.fullLabel).toBeTruthy();
  });
});
