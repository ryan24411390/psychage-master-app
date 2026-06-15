// Onboarding copy (Flow 1) — VERBATIM from PSYCHAGE_MOBILE_CT4_COPY.md §1. All lines
// are [FINAL] in the Flow Book; reproduced here char-exact. Externalized from the
// WelcomeView / RecordTrustView render sites (CT4 copy-application task) so the move
// to t('onboarding.*') is mechanical once packages/i18n lands. EN-only at ship.
export const ONBOARDING_COPY = {
  // Welcome screen
  welcomeTitle: 'This is Psychage.',
  welcomeBody: "A private record of how you're doing — free, for everyone.",
  continue: 'Continue',

  // The record + trust screen (three body lines, then primary + secondary)
  trustL1: 'Each day, you can note how you are.',
  trustL2: "Five plain words — that's all.",
  trustL3: 'It stays on your phone unless you say otherwise.',
  firstCheckin: 'Do your first check-in — 30 seconds',
  lookAround: 'Look around first',
} as const;
