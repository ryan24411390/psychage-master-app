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
} as const;
