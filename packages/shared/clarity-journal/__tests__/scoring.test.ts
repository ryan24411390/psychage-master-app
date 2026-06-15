import { describe, expect, it } from 'vitest';

import {
  classifyGAD2,
  classifyPHQ2,
  classifyPSS4,
  classifyWHO5,
  scoreGAD2,
  scorePHQ2,
  scorePSS4,
  scoreScreening,
  scoreWHO5,
} from '../scoring';

// Byte-parity with web psychage-v2/src/components/tools/ClarityJournal/scoring.ts:
// PHQ-2/GAD-2 = clamp(q1+q2,0..6); PSS-4 = clamp(q1+(4-q2),0..8) (q2 reverse);
// WHO-5 = clamp(q1+q2,0..10) inverted. Thresholds: PHQ2/GAD2 low≤2/mod≤4;
// PSS4 low≤3/mod≤5; WHO5 good≥7/mod≥4.

describe('screener scoring (byte-parity)', () => {
  it('PHQ-2/GAD-2 sum and clamp 0..6', () => {
    expect(scorePHQ2(0, 0)).toBe(0);
    expect(scorePHQ2(3, 3)).toBe(6);
    expect(scorePHQ2(3, 5)).toBe(6); // clamps
    expect(scoreGAD2(1, 2)).toBe(3);
  });

  it('PSS-4 reverse-scores the confidence item and clamps 0..8', () => {
    // q1 direct, q2 reverse (4 - q2)
    expect(scorePSS4(0, 4)).toBe(0); // 0 + (4-4)
    expect(scorePSS4(4, 0)).toBe(8); // 4 + (4-0)
    expect(scorePSS4(2, 2)).toBe(4); // 2 + (4-2)
    expect(scorePSS4(4, 4)).toBe(4); // 4 + 0
  });

  it('WHO-5 sums two direct items, clamp 0..10', () => {
    expect(scoreWHO5(0, 0)).toBe(0);
    expect(scoreWHO5(5, 5)).toBe(10);
    expect(scoreWHO5(3, 2)).toBe(5);
  });
});

describe('screener classification (thresholds)', () => {
  it('PHQ-2 / GAD-2: low ≤2, moderate 3-4, elevated ≥5', () => {
    expect(classifyPHQ2(0)).toBe('low');
    expect(classifyPHQ2(2)).toBe('low');
    expect(classifyPHQ2(3)).toBe('moderate');
    expect(classifyPHQ2(4)).toBe('moderate');
    expect(classifyPHQ2(5)).toBe('elevated');
    expect(classifyGAD2(6)).toBe('elevated');
  });

  it('PSS-4: low ≤3, moderate 4-5, elevated ≥6', () => {
    expect(classifyPSS4(3)).toBe('low');
    expect(classifyPSS4(4)).toBe('moderate');
    expect(classifyPSS4(5)).toBe('moderate');
    expect(classifyPSS4(6)).toBe('elevated');
  });

  it('WHO-5 is inverted: good ≥7 → low concern, ≥4 moderate, else elevated', () => {
    expect(classifyWHO5(10)).toBe('low');
    expect(classifyWHO5(7)).toBe('low');
    expect(classifyWHO5(6)).toBe('moderate');
    expect(classifyWHO5(4)).toBe('moderate');
    expect(classifyWHO5(3)).toBe('elevated');
    expect(classifyWHO5(0)).toBe('elevated');
  });
});

describe('scoreScreening aggregates all four', () => {
  it('returns score + level per instrument', () => {
    const r = scoreScreening({ phq2: [3, 3], gad2: [0, 1], pss4: [4, 0], who5: [5, 5] });
    expect(r.phq2).toEqual({ score: 6, level: 'elevated' });
    expect(r.gad2).toEqual({ score: 1, level: 'low' });
    expect(r.pss4).toEqual({ score: 8, level: 'elevated' });
    expect(r.who5).toEqual({ score: 10, level: 'low' });
  });
});
