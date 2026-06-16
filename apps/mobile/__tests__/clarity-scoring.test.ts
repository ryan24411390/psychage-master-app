import { describe, expect, it } from 'vitest';

import {
  calculateClarityScore,
  getRecommendations,
  getScoreLabel,
  getStrengthsAndGrowthDetailed,
  getTierHexColor,
  isCrisisPattern,
  scoreClarity,
} from '@/features/clarity/scoring';
import type { ClarityAnswers } from '@/features/clarity/types';

// Parity guard for the scoring core. Every expected value here is derived from the web's
// psychage-v2 src/lib/clarity/scoring.ts (the port is byte-for-byte). The result SHAPE now
// also matches the web (totalScore, web domain keys, subScores, structuredFlags, label,
// tier). If a number changes, the port drifted from the web — investigate before updating.

/** All five blocks at their BEST answer (lowest symptoms / highest wellbeing). */
const ALL_BEST: ClarityAnswers = {
  q1: 0, q2: 0, q3: 0, q4: 0, // PHQ-4 (0 = not at all)
  q5: 0, q6: 0, q7: 0, q8: 0, q9: 0, // WHO-5 (0 = "All of the time" = best)
  q10: 1, q11: 1, q12: 1, // UCLA-3 (1 = "Hardly ever" = best)
  q13: 0, q14: 4, q15: 4, q16: 0, // PSS-4 (q14/q15 reverse: 4 = best)
  q17: 0, q18: 0, q19: 0, q20: 0, // FUNC (0 = not at all)
};

/** All five blocks at their WORST answer. */
const ALL_WORST: ClarityAnswers = {
  q1: 3, q2: 3, q3: 3, q4: 3,
  q5: 5, q6: 5, q7: 5, q8: 5, q9: 5,
  q10: 3, q11: 3, q12: 3,
  q13: 4, q14: 0, q15: 0, q16: 4,
  q17: 4, q18: 4, q19: 4, q20: 4,
};

describe('calculateClarityScore — composite + domains, web keys & web shape', () => {
  it('all-best → every domain 20, totalScore 100, tier thriving', () => {
    const r = calculateClarityScore(ALL_BEST);
    expect(r.domainScores).toEqual({ emotional: 20, vitality: 20, social: 20, cognitive: 20, functioning: 20 });
    expect(r.totalScore).toBe(100);
    expect(r.tier).toBe('thriving');
    expect(r.label).toBe('Thriving');
    expect(r.flags).toEqual([]);
    expect(r.structuredFlags).toEqual([]);
  });

  it('all-worst → every domain 0, totalScore 0, tier crisis, all four flags + subScores', () => {
    const r = calculateClarityScore(ALL_WORST);
    expect(r.domainScores).toEqual({ emotional: 0, vitality: 0, social: 0, cognitive: 0, functioning: 0 });
    expect(r.totalScore).toBe(0);
    expect(r.tier).toBe('crisis');
    expect(r.label).toBe('Crisis');
    expect(r.subScores).toEqual({ phq2: 6, gad2: 6, who5Percentage: 0, uclaScore: 9, pssScore: 16 });
    expect(r.structuredFlags.map((f) => f.result)).toEqual([
      'PHQ-2: 6/6',
      'GAD-2: 6/6',
      'WHO-5: 0%',
      'UCLA: 9/9',
    ]);
  });

  it('WHO-5 is inverted: 0 ("All of the time") is best, 5 ("At no time") is worst', () => {
    const best = calculateClarityScore({ ...ALL_BEST, q5: 0, q6: 0, q7: 0, q8: 0, q9: 0 });
    const worst = calculateClarityScore({ ...ALL_BEST, q5: 5, q6: 5, q7: 5, q8: 5, q9: 5 });
    expect(best.domainScores.vitality).toBe(20);
    expect(worst.domainScores.vitality).toBe(0);
  });

  it('PSS-4 q14/q15 are reverse-scored; missing positive items default worst-case (4 → reverse 0)', () => {
    const confident = calculateClarityScore({ ...ALL_BEST, q14: 4, q15: 4 });
    const notConfident = calculateClarityScore({ ...ALL_BEST, q14: 0, q15: 0 });
    expect(confident.domainScores.cognitive).toBeGreaterThan(notConfident.domainScores.cognitive);
    // The web defaults an unanswered q14/q15 to 4 before reverse-scoring → contributes 0.
    expect(calculateClarityScore({ q13: 0, q16: 0 }).domainScores.cognitive).toBe(20);
  });

  it('scoreClarity is the same function as calculateClarityScore (alias)', () => {
    expect(scoreClarity).toBe(calculateClarityScore);
  });
});

describe('getScoreLabel — breakpoints + labels identical to the web (80/60/40/20)', () => {
  it.each([
    [100, 'Thriving', 'thriving'],
    [80, 'Thriving', 'thriving'],
    [79, 'Balanced', 'balanced'],
    [60, 'Balanced', 'balanced'],
    [59, 'Concerning', 'struggling'],
    [40, 'Concerning', 'struggling'],
    [39, 'Distressed', 'distressed'],
    [20, 'Distressed', 'distressed'],
    [19, 'Crisis', 'crisis'],
    [0, 'Crisis', 'crisis'],
  ] as const)('score %i → %s', (score, label, tier) => {
    expect(getScoreLabel(score)).toEqual({ label, tier });
  });
});

describe('getTierHexColor — web hex map', () => {
  it.each([
    ['thriving', '#10b981'],
    ['balanced', '#1A9B8C'],
    ['struggling', '#f59e0b'],
    ['distressed', '#f97316'],
    ['crisis', '#ef4444'],
  ] as const)('%s → %s', (tier, hex) => {
    expect(getTierHexColor(tier)).toBe(hex);
  });
});

describe('isCrisisPattern — PHQ-4 total ≥ 8 OR q4 ≥ 2 (SR-2, cannot be disabled)', () => {
  it('fires when the PHQ-4 total reaches 8', () => {
    expect(isCrisisPattern({ q1: 2, q2: 2, q3: 2, q4: 2 })).toBe(true);
  });
  it('fires on q4 ≥ 2 alone, even with an otherwise low total', () => {
    expect(isCrisisPattern({ q1: 0, q2: 0, q3: 0, q4: 2 })).toBe(true);
  });
  it('does NOT fire below both thresholds', () => {
    expect(isCrisisPattern({ q1: 1, q2: 1, q3: 1, q4: 1 })).toBe(false);
  });
});

describe('getStrengthsAndGrowthDetailed — strengths gated at the ≥12/20 floor', () => {
  it('all-best surfaces two strengths and two growth areas', () => {
    const { strengths, growthAreas } = getStrengthsAndGrowthDetailed(calculateClarityScore(ALL_BEST).domainScores);
    expect(strengths).toHaveLength(2);
    expect(growthAreas).toHaveLength(2);
    expect(strengths.every((s) => s.score >= 12)).toBe(true);
  });
  it('all-worst surfaces NO strengths (nothing clears the floor) but still two growth areas', () => {
    const { strengths, growthAreas } = getStrengthsAndGrowthDetailed(calculateClarityScore(ALL_WORST).domainScores);
    expect(strengths).toHaveLength(0);
    expect(growthAreas).toHaveLength(2);
  });
});

describe('getRecommendations — copy verbatim, routes remapped to mobile targets', () => {
  it('all-worst surfaces one rec per low domain, with mobile routes', () => {
    const recs = getRecommendations(calculateClarityScore(ALL_WORST).domainScores);
    expect(recs.map((r) => r.link)).toEqual(['/find', '/toolkit', '/learn', '/tools/sleep', '/find']);
  });
  it('all-best falls back to a single general recommendation', () => {
    const recs = getRecommendations(calculateClarityScore(ALL_BEST).domainScores);
    expect(recs).toHaveLength(1);
    expect(recs[0]?.dimension).toBe('General');
    expect(recs[0]?.link).toBe('/toolkit');
  });
});
