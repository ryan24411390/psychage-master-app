import { describe, expect, it } from 'vitest';

import {
  detectNewMilestones,
  isCelebratedMilestone,
  MILESTONE_THRESHOLDS,
  reachedAt,
  SILENT_MILESTONE,
} from '../milestones';

// Cumulative-only: thresholds are TOTAL counts, never runs. These prove a threshold
// flags exactly once, gaps never reset, and a past milestone never re-flags.

describe('MILESTONE_THRESHOLDS', () => {
  it('is the confirmed cumulative ladder', () => {
    expect(MILESTONE_THRESHOLDS).toEqual([1, 10, 30, 100, 250]);
  });
});

describe('detectNewMilestones', () => {
  it('flags a threshold the first time it is crossed', () => {
    expect(detectNewMilestones(1, [])).toEqual([1]);
    expect(detectNewMilestones(10, [1])).toEqual([10]);
    expect(detectNewMilestones(250, [1, 10, 30, 100])).toEqual([250]);
  });

  it('flags nothing between thresholds', () => {
    expect(detectNewMilestones(9, [1])).toEqual([]);
    expect(detectNewMilestones(99, [1, 10, 30])).toEqual([]);
  });

  it('does not re-flag a past milestone on re-capture', () => {
    // Already reached 1 and 10; capturing more (count 12) crosses nothing new.
    expect(detectNewMilestones(12, [1, 10])).toEqual([]);
    // Even landing exactly on a reached threshold count again yields nothing.
    expect(detectNewMilestones(10, [1, 10])).toEqual([]);
  });

  it('is gap-safe: a lower-or-equal count never resets or re-emits', () => {
    // Count can only rise by contract; even if asked about a stale lower count,
    // nothing already reached is re-flagged and nothing is removed.
    expect(detectNewMilestones(5, [1, 10, 30])).toEqual([]);
    expect(detectNewMilestones(0, [1])).toEqual([]);
  });

  it('can flag multiple rungs at once if a count jumps past several', () => {
    // Defensive: a single call that vaults 1→100 surfaces every uncrossed rung.
    expect(detectNewMilestones(100, [])).toEqual([1, 10, 30, 100]);
  });

  it('returns thresholds ascending', () => {
    expect(detectNewMilestones(30, [])).toEqual([1, 10, 30]);
  });
});

describe('reachedAt', () => {
  it('lists every threshold at or below the total', () => {
    expect(reachedAt(0)).toEqual([]);
    expect(reachedAt(1)).toEqual([1]);
    expect(reachedAt(30)).toEqual([1, 10, 30]);
    expect(reachedAt(1000)).toEqual([1, 10, 30, 100, 250]);
  });
});

describe('isCelebratedMilestone', () => {
  it('the first rung is silent; every later rung celebrates', () => {
    expect(SILENT_MILESTONE).toBe(1);
    expect(isCelebratedMilestone(1)).toBe(false);
    expect(isCelebratedMilestone(10)).toBe(true);
    expect(isCelebratedMilestone(30)).toBe(true);
    expect(isCelebratedMilestone(250)).toBe(true);
  });
});
