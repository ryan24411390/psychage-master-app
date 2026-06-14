// Unit tests for the pure local→cloud check-in mapper. No I/O, no client.

import { describe, expect, it } from 'vitest';

import type { CheckInEntry, CheckInState } from '@psychage/shared/check-in';
import {
  experiencedAtToLocalDate,
  localDateToExperiencedAt,
  mapEntryToCheckInInput,
  moodScoreToState,
  stateToMoodScore,
} from '@/lib/check-in-sync-map';

const STATES: CheckInState[] = [0, 1, 2, 3, 4];

function entry(partial: Partial<CheckInEntry> & { state: CheckInState }): CheckInEntry {
  return {
    id: 'cie_test',
    date: '2026-06-15' as CheckInEntry['date'],
    ...partial,
  };
}

describe('state ↔ mood_score scale', () => {
  it('maps 0..4 to the odd midpoints {1,3,5,7,9}', () => {
    expect(STATES.map(stateToMoodScore)).toEqual([1, 3, 5, 7, 9]);
  });

  it('every mapped mood_score is within the DB 1..10 check', () => {
    for (const s of STATES) {
      const score = stateToMoodScore(s);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(10);
    }
  });

  it('round-trips state → mood_score → state for all states', () => {
    for (const s of STATES) {
      expect(moodScoreToState(stateToMoodScore(s))).toBe(s);
    }
  });

  it('clamps out-of-range scores to 0..4', () => {
    expect(moodScoreToState(-5)).toBe(0);
    expect(moodScoreToState(0)).toBe(0);
    expect(moodScoreToState(10)).toBe(4);
    expect(moodScoreToState(99)).toBe(4);
  });
});

describe('local date ↔ experienced_at', () => {
  it('maps a local calendar day to that date UTC-midnight', () => {
    expect(localDateToExperiencedAt('2026-06-15')).toBe('2026-06-15T00:00:00.000Z');
  });

  it('is deterministic — same date always yields the byte-identical instant (idempotency key)', () => {
    expect(localDateToExperiencedAt('2026-06-15')).toBe(localDateToExperiencedAt('2026-06-15'));
  });

  it('distinct local days map to distinct instants (no adjacent-day collision)', () => {
    expect(localDateToExperiencedAt('2026-06-15')).not.toBe(localDateToExperiencedAt('2026-06-14'));
  });

  it('reverse helper recovers the local date', () => {
    expect(experiencedAtToLocalDate('2026-06-15T00:00:00.000Z')).toBe('2026-06-15');
  });
});

describe('mapEntryToCheckInInput', () => {
  it('maps state, date, and user_id; note lands in prompt_response', () => {
    const input = mapEntryToCheckInInput(entry({ state: 3, note: 'rough day' }), 'user-1');
    expect(input).toEqual({
      user_id: 'user-1',
      mood_score: 7,
      experienced_at: '2026-06-15T00:00:00.000Z',
      prompt_response: 'rough day',
      context: {},
    });
  });

  it('omits prompt_response when the entry has no note', () => {
    const input = mapEntryToCheckInInput(entry({ state: 0 }), 'user-1');
    expect(input).not.toHaveProperty('prompt_response');
    expect(input).toMatchObject({ user_id: 'user-1', mood_score: 1, context: {} });
  });

  it('never sets prompt_id (no contextual-prompt concept locally)', () => {
    const input = mapEntryToCheckInInput(entry({ state: 2, note: 'x' }), 'user-1');
    expect(input).not.toHaveProperty('prompt_id');
  });
});
