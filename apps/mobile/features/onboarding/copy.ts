// Onboarding copy (Flow 1) — the first-run path that carries a new person to their first
// named Moment. Per-feature CT4 copy layer (no i18next; EN-only at ship), externalized
// from the render sites so the move to t('onboarding.*') is mechanical once packages/i18n
// lands.
//
// MOMENTS, not check-in: the daily check-in was retired (PR #138); onboarding now teaches
// the one skill the product is built on — NAMING a feeling. Momentary throughout: no
// "each day", no "today's entry", no day framing.
//
// VOICE (root CLAUDE.md §7 + Sacred Rules #2/#3): warm, calm, educational, person-first.
// NEVER diagnostic/assessment language ("you have", "you are", "your results suggest...").
//
// PENDING CLINICAL REVIEW: every user-facing string that touches affect is provisional
// until Dr. Lena Dobson signs off (root CLAUDE.md §7 required reviewer), matching how
// features/moments/copy.ts flags itself. The capture step (S3) reuses MOMENTS_COPY from
// features/moments — its copy is NOT duplicated here.
export const ONBOARDING_COPY = {
  // S1 — Welcome / host
  welcomeTitle: 'This is Psychage.',
  welcomeBody: 'A private place to notice how you feel — free, for everyone.',
  begin: 'Begin',
  signIn: 'Already have a record? Sign in',

  // S2 — What naming does
  namingBody:
    'When you can name a feeling, it loosens its grip. Psychage gives you the words — you choose.',
  nameFirstMoment: 'Name your first moment — 20 seconds',
  lookAround: 'Look around first',

  // S4 — Acknowledge the act (valence-blind — identical regardless of the named feeling)
  acknowledge: 'You named it. That’s the whole skill.',
  acknowledgeContinue: 'Continue',

  // S6 — Orient reinforcement. Restates the EVENT-INITIATED model: a Moment is noticed
  // when the person chooses, never on a schedule. Counters any read of the app as a daily
  // prompt. Valence-blind (no named feeling). The #132 tour covers the tabs, not this.
  orientTitle: 'Your space is ready.',
  orientBody: 'Notice a moment whenever you want — no schedule, no pressure.',

  // S7 — Founder / intention beat (terminal onboarding screen). The "made with intention"
  // moment, in the existing brand voice. Attribution is a quiet, swappable placeholder —
  // the exact name/title is pending the founder + Dr. Dobson; not fabricated here.
  founderBody:
    'We built Psychage so making sense of how you feel is as ordinary as noticing the weather.',
  founderAttribution: '— The team at Psychage',

  // Shared close-screen continue label (S6/S7).
  continue: 'Continue',
} as const;
