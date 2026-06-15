// ════════════════════════════════════════════════════════════════════════════════
//  HELD FOR REVIEW — NOT WIRED. Imported by NOTHING. Render NONE of this.
// ════════════════════════════════════════════════════════════════════════════════
//
// Clinical- and legal-flagged drafts from PSYCHAGE_MOBILE_CT4_COPY.md, staged here
// verbatim and referenced by no rendered component (CLAUDE.md §7 + the task's safety
// hold: no flagged clinical/legal string is wired to any surface).
//
//   • CLINICAL ([CLINICAL] in the deck) — must clear Dr. Lena Dobson before shipping.
//     The shipped Navigator results already render the live fixture KB descriptions
//     (features/navigator/kb.fixtures.ts); THESE deck drafts are NOT wired in their
//     place. (Review List A: §9 condition descriptions, intro, no-match.)
//   • LEGAL ([LEGAL] in the deck) — Terms/Privacy are SCAFFOLD-ONLY coverage lists.
//     Do NOT ship AI-drafted legal text; counsel authors the bodies. The educational
//     disclaimer body is held for Dr. Dobson + legal sign-off; the app's existing
//     live disclaimer (features/content/copy.ts, features/settings/copy.ts) is
//     untouched by this task.
//
// SR-2: never gate crisis or the severity halt. SR-3: non-diagnostic framing only.
export const PENDING_REVIEW_COPY = {
  _held: true as const,
  _marker: 'HELD FOR REVIEW — NOT WIRED (clinical: Dr. Dobson · legal: counsel)' as const,

  clinical: {
    // §9 Navigator condition descriptions — DRAFTS. Two lines each, common-language,
    // non-diagnostic. (Panic is the Flow Book exemplar; the rest are new drafts.) The
    // full 45-condition set is completed in the clinical pass; this is the voice-setting
    // high-frequency batch, verbatim from §9.
    conditionDescriptions: {
      panic_attacks: 'Panic attacks are common. They are intense, and they pass.',
      generalized_anxiety:
        'Ongoing worry is common. It can feel hard to switch off, and it can ease with the right support.',
      depression:
        'Low mood that lingers is common. It can flatten the things you usually enjoy, and it can lift.',
      social_anxiety:
        'Fear around being judged is common. It can make everyday moments feel large, and it tends to soften with practice and support.',
      sleep_problems:
        'Trouble sleeping is common. It can wear on the whole day, and it often improves once the cause is understood.',
      burnout:
        'Feeling depleted by ongoing stress is common. It is your system asking for rest, and it can recover.',
      grief:
        'Grief is common, and it has no fixed timeline. It moves in waves, and it changes shape over time.',
      health_anxiety:
        'Worry about your health is common. It can feel very real in the body, and a clinician can help you make sense of it.',
      ocd_patterns:
        'Unwanted, repeating thoughts are common. They are not a sign of who you are, and effective support exists.',
      trauma_responses:
        'Strong reactions after a hard or frightening event are common. They are the mind protecting itself, and they can settle with the right help.',
      attention_difficulties:
        'Trouble focusing is common. It can show up across work and home, and understanding why it happens is the first step.',
      mood_swings:
        'Shifts in mood are common. When they feel large or hard to manage, a clinician can help you understand the pattern.',
    },
    // §9 [CT4] — flagged in Review List A for Dr. Dobson framing confirmation.
    navigatorIntro: "Let's make sense of what you're noticing. A few taps, all on your phone.",
    navigatorNoMatch:
      'Nothing here is a close match. That can be its own kind of answer — and a clinician can help you look closer.',
  },

  legal: {
    // §17 educational disclaimer — held for Dr. Dobson + legal sign-off. (The framing is
    // for confirmation; the existing live disclaimers are not changed by this task.)
    disclaimerHeading: "What Psychage is — and isn't",
    disclaimerBody:
      "Psychage is a mental health education tool. It helps you learn, notice, and make sense of how you're doing. It is not a medical service. It does not diagnose, treat, or replace care from a qualified professional. Nothing here is medical advice. If you're struggling, a clinician can help — and if you're in danger, use Help now at the top of any screen.",

    // §17 Terms of Service — SCAFFOLD ONLY (required-coverage list). Body authored by
    // legal counsel; no AI-drafted legal text ships.
    termsCoverage: [
      'acceptance of terms',
      'eligibility / age',
      'description of the service (educational, non-clinical)',
      'acceptable use',
      'user accounts & responsibilities',
      'intellectual property',
      'disclaimers of warranty',
      'limitation of liability',
      'governing law',
      'changes to terms',
      'contact',
    ],
    // §17 Privacy Policy — SCAFFOLD ONLY (required-coverage list). Body authored by counsel.
    privacyCoverage: [
      "what's collected (email, optional name, check-in entries when synced)",
      'what is never collected/transmitted (symptom-navigator selections — on-device only; raw mood data unless synced)',
      'on-device-first model',
      'how account data is stored & secured',
      'sharing (none sold; therapist share is user-initiated)',
      'retention & the right to export/delete (GDPR Art. 17; deletion within 30 days)',
      'crisis-usage counts (never content)',
      "children's data",
      'contact: psychageinc@gmail.com',
    ],
  },
} as const;
