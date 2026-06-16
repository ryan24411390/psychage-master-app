// Clarity Score — domain types. Pure, platform-agnostic (no React, no RN, no
// network). Ported to FULL web-v2 parity from psychage-v2 src/lib/clarity/types.ts.
//
// PARITY OVERRIDE (feat/clarity-web-parity): the earlier mobile-native divergence
// (renamed domain keys, softened tier vocab, plain-language `notes`) has been
// REVERSED at the user's explicit instruction. The result shape, domain keys
// ('vitality'/'cognitive'), tier vocabulary ('struggling'/'distressed'/'crisis'),
// sub-scores, and structured clinical flags now match the web byte-for-byte.
//
// ⚠️ The diagnostic-adjacent labels and clinical-indicator strings this enables are
// release-gated on Dr. Dobson clinical review + Apple Guideline 1.4.1 review
// (workspace CLAUDE.md §7, §4.12). Crisis detection is unchanged and CANNOT be
// disabled (SR-2). Results remain LOCAL-ONLY on device (SR-4).

/** Raw answers keyed by question id (`q1`..`q20`). Item values are instrument-scaled. */
export type ClarityAnswers = Readonly<Record<string, number>>;

/** The five domain keys, in display order. Keys preserved from the web. */
export type DomainKey = 'emotional' | 'vitality' | 'social' | 'cognitive' | 'functioning';

/**
 * Each domain normalized to 0–20 (higher = better wellbeing). Sum = 0–100 composite.
 * Key mapping (preserved from the web for parity):
 *   'vitality'  → Overall Wellbeing (WHO-5)
 *   'cognitive' → Stress Load (PSS-4)
 */
export interface ClarityDomainScores {
  readonly emotional: number; // PHQ-4
  readonly vitality: number; // WHO-5
  readonly social: number; // UCLA-3
  readonly cognitive: number; // PSS-4
  readonly functioning: number; // custom
}

/** Instrument-specific derived sub-scores surfaced in the report. */
export interface ClaritySubScores {
  readonly phq2: number; // 0–6
  readonly gad2: number; // 0–6
  readonly who5Percentage: number; // 0–100
  readonly uclaScore: number; // 3–9 (raw)
  readonly pssScore: number; // 0–16
}

/** A structured clinical indicator derived from a validated screening threshold. */
export interface ClinicalFlag {
  readonly label: string;
  readonly result: string; // e.g. "PHQ-2: 5/6"
  readonly severity: 'elevated' | 'significant';
}

/** A strength/growth insight tied to one dimension. */
export interface StrengthInsight {
  readonly name: string;
  readonly key: DomainKey;
  readonly score: number;
  readonly insight: string;
}

/** Composite tier. Breakpoints + vocabulary identical to the web (80/60/40/20). */
export type ScoreTier = 'thriving' | 'balanced' | 'struggling' | 'distressed' | 'crisis';

/** The full computed result of one assessment (web `ClarityScoreResult`). */
export interface ClarityScoreResult {
  readonly totalScore: number; // 0–100, rounded int
  readonly domainScores: ClarityDomainScores; // 0–20 each, rounded 1 dp
  readonly subScores: ClaritySubScores;
  readonly rawScores: Record<string, number>;
  readonly flags: string[];
  readonly structuredFlags: ClinicalFlag[];
  readonly strengths: string[]; // top-2 domain names
  readonly growthAreas: string[]; // bottom-2 domain names
  readonly label: string; // e.g. "Thriving", "Concerning"
  readonly tier: ScoreTier;
}

/**
 * Back-compat alias. The flow + result-store referred to the prior mobile shape as
 * `ClarityResult`; the name is retained pointing at the web shape so those call
 * sites keep compiling.
 */
export type ClarityResult = ClarityScoreResult;

/** A recommendation surfaced when a domain is low (≤10/20). Routes to a mobile screen. */
export interface Recommendation {
  readonly dimension: string;
  readonly text: string;
  readonly link: string;
  readonly linkLabel: string;
}

/** One persisted/displayed history entry (web `ClarityHistoryItem`). */
export interface ClarityHistoryItem {
  readonly id: string;
  readonly date: string;
  readonly score: number;
  readonly label?: string;
  readonly domainScores?: ClarityDomainScores;
}
