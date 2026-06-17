import type { MomentIntensity } from '@psychage/shared/engagement';

// Moments feature copy — per-feature CT4 copy layer (no i18next; EN-only at ship).
// A Moment is an AFFECT-LABELING act: the person NAMES a precise feeling.
//
// VOICE (root CLAUDE.md §7 + Sacred Rule #2/#3): warm, calm, educational, person-first.
// NEVER diagnostic or assessment language — no clinical verdicts, no labeling the person.
// NEVER mood-RATING framing — no "rate your mood", no "mood tracker", no 1–5 scale. The
// act is NAMING, not scoring. Momentary throughout — no "today's entry", no day framing.
//
// PRIVACY COPY: moments may sync to the account (consent-gated), so the line is the
// accurate "Private to your account." — never "Stays on your phone."
//
// PENDING CLINICAL REVIEW: user-facing strings that touch affect are provisional until
// Dr. Lena Dobson signs off (root CLAUDE.md §7 required reviewer).
export const MOMENTS_COPY = {
  // Capture flow — NAMING is the primary act.
  title: 'Name what you feel',
  subline: 'Pick the word that fits closest. There’s no wrong answer.',
  /** Optional single second word. */
  secondaryPrompt: 'Another word, if one fits',
  secondaryHint: 'Optional',
  /** Optional magnitude — how strongly, not how pleasant. */
  intensityPrompt: 'How strong is it?',
  intensityHint: 'Optional',
  intensityLabels: { low: 'A little', med: 'Some', high: 'A lot' } as Record<MomentIntensity, string>,
  /** Optional one-line note. */
  notePrompt: 'Anything to add?',
  notePlaceholder: 'One line, if you want.',
  save: 'Save this moment',
  saveFailed: 'We couldn’t save that. Try once more.',
  /** Single, constant-warmth acknowledgment of the ACT (valence-invariant — never varies by feeling). */
  acknowledged: 'You noticed that.',
  close: 'Close',
  // The accurate privacy line.
  privacyNote: 'Private to your account.',

  // History
  historyTitle: 'Your moments',
  historyBeginning: 'Your record is just beginning.',
  historyEmpty: 'When you name a moment, it’ll show up here.',
  historyCount: (n: number) => (n === 1 ? '1 moment so far' : `${n} moments so far`),
} as const;
