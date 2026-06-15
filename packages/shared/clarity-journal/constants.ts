// Clarity Journal — structural + scoring constants. Numeric thresholds, option
// scales, and stable ids only. Human-readable / instrument / clinical wording is
// the app's Dr. Dobson-gated fixture (SR-3), NOT here.

// ── Screener thresholds (byte-parity with web ClarityJournal/constants.ts) ─────
// PHQ-2: 0-2 low, 3-4 moderate, 5-6 elevated.
export const PHQ2_THRESHOLDS = { low: 2, moderate: 4 } as const;
export const GAD2_THRESHOLDS = { low: 2, moderate: 4 } as const;
// PSS-4 (2-item adapted, 0-8): 0-3 low, 4-5 moderate, 6-8 elevated.
export const PSS4_THRESHOLDS = { low: 3, moderate: 5 } as const;
// WHO-5 (2-item adapted, 0-10): inverted — higher is better.
export const WHO5_THRESHOLDS = { good: 7, moderate: 4 } as const;

// ── Option scales (numeric values only; labels live in the app fixture) ────────
export const FREQUENCY_VALUES = [0, 1, 2, 3] as const; // PHQ-2 / GAD-2
export const STRESS_VALUES = [0, 1, 2, 3, 4] as const; // PSS-4
export const WELLBEING_VALUES = [0, 1, 2, 3, 4, 5] as const; // WHO-5

// ── Stable tag / category ids (display strings are fixture) ────────────────────
export const DAILY_TAGS = [
  'stressed', 'grateful', 'anxious', 'calm', 'lonely',
  'hopeful', 'tired', 'motivated', 'irritable', 'content',
] as const;
export type DailyTag = (typeof DAILY_TAGS)[number];

/** Standard CBT cognitive-distortion ids (structural, not diagnostic claims). */
export const COGNITIVE_DISTORTIONS = [
  'all-or-nothing', 'overgeneralization', 'mental-filter',
  'disqualifying-the-positive', 'jumping-to-conclusions', 'catastrophizing',
  'emotional-reasoning', 'should-statements', 'labeling', 'personalization',
] as const;
export type CognitiveDistortion = (typeof COGNITIVE_DISTORTIONS)[number];

export const WELLNESS_CATEGORY_IDS = ['physical', 'social', 'mental', 'professional'] as const;
export type WellnessCategoryId = (typeof WELLNESS_CATEGORY_IDS)[number];

export const ACTIVATION_TYPES = ['mastery', 'pleasure', 'both'] as const;

// ── Safety plan structure (Stanley-Brown 6 sections; titles are fixture) ───────
export const SAFETY_PLAN_SECTION_NUMBERS = [1, 2, 3, 4, 5, 6] as const;
/** Sections that collect contacts (people/agencies). */
export const SAFETY_PLAN_CONTACT_SECTIONS = [3, 4, 5] as const;

/** Default crisis contact seeded into safety-plan section 4 (US locale). The
 *  region-resolved helpline replaces/augments this in the app via features/crisis. */
export const DEFAULT_CRISIS_CONTACT = { label: '988 Suicide & Crisis Lifeline', phone: '988' } as const;

// ── Bounds ─────────────────────────────────────────────────────────────────────
export const MOOD_MIN = 1;
export const MOOD_MAX = 10;
export const EMOTION_MIN = 0;
export const EMOTION_MAX = 10;
export const SEVERITY_MIN = 1;
export const SEVERITY_MAX = 5;
