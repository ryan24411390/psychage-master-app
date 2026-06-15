// Clarity Journal — weekly-screening scoring. Ported BYTE-FOR-BYTE from web
// psychage-v2/src/components/tools/ClarityJournal/scoring.ts (formulas +
// thresholds). Returns a ScoreLevel enum only — the educational display words
// are the app's Dr. Dobson-gated fixture (SR-3), never here.

import { GAD2_THRESHOLDS, PHQ2_THRESHOLDS, PSS4_THRESHOLDS, WHO5_THRESHOLDS } from './constants';
import type {
  FrequencyItem,
  ScoreLevel,
  ScreenerResults,
  ScreenerScore,
  StressItem,
  WellbeingItem,
} from './types';

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

/** PHQ-2 total: sum of two 0-3 items (0-6). */
export function scorePHQ2(q1: number, q2: number): number {
  return clamp(q1 + q2, 0, 6);
}

/** GAD-2 total: sum of two 0-3 items (0-6). */
export function scoreGAD2(q1: number, q2: number): number {
  return clamp(q1 + q2, 0, 6);
}

/**
 * PSS-4 adapted (2 items). q1 = "unable to control" (direct); q2 = "confident"
 * (REVERSE scored as 4 - q2). Total = q1 + (4 - q2), range 0-8.
 */
export function scorePSS4(q1: number, q2: number): number {
  return clamp(q1 + (4 - q2), 0, 8);
}

/** WHO-5 adapted (2 items), both direct 0-5. Total 0-10, higher = better. */
export function scoreWHO5(q1: number, q2: number): number {
  return clamp(q1 + q2, 0, 10);
}

export function classifyPHQ2(total: number): ScoreLevel {
  if (total <= PHQ2_THRESHOLDS.low) return 'low';
  if (total <= PHQ2_THRESHOLDS.moderate) return 'moderate';
  return 'elevated';
}

export function classifyGAD2(total: number): ScoreLevel {
  if (total <= GAD2_THRESHOLDS.low) return 'low';
  if (total <= GAD2_THRESHOLDS.moderate) return 'moderate';
  return 'elevated';
}

export function classifyPSS4(total: number): ScoreLevel {
  if (total <= PSS4_THRESHOLDS.low) return 'low';
  if (total <= PSS4_THRESHOLDS.moderate) return 'moderate';
  return 'elevated';
}

/** WHO-5 is inverted: a HIGHER score is better, so good wellbeing → 'low' concern. */
export function classifyWHO5(total: number): ScoreLevel {
  if (total >= WHO5_THRESHOLDS.good) return 'low';
  if (total >= WHO5_THRESHOLDS.moderate) return 'moderate';
  return 'elevated';
}

function result(score: number, level: ScoreLevel): ScreenerScore {
  return { score, level };
}

/** Score + classify all four screeners from their raw items. */
export function scoreScreening(input: {
  phq2: readonly [FrequencyItem, FrequencyItem];
  gad2: readonly [FrequencyItem, FrequencyItem];
  pss4: readonly [StressItem, StressItem];
  who5: readonly [WellbeingItem, WellbeingItem];
}): ScreenerResults {
  const phq2 = scorePHQ2(input.phq2[0], input.phq2[1]);
  const gad2 = scoreGAD2(input.gad2[0], input.gad2[1]);
  const pss4 = scorePSS4(input.pss4[0], input.pss4[1]);
  const who5 = scoreWHO5(input.who5[0], input.who5[1]);
  return {
    phq2: result(phq2, classifyPHQ2(phq2)),
    gad2: result(gad2, classifyGAD2(gad2)),
    pss4: result(pss4, classifyPSS4(pss4)),
    who5: result(who5, classifyWHO5(who5)),
  };
}
