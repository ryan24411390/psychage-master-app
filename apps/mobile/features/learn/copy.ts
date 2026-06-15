// CT4 FIXTURE — Learn tab copy (S6). NOT final.
// Educational framing only — no diagnostic language (Sacred Rule #2). Any
// condition/symptom-facing string here needs Dr. Dobson review before ship.
const FIXTURE = 'FIXTURE — not final copy' as const;

export const CT4_LEARN = {
  _fixture: 'CT4' as const,
  _marker: FIXTURE,

  // Hero
  heroTitle: 'What are you working through?',
  searchPlaceholder: 'Search a feeling, topic, or condition…',
  findPath: 'Not sure where to start? Find your path',

  // Path picker (bottom sheet)
  pickerTitle: "What's pulling at you right now?",
  pickerHint: "Pick the closest one — we'll point you to the right guides. Nothing is saved.",
  pickerSkip: 'Skip — just let me browse',

  // Section titles
  editorsPick: "Editor's pick",
  mostRead: 'Most read this month',
  reads: 'Reads to start with',
  browseTopics: 'Browse by topic',

  // Existing entries
  intro: 'Plain-language guides on what you might be experiencing.',
  conditionsLabel: 'Browse conditions',
  libraryLabel: 'Browse the full library',
  browseAll: 'Browse all topics',

  footnote: 'Guides are educational — not a diagnosis or a substitute for professional care.',
} as const;

// Path-picker options → the curated category id they route to (categories.ts).
export const LEARN_PATHS: readonly { id: string; label: string; route: string }[] = [
  { id: 'anx', label: 'Anxious, tense, or on edge', route: 'anxiety' },
  { id: 'sleep', label: "Can't sleep or wind down", route: 'sleep' },
  { id: 'mood', label: 'Low, flat, or unmotivated', route: 'mood' },
  { id: 'rel', label: 'Something with a relationship', route: 'relationships' },
  { id: 'focus', label: "Can't focus or follow through", route: 'focus' },
  { id: 'exist', label: 'Questioning meaning or purpose', route: 'more' },
] as const;
