// SR-1 boundary. The composite sleep score is computed as a 0–100 number for
// parity with the web logic (and testability), but the app must NEVER render that
// number, a gauge, or a percentage bar — sleep is framed as optimization, not a
// verdict. This module is the ONLY sanctioned way to surface the score: it maps a
// 0–100 value to a CLOSED VOCABULARY of four bands. The number stops here.
//
// The band ids are intentionally non-clinical and copy-free; screens map an id to
// localized, clinically-reviewed copy. A finite union keeps the closed vocabulary
// enforced at the type level.

export type SleepScoreBand = 'low' | 'uneven' | 'steady' | 'rested';

/**
 * Map a 0–100 score (overall or a single component) to its band. Thresholds
 * mirror the web's score interpretation buckets (80 / 60 / 40). Out-of-range
 * inputs classify by the same thresholds (so they never throw or leak a number).
 */
export function bandForScore(score: number): SleepScoreBand {
  if (score >= 80) return 'rested';
  if (score >= 60) return 'steady';
  if (score >= 40) return 'uneven';
  return 'low';
}

/** The four bands, lowest → highest. Useful for legends / ordering in the UI. */
export const SLEEP_SCORE_BANDS: readonly SleepScoreBand[] = ['low', 'uneven', 'steady', 'rested'];
