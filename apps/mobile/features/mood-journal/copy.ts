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
    heading: 'What’s this moment like?',
    emotionsLabel: 'How does it feel?',
    triggersLabel: 'What’s around it?',
    notePlaceholder: 'A word about it — optional',
    save: 'Save this moment',
    saveFailed: 'We couldn’t save that. Try once more.',
    privacy: 'Stays on your phone.',
    close: 'Close',
  },
  patterns: {
    emotionsHeading: 'Feelings you’ve noted',
    triggersHeading: 'What’s come up',
    timelineHeading: 'Your moments',
  },
} as const;
