// Clarity Score — the scoring core. PURE (no React, no RN, no network) → Vitest.
//
// The composite math is a faithful port of psychage-v2 src/lib/clarity/scoring.ts:
// every instrument normalization, the WHO-5 inversion, the PSS-4 reverse-scoring,
// the clamps, and the round-to-int composite are byte-for-byte the web's. Verified
// against the web by the boundary tests in __tests__/clarity-scoring.test.ts.
//
// Two presentation-layer divergences (NOT math): domain keys are renamed (see
// types.ts) and the threshold "flags" become plain-language `notes` (SR-3). The
// crisis predicate is unchanged and CANNOT be disabled (SR-2).

import type { ClarityAnswers, ClarityDomainScores, ClarityNote, ClarityResult, ClarityTier } from './types';

/** Round to one decimal place (matches the web's per-domain rounding). */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Map a 0–100 composite to its tier. Breakpoints identical to the web. */
export function tierForComposite(score: number): ClarityTier {
  if (score >= 80) return 'thriving';
  if (score >= 60) return 'balanced';
  if (score >= 40) return 'mixed';
  if (score >= 20) return 'strained';
  return 'reachOut';
}

/**
 * Crisis pattern, checked right after the PHQ-4 block (q1–q4): PHQ-4 total ≥ 8, OR
 * the hopelessness item (q4) ≥ 2 ("More than half the days"). SR-2 — this cannot be
 * toggled off; the flow always halts on it before continuing.
 */
export function isCrisisPattern(answers: ClarityAnswers): boolean {
  const phq4Total =
    (answers.q1 || 0) + (answers.q2 || 0) + (answers.q3 || 0) + (answers.q4 || 0);
  const q4Value = answers.q4 ?? 0;
  return phq4Total >= 8 || q4Value >= 2;
}

/**
 * The five domain sub-totals as UN-rounded 0–20 values. The composite is summed from
 * these (then rounded once) — matching the web, which rounds domains only for display,
 * never for the composite. `domainScores` exposes the rounded-for-display form.
 */
function rawDomains(answers: ClarityAnswers): ClarityDomainScores {
  // Emotional Wellness (PHQ-4): raw 0–12, higher = worse.
  const gad2 = (answers.q1 || 0) + (answers.q2 || 0);
  const phq2 = (answers.q3 || 0) + (answers.q4 || 0);
  const phq4Raw = phq2 + gad2;
  const emotional = Math.max(0, 20 - (phq4Raw / 12) * 20);

  // Overall Wellbeing (WHO-5): options are symptom-scaled (0 = best, 5 = worst);
  // invert to a wellbeing raw before normalizing.
  const who5SymptomRaw =
    (answers.q5 || 0) + (answers.q6 || 0) + (answers.q7 || 0) + (answers.q8 || 0) + (answers.q9 || 0);
  const who5Raw = 25 - who5SymptomRaw; // 25 = best
  const who5Percentage = who5Raw * 4; // 0–100
  const wellbeing = Math.max(0, (who5Percentage / 100) * 20);

  // Social Connection (UCLA-3): scale 1–3, min raw 3, max raw 9, lower = better.
  const uclaRaw = (answers.q10 || 1) + (answers.q11 || 1) + (answers.q12 || 1);
  const social = Math.max(0, 20 - ((uclaRaw - 3) / 6) * 20);

  // Stress Load (PSS-4): q13/q16 direct; q14/q15 positive items, reverse-scored.
  const pss1 = answers.q13 || 0;
  const pss2 = 4 - (answers.q14 !== undefined ? answers.q14 : 4);
  const pss3 = 4 - (answers.q15 !== undefined ? answers.q15 : 4);
  const pss4 = answers.q16 || 0;
  const pssScore = pss1 + pss2 + pss3 + pss4; // max 16
  const stress = Math.max(0, 20 - (pssScore / 16) * 20);

  // Daily Functioning (custom): 0–4 per item, higher = worse.
  const funcRaw = (answers.q17 || 0) + (answers.q18 || 0) + (answers.q19 || 0) + (answers.q20 || 0);
  const functioning = Math.max(0, 20 - (funcRaw / 16) * 20);

  return { emotional, wellbeing, social, stress, functioning };
}

/** The five domain sub-totals, each rounded to 1 dp for display (0–20, higher = better). */
export function domainScores(answers: ClarityAnswers): ClarityDomainScores {
  const d = rawDomains(answers);
  return {
    emotional: round1(d.emotional),
    wellbeing: round1(d.wellbeing),
    social: round1(d.social),
    stress: round1(d.stress),
    functioning: round1(d.functioning),
  };
}

/**
 * Plain-language "what stood out" notes. Threshold logic preserved from the web's
 * clinical flags (phq2≥3, gad2≥3, who5%≤28, ucla≥6); the copy is reframed to be
 * person-first and non-diagnostic (SR-3) — no instrument names reach the user.
 * Copy is PROVISIONAL pending Dr. Dobson clinical review (workspace rules §7).
 */
export function clarityNotes(answers: ClarityAnswers): ClarityNote[] {
  const gad2 = (answers.q1 || 0) + (answers.q2 || 0);
  const phq2 = (answers.q3 || 0) + (answers.q4 || 0);
  const who5SymptomRaw =
    (answers.q5 || 0) + (answers.q6 || 0) + (answers.q7 || 0) + (answers.q8 || 0) + (answers.q9 || 0);
  const who5Percentage = (25 - who5SymptomRaw) * 4;
  const uclaRaw = (answers.q10 || 1) + (answers.q11 || 1) + (answers.q12 || 1);

  const notes: ClarityNote[] = [];
  if (phq2 >= 3) notes.push({ id: 'lowMood', text: 'You noted low mood or low interest on most days.' });
  if (gad2 >= 3) notes.push({ id: 'anxious', text: 'You noted feeling anxious or on edge often.' });
  if (who5Percentage <= 28) notes.push({ id: 'lowWellbeing', text: 'Your day-to-day sense of wellbeing has felt low.' });
  if (uclaRaw >= 6) notes.push({ id: 'lonely', text: "You've been feeling disconnected from others lately." });
  return notes;
}

/** The full result for a complete set of answers. */
export function scoreClarity(answers: ClarityAnswers): ClarityResult {
  // Composite is summed from UN-rounded domains then rounded once (web parity);
  // the displayed domains are rounded to 1 dp.
  const raw = rawDomains(answers);
  const composite = Math.round(raw.emotional + raw.wellbeing + raw.social + raw.stress + raw.functioning);
  const domains = domainScores(answers);
  return {
    composite,
    tier: tierForComposite(composite),
    domains,
    notes: clarityNotes(answers),
    crisis: isCrisisPattern(answers),
  };
}
