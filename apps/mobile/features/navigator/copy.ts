// Symptom Navigator chrome copy (Flow 13, S13–S18) — VERBATIM from
// PSYCHAGE_MOBILE_CT4_COPY.md §9. Externalized from NavigatorFlow / ResultsView /
// HaltView (CT4 copy-application task). ONLY the chrome that maps 1:1 to a rendered
// element lives here. EN-only at ship.
//
// SR-4: the Navigator is fully on-device; this is presentational copy only — no
// state, no scoring. Apostrophes are straight to match the shipped render + the
// RNTL assertions (NavigatorFlow.test.tsx).
//
// DELIBERATELY NOT HERE (staged / out of scope — see COPY_CONFLICTS_APPLIED.md):
//   • Intro line + Q1/Q2 headings + no-match results state — flagged for Dr. Dobson
//     (Review List A) and/or have no rendered element; held in features/pendingReview.
//   • Condition descriptions ([CLINICAL]) — held in features/pendingReview, unwired.
//   • Relevance tier phrases — produced by the shared engine (relevance_label), not copy.
export const NAVIGATOR_COPY = {
  // Q1 area chips (§9 [FINAL])
  areaBody: 'Body',
  areaMind: 'Mind',
  areaSleep: 'Sleep',
  areaBoth: 'Both/not sure',

  // Severity check (§9 [FINAL]) — always asked; SR-4 halt on "Yes".
  severityQuestion: 'Right now, are you thinking about hurting yourself, or do you feel unsafe?',
  severityNo: 'No',
  severityYes: 'Yes',

  // Step chrome (§9 [FINAL] escape chip; rest are generic UI)
  continue: 'Continue',
  somethingElse: 'Something else',
  searchPlaceholder: 'Search',
  searchA11y: 'Search symptoms',
  noMatch: 'No match',
  back: 'Back',

  // Results (§9 [FINAL])
  caveat: 'No online tool can be certain. A clinician can.',
  readAbout: 'Read about this',
  steadyingNow: 'Something steadying now',
  findCare: 'Find professional care',
  saveForLater: 'Save this for later',

  // Halt (§9 [FINAL])
  haltLead: "Then let's pause this. What you're feeling deserves real support right now.",
  goBack: 'Go back',

  // ── Web-parity chrome (ported from psychage-v2 Navigator screens) ──────────────
  // Welcome
  welcomeTitle: 'Understand your experience.',
  welcomeSubtitle:
    "Answer a few questions about what you've been noticing. We'll point you toward patterns and resources — this is educational, never a diagnosis.",
  welcomeDisclaimer:
    'This tool provides educational information only. It is not a diagnosis or a substitute for professional care. If you are in crisis, contact emergency services or a crisis line.',
  welcomeStart: 'Start the Navigator',

  // Domains
  domainTitle: 'Where are you noticing things?',
  domainSubtitle: 'Choose the areas that feel relevant. You can pick more than one.',
  selectAll: 'Select all areas',

  // Symptoms
  symptomsTitle: 'What have you been experiencing?',
  symptomsSubtitle: 'Select everything that applies. Tap a section to expand it.',

  // Detail (per-symptom)
  detailProgress: (n: number, total: number) => `Symptom ${n} of ${total}`,
  detailSeverityLabel: 'How intense does this feel?',
  detailDurationLabel: 'How long has this been going on?',
  detailFrequencyLabel: 'How often does it happen?',
  detailAnalyze: 'See results',

  // Processing
  processingFootnote: 'Please wait while we prepare your personalized insights.',

  // Results
  startOver: 'Start over',
} as const;
