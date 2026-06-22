// Centralized, on-doctrine copy for the Insights surface (P45–P48). Kept in one file so
// Dr. Dobson can review every user-facing string in one place before ship.
//
// Doctrine (SR-2/SR-3): educational + person-first; never diagnostic. No second-person
// condition claims, no diagnostic framing, no emoji. Charts are never called a "trend" or a
// "score" — they are "over time" and counts. Apostrophes use the typographic form.

export const INSIGHTS_COPY = {
  title: 'Insights',
  intro:
    'A private look at the feelings you’ve recorded, gathered here on your device. Nothing on this screen leaves your phone.',
  partsExplainer:
    'Each moment holds three things: a feeling level from low to high, the words you chose for it, and what was on your mind.',

  noData: {
    title: 'No feelings recorded yet',
    why: 'This is where your recorded moments gather over time. There’s nothing to show yet because no moments have been saved on this device.',
    how: 'Record a moment whenever a feeling shows up — even a quick one. Your history and the views below fill in from there.',
    cta: 'Record a moment',
  },

  history: {
    heading: 'Your moments',
    subhead: 'Most recent first.',
  },

  charts: {
    feelingsOverTimeTitle: 'Feelings over time',
    feelingsOverTime: 'Each point is a recorded feeling level from low to high — the most recent is on the right.',
    descriptorsTitle: 'Feelings you’ve named most',
    descriptors: 'The words you’ve reached for most often across your moments.',
    impactsTitle: 'What’s been on your mind',
    impacts: 'What you’ve linked to your moments most often.',
  },

  yourTools: {
    heading: 'Your tools',
    subhead: 'The tools you’ve opened most recently.',
    empty: 'Tools you open will show up here.',
    lastOpenedPrefix: 'Last opened',
  },
} as const;
