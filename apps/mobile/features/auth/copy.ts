// CT4 — PLACEHOLDER COPY, NOT FINAL. Auth copy is not Flow-Book-verbatim like the
// core loop; every string here is a labelled placeholder. Person-first, never
// diagnostic (Sacred Rule #2), never clinical. Final copy is clinically reviewed by
// Dr. Dobson before ship (rules/auth.md §10 names this file as the copy home).
//
// rules/auth.md §10: "Specific UI copy lives in features/auth/copy.ts ... here we
// describe intent only." These strings exist so the screens are navigable in
// isolation; do not treat them as final.

export const AUTH_COPY = {
  // S33 — Why / keep-this-safe. The honest persistence framing.
  whyTitle: 'Keep your check-ins safe', // CT4
  whyBody:
    'An account lets your check-ins move with you — a new phone, a lost phone. It is not required to use Psychage.', // CT4
  whyPrimary: 'Use my email', // CT4
  whySecondary: 'Not now', // CT4

  // S34 — Email + password (rules/auth.md §3: email+password is the V1 method).
  signUpTitle: 'Use your email', // CT4
  emailLabel: 'Email', // CT4
  emailHint: 'The email you want your check-ins kept under', // CT4
  passwordLabel: 'Password', // CT4
  passwordHint: 'At least 8 characters', // CT4
  signUpPrimary: 'Create account', // CT4
  signInPrimary: 'Sign in', // CT4
  emailEmptyLine: 'Enter your email', // CT4
  emailInvalidLine: 'That email does not look right', // CT4
  passwordEmptyLine: 'Enter a password', // CT4
  passwordShortLine: 'Use at least 8 characters', // CT4
  // Generic — never leaks whether an account exists (Procedure-B security checklist).
  credentialsLine: 'Those details did not match. Check and try again.', // CT4

  // S35 — Check your email + verification (rules/auth.md §3: verification required).
  verifyTitle: 'Check your email', // CT4
  verifyBody: 'We sent a link to confirm it is you. Tap it, then come back here.', // CT4
  resendLabel: 'Did not get it? Resend', // CT4
  resendCooldownLabel: (seconds: number) => `Resend in ${seconds}s`, // CT4

  // S36 — Migration. Honest, calm, no spinner-theatre.
  migrateSettleLine: 'Settling your check-ins into your account…', // CT4
  migrateDoneLine: 'Your check-ins are with your account.', // CT4
  migrateConflictNote: 'A same-day entry was kept at its newest version.', // CT4
  migrateEmptyLine: 'Nothing to move yet — you are all set.', // CT4

  // S37 — Sign out. Reversible; not destructive.
  signOutTitle: 'Sign out?', // CT4
  signOutBody: 'You can sign back in any time with your email.', // CT4
  signOutPrimary: 'Sign out', // CT4
  signOutCancel: 'Cancel', // CT4

  // Shared offline state — auth needs the network; honest, not a spinner.
  offlineLine: 'You are offline. Reconnect to continue.', // CT4
} as const;
