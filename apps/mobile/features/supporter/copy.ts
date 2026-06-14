// CT4 FIXTURE — placeholder copy for the Supporter surface (S50, U4), NOT final.
// The framing is calm and honest: keep Psychage free. NO guilt, NO "unlock", NO
// "we miss you", NO feature-tie language — those are hard refusals for this surface.

const FIXTURE = 'FIXTURE — not final copy' as const;

export const CT4_SUPPORTER = {
  _fixture: 'CT4' as const,
  _marker: FIXTURE,

  title: 'Keep Psychage free',
  body: "Psychage is free for everyone, and we'd like to keep it that way. If it has been useful and you're able, a one-time contribution helps cover the cost of keeping it open to the people who need it.",
  tiersLabel: 'Choose an amount',
  thanks: 'Thank you — this helps keep Psychage open to everyone.',
  unavailable: "Contributions aren't available just yet. Thank you for wanting to help.",

  tiers: {
    supporter_small: 'A little',
    supporter_medium: 'A bit more',
    supporter_large: 'A lot',
  },
} as const;
