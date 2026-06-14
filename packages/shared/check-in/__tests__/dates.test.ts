// Local-calendar-date helper contract. The "local, not UTC" guarantee is the
// foundation of Date Rule 1, so it is pinned here independently of the store.

import { describe, expect, it } from 'vitest';

import { asLocalCalendarDate, isLocalCalendarDate, toLocalCalendarDate } from '../dates';
import { CheckInValidationError } from '../types';

describe('toLocalCalendarDate', () => {
  // NOTE: these locally-constructed instants read back to their own components in
  // EVERY timezone, so they pin the FORMAT (zero-padding, field order) but cannot
  // by themselves distinguish a local-accessor impl from a getUTC* one. The
  // local-vs-UTC guarantee is pinned separately by the divergence guard below.
  it('formats the calendar day as zero-padded YYYY-MM-DD', () => {
    expect(toLocalCalendarDate(new Date(2026, 5, 17, 0, 30))).toBe('2026-06-17');
    expect(toLocalCalendarDate(new Date(2026, 0, 1, 23, 59))).toBe('2026-01-01');
    expect(toLocalCalendarDate(new Date(2026, 11, 9, 12, 0))).toBe('2026-12-09');
  });

  it('keeps a 00:30 / 23:30 instant on its own local day', () => {
    expect(toLocalCalendarDate(new Date(2026, 5, 16, 23, 30))).toBe('2026-06-16');
    expect(toLocalCalendarDate(new Date(2026, 5, 17, 0, 30))).toBe('2026-06-17');
  });

  it('uses the LOCAL calendar day, NOT the UTC day (Date Rule 1 — guards a getUTC* regression)', () => {
    // Force a positive-offset zone so a 00:30-local instant falls on the PREVIOUS
    // day in UTC. Under the default UTC runner local==UTC and this distinction is
    // invisible; pinning the zone in-test makes the assertion bite in any CI.
    const original = process.env.TZ;
    try {
      process.env.TZ = 'Asia/Kolkata'; // UTC+5:30
      const instant = new Date(2026, 5, 17, 0, 30); // 00:30 local → 2026-06-16 in UTC
      expect(instant.getUTCDate()).not.toBe(instant.getDate()); // precondition: days diverge
      expect(toLocalCalendarDate(instant)).toBe('2026-06-17'); // a getUTC* impl would yield 2026-06-16
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });
});

describe('isLocalCalendarDate', () => {
  it('accepts well-formed in-range dates', () => {
    expect(isLocalCalendarDate('2026-06-17')).toBe(true);
    expect(isLocalCalendarDate('2026-01-01')).toBe(true);
    expect(isLocalCalendarDate('2026-12-31')).toBe(true);
  });

  it('rejects malformed or out-of-range strings and non-strings', () => {
    expect(isLocalCalendarDate('2026-6-7')).toBe(false); // unpadded
    expect(isLocalCalendarDate('2026-13-01')).toBe(false); // month
    expect(isLocalCalendarDate('2026-00-10')).toBe(false); // month
    expect(isLocalCalendarDate('2026-06-32')).toBe(false); // day
    expect(isLocalCalendarDate('2026-06-17T00:30:00Z')).toBe(false); // time-bearing
    expect(isLocalCalendarDate('')).toBe(false);
    expect(isLocalCalendarDate(20260617)).toBe(false);
    expect(isLocalCalendarDate(null)).toBe(false);
  });
});

describe('asLocalCalendarDate', () => {
  it('narrows a valid string', () => {
    expect(asLocalCalendarDate('2026-06-17')).toBe('2026-06-17');
  });

  it('throws CheckInValidationError on a malformed string', () => {
    expect(() => asLocalCalendarDate('17/06/2026')).toThrow(CheckInValidationError);
  });
});
