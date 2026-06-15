import { describe, expect, it } from 'vitest';

import {
  clarityNotes,
  domainScores,
  isCrisisPattern,
  scoreClarity,
  tierForComposite,
} from '@/features/clarity/scoring';
import type { ClarityAnswers } from '@/features/clarity/types';

// Parity guard for the scoring core. Every expected value here is derived from the
// web's psychage-v2 src/lib/clarity/scoring.ts math (the port is byte-for-byte). If a
// number changes, the port drifted from the web — investigate before updating.

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

describe('domainScores — each domain normalizes to 0–20, higher = better', () => {
  it('all-best answers → every domain 20, composite 100', () => {
    const d = domainScores(ALL_BEST);
    expect(d).toEqual({ emotional: 20, wellbeing: 20, social: 20, stress: 20, functioning: 20 });
    expect(scoreClarity(ALL_BEST).composite).toBe(100);
  });

  it('all-worst answers → every domain 0, composite 0', () => {
    const d = domainScores(ALL_WORST);
    expect(d).toEqual({ emotional: 0, wellbeing: 0, social: 0, stress: 0, functioning: 0 });
    expect(scoreClarity(ALL_WORST).composite).toBe(0);
  });

  it('WHO-5 is inverted: 0 ("All of the time") is best, 5 ("At no time") is worst', () => {
    const best = domainScores({ ...ALL_BEST, q5: 0, q6: 0, q7: 0, q8: 0, q9: 0 });
    const worst = domainScores({ ...ALL_BEST, q5: 5, q6: 5, q7: 5, q8: 5, q9: 5 });
    expect(best.wellbeing).toBe(20);
    expect(worst.wellbeing).toBe(0);
  });

  it('PSS-4 q14/q15 are reverse-scored: more "confident/going my way" = better stress score', () => {
    const confident = domainScores({ ...ALL_BEST, q14: 4, q15: 4 });
    const notConfident = domainScores({ ...ALL_BEST, q14: 0, q15: 0 });
    expect(confident.stress).toBeGreaterThan(notConfident.stress);
  });

  it('missing PSS positive items default to worst-case (4 → reverse 0), not best', () => {
    // The web defaults an unanswered q14/q15 to 4 before reverse-scoring → contributes 0.
    const d = domainScores({ q13: 0, q16: 0 });
    expect(d.stress).toBe(20); // pss2 = 4-4 = 0, pss3 = 4-4 = 0
  });
});

describe('tierForComposite — breakpoints identical to the web (80/60/40/20)', () => {
  it.each([
    [100, 'thriving'],
    [80, 'thriving'],
    [79, 'balanced'],
    [60, 'balanced'],
    [59, 'mixed'],
    [40, 'mixed'],
    [39, 'strained'],
    [20, 'strained'],
    [19, 'reachOut'],
    [0, 'reachOut'],
  ] as const)('score %i → %s', (score, tier) => {
    expect(tierForComposite(score)).toBe(tier);
  });
});

describe('isCrisisPattern — PHQ-4 total ≥ 8 OR q4 (hopelessness) ≥ 2 (SR-2, cannot be disabled)', () => {
  it('fires when the PHQ-4 total reaches 8', () => {
    expect(isCrisisPattern({ q1: 2, q2: 2, q3: 2, q4: 2 })).toBe(true);
  });

  it('fires on q4 ≥ 2 alone, even with an otherwise low total', () => {
    expect(isCrisisPattern({ q1: 0, q2: 0, q3: 0, q4: 2 })).toBe(true);
  });

  it('does NOT fire below both thresholds', () => {
    expect(isCrisisPattern({ q1: 1, q2: 1, q3: 1, q4: 1 })).toBe(false);
    expect(isCrisisPattern({ q1: 0, q2: 0, q3: 0, q4: 0 })).toBe(false);
  });
});

describe('clarityNotes — plain-language, person-first, no instrument names (SR-3)', () => {
  it('all-worst surfaces every note', () => {
    const ids = clarityNotes(ALL_WORST).map((n) => n.id).sort();
    expect(ids).toEqual(['anxious', 'lonely', 'lowMood', 'lowWellbeing']);
  });

  it('all-best surfaces no notes', () => {
    expect(clarityNotes(ALL_BEST)).toEqual([]);
  });

  it('no note text leaks a clinical instrument name or a diagnostic verb', () => {
    const text = clarityNotes(ALL_WORST).map((n) => n.text).join(' ').toLowerCase();
    for (const banned of ['phq', 'gad', 'who-5', 'ucla', 'pss', 'you have', 'you are', 'diagnos']) {
      expect(text).not.toContain(banned);
    }
  });
});

describe('scoreClarity — assembles the full result and never carries raw answers forward', () => {
  it('returns composite + tier + domains + notes + crisis', () => {
    const r = scoreClarity(ALL_WORST);
    expect(r.composite).toBe(0);
    expect(r.tier).toBe('reachOut');
    expect(r.crisis).toBe(true);
    expect(Object.keys(r.domains).sort()).toEqual([
      'emotional', 'functioning', 'social', 'stress', 'wellbeing',
    ]);
    // The result shape has no `answers`/`rawScores` field at all.
    expect(r).not.toHaveProperty('answers');
    expect(r).not.toHaveProperty('rawScores');
  });
});
