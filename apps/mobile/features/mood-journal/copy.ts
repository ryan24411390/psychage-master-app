// CT4 FIXTURE — Mood Journal ("patterns & triggers") copy. English-only until i18n
// lands; structured so the move to t('mood-journal.*') is a mechanical swap.
//
// Voice: warm, calm, educational, person-first (CLAUDE.md §7). NO diagnostic
// language (SR-3) — never "you are X", "you have X", never a label or a verdict.
// Frames moments as something a PERSON notices, never something the app concludes.
const FIXTURE = 'FIXTURE — not final copy' as const;

export const CT4_MOOD_JOURNAL = {
  _fixture: 'CT4' as const,
  _marker: FIXTURE,
  title: 'Notice what comes up',
  intro: 'Note how a moment felt and what was around it. Over time, you might notice what tends to come up.',
  addCta: 'Add a moment',
  empty: {
    heading: 'Nothing noted yet',
    body: 'When something stands out — easy or hard — note the feeling and what was around it. Your notes build a picture only you can see.',
  },
  add: {
    // Step 1 — pleasantness (valence). Optional; framed as the person's own read of
    // the moment, never a score the app assigns (SR-3). 1–10 lifted from the web tool.
    valenceHeading: 'How pleasant did it feel?',
    valenceHint: 'Optional — slide from hard to good.',
    valenceLow: 'Hard',
    valenceHigh: 'Good',
    // Step 2 — what & where.
    heading: 'What’s this moment like?',
    emotionsLabel: 'How does it feel?',
    triggersLabel: 'What’s around it?',
    notePlaceholder: 'A word about it — optional',
    next: 'Next',
    back: 'Back',
    save: 'Save this moment',
    saveFailed: 'We couldn’t save that. Try once more.',
    privacy: 'Stays on your phone.',
    close: 'Close',
  },
  patterns: {
    emotionsHeading: 'Feelings you’ve noted',
    triggersHeading: 'What’s come up',
    timelineHeading: 'Your moments',
    valenceLabel: 'Felt',
    delete: 'Delete this moment',
    deleteConfirm: 'Delete?',
    deleteCancel: 'Keep',
    deleteYes: 'Delete',
  },
  // Insights — DESCRIPTIVE patterns only (SR-3): a trend of the person's own ratings
  // and how often each tag came up. Never a verdict, a cause, or a diagnosis. Copy
  // touches feelings → Dr. Dobson review before ship (CLAUDE.md §7); FIXTURE for now.
  insights: {
    valenceHeading: 'How moments have felt',
    valenceCaption: 'Your average rating on the days you logged one.',
    streakDay: 'day in a row',
    streakDays: 'days in a row',
    directionUp: 'Lately, moments have felt a little easier.',
    directionDown: 'Lately, moments have felt a little harder.',
    directionSteady: 'Lately, moments have felt about the same.',
    lowData: 'Log a few more to see how this shifts over time.',
  },
} as const;
