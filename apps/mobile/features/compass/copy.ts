// CT4 FIXTURE — Compass landing copy (S5). The tile strings are kept verbatim with
// the home "When you need something now" group (components/home/HomeView.tsx) so
// Compass and Home agree. NOT final copy.
const FIXTURE = 'FIXTURE — not final copy' as const;

export const CT4_COMPASS = {
  _fixture: 'CT4' as const,
  _marker: FIXTURE,
  headingRightNow: 'Right now',
  headingOverTime: 'Over time',
  headingDeepDives: 'Deep Dives',
  toolkit: { title: 'Steady yourself right now', sub: 'Toolkit' },
  navigator: { title: 'Make sense of what you feel', sub: 'Symptom Navigator' },
  relationship: { title: 'Take stock of your connections', sub: 'Relationship Health' },
  mindmate: { title: 'Talk something through', sub: 'MindMate' },
  clarity: { title: 'See how things have felt lately', sub: 'Clarity Score' },
  moments: { title: 'Capture how you’re feeling', sub: 'Moments' },
  sleep: { title: 'Understand your sleep', sub: 'Sleep Architect' },
  insights: { title: 'See your patterns over time', sub: 'Insights' },
} as const;
