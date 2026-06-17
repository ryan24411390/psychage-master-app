import type { MomentValence } from '@psychage/shared/engagement';

// Moments curated vocabulary + context domains + the crisis-adjacent set.
//
// These are the TWO clinical-review constants the Moments engine is allowed to carry
// (no other feature config). They are a REASONABLE STARTER SET — explicitly NOT
// final. Person-first, non-diagnostic framing only (Sacred Rule #2/#3): affect
// WORDS a person might use, never condition labels.
//
// ─────────────────────────────────────────────────────────────────────────────
// CLINICAL REVIEW — finalized by Dr. Lena Dobson, Ph.D. in Clinical Neuropsychology
// ─────────────────────────────────────────────────────────────────────────────

/** The lowest point on the 5-point valence scale (used by the acute-handoff predicate). */
export const LOWEST_VALENCE: MomentValence = 1;

export interface MomentLabel {
  /** Stable key persisted on the Moment (UI-independent; survives copy edits). */
  readonly key: string;
  /** Display word shown on the chip (provisional — clinical review owns final wording). */
  readonly label: string;
}

// CONSTANT 1 — the valence-split affect vocabulary + the context domains.
// Tapping a valence narrows the chip set to that band; "show more" reveals the full
// list (ALL_LABELS). Keys are stable; labels are provisional.
export const VALENCE_LABELS: Readonly<Record<MomentValence, readonly MomentLabel[]>> = {
  1: [
    { key: 'overwhelmed', label: 'Overwhelmed' },
    { key: 'hopeless', label: 'Hopeless' },
    { key: 'numb', label: 'Numb' },
    { key: 'alone', label: 'Alone' },
    { key: 'exhausted', label: 'Exhausted' },
    { key: 'trapped', label: 'Trapped' },
  ],
  2: [
    { key: 'anxious', label: 'Anxious' },
    { key: 'drained', label: 'Drained' },
    { key: 'discouraged', label: 'Discouraged' },
    { key: 'irritable', label: 'Irritable' },
    { key: 'restless', label: 'Restless' },
    { key: 'tense', label: 'Tense' },
  ],
  3: [
    { key: 'steady', label: 'Steady' },
    { key: 'flat', label: 'Flat' },
    { key: 'so-so', label: 'So-so' },
    { key: 'unsettled', label: 'Unsettled' },
    { key: 'quiet', label: 'Quiet' },
    { key: 'distracted', label: 'Distracted' },
  ],
  4: [
    { key: 'calm', label: 'Calm' },
    { key: 'hopeful', label: 'Hopeful' },
    { key: 'grateful', label: 'Grateful' },
    { key: 'focused', label: 'Focused' },
    { key: 'connected', label: 'Connected' },
    { key: 'light', label: 'Light' },
  ],
  5: [
    { key: 'joyful', label: 'Joyful' },
    { key: 'energized', label: 'Energized' },
    { key: 'proud', label: 'Proud' },
    { key: 'peaceful', label: 'Peaceful' },
    { key: 'loved', label: 'Loved' },
    { key: 'excited', label: 'Excited' },
  ],
};

/** The context domains — "what's having the biggest impact on you?" (0..n selectable). */
export const CONTEXT_DOMAINS: readonly MomentLabel[] = [
  { key: 'work', label: 'Work' },
  { key: 'relationships', label: 'Relationships' },
  { key: 'family', label: 'Family' },
  { key: 'friends', label: 'Friends' },
  { key: 'health', label: 'Health' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'money', label: 'Money' },
  { key: 'studies', label: 'Studies' },
  { key: 'home', label: 'Home' },
  { key: 'world', label: 'World events' },
];

/** The full flat vocabulary (deduped by key, valence order), for the "show more" view. */
export const ALL_LABELS: readonly MomentLabel[] = (() => {
  const seen = new Set<string>();
  const out: MomentLabel[] = [];
  for (const valence of [1, 2, 3, 4, 5] as const) {
    for (const item of VALENCE_LABELS[valence]) {
      if (!seen.has(item.key)) {
        seen.add(item.key);
        out.push(item);
      }
    }
  }
  return out;
})();

// CONSTANT 2 — the crisis-adjacent label set.
// At LOWEST_VALENCE, any of these labels routes the person to crisis support (SR-2:
// route INTO the ungated surface; never gate it). These are acute-risk words; the
// set is deliberately small and conservative. Clinical review owns the final list.
export const CRISIS_ADJACENT_LABEL_KEYS: ReadonlySet<string> = new Set([
  'hopeless',
  'trapped',
]);
