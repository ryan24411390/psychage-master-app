// CT4 FIXTURE — Compass landing copy (S5). The tile strings are kept verbatim with
// the home "When you need something now" group (components/home/HomeView.tsx) so
// Compass and Home agree. NOT final copy.
const FIXTURE = 'FIXTURE — not final copy' as const;

export const CT4_COMPASS = {
  _fixture: 'CT4' as const,
  _marker: FIXTURE,
  headingImmediate: 'Immediate Actions',
  headingReflection: 'Reflection',
  headingExplore: 'Deep Dives',
  toolkit: { title: 'Steady yourself right now', sub: 'Toolkit' },
  navigator: { title: 'Make sense of what you feel', sub: 'Symptom Navigator' },
  relationship: { title: 'Take stock of your connections', sub: 'Relationship Health' },
  mindmate: { title: 'Talk something through', sub: 'MindMate' },
  clarity: { title: 'See how things have felt lately', sub: 'Clarity Score' },
  moodJournal: { title: 'Notice what comes up', sub: 'Mood Journal' },
  sleep: { title: 'Understand your sleep', sub: 'Sleep Architect' },
  toolkits: { title: 'Explore self-help toolkits', sub: 'Toolkits Library' },
} as const;
