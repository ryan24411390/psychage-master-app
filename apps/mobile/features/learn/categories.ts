export type LearnCategory = { id: string; label: string };

// FIXED order — never adaptive, never sorted, never personalized (a content
// invariant). The order is frozen here; the rail renders it as-is.
export const LEARN_CATEGORIES: readonly LearnCategory[] = [
  { id: 'anxiety', label: 'Anxiety & stress' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'mood', label: 'Mood & low feelings' },
  { id: 'focus', label: 'Focus & attention' },
  { id: 'more', label: 'More topics' },
];
