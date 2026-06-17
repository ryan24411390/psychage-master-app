// ─────────────────────────────────────────────────────────────────────────────
// Moments — curated affect-labeling vocabulary  (DRAFT — pending clinical review)
// ─────────────────────────────────────────────────────────────────────────────
//
// THE single config the Moments feature carries (no other feature config). It is the
// word set a person chooses from when NAMING a feeling — the affect-labeling primitive's
// raw material. The product offers these words; it NEVER picks or guesses one for the
// person (SR-3 + the prefrontal "name it" mechanism). Person-first, non-diagnostic
// (Sacred Rule #2/#3): affect WORDS a person might use, never condition labels.
//
// STRUCTURE. Words are grouped into tone FAMILIES (a dimensional / circumplex-valence
// model — an established affect-labeling structure) so the picker can browse them by
// feel rather than as a numeric scale. Each word also carries an internal `band` (1..5)
// that day-based read surfaces (terrain, history dot, insights) use to colour a day; the
// band is NEVER shown to the person as a rating and the capture flow never asks them to
// rate. A word is the unit of meaning — the band is a downstream property of the word.
//
// DRAFT / TRIVIALLY SWAPPABLE. The families, words, labels, and band assignments are a
// reasonable starter set, NOT final — Dr. Lena Dobson (Ph.D. Clinical Neuropsychology,
// CLAUDE.md §7 required reviewer) owns the final taxonomy and may replace this whole set
// (including swapping the tone families for a fuller feelings-wheel emotion-family wheel).
// Keys are STABLE and persisted on the Moment; labels/bands/families are presentation and
// may change without touching stored data.

/** Internal affect band — colours a day on the read surfaces; never shown as a rating. */
export type AffectBand = 1 | 2 | 3 | 4 | 5;

export interface AffectWord {
  /** Stable key persisted on the Moment (UI-independent; survives copy edits). */
  readonly key: string;
  /** Display word shown in the picker / history (provisional — clinical review owns wording). */
  readonly label: string;
  /** Internal band for day-based read surfaces. Not shown to the person. */
  readonly band: AffectBand;
}

export interface AffectFamily {
  /** Warm, feeling-tone header shown above the family's words in the picker. */
  readonly title: string;
  readonly words: readonly AffectWord[];
}

// The DRAFT word set — keys preserved across the v1→v2 schema evolution so existing
// moments resolve. Five tone families; each word's band is its family's tone.
export const AFFECT_FAMILIES: readonly AffectFamily[] = [
  {
    title: 'Heavy',
    words: [
      { key: 'overwhelmed', label: 'Overwhelmed', band: 1 },
      { key: 'hopeless', label: 'Hopeless', band: 1 },
      { key: 'numb', label: 'Numb', band: 1 },
      { key: 'alone', label: 'Alone', band: 1 },
      { key: 'exhausted', label: 'Exhausted', band: 1 },
      { key: 'trapped', label: 'Trapped', band: 1 },
    ],
  },
  {
    title: 'Strained',
    words: [
      { key: 'anxious', label: 'Anxious', band: 2 },
      { key: 'drained', label: 'Drained', band: 2 },
      { key: 'discouraged', label: 'Discouraged', band: 2 },
      { key: 'irritable', label: 'Irritable', band: 2 },
      { key: 'restless', label: 'Restless', band: 2 },
      { key: 'tense', label: 'Tense', band: 2 },
    ],
  },
  {
    title: 'In between',
    words: [
      { key: 'steady', label: 'Steady', band: 3 },
      { key: 'flat', label: 'Flat', band: 3 },
      { key: 'so-so', label: 'So-so', band: 3 },
      { key: 'unsettled', label: 'Unsettled', band: 3 },
      { key: 'quiet', label: 'Quiet', band: 3 },
      { key: 'distracted', label: 'Distracted', band: 3 },
    ],
  },
  {
    title: 'Settled',
    words: [
      { key: 'calm', label: 'Calm', band: 4 },
      { key: 'hopeful', label: 'Hopeful', band: 4 },
      { key: 'grateful', label: 'Grateful', band: 4 },
      { key: 'focused', label: 'Focused', band: 4 },
      { key: 'connected', label: 'Connected', band: 4 },
      { key: 'light', label: 'Light', band: 4 },
    ],
  },
  {
    title: 'Bright',
    words: [
      { key: 'joyful', label: 'Joyful', band: 5 },
      { key: 'energized', label: 'Energized', band: 5 },
      { key: 'proud', label: 'Proud', band: 5 },
      { key: 'peaceful', label: 'Peaceful', band: 5 },
      { key: 'loved', label: 'Loved', band: 5 },
      { key: 'excited', label: 'Excited', band: 5 },
    ],
  },
];

/** Every word, flattened (family order). The full vocabulary surface. */
export const ALL_WORDS: readonly AffectWord[] = AFFECT_FAMILIES.flatMap((f) => f.words);

const WORD_BY_KEY: ReadonlyMap<string, AffectWord> = new Map(ALL_WORDS.map((w) => [w.key, w]));

/** A word's band for the read surfaces. Unknown key → 3 (neutral) so a rollup never breaks. */
export function bandForLabel(key: string): AffectBand {
  return WORD_BY_KEY.get(key)?.band ?? 3;
}

/** A word's display label. Unknown key → the raw key (defensive on migrated/foreign data). */
export function wordLabel(key: string): string {
  return WORD_BY_KEY.get(key)?.label ?? key;
}

/** True when `key` is a known vocabulary word. */
export function isAffectWord(key: string): boolean {
  return WORD_BY_KEY.has(key);
}

/**
 * The per-band ANCHOR word — the canonical word the v1→v2 migrator assigns to a legacy
 * moment that was rated (band) but never worded. MUST stay in sync with
 * packages/shared/engagement/migrate.ts `V1_BAND_ANCHOR` (duplicated there as plain
 * strings because the shared package stays vocab-agnostic). Each anchor key must exist
 * in the word set above.
 */
export const BAND_ANCHOR_KEYS: Readonly<Record<AffectBand, string>> = {
  1: 'overwhelmed',
  2: 'anxious',
  3: 'steady',
  4: 'calm',
  5: 'joyful',
};
