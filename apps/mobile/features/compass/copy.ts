// CT4 FIXTURE — Compass landing copy (S5). The tile strings are kept verbatim with
// the home "When you need something now" group (components/home/HomeView.tsx) so
// Compass and Home agree. NOT final copy.
const FIXTURE = 'FIXTURE — not final copy' as const;

export const CT4_COMPASS = {
  _fixture: 'CT4' as const,
  _marker: FIXTURE,
  heading: 'When you need something now',
  toolkit: { title: 'Steady yourself right now', sub: 'Toolkit' },
  navigator: { title: 'Make sense of what you feel', sub: 'Symptom Navigator' },
  relationship: { title: 'Take stock of your connections', sub: 'Relationship Health' },
} as const;
