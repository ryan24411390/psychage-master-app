// CT4 — PLACEHOLDER COPY, NOT FINAL. Therapist-share copy is not Flow-Book-verbatim;
// every string is a labelled placeholder. Person-first, never diagnostic (Sacred Rule
// #2), NO clinical vocabulary (whole-wave hard refusal). Final copy is clinically
// reviewed by Dr. Dobson before ship. PDF_FOOTER is load-bearing → flagged CT4.

export const THERAPIST_COPY = {
  // S38 — Why / consent intro.
  consentTitle: 'Share with your provider', // CT4
  consentBody:
    'Your provider sees the days you checked in and how you described each one. No scores, no labels — just your own words and the dates.', // CT4
  consentPrimary: 'Add your provider', // CT4

  // S39 — Add provider (one provider in V1).
  providerNameLabel: 'Provider name', // CT4
  providerNameHint: 'Who you want to share this with', // CT4
  providerContactLabel: 'Email or phone (optional)', // CT4
  addProviderPrimary: 'Save provider', // CT4

  // S40 — Date range.
  rangeTitle: 'What to share', // CT4
  rangeOption7: 'Last 7 days', // CT4
  rangeOption14: 'Last 14 days', // CT4
  rangeOption30: 'Last 30 days', // CT4
  // Honest about what is in the range. e.g. "18 days, 14 entries".
  rangeCountLine: (days: number, entries: number) =>
    `${days} ${days === 1 ? 'day' : 'days'}, ${entries} ${entries === 1 ? 'entry' : 'entries'}`, // CT4
  rangePrimary: 'Preview', // CT4

  // S41 — PDF preview + share.
  previewNameLabel: 'Your full name', // CT4
  previewNameHint: 'Your provider files the summary by this name', // CT4
  sharePrimary: 'Share', // CT4
  emptyRangeLine: 'No entries in this range yet.', // CT4
  // Opt-in to append other tools' summaries (Clarity, Navigator, Relationship,
  // Mood, Sleep). DEFAULT OFF — the default share stays "check-ins only" to match
  // consentBody. Approved by Dr. Dobson (2026-06-17).
  includeToolsLabel: 'Also include my other tool summaries',
  includeToolsHint:
    'Adds a summary of your Clarity Score, Navigator, Relationship, Mood and Sleep data. Numbers and areas only — still no diagnosis.',

  // The PDF footer — verbatim on every page. LOAD-BEARING → CT4. No clinical
  // vocabulary, no diagnosis language; honest about provenance + consent.
  pdfFooter: 'A personal check-in summary, shared from Psychage with your consent.', // CT4
} as const;
