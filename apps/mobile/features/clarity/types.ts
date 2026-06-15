// Clarity Score — domain types. Pure, platform-agnostic (no React, no RN, no
// network). Ported from psychage-v2 src/lib/clarity/types.ts, with two deliberate
// mobile divergences:
//
//   1. Domain keys are renamed to self-documenting names (emotional / wellbeing /
//      social / stress / functioning). The web kept 'vitality' and 'cognitive'
//      ONLY "for historical DB compatibility" — that constraint does not exist on
//      mobile, where results are local-only (SR-4) and own their own schema.
//   2. Tier vocabulary is softened for the mobile rails (no diagnostic-adjacent
//      "Crisis"/"Distressed" verdict labels). The numeric breakpoints are
//      unchanged; only the labels differ. See bands.ts for the display copy.
//
// The composite scoring math is byte-for-byte the web's (see scoring.ts).

/** Raw answers keyed by question id (`q1`..`q20`). Item values are instrument-scaled. */
export type ClarityAnswers = Readonly<Record<string, number>>;

/** Each domain normalized to 0–20 (higher = better wellbeing). Sum = 0–100 composite. */
export interface ClarityDomainScores {
  readonly emotional: number; // PHQ-4
  readonly wellbeing: number; // WHO-5  (web key: 'vitality')
  readonly social: number; // UCLA-3
  readonly stress: number; // PSS-4  (web key: 'cognitive')
  readonly functioning: number; // custom
}

/** The five domain keys, in display order. */
export type ClarityDomainKey = keyof ClarityDomainScores;

/**
 * Composite tier. Breakpoints match the web (80 / 60 / 40 / 20) but the labels are
 * softened for the mobile no-verdict rail — display copy lives in bands.ts.
 *   thriving ≥80 · balanced ≥60 · mixed ≥40 · strained ≥20 · reachOut <20
 */
export type ClarityTier = 'thriving' | 'balanced' | 'mixed' | 'strained' | 'reachOut';

/**
 * A reframed "what stood out" note. Threshold logic is preserved from the web's
 * clinical flags, but the user-facing `text` is plain-language and person-first
 * (SR-3) — no PHQ/GAD/WHO/UCLA instrument labels surface to the user.
 */
export interface ClarityNote {
  readonly id: 'lowMood' | 'anxious' | 'lowWellbeing' | 'lonely';
  readonly text: string;
}

/** The full computed result of one assessment. Never persisted verbatim (the store
 *  keeps composite + tier + domains only — never `answers`). */
export interface ClarityResult {
  readonly composite: number; // 0–100, rounded
  readonly tier: ClarityTier;
  readonly domains: ClarityDomainScores;
  readonly notes: readonly ClarityNote[];
  /** True when the crisis pattern is present (PHQ-4 total ≥ 8 OR q4 ≥ 2). SR-2. */
  readonly crisis: boolean;
}

/** A recommendation surfaced when a domain is low (≤10/20). Routes to a mobile screen. */
export interface ClarityRecommendation {
  readonly domain: ClarityDomainKey | 'general';
  readonly text: string;
  readonly route: string;
  readonly actionLabel: string;
}
