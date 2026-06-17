// Moments feature copy — per-feature CT4 copy layer (no i18next; EN-only at ship).
// The Moments engine replaces the daily check-in: MOMENTARY, event-based capture.
//
// VOICE (root CLAUDE.md §7 + Sacred Rule #2/#3): warm, calm, educational, person-
// first. NEVER diagnostic/assessment language ("you have", "you are", "your results
// suggest..."). Momentary throughout — no "today's entry", no day framing.
//
// PRIVACY COPY: the old check-in said "Stays on your phone." That is NO LONGER TRUE
// once moments sync to the account, so it is replaced with the accurate
// "Private to your account." (see privacyNote).
//
// PENDING CLINICAL REVIEW: user-facing strings that touch affect are provisional
// until Dr. Lena Dobson signs off (root CLAUDE.md §7 required reviewer).
export const MOMENTS_COPY = {
  // Capture flow
  title: 'How are you right now?',
  subline: 'There’s no wrong answer.',
  valencePrompt: 'How does right now feel?',
  labelPrompt: 'One word, if you want.',
  labelShowMore: 'Show more',
  labelShowFewer: 'Show fewer',
  contextPrompt: 'What’s having the biggest impact on you?',
  notePlaceholder: 'Anything you want to add.',
  save: 'Save this moment',
  saveFailed: 'We couldn’t save that. Try once more.',
  close: 'Close',
  // The accurate privacy line (replaces "Stays on your phone.")
  privacyNote: 'Private to your account.',

  // History
  historyTitle: 'Your moments',
  historyBeginning: 'Your record is just beginning.',
  historyEmpty: 'When you capture a moment, it’ll show up here.',
  historyCount: (n: number) => (n === 1 ? '1 moment so far' : `${n} moments so far`),
} as const;
