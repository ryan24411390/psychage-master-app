// CT4 — PLACEHOLDER COPY, NOT FINAL. Milestones + celebration strings. Person-first,
// warm, NEVER diagnostic (Sacred Rule #2). CUMULATIVE-ONLY voice: progress only ever
// adds up — no streak, no "current run", no "you missed", no loss/deficit framing of
// any kind. A not-yet-reached marker is "not yet", never "locked" or "missed". Final
// copy clinically reviewed by Dr. Dobson before ship.

export const MILESTONES_COPY = {
  // Progress strip on the history surface.
  title: 'Milestones',
  subline: 'Every moment you capture adds up.',
  /** Marker label, e.g. "10 moments". */
  markerLabel: (n: number) => (n === 1 ? '1 moment' : `${n} moments`),
  /** Accessible state — neutral, future-facing (never "missed"/"locked"). */
  markerReached: (n: number) => `${n === 1 ? '1 moment' : `${n} moments`}, reached`,
  markerUpcoming: (n: number) => `${n === 1 ? '1 moment' : `${n} moments`}, not yet`,

  // Celebration overlay (fires from the 2nd rung up; the 1st is silent).
  celebrateEyebrow: 'Milestone',
  celebrateTitle: (n: number) => `${n} moments`,
  celebrateBody: "Look how far you've come.",
  celebrateDismiss: 'Keep going',
  /** Accessible announcement for the celebration surface. */
  celebrateA11y: (n: number) => `Milestone reached: ${n} moments captured. Look how far you've come.`,
} as const;
